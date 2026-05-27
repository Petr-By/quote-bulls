"""
One-time migration script: re-tag all quotes in the DB with real spaCy POS.
Run from the nlp/ directory:
    python tag_quotes.py
"""

import sys
import json
import sqlite3
from pathlib import Path

# Make sure we use the venv's spaCy
import spacy

PROJECT_ROOT = Path(__file__).parent.parent
DB_PATH = PROJECT_ROOT / "db" / "quotebulls.db"

if not DB_PATH.exists():
    print(f"DB not found at {DB_PATH}")
    print("Start the Next.js app once first so it seeds the DB, then re-run this script.")
    sys.exit(1)

print("Loading spaCy model…")
nlp = spacy.load("en_core_web_md")

con = sqlite3.connect(DB_PATH)
cur = con.cursor()

rows = cur.execute("SELECT id, words_json FROM quotes").fetchall()
print(f"Updating POS for {len(rows)} quotes…")

for (quote_id, words_json) in rows:
    words = json.loads(words_json)
    doc = nlp(" ".join(words))
    pos_tags = [token.pos_ for token in doc]
    cur.execute(
        "UPDATE quotes SET pos_json = ? WHERE id = ?",
        (json.dumps(pos_tags), quote_id)
    )
    print(f"  #{quote_id}: {list(zip(words, pos_tags))}")

con.commit()
con.close()
print("\nDone — all quotes re-tagged with real spaCy POS.")
