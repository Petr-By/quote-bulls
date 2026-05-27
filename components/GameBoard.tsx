'use client';

import { useState, useEffect, useCallback } from 'react';
import GuessRow from './GuessRow';
import type { TileFeedback } from '@/lib/game';
import { MAX_ATTEMPTS } from '@/lib/game';

interface SubmittedRow {
  words: string[];
  tiles: TileFeedback[];
}

interface RevealData {
  text: string;
  author: string;
}

interface Props {
  wordCount: number;
  quoteId: number;
  mode: 'daily' | 'free';
  posHints: string[];
}

export default function GameBoard({ wordCount, quoteId, mode, posHints }: Props) {
  const [rows, setRows] = useState<SubmittedRow[]>([]);
  const [currentGuess, setCurrentGuess] = useState<string[]>(
    Array(wordCount).fill('')
  );
  const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [reveal, setReveal] = useState<RevealData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const activeRow = rows.length;
  const isGameOver = status !== 'playing';

  const handleGuessChange = (index: number, value: string) => {
    setCurrentGuess(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleSubmit = useCallback(async () => {
    if (loading || isGameOver) return;

    const filledWords = currentGuess.map(w => w.trim());
    const empty = filledWords.filter(w => w === '').length;
    if (empty > 0) {
      setError(`Fill in all ${wordCount} words before submitting.`);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId, guessWords: filledWords, mode }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.');
        setLoading(false);
        return;
      }

      const newRow: SubmittedRow = { words: filledWords, tiles: data.tiles };
      const newRows = [...rows, newRow];
      setRows(newRows);
      setCurrentGuess(Array(wordCount).fill(''));

      if (data.won) {
        setStatus('won');
        setReveal(data.reveal);
      } else if (newRows.length >= MAX_ATTEMPTS) {
        setStatus('lost');
        // Fetch the reveal on loss
        const revealRes = await fetch('/api/guess', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quoteId, guessWords: filledWords, mode, forceReveal: true }),
        });
        // We'll just re-submit to get the reveal — for now show a static message
        setReveal(null); // Phase 2 will add a /api/reveal endpoint
      }
    } catch {
      setError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentGuess, isGameOver, loading, mode, quoteId, rows, wordCount]);

  // Legend
  const legend = [
    { color: 'bg-green-500', label: 'Correct POS, correct position' },
    { color: 'bg-yellow-400', label: 'Correct POS, wrong position' },
    { color: 'bg-zinc-500', label: 'This POS not in quote' },
  ];

  return (
    <div className="flex flex-col gap-4 w-full max-w-4xl mx-auto">

      {/* Legend */}
      <div className="flex flex-wrap gap-4 justify-center text-xs text-zinc-600 mb-2">
        {legend.map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-sm ${l.color}`} />
            <span>{l.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-zinc-500 font-semibold">0.00</span>
          <span>Semantic distance (lower = closer)</span>
        </div>
      </div>

      {/* Submitted rows */}
      {rows.map((row, i) => (
        <GuessRow
          key={i}
          wordCount={wordCount}
          isActive={false}
          feedback={row.tiles}
          submittedWords={row.words}
          currentGuess={[]}
          onGuessChange={() => {}}
          onSubmit={() => {}}
        />
      ))}

      {/* Active input row */}
      {!isGameOver && (
        <GuessRow
          key={`active-${activeRow}`}
          wordCount={wordCount}
          isActive={true}
          posHints={posHints}
          currentGuess={currentGuess}
          onGuessChange={handleGuessChange}
          onSubmit={handleSubmit}
        />
      )}

      {/* Empty future rows */}
      {!isGameOver && Array.from({ length: Math.max(0, MAX_ATTEMPTS - rows.length - 1) }).map((_, i) => (
        <GuessRow
          key={`future-${i}`}
          wordCount={wordCount}
          isActive={false}
          posHints={posHints}
          currentGuess={[]}
          onGuessChange={() => {}}
          onSubmit={() => {}}
        />
      ))}

      {/* Error */}
      {error && (
        <p className="text-center text-red-500 text-sm">{error}</p>
      )}

      {/* Attempt counter + Submit + Show Answer */}
      {!isGameOver && (
        <div className="flex flex-col items-center gap-3 mt-2">
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-500">
              Attempt {rows.length + 1} / {MAX_ATTEMPTS}
            </span>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-zinc-800 text-white rounded-lg font-semibold
                         hover:bg-zinc-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Checking…' : 'Submit'}
            </button>
          </div>

          {/* Show answer — confirm first */}
          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="text-xs text-zinc-400 underline hover:text-zinc-600 transition-colors"
            >
              Show answer
            </button>
          ) : (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-zinc-500">Give up and reveal?</span>
              <button
                onClick={async () => {
                  const res = await fetch(`/api/reveal?quoteId=${quoteId}&mode=${mode}`);
                  const data = await res.json();
                  setReveal(data);
                  setStatus('lost');
                }}
                className="px-3 py-1 bg-red-500 text-white rounded font-semibold hover:bg-red-600 transition-colors text-xs"
              >
                Yes, show it
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="text-zinc-400 hover:text-zinc-600 text-xs underline"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {/* Result banner */}
      {isGameOver && (
        <div className={`rounded-xl p-6 text-center mt-4 ${
          status === 'won' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <p className={`text-2xl font-bold mb-2 ${status === 'won' ? 'text-green-700' : 'text-red-700'}`}>
            {status === 'won' ? '🎉 You got it!' : '😔 Not this time'}
          </p>
          {reveal && (
            <>
              <p className="text-zinc-700 italic text-lg mb-1">"{reveal.text}"</p>
              <p className="text-zinc-500 text-sm">— {reveal.author}</p>
            </>
          )}
          {!reveal && status === 'lost' && (
            <p className="text-zinc-500 text-sm">Come back tomorrow for the next quote!</p>
          )}
          {status === 'won' && (
            <p className="text-zinc-500 text-sm mt-2">
              Solved in {rows.length} attempt{rows.length !== 1 ? 's' : ''}!
            </p>
          )}
        </div>
      )}
    </div>
  );
}
