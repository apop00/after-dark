'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  AlertTriangle,
  Flame,
  Clock,
  Eye,
  EyeOff,
  CheckCircle2,
  Play,
  Pause,
  RotateCcw,
  VolumeX,
  PhoneCall,
  MessageSquare,
  Crown,
  Languages,
  Activity,
  Smile,
  Megaphone,
  Globe,
  Dog,
  Cat,
  PauseCircle,
  Skull,
} from 'lucide-react';
import { PlayerPenalty } from '@/types/game';
import { triggerHaptic } from '@/lib/haptics/vibration';
import { sounds } from '@/lib/audio/sound';

interface PenaltyCardProps {
  penalty: PlayerPenalty | null | undefined;
  hideByDefault?: boolean;
  onComplete?: () => Promise<void> | void;
}

export function PenaltyCard({
  penalty,
  hideByDefault = true,
  onComplete,
}: PenaltyCardProps) {
  const [isRevealed, setIsRevealed] = useState(!hideByDefault);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCompletedLocal, setIsCompletedLocal] = useState(penalty?.status === 'completed');

  // Countdown timer state
  const initialSeconds = (penalty?.duration_minutes || 0) * 60;
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (penalty?.status === 'completed') {
      setIsCompletedLocal(true);
    }
  }, [penalty?.status]);

  useEffect(() => {
    if (isTimerRunning && secondsLeft > 0) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsTimerRunning(false);
            sounds.playSuccess();
            triggerHaptic('success');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, secondsLeft]);

  if (!penalty) return null;

  const isCompleted = isCompletedLocal || penalty.status === 'completed';

  const handleToggleTimer = () => {
    triggerHaptic('light');
    setIsTimerRunning(!isTimerRunning);
  };

  const handleResetTimer = () => {
    triggerHaptic('light');
    setIsTimerRunning(false);
    setSecondsLeft(initialSeconds);
  };

  const handleCompleteAction = async () => {
    if (isCompleted || isCompleting) return;
    setIsCompleting(true);
    triggerHaptic('medium');

    try {
      if (onComplete) {
        await onComplete();
      }
      setIsCompletedLocal(true);
      sounds.playSuccess();
      triggerHaptic('success');
    } catch {
      triggerHaptic('warning');
    } finally {
      setIsCompleting(false);
    }
  };

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getPenaltyIcon = (iconName?: string) => {
    switch (iconName) {
      case 'VolumeX':
        return <VolumeX className="w-5 h-5 text-amber-400" />;
      case 'PauseCircle':
        return <PauseCircle className="w-5 h-5 text-amber-400" />;
      case 'Smile':
        return <Smile className="w-5 h-5 text-amber-400" />;
      case 'PhoneCall':
        return <PhoneCall className="w-5 h-5 text-amber-400" />;
      case 'MessageSquare':
        return <MessageSquare className="w-5 h-5 text-amber-400" />;
      case 'Crown':
        return <Crown className="w-5 h-5 text-amber-400" />;
      case 'Globe':
        return <Globe className="w-5 h-5 text-amber-400" />;
      case 'Megaphone':
        return <Megaphone className="w-5 h-5 text-amber-400" />;
      case 'Languages':
        return <Languages className="w-5 h-5 text-amber-400" />;
      case 'Dog':
        return <Dog className="w-5 h-5 text-amber-400" />;
      case 'Cat':
        return <Cat className="w-5 h-5 text-amber-400" />;
      case 'Activity':
        return <Activity className="w-5 h-5 text-amber-400" />;
      default:
        return <Skull className="w-5 h-5 text-amber-400" />;
    }
  };

  if (isCompleted) {
    return (
      <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between animate-in fade-in">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 block">
              Malus Superato
            </span>
            <p className="text-xs font-bold text-white line-through opacity-75">{penalty.title}</p>
          </div>
        </div>
        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          Eseguita ✓
        </span>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-amber-950/40 via-[#180f08] to-[#120a05] border-2 border-amber-500/60 shadow-xl shadow-amber-950/40 space-y-3.5 p-4 animate-in fade-in">
      {/* Top Banner Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 animate-pulse">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[9px] uppercase font-black tracking-widest text-amber-400 block">
              Modificatore Malus
            </span>
            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5 flex-wrap">
              <span>Penitenza Segreta</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              {penalty.trigger_after_task && (
                <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">
                  dopo task {penalty.trigger_after_task}
                </span>
              )}
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setIsRevealed(!isRevealed);
          }}
          className="flex items-center gap-1 text-[11px] font-bold text-amber-300 hover:text-white bg-amber-500/15 hover:bg-amber-500/25 px-2.5 py-1 rounded-xl border border-amber-500/30 transition-colors cursor-pointer"
        >
          {isRevealed ? (
            <>
              <EyeOff className="w-3.5 h-3.5" />
              <span>Copri</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5" />
              <span>Rivela</span>
            </>
          )}
        </button>
      </div>

      {/* Hidden Shield view */}
      {!isRevealed ? (
        <div
          onClick={() => {
            triggerHaptic('medium');
            setIsRevealed(true);
          }}
          className="cursor-pointer py-6 px-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 border-dashed flex flex-col items-center justify-center text-center space-y-2 hover:bg-amber-950/50 transition-all active:scale-98"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Eye className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <p className="text-xs font-black text-amber-200">Hai una Penitenza Assegnata!</p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Tocca per scoprirla. Assicurati che nessuno stia spiando lo schermo!
            </p>
          </div>
        </div>
      ) : (
        /* Revealed Content */
        <div className="space-y-3 pt-0.5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
              {getPenaltyIcon(penalty.icon)}
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-black text-amber-200">{penalty.title}</h4>
                {penalty.duration_minutes && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{penalty.duration_minutes} min</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                {penalty.description}
              </p>
            </div>
          </div>

          {/* Target Player Highlight (for call / message tasks) */}
          {penalty.target_player_nickname && (
            <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                Giocatore Decisore:
              </span>
              <span className="text-xs font-black text-white bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-500/30">
                🎯 {penalty.target_player_nickname}
              </span>
            </div>
          )}

          {/* Countdown Timer Widget (if duration specified) */}
          {penalty.duration_minutes && penalty.duration_minutes > 0 && (
            <div className="p-3 rounded-2xl bg-black/40 border border-amber-500/30 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                  Timer Penitenza
                </span>
                <span
                  className={`text-2xl font-mono font-black ${
                    secondsLeft === 0
                      ? 'text-emerald-400'
                      : isTimerRunning
                      ? 'text-amber-400'
                      : 'text-slate-200'
                  }`}
                >
                  {formatTimer(secondsLeft)}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleToggleTimer}
                  className={`p-2.5 rounded-xl font-bold flex items-center gap-1 text-xs transition-colors cursor-pointer ${
                    isTimerRunning
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                  }`}
                >
                  {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isTimerRunning ? 'Pausa' : 'Avvia'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetTimer}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
                  title="Resetta Timer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Action Complete Button */}
          <button
            type="button"
            onClick={handleCompleteAction}
            disabled={isCompleting}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-950/50 transition-all cursor-pointer active:scale-98 disabled:opacity-50"
          >
            {isCompleting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Ho Scontato la Penitenza ✓</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
