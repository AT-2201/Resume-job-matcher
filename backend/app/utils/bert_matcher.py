from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

# Load once (important for performance)
MODEL = SentenceTransformer("all-MiniLM-L6-v2")


def bert_similarity(resume_text: str, job_text: str):
    embeddings = MODEL.encode([resume_text, job_text])
    similarity = cosine_similarity(
        [embeddings[0]],
        [embeddings[1]]
    )[0][0]

    return float(similarity)