import fs from 'fs';
import path from 'path';
import {
  Room,
  RoomMember,
  Game,
  PlayerMission,
  MissionVerification,
  GameEvent,
  PlayerScore,
  GameAward,
} from '@/types/game';
import {
  generateRoomCode,
  assignMissionsToPlayers,
  calculateMissionPoints,
  calculateEndGameAwards,
} from '@/lib/game/engine';

interface StoreData {
  rooms: [string, Room][];
  roomMembers: [string, RoomMember[]][];
  games: [string, Game][];
  playerMissions: [string, PlayerMission[]][];
  verifications: [string, MissionVerification[]][];
  gameEvents: [string, GameEvent[]][];
  scores: [string, PlayerScore[]][];
  awards: [string, GameAward[]][];
}

// Store singleton persistente con sincronizzazione atomica su disco
class GameServerStore {
  private rooms: Map<string, Room> = new Map(); // key: room code
  private roomMembers: Map<string, RoomMember[]> = new Map(); // key: room_id
  private games: Map<string, Game> = new Map(); // key: game_id
  private playerMissions: Map<string, PlayerMission[]> = new Map(); // key: game_id
  private verifications: Map<string, MissionVerification[]> = new Map(); // key: game_id
  private gameEvents: Map<string, GameEvent[]> = new Map(); // key: game_id
  private scores: Map<string, PlayerScore[]> = new Map(); // key: game_id
  private awards: Map<string, GameAward[]> = new Map(); // key: game_id

  constructor() {
    this.loadFromDisk();
  }

  private getStoreFilePath(): string {
    const dataDir = path.join(process.cwd(), '.data');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch {
        // Ignora errori di creazione
      }
    }
    return path.join(dataDir, 'game_store.json');
  }

  private saveToDisk() {
    try {
      const filePath = this.getStoreFilePath();
      const data: StoreData = {
        rooms: Array.from(this.rooms.entries()),
        roomMembers: Array.from(this.roomMembers.entries()),
        games: Array.from(this.games.entries()),
        playerMissions: Array.from(this.playerMissions.entries()),
        verifications: Array.from(this.verifications.entries()),
        gameEvents: Array.from(this.gameEvents.entries()),
        scores: Array.from(this.scores.entries()),
        awards: Array.from(this.awards.entries()),
      };
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
      // Ignora errori di scrittura in ambienti read-only
    }
  }

  private loadFromDisk() {
    try {
      const filePath = this.getStoreFilePath();
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf8');
        if (raw && raw.trim().length > 0) {
          const data = JSON.parse(raw) as StoreData;
          this.rooms = new Map(data.rooms || []);
          this.roomMembers = new Map(data.roomMembers || []);
          this.games = new Map(data.games || []);
          this.playerMissions = new Map(data.playerMissions || []);
          this.verifications = new Map(data.verifications || []);
          this.gameEvents = new Map(data.gameEvents || []);
          this.scores = new Map(data.scores || []);
          this.awards = new Map(data.awards || []);
        }
      }
    } catch (err) {
      // Ignora file corrotti
    }
  }

  public clearAll() {
    this.rooms.clear();
    this.roomMembers.clear();
    this.games.clear();
    this.playerMissions.clear();
    this.verifications.clear();
    this.gameEvents.clear();
    this.scores.clear();
    this.awards.clear();
    this.saveToDisk();
  }

  // ==========================================
  // ROOMS
  // ==========================================
  public createRoom(params: {
    groupName: string;
    mode: Room['mode'];
    minPlayers: number;
    maxPlayers: number;
    durationMinutes: number;
    allowedDifficulties: Room['allowed_difficulties'];
    allowCoop: boolean;
    hostPlayerId: string;
    hostNickname: string;
    hostAvatar: string;
  }): { room: Room; member: RoomMember } {
    this.loadFromDisk();

    let code = generateRoomCode();
    while (this.rooms.has(code)) {
      code = generateRoomCode();
    }

    const roomId = 'room_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const room: Room = {
      id: roomId,
      code,
      group_name: params.groupName.trim() || 'I Guerrieri della Notte',
      mode: params.mode,
      min_players: params.minPlayers || 3,
      max_players: params.maxPlayers || 16,
      duration_minutes: params.durationMinutes || 45,
      allowed_difficulties: params.allowedDifficulties || ['facile', 'media', 'difficile', 'leggendaria'],
      allow_coop: params.allowCoop ?? true,
      host_id: params.hostPlayerId,
      status: 'lobby',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
    };

    const hostMember: RoomMember = {
      id: 'mem_' + Date.now() + '_host',
      room_id: roomId,
      player_id: params.hostPlayerId,
      nickname: params.hostNickname.trim() || 'Host',
      avatar_seed: params.hostAvatar || 'shadow',
      is_host: true,
      is_connected: true,
      joined_at: new Date().toISOString(),
      last_heartbeat_at: new Date().toISOString(),
    };

    this.rooms.set(code, room);
    this.roomMembers.set(roomId, [hostMember]);
    this.saveToDisk();

    return { room, member: hostMember };
  }

  public getRoomByCode(code: string): { room?: Room; members: RoomMember[] } {
    this.loadFromDisk();
    const formattedCode = code.trim().toUpperCase();
    const room = this.rooms.get(formattedCode);
    if (!room) {
      return { members: [] };
    }
    const members = this.roomMembers.get(room.id) || [];
    return { room, members };
  }

  public joinRoom(params: {
    code: string;
    playerId: string;
    nickname: string;
    avatarSeed: string;
  }): { room: Room; member: RoomMember } {
    this.loadFromDisk();
    const formattedCode = params.code.trim().toUpperCase();
    const room = this.rooms.get(formattedCode);
    if (!room) {
      throw new Error(`Stanza "${formattedCode}" non trovata.`);
    }

    if (room.status !== 'lobby') {
      throw new Error('La partita è già iniziata o conclusa in questa stanza.');
    }

    const members = this.roomMembers.get(room.id) || [];
    if (members.length >= room.max_players) {
      throw new Error('La stanza ha raggiunto il numero massimo di partecipanti.');
    }

    // Se il giocatore è già presente, aggiorna presenza
    const existing = members.find((m) => m.player_id === params.playerId);
    if (existing) {
      existing.is_connected = true;
      existing.nickname = params.nickname.trim() || existing.nickname;
      existing.avatar_seed = params.avatarSeed || existing.avatar_seed;
      existing.last_heartbeat_at = new Date().toISOString();
      this.saveToDisk();
      return { room, member: existing };
    }

    const newMember: RoomMember = {
      id: 'mem_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      room_id: room.id,
      player_id: params.playerId,
      nickname: params.nickname.trim() || 'Ospite',
      avatar_seed: params.avatarSeed || 'ghost',
      is_host: room.host_id === params.playerId,
      is_connected: true,
      joined_at: new Date().toISOString(),
      last_heartbeat_at: new Date().toISOString(),
    };

    members.push(newMember);
    this.roomMembers.set(room.id, members);
    this.saveToDisk();

    return { room, member: newMember };
  }

  // ==========================================
  // GAME LIFECYCLE
  // ==========================================
  public startGame(params: {
    roomCode: string;
    hostPlayerId: string;
  }): { game: Game; missionsAssignedCount: number } {
    this.loadFromDisk();
    const { room, members } = this.getRoomByCode(params.roomCode);
    if (!room) throw new Error('Stanza non trovata.');
    if (room.host_id !== params.hostPlayerId) {
      throw new Error('Solo l\'Host può avviare la partita.');
    }
    if (members.length < room.min_players) {
      throw new Error(`Servono almeno ${room.min_players} giocatori per iniziare. Attualmente: ${members.length}.`);
    }

    const gameId = 'game_' + Date.now();
    const durationMs = room.duration_minutes > 0 ? room.duration_minutes * 60 * 1000 : null;
    const endsAt = durationMs ? new Date(Date.now() + durationMs).toISOString() : null;

    const game: Game = {
      id: gameId,
      room_id: room.id,
      status: 'active',
      started_at: new Date().toISOString(),
      ends_at: endsAt,
      current_round: 1,
      config: {
        mode: room.mode,
        duration_minutes: room.duration_minutes,
        allow_coop: room.allow_coop,
        missions_per_player: 3,
      },
    };

    // Assegna le missioni bilanciate
    const playerRefs = members.map((m) => ({ playerId: m.player_id, nickname: m.nickname }));
    const assignedMissions = assignMissionsToPlayers(gameId, playerRefs, {
      mode: room.mode,
      allowedDifficulties: room.allowed_difficulties,
      allowCoop: room.allow_coop,
      missionsPerPlayer: 3,
    });

    // Inizializza tabella punteggi
    const initialScores: PlayerScore[] = members.map((m) => ({
      id: 'sc_' + m.player_id + '_' + gameId,
      game_id: gameId,
      player_id: m.player_id,
      nickname: m.nickname,
      avatar_seed: m.avatar_seed,
      total_points: 0,
      completed_count: 0,
      failed_count: 0,
      bonus_points: 0,
      awarded_titles: [],
      updated_at: new Date().toISOString(),
    }));

    room.status = 'playing';
    this.games.set(gameId, game);
    this.playerMissions.set(gameId, assignedMissions);
    this.verifications.set(gameId, []);
    this.gameEvents.set(gameId, []);
    this.scores.set(gameId, initialScores);
    this.saveToDisk();

    return { game, missionsAssignedCount: assignedMissions.length };
  }

  public getGame(gameId: string): Game | undefined {
    this.loadFromDisk();
    return this.games.get(gameId);
  }

  public getGameByRoomId(roomId: string): Game | undefined {
    this.loadFromDisk();
    for (const g of this.games.values()) {
      if (g.room_id === roomId) return g;
    }
    return undefined;
  }

  /**
   * Restituisce lo stato di gioco con RIGOROSA SEGRETEZZA:
   * Le missioni segrete degli avversari NON vengono restituite al chiamante!
   */
  public getGameState(gameId: string, requestingPlayerId: string) {
    this.loadFromDisk();
    const game = this.games.get(gameId);
    if (!game) throw new Error('Partita non trovata.');

    const scores = this.scores.get(gameId) || [];
    const events = (this.gameEvents.get(gameId) || []).filter((e) => e.is_active);
    const allMissions = this.playerMissions.get(gameId) || [];

    // PRIVACY POLICY: Filtra per dare SOLO le missioni del giocatore chiamante o dove è coop_partner!
    const myMissions = allMissions.filter(
      (pm) => pm.player_id === requestingPlayerId || pm.coop_partner_id === requestingPlayerId
    );

    // Richieste di verifica in cui il giocatore è coinvolto (come richiedente o testimone)
    const allVerifications = this.verifications.get(gameId) || [];
    const myVerifications = allVerifications.filter(
      (v) =>
        (v.verifier_player_id === requestingPlayerId || v.requester_player_id === requestingPlayerId) &&
        v.status === 'pending'
    );

    const awards = this.awards.get(gameId) || [];

    return {
      game,
      scores,
      activeEvents: events,
      myMissions,
      pendingVerifications: myVerifications,
      awards,
    };
  }

  // ==========================================
  // VERIFICATIONS & SCORING
  // ==========================================
  public submitMissionCompletion(params: {
    gameId: string;
    playerMissionId: string;
    requesterPlayerId: string;
    verifierPlayerId?: string;
  }): { playerMission: PlayerMission; verification?: MissionVerification } {
    this.loadFromDisk();
    const missions = this.playerMissions.get(params.gameId) || [];
    const pm = missions.find((m) => m.id === params.playerMissionId);
    if (!pm) throw new Error('Missione assegnata non trovata.');
    if (pm.player_id !== params.requesterPlayerId) {
      throw new Error('Non sei autorizzato a completare la missione di un altro giocatore.');
    }
    if (pm.status !== 'active') {
      throw new Error(`La missione è già in stato "${pm.status}".`);
    }

    const missionCatalog = pm.mission;
    if (!missionCatalog) throw new Error('Dati catalogo missione mancanti.');

    // Se è auto-verificabile o non richiede testimone
    if (missionCatalog.verification_type === 'self_timer') {
      pm.status = 'completed';
      pm.completed_at = new Date().toISOString();
      const earned = calculateMissionPoints(missionCatalog, this.gameEvents.get(params.gameId) || []);
      pm.earned_points = earned;

      this.updateScore(params.gameId, params.requesterPlayerId, earned, 1, 0);
      this.saveToDisk();
      return { playerMission: pm };
    }

    // Altrimenti richiede testimone
    if (!params.verifierPlayerId) {
      throw new Error('Seleziona un testimone per verificare il completamento della missione.');
    }
    if (params.verifierPlayerId === params.requesterPlayerId) {
      throw new Error('Non puoi essere il testimone di te stesso per questa missione.');
    }

    pm.status = 'pending_verification';

    const verification: MissionVerification = {
      id: 'ver_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      player_mission_id: pm.id,
      game_id: params.gameId,
      requester_player_id: params.requesterPlayerId,
      verifier_player_id: params.verifierPlayerId,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    const verifications = this.verifications.get(params.gameId) || [];
    verifications.push(verification);
    this.verifications.set(params.gameId, verifications);
    this.saveToDisk();

    return { playerMission: pm, verification };
  }

  public resolveVerification(params: {
    gameId: string;
    verificationId: string;
    verifierPlayerId: string;
    approved: boolean;
    note?: string;
  }): { verification: MissionVerification; playerMission: PlayerMission } {
    this.loadFromDisk();
    const verifications = this.verifications.get(params.gameId) || [];
    const v = verifications.find((item) => item.id === params.verificationId);
    if (!v) throw new Error('Richiesta di verifica non trovata.');
    if (v.verifier_player_id !== params.verifierPlayerId) {
      throw new Error('Non sei il testimone designato per questa verifica.');
    }
    if (v.status !== 'pending') {
      throw new Error('Questa verifica è già stata gestita o elaborata.');
    }

    v.status = params.approved ? 'approved' : 'rejected';
    v.note = params.note;
    v.resolved_at = new Date().toISOString();

    const missions = this.playerMissions.get(params.gameId) || [];
    const pm = missions.find((m) => m.id === v.player_mission_id);
    if (!pm) throw new Error('Missione non trovata.');

    if (params.approved) {
      pm.status = 'completed';
      pm.completed_at = new Date().toISOString();
      const points = calculateMissionPoints(pm.mission!, this.gameEvents.get(params.gameId) || []);
      pm.earned_points = points;
      this.updateScore(params.gameId, v.requester_player_id, points, 1, 0);

      // Se era collaborativa, premia anche il partner
      if (pm.coop_partner_id) {
        this.updateScore(params.gameId, pm.coop_partner_id, Math.round(points * 0.7), 1, 0);
      }
    } else {
      pm.status = 'failed';
      this.updateScore(params.gameId, v.requester_player_id, 0, 0, 1);
    }

    this.saveToDisk();
    return { verification: v, playerMission: pm };
  }

  public verifyMission = this.resolveVerification.bind(this);

  private updateScore(
    gameId: string,
    playerId: string,
    deltaPoints: number,
    deltaCompleted: number,
    deltaFailed: number
  ) {
    const scores = this.scores.get(gameId) || [];
    const pScore = scores.find((s) => s.player_id === playerId);
    if (pScore) {
      pScore.total_points += deltaPoints;
      pScore.completed_count += deltaCompleted;
      pScore.failed_count += deltaFailed;
      pScore.updated_at = new Date().toISOString();
    }
  }

  // ==========================================
  // CHAOS EVENTS
  // ==========================================
  public triggerEvent(params: {
    gameId: string;
    type: GameEvent['type'];
    title: string;
    description: string;
    multiplier?: number;
    durationMinutes?: number;
  }): GameEvent {
    this.loadFromDisk();
    const duration = params.durationMinutes || 5;
    const event: GameEvent = {
      id: 'evt_' + Date.now(),
      game_id: params.gameId,
      type: params.type,
      title: params.title,
      description: params.description,
      multiplier: params.multiplier || 1.5,
      starts_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + duration * 60 * 1000).toISOString(),
      is_active: true,
    };

    const events = this.gameEvents.get(params.gameId) || [];
    events.push(event);
    this.gameEvents.set(params.gameId, events);
    this.saveToDisk();

    return event;
  }

  // ==========================================
  // END GAME & AWARDS
  // ==========================================
  public finishGame(gameId: string): { game: Game; awards: GameAward[]; scores: PlayerScore[] } {
    this.loadFromDisk();
    const game = this.games.get(gameId);
    if (!game) throw new Error('Partita non trovata.');

    game.status = 'completed';
    const scores = this.scores.get(gameId) || [];
    const missions = this.playerMissions.get(gameId) || [];

    const completed = missions
      .filter((m) => m.status === 'completed' && m.mission)
      .map((m) => ({ playerId: m.player_id, mission: m.mission! }));

    const awards = calculateEndGameAwards(scores, completed);
    this.awards.set(gameId, awards);

    // Assegna titoli ai punteggi
    awards.forEach((award) => {
      const sc = scores.find((s) => s.player_id === award.recipient_player_id);
      if (sc && !sc.awarded_titles.includes(award.title)) {
        sc.awarded_titles.push(award.title);
      }
    });

    this.saveToDisk();
    return { game, awards, scores };
  }
}

// Global singleton per garantire persistenza tra worker e reloads
const globalForStore = globalThis as unknown as {
  serverStore: GameServerStore | undefined;
};

export const serverStore = globalForStore.serverStore ?? new GameServerStore();
globalForStore.serverStore = serverStore;


