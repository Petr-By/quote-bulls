import { NextResponse } from 'next/server';
import { getDailyQuote } from '@/lib/quotes';

export async function GET() {
  const quote = getDailyQuote();
  // Never send the actual words — only the word count and slot info
  return NextResponse.json({
    id: quote.id,
    wordCount: quote.words.length,
    posHints: quote.pos,   // POS tag per slot — words never sent
    author: null,          // revealed on win/loss
  });
}
