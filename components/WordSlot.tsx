'use client';

import type { TileFeedback } from '@/lib/game';

interface Props {
  feedback?: TileFeedback;
  value?: string;         // current typed value (active row)
  isActive?: boolean;     // slot is in the current input row
  slotIndex: number;
  onChange?: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

const COLOR_CLASSES: Record<string, string> = {
  green:  'bg-green-500 border-green-500 text-white',
  yellow: 'bg-yellow-400 border-yellow-400 text-white',
  grey:   'bg-zinc-500 border-zinc-500 text-white',
  empty:  'bg-white border-zinc-300 text-zinc-800',
};

export default function WordSlot({
  feedback,
  value,
  isActive,
  onChange,
  onKeyDown,
  inputRef,
}: Props) {
  const colorClass = feedback ? COLOR_CLASSES[feedback.color] : COLOR_CLASSES.empty;

  if (isActive) {
    return (
      <div className="flex flex-col items-center gap-0.5">
        <input
          ref={inputRef}
          type="text"
          value={value ?? ''}
          onChange={e => onChange?.(e.target.value.replace(/\s/g, ''))}
          onKeyDown={onKeyDown}
          className="w-24 h-10 text-center text-sm font-semibold border-2 border-zinc-400 rounded
                     focus:outline-none focus:border-zinc-600 uppercase"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
        <span className="text-xs text-transparent select-none">0.00</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div
        className={`w-24 h-10 flex items-center justify-center text-sm font-semibold
                    border-2 rounded uppercase ${colorClass}`}
      >
        {feedback ? (value ?? '___') : '___'}
      </div>
      <span className={`text-xs font-mono ${feedback ? 'text-zinc-500' : 'text-transparent'}`}>
        {feedback?.distance != null ? feedback.distance.toFixed(2) : '0.00'}
      </span>
    </div>
  );
}
