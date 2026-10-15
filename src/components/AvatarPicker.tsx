'use client';

import React from 'react';
import { triggerHaptic } from '@/lib/haptics/vibration';

export const AVATAR_OPTIONS = [
  { seed: 'shadow', emoji: '🕶️', label: 'Shadow' },
  { seed: 'viper', emoji: '🐍', label: 'Viper' },
  { seed: 'ghost', emoji: '👻', label: 'Ghost' },
  { seed: 'neon', emoji: '⚡', label: 'Neon' },
  { seed: 'rebel', emoji: '💀', label: 'Rebel' },
  { seed: 'blaze', emoji: '🔥', label: 'Blaze' },
  { seed: 'fox', emoji: '🦊', label: 'Fox' },
  { seed: 'raven', emoji: '🦅', label: 'Raven' },
  { seed: 'wolf', emoji: '🐺', label: 'Wolf' },
  { seed: 'cobra', emoji: '🥷', label: 'Ninja' },
  { seed: 'panther', emoji: '🐆', label: 'Panther' },
  { seed: 'phoenix', emoji: '✨', label: 'Phoenix' },
];

export function getAvatarEmoji(seed: string): string {
  const match = AVATAR_OPTIONS.find((a) => a.seed === seed);
  return match ? match.emoji : '👤';
}

export function AvatarPicker({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (seed: string) => void;
}) {
  return (
    <div className="grid grid-cols-6 gap-2 p-2 bg-white/5 border border-white/10 rounded-2xl">
      {AVATAR_OPTIONS.map((item) => {
        const isSelected = selected === item.seed;
        return (
          <button
            key={item.seed}
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onSelect(item.seed);
            }}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
              isSelected
                ? 'bg-rose-500/20 border-2 border-rose-500 scale-105 shadow-lg shadow-rose-950/40'
                : 'hover:bg-white/10 border border-transparent opacity-70 hover:opacity-100'
            }`}
          >
            <span className="text-2xl">{item.emoji}</span>
          </button>
        );
      })}
    </div>
  );
}
