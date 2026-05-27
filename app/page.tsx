import { getDailyQuote } from '@/lib/quotes';
import GameBoard from '@/components/GameBoard';

export default function HomePage() {
  const quote = getDailyQuote();

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-black tracking-tight text-zinc-900">
            Quote<span className="text-green-500">Bulls</span>
          </h1>
          <p className="text-zinc-500 mt-1 text-sm">
            Guess the quote — one word at a time
          </p>
          <div className="mt-2 inline-block bg-zinc-200 text-zinc-600 text-xs px-3 py-1 rounded-full">
            Daily Challenge · {quote.words.length} words
          </div>
        </header>

        {/* Game */}
        <GameBoard
          wordCount={quote.words.length}
          quoteId={quote.id}
          mode="daily"
          posHints={quote.pos}
        />

        {/* Footer */}
        <footer className="text-center mt-12 text-xs text-zinc-400">
          <a href="/play" className="underline hover:text-zinc-600">Free play mode</a>
          {' · '}
          New quote every day at midnight
        </footer>

      </div>
    </main>
  );
}
