import json
import re
from pathlib import Path
from collections import defaultdict

from .skills import SKILL_ALIASES


DATA_PATH = Path(__file__).resolve().parents[1] / "data" / "skills.json"


def load_skills():
    with open(DATA_PATH) as f:
        return json.load(f)


def normalize_token(token: str) -> str:
    token = token.lower().strip()
    return SKILL_ALIASES.get(token, token)


def extract_skills(text: str):
    text = text.lower()
    skills_db = load_skills()

    found = defaultdict(set)

    for category, skills in skills_db.items():
        for skill in skills:
            pattern = r"\b" + re.escape(skill) + r"\b"
            if re.search(pattern, text):
                found[category].add(skill)

    return {k: sorted(v) for k, v in found.items()}

def compare_skills(resume_skills: dict, job_skills: dict):
    matched = {}
    missing = {}

    for category, job_set in job_skills.items():
        resume_set = set(resume_skills.get(category, []))

        matched[category] = sorted(resume_set & set(job_set))
        missing[category] = sorted(set(job_set) - resume_set)

    return matched, missing