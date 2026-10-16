'use client';

import { PlayerSession, PlayerGender } from '@/types/game';

const SESSION_STORAGE_KEY = 'after_dark_player_session';

const AVATAR_SEEDS = [
  'shadow',
  'viper',
  'ghost',
  'neon',
  'rebel',
  'blaze',
  'fox',
  'raven',
  'wolf',
  'cobra',
  'panther',
  'phoenix',
];

export function getGenderEmoji(gender?: PlayerGender): string {
  if (gender === 'uomo') return '♂️';
  if (gender === 'donna') return '♀️';
  return '👤';
}

export function getGenderLabel(gender?: PlayerGender): string {
  if (gender === 'uomo') return 'Uomo';
  if (gender === 'donna') return 'Donna';
  return 'Neutro';
}

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getOrCreatePlayerSession(initialNickname?: string): PlayerSession {
  if (typeof window === 'undefined') {
    return {
      playerId: '00000000-0000-0000-0000-000000000000',
      nickname: initialNickname || 'Ospite',
      avatarSeed: 'shadow',
      gender: 'neutro',
    };
  }

  const existing = localStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) {
    try {
      const parsed: PlayerSession = JSON.parse(existing);
      let changed = false;

      // Migrate legacy non-UUID IDs (e.g. usr_...)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!parsed.playerId || !uuidRegex.test(parsed.playerId)) {
        parsed.playerId = generateUUID();
        changed = true;
      }

      if (!parsed.gender) {
        parsed.gender = 'neutro';
        changed = true;
      }

      if (parsed.soundEnabled === undefined) {
        parsed.soundEnabled = true;
        changed = true;
      }

      if (parsed.hapticEnabled === undefined) {
        parsed.hapticEnabled = true;
        changed = true;
      }

      if (changed) {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(parsed));
      }
      return parsed;
    } catch {
      // Fallback
    }
  }

  // Generate new anonymous UUID identity
  const newPlayerId = generateUUID();
  const randomAvatar = AVATAR_SEEDS[Math.floor(Math.random() * AVATAR_SEEDS.length)];
  const session: PlayerSession = {
    playerId: newPlayerId,
    nickname: initialNickname || 'Giocatore_' + Math.floor(100 + Math.random() * 900),
    avatarSeed: randomAvatar,
    gender: 'neutro',
    soundEnabled: true,
    hapticEnabled: true,
  };

  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  return session;
}

export function updatePlayerNickname(nickname: string): PlayerSession {
  const session = getOrCreatePlayerSession(nickname);
  session.nickname = nickname.trim();
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }
  return session;
}

export function updatePlayerAvatar(avatarSeed: string): PlayerSession {
  const session = getOrCreatePlayerSession();
  session.avatarSeed = avatarSeed;
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }
  return session;
}

export function updatePlayerGender(gender: PlayerGender): PlayerSession {
  const session = getOrCreatePlayerSession();
  session.gender = gender;
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }
  return session;
}

export function updatePlayerSound(enabled: boolean): PlayerSession {
  const session = getOrCreatePlayerSession();
  session.soundEnabled = enabled;
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }
  return session;
}

export function updatePlayerHaptic(enabled: boolean): PlayerSession {
  const session = getOrCreatePlayerSession();
  session.hapticEnabled = enabled;
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    localStorage.setItem('after_dark_haptic_enabled', enabled ? 'true' : 'false');
  }
  return session;
}

export function resetPlayerIdentity(): PlayerSession {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }
  return getOrCreatePlayerSession();
}
