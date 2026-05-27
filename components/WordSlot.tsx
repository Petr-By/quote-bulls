'use client';

import type { TileFeedback } from '@/lib/game';

interface Props {
  feedback?: TileFeedback;
  value?: string;
  isActive?: boolean;
  slotIndex: number;
  posHint?: string;
  onChange?: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

const COLOR_CLASSES: Record<string, string> = {
  green:  'bg-green-500 border-green-500 text-white',
  yellow: 'bg-yellow-400 border-yellow-400 text-white',
  grey:   'bg-zinc-500 border-zinc-500 text-white',
  empty:  'bg-white border-zinc-300 text-zinc-400',
};

// Short display labels for POS tags
const POS_LABEL: Record<string, string> = {
  NOUN:  'noun',
  VERB:  'verb',
  AUX:   'aux',
  ADJ:   'adj',
  ADV:   'adv',
  ADP:   'prep',
  DET:   'det',
  PRON:  'pron',
  PART:  'part',
  CCONJ: 'conj',
  SCONJ: 'conj',
  NUM:   'num',
  PROPN: 'noun',
  INTJ:  'intj',
  PUNCT: 'punct',
  X:     '?',
};

export default function WordSlot({
  feedback,
  value,
  isActive,
  posHint,
  onChange,
  onKeyDown,
  inputRef,
}: Props) {
  const colorClass = feedback ? COLOR_CLASSES[feedback.color] : COLOR_CLASSES.empty;
  const posLabel = posHint ? (POS_LABEL[posHint] ?? posHint.toLowerCase()) : null;

  if (isActive) {
    return (
      <div className="flex flex-col items-center gap-0.5">
        {posLabel && (
          <span className="text-[10px] font-mono font-semibold text-zinc-400 uppercase tracking-wider">
            {posLabel}
          </span>
        )}
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

  // Submitted tile — show the guessed word + color + distance
  if (feedback) {
    return (
      <div className="flex flex-col items-center gap-0.5">
        {posLabel && (
          <span className="text-[10px] font-mono font-semibold text-transparent uppercase tracking-wider select-none">
            {posLabel}
          </span>
        )}
        <div
          className={`w-24 h-10 flex items-center justify-center text-sm font-semibold
                      border-2 rounded uppercase ${colorClass}`}
        >
          {value ?? ''}
        </div>
        <span className="text-xs font-mono text-zinc-500">
          {feedback.distance != null ? feedback.distance.toFixed(2) : '0.00'}
        </span>
      </div>
    );
  }

  // Empty future row — show POS hint in the blank tile
  return (
    <div className="flex flex-col items-center gap-0.5">
      {posLabel && (
        <span className="text-[10px] font-mono font-semibold text-zinc-400 uppercase tracking-wider">
          {posLabel}
        </span>
      )}
      <div
        className={`w-24 h-10 flex items-center justify-center text-xs font-mono
                    border-2 rounded ${colorClass}`}
      >
        {posLabel ?? ''}
      </div>
      <span className="text-xs text-transparent select-none">0.00</span>
    </div>
  );
}
