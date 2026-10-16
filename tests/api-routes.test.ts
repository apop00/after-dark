import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as createRoom } from '../src/app/api/rooms/create/route';
import { POST as joinRoom } from '../src/app/api/rooms/join/route';
import { GET as getRoom } from '../src/app/api/rooms/[code]/route';
import { POST as startGame } from '../src/app/api/games/start/route';
import { GET as getGameState } from '../src/app/api/games/[id]/state/route';
import { POST as completeMission } from '../src/app/api/missions/complete/route';
import { POST as verifyMission } from '../src/app/api/missions/verify/route';
import { POST as finishGame } from '../src/app/api/games/[id]/finish/route';
import { serverStore } from '../src/lib/server/store';

describe('AFTER DARK — API Route Endpoints End-to-End Tests', () => {
  beforeEach(() => {
    serverStore.clearAll();
  });

  it('Flusso API completo: Crea stanza -> Join -> Avvia -> Verifica privacy -> Completa -> Podio', async () => {
    // 1. Crea stanza
    const createReq = new NextRequest('http://localhost:3000/api/rooms/create', {
      method: 'POST',
      body: JSON.stringify({
        groupName: 'Amici del Sabato Notte',
        mode: 'bar',
        minPlayers: 3,
        maxPlayers: 8,
        durationMinutes: 45,
        allowedDifficulties: ['facile', 'media', 'difficile'],
        allowCoop: true,
        hostPlayerId: 'host_123',
        hostNickname: 'HostMatteo',
        hostAvatar: 'shadow',
      }),
    });
    const createRes = await createRoom(createReq);
    expect(createRes.status).toBe(200);
    const createData = await createRes.json();
    expect(createData.success).toBe(true);
    const roomCode = createData.room.code;

    // 2. Due giocatori si uniscono via API
    const joinReq1 = new NextRequest('http://localhost:3000/api/rooms/join', {
      method: 'POST',
      body: JSON.stringify({
        code: roomCode,
        playerId: 'player_chiara',
        nickname: 'Chiara',
        avatarSeed: 'viper',
      }),
    });
    const joinRes1 = await joinRoom(joinReq1);
    expect(joinRes1.status).toBe(200);

    const joinReq2 = new NextRequest('http://localhost:3000/api/rooms/join', {
      method: 'POST',
      body: JSON.stringify({
        code: roomCode,
        playerId: 'player_davide',
        nickname: 'Davide',
        avatarSeed: 'wolf',
      }),
    });
    const joinRes2 = await joinRoom(joinReq2);
    expect(joinRes2.status).toBe(200);

    // 3. Query stato stanza
    const getRoomReq = new NextRequest(`http://localhost:3000/api/rooms/${roomCode}`);
    const getRoomRes = await getRoom(getRoomReq, { params: Promise.resolve({ code: roomCode }) });
    const getRoomData = await getRoomRes.json();
    expect(getRoomData.members).toHaveLength(3);

    // 4. Avvia la partita
    const startReq = new NextRequest('http://localhost:3000/api/games/start', {
      method: 'POST',
      body: JSON.stringify({
        roomCode,
        hostPlayerId: 'host_123',
      }),
    });
    const startRes = await startGame(startReq);
    expect(startRes.status).toBe(200);
    const startData = await startRes.json();
    const gameId = startData.game.id;
    expect(gameId).toBeDefined();

    // 5. Test PRIVACY: Chiara richiede il suo stato
    const stateReqChiara = new NextRequest(`http://localhost:3000/api/games/${gameId}/state`, {
      headers: { 'x-player-id': 'player_chiara' },
    });
    const stateResChiara = await getGameState(stateReqChiara, { params: Promise.resolve({ id: gameId }) });
    const stateDataChiara = await stateResChiara.json();
    const chiaraMissions = stateDataChiara.myMissions.filter((m: { player_id: string }) => m.player_id === 'player_chiara');
    expect(chiaraMissions).toHaveLength(3);
    stateDataChiara.myMissions.forEach((m: { player_id: string; coop_partner_id?: string }) => {
      expect(m.player_id === 'player_chiara' || m.coop_partner_id === 'player_chiara').toBe(true);
    });

    // 6. Chiara completa la sua prima missione indicando Davide come testimone
    const missionToComplete = stateDataChiara.myMissions[0];
    const completeReq = new NextRequest('http://localhost:3000/api/missions/complete', {
      method: 'POST',
      body: JSON.stringify({
        gameId,
        playerMissionId: missionToComplete.id,
        requesterPlayerId: 'player_chiara',
        verifierPlayerId: 'player_davide',
      }),
    });
    const completeRes = await completeMission(completeReq);
    expect(completeRes.status).toBe(200);
    const completeData = await completeRes.json();

    if (completeData.verification) {
      // Davide convalida la testimonianza
      const verifyReq = new NextRequest('http://localhost:3000/api/missions/verify', {
        method: 'POST',
        body: JSON.stringify({
          gameId,
          verificationId: completeData.verification.id,
          verifierPlayerId: 'player_davide',
          approved: true,
          note: 'Confermo, obiettivo centrato in pieno!',
        }),
      });
      const verifyRes = await verifyMission(verifyReq);
      expect(verifyRes.status).toBe(200);
      const verifyData = await verifyRes.json();
      expect(verifyData.verification.status).toBe('approved');
      expect(verifyData.playerMission.status).toBe('completed');
    }

    // 7. Chiusura partita e verifica podio
    const finishReq = new NextRequest(`http://localhost:3000/api/games/${gameId}/finish`, {
      method: 'POST',
    });
    const finishRes = await finishGame(finishReq, { params: Promise.resolve({ id: gameId }) });
    expect(finishRes.status).toBe(200);
    const finishData = await finishRes.json();
    expect(finishData.game.status).toBe('completed');
    expect(finishData.awards.length).toBeGreaterThan(0);
  });

  it('Partita in modalità Jeffrey Island assegna correttamente le missioni speciali Jeffrey Island a tutti i giocatori', async () => {
    // 1. Crea stanza in modalità Jeffrey Island
    const createReq = new NextRequest('http://localhost:3000/api/rooms/create', {
      method: 'POST',
      body: JSON.stringify({
        groupName: 'Notte alle Hawaii',
        mode: 'jeffrey_island',
        minPlayers: 2,
        maxPlayers: 8,
        durationMinutes: 45,
        missionsPerPlayer: 3,
        allowedDifficulties: ['facile', 'media', 'difficile', 'leggendaria'],
        allowCoop: false,
        hostPlayerId: 'host_jeff',
        hostNickname: 'HostJeff',
        hostAvatar: 'cocktail',
      }),
    });
    const createRes = await createRoom(createReq);
    expect(createRes.status).toBe(200);
    const createData = await createRes.json();
    expect(createData.room.mode).toBe('jeffrey_island');
    const roomCode = createData.room.code;

    // 2. Un giocatore si unisce
    const joinReq = new NextRequest('http://localhost:3000/api/rooms/join', {
      method: 'POST',
      body: JSON.stringify({
        code: roomCode,
        playerId: 'player_epstein_guest',
        nickname: 'Ospite Speciale',
        avatarSeed: 'sunglasses',
      }),
    });
    const joinRes = await joinRoom(joinReq);
    expect(joinRes.status).toBe(200);

    // 3. Avvia la partita
    const startReq = new NextRequest('http://localhost:3000/api/games/start', {
      method: 'POST',
      body: JSON.stringify({
        roomCode,
        hostPlayerId: 'host_jeff',
        missionsPerPlayer: 3,
      }),
    });
    const startRes = await startGame(startReq);
    expect(startRes.status).toBe(200);
    const startData = await startRes.json();
    const gameId = startData.game.id;

    // 4. Verifica lo stato per l'ospite: le missioni DEVONO uscire ed essere di Jeffrey Island
    const stateReq = new NextRequest(`http://localhost:3000/api/games/${gameId}/state`, {
      headers: { 'x-player-id': 'player_epstein_guest' },
    });
    const stateRes = await getGameState(stateReq, { params: Promise.resolve({ id: gameId }) });
    expect(stateRes.status).toBe(200);
    const stateData = await stateRes.json();

    expect(stateData.myMissions).toHaveLength(3);
    stateData.myMissions.forEach((pm: { mission_id: string; mission: { category: string; title: string } }) => {
      expect(pm.mission).toBeDefined();
      expect(pm.mission.title).toBeTruthy();
      expect(pm.mission.category).toBe('jeffrey_island');
    });
  });
});
