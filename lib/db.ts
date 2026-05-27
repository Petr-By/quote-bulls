import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'db', 'quotebulls.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  // Ensure db directory exists
  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  initSchema(_db);
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS quotes (
      id          INTEGER PRIMARY KEY,
      text        TEXT NOT NULL,
      author      TEXT NOT NULL,
      words_json  TEXT NOT NULL,   -- JSON array of the words
      pos_json    TEXT NOT NULL    -- JSON array of mock POS tags per word
    );
  `);

  // Seed if empty
  const count = (db.prepare('SELECT COUNT(*) as n FROM quotes').get() as { n: number }).n;
  if (count === 0) {
    seedQuotes(db);
  }
}

// Simple mock POS tagger for Phase 1
// Maps common words to POS tags; unknown words default to NOUN
const POS_MAP: Record<string, string> = {
  // Articles / determiners
  a: 'DET', an: 'DET', the: 'DET', this: 'DET', that: 'DET', these: 'DET', those: 'DET',
  // Prepositions
  in: 'PREP', of: 'PREP', to: 'PREP', for: 'PREP', on: 'PREP', at: 'PREP', by: 'PREP',
  from: 'PREP', with: 'PREP', about: 'PREP', into: 'PREP', through: 'PREP', without: 'PREP',
  // Conjunctions
  and: 'CONJ', or: 'CONJ', but: 'CONJ', nor: 'CONJ', yet: 'CONJ',
  // Pronouns
  i: 'PRON', you: 'PRON', he: 'PRON', she: 'PRON', it: 'PRON', we: 'PRON', they: 'PRON',
  me: 'PRON', him: 'PRON', her: 'PRON', us: 'PRON', them: 'PRON', who: 'PRON', what: 'PRON',
  // Auxiliary / common verbs
  is: 'VERB', are: 'VERB', was: 'VERB', were: 'VERB', be: 'VERB', been: 'VERB', being: 'VERB',
  have: 'VERB', has: 'VERB', had: 'VERB', do: 'VERB', does: 'VERB', did: 'VERB',
  go: 'VERB', goes: 'VERB', live: 'VERB', love: 'VERB', know: 'VERB', see: 'VERB',
  make: 'VERB', tell: 'VERB', keep: 'VERB', let: 'VERB', put: 'VERB', stop: 'VERB',
  change: 'VERB', count: 'VERB', sum: 'VERB', happens: 'VERB', happen: 'VERB',
  lies: 'VERB', accept: 'VERB', scares: 'VERB', wander: 'VERB', amplify: 'VERB',
  annoys: 'VERB', exist: 'VERB', forgive: 'VERB', deserve: 'VERB',
  // Adverbs
  not: 'ADV', never: 'ADV', always: 'ADV', only: 'ADV', just: 'ADV', also: 'ADV',
  still: 'ADV', even: 'ADV', already: 'ADV', merely: 'ADV', slowly: 'ADV',
  so: 'ADV', how: 'ADV', well: 'ADV', seldom: 'ADV', rarest: 'ADV',
  // Adjectives
  great: 'ADJ', good: 'ADJ', long: 'ADJ', every: 'ADJ', all: 'ADJ', most: 'ADJ',
  other: 'ADJ', busy: 'ADJ', right: 'ADJ', true: 'ADJ', better: 'ADJ', best: 'ADJ',
  bad: 'ADJ', new: 'ADJ', old: 'ADJ', little: 'ADJ', own: 'ADJ', three: 'ADJ',
  behaved: 'ADJ', lost: 'ADJ', hated: 'ADJ', loved: 'ADJ',
};

export function mockPos(word: string): string {
  return POS_MAP[word.toLowerCase()] ?? 'NOUN';
}

function seedQuotes(db: Database.Database) {
  const quotesPath = path.join(process.cwd(), 'data', 'quotes.json');
  const raw = fs.readFileSync(quotesPath, 'utf-8');
  const quotes: Array<{ id: number; text: string; author: string }> = JSON.parse(raw);

  const insert = db.prepare(
    'INSERT INTO quotes (id, text, author, words_json, pos_json) VALUES (?, ?, ?, ?, ?)'
  );

  for (const q of quotes) {
    const words = q.text.split(' ');
    const pos = words.map(mockPos);
    insert.run(q.id, q.text, q.author, JSON.stringify(words), JSON.stringify(pos));
  }
}
