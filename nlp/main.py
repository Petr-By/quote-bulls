"""
QuoteBulls NLP microservice.
Run: uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from analyzer import analyze_guess, tag_words

app = FastAPI(title="QuoteBulls NLP")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3333"],
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
)


class AnalyzeRequest(BaseModel):
    guess_words: list[str]
    target_words: list[str]
    target_pos: list[str]


class TagRequest(BaseModel):
    words: list[str]


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze")
def analyze(req: AnalyzeRequest):
    """Evaluate a guess and return tile colors + semantic distances."""
    return analyze_guess(req.guess_words, req.target_words, req.target_pos)


@app.post("/tag")
def tag(req: TagRequest):
    """Tag a list of words and return their spaCy POS tags."""
    return {"pos": tag_words(req.words)}
