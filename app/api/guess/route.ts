import { NextRequest, NextResponse } from 'next/server';
import { getDailyQuote, getQuoteById } from '@/lib/quotes';

const NLP_URL = process.env.NLP_SERVICE_URL ?? 'http://localhost:8000';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { quoteId, guessWords, mode, forceReveal } = body as {
    quoteId?: number;
    guessWords: string[];
    mode: 'daily' | 'free';
    forceReveal?: boolean;
  };

  const quote = mode === 'free' && quoteId
    ? getQuoteById(quoteId)
    : getDailyQuote();

  if (!quote) {
    return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
  }

  if (guessWords.length !== quote.words.length) {
    return NextResponse.json(
      { error: `Expected ${quote.words.length} words, got ${guessWords.length}` },
      { status: 400 }
    );
  }

  // Call the Python NLP service
  let nlpResult: { tiles: Array<{ color: string; distance: number }>; won: boolean };
  try {
    const nlpRes = await fetch(`${NLP_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guess_words: guessWords,
        target_words: quote.words,
        target_pos: quote.pos,
      }),
    });

    if (!nlpRes.ok) {
      const err = await nlpRes.text();
      return NextResponse.json({ error: `NLP service error: ${err}` }, { status: 502 });
    }

    nlpResult = await nlpRes.json();
  } catch {
    return NextResponse.json(
      { error: 'NLP service unavailable. Is the Python service running? (uvicorn main:app --port 8000)' },
      { status: 503 }
    );
  }

  const reveal = (nlpResult.won || forceReveal)
    ? { text: quote.text, author: quote.author }
    : null;

  return NextResponse.json({
    tiles: nlpResult.tiles,
    won: nlpResult.won,
    reveal,
  });
}
