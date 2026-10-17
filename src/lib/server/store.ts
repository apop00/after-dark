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
  PlayerGender,
  Mission,
  MissionDifficulty,
  ProgressionMode,
  ScoringMode,
  MissionDistribution,
  SkipDifficultyRule,
  PlayerPenalty,
} from '@/types/game';
import {
  generateRoomCode,
  assignMissionsToPlayers,
  assignPenaltiesToPlayers,
  calculateMissionPoints,
  calculateEndGameAwards,
} from '@/lib/game/engine';
import { MISSIONS_DATABASE } from '@/data/missions';

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

  public isRoomExpired(room: Room): boolean {
    if (room.status !== 'lobby') return false;
    const createdTime = new Date(room.created_at).getTime();
    return Date.now() - createdTime > 5 * 60 * 1000;
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
    missionsPerPlayer?: number;
    allowedDifficulties: Room['allowed_difficulties'];
    allowCoop: boolean;
    requireWitness?: boolean;
    enableGenderMissions?: boolean;
    includeJeffreyPack?: boolean;
    isPublic?: boolean;
    hideTasks?: boolean;
    progressionMode?: ProgressionMode;
    scoringMode?: ScoringMode;
    missionDistribution?: MissionDistribution;
    maxSkipsPerPlayer?: number;
    skipDifficultyRule?: SkipDifficultyRule;
    penaltyProbability?: number;
    hostPlayerId: string;
    hostNickname: string;
    hostAvatar: string;
    hostGender?: PlayerGender;
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
      duration_minutes: params.durationMinutes !== undefined ? params.durationMinutes : 45,
      missions_per_player: params.missionsPerPlayer || 3,
      allowed_difficulties: params.allowedDifficulties || ['facile', 'media', 'difficile', 'leggendaria'],
      allow_coop: params.allowCoop ?? true,
      require_witness: params.requireWitness ?? false,
      enable_gender_missions: params.enableGenderMissions ?? false,
      include_jeffrey_pack: params.mode === 'jeffrey_island' || Boolean(params.includeJeffreyPack),
      is_public: params.isPublic ?? true,
      hide_tasks: params.hideTasks !== undefined ? Boolean(params.hideTasks) : true,
      progression_mode: params.progressionMode || 'free',
      scoring_mode: params.scoringMode || 'points',
      mission_distribution: params.missionDistribution || 'fair',
      max_skips_per_player: params.maxSkipsPerPlayer !== undefined ? params.maxSkipsPerPlayer : 1,
      skip_difficulty_rule: params.skipDifficultyRule || 'same',
      penalty_probability: params.penaltyProbability !== undefined ? params.penaltyProbability : 0,
      host_id: params.hostPlayerId,
      status: 'lobby',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    };

    const hostMember: RoomMember = {
      id: 'mem_' + Date.now() + '_host',
      room_id: roomId,
      player_id: params.hostPlayerId,
      nickname: params.hostNickname.trim() || 'Host',
      avatar_seed: params.hostAvatar || 'shadow',
      gender: params.hostGender || 'neutro',
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

  public updateRoomCreatedAt(code: string, createdAt: string) {
    this.loadFromDisk();
    const formatted = code.trim().toUpperCase();
    const room = this.rooms.get(formatted);
    if (room) {
      room.created_at = createdAt;
      this.saveToDisk();
    }
  }

  public getRoomByCode(code: string): { room?: Room; members: RoomMember[]; isExpired?: boolean } {
    this.loadFromDisk();
    const formattedCode = code.trim().toUpperCase();
    const room = this.rooms.get(formattedCode);
    if (!room) {
      return { members: [] };
    }

    // Verifica chiusura per inattività dopo 5 minuti se la partita non è partita
    if (this.isRoomExpired(room)) {
      room.status = 'abandoned';
      this.saveToDisk();
      return { room, members: [], isExpired: true };
    }

    const members = this.roomMembers.get(room.id) || [];
    return { room, members };
  }

  public getPublicRooms(): Array<{
    id: string;
    code: string;
    group_name: string;
    mode: Room['mode'];
    host_nickname: string;
    host_avatar: string;
    members_count: number;
    max_players: number;
    created_at: string;
    expires_in_seconds: number;
    enable_gender_missions?: boolean;
    include_jeffrey_pack?: boolean;
  }> {
    this.loadFromDisk();
    const now = Date.now();
    const result: Array<{
      id: string;
      code: string;
      group_name: string;
      mode: Room['mode'];
      host_nickname: string;
      host_avatar: string;
      members_count: number;
      max_players: number;
      created_at: string;
      expires_in_seconds: number;
      enable_gender_missions?: boolean;
      include_jeffrey_pack?: boolean;
    }> = [];

    for (const room of this.rooms.values()) {
      if (room.status !== 'lobby') continue;
      if (room.is_public === false) continue;

      const createdTime = new Date(room.created_at).getTime();
      const ageMs = now - createdTime;
      if (ageMs > 5 * 60 * 1000) {
        room.status = 'abandoned';
        continue;
      }

      const members = this.roomMembers.get(room.id) || [];
      const host = members.find((m) => m.is_host) || members[0];
      const expiresIn = Math.max(0, Math.floor((createdTime + 5 * 60 * 1000 - now) / 1000));

      result.push({
        id: room.id,
        code: room.code,
        group_name: room.group_name,
        mode: room.mode,
        host_nickname: host ? host.nickname : 'Host',
        host_avatar: host ? host.avatar_seed : 'shadow',
        members_count: members.length,
        max_players: room.max_players,
        created_at: room.created_at,
        expires_in_seconds: expiresIn,
        enable_gender_missions: room.enable_gender_missions,
        include_jeffrey_pack: room.include_jeffrey_pack,
      });
    }

    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return result;
  }

  public joinRoom(params: {
    code: string;
    playerId: string;
    nickname: string;
    avatarSeed: string;
    gender?: PlayerGender;
  }): { room: Room; member: RoomMember } {
    this.loadFromDisk();
    const formattedCode = params.code.trim().toUpperCase();
    const room = this.rooms.get(formattedCode);
    if (!room) {
      throw new Error(`Stanza "${formattedCode}" non trovata.`);
    }

    if (this.isRoomExpired(room)) {
      room.status = 'abandoned';
      this.saveToDisk();
      throw new Error('Questa stanza è stata chiusa per inattività (5 minuti superati).');
    }

    if (room.status === 'abandoned') {
      throw new Error('Questa stanza è stata chiusa per inattività (5 minuti superati).');
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
      if (params.gender) existing.gender = params.gender;
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
      gender: params.gender || 'neutro',
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

  public updateRoomSettings(params: {
    code: string;
    hostPlayerId: string;
    missionsPerPlayer?: number;
    hideTasks?: boolean;
    progressionMode?: ProgressionMode;
    scoringMode?: ScoringMode;
    missionDistribution?: MissionDistribution;
    maxSkipsPerPlayer?: number;
    skipDifficultyRule?: SkipDifficultyRule;
    penaltyProbability?: number;
  }): Room {
    this.loadFromDisk();
    const room = this.rooms.get(params.code.toUpperCase());
    if (!room) throw new Error('Stanza non trovata.');
    if (room.host_id !== params.hostPlayerId) {
      throw new Error('Solo l\'Host può modificare le impostazioni della stanza.');
    }
    if (params.missionsPerPlayer !== undefined) {
      room.missions_per_player = params.missionsPerPlayer;
    }
    if (params.hideTasks !== undefined) {
      room.hide_tasks = params.hideTasks;
    }
    if (params.progressionMode !== undefined) {
      room.progression_mode = params.progressionMode;
    }
    if (params.scoringMode !== undefined) {
      room.scoring_mode = params.scoringMode;
    }
    if (params.missionDistribution !== undefined) {
      room.mission_distribution = params.missionDistribution;
    }
    if (params.maxSkipsPerPlayer !== undefined) {
      room.max_skips_per_player = params.maxSkipsPerPlayer;
    }
    if (params.skipDifficultyRule !== undefined) {
      room.skip_difficulty_rule = params.skipDifficultyRule;
    }
    if (params.penaltyProbability !== undefined) {
      room.penalty_probability = params.penaltyProbability;
    }
    this.saveToDisk();
    return room;
  }

  // ==========================================
  // GAME LIFECYCLE
  // ==========================================
  public startGame(params: {
    roomCode: string;
    hostPlayerId: string;
    missionsPerPlayer?: number;
    hideTasks?: boolean;
    progressionMode?: ProgressionMode;
    scoringMode?: ScoringMode;
    missionDistribution?: MissionDistribution;
    maxSkipsPerPlayer?: number;
    skipDifficultyRule?: SkipDifficultyRule;
    penaltyProbability?: number;
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

    const targetMissions = params.missionsPerPlayer || room.missions_per_player || 3;
    const hideTasks = params.hideTasks !== undefined ? params.hideTasks : (room.hide_tasks ?? true);
    const progressionMode = params.progressionMode || room.progression_mode || 'free';
    const scoringMode = params.scoringMode || room.scoring_mode || 'points';
    const missionDistribution = params.missionDistribution || room.mission_distribution || 'fair';
    const maxSkips = params.maxSkipsPerPlayer !== undefined ? params.maxSkipsPerPlayer : (room.max_skips_per_player ?? 1);
    const skipRule = params.skipDifficultyRule || room.skip_difficulty_rule || 'same';
    const penaltyProb = params.penaltyProbability !== undefined ? params.penaltyProbability : (room.penalty_probability ?? 0);

    const gameId = 'game_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const durationMs = room.duration_minutes > 0 ? room.duration_minutes * 60 * 1000 : null;
    const endsAt = durationMs ? new Date(Date.now() + durationMs).toISOString() : null;

    // Assegna eventuali penitenze/malus casuali in base alla probabilità (tra dopo la 1ª e la penultima task)
    const playerPenaltyRefs = members.map((m) => ({
      playerId: m.player_id,
      nickname: m.nickname,
    }));
    const assignedPenalties = assignPenaltiesToPlayers(playerPenaltyRefs, penaltyProb, targetMissions);

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
        require_witness: room.require_witness ?? false,
        missions_per_player: targetMissions,
        enable_gender_missions: room.enable_gender_missions ?? false,
        include_jeffrey_pack: room.mode === 'jeffrey_island' || Boolean(room.include_jeffrey_pack),
        hide_tasks: hideTasks,
        progression_mode: progressionMode,
        scoring_mode: scoringMode,
        mission_distribution: missionDistribution,
        max_skips_per_player: maxSkips,
        skip_difficulty_rule: skipRule,
        penalty_probability: penaltyProb,
        penalties: assignedPenalties,
      },
    };

    // Assegna le missioni bilanciate
    const playerRefs = members.map((m) => ({
      playerId: m.player_id,
      nickname: m.nickname,
      gender: m.gender,
    }));
    const assignedMissions = assignMissionsToPlayers(gameId, playerRefs, {
      mode: room.mode,
      allowedDifficulties: room.allowed_difficulties,
      allowCoop: room.allow_coop,
      missionsPerPlayer: targetMissions,
      enableGenderMissions: room.enable_gender_missions ?? false,
      includeJeffreyPack: room.mode === 'jeffrey_island' || Boolean(room.include_jeffrey_pack),
      progressionMode: progressionMode,
      scoringMode: scoringMode,
      missionDistribution: missionDistribution,
      maxSkipsPerPlayer: maxSkips,
      skipDifficultyRule: skipRule,
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
      skips_used: 0,
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

  public skipMission(params: {
    gameId: string;
    playerMissionId: string;
    playerId: string;
  }): { playerMission: PlayerMission; skipsRemaining: number } {
    this.loadFromDisk();
    const game = this.games.get(params.gameId);
    if (!game) throw new Error('Partita non trovata.');
    if (game.status !== 'active') throw new Error('La partita non è più attiva.');

    const maxSkips = game.config.max_skips_per_player !== undefined ? game.config.max_skips_per_player : 1;
    if (maxSkips <= 0) {
      throw new Error('I cambi di missione sono disabilitati per questa partita.');
    }

    if (!game.config.player_skips) {
      game.config.player_skips = {};
    }
    const scoresList = this.scores.get(params.gameId) || [];
    const playerScore = scoresList.find((s) => s.player_id === params.playerId);
    const skipsUsed = game.config.player_skips[params.playerId] ?? playerScore?.skips_used ?? 0;
    if (skipsUsed >= maxSkips) {
      throw new Error(`Hai esaurito i tuoi cambi missione disponibili (${maxSkips}/${maxSkips} usati).`);
    }

    const missionsList = this.playerMissions.get(params.gameId) || [];
    const targetMissionIdx = missionsList.findIndex(
      (pm) => pm.id === params.playerMissionId && pm.player_id === params.playerId
    );
    if (targetMissionIdx === -1) {
      throw new Error('Missione non trovata per questo giocatore.');
    }

    const oldPlayerMission = missionsList[targetMissionIdx];
    if (oldPlayerMission.status !== 'active') {
      throw new Error('Puoi cambiare solo una missione attiva non ancora completata.');
    }

    // Le missioni di coppia/collaborative NON sono skippabili!
    if (oldPlayerMission.coop_partner_id || oldPlayerMission.mission?.category === 'collaborazione') {
      throw new Error('Le missioni di coppia/collaborative non possono essere cambiate.');
    }

    const oldDifficulty = oldPlayerMission.mission?.difficulty || 'media';
    const rule = game.config.skip_difficulty_rule || 'same';

    // Determina la difficoltà target
    let targetDifficulty: MissionDifficulty = oldDifficulty;
    if (rule === 'harder') {
      if (oldDifficulty === 'facile') targetDifficulty = 'media';
      else if (oldDifficulty === 'media') targetDifficulty = 'difficile';
      else if (oldDifficulty === 'difficile') targetDifficulty = 'leggendaria';
      else targetDifficulty = 'leggendaria';
    }

    // Identifica tutte le missioni già assegnate a questo giocatore in questa partita
    const assignedIdsForPlayer = new Set(
      missionsList.filter((pm) => pm.player_id === params.playerId).map((pm) => pm.mission_id)
    );

    const isJeffreyMode = game.config.mode === 'jeffrey_island';
    const includeJeffrey = isJeffreyMode || Boolean(game.config.include_jeffrey_pack);

    // Cerca una nuova missione valida
    const candidateMissions = MISSIONS_DATABASE.filter((m) => {
      if (assignedIdsForPlayer.has(m.id)) return false;
      if (m.category === 'collaborazione') return false; // i cambi non creano coop improvvisi

      if (isJeffreyMode) {
        if (m.category !== 'jeffrey_island' && !m.compatible_modes.includes('jeffrey_island')) return false;
      } else {
        const matchesMode = m.compatible_modes.includes(game.config.mode);
        const matchesJeffrey = includeJeffrey && (m.category === 'jeffrey_island' || m.compatible_modes.includes('jeffrey_island'));
        if (!matchesMode && !matchesJeffrey) return false;
      }

      if (rule === 'same' || rule === 'harder') {
        return m.difficulty === targetDifficulty;
      }
      return true;
    });

    let selectedMission: Mission;
    if (candidateMissions.length > 0) {
      selectedMission = candidateMissions[Math.floor(Math.random() * candidateMissions.length)];
    } else {
      const fallbackList = MISSIONS_DATABASE.filter(
        (m) => !assignedIdsForPlayer.has(m.id) && m.category !== 'collaborazione'
      );
      if (fallbackList.length === 0) {
        throw new Error('Nessuna missione alternativa disponibile nel catalogo.');
      }
      selectedMission = fallbackList[Math.floor(Math.random() * fallbackList.length)];
    }

    // Aggiorna player mission
    const updatedPlayerMission: PlayerMission = {
      ...oldPlayerMission,
      mission_id: selectedMission.id,
      mission: selectedMission,
      assigned_at: new Date().toISOString(),
    };
    missionsList[targetMissionIdx] = updatedPlayerMission;

    // Aggiorna skips usati nella config della partita e nello score del giocatore
    if (!game.config.player_skips) {
      game.config.player_skips = {};
    }
    game.config.player_skips[params.playerId] = skipsUsed + 1;

    if (playerScore) {
      playerScore.skips_used = skipsUsed + 1;
      playerScore.updated_at = new Date().toISOString();
    }

    this.saveToDisk();

    return {
      playerMission: updatedPlayerMission,
      skipsRemaining: Math.max(0, maxSkips - (skipsUsed + 1)),
    };
  }

  public getGame(gameId: string): Game | undefined {
    this.loadFromDisk();
    return this.games.get(gameId);
  }

  public getGameByRoomId(roomId: string): Game | undefined {
    this.loadFromDisk();
    const matches: Game[] = [];
    for (const g of this.games.values()) {
      if (g.room_id === roomId) matches.push(g);
    }
    if (matches.length === 0) return undefined;
    matches.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
    return matches.find((g) => g.status === 'active') || matches[0];
  }

  public resetRoomToLobby(roomCode: string, hostPlayerId: string): { room: Room } {
    this.loadFromDisk();
    const formattedCode = roomCode.trim().toUpperCase();
    const room = this.rooms.get(formattedCode);
    if (!room) throw new Error('Stanza non trovata.');
    if (room.host_id !== hostPlayerId) {
      throw new Error("Solo l'Host può riportare la stanza nella lobby.");
    }

    // Segna eventuali partite precedenti di questa stanza come completate
    for (const g of this.games.values()) {
      if (g.room_id === room.id && g.status === 'active') {
        g.status = 'completed';
      }
    }

    room.status = 'lobby';
    room.created_at = new Date().toISOString();
    room.expires_at = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    this.saveToDisk();

    return { room };
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

    let room: Room | undefined;
    for (const r of this.rooms.values()) {
      if (r.id === game.room_id) {
        room = r;
        break;
      }
    }

    // PRIVACY POLICY & DEDUPLICAZIONE: Filtra per dare SOLO le missioni del giocatore chiamante
    // Nessuna missione può essere ripetuta più volte per lo stesso giocatore nella stessa partita
    const seenMissionIds = new Set<string>();
    const myMissions: PlayerMission[] = [];

    // 1. Priorità assoluta alle missioni assegnate direttamente al giocatore
    const directMissions = allMissions.filter((pm) => pm.player_id === requestingPlayerId);
    for (const pm of directMissions) {
      if (!seenMissionIds.has(pm.mission_id)) {
        seenMissionIds.add(pm.mission_id);
        const enriched = { ...pm };
        if (!enriched.coop_partner_nickname && enriched.coop_partner_id) {
          const partnerScore = scores.find((s) => s.player_id === enriched.coop_partner_id);
          enriched.coop_partner_nickname = partnerScore?.nickname || 'Compagno di Squadra';
        }
        myMissions.push(enriched);
      }
    }

    // 2. Fallback per eventuali record di squadra dove è registrato solo come coop_partner (se non già presente)
    const partnerMissions = allMissions.filter((pm) => pm.coop_partner_id === requestingPlayerId);
    for (const pm of partnerMissions) {
      if (!seenMissionIds.has(pm.mission_id)) {
        seenMissionIds.add(pm.mission_id);
        const partnerScore = scores.find((s) => s.player_id === pm.player_id);
        myMissions.push({
          ...pm,
          coop_partner_nickname: partnerScore?.nickname || 'Compagno di Squadra',
        });
      }
    }

    // Richieste di verifica in cui il giocatore è coinvolto (come richiedente o testimone)
    const allVerifications = this.verifications.get(gameId) || [];
    const myVerifications = allVerifications.filter(
      (v) =>
        (v.verifier_player_id === requestingPlayerId || v.requester_player_id === requestingPlayerId) &&
        v.status === 'pending'
    );

    const awards = this.awards.get(gameId) || [];
    const maxSkips = game.config.max_skips_per_player !== undefined ? game.config.max_skips_per_player : 1;
    const myScore = scores.find((s) => s.player_id === requestingPlayerId);
    const skipsUsed = game.config.player_skips?.[requestingPlayerId] ?? myScore?.skips_used ?? 0;
    const skipsRemaining = Math.max(0, maxSkips - skipsUsed);

    // Recupera la penitenza/malus assegnata a questo giocatore (se presente)
    // Esce a sorpresa a caso dopo la 1ª task fino a dopo la penultima task
    const rawPenalty = game.config.penalties?.[requestingPlayerId] || null;
    let myPenalty: PlayerPenalty | null = null;
    if (rawPenalty) {
      const completedCount = myMissions.filter((m) => m.status === 'completed').length;
      const triggerAfter = rawPenalty.trigger_after_task ?? 1;
      if (completedCount >= triggerAfter || rawPenalty.status === 'completed') {
        myPenalty = rawPenalty;
      }
    }

    return {
      game,
      room: room ? {
        id: room.id,
        code: room.code,
        host_id: room.host_id,
        status: room.status,
        group_name: room.group_name,
      } : undefined,
      scores,
      activeEvents: events,
      myMissions,
      myPenalty,
      pendingVerifications: myVerifications,
      awards,
      skipsRemaining,
    };
  }

  public completePenalty(params: {
    gameId: string;
    playerId: string;
  }): { penalty: PlayerPenalty } {
    this.loadFromDisk();
    const game = this.games.get(params.gameId);
    if (!game) throw new Error('Partita non trovata.');
    if (!game.config.penalties || !game.config.penalties[params.playerId]) {
      throw new Error('Nessuna penitenza attiva trovata per questo giocatore.');
    }
    const penalty = game.config.penalties[params.playerId];
    penalty.status = 'completed';
    penalty.completed_at = new Date().toISOString();
    this.saveToDisk();
    return { penalty };
  }

  // ==========================================
  // VERIFICATIONS & SCORING
  // ==========================================
  public submitMissionCompletion(params: {
    gameId: string;
    playerMissionId: string;
    requesterPlayerId: string;
    verifierPlayerId?: string;
    isDoublePoints?: boolean;
  }): { playerMission: PlayerMission; verification?: MissionVerification } {
    this.loadFromDisk();
    const missions = this.playerMissions.get(params.gameId) || [];
    const pm = missions.find((m) => m.id === params.playerMissionId);
    if (!pm) throw new Error('Missione assegnata non trovata.');
    const isOwner = pm.player_id === params.requesterPlayerId;
    const isCoopPartner = pm.coop_partner_id === params.requesterPlayerId;
    if (!isOwner && !isCoopPartner) {
      throw new Error('Non sei autorizzato a completare la missione di un altro giocatore.');
    }
    if (pm.status !== 'active') {
      throw new Error(`La missione è già in stato "${pm.status}".`);
    }

    const missionCatalog = pm.mission;
    if (!missionCatalog) throw new Error('Dati catalogo missione mancanti.');

    const isDoublePoints = Boolean(params.isDoublePoints);
    pm.is_double_points = isDoublePoints;

    const game = this.games.get(params.gameId);
    const requireWitness = Boolean(game?.config?.require_witness);

    if (requireWitness && !params.verifierPlayerId && missionCatalog.verification_type !== 'self_timer') {
      throw new Error('Questa partita richiede un testimone per confermare la missione.');
    }

    // Se la missione è self_timer o se non è stato indicato un testimone (auto-conferma):
    if (missionCatalog.verification_type === 'self_timer' || !params.verifierPlayerId) {
      pm.status = 'completed';
      pm.completed_at = new Date().toISOString();
      const earned = calculateMissionPoints(missionCatalog, this.gameEvents.get(params.gameId) || [], isDoublePoints);
      pm.earned_points = earned;

      this.updateScore(params.gameId, params.requesterPlayerId, earned, 1, 0);

      // Se collaborativa, completa e premia automaticamente anche il/i compagno/i di squadra!
      if (pm.coop_partner_id || missionCatalog.category === 'collaborazione') {
        const teammatesMissions = missions.filter(
          (m) =>
            m.player_id !== pm.player_id &&
            m.mission_id === pm.mission_id &&
            m.status !== 'completed'
        );
        teammatesMissions.forEach((tPm) => {
          tPm.status = 'completed';
          tPm.completed_at = new Date().toISOString();
          tPm.is_double_points = isDoublePoints;
          tPm.earned_points = earned;
          this.updateScore(params.gameId, tPm.player_id, earned, 1, 0);
        });
      }

      this.saveToDisk();
      return { playerMission: pm };
    }

    // Altrimenti richiede testimone
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
      const points = calculateMissionPoints(pm.mission!, this.gameEvents.get(params.gameId) || [], Boolean(pm.is_double_points));
      pm.earned_points = points;
      this.updateScore(params.gameId, v.requester_player_id, points, 1, 0);

      // Se collaborativa, completa e premia automaticamente anche il/i compagno/i di squadra!
      if (pm.coop_partner_id || pm.mission?.category === 'collaborazione') {
        const teammatesMissions = missions.filter(
          (m) =>
            m.player_id !== pm.player_id &&
            m.mission_id === pm.mission_id &&
            m.status !== 'completed'
        );
        teammatesMissions.forEach((tPm) => {
          tPm.status = 'completed';
          tPm.completed_at = new Date().toISOString();
          tPm.is_double_points = pm.is_double_points;
          tPm.earned_points = points;
          this.updateScore(params.gameId, tPm.player_id, points, 1, 0);
        });
      }
    } else {
      pm.status = 'failed';
      this.updateScore(params.gameId, v.requester_player_id, 0, 0, 1);
    }

    this.saveToDisk();
    return { verification: v, playerMission: pm };
  }

  public failMission(params: {
    gameId: string;
    playerMissionId: string;
    playerId: string;
  }): { playerMission: PlayerMission } {
    this.loadFromDisk();
    const missions = this.playerMissions.get(params.gameId) || [];
    const pm = missions.find((m) => m.id === params.playerMissionId);
    if (!pm) throw new Error('Missione non trovata.');

    const isOwner = pm.player_id === params.playerId;
    const isCoopPartner = pm.coop_partner_id === params.playerId;
    if (!isOwner && !isCoopPartner) {
      throw new Error('Non sei autorizzato a modificare questa missione.');
    }

    if (pm.status === 'completed') {
      throw new Error('Questa missione è già stata completata con successo.');
    }

    pm.status = 'failed';
    pm.completed_at = new Date().toISOString();
    pm.earned_points = 0;

    // Aggiorna punteggio: 0 punti guadagnati, 0 completate, 1 fallita
    this.updateScore(params.gameId, pm.player_id, 0, 0, 1);

    // Se cooperativa, sincronizza anche il compagno di squadra
    if (pm.coop_partner_id || pm.mission?.category === 'collaborazione') {
      const teammatesMissions = missions.filter(
        (m) =>
          m.player_id !== pm.player_id &&
          m.mission_id === pm.mission_id &&
          m.status !== 'completed' &&
          m.status !== 'failed'
      );
      teammatesMissions.forEach((tPm) => {
        tPm.status = 'failed';
        tPm.completed_at = new Date().toISOString();
        tPm.earned_points = 0;
        this.updateScore(params.gameId, tPm.player_id, 0, 0, 1);
      });
    }

    this.saveToDisk();
    return { playerMission: pm };
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


