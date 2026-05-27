import { getDb } from './db';

export interface Quote {
  id: number;
  text: string;
  author: string;
  words: string[];
  pos: string[];
}

export function getAllQuotes(): Quote[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM quotes').all() as Array<{
    id: number; text: string; author: string; words_json: string; pos_json: string;
  }>;
  return rows.map(r => ({
    id: r.id,
    text: r.text,
    author: r.author,
    words: JSON.parse(r.words_json),
    pos: JSON.parse(r.pos_json),
  }));
}

export function getQuoteById(id: number): Quote | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM quotes WHERE id = ?').get(id) as {
    id: number; text: string; author: string; words_json: string; pos_json: string;
  } | undefined;
  if (!row) return null;
  return {
    id: row.id,
    text: row.text,
    author: row.author,
    words: JSON.parse(row.words_json),
    pos: JSON.parse(row.pos_json),
  };
}

/**
 * Deterministic daily quote: pick by day-of-year so everyone gets the same
 * quote, and it changes every midnight.
 */
export function getDailyQuote(): Quote {
  const db = getDb();
  const total = (db.prepare('SELECT COUNT(*) as n FROM quotes').get() as { n: number }).n;

  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  const index = dayOfYear % total; // 0-based

  const row = db.prepare('SELECT * FROM quotes LIMIT 1 OFFSET ?').get(index) as {
    id: number; text: string; author: string; words_json: string; pos_json: string;
  };
  return {
    id: row.id,
    text: row.text,
    author: row.author,
    words: JSON.parse(row.words_json),
    pos: JSON.parse(row.pos_json),
  };
}
