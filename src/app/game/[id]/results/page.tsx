'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Crown,
  Flame,
  Eye,
  Skull,
  RotateCcw,
  Home,
  Sparkles,
  Award,
  Users,
  CheckCircle,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { getAvatarEmoji } from '@/components/AvatarPicker';
import { PlayerScore, GameAward, Game } from '@/types/game';
import { getOrCreatePlayerSession } from '@/lib/session/player';
import { triggerHaptic } from '@/lib/haptics/vibration';
import { sounds } from '@/lib/audio/sound';

export default function GameResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const gameId = resolvedParams.id;

  const [game, setGame] = useState<Game | null>(null);
  const [scores, setScores] = useState<PlayerScore[]>([]);
  const [awards, setAwards] = useState<GameAward[]>([]);
  const [room, setRoom] = useState<{ id: string; code: string; host_id: string; status: string; group_name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReplaying, setIsReplaying] = useState(false);
  const [hostReopenedLobby, setHostReopenedLobby] = useState(false);
  const [myPlayerId, setMyPlayerId] = useState('');

  useEffect(() => {
    const session = getOrCreatePlayerSession();
    setMyPlayerId(session.playerId);

    const fetchResults = async () => {
      try {
        const res = await fetch(`/api/games/${gameId}/state`, {
          headers: { 'x-player-id': session.playerId },
        });
        const data = await res.json();
        if (data.game) setGame(data.game);
        if (data.scores) setScores(data.scores);
        if (data.awards) setAwards(data.awards);
        if (data.room) setRoom(data.room);

        // Confetti celebration
        sounds.playSuccess();
        triggerHaptic('success');
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#e11d48', '#8b5cf6', '#f59e0b', '#10b981'],
        });
      } catch {
        // Fallback
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [gameId]);

  // Polling per rilevare se l'host ha riaperto la lobby per tutti
  useEffect(() => {
    if (!room?.code) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/rooms/${room.code}`);
        if (res.ok) {
          const data = await res.json();
          if (data.room?.status === 'lobby') {
            setHostReopenedLobby(true);
          }
        }
      } catch {
        // Ignora
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [room?.code]);

  const handleHostReplay = async () => {
    if (!room?.code || isReplaying) return;
    setIsReplaying(true);
    triggerHaptic('medium');
    sounds.playClick();

    try {
      const res = await fetch(`/api/rooms/${room.code}/replay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostPlayerId: myPlayerId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Impossibile riaprire la lobby');
      }

      sounds.playSuccess();
      router.push(`/room/${room.code}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Errore nel ripristinare la lobby';
      alert(msg);
      setIsReplaying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#07050f] text-slate-100">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
        </main>
      </div>
    );
  }

  const isMissionCountMode = game?.config?.scoring_mode === 'mission_count';

  const sortedScores = [...scores].sort((a, b) => {
    if (isMissionCountMode) {
      if (b.completed_count !== a.completed_count) {
        return b.completed_count - a.completed_count;
      }
      return (a.skips_used ?? 0) - (b.skips_used ?? 0);
    }
    return b.total_points - a.total_points;
  });
  const winner = sortedScores[0];
  const second = sortedScores[1];
  const third = sortedScores[2];

  return (
    <div className="min-h-screen flex flex-col bg-[#07050f] text-slate-100 pb-12">
      <Navbar />

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Risultati Finali</span>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">
            I VERDETTI DELLA NOTTE
          </h2>
          <p className="text-xs text-slate-400">
            {isMissionCountMode
              ? 'La partita è conclusa. Ecco chi ha completato più sfide e conquistato la vetta.'
              : 'La partita è conclusa. Ecco chi ha dominato e chi ha fallito con onore.'}
          </p>
        </div>

        {/* Podium */}
        <div className="pt-6 pb-2">
          <div className="grid grid-cols-3 gap-2 items-end justify-center text-center">
            {/* 2nd Place */}
            {second && (
              <div className="flex flex-col items-center">
                <span className="text-3xl mb-1">{getAvatarEmoji(second.avatar_seed)}</span>
                <p className="text-xs font-bold text-white truncate max-w-[85px]">{second.nickname}</p>
                <span className="text-[11px] text-slate-400 font-semibold">
                  {isMissionCountMode ? `${second.completed_count} Missioni` : `${second.total_points} PT`}
                </span>
                <div className="w-full h-20 mt-2 bg-gradient-to-t from-slate-800 to-slate-700/80 rounded-t-2xl border-t border-slate-600 flex items-center justify-center font-black text-slate-300 text-xl shadow-lg">
                  2
                </div>
              </div>
            )}

            {/* 1st Place */}
            {winner && (
              <div className="flex flex-col items-center">
                <Crown className="w-6 h-6 text-amber-400 mb-1 animate-bounce" />
                <span className="text-4xl mb-1">{getAvatarEmoji(winner.avatar_seed)}</span>
                <p className="text-sm font-black text-amber-300 truncate max-w-[95px]">{winner.nickname}</p>
                <span className="text-xs text-rose-400 font-black">
                  {isMissionCountMode ? `${winner.completed_count} Missioni 🎯` : `${winner.total_points} PT`}
                </span>
                <div className="w-full h-28 mt-2 bg-gradient-to-t from-amber-900/60 via-amber-600/40 to-amber-500/30 rounded-t-2xl border-t-2 border-amber-400 flex items-center justify-center font-black text-amber-300 text-3xl shadow-xl shadow-amber-950/50">
                  1
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {third && (
              <div className="flex flex-col items-center">
                <span className="text-3xl mb-1">{getAvatarEmoji(third.avatar_seed)}</span>
                <p className="text-xs font-bold text-white truncate max-w-[85px]">{third.nickname}</p>
                <span className="text-[11px] text-slate-400 font-semibold">
                  {isMissionCountMode ? `${third.completed_count} Missioni` : `${third.total_points} PT`}
                </span>
                <div className="w-full h-14 mt-2 bg-gradient-to-t from-amber-950 to-amber-900/60 rounded-t-2xl border-t border-amber-800 flex items-center justify-center font-black text-amber-600 text-lg shadow-md">
                  3
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Ironic Awards Section */}
        {awards.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Award className="w-4 h-4 text-rose-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Titoli & Premi Ironici della Serata
              </span>
            </div>

            <div className="space-y-2.5">
              {awards.map((award) => (
                <div
                  key={award.id}
                  className="p-4 rounded-3xl bg-gradient-to-r from-[#17112c] to-[#0e0a1c] border border-white/10 shadow-lg space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-rose-400">
                      {award.title}
                    </span>
                    <span className="text-xs font-bold text-white px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10">
                      {award.recipient_nickname}
                    </span>
                  </div>
                  <p className="text-xs italic text-amber-300/90">&ldquo;{award.tagline}&rdquo;</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{award.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Stats */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1 block">
            {isMissionCountMode ? 'Tutte le Sfide Completate' : 'Tutti i Punteggi'}
          </span>
          <div className="space-y-1.5">
            {sortedScores.map((sc, idx) => (
              <div
                key={sc.id}
                className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-slate-500 font-bold w-4">#{idx + 1}</span>
                  <span className="text-lg">{getAvatarEmoji(sc.avatar_seed)}</span>
                  <span className="font-bold text-white">{sc.nickname}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-slate-400">
                    {sc.completed_count} completate
                    {typeof sc.skips_used === 'number' && sc.skips_used > 0 && ` (${sc.skips_used} cambi)`}
                  </span>
                  <span className="font-black text-rose-400">
                    {isMissionCountMode ? `${sc.completed_count} 🎯` : `${sc.total_points} PT`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Host Reopened Lobby Notification Banner (per i non-host) */}
        {hostReopenedLobby && room && room.host_id !== myPlayerId && (
          <div className="p-4 rounded-3xl bg-gradient-to-r from-rose-950/80 via-purple-950/70 to-slate-900 border-2 border-rose-500 text-center space-y-2 shadow-2xl animate-pulse">
            <div className="flex items-center justify-center gap-1.5 text-rose-300 font-extrabold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-rose-400 animate-spin" />
              <span>Nuova Partita Pronta!</span>
            </div>
            <p className="text-xs text-slate-200">
              L'Host ha riportato tutti nella lobby della stanza <span className="font-mono font-black text-rose-300">{room.code}</span>.
            </p>
            <button
              onClick={() => {
                triggerHaptic('medium');
                sounds.playSuccess();
                router.push(`/room/${room.code}`);
              }}
              className="w-full py-3 rounded-2xl btn-game-rose text-white font-black text-xs uppercase tracking-wider shadow-lg cursor-pointer"
            >
              Entra nella Lobby Ora &rarr;
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 space-y-2.5">
          {/* 1. SE HOST: Riporta tutti nella lobby per una nuova partita */}
          {room && room.host_id === myPlayerId && (
            <button
              type="button"
              disabled={isReplaying}
              onClick={handleHostReplay}
              className="w-full py-4 rounded-3xl btn-game-rose text-white font-black text-sm tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer shadow-2xl transition-transform active:scale-98"
            >
              <RotateCcw className={`w-5 h-5 ${isReplaying ? 'animate-spin' : ''}`} />
              <span>
                {isReplaying ? 'Riapertura Lobby...' : `Rimani nella Lobby & Nuova Partita (${room.code})`}
              </span>
            </button>
          )}

          {/* 2. SE NON HOST: Torna alla stessa stanza */}
          {room && room.host_id !== myPlayerId && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                sounds.playClick();
                router.push(`/room/${room.code}`);
              }}
              className="w-full py-3.5 rounded-3xl bg-gradient-to-r from-rose-900/40 to-purple-900/40 hover:from-rose-900/60 hover:to-purple-900/60 border border-rose-500/40 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-xl transition-all"
            >
              <Users className="w-4 h-4 text-rose-400" />
              <span>Rimani nella Stanza ({room.code})</span>
            </button>
          )}

          {/* 3. Crea nuova stanza da zero */}
          <Link
            href="/create"
            onClick={() => {
              triggerHaptic('medium');
              sounds.playClick();
            }}
            className="w-full py-3 rounded-3xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <span>Crea Nuova Stanza da Zero</span>
          </Link>

          {/* 4. Torna alla Home */}
          <Link
            href="/"
            onClick={() => {
              triggerHaptic('light');
              sounds.playClick();
            }}
            className="w-full py-2.5 text-slate-400 hover:text-white font-semibold text-xs tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Home className="w-3.5 h-3.5 text-slate-400" />
            <span>Torna alla Home</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
