export type TileColor = 'green' | 'yellow' | 'grey' | 'empty';

export interface TileFeedback {
  color: TileColor;
  distance: number | null; // null = not yet guessed
}

export const MAX_ATTEMPTS = 10;
