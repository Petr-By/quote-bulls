"""
Core NLP logic for QuoteBulls.

POS tagging       — spaCy Universal Dependencies coarse tags (token.pos_)
Semantic distance — cosine distance via sentence-transformers all-MiniLM-L6-v2
                    (much better semantic understanding than GloVe)
"""

import spacy
import numpy as np
from sentence_transformers import SentenceTransformer

# Load once at module level — shared across all requests
nlp   = spacy.load("en_core_web_md")
model = SentenceTransformer("all-MiniLM-L6-v2")


# ─── POS tagging ──────────────────────────────────────────────────────────────

def tag_words(words: list[str]) -> list[str]:
    """
    Return the spaCy coarse POS tag for each word.
    Processing the full sentence gives better context-aware tags than
    tagging each word in isolation.
    """
    doc = nlp(" ".join(words))
    return [token.pos_ for token in doc]


# ─── Semantic distance ────────────────────────────────────────────────────────

def word_distance(a: str, b: str) -> float:
    """
    Semantic distance between two words (0.00 = identical, ~1.00 = unrelated).
    Uses sentence-transformers (all-MiniLM-L6-v2) cosine distance.
    Much better than GloVe for fine-grained semantic similarity.
    """
    if a.lower() == b.lower():
        return 0.0

    embs = model.encode([a.lower(), b.lower()], normalize_embeddings=True)
    cosine_sim = float(np.dot(embs[0], embs[1]))
    distance = 1.0 - max(0.0, min(1.0, cosine_sim))
    return round(distance, 2)


# ─── Guess evaluation ─────────────────────────────────────────────────────────

def analyze_guess(
    guess_words: list[str],
    target_words: list[str],
    target_pos: list[str],
) -> dict:
    """
    Evaluate one guess row against the target quote.

    Returns:
        {
            "tiles": [{"color": "green"|"yellow"|"grey", "distance": float}, ...],
            "won": bool
        }

    Color rules:
        green  — same POS as target word in this position (or exact/near-identical match)
        yellow — same POS exists elsewhere in the quote but wrong position
        grey   — that POS does not appear anywhere in the quote
    Distance = 0.0 only on exact (or near-identical) word match.
    """
    guess_pos = tag_words(guess_words)
    target_pos_set = set(target_pos)

    # Batch-encode all word pairs at once for efficiency
    all_words = guess_words + target_words
    embeddings = model.encode([w.lower() for w in all_words], normalize_embeddings=True)
    guess_embs  = embeddings[:len(guess_words)]
    target_embs = embeddings[len(guess_words):]

    tiles = []
    for i, (g_word, t_word, t_pos, g_pos) in enumerate(
        zip(guess_words, target_words, target_pos, guess_pos)
    ):
        if g_word.lower() == t_word.lower():
            tiles.append({"color": "green", "distance": 0.0})
            continue

        cosine_sim = float(np.dot(guess_embs[i], target_embs[i]))
        dist = round(1.0 - max(0.0, min(1.0, cosine_sim)), 2)

        # Near-identical vectors (rounds to 0.00) → treat as correct
        if dist == 0.0:
            tiles.append({"color": "green", "distance": 0.0})
            continue

        if g_pos in target_pos_set:
            color = "green" if g_pos == t_pos else "yellow"
        else:
            color = "grey"

        tiles.append({"color": color, "distance": dist})

    won = all(t["color"] == "green" and t["distance"] == 0.0 for t in tiles)
    return {"tiles": tiles, "won": won}
