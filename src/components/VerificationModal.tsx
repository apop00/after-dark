'use client';

import React, { useState } from 'react';
import { PlayerMission, MissionVerification, RoomMember } from '@/types/game';
import { Check, X, Shield, Users, AlertTriangle } from 'lucide-react';
import { triggerHaptic } from '@/lib/haptics/vibration';
import { sounds } from '@/lib/audio/sound';
import { getAvatarEmoji } from './AvatarPicker';

export function WitnessSelectModal({
  isOpen,
  onClose,
  mission,
  candidates,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  mission: PlayerMission | null;
  candidates: { playerId: string; nickname: string; avatarSeed: string }[];
  onSubmit: (verifierPlayerId: string) => void;
}) {
  const [selectedId, setSelectedId] = useState<string>('');

  if (!isOpen || !mission) return null;

  const handleConfirm = () => {
    if (!selectedId) return;
    triggerHaptic('medium');
    onSubmit(selectedId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-sm bg-[#120e24] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
            <Users className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Scegli il Testimone</h3>
            <p className="text-xs text-slate-400">Chi può confermare la tua missione?</p>
          </div>
        </div>

        <p className="text-sm text-slate-300 bg-white/5 p-3 rounded-2xl border border-white/5">
          Stai completando: <strong className="text-white">{mission.mission?.title}</strong>.
          Il testimone riceverà una richiesta di verifica sul suo telefono.
        </p>

        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {candidates.map((c) => (
            <button
              key={c.playerId}
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setSelectedId(c.playerId);
              }}
              className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all ${
                selectedId === c.playerId
                  ? 'bg-rose-500/20 border-rose-500 text-white shadow-lg shadow-rose-950/40'
                  : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{getAvatarEmoji(c.avatarSeed)}</span>
                <span className="font-semibold text-sm">{c.nickname}</span>
              </div>
              {selectedId === c.playerId && <Check className="w-4 h-4 text-rose-400" />}
            </button>
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-sm transition-colors"
          >
            Annulla
          </button>
          <button
            type="button"
            disabled={!selectedId}
            onClick={handleConfirm}
            className="flex-1 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold text-sm transition-colors shadow-lg shadow-rose-950/50"
          >
            Invia Richiesta
          </button>
        </div>
      </div>
    </div>
  );
}

export function IncomingVerificationDrawer({
  verification,
  requesterNickname,
  onResolve,
}: {
  verification: MissionVerification;
  requesterNickname: string;
  onResolve: (verificationId: string, approved: boolean, note?: string) => void;
}) {
  const [note, setNote] = useState('');

  const handleDecision = (approved: boolean) => {
    triggerHaptic(approved ? 'success' : 'warning');
    if (approved) sounds.playSuccess();
    onResolve(verification.id, approved, note);
  };

  return (
    <div className="rounded-3xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-[#181028] to-purple-950/40 p-5 shadow-2xl space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
          <Shield className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h4 className="font-bold text-white text-sm">Richiesta di Testimonianza</h4>
          <p className="text-xs text-amber-300/80">Sei stato scelto come testimone</p>
        </div>
      </div>

      <p className="text-sm text-slate-200">
        <strong className="text-rose-400">{requesterNickname}</strong> dichiara di aver completato
        la sua missione con te o davanti a te.
      </p>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={() => handleDecision(false)}
          className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-rose-950/30 border border-white/10 text-rose-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          <X className="w-4 h-4" />
          <span>Nego / Non visto</span>
        </button>

        <button
          type="button"
          onClick={() => handleDecision(true)}
          className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-emerald-950/50"
        >
          <Check className="w-4 h-4" />
          <span>Confermo!</span>
        </button>
      </div>
    </div>
  );
}
