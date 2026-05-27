# QuoteBulls — Project Plan

## Context
A Wordle-inspired daily quote guessing game. Instead of letters, the player guesses individual words in a quote. Feedback combines:
1. **Part-of-speech (POS) color** — green (right POS, right spot), yellow (right POS, wrong spot), grey (that POS not in quote)
2. **Semantic distance** — numeric score showing how close the guessed word is to the target word (0 = exact match)

Win condition: all green + all zeros. Both daily challenge and free play mode.

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend + routing | **Next.js 14** (App Router) | Full-stack in one repo, Vercel-ready with custom domain |
| Styling | **Tailwind CSS** | Fast, no CSS files to manage |
| NLP backend | **Python FastAPI** | spaCy is the best tool for POS + word vectors |
| NLP library | **spaCy** (`en_core_web_md`) | POS tagging + semantic similarity built-in, no API costs |
| Database | **SQLite** (via `better-sqlite3`) | Zero config, swap to Postgres later |
| Dev runtime | **Node 20 + Python 3.11** | Standard, no unusual deps |

---

## Game Mechanics (Detailed)

- Quote is displayed as blank slots (one per word), punctuation visible
- Player types a word for each slot and submits the full row
- Per word feedback:
  - 🟩 Green = same part of speech as target word, correct position
  - 🟨 Yellow = same part of speech as target word, wrong position
  - ⬜ Grey = that part of speech does not appear in the quote at all
  - Number below = semantic distance (0.00–1.00), lower = closer
- Number of attempts: **10** (quotes are harder than 5-letter words)
- On win/loss: reveal full quote + author

---

## Project Structure

```
quote_bulls/
├── app/                        # Next.js App Router
│   ├── page.tsx                # Home / daily challenge
│   ├── play/page.tsx           # Free play mode
│   ├── layout.tsx
│   └── api/
│       ├── daily/route.ts      # GET today's quote (masked)
│       ├── guess/route.ts      # POST guess → calls Python NLP
│       └── quotes/route.ts     # Admin: manage quotes
├── components/
│   ├── GameBoard.tsx           # The grid of rows
│   ├── WordSlot.tsx            # Single word tile with POS color + distance
│   ├── GuessRow.tsx            # Row of inputs
│   └── ResultShare.tsx         # Shareable emoji result
├── lib/
│   ├── db.ts                   # SQLite access (better-sqlite3)
│   ├── quotes.ts               # Quote helpers
│   └── game.ts                 # Game state logic
├── nlp/                        # Python FastAPI service
│   ├── main.py                 # FastAPI app
│   ├── analyzer.py             # spaCy POS + similarity logic
│   ├── requirements.txt
│   └── Dockerfile              # For deployment
├── data/
│   └── quotes.json             # Seed quotes
├── db/
│   └── quotebulls.db           # SQLite file (gitignored)
└── package.json
```

---

## Phases

### Phase 1 — Game Shell ✅ DONE (2026-05-27)
- [x] Init Next.js + Tailwind project
- [x] SQLite schema: `quotes` table (id, text, author, words_json, pos_json)
- [x] Seed with 20 quotes (manually POS-tagged or via script)
- [x] Daily quote selection (date-seeded, deterministic)
- [x] Game board UI: blank slots, input row, submit
- [x] Mock feedback logic (hardcoded POS, distance = random) to test UI
- [x] Win/loss detection + quote reveal

### Phase 2 — NLP Integration
- [ ] Python FastAPI service with spaCy `en_core_web_md`
- [ ] `POST /analyze` endpoint: takes `{guess: string[], target: string[]}` → returns POS colors + distances
- [ ] Next.js API `/api/guess` proxies to Python service
- [ ] Replace mock feedback with real NLP
- [ ] Script to pre-tag all quotes at seed time (store POS in DB)

### Phase 3 — Polish + Prod Readiness
- [ ] Share button (emoji grid like Wordle)
- [ ] Local storage for daily streak / game state
- [ ] Mobile-responsive layout
- [ ] Admin page to add/edit quotes (password protected, basic)
- [ ] Deploy: Next.js → Vercel, Python service → Railway/Render
- [ ] Custom domain hookup

---

## Key Technical Decisions

**POS tagging**: spaCy assigns tags like NOUN, VERB, ADJ, ADV, DET, PREP, etc. Green/yellow/grey is based on this coarse tag. We store the POS of every word in the target quote in the DB at seed time.

**Semantic distance**: `1 - spaCy_similarity(word1, word2)` using spaCy's built-in word vectors (GloVe-based in `en_core_web_md`). Returns 0.00 for identical words, ~1.00 for unrelated words. OOV (out-of-vocabulary) words default to 1.00.

**Quote masking**: Only blank count is sent to client, never the target words (anti-cheat). POS of target words is also withheld; only feedback per guess is sent.

---

## Verification Plan
1. Start Python NLP service: `uvicorn main:app --reload`
2. Run Next.js: `npm run dev`
3. Open `localhost:3000`, play a round with a known quote
4. Verify: correct word → 🟩 + 0.00, wrong word same POS → 🟨 + distance > 0, wrong POS → ⬜
5. Win screen shows full quote + author
6. Daily challenge returns same quote across page refreshes
