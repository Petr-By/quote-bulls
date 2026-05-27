import { NextRequest, NextResponse } from 'next/server';
import { getDailyQuote, getQuoteById } from '@/lib/quotes';
import { evaluateGuess } from '@/lib/game';
import { mockPos } from '@/lib/db';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { quoteId, guessWords, mode } = body as {
    quoteId?: number;
    guessWords: string[];
    mode: 'daily' | 'free';
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

  // Phase 1: mock POS for the guessed words
  const guessPos = guessWords.map(mockPos);

  const result = evaluateGuess(guessWords, quote.words, quote.pos, guessPos);

  return NextResponse.json({
    tiles: result.tiles,
    won: result.won,
    // Reveal the quote only on win (or caller can request it on loss after max attempts)
    reveal: result.won ? { text: quote.text, author: quote.author } : null,
  });
}
