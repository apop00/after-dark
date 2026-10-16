import { describe, it, expect } from 'vitest';

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://prqgugdieedmixepokse.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBycWd1Z2RpZWVkbWl4ZXBva3NlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwOTgzMzEsImV4cCI6MjEwNzY3NDMzMX0.8SiSRWjlFYF9NvjuYW6XtVRaATvFCeWLqi_6cdFv4es';

import { supabaseStore } from '../src/lib/server/supabaseStore';

const isLiveSupabase = Boolean(process.env.TEST_LIVE_SUPABASE);

describe.skipIf(!isLiveSupabase)('Live Supabase Jeffrey Island Integration Test', () => {
  it('Creates a room in jeffrey_island mode, joins, starts game and verifies missions arrive', async () => {
    const hostId = '00000000-0000-0000-0000-000000000001';
    const guestId = '00000000-0000-0000-0000-000000000002';

    // 1. Create Room
    const { room } = await supabaseStore.createRoom({
      groupName: 'Jeffrey Island Test Party',
      mode: 'jeffrey_island',
      minPlayers: 2,
      maxPlayers: 6,
      durationMinutes: 30,
      missionsPerPlayer: 3,
      allowedDifficulties: ['facile', 'media', 'difficile', 'leggendaria'],
      allowCoop: false,
      hostPlayerId: hostId,
      hostNickname: 'Host Jeffrey',
      hostAvatar: 'cocktail',
    });

    expect(room.mode).toBe('jeffrey_island');
    expect(room.include_jeffrey_pack).toBe(true);

    // 2. Fetch room by code
    const fetched = await supabaseStore.getRoomByCode(room.code);
    expect(fetched.room?.mode).toBe('jeffrey_island');
    expect(fetched.room?.include_jeffrey_pack).toBe(true);

    // 3. Guest joins
    await supabaseStore.joinRoom({
      code: room.code,
      playerId: guestId,
      nickname: 'Guest Party',
      avatarSeed: 'sunglasses',
    });

    // 4. Host starts game
    const { game, missionsAssignedCount } = await supabaseStore.startGame({
      roomCode: room.code,
      hostPlayerId: hostId,
      missionsPerPlayer: 3,
    });

    expect(game.id).toBeDefined();
    expect(missionsAssignedCount).toBe(6); // 2 players x 3 missions

    // 5. Guest checks their game state
    const guestState = await supabaseStore.getGameState(game.id, guestId);
    expect(guestState.myMissions).toHaveLength(3);
    guestState.myMissions.forEach((m) => {
      expect(m.mission).toBeDefined();
      expect(m.mission?.category).toBe('jeffrey_island');
      expect(m.mission?.title).toBeTruthy();
    });

    console.log('SUCCESS! Missions retrieved from Supabase:', guestState.myMissions.map((m) => m.mission?.title));
  }, 15000);
});
