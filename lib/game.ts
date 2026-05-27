export type TileColor = 'green' | 'yellow' | 'grey' | 'empty';

export interface TileFeedback {
  color: TileColor;
  distance: number | null; // null = not yet guessed
}

export interface GuessResult {
  tiles: TileFeedback[];
  won: boolean;
}

/**
 * Evaluate a guess row against the target quote.
 *
 * Phase 1: Uses mock POS tags stored in DB.
 * Phase 2: Will be replaced by real spaCy analysis.
 *
 * @param guessWords  - words the player typed (same length as target)
 * @param targetWords - the actual quote words
 * @param targetPos   - POS tags for each target word
 * @param guessPos    - POS tags for each guessed word (mock in phase 1)
 */
export function evaluateGuess(
  guessWords: string[],
  targetWords: string[],
  targetPos: string[],
  guessPos: string[]
): GuessResult {
  const tiles: TileFeedback[] = guessWords.map((gWord, i) => {
    const gLower = gWord.toLowerCase().trim();
    const tLower = targetWords[i].toLowerCase().trim();

    // Exact match → green + distance 0
    if (gLower === tLower) {
      return { color: 'green', distance: 0.0 };
    }

    const gPOS = guessPos[i];
    const targetPOSSet = new Set(targetPos);

    // POS exists in the quote somewhere
    if (targetPOSSet.has(gPOS)) {
      // Right POS, right position
      if (gPOS === targetPos[i]) {
        return { color: 'green', distance: mockDistance(gLower, tLower) };
      }
      // Right POS, wrong position
      return { color: 'yellow', distance: mockDistance(gLower, tLower) };
    }

    // POS not in quote at all
    return { color: 'grey', distance: mockDistance(gLower, tLower) };
  });

  const won = tiles.every(t => t.color === 'green' && t.distance === 0);
  return { tiles, won };
}

/**
 * Mock semantic distance for Phase 1.
 * Returns 0 for exact match, otherwise a stable pseudo-random value based on
 * the two words so it doesn't flicker between renders.
 */
function mockDistance(a: string, b: string): number {
  if (a === b) return 0.0;
  // Simple deterministic hash → 0.30–0.99 range
  let h = 0;
  for (let i = 0; i < (a + b).length; i++) {
    h = ((h << 5) - h + (a + b).charCodeAt(i)) | 0;
  }
  return Math.round((0.30 + (Math.abs(h) % 1000) / 1000 * 0.69) * 100) / 100;
}

export const MAX_ATTEMPTS = 10;
