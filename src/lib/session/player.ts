'use client';

import { PlayerSession } from '@/types/game';

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

export function getOrCreatePlayerSession(initialNickname?: string): PlayerSession {
  if (typeof window === 'undefined') {
    return {
      playerId: 'server_dummy_id',
      nickname: initialNickname || 'Ospite',
      avatarSeed: 'shadow',
    };
  }

  const existing = localStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) {
    try {
      const parsed: PlayerSession = JSON.parse(existing);
      if (initialNickname && initialNickname !== parsed.nickname) {
        parsed.nickname = initialNickname;
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(parsed));
      }
      return parsed;
    } catch {
      // Fallback
    }
  }

  // Generate new anonymous identity
  const newPlayerId = 'usr_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
  const randomAvatar = AVATAR_SEEDS[Math.floor(Math.random() * AVATAR_SEEDS.length)];
  const session: PlayerSession = {
    playerId: newPlayerId,
    nickname: initialNickname || 'Giocatore_' + Math.floor(100 + Math.random() * 900),
    avatarSeed: randomAvatar,
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
