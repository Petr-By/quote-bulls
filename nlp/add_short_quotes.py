"""Add short test quotes to the DB with real spaCy POS tags."""
import json, sqlite3, sys
from pathlib import Path
import spacy

ROOT = Path(__file__).parent.parent
DB   = ROOT / "db" / "quotebulls.db"

nlp = spacy.load("en_core_web_md")

SHORT_QUOTES = [
    {"text": "I think therefore I am",         "author": "René Descartes"},
    {"text": "No man is an island",            "author": "John Donne"},
    {"text": "Actions speak louder than words","author": "Abraham Lincoln"},
    {"text": "Fortune favors the prepared mind","author": "Louis Pasteur"},
    {"text": "All you need is love",           "author": "The Beatles"},
]

con = sqlite3.connect(DB)
cur = con.cursor()
cur.execute("SELECT MAX(id) FROM quotes")
next_id = (cur.fetchone()[0] or 20) + 1

for q in SHORT_QUOTES:
    words = q["text"].split()
    pos   = [t.pos_ for t in nlp(q["text"])]
    cur.execute(
        "INSERT INTO quotes (id, text, author, words_json, pos_json) VALUES (?,?,?,?,?)",
        (next_id, q["text"], q["author"], json.dumps(words), json.dumps(pos))
    )
    # Only print ID so the user can't reverse-engineer the quote
    print(f"  Added id={next_id} ({len(words)} words)")
    next_id += 1

con.commit(); con.close()
print("Done.")
