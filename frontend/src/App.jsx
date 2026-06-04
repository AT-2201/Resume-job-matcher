import { useMemo, useState } from "react";
import axios from "axios";
import "./App.css";

const API_BASE = "http://127.0.0.1:8000";

function formatCandidateName(candidateId = "") {
  return candidateId.replace(/[-_]/g, " ").trim() || "Unnamed candidate";
}

function getScoreTone(score = 0) {
  if (score >= 80) return "high";
  if (score >= 60) return "mid";
  return "low";
}

function getScoreLabel(score = 0) {
  if (score >= 80) return "Strong fit";
  if (score >= 60) return "Partial fit";
  return "Needs review";
}

function getRankReasons(candidate = {}) {
  const match = candidate.match_score ?? 0;
  const coverage = candidate.skill_coverage ?? 0;

  return [
    match >= 75
      ? "High semantic similarity"
      : match >= 60
        ? "Reasonable semantic similarity"
        : "Lower semantic similarity",
    coverage >= 80
      ? "Covers most required skills"
      : coverage >= 50
        ? "Covers some required skills"
        : "Limited required skill coverage",
  ];
}

function StatCard({ label, value, detail }) {
  return (
    <div className="statCard">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

function ProgressBar({ value = 0, tone = "mid" }) {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0));

  return (
    <div className="progressTrack" aria-label={`${safeValue}%`}>
      <div
        className={`progressFill ${tone}`}
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}

export default function App() {
  const [jobText, setJobText] = useState("");
  const [resumeFiles, setResumeFiles] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [ranked, setRanked] = useState(null);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState([]);

  const selectedFileNames = useMemo(
    () => resumeFiles.map((file) => file.name),
    [resumeFiles],
  );

  const topCandidate = ranked?.ranked_candidates?.[0];
  const jobSkillCount = ranked?.job_skill_requirements
    ? Object.values(ranked.job_skill_requirements).flat().length
    : 0;

  const pushLog = (obj) => {
    setLog((prev) => [{ time: new Date().toLocaleTimeString(), ...obj }, ...prev]);
  };

  async function uploadSelectedResumes() {
    if (!resumeFiles.length) {
      pushLog({ type: "error", msg: "Select one or more resume files first." });
      return;
    }

    setBusy(true);
    setRanked(null);

    try {
      const uploaded = [];

      for (const file of resumeFiles) {
        const form = new FormData();
        form.append("file", file);

        const response = await axios.post(`${API_BASE}/upload/resume`, form, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        uploaded.push({
          candidate_id: file.name.replace(/\.[^/.]+$/, ""),
          resume_text: response.data.extracted_text || "",
        });
      }

      setCandidates(uploaded);
      pushLog({ type: "success", msg: `Extracted ${uploaded.length} resumes.` });
    } catch (error) {
      pushLog({
        type: "error",
        msg: "Resume upload failed.",
        data: error?.message || String(error),
      });
    } finally {
      setBusy(false);
    }
  }

  async function rankCandidates() {
    if (!jobText.trim()) {
      pushLog({ type: "error", msg: "Paste a job description first." });
      return;
    }

    if (!candidates.length) {
      pushLog({ type: "error", msg: "Upload resumes before ranking." });
      return;
    }

    setBusy(true);
    setRanked(null);

    try {
      const payload = { job_text: jobText, resumes: candidates };
      const response = await axios.post(`${API_BASE}/rank/candidates`, payload);

      setRanked(response.data);
      pushLog({ type: "success", msg: "Candidate ranking complete." });
    } catch (error) {
      pushLog({
        type: "error",
        msg: "Ranking failed.",
        data: error?.message || String(error),
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page">
      <section className="hero">
        <div>
          <p className="eyebrow">AI resume screening dashboard</p>
          <h1>Rank resumes against a job description in minutes.</h1>
          <p className="heroCopy">
            Upload candidate resumes, compare them to role requirements, and
            review ranked, explainable match results.
          </p>
        </div>

        <div className="heroPanel">
          <StatCard
            label="Candidates"
            value={candidates.length}
            detail={candidates.length ? "ready to rank" : "waiting for upload"}
          />
          <StatCard
            label="Job text"
            value={jobText.trim() ? `${jobText.trim().length}` : "0"}
            detail="characters entered"
          />
          <StatCard
            label="Top score"
            value={topCandidate ? topCandidate.rank_score : "—"}
            detail={topCandidate ? formatCandidateName(topCandidate.candidate_id) : "rank to calculate"}
          />
        </div>
      </section>

      <section className="workflow">
        <div className="card">
          <div className="cardHeader">
            <div>
              <span className="stepBadge">Step 1</span>
              <h2>Job description</h2>
            </div>
            <span className="subtle">{jobText.trim().length} chars</span>
          </div>

          <textarea
            value={jobText}
            onChange={(event) => setJobText(event.target.value)}
            placeholder="Paste the job description, required skills, responsibilities, and qualifications here…"
            rows={10}
          />
        </div>

        <div className="card">
          <div className="cardHeader">
            <div>
              <span className="stepBadge">Step 2</span>
              <h2>Candidate resumes</h2>
            </div>
            <span className="subtle">PDF, DOCX, TXT</span>
          </div>

          <label className="uploadBox">
            <input
              type="file"
              multiple
              accept=".pdf,.docx,.txt"
              onChange={(event) => {
                setResumeFiles(Array.from(event.target.files || []));
                setCandidates([]);
                setRanked(null);
              }}
            />
            <strong>Choose resume files</strong>
            <span>
              {selectedFileNames.length
                ? `${selectedFileNames.length} selected`
                : "Drop in multiple candidate files"}
            </span>
          </label>

          {selectedFileNames.length > 0 && (
            <div className="fileList">
              {selectedFileNames.map((name) => (
                <span key={name}>{name}</span>
              ))}
            </div>
          )}

          <div className="actionRow">
            <button
              className="secondaryButton"
              disabled={busy || !resumeFiles.length}
              onClick={uploadSelectedResumes}
            >
              Extract Text
            </button>
            <button
              className="primaryButton"
              disabled={busy || !jobText.trim() || !candidates.length}
              onClick={rankCandidates}
            >
              Rank Candidates
            </button>
          </div>

          {busy && <div className="spinner">Processing request…</div>}
        </div>
      </section>

      <section className="dashboard">
        <div className="resultsPanel">
          <div className="sectionTitle">
            <div>
              <p className="eyebrow">Results</p>
              <h2>Candidate ranking</h2>
            </div>
            {ranked && <span className="pill">{jobSkillCount} job skills found</span>}
          </div>

          {!ranked ? (
            <div className="emptyState">
              <div className="emptyIcon">📊</div>
              <h3>No ranking yet</h3>
              <p>
                Add a job description, extract resumes, then rank candidates to
                see match scores and explanations.
              </p>
            </div>
          ) : (
            <div className="candidateStack">
              {ranked.ranked_candidates.map((candidate, index) => {
                const tone = getScoreTone(candidate.rank_score);

                return (
                  <article
                    key={candidate.candidate_id}
                    className={`candidateCard ${index === 0 ? "topCandidate" : ""}`}
                  >
                    <div className="rankColumn">
                      <span>#{index + 1}</span>
                      <div className={`scoreCircle ${tone}`}>
                        {candidate.rank_score}
                      </div>
                    </div>

                    <div className="candidateContent">
                      <div className="candidateHeader">
                        <div>
                          <h3>{formatCandidateName(candidate.candidate_id)}</h3>
                          <span className={`fitBadge ${tone}`}>
                            {getScoreLabel(candidate.rank_score)}
                          </span>
                        </div>
                        {index === 0 && <span className="winnerBadge">Top match</span>}
                      </div>

                      <div className="scoreGrid">
                        <div>
                          <span>Semantic match</span>
                          <strong>{candidate.match_score}</strong>
                          <ProgressBar value={candidate.match_score} tone={tone} />
                        </div>
                        <div>
                          <span>Skill coverage</span>
                          <strong>{candidate.skill_coverage}%</strong>
                          <ProgressBar value={candidate.skill_coverage} tone={tone} />
                        </div>
                      </div>

                      <div className="reasonList">
                        {getRankReasons(candidate).map((reason) => (
                          <span key={reason}>{reason}</span>
                        ))}
                      </div>

                      {candidate.matched_skills &&
                        Object.values(candidate.matched_skills).flat().length > 0 && (
                          <div className="skillsPreview">
                            {Object.values(candidate.matched_skills)
                              .flat()
                              .slice(0, 8)
                              .map((skill) => (
                                <span key={skill}>{skill}</span>
                              ))}
                          </div>
                        )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <aside className="activityPanel">
          <div className="sectionTitle compact">
            <div>
              <p className="eyebrow">Activity</p>
              <h2>Session log</h2>
            </div>
          </div>

          {candidates.length > 0 && (
            <div className="loadedList">
              <strong>Loaded candidates</strong>
              {candidates.map((candidate) => (
                <span key={candidate.candidate_id}>
                  {formatCandidateName(candidate.candidate_id)}
                  <small>{candidate.resume_text.length} chars</small>
                </span>
              ))}
            </div>
          )}

          {log.length === 0 ? (
            <p className="muted">No actions yet.</p>
          ) : (
            <div className="logList">
              {log.map((item, index) => (
                <div key={`${item.time}-${index}`} className={`logItem ${item.type}`}>
                  <span>{item.time}</span>
                  <strong>{item.msg}</strong>
                  {item.data && <small>{item.data}</small>}
                </div>
              ))}
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}
