'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wine,
  Disc,
  Home,
  Compass,
  Zap,
  Clock,
  Users,
  Shield,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Target,
  Flame,
  Globe,
  Lock,
  Timer,
  Eye,
  EyeOff,
  ListOrdered,
  Coins,
  Scale,
  Dices,
  RotateCcw,
  Shuffle,
  AlertTriangle,
  Skull,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { ModeGraphic } from '@/components/ModeGraphics';
import {
  GameMode,
  MissionDifficulty,
  ProgressionMode,
  ScoringMode,
  MissionDistribution,
  SkipDifficultyRule,
} from '@/types/game';
import { getOrCreatePlayerSession } from '@/lib/session/player';
import { triggerHaptic } from '@/lib/haptics/vibration';
import { sounds } from '@/lib/audio/sound';

const GAME_MODES: {
  id: GameMode;
  name: string;
  tagline: string;
  icon: React.ReactNode;
  accent: string;
}[] = [
  {
    id: 'jeffrey_island',
    name: 'JEFFREY ISLAND PARTY 🔥',
    tagline: 'Party frizzante, alcolico e piccante: flirt, penitenze, verità e sfide senza filtri',
    icon: <Flame className="w-5 h-5" />,
    accent: 'border-fuchsia-500/50 hover:bg-fuchsia-500/10 text-fuchsia-400',
  },
  {
    id: 'bar',
    name: 'BAR & LOUNGE',
    tagline: 'Conversazioni, drink, osservazione sottile e bluff da bancone',
    icon: <Wine className="w-5 h-5" />,
    accent: 'border-amber-500/50 hover:bg-amber-500/10 text-amber-400',
  },
  {
    id: 'discoteca',
    name: 'DISCOTECA & CLUB',
    tagline: 'Musica alta, cenni, sguardi, ballo e missioni visive senza parole',
    icon: <Disc className="w-5 h-5" />,
    accent: 'border-purple-500/50 hover:bg-purple-500/10 text-purple-400',
  },
  {
    id: 'house_party',
    name: 'HOUSE PARTY',
    tagline: 'Segreti tra amici, votazioni, divano, cucina e alleanze domestiche',
    icon: <Home className="w-5 h-5" />,
    accent: 'border-emerald-500/50 hover:bg-emerald-500/10 text-emerald-400',
  },
  {
    id: 'outdoor',
    name: 'OUTDOOR & FESTIVAL',
    tagline: 'Passeggiate serali, piazze, ponti e scorci urbani in movimento',
    icon: <Compass className="w-5 h-5" />,
    accent: 'border-cyan-500/50 hover:bg-cyan-500/10 text-cyan-400',
  },
  {
    id: 'chaos',
    name: 'CHAOS MODE',
    tagline: 'Imprevisti spietati, sabotaggi amichevoli, bluff estremo e rimescolamenti',
    icon: <Zap className="w-5 h-5" />,
    accent: 'border-rose-500/50 hover:bg-rose-500/10 text-rose-400',
  },
];

export default function CreateRoomPage() {
  const router = useRouter();
  const [groupName, setGroupName] = useState('');
  const [selectedMode, setSelectedMode] = useState<GameMode>('bar');
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [missionsPerPlayer, setMissionsPerPlayer] = useState<number>(3);
  const [minPlayers, setMinPlayers] = useState<number>(3);
  const [maxPlayers, setMaxPlayers] = useState<number>(10);
  const [allowCoop, setAllowCoop] = useState<boolean>(true);
  const [requireWitness, setRequireWitness] = useState<boolean>(false);
  const [enableGenderMissions, setEnableGenderMissions] = useState<boolean>(false);
  const [includeJeffreyPack, setIncludeJeffreyPack] = useState<boolean>(false);
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [hideTasks, setHideTasks] = useState<boolean>(true);
  const [progressionMode, setProgressionMode] = useState<ProgressionMode>('free');
  const [scoringMode, setScoringMode] = useState<ScoringMode>('points');
  const [missionDistribution, setMissionDistribution] = useState<MissionDistribution>('fair');
  const [maxSkipsPerPlayer, setMaxSkipsPerPlayer] = useState<number>(1);
  const [skipDifficultyRule, setSkipDifficultyRule] = useState<SkipDifficultyRule>('same');
  const [penaltyProbability, setPenaltyProbability] = useState<number>(0);
  const [difficulties, setDifficulties] = useState<MissionDifficulty[]>([
    'facile',
    'media',
    'difficile',
    'leggendaria',
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const paramMode = new URLSearchParams(window.location.search).get('mode') as GameMode | null;
      const validModes: GameMode[] = ['jeffrey_island', 'bar', 'discoteca', 'house_party', 'outdoor', 'chaos'];
      if (paramMode && validModes.includes(paramMode)) {
        setSelectedMode(paramMode);
        if (paramMode === 'jeffrey_island') {
          setIncludeJeffreyPack(true);
        }
      }
    }
  }, []);

  const toggleDifficulty = (d: MissionDifficulty) => {
    triggerHaptic('light');
    if (difficulties.includes(d)) {
      if (difficulties.length === 1) return; // Mantieni almeno una difficoltà
      setDifficulties(difficulties.filter((x) => x !== d));
    } else {
      setDifficulties([...difficulties, d]);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);
    triggerHaptic('medium');

    try {
      const session = getOrCreatePlayerSession();

      const res = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupName: groupName.trim() || 'I Guerrieri della Notte',
          mode: selectedMode,
          minPlayers,
          maxPlayers,
          durationMinutes,
          missionsPerPlayer,
          allowedDifficulties: difficulties,
          allowCoop,
          requireWitness,
          enableGenderMissions,
          includeJeffreyPack: selectedMode === 'jeffrey_island' || includeJeffreyPack,
          isPublic,
          hideTasks,
          progressionMode,
          scoringMode,
          missionDistribution,
          maxSkipsPerPlayer,
          skipDifficultyRule,
          penaltyProbability,
          hostPlayerId: session.playerId,
          hostNickname: session.nickname,
          hostAvatar: session.avatarSeed,
          hostGender: session.gender || 'neutro',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Errore nella creazione della stanza');
      }

      sounds.playSuccess();
      router.push(`/room/${data.room.code}?tasks=${missionsPerPlayer}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Errore imprevisto';
      setErrorMsg(message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#07050f] text-slate-100 pb-24">
      <Navbar />

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-4 space-y-5">
        <div className="flex items-center">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Indietro</span>
          </button>
        </div>

        <div>
          <h2 className="text-2xl font-black tracking-tight text-white">Configura la Partita</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Personalizza l&apos;esperienza per il tuo gruppo e il locale di stasera.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-5">
          {/* Group Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              Nome del Gruppo o Serata
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Es. Venerdì da Leoni, Squadra Gin Tonic..."
              maxLength={30}
              className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-rose-500 transition-colors"
            />
          </div>

          {/* Mode Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              Modalità & Atmosfera
            </label>
            <div className="space-y-2">
              {GAME_MODES.map((mode) => {
                const isSelected = selectedMode === mode.id;
                return (
                  <div
                    key={mode.id}
                    onClick={() => {
                      triggerHaptic('light');
                      setSelectedMode(mode.id);
                    }}
                    className={`cursor-pointer p-3.5 rounded-3xl border transition-all flex items-center gap-3.5 ${
                      isSelected
                        ? `bg-gradient-to-r from-white/10 to-white/5 border-2 ${mode.accent} shadow-xl shadow-black/80 scale-[1.01]`
                        : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06] opacity-75 hover:opacity-100'
                    }`}
                  >
                    <div className="shrink-0 w-14 h-14 flex items-center justify-center p-1 rounded-2xl bg-black/40 border border-white/10">
                      <ModeGraphic mode={mode.id} className="w-12 h-12" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm tracking-wide text-white">
                          {mode.name}
                        </span>
                        {isSelected && (
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shadow-lg shadow-rose-500" />
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                        {mode.tagline}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Duration Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <Clock className="w-3.5 h-3.5 text-rose-400" />
                <span>Durata della Partita</span>
              </label>
              <span className="text-xs font-extrabold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                {durationMinutes > 0 ? `${durationMinutes} min` : '∞ Senza tempo'}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {[
                { label: '30m', val: 30, desc: 'Rapida' },
                { label: '45m', val: 45, desc: 'Standard' },
                { label: '60m', val: 60, desc: 'Completa' },
                { label: '90m', val: 90, desc: 'Lunga' },
                { label: '∞', val: 0, desc: 'Senza tempo' },
              ].map((dur) => (
                <button
                  key={dur.val}
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setDurationMinutes(dur.val);
                  }}
                  className={`py-2 px-1 rounded-xl border text-center transition-all cursor-pointer ${
                    durationMinutes === dur.val
                      ? 'bg-rose-500/25 border-rose-500 text-white shadow-lg shadow-rose-950/40 ring-2 ring-rose-400/50 scale-[1.02]'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <div className="text-sm font-black leading-none">{dur.label}</div>
                  <div className="text-[9px] mt-1 text-slate-400 font-semibold truncate">
                    {dur.desc}
                  </div>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400">
              {durationMinutes === 0
                ? 'Partita aperta senza countdown: giocate al vostro ritmo e terminate quando volete.'
                : `La partita si concluderà automaticamente dopo ${durationMinutes} minuti.`}
            </p>
          </div>

          {/* Missions Per Player Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <Target className="w-3.5 h-3.5 text-rose-400" />
                <span>Task a Testa per Giocatore</span>
              </label>
              <span className="text-xs font-extrabold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                {missionsPerPlayer} {missionsPerPlayer === 1 ? 'task' : 'task'}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {[
                { val: 1, label: '1', desc: 'Flash' },
                { val: 2, label: '2', desc: 'Leggera' },
                { val: 3, label: '3', desc: 'Standard ⭐' },
                { val: 4, label: '4', desc: 'Intensa' },
                { val: 5, label: '5', desc: 'Hardcore 🔥' },
              ].map((item) => {
                const isSelected = missionsPerPlayer === item.val;
                return (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setMissionsPerPlayer(item.val);
                    }}
                    className={`py-2.5 px-1 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-rose-500/25 border-rose-500 text-white shadow-lg shadow-rose-950/40 ring-2 ring-rose-400/50 scale-[1.02]'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <div className="text-base font-black leading-none">{item.label}</div>
                    <div className="text-[9px] mt-1 text-slate-400 font-semibold truncate">
                      {item.desc}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400">
              Ogni partecipante riceverà {missionsPerPlayer} {missionsPerPlayer === 1 ? 'missione segreta' : 'missioni segrete'} all&apos;avvio della partita.
            </p>
          </div>

          {/* Player Quorum */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Minimo Giocatori
              </label>
              <select
                value={minPlayers}
                onChange={(e) => setMinPlayers(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-rose-500"
              >
                <option value={2} className="bg-slate-900">2 Giocatori (Duello)</option>
                <option value={3} className="bg-slate-900">3 Giocatori</option>
                <option value={4} className="bg-slate-900">4 Giocatori</option>
                <option value={5} className="bg-slate-900">5 Giocatori</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Massimo Giocatori
              </label>
              <select
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-rose-500"
              >
                <option value={6} className="bg-slate-900">6 Giocatori</option>
                <option value={8} className="bg-slate-900">8 Giocatori</option>
                <option value={10} className="bg-slate-900">10 Giocatori</option>
                <option value={16} className="bg-slate-900">16 Giocatori</option>
                <option value={24} className="bg-slate-900">24 Giocatori</option>
              </select>
            </div>
          </div>

          {/* Difficulties */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              Difficoltà Ammesse
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['facile', 'media', 'difficile', 'leggendaria'] as MissionDifficulty[]).map((d) => {
                const active = difficulties.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDifficulty(d)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold capitalize transition-all ${
                      active
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                        : 'bg-white/5 border-white/10 text-slate-500 opacity-60'
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Validation Mode Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <Shield className="w-3.5 h-3.5 text-rose-400" />
                <span>Modalità di Validazione</span>
              </label>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  !requireWitness
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                }`}
              >
                {!requireWitness ? '⚡ Auto-conferma' : '👁️ Con testimone'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setRequireWitness(false);
                }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  !requireWitness
                    ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-lg shadow-emerald-950/40 ring-2 ring-emerald-400/40'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-bold text-xs text-white">⚡ Auto-conferma</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                  Nessun testimone richiesto: completi subito sulla fiducia.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setRequireWitness(true);
                }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  requireWitness
                    ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg shadow-amber-950/40 ring-2 ring-amber-400/40'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-bold text-xs text-white">👁️ Con Testimone</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                  Un compagno deve approvare sul suo schermo.
                </p>
              </button>
            </div>
          </div>

          {/* Progression Mode: Tutte Insieme vs Catena di Sfide */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <ListOrdered className="w-3.5 h-3.5 text-rose-400" />
                <span>Progressione delle Missioni</span>
              </label>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  progressionMode === 'sequential'
                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                    : 'bg-white/10 text-slate-300 border-white/10'
                }`}
              >
                {progressionMode === 'sequential' ? '⛓️ Step by Step' : '🔓 Libere'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setProgressionMode('free');
                }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  progressionMode === 'free'
                    ? 'bg-rose-500/15 border-rose-500 text-white ring-2 ring-rose-400/40 shadow-lg shadow-rose-950/40'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-white">Tutte Insieme</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                  Tutte le task sono sbloccate e completabili in qualsiasi ordine.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('medium');
                  setProgressionMode('sequential');
                }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  progressionMode === 'sequential'
                    ? 'bg-gradient-to-r from-rose-950/50 to-purple-950/50 border-rose-500 text-white ring-2 ring-rose-400/40 shadow-lg shadow-rose-950/40'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-rose-300">Catena di Sfide 🔥</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                  Una task per volta! Devi completare la tappa corrente per sbloccare la successiva.
                </p>
              </button>
            </div>
          </div>

          {/* Scoring Mode: A Punti vs Solo Numero di Missioni */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>Obiettivo & Punteggio</span>
              </label>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-white/10 text-slate-300 border-white/10">
                {scoringMode === 'points' ? '🏆 A Punti' : '🎯 Solo Numero Task'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setScoringMode('points');
                }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  scoringMode === 'points'
                    ? 'bg-amber-500/15 border-amber-500 text-white ring-2 ring-amber-400/40 shadow-lg shadow-amber-950/40'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-white">A Punti Classico</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                  Punti in base alla difficoltà delle task. Vince chi totalizza più punti.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('medium');
                  setScoringMode('mission_count');
                }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  scoringMode === 'mission_count'
                    ? 'bg-cyan-500/15 border-cyan-500 text-white ring-2 ring-cyan-400/40 shadow-lg shadow-cyan-950/40'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-cyan-300">Solo Conteggio Task</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                  Senza punteggio numerico: vince chi completa più missioni!
                </p>
              </button>
            </div>

            {/* Sotto-selettore per Solo Conteggio: Fair Mode vs Chaos Roulette */}
            {scoringMode === 'mission_count' && (
              <div className="p-3 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-2 animate-in fade-in">
                <span className="text-[11px] font-bold text-cyan-200 block">
                  Distribuzione Difficoltà per Giocatore:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setMissionDistribution('fair');
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      missionDistribution === 'fair'
                        ? 'bg-cyan-500/20 border-cyan-400 text-white font-bold'
                        : 'bg-white/5 border-white/10 text-slate-400'
                    }`}
                  >
                    <div className="text-xs font-bold text-white flex items-center gap-1">
                      <Scale className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Fair Mode</span>
                    </div>
                    <span className="text-[9px] text-slate-300 block mt-0.5">
                      Difficoltà simili e bilanciate per tutti i giocatori.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setMissionDistribution('random');
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      missionDistribution === 'random'
                        ? 'bg-rose-500/20 border-rose-400 text-white font-bold'
                        : 'bg-white/5 border-white/10 text-slate-400'
                    }`}
                  >
                    <div className="text-xs font-bold text-white flex items-center gap-1">
                      <Dices className="w-3.5 h-3.5 text-rose-400" />
                      <span>Chaos Roulette</span>
                    </div>
                    <span className="text-[9px] text-slate-300 block mt-0.5">
                      Difficoltà casuali: alcuni favoriti, altri con compiti tosti!
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Skip / Cambio Task */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
                <span>Cambi Missione (Skip Task)</span>
              </label>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-purple-500/10 text-purple-300 border-purple-500/20">
                {maxSkipsPerPlayer === 0 ? 'Disattivati' : `${maxSkipsPerPlayer} totali nel game`}
              </span>
            </div>

            <p className="text-[11px] text-slate-400">
              Numero di cambi complessivi a disposizione di ciascun giocatore per tutta la partita (non a task: es. con 2 skip puoi cambiare al massimo 2 volte in tutto il game).
            </p>

            <div className="grid grid-cols-4 gap-1.5">
              {[0, 1, 2, 3].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setMaxSkipsPerPlayer(val);
                  }}
                  className={`py-2 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                    maxSkipsPerPlayer === val
                      ? 'bg-purple-600 border-purple-400 text-white shadow-md shadow-purple-950/50'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {val === 0 ? 'Nessuno' : `${val} Totali`}
                </button>
              ))}
            </div>

            {/* Sotto-selettore Regola di Cambio */}
            {maxSkipsPerPlayer > 0 && (
              <div className="p-3 rounded-2xl bg-purple-950/20 border border-purple-500/30 space-y-2 animate-in fade-in">
                <span className="text-[11px] font-bold text-purple-200 block">
                  Regola sulla Nuova Missione:
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setSkipDifficultyRule('same');
                    }}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      skipDifficultyRule === 'same'
                        ? 'bg-purple-500/25 border-purple-400 text-white font-bold'
                        : 'bg-white/5 border-white/10 text-slate-400'
                    }`}
                  >
                    <span className="text-[10px] font-black text-white block">Stesso Livello</span>
                    <span className="text-[8px] text-slate-400 block mt-0.5">Equo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setSkipDifficultyRule('harder');
                    }}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      skipDifficultyRule === 'harder'
                        ? 'bg-rose-500/25 border-rose-400 text-white font-bold'
                        : 'bg-white/5 border-white/10 text-slate-400'
                    }`}
                  >
                    <span className="text-[10px] font-black text-rose-300 block">Più Difficile</span>
                    <span className="text-[8px] text-slate-400 block mt-0.5">+Sfida / Malus</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setSkipDifficultyRule('random');
                    }}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      skipDifficultyRule === 'random'
                        ? 'bg-amber-500/25 border-amber-400 text-white font-bold'
                        : 'bg-white/5 border-white/10 text-slate-400'
                    }`}
                  >
                    <span className="text-[10px] font-black text-amber-300 block">Casuale</span>
                    <span className="text-[8px] text-slate-400 block mt-0.5">Imprevisto</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Nascondi Task (Modalità Privacy) Toggle */}
          <div
            onClick={() => {
              triggerHaptic('light');
              setHideTasks(!hideTasks);
            }}
            className="cursor-pointer p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between transition-colors hover:bg-white/[0.06]"
          >
            <div className="pr-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-white">Nascondi Task (Modalità Privacy)</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    hideTasks
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-white/10 text-slate-400 border-white/10'
                  }`}
                >
                  {hideTasks ? '🛡️ Coperte' : '👁️ Scoperte'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {hideTasks
                  ? 'Le task partono coperte per proteggersi da occhi indiscreti (tocca per rivelare).'
                  : 'Le task sono subito visibili a schermo senza dover toccare "Rivela".'}
              </p>
            </div>
            <div
              className={`w-11 h-6 rounded-full transition-colors relative p-1 shrink-0 ${
                hideTasks ? 'bg-rose-600' : 'bg-white/10'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  hideTasks ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </div>

          {/* Modificatore Punizione (Malus) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Modificatore Punizione (Malus Casuale)</span>
              </label>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  penaltyProbability > 0
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-white/5 text-slate-400 border-white/10'
                }`}
              >
                {penaltyProbability === 0 ? 'Disattivato' : `${penaltyProbability}% (1-2 gioc.)`}
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-snug">
              Probabilità che il malus si attivi nella partita. La penitenza <strong>non esce a tutti</strong>: colpisce solo <strong>1 giocatore</strong> (fino a 6 partecipanti) o <strong>2 giocatori</strong> (da 7 a 10 partecipanti), comparendo a sorpresa a caso <strong>dopo la 1ª task fino a dopo la penultima task</strong>!
            </p>

            <div className="grid grid-cols-5 gap-1.5">
              {[
                { val: 0, label: '0%', sub: 'Off' },
                { val: 10, label: '10%', sub: 'Raro' },
                { val: 25, label: '25%', sub: 'Medio' },
                { val: 50, label: '50%', sub: 'Alto' },
                { val: 100, label: '100%', sub: 'Garantito ⚡' },
              ].map(({ val, label, sub }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setPenaltyProbability(val);
                  }}
                  className={`py-2 px-1 rounded-xl border text-center transition-all cursor-pointer ${
                    penaltyProbability === val
                      ? 'bg-amber-500/25 border-amber-400 text-white font-black shadow-md shadow-amber-950/40'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-[11px] font-black block">{label}</span>
                  <span className="text-[8px] text-slate-400 block mt-0.5 leading-none">{sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Coop toggle */}
          <div
            onClick={() => {
              triggerHaptic('light');
              setAllowCoop(!allowCoop);
            }}
            className="cursor-pointer p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between transition-colors hover:bg-white/[0.06]"
          >
            <div>
              <span className="font-bold text-xs text-white block">Missioni Collaborative</span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Consenti missioni in cui due giocatori complottano insieme
              </p>
            </div>
            <div
              className={`w-11 h-6 rounded-full transition-colors relative p-1 shrink-0 ${
                allowCoop ? 'bg-rose-600' : 'bg-white/10'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  allowCoop ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </div>

          {/* Gender Specific Missions Toggle */}
          <div
            onClick={() => {
              triggerHaptic('light');
              setEnableGenderMissions(!enableGenderMissions);
            }}
            className="cursor-pointer p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between transition-colors hover:bg-white/[0.06]"
          >
            <div className="pr-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-white">Missioni Specifiche Uomo / Donna</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    enableGenderMissions
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                      : 'bg-white/10 text-slate-400 border-white/10'
                  }`}
                >
                  {enableGenderMissions ? 'Attivo' : 'Di base Neutro'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Di base le missioni sono neutre per chiunque. Attivando questa opzione, chi imposta Uomo o Donna riceverà compiti mirati ed esclusivi!
              </p>
            </div>
            <div
              className={`w-11 h-6 rounded-full transition-colors relative p-1 shrink-0 ${
                enableGenderMissions ? 'bg-indigo-600' : 'bg-white/10'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  enableGenderMissions ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </div>

          {/* Include Jeffrey Island Pack Toggle (when not already in jeffrey_island mode) */}
          {selectedMode !== 'jeffrey_island' && (
            <div
              onClick={() => {
                triggerHaptic('light');
                setIncludeJeffreyPack(!includeJeffreyPack);
              }}
              className="cursor-pointer p-3.5 rounded-2xl bg-gradient-to-r from-fuchsia-950/25 to-rose-950/25 border border-fuchsia-500/30 flex items-center justify-between transition-colors hover:bg-fuchsia-950/40"
            >
              <div className="pr-3">
                <div className="flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-fuchsia-400" />
                  <span className="font-bold text-xs text-fuchsia-200">
                    Includi Pack Jeffrey Island (18+ / Alcol & Frizzante)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Aggiunge al mazzo le 36 task più piccanti, alcoliche e senza freni inibitori!
                </p>
              </div>
              <div
                className={`w-11 h-6 rounded-full transition-colors relative p-1 shrink-0 ${
                  includeJeffreyPack ? 'bg-fuchsia-600' : 'bg-white/10'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    includeJeffreyPack ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Visibilità Stanza: Pubblica o Privata */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-300">
                Visibilità Lobby
              </label>
              <span className="text-[10px] text-slate-400 font-medium">
                {isPublic ? '🌐 Visibile a tutti nella lista' : '🔒 Solo con codice segreto'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setIsPublic(true);
                }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  isPublic
                    ? 'bg-rose-500/20 border-rose-500 text-white ring-2 ring-rose-400/40 shadow-lg shadow-rose-950/40 scale-[1.01]'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="font-bold text-xs text-white">Lobby Pubblica</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                  Compare nella sezione "Partecipa" per chiunque voglia unirsi.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setIsPublic(false);
                }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  !isPublic
                    ? 'bg-purple-500/20 border-purple-500 text-white ring-2 ring-purple-400/40 shadow-lg shadow-purple-950/40 scale-[1.01]'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="font-bold text-xs text-white">Stanza Privata</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                  Entra solo chi riceve il codice a 6 cifre o inquadra il QR code.
                </p>
              </button>
            </div>
          </div>

          {/* Avviso Chiusura Automatica dopo 5 Minuti */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5">
            <Timer className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
            <p className="text-[11px] text-amber-200/90 leading-tight">
              <span className="font-bold text-amber-300">Timeout 5 minuti:</span> Se la partita non viene avviata entro <span className="font-bold text-white">5 minuti</span> dalla creazione, la stanza verrà chiusa automaticamente per inattività.
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-3xl btn-game-rose disabled:opacity-40 text-white font-black text-base tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer shadow-2xl"
          >
            <span>{isSubmitting ? 'Generazione Stanza...' : 'Crea Stanza & Invita'}</span>
            <ArrowRight className="w-5 h-5 filter drop-shadow" />
          </button>
        </form>
      </main>
    </div>
  );
}
