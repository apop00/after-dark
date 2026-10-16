'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  LogIn,
  Sparkles,
  Hash,
  User,
  Camera,
  Globe,
  Users,
  Clock,
  RefreshCw,
  Plus,
  Flame,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { AvatarPicker } from '@/components/AvatarPicker';
import { QrScannerModal } from '@/components/QrScannerModal';
import { GameMode, PlayerGender } from '@/types/game';
import {
  getOrCreatePlayerSession,
  updatePlayerNickname,
  updatePlayerAvatar,
  updatePlayerGender,
} from '@/lib/session/player';
import { triggerHaptic } from '@/lib/haptics/vibration';
import { sounds } from '@/lib/audio/sound';

interface PublicRoom {
  id: string;
  code: string;
  group_name: string;
  mode: GameMode;
  host_nickname: string;
  host_avatar: string;
  members_count: number;
  max_players: number;
  created_at: string;
  expires_in_seconds: number;
  enable_gender_missions?: boolean;
  include_jeffrey_pack?: boolean;
}

const MODE_LABELS: Record<GameMode, { label: string; icon: string; badgeClass: string }> = {
  jeffrey_island: {
    label: 'Jeffrey Island 🔥',
    icon: '🌴',
    badgeClass: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40',
  },
  bar: {
    label: 'Bar & Cocktail',
    icon: '🍸',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
  house_party: {
    label: 'House Party',
    icon: '🏠',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  },
  discoteca: {
    label: 'Discoteca & Club',
    icon: '🪩',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  },
  outdoor: {
    label: "All'aperto",
    icon: '🌙',
    badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  },
  chaos: {
    label: 'Chaos Mode',
    icon: '⚡',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  },
};

function formatSeconds(sec: number) {
  if (sec <= 0) return 'Scaduta';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function JoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<'public' | 'code'>('public');
  const [code, setCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [avatarSeed, setAvatarSeed] = useState('ghost');
  const [gender, setGender] = useState<PlayerGender>('neutro');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isDirectInvite, setIsDirectInvite] = useState(false);

  // Public lobbies state
  const [publicRooms, setPublicRooms] = useState<PublicRoom[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isRefreshingRooms, setIsRefreshingRooms] = useState(false);

  const fetchPublicRooms = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshingRooms(true);
    try {
      const res = await fetch('/api/rooms/public', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setPublicRooms(data.rooms || []);
      }
    } catch {
      // Ignora errori di fetch silenziosamente
    } finally {
      setIsLoadingRooms(false);
      if (isManual) setIsRefreshingRooms(false);
    }
  }, []);

  useEffect(() => {
    const session = getOrCreatePlayerSession();
    setNickname(session.nickname);
    setAvatarSeed(session.avatarSeed);
    setGender(session.gender || 'neutro');

    const queryCode = searchParams.get('code');
    if (queryCode) {
      setCode(queryCode.toUpperCase().trim());
      setIsDirectInvite(true);
      setActiveTab('code');
    }

    fetchPublicRooms();
    const pollInterval = setInterval(() => fetchPublicRooms(), 4000);
    return () => clearInterval(pollInterval);
  }, [searchParams, fetchPublicRooms]);

  // Countdown timer locale per le lobby pubbliche
  useEffect(() => {
    const timer = setInterval(() => {
      setPublicRooms((prev) =>
        prev
          .map((r) => ({ ...r, expires_in_seconds: r.expires_in_seconds - 1 }))
          .filter((r) => r.expires_in_seconds > 0)
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleJoinWithCode = async (targetCode: string) => {
    setErrorMsg('');
    const formattedCode = targetCode.trim().toUpperCase();
    if (!formattedCode || formattedCode.length < 4) {
      setErrorMsg('Inserisci un codice stanza valido.');
      triggerHaptic('warning');
      return;
    }

    if (!nickname.trim()) {
      setCode(formattedCode);
      setActiveTab('code');
      setErrorMsg('Inserisci il tuo nickname per entrare.');
      triggerHaptic('warning');
      return;
    }

    setIsSubmitting(true);
    triggerHaptic('medium');

    try {
      const session = updatePlayerNickname(nickname);
      updatePlayerAvatar(avatarSeed);
      updatePlayerGender(gender);

      const res = await fetch('/api/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: formattedCode,
          playerId: session.playerId,
          nickname: nickname.trim(),
          avatarSeed,
          gender,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Impossibile entrare nella stanza');
      }

      sounds.playSuccess();
      router.push(`/room/${formattedCode}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Errore imprevisto';
      setErrorMsg(message);
      setIsSubmitting(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleJoinWithCode(code);
  };

  return (
    <main className="flex-1 max-w-md w-full mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Indietro</span>
        </button>
        <span className="text-xs uppercase tracking-widest text-rose-400 font-bold">
          Accesso Rapido
        </span>
      </div>

      <div className="text-center space-y-1.5">
        <h2 className="text-3xl font-black tracking-tight text-white">Unisciti alla Partita</h2>
        <p className="text-xs text-slate-400">
          Inquadra il QR code con la fotocamera o inserisci il codice della stanza.
        </p>
      </div>

      {isDirectInvite && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-950/40 via-purple-950/30 to-slate-900 border border-rose-500/30 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-rose-400 font-extrabold block">
              Invito Diretto Rilevato
            </span>
            <p className="text-xs text-slate-200">
              Pronto a entrare nella stanza <span className="font-mono font-black text-rose-300">{code}</span>
            </p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 font-medium">
          {errorMsg}
        </div>
      )}

      {/* TABS: LOBBY PUBBLICHE vs CODICE / QR */}
      <div className="grid grid-cols-2 p-1 rounded-2xl bg-white/5 border border-white/10 gap-1">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('public');
          }}
          className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'public'
              ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-lg shadow-rose-950/50'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Lobby Pubbliche</span>
          {publicRooms.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-white text-rose-700 font-extrabold leading-none">
              {publicRooms.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setActiveTab('code');
          }}
          className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'code'
              ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-lg shadow-rose-950/50'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Hash className="w-3.5 h-3.5" />
          <span>Codice / QR</span>
        </button>
      </div>

      {/* QUICK PROFILE SETTINGS (Sempre visibile per essere pronti a entrare) */}
      <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
            La tua Identità di Gioco
          </span>
          <span className="text-[10px] text-slate-400">
            {gender === 'uomo' ? '♂️ Uomo' : gender === 'donna' ? '♀️ Donna' : '👤 Neutro'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              maxLength={18}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Il tuo Nickname..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors font-medium"
            />
            <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          <div className="flex gap-1 shrink-0">
            {(['neutro', 'uomo', 'donna'] as PlayerGender[]).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setGender(g);
                }}
                className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  gender === g
                    ? 'bg-rose-500/25 border-rose-500 text-white shadow-sm ring-1 ring-rose-400/40'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
                title={g === 'neutro' ? 'Neutro (tutti)' : g === 'uomo' ? 'Uomo' : 'Donna'}
              >
                {g === 'neutro' ? '👤' : g === 'uomo' ? '♂️' : '♀️'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TAB 1: LOBBY PUBBLICHE APERTE */}
      {activeTab === 'public' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Lobby Aperte
              </span>
            </div>
            <button
              type="button"
              onClick={() => fetchPublicRooms(true)}
              disabled={isRefreshingRooms}
              className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingRooms ? 'animate-spin text-rose-400' : ''}`} />
              <span>Aggiorna</span>
            </button>
          </div>

          {isLoadingRooms ? (
            <div className="p-8 text-center text-xs text-slate-400 rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse">
              Ricerca stanze aperte in corso...
            </div>
          ) : publicRooms.length === 0 ? (
            <div className="p-6 text-center rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-400">
                <Globe className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">Nessuna stanza pubblica aperta</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Le stanze in attesa si chiudono automaticamente dopo 5 minuti se la partita non parte. Crea la tua stanza e invita i compagni!
                </p>
              </div>
              <div className="pt-2 flex flex-col gap-2">
                <Link
                  href="/create"
                  className="w-full py-3 rounded-2xl btn-game-rose text-white font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crea una Stanza Pubblica</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setActiveTab('code')}
                  className="text-xs text-slate-400 hover:text-slate-200 py-1 transition-colors cursor-pointer"
                >
                  Hai un codice privato? Inseriscilo qui &rarr;
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {publicRooms.map((room) => {
                const modeInfo = MODE_LABELS[room.mode] || {
                  label: room.mode,
                  icon: '🍸',
                  badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
                };
                const isExpiringSoon = room.expires_in_seconds < 60;

                return (
                  <div
                    key={room.id}
                    className="p-3.5 rounded-2xl bg-gradient-to-br from-white/[0.05] via-white/[0.02] to-transparent border border-white/15 hover:border-rose-500/40 transition-all space-y-2.5 shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${modeInfo.badgeClass} flex items-center gap-1`}
                          >
                            <span>{modeInfo.icon}</span>
                            <span>{modeInfo.label}</span>
                          </span>
                          {room.include_jeffrey_pack && room.mode !== 'jeffrey_island' && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
                              +Jeffrey Pack 🔥
                            </span>
                          )}
                          {room.enable_gender_missions && (
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              Missioni ♂/♀
                            </span>
                          )}
                        </div>
                        <h4 className="font-extrabold text-sm text-white truncate">
                          {room.group_name}
                        </h4>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono font-black text-rose-300 text-sm tracking-wider bg-rose-500/10 px-2 py-1 rounded-lg border border-rose-500/20 block">
                          {room.code}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-white/5">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-[11px] text-slate-300">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>{room.members_count}/{room.max_players}</span>
                        </span>
                        <span className="text-[11px] text-slate-400 truncate max-w-[110px]">
                          Host: <span className="text-slate-200 font-semibold">{room.host_nickname}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px]">
                        <Clock className={`w-3.5 h-3.5 ${isExpiringSoon ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
                        <span className={`font-mono font-bold ${isExpiringSoon ? 'text-amber-300' : 'text-slate-300'}`}>
                          {formatSeconds(room.expires_in_seconds)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleJoinWithCode(room.code)}
                      className="w-full py-2.5 rounded-xl btn-game-rose text-white font-extrabold text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-transform active:scale-98"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>{isSubmitting ? 'Accesso...' : 'Entra Subito'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INSERISCI CODICE / QR */}
      {activeTab === 'code' && (
        <div className="space-y-4">
          {/* QUICK ACTION: INQUADRA QR CODE */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('medium');
              setIsScannerOpen(true);
            }}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-rose-900/40 to-purple-900/40 hover:from-rose-900/60 hover:to-purple-900/60 border border-rose-500/40 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all active:scale-98 shadow-xl cursor-pointer"
          >
            <Camera className="w-5 h-5 text-rose-400 animate-pulse" />
            <span>📷 Inquadra QR Code</span>
          </button>

          <div className="flex items-center gap-3 my-1 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
            <div className="flex-1 h-px bg-white/10" />
            <span>Oppure digita il codice</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={handleJoin} className="space-y-4">
            {/* Code Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Codice Stanza (6 caratteri)
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={8}
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="DARK42"
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/5 border border-white/15 text-white font-mono font-bold tracking-widest text-lg placeholder-slate-600 focus:outline-none focus:border-rose-500 uppercase transition-colors"
                />
                <Hash className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Avatar Picker */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Scegli il tuo Segno Distintivo
              </label>
              <AvatarPicker selected={avatarSeed} onSelect={setAvatarSeed} />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-3xl btn-game-rose disabled:opacity-40 text-white font-black text-base tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer shadow-2xl"
            >
              <LogIn className="w-5 h-5 filter drop-shadow" />
              <span>{isSubmitting ? 'Accesso in corso...' : 'Entra nella Stanza'}</span>
            </button>
          </form>
        </div>
      )}

      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onCodeScanned={(scannedCode) => {
          setCode(scannedCode);
          setIsScannerOpen(false);
          setActiveTab('code');
        }}
      />
    </main>
  );
}

export default function JoinPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#07050f] text-slate-100 pb-10">
      <Navbar />
      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Caricamento...</div>}>
        <JoinContent />
      </Suspense>
    </div>
  );
}
