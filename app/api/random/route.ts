import { NextResponse } from 'next/server';
import { getAllQuotes } from '@/lib/quotes';

export async function GET() {
  const quotes = getAllQuotes();
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  return NextResponse.json({
    id: quote.id,
    wordCount: quote.words.length,
  });
}
