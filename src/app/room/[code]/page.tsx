'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Crown,
  Play,
  QrCode,
  Copy,
  Check,
  Clock,
  Sparkles,
  Wifi,
  AlertCircle,
  Shield,
  LogIn,
  User,
  Target,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { QrCodeModal } from '@/components/QrCodeModal';
import { AvatarPicker, getAvatarEmoji } from '@/components/AvatarPicker';
import { Room, RoomMember } from '@/types/game';
import {
  getOrCreatePlayerSession,
  updatePlayerNickname,
  updatePlayerAvatar,
} from '@/lib/session/player';
import { triggerHaptic } from '@/lib/haptics/vibration';
import { sounds } from '@/lib/audio/sound';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export default function RoomLobbyPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const roomCode = resolvedParams.code.toUpperCase();

  const [room, setRoom] = useState<Room | null>(null);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [myPlayerId, setMyPlayerId] = useState('');
  const [joinNickname, setJoinNickname] = useState('');
  const [joinAvatar, setJoinAvatar] = useState('ghost');
  const [isJoiningDirect, setIsJoiningDirect] = useState(false);
  const [missionsPerPlayer, setMissionsPerPlayer] = useState<number>(3);

  const fetchRoomState = useCallback(async () => {
    try {
      const res = await fetch(`/api/rooms/${roomCode}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Stanza non trovata');
      }

      setRoom(data.room);
      setMembers(data.members || []);
      if (data.room?.missions_per_player) {
        setMissionsPerPlayer((prev) => (prev !== 3 ? prev : data.room.missions_per_player));
      }

      // Se la partita è già iniziata, naviga direttamente alla HUD di gioco!
      if (data.gameId && (data.gameStatus === 'active' || data.room?.status === 'playing')) {
        sounds.playSuccess();
        router.push(`/game/${data.gameId}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Errore nel caricamento';
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  }, [roomCode, router]);

  useEffect(() => {
    const session = getOrCreatePlayerSession();
    setMyPlayerId(session.playerId);
    setJoinNickname(session.nickname);
    setJoinAvatar(session.avatarSeed);

    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      const urlTasks = Number(sp.get('tasks'));
      if (urlTasks >= 1 && urlTasks <= 5) {
        setMissionsPerPlayer(urlTasks);
      }
    }

    fetchRoomState();

    // Polling periodico ogni 2.5 secondi per garantire sincronizzazione ovunque
    const interval = setInterval(fetchRoomState, 2500);

    // Se Supabase Realtime è attivo, ascolta i cambiamenti in tempo reale
    let channel: RealtimeChannel | null = null;
    if (isSupabaseConfigured && supabase) {
      channel = supabase
        .channel(`room_${roomCode}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'room_members' },
          () => fetchRoomState()
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'rooms', filter: `code=eq.${roomCode}` },
          () => fetchRoomState()
        )
        .subscribe();
    }

    return () => {
      clearInterval(interval);
      if (channel && supabase) {
        (supabase as NonNullable<typeof supabase>).removeChannel(channel);
      }
    };
  }, [roomCode, fetchRoomState]);

  const handleCopyCode = () => {
    triggerHaptic('light');
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartGame = async () => {
    if (!room || isStarting) return;
    setErrorMsg('');
    setIsStarting(true);
    triggerHaptic('medium');

    try {
      const res = await fetch('/api/games/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode,
          hostPlayerId: myPlayerId,
          missionsPerPlayer,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Impossibile avviare la partita');
      }

      sounds.playSuccess();
      router.push(`/game/${data.game.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Errore nell\'avvio';
      setErrorMsg(message);
      setIsStarting(false);
    }
  };

  const handleDirectJoin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!joinNickname.trim()) {
      setErrorMsg('Inserisci un nickname prima di entrare.');
      triggerHaptic('warning');
      return;
    }

    setIsJoiningDirect(true);
    triggerHaptic('medium');

    try {
      const session = updatePlayerNickname(joinNickname.trim());
      updatePlayerAvatar(joinAvatar);

      const res = await fetch('/api/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: roomCode,
          playerId: session.playerId,
          nickname: joinNickname.trim(),
          avatarSeed: joinAvatar,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Impossibile entrare nella stanza');
      }

      sounds.playSuccess();
      triggerHaptic('success');
      await fetchRoomState();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Errore imprevisto';
      setErrorMsg(message);
    } finally {
      setIsJoiningDirect(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#07050f] text-slate-100">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400">Accesso alla stanza {roomCode}...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex flex-col bg-[#07050f] text-slate-100">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-6 text-center space-y-4">
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-3xl max-w-sm">
            <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
            <h3 className="text-lg font-bold text-white">Stanza Non Trovata</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              {errorMsg || 'Il codice inserito potrebbe essere scaduto o errato.'}
            </p>
            <button
              onClick={() => router.push('/')}
              className="py-2.5 px-6 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition-colors"
            >
              Torna alla Home
            </button>
          </div>
        </main>
      </div>
    );
  }

  const isHost = room.host_id === myPlayerId;
  const isMember = members.some((m) => m.player_id === myPlayerId);
  const canStart = members.length >= room.min_players;

  return (
    <div className="min-h-screen flex flex-col bg-[#07050f] text-slate-100 pb-12">
      <Navbar />

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-4 space-y-5">
        {/* Room Header Card */}
        <div className="rounded-3xl bg-gradient-to-b from-[#151028] to-[#0c0818] border border-white/10 p-5 shadow-2xl relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-rose-400 font-bold block mb-0.5">
                Lobby di Attesa
              </span>
              <h2 className="text-2xl font-black text-white tracking-tight">{room.group_name}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 border border-white/10 text-slate-300 font-semibold uppercase">
                  {room.mode}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {room.duration_minutes > 0 ? `${room.duration_minutes} min` : '∞ Senza tempo'}
                </span>
                <span className="text-xs text-rose-300 flex items-center gap-1 font-semibold bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                  <Target className="w-3.5 h-3.5 text-rose-400" />
                  {missionsPerPlayer} task
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                triggerHaptic('light');
                setIsQrOpen(true);
              }}
              className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-rose-400 hover:text-white transition-colors shadow-lg"
              title="Mostra QR Code"
            >
              <QrCode className="w-6 h-6" />
            </button>
          </div>

          {/* Room Code Banner */}
          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between bg-black/40 p-3 rounded-2xl">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                Codice da Condividere
              </span>
              <p className="text-2xl font-black tracking-widest text-white">{roomCode}</p>
            </div>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-xs font-bold text-rose-300 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copiato!' : 'Copia'}</span>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 font-medium">
            {errorMsg}
          </div>
        )}

        {/* Connected Members Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-rose-400" />
              <span className="text-xs uppercase tracking-wider font-bold text-slate-300">
                Partecipanti Connessi ({members.length}/{room.max_players})
              </span>
            </div>
            <span className="text-[11px] text-slate-500">
              Minimo richiesto: {room.min_players}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {members.map((member) => {
              const isMe = member.player_id === myPlayerId;
              return (
                <div
                  key={member.id}
                  className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-all ${
                    isMe
                      ? 'bg-rose-500/10 border-rose-500/40 shadow-md shadow-rose-950/30'
                      : 'bg-white/[0.03] border-white/10'
                  }`}
                >
                  <span className="text-2xl">{getAvatarEmoji(member.avatar_seed)}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <p className="text-xs font-bold text-white truncate">{member.nickname}</p>
                      {member.is_host && (
                        <span title="Host della stanza" className="inline-flex">
                          <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {isMe ? 'Tu' : 'Pronto'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {members.length < room.min_players && (
            <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                In attesa di almeno altri {room.min_players - members.length} giocatori per iniziare.
              </span>
            </div>
          )}
        </div>

        {/* Task Selector for Host */}
        {isHost && (
          <div className="p-4 rounded-3xl bg-gradient-to-b from-[#140e28] to-[#0d091a] border border-white/10 shadow-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-500/20 flex items-center justify-center">
                  <Target className="w-4 h-4 text-rose-400" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Task a Testa per Giocatore</span>
                  <span className="text-[10px] text-slate-400">Regolabile solo dall&apos;Host prima di avviare</span>
                </div>
              </div>
              <span className="text-xs font-black text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
                {missionsPerPlayer} {missionsPerPlayer === 1 ? 'task' : 'task'}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1.5 pt-1">
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
                    className={`py-2 px-1 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-rose-500/30 border-rose-500 text-white shadow-lg shadow-rose-950/40 ring-2 ring-rose-400/50 scale-[1.03]'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <div className="text-sm font-black leading-none">{item.label}</div>
                    <div className="text-[8px] mt-1 text-slate-400 font-semibold truncate">
                      {item.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {!isHost && (
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-rose-400" />
              <span>Missioni a testa previste:</span>
            </span>
            <span className="font-bold text-white bg-rose-500/15 text-rose-300 px-2.5 py-0.5 rounded-full border border-rose-500/20">
              {missionsPerPlayer} {missionsPerPlayer === 1 ? 'missione' : 'missioni'}
            </span>
          </div>
        )}

        {/* Start Game Action */}
        <div className="pt-2">
          {isHost ? (
            <button
              onClick={handleStartGame}
              disabled={!canStart || isStarting}
              className="w-full py-4 rounded-3xl btn-game-rose disabled:opacity-40 text-white font-black text-base tracking-wider uppercase shadow-2xl flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current filter drop-shadow" />
              <span>
                {isStarting
                  ? 'Assegnazione Missioni...'
                  : canStart
                  ? 'Inizia la Serata!'
                  : `In attesa di giocatori (${members.length}/${room.min_players})`}
              </span>
            </button>
          ) : (
            <div className="p-4 rounded-3xl bg-white/5 border border-white/10 text-center space-y-1">
              <p className="text-xs font-bold text-slate-200">In attesa che l&apos;Host avvii la partita...</p>
              <p className="text-[11px] text-slate-400">
                Riceverai le tue missioni segrete appena la partita comincia!
              </p>
            </div>
          )}
        </div>
      </main>

      {/* DIRECT LINK INVITATION MODAL */}
      {!isMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm bg-[#120e24] border border-rose-500/40 rounded-3xl p-6 shadow-2xl space-y-4 text-center relative overflow-hidden">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto text-2xl shadow-lg">
              ✨
            </div>

            <div>
              <span className="text-[10px] uppercase tracking-widest text-rose-400 font-extrabold block">
                Link Invito Diretto
              </span>
              <h3 className="text-xl font-black text-white">Unisciti alla Partita</h3>
              <p className="text-xs text-slate-300 mt-1">
                Sei stato invitato nella stanza <strong className="text-white">{room.group_name}</strong>!
              </p>
            </div>

            <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center gap-3 text-xs text-slate-400">
              <span className="capitalize text-slate-200 font-semibold">{room.mode}</span>
              <span>•</span>
              <span>{room.duration_minutes > 0 ? `${room.duration_minutes} min` : '∞ Senza tempo'}</span>
              <span>•</span>
              <span className="font-mono text-rose-400 font-bold">{roomCode}</span>
            </div>

            <form onSubmit={handleDirectJoin} className="space-y-4 pt-1 text-left">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Il tuo Nickname per la serata
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={18}
                    value={joinNickname}
                    onChange={(e) => setJoinNickname(e.target.value)}
                    placeholder="Es. Ghost, Cobra, Regina..."
                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/5 border border-white/15 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
                  />
                  <User className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Segno Distintivo
                </label>
                <AvatarPicker selected={joinAvatar} onSelect={setJoinAvatar} />
              </div>

              <button
                type="submit"
                disabled={isJoiningDirect || !joinNickname.trim()}
                className="w-full py-4 rounded-3xl btn-game-rose disabled:opacity-40 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-xl"
              >
                <LogIn className="w-4 h-4" />
                <span>{isJoiningDirect ? 'Accesso in corso...' : 'Entra Subito nella Partita'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      <QrCodeModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        roomCode={roomCode}
      />
    </div>
  );
}
