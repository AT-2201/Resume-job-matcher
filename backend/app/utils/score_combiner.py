def combine_scores(
    tfidf_score: float,
    bert_score: float,
    tfidf_weight: float = 0.4,
    bert_weight: float = 0.6
):
    final = tfidf_weight * tfidf_score + bert_weight * bert_score
    return round(final * 100, 2)