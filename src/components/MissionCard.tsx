'use client';

import React, { useState } from 'react';
import { PlayerMission } from '@/types/game';
import {
  Shield,
  Eye,
  EyeOff,
  CheckCircle2,
  Clock,
  Users,
  Flame,
  Award,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { sounds } from '@/lib/audio/sound';
import { triggerHaptic } from '@/lib/haptics/vibration';

const DIFFICULTY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  facile: { bg: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-400', label: 'Facile' },
  media: { bg: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-400', label: 'Media' },
  difficile: { bg: 'bg-rose-500/10 border-rose-500/30', text: 'text-rose-400', label: 'Difficile' },
  leggendaria: { bg: 'bg-purple-500/20 border-purple-500/50 shadow-purple-950/50', text: 'text-purple-300 font-bold', label: 'Leggendaria' },
};

const CATEGORY_ICONS: Record<string, string> = {
  socializzazione: '🤝',
  osservazione: '🔍',
  deduzione: '🧠',
  persuasione: '🎭',
  creativita: '🎨',
  collaborazione: '👥',
  bluff: '🃏',
  chaos: '⚡',
  jeffrey_island: '🌴',
};

export function MissionCard({
  playerMission,
  requireWitness = false,
  hideTasks = true,
  onCompleteRequest,
}: {
  playerMission: PlayerMission;
  requireWitness?: boolean;
  hideTasks?: boolean;
  onCompleteRequest: (mission: PlayerMission) => void;
}) {
  const [isRevealed, setIsRevealed] = useState(!hideTasks);
  const mission = playerMission.mission;

  if (!mission) return null;

  const diffStyle = DIFFICULTY_STYLES[mission.difficulty] || DIFFICULTY_STYLES.media;
  const isCompleted = playerMission.status === 'completed';
  const isPending = playerMission.status === 'pending_verification';
  const isFailed = playerMission.status === 'failed';

  const toggleReveal = () => {
    const next = !isRevealed;
    setIsRevealed(next);
    triggerHaptic(next ? 'medium' : 'light');
    if (next) sounds.playReveal();
  };

  return (
    <div
      className={`relative rounded-3xl border transition-all duration-300 overflow-hidden ${
        isCompleted
          ? 'bg-gradient-to-b from-emerald-950/30 to-black/80 border-emerald-500/50 shadow-emerald-950/30'
          : isPending
          ? 'bg-gradient-to-b from-amber-950/30 to-black/80 border-amber-500/50 shadow-amber-950/30 animate-pulse'
          : 'card-party border-white/15 shadow-2xl'
      }`}
    >
      {/* Top Banner Badges */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/30">
        <div className="flex items-center gap-2">
          <span className="text-xl" title={mission.category}>
            {CATEGORY_ICONS[mission.category] || '🎯'}
          </span>
          <span className="text-xs uppercase tracking-wider text-rose-300 font-extrabold">
            {mission.category === 'jeffrey_island' ? 'Jeffrey Island 🔥' : mission.category}
          </span>
          {mission.gender_target && mission.gender_target !== 'neutro' && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {mission.gender_target === 'uomo' ? '♂️ Solo Uomo' : '♀️ Solo Donna'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-xs px-2.5 py-0.5 rounded-full border ${diffStyle.bg} ${diffStyle.text}`}>
            {diffStyle.label}
          </span>
          <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300">
            +{mission.base_points} PT
          </span>
        </div>
      </div>

      {/* Main Body */}
      <div className="p-5">
        {/* Coop Partner Badge */}
        {playerMission.coop_partner_nickname && (
          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-gradient-to-r from-purple-950/60 to-pink-950/60 border border-purple-500/40 text-purple-200 text-xs font-semibold mb-3 shadow-lg shadow-purple-950/40">
            <Users className="w-4 h-4 text-purple-300 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] uppercase tracking-wider text-purple-400 font-bold block">
                Missione di Squadra Condivisa
              </span>
              <p className="text-xs text-white truncate">
                In coppia/trio con: <strong className="text-pink-300 font-extrabold">{playerMission.coop_partner_nickname}</strong>
              </p>
            </div>
          </div>
        )}

        {/* Title */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-lg font-bold text-white tracking-tight">
            {isRevealed || isCompleted || !hideTasks ? (
              <span>{mission.title}</span>
            ) : (
              <span className="flex items-center gap-2 text-slate-400 font-mono tracking-widest text-sm">
                <span>🔒 ••••••••••••••••</span>
                <span className="text-[9px] text-rose-400 font-bold uppercase tracking-wider font-sans bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                  Coperta
                </span>
              </span>
            )}
          </h3>

          {!isCompleted && !isPending && (
            <button
              onClick={toggleReveal}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-rose-400" />}
              <span>{isRevealed ? 'Nascondi' : 'Rivela'}</span>
            </button>
          )}
        </div>

        {/* Confidential Mission Content Shield */}
        {isRevealed || isCompleted || !hideTasks ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-200 leading-relaxed bg-black/40 p-3.5 rounded-2xl border border-white/5">
              {mission.description}
            </p>

            {mission.special_conditions && mission.special_conditions.length > 0 && (
              <div className="flex items-start gap-2 text-xs text-amber-300/90 bg-amber-950/20 p-2.5 rounded-xl border border-amber-500/20">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <span>{mission.special_conditions.join(' ')}</span>
              </div>
            )}
          </div>
        ) : (
          <div
            onClick={toggleReveal}
            role="button"
            tabIndex={0}
            className="cursor-pointer group flex flex-col items-center justify-center p-6 rounded-2xl bg-black/50 border border-dashed border-white/15 hover:border-rose-500/40 transition-all select-none"
          >
            <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Shield className="w-5 h-5 text-rose-400" />
            </div>
            <p className="text-sm font-semibold text-slate-200">
              Missione Segreta Protetta
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Tocca per scoprire titolo e obiettivo (non farti sbirciare!)
            </p>
          </div>
        )}

        {/* Mission Metadata pills */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/5 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>~{mission.estimated_duration_minutes} min</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span>
              {mission.target_participants === 1
                ? 'Solo tu'
                : `${mission.target_participants} partecipanti`}
            </span>
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-[11px] text-slate-500">
              {!requireWitness || mission.verification_type === 'self_timer'
                ? '⚡ Auto-conferma'
                : 'Testimone richiesto'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 bg-black/40 border-t border-white/5 flex items-center justify-between">
        {isCompleted ? (
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
            <CheckCircle2 className="w-5 h-5" />
            <span>Completata! (+{playerMission.earned_points} PT)</span>
          </div>
        ) : isPending ? (
          <div className="flex items-center gap-2 text-amber-400 text-sm">
            <Clock className="w-4 h-4 animate-spin" />
            <span>In attesa della conferma del testimone...</span>
          </div>
        ) : isFailed ? (
          <div className="flex items-center gap-2 text-rose-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>Non confermata dal testimone</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              triggerHaptic('medium');
              onCompleteRequest(playerMission);
            }}
            className="w-full py-3.5 px-4 rounded-2xl btn-game-rose text-white font-black text-sm tracking-wide uppercase flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-rose-950/40"
          >
            <CheckCircle2 className="w-5 h-5 filter drop-shadow" />
            <span>{!requireWitness ? 'Completa Missione ⚡' : 'Richiedi Testimone'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
