'use client';

import { useRef } from 'react';
import WordSlot from './WordSlot';
import type { TileFeedback } from '@/lib/game';

interface Props {
  wordCount: number;
  isActive: boolean;
  feedback?: TileFeedback[];
  submittedWords?: string[];
  currentGuess: string[];
  onGuessChange: (index: number, value: string) => void;
  onSubmit: () => void;
}

export default function GuessRow({
  wordCount,
  isActive,
  feedback,
  submittedWords,
  currentGuess,
  onGuessChange,
  onSubmit,
}: Props) {
  const inputRefs = useRef<Array<React.RefObject<HTMLInputElement | null>>>(
    Array.from({ length: wordCount }, () => ({ current: null }))
  );

  const focusSlot = (i: number) => {
    if (i >= 0 && i < wordCount) inputRefs.current[i].current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, i: number) => {
    if (e.key === 'Enter') {
      onSubmit();
    } else if (e.key === 'Tab' || e.key === 'ArrowRight') {
      e.preventDefault();
      focusSlot(i + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focusSlot(i - 1);
    } else if (e.key === 'Backspace' && currentGuess[i] === '') {
      focusSlot(i - 1);
    }
  };

  const handleChange = (i: number, value: string) => {
    onGuessChange(i, value);
    // Auto-advance when a word is typed and user presses space
    if (value.endsWith(' ')) {
      onGuessChange(i, value.trim());
      focusSlot(i + 1);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {Array.from({ length: wordCount }).map((_, i) => (
        <WordSlot
          key={i}
          slotIndex={i}
          isActive={isActive}
          feedback={feedback?.[i]}
          value={isActive ? currentGuess[i] ?? '' : submittedWords?.[i]}
          inputRef={inputRefs.current[i]}
          onChange={v => handleChange(i, v)}
          onKeyDown={e => handleKeyDown(e, i)}
        />
      ))}
    </div>
  );
}
