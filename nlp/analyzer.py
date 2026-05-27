"""
Core NLP logic for QuoteBulls.

POS tagging  — spaCy Universal Dependencies coarse tags (token.pos_)
Semantic distance — 1 - cosine_similarity using spaCy GloVe word vectors
"""

import spacy

# Load once at module level — shared across all requests
nlp = spacy.load("en_core_web_md")


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
    Uses spaCy's built-in GloVe vectors from en_core_web_md.
    OOV words (no vector) return 1.0 unless they are the same string.
    """
    if a.lower() == b.lower():
        return 0.0

    tok_a = nlp(a.lower())[0]
    tok_b = nlp(b.lower())[0]

    if not tok_a.has_vector or not tok_b.has_vector:
        return 1.0

    similarity = tok_a.similarity(tok_b)
    # similarity is in [-1, 1]; clamp to [0, 1] then invert
    distance = 1.0 - max(0.0, min(1.0, float(similarity)))
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
        green  — same POS as target word in this position (or exact match)
        yellow — same POS exists elsewhere in the quote but wrong position
        grey   — that POS does not appear anywhere in the quote
    Distance = 0.0 only on exact word match.
    """
    guess_pos = tag_words(guess_words)
    target_pos_set = set(target_pos)

    tiles = []
    for i, (g_word, t_word, t_pos, g_pos) in enumerate(
        zip(guess_words, target_words, target_pos, guess_pos)
    ):
        dist = word_distance(g_word, t_word)

        # Exact match → always green, distance 0
        if g_word.lower() == t_word.lower():
            tiles.append({"color": "green", "distance": 0.0})
            continue

        if g_pos in target_pos_set:
            # Right POS, right position
            color = "green" if g_pos == t_pos else "yellow"
        else:
            # POS not present in the quote at all
            color = "grey"

        tiles.append({"color": color, "distance": dist})

    won = all(t["color"] == "green" and t["distance"] == 0.0 for t in tiles)
    return {"tiles": tiles, "won": won}
