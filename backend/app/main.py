from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.utils.parser import parse_file
from app.utils.text_cleaner import clean_text

from app.utils.skill_extractor import extract_skills, compare_skills

from app.utils.tfidf_matcher import tfidf_similarity
from app.utils.bert_matcher import bert_similarity
from app.utils.score_combiner import combine_scores

from app.utils.ranker import (
    compute_skill_coverage,
    compute_rank_score,
    rank_candidates
)
from app.utils.skill_extractor import extract_skills, compare_skills
from app.utils.tfidf_matcher import tfidf_similarity
from app.utils.bert_matcher import bert_similarity
from app.utils.score_combiner import combine_scores



app = FastAPI(title="Resume ↔ JD Matcher API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TextPayload(BaseModel):
    text: str


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/upload/resume")
async def upload_resume(file: UploadFile = File(...)):
    try:
        extracted_text = await parse_file(file)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {
        "filename": file.filename,
        "text_length": len(extracted_text),
        "extracted_text": extracted_text[:3000]  # limit response
    }


@app.post("/upload/job")
async def upload_job(payload: TextPayload):
    cleaned = clean_text(payload.text)
    return {
        "text_length": len(cleaned),
        "extracted_text": cleaned[:3000]
    }

@app.post("/skills/compare")
async def compare_resume_job(payload: dict):
    resume_text = payload.get("resume_text", "")
    job_text = payload.get("job_text", "")

    resume_skills = extract_skills(resume_text)
    job_skills = extract_skills(job_text)

    matched, missing = compare_skills(resume_skills, job_skills)

    return {
        "resume_skills": resume_skills,
        "job_skills": job_skills,
        "matched_skills": matched,
        "missing_skills": missing
    }

@app.post("/match/score")
async def match_score(payload: dict):
    resume_text = payload.get("resume_text", "")
    job_text = payload.get("job_text", "")

    tfidf_score, top_terms = tfidf_similarity(resume_text, job_text)
    bert_score = bert_similarity(resume_text, job_text)

    final_score = combine_scores(tfidf_score, bert_score)

    return {
        "tfidf_similarity": round(tfidf_score, 4),
        "bert_similarity": round(bert_score, 4),
        "final_match_score": final_score,
        "explanation_keywords": top_terms
    }


@app.post("/rank/candidates")
async def rank_candidates_api(payload: dict):
    job_text = payload.get("job_text", "")
    resumes = payload.get("resumes", [])

    job_skills = extract_skills(job_text)

    ranked = []

    for idx, resume in enumerate(resumes):
        resume_text = resume.get("resume_text", "")
        candidate_id = resume.get("candidate_id", f"candidate_{idx+1}")

        # Phase 3 – match score
        tfidf_score, _ = tfidf_similarity(resume_text, job_text)
        bert_score = bert_similarity(resume_text, job_text)
        match_score = combine_scores(tfidf_score, bert_score)

        # Phase 2 – skill coverage
        resume_skills = extract_skills(resume_text)
        matched, _ = compare_skills(resume_skills, job_skills)
        skill_coverage = compute_skill_coverage(matched, job_skills)

        # Phase 4 – rank score
        rank_score = compute_rank_score(match_score, skill_coverage)

        ranked.append({
            "candidate_id": candidate_id,
            "match_score": match_score,
            "skill_coverage": skill_coverage,
            "rank_score": rank_score,
            "matched_skills": matched
        })

    ranked = rank_candidates(ranked)

    return {
        "job_skill_requirements": job_skills,
        "ranked_candidates": ranked
    }
