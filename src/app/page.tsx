'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  PlusCircle,
  LogIn,
  BookOpen,
  Check,
  Camera,
  X,
  SlidersHorizontal,
  Flame,
  Users,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { getAvatarEmoji } from '@/components/AvatarPicker';
import { ModeGraphic } from '@/components/ModeGraphics';
import { QrScannerModal } from '@/components/QrScannerModal';
import { ProfileSettingsModal } from '@/components/ProfileSettingsModal';
import { GameMode, PlayerGender, PlayerSession } from '@/types/game';
import {
  getOrCreatePlayerSession,
  getGenderEmoji,
  getGenderLabel,
} from '@/lib/session/player';
import { triggerHaptic } from '@/lib/haptics/vibration';
import { sounds } from '@/lib/audio/sound';

interface ModeInfo {
  mode: GameMode;
  name: string;
  tagline: string;
  vibe: string;
  missionsCount: string;
  suggestedPlayers: string;
  badgeClass: string;
  borderClass: string;
}

const GAME_MODES_INFO: ModeInfo[] = [
  {
    mode: 'jeffrey_island',
    name: 'Jeffrey Island 🔥',
    tagline: 'Party frizzante, alcolico e piccante: flirt, penitenze, verità e sfide senza filtri.',
    vibe: 'Piccante & Alcolica',
    missionsCount: '36 missioni esclusive',
    suggestedPlayers: '4 - 12 giocatori',
    badgeClass: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40',
    borderClass: 'hover:border-fuchsia-500/60 hover:shadow-fuchsia-950/40',
  },
  {
    mode: 'bar',
    name: 'Bar & Lounge',
    tagline: 'Conversazioni, drink al bancone, osservazione discreta e bluff raffinato.',
    vibe: 'Sociale & Rilassata',
    missionsCount: '25+ missioni',
    suggestedPlayers: '3 - 8 giocatori',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    borderClass: 'hover:border-amber-500/60 hover:shadow-amber-950/40',
  },
  {
    mode: 'discoteca',
    name: 'Discoteca & Club',
    tagline: 'Musica alta, cenni, sguardi, pista da ballo e sfide visive senza parole.',
    vibe: 'Adrenalina & Ballo',
    missionsCount: '25+ missioni',
    suggestedPlayers: '4 - 10 giocatori',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    borderClass: 'hover:border-purple-500/60 hover:shadow-purple-950/40',
  },
  {
    mode: 'house_party',
    name: 'House Party',
    tagline: 'Segreti tra amici, votazioni, divano, cucina e alleanze domestiche imprevedibili.',
    vibe: 'Caos Casalingo',
    missionsCount: '30+ missioni',
    suggestedPlayers: '4 - 12 giocatori',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    borderClass: 'hover:border-emerald-500/60 hover:shadow-emerald-950/40',
  },
  {
    mode: 'outdoor',
    name: "All'Aperto",
    tagline: 'Passeggiate notturne, piazze, parchi e scorci urbani con interazioni in movimento.',
    vibe: 'Avventura Urbana',
    missionsCount: '20+ missioni',
    suggestedPlayers: '3 - 8 giocatori',
    badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    borderClass: 'hover:border-cyan-500/60 hover:shadow-cyan-950/40',
  },
  {
    mode: 'chaos',
    name: 'Chaos Mode',
    tagline: 'Imprevisti spietati, sabotaggi amichevoli, bluff estremo e rimescolamenti continui.',
    vibe: 'Puro Delirio',
    missionsCount: '25+ missioni',
    suggestedPlayers: '4 - 10 giocatori',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    borderClass: 'hover:border-rose-500/60 hover:shadow-rose-950/40',
  },
];

export default function HomePage() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [avatarSeed, setAvatarSeed] = useState('shadow');
  const [gender, setGender] = useState<PlayerGender>('neutro');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedModeDetail, setSelectedModeDetail] = useState<ModeInfo | null>(null);
  const [showSavedToast, setShowSavedToast] = useState(false);

  useEffect(() => {
    const session = getOrCreatePlayerSession();
    setNickname(session.nickname);
    setAvatarSeed(session.avatarSeed);
    setGender(session.gender || 'neutro');
  }, []);

  const handleProfileUpdated = (updated: PlayerSession) => {
    setNickname(updated.nickname);
    setAvatarSeed(updated.avatarSeed);
    setGender(updated.gender || 'neutro');
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2800);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#05020a] text-slate-100 selection:bg-rose-500 selection:text-white pb-20 md:pb-6">
      {/* Navbar with isHome={true} and showRules={false} to eliminate repetition */}
      <Navbar isHome={true} showRules={false} />

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-4 sm:py-5 flex flex-col space-y-4 sm:space-y-5">
        
        {/* HERO SECTION: SPAZIOSO, ELEGANTE E MODERNO */}
        <div className="text-center pt-1 pb-1 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-300 text-[10px] font-extrabold uppercase tracking-widest shadow-sm">
            <Sparkles className="w-3 h-3 text-rose-400" />
            <span>Party Game Sociale dal Vivo</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white neon-title uppercase">
            AFTER DARK
          </h1>
          <p className="text-xs text-slate-300 max-w-xs mx-auto font-medium leading-relaxed">
            Missioni segrete, bluff psicologico e caos controllato tra amici.
          </p>
        </div>

        {/* PROFILO UTENTE: SPAZIOSO E RAFFINATO */}
        <div className="space-y-1">
          <div
            onClick={() => {
              triggerHaptic('light');
              setIsProfileOpen(true);
            }}
            className="card-party rounded-3xl p-3.5 sm:p-4 relative overflow-hidden cursor-pointer hover:border-rose-500/50 transition-all active:scale-[0.99] group shadow-xl"
          >
            <div className="flex items-center justify-between gap-3">
              {/* Left: Avatar + Identity Info */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-white/10 to-white/5 border border-rose-500/40 flex items-center justify-center text-2xl shadow-md group-hover:scale-105 transition-transform">
                    {getAvatarEmoji(avatarSeed)}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-black animate-pulse" />
                </div>

                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-rose-400 font-extrabold flex items-center gap-1.5 leading-none mb-1">
                    <span>Il Tuo Profilo</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/10">
                      {getGenderEmoji(gender)} {getGenderLabel(gender)}
                    </span>
                  </div>
                  <div className="font-black text-white text-base tracking-wide truncate">
                    {nickname}
                  </div>
                </div>
              </div>

              {/* Right: Quick Settings Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic('light');
                  setIsProfileOpen(true);
                }}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-xs text-slate-200 hover:text-white font-extrabold flex items-center gap-1.5 transition-all active:scale-95 shrink-0 cursor-pointer shadow-sm"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-rose-400" />
                <span>Modifica</span>
              </button>
            </div>

            {/* Toast feedback when saved */}
            {showSavedToast && (
              <div className="mt-2.5 p-2 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 animate-in fade-in">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Profilo e impostazioni salvate!</span>
              </div>
            )}
          </div>
        </div>

        {/* PRIMARY ACTION BUTTONS: REDESIGNED WITH TACTILE PARTY AESTHETICS */}
        <div className="space-y-2.5">
          <Link
            href="/create"
            onClick={() => {
              triggerHaptic('medium');
              sounds.playClick();
            }}
            className="w-full py-4 px-5 rounded-2xl btn-game-rose text-white font-black text-sm sm:text-base tracking-wider uppercase flex items-center justify-center gap-2.5 cursor-pointer shadow-xl active:scale-[0.98] transition-all group"
          >
            <PlusCircle className="w-5 h-5 filter drop-shadow group-hover:rotate-90 transition-transform duration-200" />
            <span>Crea Nuova Partita</span>
          </Link>

          <div className="grid grid-cols-2 gap-2.5">
            <Link
              href="/join"
              onClick={() => {
                triggerHaptic('light');
                sounds.playClick();
              }}
              className="p-3.5 rounded-2xl btn-game-dark flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer shadow-lg active:scale-95 transition-all group"
            >
              <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-xs font-black uppercase tracking-wider text-white">Partecipa</span>
                <span className="block text-[10px] text-slate-400 font-medium">Codice o Lobby</span>
              </div>
            </Link>

            <button
              onClick={() => {
                triggerHaptic('medium');
                sounds.playClick();
                setIsScannerOpen(true);
              }}
              type="button"
              className="p-3.5 rounded-2xl btn-game-dark flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer shadow-lg active:scale-95 transition-all group"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-xs font-black uppercase tracking-wider text-white">Scanner QR</span>
                <span className="block text-[10px] text-slate-400 font-medium">Inquadra dal vivo</span>
              </div>
            </button>
          </div>
        </div>

        {/* GAME MODES SHOWCASE: 6 CARDS IN A BALANCED, LEGIBLE 2-COLUMN GRID */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between px-1 text-xs">
            <span className="font-black uppercase tracking-wider text-slate-400 text-[10px]">
              6 Modalità di Gioco
            </span>
            <span className="text-[10px] text-fuchsia-400 font-bold flex items-center gap-1">
              <span>160+ Missioni</span>
              <span>🔥</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {GAME_MODES_INFO.map((m) => (
              <button
                key={m.mode}
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  sounds.playClick();
                  setSelectedModeDetail(m);
                }}
                className={`card-party p-3 rounded-2xl flex items-center gap-2.5 text-left transition-all hover:scale-[1.02] active:scale-95 cursor-pointer border ${m.borderClass} group`}
              >
                <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <ModeGraphic mode={m.mode} className="w-7 h-7" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-xs font-black text-white tracking-wide truncate">
                    {m.name}
                  </span>
                  <span className="block text-[10px] text-slate-400 font-medium truncate">
                    {m.vibe}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

      </main>

      {/* QR SCANNER MODAL */}
      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onCodeScanned={(code) => {
          setIsScannerOpen(false);
          router.push(`/room/${code}`);
        }}
      />

      {/* MODAL PROFILO & IMPOSTAZIONI COMPLETE */}
      <ProfileSettingsModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onProfileUpdated={handleProfileUpdated}
      />

      {/* MODAL ANTEPRIMA MODALITÀ DI GIOCO */}
      {selectedModeDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm bg-[#110d22] border border-rose-500/40 rounded-3xl p-5 shadow-2xl relative overflow-hidden space-y-4 text-left">
            <button
              onClick={() => setSelectedModeDetail(null)}
              type="button"
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <ModeGraphic mode={selectedModeDetail.mode} className="w-10 h-10" />
              </div>
              <div>
                <div className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border mb-1 ${selectedModeDetail.badgeClass}`}>
                  {selectedModeDetail.vibe}
                </div>
                <h3 className="text-lg font-black text-white leading-tight">
                  {selectedModeDetail.name}
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              {selectedModeDetail.tagline}
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] text-slate-400 block font-bold">Missioni Incluse</span>
                <span className="font-black text-rose-300">{selectedModeDetail.missionsCount}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[10px] text-slate-400 block font-bold">Giocatori Consigliati</span>
                <span className="font-black text-slate-200">{selectedModeDetail.suggestedPlayers}</span>
              </div>
            </div>

            <div className="pt-1 flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedModeDetail(null)}
                className="w-1/3 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-bold transition-colors cursor-pointer text-center"
              >
                Chiudi
              </button>

              <Link
                href={`/create?mode=${selectedModeDetail.mode}`}
                onClick={() => {
                  triggerHaptic('medium');
                  sounds.playClick();
                }}
                className="w-2/3 py-3 rounded-2xl btn-game-rose text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-lg active:scale-98 transition-all"
              >
                <span>Crea Stanza</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
