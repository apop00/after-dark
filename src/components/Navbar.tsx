'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Volume2, VolumeX, Moon, BookOpen, ShieldAlert } from 'lucide-react';
import { sounds } from '@/lib/audio/sound';
import { triggerHaptic } from '@/lib/haptics/vibration';
import { getOrCreatePlayerSession } from '@/lib/session/player';

export function Navbar({ showRules = true }: { showRules?: boolean }) {
  const [isMuted, setIsMuted] = useState(false);
  const [nickname, setNickname] = useState('');
  const [avatarSeed, setAvatarSeed] = useState('shadow');

  useEffect(() => {
    const session = getOrCreatePlayerSession();
    setNickname(session.nickname);
    setAvatarSeed(session.avatarSeed);
    setIsMuted(sounds.getMuted());
  }, []);

  const toggleSound = () => {
    const next = !isMuted;
    sounds.setMuted(next);
    setIsMuted(next);
    triggerHaptic('light');
    if (!next) sounds.playClick();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#090714]/80 backdrop-blur-md px-4 py-3">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <Link
          href="/"
          onClick={() => triggerHaptic('light')}
          className="flex items-center gap-2 group"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-600 to-purple-600 flex items-center justify-center shadow-lg shadow-rose-950/40 group-hover:scale-105 transition-transform">
            <Moon className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-black tracking-wider text-base bg-gradient-to-r from-white via-slate-200 to-rose-400 bg-clip-text text-transparent">
              AFTER DARK
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {showRules && (
            <Link
              href="/rules"
              onClick={() => triggerHaptic('light')}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Regole & Etica"
            >
              <BookOpen className="w-4 h-4" />
            </Link>
          )}

          <button
            onClick={toggleSound}
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title={isMuted ? 'Attiva Suoni' : 'Silenzia'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {nickname && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-white/10 text-xs text-slate-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="max-w-[80px] truncate">{nickname}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
