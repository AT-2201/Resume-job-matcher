import { useMemo, useState } from "react";
import axios from "axios";
import "./App.css";

export default function App() {
  const API_BASE = useMemo(() => "http://127.0.0.1:8000", []);

  const [jobText, setJobText] = useState("");
  const [resumeFiles, setResumeFiles] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [ranked, setRanked] = useState(null);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState([]);

  const pushLog = (obj) => setLog((prev) => [obj, ...prev]);

  /* -------------------- Upload resumes -------------------- */
  async function uploadSelectedResumes() {
    if (!resumeFiles.length) {
      pushLog({ type: "error", msg: "Select one or more resume files first." });
      return;
    }

    setBusy(true);
    try {
      const uploaded = [];
      for (const file of resumeFiles) {
        const form = new FormData();
        form.append("file", file);

        const res = await axios.post(`${API_BASE}/upload/resume`, form, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        uploaded.push({
          candidate_id: file.name.replace(/\.[^/.]+$/, ""),
          resume_text: res.data.extracted_text || "",
        });
      }

      setCandidates(uploaded);
      pushLog({ type: "success", msg: `Uploaded ${uploaded.length} resumes.` });
    } catch (e) {
      pushLog({ type: "error", msg: "Resume upload failed.", data: String(e) });
    } finally {
      setBusy(false);
    }
  }

  /* -------------------- Rank candidates -------------------- */
  async function rankCandidates() {
    if (!jobText.trim()) {
      pushLog({ type: "error", msg: "Paste a job description first." });
      return;
    }
    if (!candidates.length) {
      pushLog({ type: "error", msg: "Upload resumes first." });
      return;
    }

    setBusy(true);
    setRanked(null);
    try {
      const payload = { job_text: jobText, resumes: candidates };
      const res = await axios.post(`${API_BASE}/rank/candidates`, payload);
      setRanked(res.data);
      pushLog({ type: "success", msg: "Ranking complete." });
    } catch (e) {
      pushLog({ type: "error", msg: "Ranking failed.", data: String(e) });
    } finally {
      setBusy(false);
    }
  }

  /* -------------------- UI helpers -------------------- */
  function scoreLevel(score = 0) {
    if (score >= 80) return "high";
    if (score >= 60) return "mid";
    return "low";
  }

  function scoreLabel(score = 0) {
    if (score >= 80) return "Strong fit";
    if (score >= 60) return "Partial fit";
    return "Low overall match";
  }

  function whyThisRank(candidate = {}) {
    const match = candidate.match_score ?? 0;
    const coverage = candidate.skill_coverage ?? 0;

    const reasons = [];
    if (match >= 75) reasons.push("✔ High semantic similarity");
    else if (match >= 60) reasons.push("✔ Reasonable semantic similarity");
    else reasons.push("✖ Low semantic similarity");

    if (coverage >= 80) reasons.push("✔ Covers most required skills");
    else if (coverage >= 50) reasons.push("✔ Covers some required skills");
    else reasons.push("✖ Limited skill coverage");

    return reasons.join("\n");
  }

  /* -------------------- Render -------------------- */
  return (
    <div className="page">
      <header className="header">
        <h1>Resume ↔ Job Matcher</h1>
        <p className="muted">AI-powered resume screening & ranking</p>
      </header>

      <div className={ranked ? "mainLayout" : "grid"}>

        {/* LEFT COLUMN — Steps 1 & 2 */}
        <div>
          {/* Step 1: Job Description */}
          <section className="card">
            <h2>1️⃣ Job Description</h2>
            <textarea
              value={jobText}
              onChange={(e) => setJobText(e.target.value)}
              placeholder="Paste the job description here…"
              rows={8}
            />
          </section>

          {/* Step 2: Upload Resumes */}
          <section className="card">
            <h2>2️⃣ Upload Resumes</h2>

            <input
              type="file"
              multiple
              accept=".pdf,.docx,.txt"
              onChange={(e) => setResumeFiles(Array.from(e.target.files || []))}
            />

            <button disabled={busy} onClick={uploadSelectedResumes}>
              {busy ? "Working…" : "Upload & Extract Text"}
            </button>

            <div style={{ marginTop: 10 }}>
              <div className="muted">Loaded candidates:</div>
              {candidates.length === 0 ? (
                <div className="muted">None yet</div>
              ) : (
                <ul>
                  {candidates.map((c) => (
                    <li key={c.candidate_id}>
                      <b>{c.candidate_id}</b> — {c.resume_text.length} chars
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button
              disabled={busy}
              onClick={rankCandidates}
              style={{ marginTop: 10 }}
            >
              {busy ? "Ranking…" : "Rank Candidates"}
            </button>
          </section>
        </div>

        {/* RIGHT COLUMN — Appears AFTER ranking */}
        {ranked && (
          <div className="sidePanel">

            {/* Ranked Candidates */}
            <section className="card log">
              <h2>📊 Ranked Candidates</h2>

              <div className="tableWrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Candidate</th>
                      <th>Score</th>
                      <th>Match</th>
                      <th>Coverage</th>
                      <th>Why?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranked.ranked_candidates.map((c, i) => (
                      <tr
                        key={c.candidate_id}
                        className={i === 0 ? "topCandidate" : ""}
                      >
                        <td>{i + 1}</td>
                        <td><b>{c.candidate_id}</b></td>
                        <td>
                          <div className={`scoreCircle ${scoreLevel(c.rank_score)}`}>
                            {c.rank_score}
                          </div>
                          <div className="badgeLabel">
                            {scoreLabel(c.rank_score)}
                          </div>
                        </td>
                        <td>{c.match_score}</td>
                        <td>{c.skill_coverage}%</td>
                        <td>
                          <pre className="whyBox">{whyThisRank(c)}</pre>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Logs */}
            <section className="card log">
              <h2>🧾 Logs</h2>
              {log.length === 0 ? (
                <p className="muted">No actions yet.</p>
              ) : (
                log.map((item, idx) => (
                  <div key={idx} className={`logItem ${item.type}`}>
                    <div className="logMsg">{item.msg}</div>
                  </div>
                ))
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
