AI-Driven Resume–Job Matching System

This project is an AI-based web application that automatically screens and ranks resumes against a job description using NLP techniques.

The system evaluates candidates based on semantic similarity and skill coverage, then presents ranked results in a recruiter-friendly dashboard with clear explanations for each ranking.

Features

Upload and parse resumes (PDF / DOCX / TXT)

Extract required skills from job descriptions

Rank multiple candidates using AI-based scoring

Explainable results showing why candidates are ranked

Privacy-safe design (no data stored, no API keys)

Tech Used

Backend: Python, FastAPI, NLP (TF-IDF)

Frontend: React, CSS

AI: Text preprocessing, similarity scoring, skill matching

▶ Run Locally

Backend

cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload


Frontend

cd frontend
npm install
npm run dev

💡 Purpose

Built as a personal project to explore AI-driven decision support systems and full-stack development with a focus on explainability and recruiter usability.
