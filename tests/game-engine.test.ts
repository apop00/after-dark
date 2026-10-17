import { describe, it, expect, beforeEach } from 'vitest';
import { serverStore } from '../src/lib/server/store';
import { MISSIONS_DATABASE } from '../src/data/missions';
import { assignMissionsToPlayers, calculateEndGameAwards } from '../src/lib/game/engine';

describe('AFTER DARK — Game Engine & Lifecycle Tests', () => {
  beforeEach(() => {
    serverStore.clearAll();
  });

  it('1. Database missioni contiene oltre 100 missioni valide e strutturate', () => {
    expect(MISSIONS_DATABASE.length).toBeGreaterThanOrEqual(100);
    MISSIONS_DATABASE.forEach((m) => {
      expect(m.id).toBeDefined();
      expect(m.title.length).toBeGreaterThan(3);
      expect(m.description.length).toBeGreaterThan(10);
      expect(m.compatible_modes.length).toBeGreaterThan(0);
      expect(m.base_points).toBeGreaterThan(0);
      expect(['facile', 'media', 'difficile', 'leggendaria']).toContain(m.difficulty);
      expect([
        'socializzazione',
        'osservazione',
        'deduzione',
        'persuasione',
        'creativita',
        'collaborazione',
        'bluff',
        'chaos',
        'jeffrey_island',
      ]).toContain(m.category);
    });

    const allIds = MISSIONS_DATABASE.map((m) => m.id);
    const uniqueIds = new Set(allIds);
    expect(uniqueIds.size).toBe(allIds.length);
  });

  it('2. Creazione stanza e ingresso partecipanti con codice', () => {
    const { room, member: host } = serverStore.createRoom({
      groupName: 'Notte Brava a Trastevere',
      mode: 'bar',
      minPlayers: 3,
      maxPlayers: 8,
      durationMinutes: 45,
      allowedDifficulties: ['facile', 'media', 'difficile', 'leggendaria'],
      allowCoop: true,
      hostPlayerId: 'player_host_01',
      hostNickname: 'Marco',
      hostAvatar: 'shadow',
    });

    expect(room.code).toHaveLength(6);
    expect(room.status).toBe('lobby');
    expect(host.is_host).toBe(true);

    // Secondo giocatore si unisce
    const joinResult1 = serverStore.joinRoom({
      code: room.code,
      playerId: 'player_02',
      nickname: 'Giulia',
      avatarSeed: 'viper',
    });
    expect(joinResult1.member.nickname).toBe('Giulia');
    expect(joinResult1.member.is_host).toBe(false);

    // Terzo giocatore si unisce
    const joinResult2 = serverStore.joinRoom({
      code: room.code,
      playerId: 'player_03',
      nickname: 'Luca',
      avatarSeed: 'rebel',
    });
    expect(joinResult2.member.nickname).toBe('Luca');

    const { members } = serverStore.getRoomByCode(room.code);
    expect(members).toHaveLength(3);
  });

  it('3. Rifiuta l\'avvio prima del raggiungimento del numero minimo di giocatori', () => {
    const { room } = serverStore.createRoom({
      groupName: 'Test Min Players',
      mode: 'bar',
      minPlayers: 3,
      maxPlayers: 6,
      durationMinutes: 30,
      allowedDifficulties: ['facile', 'media'],
      allowCoop: true,
      hostPlayerId: 'p1',
      hostNickname: 'Solo',
      hostAvatar: 'shadow',
    });

    expect(() => {
      serverStore.startGame({ roomCode: room.code, hostPlayerId: 'p1' });
    }).toThrow(/almeno 3 giocatori/);
  });

  it('4. Avvio partita, assegnazione missioni bilanciate ed evitamento duplicati', () => {
    const { room } = serverStore.createRoom({
      groupName: 'Party Club',
      mode: 'discoteca',
      minPlayers: 3,
      maxPlayers: 10,
      durationMinutes: 60,
      allowedDifficulties: ['facile', 'media', 'difficile', 'leggendaria'],
      allowCoop: true,
      hostPlayerId: 'p1',
      hostNickname: 'DJ',
      hostAvatar: 'shadow',
    });

    serverStore.joinRoom({ code: room.code, playerId: 'p2', nickname: 'Sara', avatarSeed: 'viper' });
    serverStore.joinRoom({ code: room.code, playerId: 'p3', nickname: 'Leo', avatarSeed: 'wolf' });

    const { game, missionsAssignedCount } = serverStore.startGame({
      roomCode: room.code,
      hostPlayerId: 'p1',
    });

    expect(game.status).toBe('active');
    expect(missionsAssignedCount).toBe(9); // 3 giocatori x 3 missioni

    // Verifica stato della stanza
    const updatedRoom = serverStore.getRoomByCode(room.code).room;
    expect(updatedRoom?.status).toBe('playing');
  });

  it('5. PRIVACY DELLE MISSIONI: gli avversari non possono vedere le missioni altrui', () => {
    const { room } = serverStore.createRoom({
      groupName: 'Privacy Check',
      mode: 'house_party',
      minPlayers: 3,
      maxPlayers: 10,
      durationMinutes: 45,
      allowedDifficulties: ['facile', 'media', 'difficile'],
      allowCoop: false,
      hostPlayerId: 'alice',
      hostNickname: 'Alice',
      hostAvatar: 'shadow',
    });

    serverStore.joinRoom({ code: room.code, playerId: 'bob', nickname: 'Bob', avatarSeed: 'wolf' });
    serverStore.joinRoom({ code: room.code, playerId: 'charlie', nickname: 'Charlie', avatarSeed: 'viper' });

    const { game } = serverStore.startGame({ roomCode: room.code, hostPlayerId: 'alice' });

    // Alice fa richiesta del suo stato
    const aliceState = serverStore.getGameState(game.id, 'alice');
    expect(aliceState.myMissions).toHaveLength(3);
    aliceState.myMissions.forEach((m) => {
      expect(m.player_id).toBe('alice');
    });

    // Bob fa richiesta del suo stato
    const bobState = serverStore.getGameState(game.id, 'bob');
    expect(bobState.myMissions).toHaveLength(3);
    bobState.myMissions.forEach((m) => {
      expect(m.player_id).toBe('bob');
    });

    // Le missioni di Alice e Bob sono distinte e nessun avversario vede quelle dell'altro
    const aliceMissionIds = aliceState.myMissions.map((m) => m.id);
    bobState.myMissions.forEach((bm) => {
      expect(aliceMissionIds).not.toContain(bm.id);
    });
  });

  it('6. Flusso completo di completamento missione con verifica tra pari e punteggi', () => {
    const { room } = serverStore.createRoom({
      groupName: 'Verifiche Live',
      mode: 'bar',
      minPlayers: 3,
      maxPlayers: 6,
      durationMinutes: 30,
      allowedDifficulties: ['facile', 'media', 'difficile'],
      allowCoop: false,
      hostPlayerId: 'p1',
      hostNickname: 'Mario',
      hostAvatar: 'shadow',
    });
    serverStore.joinRoom({ code: room.code, playerId: 'p2', nickname: 'Luigi', avatarSeed: 'viper' });
    serverStore.joinRoom({ code: room.code, playerId: 'p3', nickname: 'Peach', avatarSeed: 'phoenix' });

    const { game } = serverStore.startGame({ roomCode: room.code, hostPlayerId: 'p1' });

    const marioState = serverStore.getGameState(game.id, 'p1');
    const missionToComplete = marioState.myMissions[0];

    // Mario richiede completamento indicando Luigi come testimone
    const submitRes = serverStore.submitMissionCompletion({
      gameId: game.id,
      playerMissionId: missionToComplete.id,
      requesterPlayerId: 'p1',
      verifierPlayerId: 'p2',
    });

    expect(submitRes.playerMission.status).toBe(
      missionToComplete.mission?.verification_type === 'self_timer' ? 'completed' : 'pending_verification'
    );

    if (submitRes.verification) {
      // Luigi vede la richiesta di verifica
      const luigiState = serverStore.getGameState(game.id, 'p2');
      expect(luigiState.pendingVerifications).toHaveLength(1);
      expect(luigiState.pendingVerifications[0].id).toBe(submitRes.verification.id);

      // Luigi approva la testimonianza
      const verifyRes = serverStore.resolveVerification({
        gameId: game.id,
        verificationId: submitRes.verification.id,
        verifierPlayerId: 'p2',
        approved: true,
        note: 'Visto e confermato con i miei occhi!',
      });

      expect(verifyRes.verification.status).toBe('approved');
      expect(verifyRes.playerMission.status).toBe('completed');
      expect(verifyRes.playerMission.earned_points).toBeGreaterThan(0);

      // Verifica aggiornamento classifica
      const updatedMarioState = serverStore.getGameState(game.id, 'p1');
      const marioScore = updatedMarioState.scores.find((s) => s.player_id === 'p1');
      expect(marioScore?.completed_count).toBe(1);
      expect(marioScore?.total_points).toBe(verifyRes.playerMission.earned_points);
    }
  });

  it('7. Rifiuto verifica da parte del testimone e protezione doppio completamento', () => {
    const { room } = serverStore.createRoom({
      groupName: 'Test Rifiuto',
      mode: 'house_party',
      minPlayers: 3,
      maxPlayers: 6,
      durationMinutes: 30,
      allowedDifficulties: ['facile', 'media', 'difficile'],
      allowCoop: false,
      hostPlayerId: 'p1',
      hostNickname: 'Giacomo',
      hostAvatar: 'shadow',
    });
    serverStore.joinRoom({ code: room.code, playerId: 'p2', nickname: 'Giovanni', avatarSeed: 'viper' });
    serverStore.joinRoom({ code: room.code, playerId: 'p3', nickname: 'Aldo', avatarSeed: 'wolf' });

    const { game } = serverStore.startGame({ roomCode: room.code, hostPlayerId: 'p1' });
    const gState = serverStore.getGameState(game.id, 'p1');
    const mission = gState.myMissions[0];

    // Simula missione con testimone
    mission.mission!.verification_type = 'peer_witness';

    const submit = serverStore.submitMissionCompletion({
      gameId: game.id,
      playerMissionId: mission.id,
      requesterPlayerId: 'p1',
      verifierPlayerId: 'p2',
    });

    // Testimone rifiuta
    serverStore.resolveVerification({
      gameId: game.id,
      verificationId: submit.verification!.id,
      verifierPlayerId: 'p2',
      approved: false,
      note: 'Non è vero, non l\'ha fatto!',
    });

    // Non è possibile ri-approvare una verifica già risolta
    expect(() => {
      serverStore.resolveVerification({
        gameId: game.id,
        verificationId: submit.verification!.id,
        verifierPlayerId: 'p2',
        approved: true,
      });
    }).toThrow(/già stata gestita/);

    const checkState = serverStore.getGameState(game.id, 'p1');
    const p1Score = checkState.scores.find((s) => s.player_id === 'p1');
    expect(p1Score?.failed_count).toBe(1);
    expect(p1Score?.total_points).toBe(0);
  });

  it('8. Conclusione partita e assegnazione premi ironici', () => {
    const { room } = serverStore.createRoom({
      groupName: 'Gran Finale',
      mode: 'chaos',
      minPlayers: 3,
      maxPlayers: 5,
      durationMinutes: 15,
      allowedDifficulties: ['facile', 'media'],
      allowCoop: false,
      hostPlayerId: 'p1',
      hostNickname: 'Campione',
      hostAvatar: 'shadow',
    });
    serverStore.joinRoom({ code: room.code, playerId: 'p2', nickname: 'Secondo', avatarSeed: 'viper' });
    serverStore.joinRoom({ code: room.code, playerId: 'p3', nickname: 'Ultimo', avatarSeed: 'wolf' });

    const { game } = serverStore.startGame({ roomCode: room.code, hostPlayerId: 'p1' });

    // Conclude la partita
    const finishRes = serverStore.finishGame(game.id);
    expect(finishRes.game.status).toBe('completed');
    expect(finishRes.awards.length).toBeGreaterThan(0);

    const winnerAward = finishRes.awards.find((a) => a.id === 'award_winner');
    expect(winnerAward).toBeDefined();
    expect(winnerAward?.recipient_nickname).toBe('Campione');
  });

  it('9. Selettore task a testa: personalizzazione del numero di missioni per giocatore (es. 1 o 5 task)', () => {
    // Stanza con 5 task a testa
    const { room: room5 } = serverStore.createRoom({
      groupName: 'Hardcore 5 Tasks',
      mode: 'house_party',
      minPlayers: 3,
      maxPlayers: 8,
      durationMinutes: 60,
      missionsPerPlayer: 5,
      allowedDifficulties: ['facile', 'media', 'difficile', 'leggendaria'],
      allowCoop: true,
      hostPlayerId: 'h1',
      hostNickname: 'Host5',
      hostAvatar: 'shadow',
    });
    serverStore.joinRoom({ code: room5.code, playerId: 'p2', nickname: 'Giocatore 2', avatarSeed: 'viper' });
    serverStore.joinRoom({ code: room5.code, playerId: 'p3', nickname: 'Giocatore 3', avatarSeed: 'wolf' });

    const { game: game5, missionsAssignedCount: count5 } = serverStore.startGame({
      roomCode: room5.code,
      hostPlayerId: 'h1',
    });

    expect(game5.config.missions_per_player).toBe(5);
    expect(count5).toBe(15); // 3 giocatori x 5 missioni

    const state5 = serverStore.getGameState(game5.id, 'h1');
    const h1Missions = state5.myMissions.filter((m) => m.player_id === 'h1');
    expect(h1Missions).toHaveLength(5);

    // Stanza rapida con 1 task a testa (es. Warm-up)
    const { room: room1 } = serverStore.createRoom({
      groupName: 'Flash 1 Task',
      mode: 'bar',
      minPlayers: 2,
      maxPlayers: 6,
      durationMinutes: 30,
      missionsPerPlayer: 1,
      allowedDifficulties: ['facile'],
      allowCoop: false,
      hostPlayerId: 'h2',
      hostNickname: 'Host1',
      hostAvatar: 'fox',
    });
    serverStore.joinRoom({ code: room1.code, playerId: 'p2', nickname: 'Giocatore B', avatarSeed: 'ghost' });

    const { game: game1, missionsAssignedCount: count1 } = serverStore.startGame({
      roomCode: room1.code,
      hostPlayerId: 'h2',
      missionsPerPlayer: 1,
    });

    expect(game1.config.missions_per_player).toBe(1);
    expect(count1).toBe(2); // 2 giocatori x 1 missione

    const state1 = serverStore.getGameState(game1.id, 'h2');
    expect(state1.myMissions).toHaveLength(1);
  });

  it('10. Partita senza limiti di tempo (durationMinutes: 0) assegna ends_at: null', () => {
    const { room } = serverStore.createRoom({
      groupName: 'Serata Infinita',
      mode: 'house_party',
      minPlayers: 2,
      maxPlayers: 10,
      durationMinutes: 0,
      missionsPerPlayer: 3,
      allowedDifficulties: ['facile', 'media'],
      allowCoop: true,
      hostPlayerId: 'host_inf',
      hostNickname: 'HostInfinito',
      hostAvatar: 'neon',
    });

    expect(room.duration_minutes).toBe(0);

    serverStore.joinRoom({
      code: room.code,
      playerId: 'guest_inf',
      nickname: 'Ospite',
      avatarSeed: 'spark',
    });

    const { game } = serverStore.startGame({
      roomCode: room.code,
      hostPlayerId: 'host_inf',
    });

    expect(game.config.duration_minutes).toBe(0);
    expect(game.ends_at).toBeNull();

    // Conclusione manuale della partita senza tempo
    const { game: finishedGame } = serverStore.finishGame(game.id);
    expect(finishedGame.status).toBe('completed');
  });

  it('11. Missioni Coop assegnate a coppie o triplette con partner esplicito', () => {
    // Stanza con 5 giocatori (> 4): genera una tripletta e una coppia per coop!
    const { room } = serverStore.createRoom({
      groupName: 'Coop Squad Test',
      mode: 'house_party',
      minPlayers: 3,
      maxPlayers: 10,
      durationMinutes: 45,
      missionsPerPlayer: 3,
      allowedDifficulties: ['facile', 'media', 'difficile', 'leggendaria'],
      allowCoop: true,
      hostPlayerId: 'p1',
      hostNickname: 'Player 1',
      hostAvatar: 'shadow',
    });

    serverStore.joinRoom({ code: room.code, playerId: 'p2', nickname: 'Player 2', avatarSeed: 'wolf' });
    serverStore.joinRoom({ code: room.code, playerId: 'p3', nickname: 'Player 3', avatarSeed: 'fox' });
    serverStore.joinRoom({ code: room.code, playerId: 'p4', nickname: 'Player 4', avatarSeed: 'rebel' });
    serverStore.joinRoom({ code: room.code, playerId: 'p5', nickname: 'Player 5', avatarSeed: 'ghost' });

    const { game } = serverStore.startGame({
      roomCode: room.code,
      hostPlayerId: 'p1',
    });

    const p1State = serverStore.getGameState(game.id, 'p1');
    const coopMission = p1State.myMissions.find((m) => m.mission?.category === 'collaborazione');

    expect(coopMission).toBeDefined();
    expect(coopMission?.coop_partner_nickname).toBeTruthy();
    expect(coopMission?.coop_partner_id).toBeTruthy();
    // Verifica che NESSUN giocatore della partita abbia la stessa missione duplicata
    ['p1', 'p2', 'p3', 'p4', 'p5'].forEach((pid) => {
      const state = serverStore.getGameState(game.id, pid);
      expect(state.myMissions.length).toBe(3);
      const missionIds = state.myMissions.map((m) => m.mission_id);
      const uniqueMissionIds = new Set(missionIds);
      expect(uniqueMissionIds.size).toBe(missionIds.length);
    });
  });

  it('12. Modalità auto-conferma (require_witness: false) permette completamento immediato', () => {
    const { room } = serverStore.createRoom({
      groupName: 'Auto Conferma Test',
      mode: 'bar',
      minPlayers: 2,
      maxPlayers: 6,
      durationMinutes: 30,
      missionsPerPlayer: 2,
      requireWitness: false,
      allowedDifficulties: ['facile', 'media'],
      allowCoop: false,
      hostPlayerId: 'p_fast',
      hostNickname: 'FastPlayer',
      hostAvatar: 'spark',
    });

    expect(room.require_witness).toBe(false);

    serverStore.joinRoom({ code: room.code, playerId: 'p_other', nickname: 'Other', avatarSeed: 'neon' });

    const { game } = serverStore.startGame({
      roomCode: room.code,
      hostPlayerId: 'p_fast',
    });

    expect(game.config.require_witness).toBe(false);

    const state = serverStore.getGameState(game.id, 'p_fast');
    const targetMission = state.myMissions[0];

    // Completamento immediato senza specificare verifierPlayerId
    const res = serverStore.submitMissionCompletion({
      gameId: game.id,
      playerMissionId: targetMission.id,
      requesterPlayerId: 'p_fast',
    });

    expect(res.playerMission.status).toBe('completed');
    expect(res.playerMission.earned_points).toBeGreaterThan(0);
    expect(res.verification).toBeUndefined(); // Nessuna richiesta pendente creata
  });

  it('13. Gestione lobby pubbliche vs private e chiusura automatica dopo 5 minuti', () => {
    // 1. Crea una stanza pubblica
    const { room: pubRoom } = serverStore.createRoom({
      groupName: 'Lobby Pubblica Roma',
      mode: 'bar',
      minPlayers: 3,
      maxPlayers: 8,
      durationMinutes: 45,
      allowedDifficulties: ['facile', 'media'],
      allowCoop: true,
      isPublic: true,
      hostPlayerId: 'p_pub',
      hostNickname: 'HostPub',
      hostAvatar: 'cocktail',
    });

    // 2. Crea una stanza privata
    const { room: privRoom } = serverStore.createRoom({
      groupName: 'Lobby Segreta',
      mode: 'house_party',
      minPlayers: 3,
      maxPlayers: 8,
      durationMinutes: 45,
      allowedDifficulties: ['facile'],
      allowCoop: true,
      isPublic: false,
      hostPlayerId: 'p_priv',
      hostNickname: 'HostPriv',
      hostAvatar: 'ghost',
    });

    expect(pubRoom.is_public).toBe(true);
    expect(privRoom.is_public).toBe(false);

    // 3. Verifica lista lobby pubbliche
    const publicRooms = serverStore.getPublicRooms();
    expect(publicRooms.some((r) => r.code === pubRoom.code)).toBe(true);
    expect(publicRooms.some((r) => r.code === privRoom.code)).toBe(false);

    // 4. Simula timeout di 5 minuti (retrodatando created_at a 6 minuti fa)
    serverStore.updateRoomCreatedAt(pubRoom.code, new Date(Date.now() - 6 * 60 * 1000).toISOString());

    const publicRoomsAfterTimeout = serverStore.getPublicRooms();
    expect(publicRoomsAfterTimeout.some((r) => r.code === pubRoom.code)).toBe(false);

    const lookup = serverStore.getRoomByCode(pubRoom.code);
    expect(lookup.isExpired).toBe(true);
    expect(lookup.room?.status).toBe('abandoned');

    // Tentativo di join deve fallire
    expect(() => {
      serverStore.joinRoom({
        code: pubRoom.code,
        playerId: 'p_late',
        nickname: 'LatePlayer',
        avatarSeed: 'shadow',
      });
    }).toThrow('inattività');
  });

  it('14. Rimanere nella lobby e ricominciare un\'altra partita con gli stessi giocatori', () => {
    // 1. Crea stanza con host e due giocatori
    const { room, member: host } = serverStore.createRoom({
      groupName: 'Notte Brava 2.0',
      mode: 'jeffrey_island',
      minPlayers: 3,
      maxPlayers: 8,
      durationMinutes: 30,
      allowedDifficulties: ['facile', 'media', 'difficile'],
      allowCoop: true,
      hostPlayerId: 'p_host_rematch',
      hostNickname: 'HostRematch',
      hostAvatar: 'cocktail',
    });

    serverStore.joinRoom({ code: room.code, playerId: 'p_mate1', nickname: 'Mate 1', avatarSeed: 'lion' });
    serverStore.joinRoom({ code: room.code, playerId: 'p_mate2', nickname: 'Mate 2', avatarSeed: 'fox' });

    // 2. Avvia Partita 1
    const { game: game1 } = serverStore.startGame({
      roomCode: room.code,
      hostPlayerId: 'p_host_rematch',
    });

    expect(game1.id).toBeDefined();
    expect(serverStore.getRoomByCode(room.code).room?.status).toBe('playing');

    // 3. Concludi Partita 1
    serverStore.finishGame(game1.id);

    // Verifica che getGameState restituisca anche info sulla stanza
    const state1 = serverStore.getGameState(game1.id, 'p_host_rematch');
    expect(state1.room?.code).toBe(room.code);

    // 4. Host decide di rimanere nella lobby per una nuova partita
    const resetRes = serverStore.resetRoomToLobby(room.code, 'p_host_rematch');
    expect(resetRes.room.status).toBe('lobby');

    // Verifica che tutti i giocatori siano ancora nella stanza
    const lobbyCheck = serverStore.getRoomByCode(room.code);
    expect(lobbyCheck.room?.status).toBe('lobby');
    expect(lobbyCheck.members.length).toBe(3);

    // Non-host non può riaprire la lobby
    expect(() => {
      serverStore.resetRoomToLobby(room.code, 'p_mate1');
    }).toThrow("Solo l'Host");

    // 5. Host avvia la seconda partita nella stessa stanza
    const { game: game2 } = serverStore.startGame({
      roomCode: room.code,
      hostPlayerId: 'p_host_rematch',
      missionsPerPlayer: 4,
    });

    expect(game2.id).not.toBe(game1.id);
    expect(serverStore.getRoomByCode(room.code).room?.status).toBe('playing');

    // Tutti e 3 i giocatori hanno le nuove missioni assegnate
    const p1State = serverStore.getGameState(game2.id, 'p_host_rematch');
    const p2State = serverStore.getGameState(game2.id, 'p_mate1');
    expect(p1State.myMissions.length).toBe(4);
    expect(p2State.myMissions.length).toBe(4);
  });

  it('15. RIGOROSA DEDUPLICAZIONE: nessun giocatore riceve mai la stessa missione due volte (test massivo multi-config)', () => {
    const modes: Array<'bar' | 'house_party' | 'discoteca' | 'outdoor' | 'jeffrey_island'> = [
      'bar',
      'house_party',
      'discoteca',
      'outdoor',
      'jeffrey_island',
    ];

    // Esegui test ripetuti su diverse modalità, dimensioni di gruppo e impostazioni coop
    for (const mode of modes) {
      for (const playerCount of [2, 3, 4, 6]) {
        for (const allowCoop of [true, false]) {
          const players = Array.from({ length: playerCount }, (_, idx) => ({
            playerId: `dedup_p_${mode}_${playerCount}_${allowCoop}_${idx}`,
            nickname: `Giocatore ${idx}`,
            gender: (idx % 2 === 0 ? 'uomo' : 'donna') as 'uomo' | 'donna',
          }));

          const missions = assignMissionsToPlayers(`game_${mode}_${playerCount}_${allowCoop}`, players, {
            mode,
            allowedDifficulties: ['facile', 'media', 'difficile', 'leggendaria'],
            allowCoop,
            missionsPerPlayer: 4,
            enableGenderMissions: true,
            includeJeffreyPack: mode === 'jeffrey_island',
          });

          // Per ogni singolo giocatore, verifica che NON ci siano duplicati di mission_id
          for (const player of players) {
            const playerMissions = missions.filter((m) => m.player_id === player.playerId);
            const missionIds = playerMissions.map((m) => m.mission_id);
            const uniqueSet = new Set(missionIds);

            expect(uniqueSet.size).toBe(missionIds.length);
          }
        }
      }
    }
  });

  it('16. Le missioni Coop escono esattamente nello stesso ordine/slot per entrambi i compagni', () => {
    const players = [
      { playerId: 'usr_1', nickname: 'Alice' },
      { playerId: 'usr_2', nickname: 'Bob' },
      { playerId: 'usr_3', nickname: 'Charlie' },
      { playerId: 'usr_4', nickname: 'Diana' },
    ];

    // Test sia in modalità sequenziale che libera
    for (const progressionMode of ['sequential', 'free'] as const) {
      const missions = assignMissionsToPlayers(`game_slot_test_${progressionMode}`, players, {
        mode: 'house_party',
        allowedDifficulties: ['facile', 'media', 'difficile', 'leggendaria'],
        allowCoop: true,
        missionsPerPlayer: 3,
        progressionMode,
      });

      // Troviamo i compagni di squadra coop
      const p1Missions = missions.filter((m) => m.player_id === 'usr_1');
      const p1Coop = p1Missions.find((m) => m.coop_partner_id !== null);
      expect(p1Coop).toBeDefined();

      const p1CoopIndex = p1Missions.findIndex((m) => m.id === p1Coop!.id);
      const partnerId = p1Coop!.coop_partner_id!;

      const partnerMissions = missions.filter((m) => m.player_id === partnerId);
      const partnerCoopIndex = partnerMissions.findIndex(
        (m) => m.mission_id === p1Coop!.mission_id
      );

      // Devono trovarsi esattamente allo stesso indice/slot!
      expect(partnerCoopIndex).toBe(p1CoopIndex);
      expect(p1CoopIndex).toBe(1); // Slot 1 (Task 2)
    }
  });

  it('17. Se un giocatore completa una missione Coop, viene completata in automatico anche per il compagno', () => {
    const { room } = serverStore.createRoom({
      groupName: 'Coop Auto Complete Room',
      mode: 'house_party',
      minPlayers: 2,
      maxPlayers: 4,
      durationMinutes: 30,
      allowedDifficulties: ['facile', 'media', 'difficile'],
      missionsPerPlayer: 3,
      allowCoop: true,
      requireWitness: false,
      hostPlayerId: 'p_alpha',
      hostNickname: 'Alpha',
      hostAvatar: 'shadow',
    });

    serverStore.joinRoom({
      code: room.code,
      playerId: 'p_beta',
      nickname: 'Beta',
      avatarSeed: 'ghost',
    });

    const { game } = serverStore.startGame({
      roomCode: room.code,
      hostPlayerId: 'p_alpha',
      missionsPerPlayer: 3,
    });

    const alphaState = serverStore.getGameState(game.id, 'p_alpha');
    const betaState = serverStore.getGameState(game.id, 'p_beta');

    const alphaCoop = alphaState.myMissions.find((m) => m.coop_partner_id !== null);
    const betaCoop = betaState.myMissions.find((m) => m.coop_partner_id !== null);

    expect(alphaCoop).toBeDefined();
    expect(betaCoop).toBeDefined();
    expect(alphaCoop?.status).toBe('active');
    expect(betaCoop?.status).toBe('active');

    // Alpha completa la missione coop
    const res = serverStore.submitMissionCompletion({
      gameId: game.id,
      playerMissionId: alphaCoop!.id,
      requesterPlayerId: 'p_alpha',
    });

    expect(res.playerMission.status).toBe('completed');

    // Verifica stato aggiornato di Alpha E di Beta: entrambi devono risultare completati!
    const updatedAlpha = serverStore.getGameState(game.id, 'p_alpha');
    const updatedBeta = serverStore.getGameState(game.id, 'p_beta');

    const updatedAlphaCoop = updatedAlpha.myMissions.find((m) => m.id === alphaCoop!.id);
    const updatedBetaCoop = updatedBeta.myMissions.find((m) => m.id === betaCoop!.id);

    expect(updatedAlphaCoop?.status).toBe('completed');
    expect(updatedBetaCoop?.status).toBe('completed');
    expect(updatedBetaCoop?.completed_at).toBeDefined();
    expect(updatedBetaCoop?.earned_points).toBeGreaterThan(0);

    // Entrambi hanno punteggio aggiornato
    const alphaScore = updatedAlpha.scores.find((s) => s.player_id === 'p_alpha');
    const betaScore = updatedBeta.scores.find((s) => s.player_id === 'p_beta');
    expect(alphaScore?.completed_count).toBe(1);
    expect(betaScore?.completed_count).toBe(1);
  });

  it('18. Le missioni Coop non possono essere skippate', () => {
    const { room } = serverStore.createRoom({
      groupName: 'No Coop Skip Room',
      mode: 'bar',
      minPlayers: 2,
      maxPlayers: 4,
      durationMinutes: 30,
      allowedDifficulties: ['facile', 'media', 'difficile'],
      missionsPerPlayer: 3,
      allowCoop: true,
      maxSkipsPerPlayer: 2,
      hostPlayerId: 'p_skip_1',
      hostNickname: 'Skip1',
      hostAvatar: 'spark',
    });

    serverStore.joinRoom({
      code: room.code,
      playerId: 'p_skip_2',
      nickname: 'Skip2',
      avatarSeed: 'wolf',
    });

    const { game } = serverStore.startGame({
      roomCode: room.code,
      hostPlayerId: 'p_skip_1',
      missionsPerPlayer: 3,
    });

    const state = serverStore.getGameState(game.id, 'p_skip_1');
    const coopMission = state.myMissions.find((m) => m.coop_partner_id !== null);
    expect(coopMission).toBeDefined();

    // Tentativo di skip sulla coop: deve fallire
    expect(() =>
      serverStore.skipMission({
        gameId: game.id,
        playerMissionId: coopMission!.id,
        playerId: 'p_skip_1',
      })
    ).toThrow('Le missioni di coppia/collaborative non possono essere cambiate.');
  });

  it('19. Il numero di cambi (skip) è un totale fisso per partita e non infinito', () => {
    const { room } = serverStore.createRoom({
      groupName: 'Strict Skips Room',
      mode: 'house_party',
      minPlayers: 2,
      maxPlayers: 4,
      durationMinutes: 30,
      allowedDifficulties: ['facile', 'media', 'difficile'],
      missionsPerPlayer: 3,
      allowCoop: false, // solo missioni singole
      maxSkipsPerPlayer: 2, // 2 cambi totali
      hostPlayerId: 'p_skipper',
      hostNickname: 'Skipper',
      hostAvatar: 'ghost',
    });

    serverStore.joinRoom({
      code: room.code,
      playerId: 'p_partner',
      nickname: 'Partner',
      avatarSeed: 'rebel',
    });

    const { game } = serverStore.startGame({
      roomCode: room.code,
      hostPlayerId: 'p_skipper',
      missionsPerPlayer: 3,
    });

    const initialState = serverStore.getGameState(game.id, 'p_skipper');
    expect(initialState.skipsRemaining).toBe(2);

    const soloMission1 = initialState.myMissions[0];
    const soloMission2 = initialState.myMissions[1];

    // Primo skip: deve rimanere 1 skip
    const firstSkip = serverStore.skipMission({
      gameId: game.id,
      playerMissionId: soloMission1.id,
      playerId: 'p_skipper',
    });
    expect(firstSkip.skipsRemaining).toBe(1);

    const midState = serverStore.getGameState(game.id, 'p_skipper');
    expect(midState.skipsRemaining).toBe(1);

    // Secondo skip: deve rimanere 0 skip
    const secondSkip = serverStore.skipMission({
      gameId: game.id,
      playerMissionId: soloMission2.id,
      playerId: 'p_skipper',
    });
    expect(secondSkip.skipsRemaining).toBe(0);

    const zeroState = serverStore.getGameState(game.id, 'p_skipper');
    expect(zeroState.skipsRemaining).toBe(0);

    // Terzo skip: deve bloccare il giocatore con errore! Non sono infiniti!
    expect(() =>
      serverStore.skipMission({
        gameId: game.id,
        playerMissionId: secondSkip.playerMission.id,
        playerId: 'p_skipper',
      })
    ).toThrow(/Hai esaurito i tuoi cambi missione disponibili/);

    const finalState = serverStore.getGameState(game.id, 'p_skipper');
    expect(finalState.skipsRemaining).toBe(0);
  });
});



