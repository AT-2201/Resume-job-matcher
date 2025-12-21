def compute_skill_coverage(matched_skills: dict, job_skills: dict) -> float:
    total_required = 0
    total_matched = 0

    for category, job_list in job_skills.items():
        total_required += len(job_list)
        total_matched += len(matched_skills.get(category, []))

    if total_required == 0:
        return 0.0

    return round((total_matched / total_required) * 100, 2)


def compute_rank_score(
    match_score: float,
    skill_coverage: float,
    match_weight: float = 0.6,
    skill_weight: float = 0.4
):
    score = match_weight * match_score + skill_weight * skill_coverage
    return round(score, 2)


def rank_candidates(results: list):
    """
    results: list of dicts with keys:
    - candidate_id
    - match_score
    - skill_coverage
    """
    return sorted(results, key=lambda x: x["rank_score"], reverse=True)

