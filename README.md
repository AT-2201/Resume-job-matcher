# AI-Driven Resume–Job Matching System

A full-stack web application that helps screen and rank candidate resumes against a job description using NLP-based similarity scoring, skill extraction, and explainable ranking signals.

The app is designed for recruiter-style workflows: paste a job description, upload one or more resumes, and review ranked candidates with match scores, skill coverage, and short explanations for each ranking.

## Features

- **Resume parsing** for PDF, DOCX, and TXT files.
- **Job description analysis** with text cleaning and required skill extraction.
- **Candidate ranking** using semantic similarity and skill coverage.
- **Explainable results** showing why each candidate scored well or poorly.
- **Recruiter-friendly dashboard** with ranking cards, progress indicators, session logs, and top-candidate highlighting.
- **Privacy-conscious flow** where uploaded content is processed in memory and not intentionally stored by the app.

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React, Vite, Axios, CSS |
| Backend | Python, FastAPI, Pydantic |
| NLP / AI | TF-IDF, Sentence Transformers, cosine similarity |
| Parsing | PyMuPDF, python-docx |
| Matching | Skill extraction, semantic similarity, weighted score ranking |

## How It Works

1. Paste a job description into the frontend.
2. Upload one or more candidate resumes.
3. The backend extracts text from each resume.
4. The system extracts known skills from both the resume and job description.
5. TF-IDF and sentence-transformer similarity scores are combined into a match score.
6. Skill coverage is calculated against the job requirements.
7. Candidates are ranked using a weighted final score.
8. The frontend displays ranked results with explanations and matched skills.

## Project Structure

```text
Resume-job-matcher/
├── backend/
│   ├── app/
│   │   ├── data/
│   │   │   └── skills.json
│   │   ├── utils/
│   │   │   ├── bert_matcher.py
│   │   │   ├── parser.py
│   │   │   ├── ranker.py
│   │   │   ├── score_combiner.py
│   │   │   ├── skill_extractor.py
│   │   │   ├── skills.py
│   │   │   ├── text_cleaner.py
│   │   │   └── tfidf_matcher.py
│   │   └── main.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Run Locally

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm

### 1. Start the Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API runs at:

```text
http://127.0.0.1:8000
```

### 2. Start the Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at:

```text
http://127.0.0.1:5173
```

## API Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Check API status |
| `POST` | `/upload/resume` | Upload and parse a resume file |
| `POST` | `/upload/job` | Clean and prepare job description text |
| `POST` | `/skills/compare` | Compare extracted resume and job skills |
| `POST` | `/match/score` | Calculate similarity and final match score |
| `POST` | `/rank/candidates` | Rank multiple candidates for one job description |

## Ranking Formula

The final ranking score combines:

- **Match score**: weighted TF-IDF and sentence-transformer semantic similarity.
- **Skill coverage**: percentage of job-required skills found in the candidate resume.

Current rank weighting:

```text
rank_score = (0.6 × match_score) + (0.4 × skill_coverage)
```

## Example Ranking Request

```json
{
  "job_text": "We need a Python developer with React, FastAPI, SQL, and machine learning experience.",
  "resumes": [
    {
      "candidate_id": "candidate_1",
      "resume_text": "Python developer with FastAPI, React, SQL, and scikit-learn experience."
    },
    {
      "candidate_id": "candidate_2",
      "resume_text": "Frontend developer with React and JavaScript experience."
    }
  ]
}
```

Send it to:

```text
POST http://127.0.0.1:8000/rank/candidates
```

## Notes and Limitations

- The skill extractor currently uses a curated skill list in `backend/app/data/skills.json`.
- Ranking quality depends on resume text extraction quality and skill list coverage.
- The sentence-transformer model may download on first backend startup.
- The app is intended as a decision-support tool, not an automated hiring decision system.

## Purpose

This project was built to explore practical full-stack AI application development, combining resume parsing, NLP-based matching, explainable scoring, and a modern recruiter-facing interface.
