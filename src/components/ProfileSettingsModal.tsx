'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Dices,
  Sparkles,
  Check,
  Volume2,
  VolumeX,
  Vibrate,
  ShieldCheck,
  RefreshCw,
  Info,
  SlidersHorizontal,
} from 'lucide-react';
import { AvatarPicker, getAvatarEmoji } from '@/components/AvatarPicker';
import { PlayerGender, PlayerSession } from '@/types/game';
import {
  getOrCreatePlayerSession,
  updatePlayerNickname,
  updatePlayerAvatar,
  updatePlayerGender,
  updatePlayerSound,
  updatePlayerHaptic,
  resetPlayerIdentity,
  getGenderEmoji,
  getGenderLabel,
} from '@/lib/session/player';
import { sounds } from '@/lib/audio/sound';
import { triggerHaptic } from '@/lib/haptics/vibration';

const RANDOM_NICKNAMES = [
  'Viper',
  'Ghost',
  'Regina del Caos',
  'Il Barone',
  'L\'Infiltrato',
  'Cobra',
  'Night Owl',
  'Mister X',
  'Maestro del Bluff',
  'Ombra',
  'Vendetta',
  'Fenice',
  'Sirena',
  'Il Boss',
  'Agente 00',
  'Calamity',
  'Profeta',
  'Banshee',
  'Lupo Solitario',
  'Zero',
  'Tempesta',
  'Joker',
  'Elektra',
  'Illusionista',
];

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: (session: PlayerSession) => void;
}

export function ProfileSettingsModal({
  isOpen,
  onClose,
  onProfileUpdated,
}: ProfileSettingsModalProps) {
  const [nickname, setNickname] = useState('');
  const [avatarSeed, setAvatarSeed] = useState('shadow');
  const [gender, setGender] = useState<PlayerGender>('neutro');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [playerId, setPlayerId] = useState('');
  const [activeTab, setActiveTab] = useState<'identity' | 'settings'>('identity');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      const session = getOrCreatePlayerSession();
      setNickname(session.nickname);
      setAvatarSeed(session.avatarSeed);
      setGender(session.gender || 'neutro');
      setSoundEnabled(session.soundEnabled !== false && !sounds.getMuted());
      setHapticEnabled(session.hapticEnabled !== false);
      setPlayerId(session.playerId);
      setShowResetConfirm(false);
      setErrorMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRandomNickname = () => {
    triggerHaptic('light');
    sounds.playClick();
    const random = RANDOM_NICKNAMES[Math.floor(Math.random() * RANDOM_NICKNAMES.length)];
    setNickname(random);
  };

  const handleToggleSound = (enabled: boolean) => {
    setSoundEnabled(enabled);
    sounds.setMuted(!enabled);
    triggerHaptic('light');
    if (enabled) {
      sounds.playClick();
    }
  };

  const handleToggleHaptic = (enabled: boolean) => {
    setHapticEnabled(enabled);
    updatePlayerHaptic(enabled);
    if (enabled) {
      triggerHaptic('medium');
    }
  };

  const handleResetIdentity = () => {
    triggerHaptic('warning');
    const newSession = resetPlayerIdentity();
    setNickname(newSession.nickname);
    setAvatarSeed(newSession.avatarSeed);
    setGender(newSession.gender || 'neutro');
    setPlayerId(newSession.playerId);
    setShowResetConfirm(false);
    onProfileUpdated?.(newSession);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNick = nickname.trim();
    if (!cleanNick) {
      setErrorMsg('Inserisci un nickname valido per giocare.');
      return;
    }

    triggerHaptic('success');
    sounds.playSuccess();

    updatePlayerNickname(cleanNick);
    updatePlayerAvatar(avatarSeed);
    updatePlayerGender(gender);
    updatePlayerSound(soundEnabled);
    updatePlayerHaptic(hapticEnabled);
    sounds.setMuted(!soundEnabled);

    const updatedSession: PlayerSession = {
      playerId,
      nickname: cleanNick,
      avatarSeed,
      gender,
      soundEnabled,
      hapticEnabled,
    };

    onProfileUpdated?.(updatedSession);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-sm sm:max-w-md bg-[#110d22] border border-rose-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-10 bg-gradient-to-b from-rose-500/20 to-transparent blur-xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-300">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                Profilo & Preferenze
              </h2>
              <p className="text-[11px] text-slate-400">
                Personalizza la tua identità e il gioco
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            type="button"
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Clean Segmented Control Tabs */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-white/5 rounded-2xl border border-white/10 my-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('identity');
            }}
            className={`py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'identity'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Identità Giocatore
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('settings');
            }}
            className={`py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Impostazioni & App
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1 py-1">
          {activeTab === 'identity' ? (
            <>
              {/* Nickname with Random Generator */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">
                    Nickname nella Serata
                  </label>
                  <button
                    type="button"
                    onClick={handleRandomNickname}
                    className="text-[11px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors active:scale-95 cursor-pointer"
                  >
                    <Dices className="w-3.5 h-3.5" />
                    <span>Nome a Sorpresa 🎲</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    maxLength={18}
                    value={nickname}
                    onChange={(e) => {
                      setNickname(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    placeholder="Es. Ghost, Viper, Il Barone..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-black/60 border border-white/20 text-white placeholder-slate-500 text-sm font-bold focus:outline-none focus:border-rose-500 transition-colors"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                </div>

                {errorMsg && (
                  <p className="text-[11px] text-rose-400 font-bold">{errorMsg}</p>
                )}
              </div>

              {/* Avatar Selector */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">
                    Avatar di Riconoscimento
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {getAvatarEmoji(avatarSeed)} Selezionato
                  </span>
                </div>
                <AvatarPicker selected={avatarSeed} onSelect={setAvatarSeed} />
              </div>

              {/* Gender Preference for Missions */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">
                    Filtro Missioni (Genere)
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Missioni speciali dedicate
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { val: 'neutro', label: 'Neutro 👤', desc: 'Per chiunque' },
                    { val: 'uomo', label: 'Uomo ♂️', desc: 'Include sfide uomo' },
                    { val: 'donna', label: 'Donna ♀️', desc: 'Include sfide donna' },
                  ] as { val: PlayerGender; label: string; desc: string }[]).map((g) => {
                    const isSelected = gender === g.val;
                    return (
                      <button
                        key={g.val}
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          setGender(g.val);
                        }}
                        className={`p-2 rounded-2xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-rose-500/25 border-rose-500 text-white shadow-md ring-2 ring-rose-400/40 scale-[1.02]'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <div className="text-xs font-black">{g.label}</div>
                        <div className="text-[9px] text-slate-400 mt-0.5 truncate">{g.desc}</div>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Di base tutte le missioni sono neutre. Scegliendo Uomo o Donna riceverai anche missioni esclusive quando abilitate dall&apos;host.
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Feedback Preferences */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-300 block">
                    Effetti & Feedback
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Regola audio e risposte tattili per le tue partite.
                  </p>
                </div>

                {/* Sound Switch */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300">
                      {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Effetti Sonori</div>
                      <div className="text-[10px] text-slate-400">Suoni click, reveal e vittoria</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleSound(!soundEnabled)}
                    className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer ${
                      soundEnabled ? 'bg-rose-600' : 'bg-white/20'
                    }`}
                  >
                    <span
                      className={`block w-5 h-5 rounded-full bg-white shadow transform transition-transform ${
                        soundEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Haptic Switch */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-300">
                      <Vibrate className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Vibrazione Aptica</div>
                      <div className="text-[10px] text-slate-400">Feedback tattile su smartphone</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleHaptic(!hapticEnabled)}
                    className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer ${
                      hapticEnabled ? 'bg-rose-600' : 'bg-white/20'
                    }`}
                  >
                    <span
                      className={`block w-5 h-5 rounded-full bg-white shadow transform transition-transform ${
                        hapticEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Session Identity Info & Reset */}
              <div className="pt-2 border-t border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>ID Anonimo Locale</span>
                  </span>
                  <span className="font-mono text-[10px] text-slate-500 truncate max-w-[140px]">
                    {playerId.slice(0, 8)}...{playerId.slice(-4)}
                  </span>
                </div>

                {showResetConfirm ? (
                  <div className="p-3 rounded-2xl bg-rose-950/60 border border-rose-500/40 space-y-2 text-center animate-in fade-in">
                    <p className="text-xs font-bold text-rose-200">
                      Vuoi resettare la tua identità e generarne una nuova?
                    </p>
                    <div className="flex gap-2 justify-center">
                      <button
                        type="button"
                        onClick={handleResetIdentity}
                        className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer"
                      >
                        Sì, Resetta
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowResetConfirm(false)}
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                      >
                        Annulla
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(true)}
                    className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Genera Nuova Identità da Zero</span>
                  </button>
                )}
              </div>
            </>
          )}

          {/* Bottom Save Actions */}
          <div className="pt-3 border-t border-white/10 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-bold transition-colors text-center cursor-pointer"
            >
              Annulla
            </button>

            <button
              type="submit"
              disabled={!nickname.trim()}
              className="w-2/3 py-3 rounded-2xl btn-game-rose disabled:opacity-40 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-98 transition-all"
            >
              <Check className="w-4 h-4 filter drop-shadow" />
              <span>Salva Modifiche</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
