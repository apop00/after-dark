'use client';

import React, { useState, useEffect, useCallback, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Trophy,
  Flame,
  Clock,
  Sparkles,
  Users,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { MissionCard } from '@/components/MissionCard';
import { PenaltyCard } from '@/components/PenaltyCard';
import { WitnessSelectModal, IncomingVerificationDrawer } from '@/components/VerificationModal';
import { getAvatarEmoji } from '@/components/AvatarPicker';
import {
  Game,
  PlayerMission,
  MissionVerification,
  PlayerScore,
  GameEvent,
  PlayerPenalty,
} from '@/types/game';
import { getOrCreatePlayerSession } from '@/lib/session/player';
import { triggerHaptic } from '@/lib/haptics/vibration';
import { sounds } from '@/lib/audio/sound';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export default function GameHUDPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const gameId = resolvedParams.id;

  const [game, setGame] = useState<Game | null>(null);
  const [myMissions, setMyMissions] = useState<PlayerMission[]>([]);
  const [myPenalty, setMyPenalty] = useState<PlayerPenalty | null>(null);
  const [scores, setScores] = useState<PlayerScore[]>([]);
  const [activeEvents, setActiveEvents] = useState<GameEvent[]>([]);
  const [pendingVerifications, setPendingVerifications] = useState<MissionVerification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'missions' | 'leaderboard' | 'chaos'>('missions');
  const [myPlayerId, setMyPlayerId] = useState('');
  const [timeLeftStr, setTimeLeftStr] = useState<string>('--:--');
  const [skipsRemaining, setSkipsRemaining] = useState<number>(0);
  const [isSkippingMissionId, setIsSkippingMissionId] = useState<string | null>(null);

  // Modal states
  const [selectedMissionToComplete, setSelectedMissionToComplete] = useState<PlayerMission | null>(null);
  const [isWitnessModalOpen, setIsWitnessModalOpen] = useState(false);

  // Verifiche in ingresso in cui questo giocatore è il testimone designato
  const incomingVerifications = pendingVerifications.filter(
    (v) => v.verifier_player_id === myPlayerId && v.status === 'pending'
  );
  const prevIncomingCountRef = useRef(0);

  // Suono e vibrazione immediata all'arrivo di una nuova richiesta di testimonianza
  useEffect(() => {
    if (incomingVerifications.length > prevIncomingCountRef.current) {
      sounds.playChaosAlert();
      triggerHaptic('warning');
    }
    prevIncomingCountRef.current = incomingVerifications.length;
  }, [incomingVerifications.length]);

  // Suono e vibrazione immediata quando scatta la penitenza a sorpresa a metà partita
  const prevPenaltyActiveRef = useRef(false);
  useEffect(() => {
    if (myPenalty && myPenalty.status === 'active' && !prevPenaltyActiveRef.current) {
      sounds.playChaosAlert();
      triggerHaptic('warning');
    }
    prevPenaltyActiveRef.current = Boolean(myPenalty && myPenalty.status === 'active');
  }, [myPenalty]);

  const fetchGameState = useCallback(async () => {
    try {
      const session = getOrCreatePlayerSession();
      const res = await fetch(`/api/games/${gameId}/state`, {
        headers: {
          'x-player-id': session.playerId,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Errore nel caricamento della partita');
      }

      setGame(data.game);
      // Deduplicazione difensiva sul frontend: nessuna missione duplicata per lo stesso giocatore
      const rawMissions: PlayerMission[] = data.myMissions || [];
      const seenMissionIds = new Set<string>();
      const uniqueMissions = rawMissions.filter((pm) => {
        if (!pm.mission_id) return true;
        if (seenMissionIds.has(pm.mission_id)) return false;
        seenMissionIds.add(pm.mission_id);
        return true;
      });
      setMyMissions(uniqueMissions);
      setMyPenalty(data.myPenalty || null);
      setScores(data.scores || []);
      setActiveEvents(data.activeEvents || []);
      setPendingVerifications(data.pendingVerifications || []);
      if (typeof data.skipsRemaining === 'number') {
        setSkipsRemaining(data.skipsRemaining);
      }

      // Se la partita è terminata, reindirizza alla schermata Podio & Risultati!
      if (data.game?.status === 'completed') {
        sounds.playSuccess();
        router.push(`/game/${gameId}/results`);
      }
    } catch {
      // Background retry
    } finally {
      setIsLoading(false);
    }
  }, [gameId, router]);

  const handleCompletePenalty = async () => {
    try {
      const session = getOrCreatePlayerSession();
      const res = await fetch('/api/penalties/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId,
          playerId: session.playerId,
        }),
      });
      if (res.ok) {
        sounds.playSuccess();
        triggerHaptic('success');
        await fetchGameState();
      }
    } catch {
      // Non-critical
    }
  };

  useEffect(() => {
    const session = getOrCreatePlayerSession();
    setMyPlayerId(session.playerId);

    fetchGameState();

    // Sincronizzazione Realtime / Polling ogni 2.5s
    const pollInterval = setInterval(fetchGameState, 2500);

    // Supabase Realtime Channel
    let channel: RealtimeChannel | null = null;
    if (isSupabaseConfigured && supabase) {
      channel = supabase
        .channel(`game_${gameId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'player_missions' },
          () => fetchGameState()
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'mission_verifications' },
          () => fetchGameState()
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'scores' },
          () => fetchGameState()
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'game_events' },
          () => fetchGameState()
        )
        .subscribe();
    }

    return () => {
      clearInterval(pollInterval);
      if (channel && supabase) {
        (supabase as NonNullable<typeof supabase>).removeChannel(channel);
      }
    };
  }, [gameId, fetchGameState]);

  // Sincronizzazione Timer basata su ends_at del Server
  useEffect(() => {
    if (!game) return;
    if (!game.ends_at) {
      setTimeLeftStr('∞ Senza limiti');
      return;
    }

    const timer = setInterval(() => {
      const remainingMs = new Date(game.ends_at!).getTime() - Date.now();
      if (remainingMs <= 0) {
        setTimeLeftStr('TEMPO SCADUTO');
        clearInterval(timer);
        // Conclude la partita automaticamente
        fetch(`/api/games/${gameId}/finish`, { method: 'POST' }).then(() => {
          router.push(`/game/${gameId}/results`);
        });
      } else {
        const mins = Math.floor(remainingMs / 60000);
        const secs = Math.floor((remainingMs % 60000) / 1000);
        setTimeLeftStr(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [game, gameId, router]);

  // Completamento missione
  const handleInitiateComplete = (pm: PlayerMission) => {
    // Se la stanza è in modalità auto-conferma o la missione è self_timer, completa subito senza testimone!
    if (!game?.config?.require_witness || pm.mission?.verification_type === 'self_timer') {
      executeCompletion(pm.id);
    } else {
      setSelectedMissionToComplete(pm);
      setIsWitnessModalOpen(true);
    }
  };

  const executeCompletion = async (playerMissionId: string, verifierPlayerId?: string) => {
    triggerHaptic('medium');
    try {
      const res = await fetch('/api/missions/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId,
          playerMissionId,
          requesterPlayerId: myPlayerId,
          verifierPlayerId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.playerMission.status === 'completed') {
        sounds.playSuccess();
      }
      fetchGameState();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Errore';
      alert(message);
    }
  };

  const handleSkipMission = async (pm: PlayerMission) => {
    if (!confirm(`Vuoi davvero cambiare questa missione? Consumerai 1 dei tuoi ${skipsRemaining} cambi totali per l'intera partita.`)) {
      return;
    }
    triggerHaptic('medium');
    setIsSkippingMissionId(pm.id);
    try {
      const res = await fetch('/api/missions/skip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId,
          playerMissionId: pm.id,
          playerId: myPlayerId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Impossibile cambiare la missione');
      }

      sounds.playSuccess();
      triggerHaptic('success');
      if (typeof data.skipsRemaining === 'number') {
        setSkipsRemaining(data.skipsRemaining);
      }
      await fetchGameState();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Errore nel cambio missione';
      alert(msg);
    } finally {
      setIsSkippingMissionId(null);
    }
  };

  // Risoluzione verifica testimonianza
  const handleResolveVerification = async (
    verificationId: string,
    approved: boolean,
    note?: string
  ) => {
    try {
      const res = await fetch('/api/missions/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId,
          verificationId,
          verifierPlayerId: myPlayerId,
          approved,
          note,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      fetchGameState();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Errore';
      alert(message);
    }
  };

  // Trigger Chaos Event
  const handleTriggerChaos = async () => {
    triggerHaptic('chaos');
    sounds.playChaosAlert();
    try {
      await fetch('/api/events/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId,
          type: 'double_points',
          title: 'DOPPIO PUNTEGGIO ORA!',
          description: 'Tutte le missioni convalidate nei prossimi 5 minuti valgono x2 punti!',
          multiplier: 2.0,
          durationMinutes: 5,
        }),
      });
      fetchGameState();
    } catch {
      // Non-critical
    }
  };

  const handleFinishEarly = async () => {
    if (!confirm('Vuoi davvero concludere la partita e passare ai risultati finali?')) return;
    triggerHaptic('medium');
    try {
      await fetch(`/api/games/${gameId}/finish`, { method: 'POST' });
      router.push(`/game/${gameId}/results`);
    } catch {
      // Handled
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#07050f] text-slate-100">
        <Navbar showRules={false} />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400">Caricamento missioni segrete...</p>
          </div>
        </main>
      </div>
    );
  }

  // Candidati testimoni (tutti i giocatori tranne se stesso)
  const witnessCandidates = scores
    .filter((s) => s.player_id !== myPlayerId)
    .map((s) => ({ playerId: s.player_id, nickname: s.nickname, avatarSeed: s.avatar_seed }));

  // Trova il mio punteggio attuale
  const myScore = scores.find((s) => s.player_id === myPlayerId);

  return (
    <div className="min-h-screen flex flex-col bg-[#07050f] text-slate-100 pb-20">
      <Navbar showRules={true} />

      {/* Top Game Bar */}
      <div className="bg-[#100c22] border-b border-white/10 px-4 py-2.5">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30">
              {game?.config.mode}
            </span>
            {game?.config?.progression_mode === 'sequential' && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" title="Catena di sfide consecutive">
                Catena 🔗
              </span>
            )}
            <div className="flex items-center gap-1 text-xs text-slate-400 font-medium">
              <Clock className="w-3.5 h-3.5 text-rose-400" />
              <span>{timeLeftStr}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                {game?.config?.scoring_mode === 'mission_count' ? 'Completate' : 'I tuoi Punti'}
              </span>
              <span className="text-sm font-black text-rose-400">
                {game?.config?.scoring_mode === 'mission_count'
                  ? `${myScore ? myScore.completed_count : 0} / ${myMissions.length}`
                  : `${myScore ? myScore.total_points : 0} PT`}
              </span>
            </div>

            <button
              onClick={handleFinishEarly}
              className="text-[11px] px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-colors"
            >
              Termina
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-4 space-y-4">
        {/* Incoming Verification Alert (if someone asked me to witness) */}
        {incomingVerifications.length > 0 && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
            {incomingVerifications.map((v) => {
              const requester = scores.find((s) => s.player_id === v.requester_player_id);
              return (
                <IncomingVerificationDrawer
                  key={v.id}
                  verification={v}
                  requesterNickname={requester?.nickname || 'Un compagno'}
                  onResolve={handleResolveVerification}
                />
              );
            })}
          </div>
        )}

        {/* Active Chaos Events Banner */}
        {activeEvents.map((evt) => (
          <div
            key={evt.id}
            className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-950/60 via-purple-950/60 to-rose-950/60 border border-rose-500/50 shadow-lg shadow-rose-950/50 animate-pulse flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <Zap className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <p className="text-xs font-black text-white uppercase tracking-wider">{evt.title}</p>
                <p className="text-[11px] text-slate-300">{evt.description}</p>
              </div>
            </div>
            <span className="text-xs font-black px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
              x{evt.multiplier}
            </span>
          </div>
        ))}

        {/* Tab Content */}
        {activeTab === 'missions' && (
          <div className="space-y-4">
            {/* Secret Malus / Penalty Card (if assigned) */}
            {myPenalty && (
              <PenaltyCard
                penalty={myPenalty}
                hideByDefault={game?.config?.hide_tasks !== false}
                onComplete={handleCompletePenalty}
              />
            )}

            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {game?.config?.hide_tasks === false ? 'Le tue Missioni' : 'Le tue Missioni Segrete'} ({myMissions.filter((m) => m.status === 'completed').length}/
                {myMissions.length})
              </span>
              <div className="flex items-center gap-2">
                {skipsRemaining > 0 && (
                  <span className="text-[11px] font-semibold text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                    🔄 {skipsRemaining} {skipsRemaining === 1 ? 'skip totale rimasto' : 'skip totali rimasti'}
                  </span>
                )}
                <span className="text-[11px] font-semibold text-rose-300">
                  {game?.config?.hide_tasks === false ? '👁️ Carte Scoperte' : '🛡️ Tieni protetto'}
                </span>
              </div>
            </div>

            {myMissions.length === 0 ? (
              <div className="p-8 text-center bg-white/5 rounded-3xl border border-white/5 text-slate-400 text-xs">
                Nessuna missione attiva al momento.
              </div>
            ) : (
              (() => {
                const isSequential = game?.config?.progression_mode === 'sequential';
                const firstUncompletedIndex = myMissions.findIndex((m) => m.status !== 'completed');
                const activeSequentialIndex = firstUncompletedIndex === -1 ? myMissions.length : firstUncompletedIndex;

                return myMissions.map((pm, index) => {
                  const isLocked = isSequential && index > activeSequentialIndex;
                  return (
                    <MissionCard
                      key={pm.id}
                      playerMission={pm}
                      requireWitness={game?.config?.require_witness ?? false}
                      hideTasks={game?.config?.hide_tasks ?? true}
                      isLocked={isLocked}
                      lockedStep={index + 1}
                      totalSteps={myMissions.length}
                      scoringMode={game?.config?.scoring_mode ?? 'points'}
                      skipsRemaining={skipsRemaining}
                      onCompleteRequest={handleInitiateComplete}
                      onSkipRequest={handleSkipMission}
                      isSkipping={isSkippingMissionId === pm.id}
                    />
                  );
                });
              })()
            )}
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1 block">
              {game?.config?.scoring_mode === 'mission_count'
                ? 'Classifica per Sfide Completate'
                : 'Classifica in Tempo Reale'}
            </span>

            <div className="space-y-2">
              {[...scores]
                .sort((a, b) => {
                  if (game?.config?.scoring_mode === 'mission_count') {
                    if (b.completed_count !== a.completed_count) {
                      return b.completed_count - a.completed_count;
                    }
                    return (a.skips_used ?? 0) - (b.skips_used ?? 0);
                  }
                  return b.total_points - a.total_points;
                })
                .map((sc, rank) => {
                  const isMe = sc.player_id === myPlayerId;
                  const isMissionCount = game?.config?.scoring_mode === 'mission_count';
                  return (
                    <div
                      key={sc.id}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                        isMe
                          ? 'bg-rose-500/10 border-rose-500/40 shadow-lg shadow-rose-950/30'
                          : 'bg-white/[0.03] border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                            rank === 0
                              ? 'bg-amber-400 text-black'
                              : rank === 1
                              ? 'bg-slate-300 text-black'
                              : rank === 2
                              ? 'bg-amber-700 text-white'
                              : 'text-slate-400'
                          }`}
                        >
                          {rank + 1}
                        </span>
                        <span className="text-2xl">{getAvatarEmoji(sc.avatar_seed)}</span>
                        <div>
                          <p className="text-sm font-bold text-white flex items-center gap-1.5">
                            <span>{sc.nickname}</span>
                            {isMe && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300">
                                Tu
                              </span>
                            )}
                          </p>
                          <span className="text-[11px] text-slate-400">
                            {isMissionCount
                              ? `${sc.completed_count} sfide completate${typeof sc.skips_used === 'number' && sc.skips_used > 0 ? ` (${sc.skips_used} cambi)` : ''}`
                              : `${sc.completed_count} missioni completate`}
                          </span>
                        </div>
                      </div>

                      <span className="text-base font-black text-rose-400">
                        {isMissionCount ? `${sc.completed_count} 🎯` : `${sc.total_points} PT`}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {activeTab === 'chaos' && (
          <div className="space-y-4">
            <div className="p-4 rounded-3xl bg-gradient-to-br from-rose-950/40 to-purple-950/40 border border-rose-500/30 text-center space-y-2">
              <Zap className="w-8 h-8 text-rose-400 mx-auto" />
              <h3 className="font-black text-white text-base">SCATENA IL CAOS</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Lancia un evento improvviso che moltiplica i punti o introduce un imprevisto per tutti i partecipanti.
              </p>
              <button
                onClick={handleTriggerChaos}
                type="button"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-rose-950/50 transition-all active:scale-95"
              >
                Attiva Doppio Punteggio (5 min)
              </button>
            </div>

            <div className="p-4 rounded-3xl bg-white/[0.03] border border-white/5 space-y-2 text-xs text-slate-400">
              <h4 className="font-bold text-white">Eventi in arrivo durante la partita:</h4>
              <ul className="space-y-1.5 list-disc list-inside">
                <li>Double Points Rush: moltiplicatore x2 per chi convalida rapidamente</li>
                <li>Obiettivo Collettivo: missione a votazione generale di fine serata</li>
                <li>Conto alla rovescia: bonus lampo a sorpresa</li>
              </ul>
            </div>
          </div>
        )}
      </main>

      {/* Floating Bottom Navigation Dock */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-[#090714]/90 backdrop-blur-md border-t border-white/10 px-4 py-2">
        <div className="max-w-md mx-auto grid grid-cols-3 gap-2">
          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('missions');
            }}
            className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition-all ${
              activeTab === 'missions'
                ? 'bg-rose-500/20 text-rose-400 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Missioni</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('leaderboard');
            }}
            className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition-all ${
              activeTab === 'leaderboard'
                ? 'bg-rose-500/20 text-rose-400 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Classifica</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('chaos');
            }}
            className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition-all ${
              activeTab === 'chaos'
                ? 'bg-rose-500/20 text-rose-400 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Caos</span>
          </button>
        </div>
      </nav>

      {/* Witness Modal */}
      <WitnessSelectModal
        isOpen={isWitnessModalOpen}
        onClose={() => setIsWitnessModalOpen(false)}
        mission={selectedMissionToComplete}
        candidates={witnessCandidates}
        onSubmit={(verifierId) => {
          if (selectedMissionToComplete) {
            executeCompletion(selectedMissionToComplete.id, verifierId);
          }
        }}
      />
    </div>
  );
}
