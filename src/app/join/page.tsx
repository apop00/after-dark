'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, LogIn, Sparkles, Hash, User, Camera, QrCode } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { AvatarPicker } from '@/components/AvatarPicker';
import { QrScannerModal } from '@/components/QrScannerModal';
import {
  getOrCreatePlayerSession,
  updatePlayerNickname,
  updatePlayerAvatar,
} from '@/lib/session/player';
import { triggerHaptic } from '@/lib/haptics/vibration';
import { sounds } from '@/lib/audio/sound';

function JoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [code, setCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [avatarSeed, setAvatarSeed] = useState('ghost');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isDirectInvite, setIsDirectInvite] = useState(false);

  useEffect(() => {
    const session = getOrCreatePlayerSession();
    setNickname(session.nickname);
    setAvatarSeed(session.avatarSeed);

    const queryCode = searchParams.get('code');
    if (queryCode) {
      setCode(queryCode.toUpperCase().trim());
      setIsDirectInvite(true);
    }
  }, [searchParams]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const formattedCode = code.trim().toUpperCase();
    if (!formattedCode || formattedCode.length < 4) {
      setErrorMsg('Inserisci un codice stanza valido (es. DARK42).');
      triggerHaptic('warning');
      return;
    }

    if (!nickname.trim()) {
      setErrorMsg('Inserisci il tuo nickname prima di entrare.');
      triggerHaptic('warning');
      return;
    }

    setIsSubmitting(true);
    triggerHaptic('medium');

    try {
      const session = updatePlayerNickname(nickname);
      updatePlayerAvatar(avatarSeed);

      const res = await fetch('/api/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: formattedCode,
          playerId: session.playerId,
          nickname: nickname.trim(),
          avatarSeed,
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

      {/* QUICK ACTION: INQUADRA QR CODE */}
      <button
        type="button"
        onClick={() => {
          triggerHaptic('medium');
          setIsScannerOpen(true);
        }}
        className="w-full py-4 px-4 rounded-3xl bg-gradient-to-r from-rose-900/40 to-purple-900/40 hover:from-rose-900/60 hover:to-purple-900/60 border border-rose-500/40 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all active:scale-98 shadow-xl cursor-pointer"
      >
        <Camera className="w-5 h-5 text-rose-400 animate-pulse" />
        <span>📷 Inquadra QR Code con Fotocamera</span>
      </button>

      <div className="flex items-center gap-3 my-1 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
        <div className="flex-1 h-px bg-white/10" />
        <span>Oppure scrivi il codice</span>
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

        {/* Nickname Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-300">
            Il tuo Nickname per la serata
          </label>
          <div className="relative">
            <input
              type="text"
              maxLength={18}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Es. Ghost, Cobra, Regina..."
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/5 border border-white/15 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
            />
            <User className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
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

      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onCodeScanned={(scannedCode) => {
          setCode(scannedCode);
          setIsScannerOpen(false);
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
