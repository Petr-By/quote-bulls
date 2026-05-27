import { NextRequest, NextResponse } from 'next/server';
import { getDailyQuote, getQuoteById } from '@/lib/quotes';

export async function GET(req: NextRequest) {
  const quoteId = req.nextUrl.searchParams.get('quoteId');
  const mode    = req.nextUrl.searchParams.get('mode') as 'daily' | 'free' | null;

  const quote = mode === 'free' && quoteId
    ? getQuoteById(Number(quoteId))
    : getDailyQuote();

  if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ text: quote.text, author: quote.author });
}
