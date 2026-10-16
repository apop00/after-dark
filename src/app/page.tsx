'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Users,
  PlusCircle,
  LogIn,
  BookOpen,
  Edit2,
  Check,
  Flame,
  Shield,
  Zap,
  Camera,
  X,
  Dices,
  User,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { AvatarPicker, getAvatarEmoji } from '@/components/AvatarPicker';
import { SupabaseNotice } from '@/components/SupabaseNotice';
import { ModeGraphic } from '@/components/ModeGraphics';
import { QrScannerModal } from '@/components/QrScannerModal';
import { GameMode, PlayerGender } from '@/types/game';
import {
  getOrCreatePlayerSession,
  updatePlayerNickname,
  updatePlayerAvatar,
  updatePlayerGender,
  getGenderEmoji,
  getGenderLabel,
} from '@/lib/session/player';
import { triggerHaptic } from '@/lib/haptics/vibration';
import { sounds } from '@/lib/audio/sound';

const RANDOM_NICKNAMES = [
  'Viper',
  'Ghost',
  'Regina del Caos',
  'Il Barone',
  'L\'Infiltrato',
  'Cobra',
  'Night Owl',
  'Mister X',
  'Maestro del Bluff',
  'Ombra',
  'Vendetta',
  'Fenice',
  'Sirena',
  'Il Boss',
  'Agente 00',
  'Calamity',
  'Profeta',
  'Banshee',
  'Lupo Solitario',
];

export default function HomePage() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [avatarSeed, setAvatarSeed] = useState('shadow');
  const [gender, setGender] = useState<PlayerGender>('neutro');
  const [editNickname, setEditNickname] = useState('');
  const [editAvatarSeed, setEditAvatarSeed] = useState('shadow');
  const [editGender, setEditGender] = useState<PlayerGender>('neutro');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useEffect(() => {
    const session = getOrCreatePlayerSession();
    setNickname(session.nickname);
    setAvatarSeed(session.avatarSeed);
    setGender(session.gender || 'neutro');
    setEditNickname(session.nickname);
    setEditAvatarSeed(session.avatarSeed);
    setEditGender(session.gender || 'neutro');
  }, []);

  const handleOpenEdit = () => {
    triggerHaptic('light');
    setEditNickname(nickname);
    setEditAvatarSeed(avatarSeed);
    setEditGender(gender);
    setIsEditingProfile(true);
  };

  const handleRandomNickname = () => {
    triggerHaptic('light');
    sounds.playClick();
    const random = RANDOM_NICKNAMES[Math.floor(Math.random() * RANDOM_NICKNAMES.length)];
    setEditNickname(random);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editNickname.trim()) return;
    triggerHaptic('success');
    sounds.playSuccess();
    const cleanName = editNickname.trim();
    updatePlayerNickname(cleanName);
    updatePlayerAvatar(editAvatarSeed);
    updatePlayerGender(editGender);
    setNickname(cleanName);
    setAvatarSeed(editAvatarSeed);
    setGender(editGender);
    setIsEditingProfile(false);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#06030c] text-slate-100 selection:bg-rose-500 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-5 flex flex-col justify-between space-y-5">
        
        {/* HERO SECTION WITH GLOWING LOGO */}
        <div className="text-center space-y-3 pt-1">
          {/* Neon Moon Emblem */}
          <div className="relative inline-flex items-center justify-center mb-1">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-rose-600 via-purple-600 to-indigo-500 flex items-center justify-center shadow-2xl shadow-rose-600/40 border-2 border-white/20 transform hover:rotate-3 transition-transform">
              <span className="text-4xl filter drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]">🌙</span>
            </div>
            <div className="absolute -inset-2 bg-gradient-to-r from-rose-600 to-purple-600 rounded-3xl blur-xl opacity-40 -z-10 animate-pulse"></div>
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold uppercase tracking-wider mb-1.5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <span>Party Game Sociale Live</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white neon-title uppercase">
              AFTER DARK
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xs mx-auto mt-1 font-medium leading-relaxed">
              Missioni segrete, bluff tra amici e caos controllato durante la tua serata dal vivo.
            </p>
          </div>
        </div>

        <SupabaseNotice />

        {/* PLAYER IDENTITY CARD (TAP TO CHANGE NICKNAME) */}
        <div
          onClick={handleOpenEdit}
          className="card-party rounded-3xl p-4 relative overflow-hidden cursor-pointer hover:border-rose-500/50 transition-all active:scale-[0.99] group shadow-xl"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-white/10 to-white/5 border-2 border-rose-500/50 flex items-center justify-center text-3xl shadow-lg shadow-rose-950/50 group-hover:scale-105 transition-transform">
                  {getAvatarEmoji(avatarSeed)}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-rose-600 border border-black flex items-center justify-center text-[10px] text-white shadow">
                  <Edit2 className="w-2.5 h-2.5" />
                </div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] uppercase tracking-wider text-rose-400 font-extrabold block">
                    Il Tuo Nome nella Partita
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-white/10 text-slate-300 border border-white/10">
                    {getGenderEmoji(gender)} {getGenderLabel(gender)}
                  </span>
                </div>
                <p className="font-black text-white text-lg tracking-wide flex items-center gap-1.5 truncate">
                  <span className="truncate">{nickname}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                </p>
                <span className="text-[10px] text-slate-400 block group-hover:text-rose-300 transition-colors">
                  Tocca qui per cambiare nome o avatar
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenEdit();
              }}
              className="px-3.5 py-2.5 rounded-2xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-xs text-rose-300 font-black flex items-center gap-1.5 transition-all active:scale-95 shadow-md shrink-0 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Cambia Nome</span>
            </button>
          </div>

          {/* Toast feedback when saved */}
          {showSavedToast && (
            <div className="mt-3 p-2.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Nome aggiornato: &ldquo;{nickname}&rdquo;!</span>
            </div>
          )}
        </div>

        {/* JUICY 3D ACTION BUTTONS */}
        <div className="space-y-2.5 pt-1">
          <Link
            href="/create"
            onClick={() => {
              triggerHaptic('medium');
              sounds.playClick();
            }}
            className="w-full py-4 px-6 rounded-3xl btn-game-rose text-white font-black text-base tracking-wider uppercase flex items-center justify-center gap-3 cursor-pointer shadow-xl"
          >
            <PlusCircle className="w-6 h-6 filter drop-shadow" />
            <span>Crea Partita</span>
          </Link>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => {
                triggerHaptic('medium');
                sounds.playClick();
                setIsScannerOpen(true);
              }}
              type="button"
              className="py-3.5 px-3 rounded-2xl btn-game-dark text-slate-100 font-black text-xs tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer border border-rose-500/30 shadow-lg active:scale-95 transition-all"
            >
              <Camera className="w-4 h-4 text-rose-400 animate-pulse" />
              <span>Inquadra QR</span>
            </button>

            <Link
              href="/join"
              onClick={() => {
                triggerHaptic('light');
                sounds.playClick();
              }}
              className="py-3.5 px-3 rounded-2xl btn-game-dark text-slate-100 font-black text-xs tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 transition-all"
            >
              <LogIn className="w-4 h-4 text-slate-400" />
              <span>Digita Codice</span>
            </Link>
          </div>
        </div>

        {/* 6 GAME MODES SHOWCASE TILES */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between px-1 text-xs">
            <span className="font-extrabold uppercase tracking-wider text-slate-400">
              6 Modalità di Gioco
            </span>
            <span className="text-[11px] text-fuchsia-400 font-bold">160+ Missioni 🔥</span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {([
              { mode: 'jeffrey_island', label: 'Jeffrey 🔥', border: 'hover:border-fuchsia-500/50' },
              { mode: 'bar', label: 'Bar', border: 'hover:border-amber-500/50' },
              { mode: 'discoteca', label: 'Club', border: 'hover:border-purple-500/50' },
              { mode: 'house_party', label: 'House', border: 'hover:border-emerald-500/50' },
              { mode: 'outdoor', label: 'Outdoor', border: 'hover:border-cyan-500/50' },
              { mode: 'chaos', label: 'Chaos', border: 'hover:border-rose-500/50' },
            ] as { mode: GameMode; label: string; border: string }[]).map((m) => (
              <div
                key={m.mode}
                className={`card-party p-2 rounded-2xl flex flex-col items-center justify-center text-center transition-all hover:scale-105 cursor-pointer ${m.border}`}
              >
                <div className="w-10 h-10 flex items-center justify-center mb-1">
                  <ModeGraphic mode={m.mode} className="w-9 h-9" />
                </div>
                <span className="text-[11px] font-black text-slate-200 tracking-wide uppercase truncate w-full">
                  {m.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER LINK */}
        <div className="text-center pt-2 pb-1 border-t border-white/10">
          <Link
            href="/rules"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors py-1 px-3 rounded-full hover:bg-white/5"
          >
            <BookOpen className="w-4 h-4 text-rose-400" />
            <span>Regole, Codice Etico & Guida di Gioco</span>
          </Link>
        </div>

      </main>

      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onCodeScanned={(code) => {
          setIsScannerOpen(false);
          router.push(`/room/${code}`);
        }}
      />

      {/* MODAL CAMBIA NOME */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm bg-[#120e24] border border-rose-500/40 rounded-3xl p-6 shadow-2xl space-y-4 text-left relative overflow-hidden">
            {/* Close Button */}
            <button
              onClick={() => {
                triggerHaptic('light');
                setIsEditingProfile(false);
              }}
              type="button"
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-black uppercase tracking-wider mb-1">
                <User className="w-3.5 h-3.5" />
                <span>Identità Giocatore</span>
              </div>
              <h3 className="text-xl font-black text-white">Cambia il Tuo Nome</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Questo è il nome con cui ti vedranno tutti gli altri partecipanti.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Nickname Input with Random Generator */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">
                    Il tuo Nickname
                  </label>
                  <button
                    type="button"
                    onClick={handleRandomNickname}
                    className="text-[11px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors active:scale-95 cursor-pointer"
                  >
                    <Dices className="w-3.5 h-3.5" />
                    <span>Nome a Sorpresa 🎲</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={18}
                    value={editNickname}
                    onChange={(e) => setEditNickname(e.target.value)}
                    placeholder="Es. Ghost, Viper, Il Barone..."
                    autoFocus
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-black/60 border border-white/20 text-white placeholder-slate-500 text-base font-bold focus:outline-none focus:border-rose-500 transition-colors"
                  />
                  <User className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Avatar Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  Segno Distintivo (Avatar)
                </label>
                <AvatarPicker selected={editAvatarSeed} onSelect={setEditAvatarSeed} />
              </div>

              {/* Gender Selector for Missions */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">
                    Genere per le Missioni
                  </label>
                  <span className="text-[10px] text-slate-400">
                    (Di base Neutro: adatto a tutti)
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { val: 'neutro', label: 'Neutro 👤', desc: 'Per chiunque' },
                    { val: 'uomo', label: 'Uomo ♂️', desc: 'Task dedicate' },
                    { val: 'donna', label: 'Donna ♀️', desc: 'Task dedicate' },
                  ] as { val: PlayerGender; label: string; desc: string }[]).map((g) => {
                    const isSelected = editGender === g.val;
                    return (
                      <button
                        key={g.val}
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          setEditGender(g.val);
                        }}
                        className={`py-2 px-2 rounded-2xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-rose-500/25 border-rose-500 text-white shadow-lg shadow-rose-950/40 ring-2 ring-rose-400/50 scale-[1.02]'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <div className="text-xs font-black">{g.label}</div>
                        <div className="text-[9px] text-slate-400 mt-0.5 truncate">{g.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={!editNickname.trim()}
                  className="w-full py-4 rounded-3xl btn-game-rose disabled:opacity-40 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-xl active:scale-98 transition-all"
                >
                  <Check className="w-4 h-4 filter drop-shadow" />
                  <span>Salva Nuovo Nome</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="w-full py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-bold transition-colors text-center cursor-pointer"
                >
                  Annulla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
