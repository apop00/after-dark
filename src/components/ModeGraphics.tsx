import React from 'react';
import { GameMode } from '@/types/game';

export function ModeGraphic({
  mode,
  className = 'w-16 h-16',
}: {
  mode: GameMode;
  className?: string;
}) {
  switch (mode) {
    case 'bar':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="barGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            <radialGradient id="barGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="50" cy="50" r="44" fill="url(#barGlow)" />
          <path d="M26 30h48l-24 28v22h14v6H36v-6h14V58L26 30z" stroke="url(#barGrad)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M33 38h34l-6 7H39l-6-7z" fill="#f59e0b" fillOpacity="0.4" />
          <circle cx="54" cy="36" r="3.5" fill="#10b981" />
          <line x1="56" y1="33" x2="66" y2="23" stroke="#e2e8f0" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="68" cy="21" r="2" fill="#f43f5e" />
        </svg>
      );

    case 'discoteca':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="discoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#7c3aed" />
            </linearGradient>
            <radialGradient id="discoGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="50" cy="50" r="44" fill="url(#discoGlow)" />
          <line x1="50" y1="6" x2="50" y2="22" stroke="#a855f7" strokeWidth="2.5" strokeDasharray="3 3" />
          <circle cx="50" cy="52" r="30" stroke="url(#discoGrad)" strokeWidth="3.5" fill="#1a103c" />
          {/* Facets grid */}
          <ellipse cx="50" cy="52" rx="30" ry="12" stroke="#c084fc" strokeWidth="1.5" strokeOpacity="0.6" />
          <ellipse cx="50" cy="52" rx="14" ry="30" stroke="#c084fc" strokeWidth="1.5" strokeOpacity="0.6" />
          <line x1="20" y1="52" x2="80" y2="52" stroke="#e9d5ff" strokeWidth="1.5" strokeOpacity="0.8" />
          <path d="M42 34l3 6 6 1-4.5 4.5 1 6-5.5-3-5.5 3 1-6L29 41l6-1z" fill="#f43f5e" fillOpacity="0.7" transform="scale(0.5) translate(40, 20)" />
          {/* Sparkles */}
          <circle cx="74" cy="30" r="2" fill="#ffffff" />
          <circle cx="28" cy="70" r="1.5" fill="#f43f5e" />
          <circle cx="78" cy="68" r="2" fill="#38bdf8" />
        </svg>
      );

    case 'house_party':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="houseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <radialGradient id="houseGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="50" cy="50" r="44" fill="url(#houseGlow)" />
          {/* House silhouette */}
          <path d="M22 45L50 20l28 25v34a4 4 0 01-4 4H26a4 4 0 01-4-4V45z" stroke="url(#houseGrad)" strokeWidth="3.5" fill="#0d1f18" strokeLinejoin="round" />
          {/* Glowing window with music notes */}
          <rect x="38" y="44" width="24" height="24" rx="4" fill="#fbbf24" fillOpacity="0.2" stroke="#fbbf24" strokeWidth="2" />
          <circle cx="45" cy="56" r="3" fill="#34d399" />
          <circle cx="55" cy="52" r="3" fill="#34d399" />
          <path d="M48 56V48h10v4" stroke="#34d399" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'outdoor':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="outGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
            <radialGradient id="outGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="50" cy="50" r="44" fill="url(#outGlow)" />
          {/* Night moon */}
          <path d="M42 22a16 16 0 1016 16 13 13 0 01-16-16z" fill="#38bdf8" fillOpacity="0.8" />
          {/* City skyline silhouettes */}
          <rect x="20" y="48" width="14" height="32" rx="2" fill="#0c1d2e" stroke="url(#outGrad)" strokeWidth="2" />
          <rect x="36" y="38" width="16" height="42" rx="2" fill="#081522" stroke="url(#outGrad)" strokeWidth="2" />
          <rect x="54" y="44" width="12" height="36" rx="2" fill="#0c1d2e" stroke="url(#outGrad)" strokeWidth="2" />
          <rect x="68" y="52" width="14" height="28" rx="2" fill="#081522" stroke="url(#outGrad)" strokeWidth="2" />
          {/* Windows */}
          <circle cx="44" cy="46" r="1.5" fill="#fef08a" />
          <circle cx="44" cy="54" r="1.5" fill="#fef08a" />
          <circle cx="60" cy="52" r="1.5" fill="#fef08a" />
        </svg>
      );

    case 'chaos':
      return (
        <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="chaosGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="50%" stopColor="#e11d48" />
              <stop offset="100%" stopColor="#9f1239" />
            </linearGradient>
            <radialGradient id="chaosGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="50" cy="50" r="44" fill="url(#chaosGlow)" />
          {/* Lightning bolt through neon circle */}
          <circle cx="50" cy="50" r="32" stroke="url(#chaosGrad)" strokeWidth="3" strokeDasharray="8 6" />
          <path d="M54 16L32 48h18l-8 36 28-36H52l6-32z" fill="url(#chaosGrad)" stroke="#ffffff" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      );

    default:
      return null;
  }
}
