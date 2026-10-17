import { describe, it, expect } from 'vitest';
import { PENALTIES_DATABASE } from '../src/data/penalties';
import { assignPenaltiesToPlayers } from '../src/lib/game/engine';
import { serverStore } from '../src/lib/server/store';

describe('Modificatore Punizione (Penalties System)', () => {
  it('contains all 12 requested penalties in the catalog', () => {
    expect(PENALTIES_DATABASE.length).toBe(12);

    const ids = PENALTIES_DATABASE.map((p) => p.id);
    expect(ids).toContain('pen_mute');
    expect(ids).toContain('pen_statue');
    expect(ids).toContain('pen_mime');
    expect(ids).toContain('pen_call');
    expect(ids).toContain('pen_message');
    expect(ids).toContain('pen_noble');
    expect(ids).toContain('pen_german');
    expect(ids).toContain('pen_ventennio');
    expect(ids).toContain('pen_no_italian');
    expect(ids).toContain('pen_dog');
    expect(ids).toContain('pen_cat');
    expect(ids).toContain('pen_cramps');
  });

  it('assignPenaltiesToPlayers respects 0% and 100% probabilities', () => {
    const players = [
      { playerId: 'p1', nickname: 'Alice' },
      { playerId: 'p2', nickname: 'Bob' },
      { playerId: 'p3', nickname: 'Charlie' },
    ];

    // 0% probability -> empty
    const none = assignPenaltiesToPlayers(players, 0);
    expect(Object.keys(none).length).toBe(0);

    // 100% probability -> all players get a penalty
    const all = assignPenaltiesToPlayers(players, 100);
    expect(Object.keys(all).length).toBe(3);
    expect(all['p1']).toBeDefined();
    expect(all['p2']).toBeDefined();
    expect(all['p3']).toBeDefined();
    expect(all['p1'].status).toBe('active');
  });

  it('correctly substitutes target player nickname when requires_target_player is true', () => {
    const players = [
      { playerId: 'p1', nickname: 'Alice' },
      { playerId: 'p2', nickname: 'Bob' },
    ];

    // Run multiple rolls to hit a penalty requiring target player (pen_call or pen_message)
    let foundTargetReplacement = false;
    for (let i = 0; i < 50; i++) {
      const assigned = assignPenaltiesToPlayers(players, 100);
      const p1Penalty = assigned['p1'];
      if (p1Penalty.requires_target_player) {
        expect(p1Penalty.target_player_nickname).toBe('Bob');
        expect(p1Penalty.description).toContain('Bob');
        expect(p1Penalty.description).not.toContain('{target_player}');
        foundTargetReplacement = true;
        break;
      }
    }
    expect(foundTargetReplacement).toBe(true);
  });

  it('full store lifecycle: creates room with penalty probability, starts game, assigns penalty, and completes it', () => {
    serverStore.clearAll();

    const { room, member: host } = serverStore.createRoom({
      groupName: 'Stanza Test Malus',
      mode: 'house_party',
      minPlayers: 2,
      maxPlayers: 5,
      durationMinutes: 30,
      allowedDifficulties: ['facile', 'media'],
      allowCoop: false,
      penaltyProbability: 100, // 100% per test
      hostPlayerId: 'player_host',
      hostNickname: 'HostUser',
      hostAvatar: 'shadow',
    });

    expect(room.penalty_probability).toBe(100);

    // Join a second player
    serverStore.joinRoom({
      code: room.code,
      playerId: 'player_2',
      nickname: 'GuestUser',
      avatarSeed: 'ghost',
    });

    // Start game
    const { game } = serverStore.startGame({
      roomCode: room.code,
      hostPlayerId: host.player_id,
    });

    expect(game.config.penalty_probability).toBe(100);
    expect(game.config.penalties).toBeDefined();
    expect(game.config.penalties!['player_host']).toBeDefined();
    expect(game.config.penalties!['player_2']).toBeDefined();

    // Check getGameState returns myPenalty
    const hostState = serverStore.getGameState(game.id, 'player_host');
    expect(hostState.myPenalty).toBeDefined();
    expect(hostState.myPenalty?.id).toBe(game.config.penalties!['player_host'].id);
    expect(hostState.myPenalty?.status).toBe('active');

    // Complete penalty
    const completeRes = serverStore.completePenalty({
      gameId: game.id,
      playerId: 'player_host',
    });

    expect(completeRes.penalty.status).toBe('completed');
    expect(completeRes.penalty.completed_at).toBeDefined();

    // Re-check getGameState
    const updatedHostState = serverStore.getGameState(game.id, 'player_host');
    expect(updatedHostState.myPenalty?.status).toBe('completed');
  });
});
