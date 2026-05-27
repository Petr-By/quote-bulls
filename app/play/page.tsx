'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import GameBoard from '@/components/GameBoard';
import { Suspense } from 'react';

interface QuoteMeta {
  id: number;
  wordCount: number;
}

function PlayGame() {
  const searchParams = useSearchParams();
  const pinId = searchParams.get('id'); // optional pinned quote ID

  const [quote, setQuote] = useState<QuoteMeta | null>(null);
  const [gameKey, setGameKey] = useState(0);

  const fetchQuote = async (id?: string | null) => {
    const url = id ? `/api/random?id=${id}` : '/api/random';
    const res = await fetch(url);
    const data = await res.json();
    setQuote(data);
    setGameKey(k => k + 1);
  };

  useEffect(() => {
    fetchQuote(pinId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinId]);

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8">
      <div className="max-w-4xl mx-auto">

        <header className="text-center mb-8">
          <h1 className="text-4xl font-black tracking-tight text-zinc-900">
            Quote<span className="text-green-500">Bulls</span>
          </h1>
          <p className="text-zinc-500 mt-1 text-sm">Free Play Mode</p>
          <a href="/" className="mt-2 inline-block text-xs text-zinc-400 underline hover:text-zinc-600">
            ← Back to daily challenge
          </a>
        </header>

        {quote ? (
          <>
            <div className="text-center mb-6">
              <span className="bg-zinc-200 text-zinc-600 text-xs px-3 py-1 rounded-full">
                Free Play · {quote.wordCount} words
              </span>
            </div>
            <GameBoard
              key={gameKey}
              wordCount={quote.wordCount}
              quoteId={quote.id}
              mode="free"
            />
            {!pinId && (
              <div className="text-center mt-8">
                <button
                  onClick={() => fetchQuote(null)}
                  className="px-5 py-2 border border-zinc-300 rounded-lg text-sm text-zinc-600
                             hover:bg-zinc-100 transition-colors"
                >
                  New quote →
                </button>
              </div>
            )}
          </>
        ) : (
          <p className="text-center text-zinc-400">Loading…</p>
        )}

      </div>
    </main>
  );
}

export default function FreePlayPage() {
  return (
    <Suspense fallback={<p className="text-center text-zinc-400 mt-20">Loading…</p>}>
      <PlayGame />
    </Suspense>
  );
}
