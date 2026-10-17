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
  AlertCircle,
  Lock,
  RefreshCw,
  XCircle,
  Flame,
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
  isLocked = false,
  lockedStep,
  totalSteps,
  scoringMode = 'points',
  skipsRemaining = 0,
  onCompleteRequest,
  onSkipRequest,
  onFailRequest,
  isSkipping = false,
  isFailing = false,
}: {
  playerMission: PlayerMission;
  requireWitness?: boolean;
  hideTasks?: boolean;
  isLocked?: boolean;
  lockedStep?: number;
  totalSteps?: number;
  scoringMode?: 'points' | 'mission_count';
  skipsRemaining?: number;
  onCompleteRequest: (mission: PlayerMission, isDoublePoints?: boolean) => void;
  onSkipRequest?: (mission: PlayerMission) => void;
  onFailRequest?: (mission: PlayerMission) => void;
  isSkipping?: boolean;
  isFailing?: boolean;
}) {
  const [isRevealed, setIsRevealed] = useState(!hideTasks);
  const [isDoublePointsChecked, setIsDoublePointsChecked] = useState(false);
  const mission = playerMission.mission;

  if (isLocked) {
    return (
      <div className="relative rounded-3xl border border-white/10 bg-black/40 backdrop-blur-sm overflow-hidden p-5 shadow-lg select-none opacity-80">
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-400" />
            <span className="text-xs uppercase tracking-wider text-slate-400 font-extrabold">
              {lockedStep && totalSteps ? `Tappa ${lockedStep} di ${totalSteps}` : 'Tappa Successiva'}
            </span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400">
            🔒 Bloccata
          </span>
        </div>

        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-3 text-slate-500">
            <Lock className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-white mb-1">Missione Bloccata</h4>
          <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
            Completa o cambia la missione precedente per sbloccare e scoprire questa sfida!
          </p>
        </div>
      </div>
    );
  }

  if (!mission) return null;

  const diffStyle = DIFFICULTY_STYLES[mission.difficulty] || DIFFICULTY_STYLES.media;
  const isCompleted = playerMission.status === 'completed';
  const isPending = playerMission.status === 'pending_verification';
  const isFailed = playerMission.status === 'failed';
  const isCoop = Boolean(playerMission.coop_partner_id || mission.category === 'collaborazione');
  const hasDoublePoints = Boolean(
    mission.allow_double_points ||
    mission.special_conditions?.some((c) => c.toLowerCase().includes('doppi'))
  );

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
          : isFailed
          ? 'bg-gradient-to-b from-rose-950/20 to-black/80 border-rose-500/40 opacity-80'
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
          {lockedStep && totalSteps && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
              Tappa {lockedStep}/{totalSteps}
            </span>
          )}
          <span className={`text-xs px-2.5 py-0.5 rounded-full border ${diffStyle.bg} ${diffStyle.text}`}>
            {diffStyle.label}
          </span>
          {scoringMode === 'points' ? (
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300">
              +{mission.base_points} PT
            </span>
          ) : (
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-violet-500/20 border border-violet-500/40 text-violet-300">
              🎯 Sfida
            </span>
          )}
        </div>
      </div>

      {/* Main Body */}
      <div className="p-5">
        {/* Coop Partner Badge */}
        {(playerMission.coop_partner_nickname || isCoop) && (
          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-gradient-to-r from-purple-950/60 to-pink-950/60 border border-purple-500/40 text-purple-200 text-xs font-semibold mb-3 shadow-lg shadow-purple-950/40">
            <Users className="w-4 h-4 text-purple-300 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] uppercase tracking-wider text-purple-400 font-bold block">
                  Missione di Squadra Condivisa
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30 shrink-0">
                  Non skippabile 🔒
                </span>
              </div>
              <p className="text-xs text-white truncate mt-0.5">
                In coppia con: <strong className="text-pink-300 font-extrabold">{playerMission.coop_partner_nickname || 'Compagno di Squadra'}</strong>
              </p>
              <p className="text-[10px] text-purple-300/80 mt-0.5">
                ⚡ Basta che uno dei due la completi per finirla entrambi!
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

            {/* Toggle Condizione Punti Doppi */}
            {hasDoublePoints && !isCompleted && !isPending && !isFailed && (
              <div
                onClick={() => {
                  triggerHaptic('light');
                  setIsDoublePointsChecked(!isDoublePointsChecked);
                }}
                role="button"
                tabIndex={0}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 select-none ${
                  isDoublePointsChecked
                    ? 'bg-gradient-to-r from-amber-950/60 to-yellow-950/60 border-amber-500/70 shadow-lg shadow-amber-950/40 text-amber-200'
                    : 'bg-white/5 border-white/10 hover:border-amber-500/30 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                      isDoublePointsChecked ? 'bg-amber-400 text-black' : 'bg-white/10 text-amber-300'
                    }`}
                  >
                    2x
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-white flex items-center gap-1.5">
                      <span>Condizione Punti Doppi</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                        +{mission.base_points * 2} PT
                      </span>
                    </p>
                    <p className="text-[10px] text-amber-300/80 leading-tight mt-0.5 truncate">
                      {mission.special_conditions?.[0] || 'Attiva se hai soddisfatto la condizione per raddoppiare!'}
                    </p>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-md border flex items-center justify-center text-xs shrink-0 transition-colors ${
                    isDoublePointsChecked
                      ? 'bg-amber-400 border-amber-300 text-black font-extrabold'
                      : 'border-white/20 bg-black/40'
                  }`}
                >
                  {isDoublePointsChecked ? '✓' : ''}
                </div>
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
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <div className="flex items-center gap-1.5 flex-wrap">
              <span>
                Completata! {scoringMode === 'points' ? `(+${playerMission.earned_points} PT)` : '✓'}
              </span>
              {Boolean(playerMission.is_double_points || playerMission.earned_points >= mission.base_points * 2) && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 inline-flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-400" />
                  <span>2x Punti Doppi</span>
                </span>
              )}
            </div>
          </div>
        ) : isPending ? (
          <div className="flex items-center gap-2 text-amber-400 text-sm">
            <Clock className="w-4 h-4 animate-spin shrink-0" />
            <span>In attesa della conferma del testimone...</span>
          </div>
        ) : isFailed ? (
          <div className="flex items-center gap-2 text-rose-400 text-sm font-semibold">
            <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>Missione fallita / non riuscita (0 PT)</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 w-full">
            {skipsRemaining > 0 && onSkipRequest && !isCoop && (
              <button
                type="button"
                disabled={isSkipping || isFailing}
                onClick={() => {
                  triggerHaptic('light');
                  onSkipRequest(playerMission);
                }}
                className="py-3.5 px-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-slate-200 hover:text-white font-bold text-xs uppercase flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 shrink-0 cursor-pointer"
                title={`Cambia questa missione (${skipsRemaining} cambi rimasti)`}
              >
                <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isSkipping ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Cambia ({skipsRemaining})</span>
                <span className="sm:hidden">({skipsRemaining})</span>
              </button>
            )}

            {onFailRequest && (
              <button
                type="button"
                disabled={isSkipping || isFailing}
                onClick={() => {
                  triggerHaptic('light');
                  onFailRequest(playerMission);
                }}
                className="py-3.5 px-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:text-rose-200 font-bold text-xs uppercase flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 shrink-0 cursor-pointer"
                title="Dichiara la missione fallita (0 punti)"
              >
                <XCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>Fallita</span>
              </button>
            )}

            <button
              type="button"
              disabled={isSkipping || isFailing}
              onClick={() => {
                triggerHaptic('medium');
                onCompleteRequest(playerMission, isDoublePointsChecked);
              }}
              className={`flex-1 py-3.5 px-4 rounded-2xl font-black text-sm tracking-wide uppercase flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all ${
                isDoublePointsChecked
                  ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 text-white shadow-amber-950/50 hover:brightness-110'
                  : 'btn-game-rose text-white shadow-rose-950/40'
              }`}
            >
              <CheckCircle2 className="w-5 h-5 filter drop-shadow shrink-0" />
              <span>
                {!requireWitness
                  ? isDoublePointsChecked
                    ? `Completa 2x (+${mission.base_points * 2} PT) 🔥`
                    : 'Completa Missione ⚡'
                  : isDoublePointsChecked
                  ? 'Testimone (2x Doppi) 🔥'
                  : 'Richiedi Testimone'}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
