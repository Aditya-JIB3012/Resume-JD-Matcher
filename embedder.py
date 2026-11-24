"""
embedder.py
Wraps text embedding so the rest of the app doesn't care whether we're
using a real sentence-transformer model or a TF-IDF fallback.

Why this matters for the README/interview story:
- sentence-transformers gives true *semantic* similarity (understands that
  "led a team of 5 engineers" and "managed a small engineering team" are
  close in meaning, even with almost no shared words).
- TF-IDF is a lexical fallback (keyword overlap dressed up with weighting) -
  it's fast and dependency-light but misses paraphrasing.
This module tries sentence-transformers first and transparently falls back
to TF-IDF if the model can't be loaded (e.g. no internet access to download
model weights), so the app never just crashes.
"""

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity as sk_cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer


class Embedder:
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.mode = "sentence-transformer"
        self.model = None
        try:
            from sentence_transformers import SentenceTransformer
            self.model = SentenceTransformer(model_name)
        except Exception as e:
            print(f"[embedder] Falling back to TF-IDF ({e})")
            self.mode = "tfidf"

    def embed(self, texts: list[str]) -> np.ndarray:
        """Embed a list of strings. Returns an (n, d) numpy array."""
        if not texts:
            return np.zeros((0, 1))

        if self.mode == "sentence-transformer":
            return self.model.encode(texts, show_progress_bar=False)

        # TF-IDF fallback: fit on this batch of texts (self-contained,
        # good enough for one resume-vs-JD comparison at a time)
        vectorizer = TfidfVectorizer(stop_words="english")
        matrix = vectorizer.fit_transform(texts)
        return matrix.toarray()

    def similarity(self, text_a: str, text_b: str) -> float:
        """Cosine similarity between two pieces of text, in [0, 1]."""
        vecs = self.embed([text_a, text_b])
        if vecs.shape[0] < 2:
            return 0.0
        sim = sk_cosine_similarity([vecs[0]], [vecs[1]])[0][0]
        return float(max(0.0, min(1.0, sim)))

    def similarity_matrix(self, list_a: list[str], list_b: list[str]) -> np.ndarray:
        """
        Pairwise cosine similarity between every item in list_a and every
        item in list_b. Used for bullet-vs-requirement matching.
        Returns shape (len(list_a), len(list_b)).
        """
        if not list_a or not list_b:
            return np.zeros((len(list_a), len(list_b)))

        if self.mode == "sentence-transformer":
            vecs_a = self.embed(list_a)
            vecs_b = self.embed(list_b)
        else:
            # Fit one shared TF-IDF vocabulary across both lists so the
            # vectors are comparable
            vectorizer = TfidfVectorizer(stop_words="english")
            combined = vectorizer.fit_transform(list_a + list_b).toarray()
            vecs_a = combined[: len(list_a)]
            vecs_b = combined[len(list_a):]

        return sk_cosine_similarity(vecs_a, vecs_b)
