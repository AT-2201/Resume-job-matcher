from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np


def tfidf_similarity(resume_text: str, job_text: str, top_k: int = 10):
    vectorizer = TfidfVectorizer(
        stop_words="english",
        max_features=5000,
        ngram_range=(1, 2)
    )

    tfidf_matrix = vectorizer.fit_transform([resume_text, job_text])
    similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]

    feature_names = np.array(vectorizer.get_feature_names_out())
    resume_vec = tfidf_matrix[0].toarray().flatten()
    job_vec = tfidf_matrix[1].toarray().flatten()

    # terms contributing to similarity
    contribution = resume_vec * job_vec
    top_indices = contribution.argsort()[-top_k:][::-1]

    top_terms = feature_names[top_indices]
    top_terms = [t for t in top_terms if contribution[feature_names.tolist().index(t)] > 0]

    return float(similarity), top_terms