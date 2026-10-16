'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Volume2, VolumeX, Moon, BookOpen, ShieldAlert } from 'lucide-react';
import { sounds } from '@/lib/audio/sound';
import { triggerHaptic } from '@/lib/haptics/vibration';
import { getOrCreatePlayerSession } from '@/lib/session/player';

import { isSupabaseConfigured } from '@/lib/supabase/client';

export function Navbar({
  showRules = true,
  isHome = false,
}: {
  showRules?: boolean;
  isHome?: boolean;
}) {
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
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#070412]/85 backdrop-blur-md px-4 py-2.5">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <Link
          href="/"
          onClick={() => triggerHaptic('light')}
          className="flex items-center gap-2.5 group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 via-fuchsia-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-rose-950/50 group-hover:scale-105 transition-transform">
            <Moon className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-black tracking-wider text-base bg-gradient-to-r from-white via-slate-100 to-rose-400 bg-clip-text text-transparent">
              AFTER DARK
            </span>
            {isHome && (
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-400/80 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full hidden sm:inline-block">
                LIVE
              </span>
            )}
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {/* Subtle cloud indicator without clutter */}
          {isSupabaseConfigured && (
            <div
              className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold"
              title="Cloud Supabase Connesso e Sincronizzato"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] hidden xs:inline font-bold">Cloud</span>
            </div>
          )}

          {showRules && (
            <Link
              href="/rules"
              onClick={() => triggerHaptic('light')}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Regole & Etica"
            >
              <BookOpen className="w-4 h-4" />
            </Link>
          )}

          <button
            onClick={toggleSound}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title={isMuted ? 'Attiva Suoni' : 'Silenzia'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {!isHome && nickname && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-white/10 text-xs text-slate-300 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="max-w-[70px] truncate">{nickname}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
