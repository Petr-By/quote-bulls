import { NextRequest, NextResponse } from 'next/server';
import { getAllQuotes, getQuoteById } from '@/lib/quotes';

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');

  if (id) {
    const quote = getQuoteById(Number(id));
    if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ id: quote.id, wordCount: quote.words.length });
  }

  const quotes = getAllQuotes();
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  return NextResponse.json({ id: quote.id, wordCount: quote.words.length });
}
