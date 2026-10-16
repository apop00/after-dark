import {
  Room,
  RoomMember,
  Game,
  PlayerMission,
  MissionVerification,
  GameEvent,
  PlayerScore,
  GameAward,
  Mission,
  PlayerGender,
} from '@/types/game';
import {
  generateRoomCode,
  assignMissionsToPlayers,
  calculateMissionPoints,
  calculateEndGameAwards,
} from '@/lib/game/engine';
import { MISSIONS_DATABASE } from '@/data/missions';
import { ensureUuid } from '@/lib/utils/uuid';

class SupabaseStore {
  private fallbackVerifications: Map<string, MissionVerification[]> = new Map();

  private getHeaders(): HeadersInit {
    const key = (
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      ''
    ).trim();
    return {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    };
  }

  private getUrl(endpoint: string): string {
    const raw = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
    const base = raw.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
    return `${base}/rest/v1/${endpoint.replace(/^\/+/, '')}`;
  }

  // ==========================================
  // ROOMS
  // ==========================================
  async createRoom(params: {
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
    hostPlayerId: string;
    hostNickname: string;
    hostAvatar: string;
    hostGender?: PlayerGender;
    isPublic?: boolean;
  }): Promise<{ room: Room; member: RoomMember }> {
    const hostUuid = ensureUuid(params.hostPlayerId);

    // Genera codice univoco
    let code = generateRoomCode();
    for (let attempts = 0; attempts < 5; attempts++) {
      const checkRes = await fetch(
        this.getUrl(`rooms?code=eq.${code}&select=id`),
        { headers: this.getHeaders(), cache: 'no-store' }
      );
      const existing = await checkRes.json();
      if (!Array.isArray(existing) || existing.length === 0) break;
      code = generateRoomCode();
    }

    const roomPayload = {
      code,
      group_name: params.groupName.trim() || 'I Guerrieri della Notte',
      mode: params.mode,
      min_players: params.minPlayers || 3,
      max_players: params.maxPlayers || 16,
      duration_minutes: params.durationMinutes !== undefined ? params.durationMinutes : 45,
      allowed_difficulties: params.allowedDifficulties || [
        'facile',
        'media',
        'difficile',
        'leggendaria',
      ],
      allow_coop: params.allowCoop ?? true,
      host_id: hostUuid,
      status: 'lobby',
    };

    let roomRes = await fetch(this.getUrl('rooms'), {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(roomPayload),
    });

    if (!roomRes.ok && params.mode === 'jeffrey_island') {
      // Fallback in caso la tabella rooms su Supabase abbia il vecchio check constraint
      const fallbackPayload = { ...roomPayload, mode: 'house_party' };
      const fallbackRes = await fetch(this.getUrl('rooms'), {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(fallbackPayload),
      });
      if (fallbackRes.ok) {
        roomRes = fallbackRes;
      }
    }

    if (!roomRes.ok) {
      const err = await roomRes.text();
      throw new Error(`Impossibile creare la stanza su Supabase: ${err}`);
    }

    const roomList = await roomRes.json();
    const createdRoom: Room = roomList[0];
    createdRoom.mode = params.mode;
    createdRoom.missions_per_player = params.missionsPerPlayer || 3;
    createdRoom.enable_gender_missions = params.enableGenderMissions ?? false;
    createdRoom.include_jeffrey_pack = params.includeJeffreyPack ?? false;
    createdRoom.is_public = params.isPublic ?? true;

    // Inserisci host come primo membro
    const memberPayload = {
      room_id: createdRoom.id,
      player_id: hostUuid,
      nickname: params.hostNickname.trim() || 'Host',
      avatar_seed: params.hostAvatar || 'shadow',
      is_host: true,
      is_connected: true,
    };

    const memberRes = await fetch(this.getUrl('room_members'), {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(memberPayload),
    });

    if (!memberRes.ok) {
      const err = await memberRes.text();
      throw new Error(`Impossibile registrare l'host su Supabase: ${err}`);
    }

    const memberList = await memberRes.json();
    const createdMember: RoomMember = memberList[0];
    createdMember.gender = params.hostGender || 'neutro';

    return { room: createdRoom, member: createdMember };
  }

  async getRoomByCode(
    code: string
  ): Promise<{ room?: Room; members: RoomMember[]; isExpired?: boolean }> {
    const cleanCode = code.trim().toUpperCase();
    const res = await fetch(
      this.getUrl(`rooms?code=eq.${cleanCode}&select=*,room_members(*)`),
      {
        headers: this.getHeaders(),
        cache: 'no-store',
      }
    );

    if (!res.ok) {
      return { members: [] };
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      return { members: [] };
    }

    const row = data[0];
    const members: RoomMember[] = Array.isArray(row.room_members)
      ? row.room_members
      : [];
    delete row.room_members;
    const room: Room = row;

    // Chiusura automatica dopo 5 minuti se la partita non è partita
    if (room.status === 'lobby') {
      const createdTime = new Date(room.created_at).getTime();
      if (Date.now() - createdTime > 5 * 60 * 1000) {
        fetch(this.getUrl(`rooms?id=eq.${room.id}`), {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify({ status: 'abandoned' }),
        }).catch(() => {});
        return { room: { ...room, status: 'abandoned' }, members: [], isExpired: true };
      }
    }

    return { room, members };
  }

  async getPublicRooms(): Promise<Array<{
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
  }>> {
    try {
      const res = await fetch(
        this.getUrl('rooms?status=eq.lobby&select=*,room_members(*)&order=created_at.desc&limit=25'),
        {
          headers: this.getHeaders(),
          cache: 'no-store',
        }
      );

      if (!res.ok) return [];
      const rows = await res.json();
      if (!Array.isArray(rows)) return [];

      const now = Date.now();
      const results: Array<{
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

      for (const row of rows) {
        if (row.is_public === false) continue;
        const createdTime = new Date(row.created_at).getTime();
        const ageMs = now - createdTime;
        if (ageMs > 5 * 60 * 1000) continue; // Più vecchia di 5 minuti

        const members: RoomMember[] = Array.isArray(row.room_members) ? row.room_members : [];
        const host = members.find((m) => m.is_host) || members[0];
        const expiresIn = Math.max(0, Math.floor((createdTime + 5 * 60 * 1000 - now) / 1000));

        results.push({
          id: row.id,
          code: row.code,
          group_name: row.group_name || 'I Guerrieri della Notte',
          mode: row.mode,
          host_nickname: host ? host.nickname : 'Host',
          host_avatar: host ? host.avatar_seed : 'shadow',
          members_count: members.length,
          max_players: row.max_players || 16,
          created_at: row.created_at,
          expires_in_seconds: expiresIn,
          enable_gender_missions: row.enable_gender_missions,
          include_jeffrey_pack: row.include_jeffrey_pack,
        });
      }

      return results;
    } catch {
      return [];
    }
  }

  async joinRoom(params: {
    code: string;
    playerId: string;
    nickname: string;
    avatarSeed: string;
    gender?: PlayerGender;
  }): Promise<{ room: Room; member: RoomMember }> {
    const cleanCode = params.code.trim().toUpperCase();
    const { room, members } = await this.getRoomByCode(cleanCode);

    if (!room) {
      throw new Error(`Stanza "${cleanCode}" non trovata.`);
    }

    if (room.status === 'abandoned') {
      throw new Error('Questa stanza è stata chiusa per inattività (5 minuti superati).');
    }

    if (room.status !== 'lobby') {
      throw new Error('La partita è già iniziata o conclusa in questa stanza.');
    }

    const playerUuid = ensureUuid(params.playerId);
    const existing = members.find((m) => m.player_id === playerUuid);

    if (existing) {
      // Aggiorna presenza se già registrato
      if (params.gender) existing.gender = params.gender;
      const updateRes = await fetch(
        this.getUrl(`room_members?id=eq.${existing.id}`),
        {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify({
            nickname: params.nickname.trim() || existing.nickname,
            avatar_seed: params.avatarSeed || existing.avatar_seed,
            is_connected: true,
            last_heartbeat_at: new Date().toISOString(),
          }),
        }
      );
      if (updateRes.ok) {
        const updatedList = await updateRes.json();
        const mem = updatedList[0] || existing;
        mem.gender = params.gender || existing.gender || 'neutro';
        return { room, member: mem };
      }
      return { room, member: existing };
    }

    if (members.length >= room.max_players) {
      throw new Error('La stanza ha raggiunto il numero massimo di partecipanti.');
    }

    const memberPayload = {
      room_id: room.id,
      player_id: playerUuid,
      nickname: params.nickname.trim() || 'Ospite',
      avatar_seed: params.avatarSeed || 'ghost',
      is_host: room.host_id === playerUuid,
      is_connected: true,
    };

    const insertRes = await fetch(this.getUrl('room_members'), {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(memberPayload),
    });

    if (!insertRes.ok) {
      const err = await insertRes.text();
      throw new Error(`Errore nell'ingresso alla stanza: ${err}`);
    }

    const memberList = await insertRes.json();
    const createdMember: RoomMember = memberList[0];
    createdMember.gender = params.gender || 'neutro';
    return { room, member: createdMember };
  }

  async getGameByRoomId(roomId: string): Promise<Game | undefined> {
    const res = await fetch(
      this.getUrl(`games?room_id=eq.${roomId}&order=started_at.desc&limit=1`),
      {
        headers: this.getHeaders(),
        cache: 'no-store',
      }
    );
    if (!res.ok) return undefined;
    const list = await res.json();
    return Array.isArray(list) && list.length > 0 ? list[0] : undefined;
  }

  async resetRoomToLobby(roomCode: string, hostPlayerId: string): Promise<{ room: Room }> {
    const cleanCode = roomCode.trim().toUpperCase();
    const { room } = await this.getRoomByCode(cleanCode);
    if (!room) throw new Error('Stanza non trovata.');

    const hostUuid = ensureUuid(hostPlayerId);
    if (room.host_id !== hostUuid) {
      throw new Error("Solo l'Host può riportare la stanza nella lobby.");
    }

    // Completa eventuali partite attive per questa stanza
    await fetch(this.getUrl(`games?room_id=eq.${room.id}&status=eq.active`), {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ status: 'completed' }),
    }).catch(() => {});

    // Riporta lo stato della stanza a 'lobby' e resetta il timer a 5 min
    const updatePayload = {
      status: 'lobby',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    };

    let updateRes = await fetch(this.getUrl(`rooms?id=eq.${room.id}`), {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(updatePayload),
    });

    if (!updateRes.ok) {
      // Fallback: aggiorna solo lo status se le date causano vincoli
      await fetch(this.getUrl(`rooms?id=eq.${room.id}`), {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify({ status: 'lobby' }),
      }).catch(() => {});
    }

    room.status = 'lobby';
    room.created_at = new Date().toISOString();
    room.expires_at = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    return { room };
  }

  // ==========================================
  // GAME LIFECYCLE
  // ==========================================
  async startGame(params: {
    roomCode: string;
    hostPlayerId: string;
    missionsPerPlayer?: number;
  }): Promise<{ game: Game; missionsAssignedCount: number }> {
    const cleanCode = params.roomCode.trim().toUpperCase();
    const { room, members } = await this.getRoomByCode(cleanCode);

    if (!room) throw new Error('Stanza non trovata.');

    const hostUuid = ensureUuid(params.hostPlayerId);
    if (room.host_id !== hostUuid) {
      throw new Error("Solo l'Host può avviare la partita.");
    }
    if (members.length < room.min_players) {
      throw new Error(
        `Servono almeno ${room.min_players} giocatori per iniziare. Attualmente: ${members.length}.`
      );
    }

    const durationMs =
      room.duration_minutes > 0 ? room.duration_minutes * 60 * 1000 : null;
    const endsAt = durationMs
      ? new Date(Date.now() + durationMs).toISOString()
      : null;

    const missionsPerPlayer =
      Number(params.missionsPerPlayer) || room.missions_per_player || 3;

    // Crea record Game
    const gamePayload = {
      room_id: room.id,
      status: 'active',
      started_at: new Date().toISOString(),
      ends_at: endsAt,
      current_round: 1,
      config: {
        mode: room.mode,
        duration_minutes: room.duration_minutes,
        allow_coop: room.allow_coop,
        require_witness: Boolean((params as { requireWitness?: boolean }).requireWitness ?? room.require_witness ?? false),
        missions_per_player: missionsPerPlayer,
        enable_gender_missions: room.enable_gender_missions ?? false,
        include_jeffrey_pack: room.include_jeffrey_pack ?? false,
      },
    };

    const gameRes = await fetch(this.getUrl('games'), {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(gamePayload),
    });

    if (!gameRes.ok) {
      const err = await gameRes.text();
      throw new Error(`Impossibile avviare la partita: ${err}`);
    }

    const gameList = await gameRes.json();
    const game: Game = gameList[0];

    // Aggiorna stato stanza a 'playing'
    await fetch(this.getUrl(`rooms?id=eq.${room.id}`), {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ status: 'playing' }),
    });

    // Assegna le missioni ai giocatori
    const playerRefs = members.map((m) => ({
      playerId: m.player_id,
      nickname: m.nickname,
      gender: m.gender,
    }));

    const assignedMissions = assignMissionsToPlayers(game.id, playerRefs, {
      mode: room.mode,
      allowedDifficulties: room.allowed_difficulties,
      allowCoop: room.allow_coop,
      missionsPerPlayer,
      enableGenderMissions: room.enable_gender_missions ?? false,
      includeJeffreyPack: room.include_jeffrey_pack ?? false,
    });

    // Inserisci assegnazioni su Supabase
    if (assignedMissions.length > 0) {
      // Upsert automatico delle missioni nel catalogo Supabase per soddisfare FK
      const missionsToUpsert = assignedMissions
        .map((pm) => pm.mission)
        .filter((m): m is Mission => Boolean(m));

      if (missionsToUpsert.length > 0) {
        try {
          const missionPayloads = missionsToUpsert.map((m) => ({
            id: m.id,
            title: m.title,
            description: m.description,
            compatible_modes: m.compatible_modes,
            category: m.category,
            difficulty: m.difficulty,
            base_points: m.base_points,
            estimated_duration_minutes: m.estimated_duration_minutes || 10,
            target_participants: m.target_participants || 2,
            verification_type: m.verification_type,
            special_conditions: m.special_conditions || [],
            is_secret: m.is_secret ?? true,
          }));

          await fetch(this.getUrl('missions'), {
            method: 'POST',
            headers: {
              ...this.getHeaders(),
              Prefer: 'resolution=merge-duplicates',
            },
            body: JSON.stringify(missionPayloads),
          });
        } catch {
          // Ignora se non disponibile o già presenti
        }
      }

      const pmPayloads = assignedMissions.map((pm) => ({
        id: ensureUuid(pm.id),
        game_id: game.id,
        player_id: pm.player_id,
        mission_id: pm.mission_id,
        coop_partner_id: pm.coop_partner_id ? ensureUuid(pm.coop_partner_id) : null,
        status: pm.status,
        earned_points: 0,
      }));

      await fetch(this.getUrl('player_missions'), {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(pmPayloads),
      });
    }

    // Inizializza tabella punteggi
    const scorePayloads = members.map((m) => ({
      game_id: game.id,
      player_id: m.player_id,
      nickname: m.nickname,
      avatar_seed: m.avatar_seed,
      total_points: 0,
      completed_count: 0,
      failed_count: 0,
      bonus_points: 0,
      awarded_titles: [],
    }));

    await fetch(this.getUrl('scores'), {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(scorePayloads),
    });

    return { game, missionsAssignedCount: assignedMissions.length };
  }

  // ==========================================
  // GAME STATE (CON RIGIDA PRIVACY)
  // ==========================================
  async getGameState(gameId: string, requestingPlayerId: string) {
    const playerUuid = ensureUuid(requestingPlayerId);

    // 1. Fetch Game
    const gameRes = await fetch(this.getUrl(`games?id=eq.${gameId}&limit=1`), {
      headers: this.getHeaders(),
      cache: 'no-store',
    });
    const games = await gameRes.json();
    if (!Array.isArray(games) || games.length === 0) {
      throw new Error('Partita non trovata.');
    }
    const game: Game = games[0];

    // 2. Fetch Scores
    const scoresRes = await fetch(
      this.getUrl(`scores?game_id=eq.${gameId}&order=total_points.desc`),
      { headers: this.getHeaders(), cache: 'no-store' }
    );
    const scores: PlayerScore[] = scoresRes.ok ? await scoresRes.json() : [];

    // 3. Fetch Active Chaos Events
    const eventsRes = await fetch(
      this.getUrl(`game_events?game_id=eq.${gameId}&is_active=eq.true`),
      { headers: this.getHeaders(), cache: 'no-store' }
    );
    const activeEvents: GameEvent[] = eventsRes.ok ? await eventsRes.json() : [];

    // 4. Fetch Mission Catalog to enrich player missions
    const catalogRes = await fetch(this.getUrl('missions?select=*'), {
      headers: this.getHeaders(),
      cache: 'no-store',
    });
    const catalogList: Mission[] = catalogRes.ok ? await catalogRes.json() : [];
    const catalogMap = new Map<string, Mission>(
      catalogList.map((m) => [m.id, m])
    );

    // 5. Fetch Player Missions: SOLO quelle assegnate al richiedente o dove è coop_partner!
    const pmRes = await fetch(
      this.getUrl(
        `player_missions?game_id=eq.${gameId}&or=(player_id.eq.${playerUuid},coop_partner_id.eq.${playerUuid})`
      ),
      { headers: this.getHeaders(), cache: 'no-store' }
    );
    const rawMissions: PlayerMission[] = pmRes.ok ? await pmRes.json() : [];
    const myMissions = rawMissions.map((pm) => {
      let coopPartnerNickname: string | null = null;
      if (pm.coop_partner_id) {
        const partner = scores.find((s) => s.player_id === pm.coop_partner_id);
        coopPartnerNickname = partner?.nickname || 'Compagno di Squadra';
      }
      return {
        ...pm,
        coop_partner_nickname: coopPartnerNickname,
        mission: catalogMap.get(pm.mission_id) || MISSIONS_DATABASE.find((m) => m.id === pm.mission_id),
      };
    });

    // 6. Fetch Pending Verifications in cui il giocatore è coinvolto
    const verRes = await fetch(
      this.getUrl(
        `mission_verifications?game_id=eq.${gameId}&status=eq.pending&or=(verifier_player_id.eq.${playerUuid},requester_player_id.eq.${playerUuid})`
      ),
      { headers: this.getHeaders(), cache: 'no-store' }
    );
    const dbVerifications: MissionVerification[] = verRes.ok
      ? await verRes.json()
      : [];

    const fallbacks = (this.fallbackVerifications.get(gameId) || []).filter(
      (v) =>
        (v.verifier_player_id === playerUuid || v.requester_player_id === playerUuid) &&
        v.status === 'pending'
    );
    const pendingVerifications = [...dbVerifications, ...fallbacks];

    // Fetch Room info per consentire ritorno alla lobby
    let roomInfo: { id: string; code: string; host_id: string; status: Room['status']; group_name: string } | undefined;
    if (game.room_id) {
      try {
        const roomRes = await fetch(this.getUrl(`rooms?id=eq.${game.room_id}&limit=1`), {
          headers: this.getHeaders(),
          cache: 'no-store',
        });
        if (roomRes.ok) {
          const roomRows = await roomRes.json();
          if (Array.isArray(roomRows) && roomRows.length > 0) {
            const r = roomRows[0];
            roomInfo = {
              id: r.id,
              code: r.code,
              host_id: r.host_id,
              status: r.status,
              group_name: r.group_name,
            };
          }
        }
      } catch {
        // Ignora
      }
    }

    return {
      game,
      room: roomInfo,
      scores,
      activeEvents,
      myMissions,
      pendingVerifications,
      awards: [] as GameAward[],
    };
  }

  // ==========================================
  // MISSION COMPLETION & VERIFICATIONS
  // ==========================================
  async submitMissionCompletion(params: {
    gameId: string;
    playerMissionId: string;
    requesterPlayerId: string;
    verifierPlayerId?: string;
  }): Promise<{
    playerMission: PlayerMission;
    verification?: MissionVerification;
  }> {
    const requesterUuid = ensureUuid(params.requesterPlayerId);
    const missionUuid = ensureUuid(params.playerMissionId);

    // Fetch player mission
    const pmRes = await fetch(
      this.getUrl(`player_missions?id=eq.${missionUuid}&limit=1`),
      { headers: this.getHeaders(), cache: 'no-store' }
    );
    const pms = await pmRes.json();
    if (!Array.isArray(pms) || pms.length === 0) {
      throw new Error('Missione assegnata non trovata.');
    }
    const pm: PlayerMission = pms[0];

    const isOwner = pm.player_id === requesterUuid;
    const isCoopPartner = pm.coop_partner_id === requesterUuid;
    if (!isOwner && !isCoopPartner) {
      throw new Error(
        'Non sei autorizzato a completare la missione di un altro giocatore.'
      );
    }
    if (pm.status !== 'active') {
      throw new Error(`La missione è già in stato "${pm.status}".`);
    }

    // Fetch catalog mission
    const catRes = await fetch(
      this.getUrl(`missions?id=eq.${pm.mission_id}&limit=1`),
      { headers: this.getHeaders(), cache: 'no-store' }
    );
    const cats = await catRes.json();
    const missionCatalog: Mission | undefined = cats?.[0] || MISSIONS_DATABASE.find((m) => m.id === pm.mission_id);
    if (!missionCatalog) throw new Error('Dati catalogo missione mancanti.');

    // Fetch active events for multipliers
    const evRes = await fetch(
      this.getUrl(`game_events?game_id=eq.${params.gameId}&is_active=eq.true`),
      { headers: this.getHeaders(), cache: 'no-store' }
    );
    const events: GameEvent[] = evRes.ok ? await evRes.json() : [];

    // Recupera la configurazione della partita per verificare se require_witness è attivo
    const gameRes = await fetch(
      this.getUrl(`games?id=eq.${params.gameId}&limit=1`),
      { headers: this.getHeaders(), cache: 'no-store' }
    );
    const gameList = gameRes.ok ? await gameRes.json() : [];
    const game = gameList?.[0];
    const requireWitness = Boolean(game?.config?.require_witness);

    if (requireWitness && !params.verifierPlayerId && missionCatalog.verification_type !== 'self_timer') {
      throw new Error('Questa partita richiede un testimone per confermare la missione.');
    }

    // Auto-conferma immediata se la missione è self_timer o se nessun testimone è stato indicato:
    if (missionCatalog.verification_type === 'self_timer' || !params.verifierPlayerId) {
      const earned = calculateMissionPoints(missionCatalog, events);
      const updateRes = await fetch(
        this.getUrl(`player_missions?id=eq.${pm.id}`),
        {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify({
            status: 'completed',
            completed_at: new Date().toISOString(),
            earned_points: earned,
          }),
        }
      );
      const updatedPm = (await updateRes.json())[0] || pm;

      // Aggiorna punteggio
      await this.incrementScore(params.gameId, requesterUuid, earned, 1, 0);

      // Se collaborativa, completa e premia anche il partner
      if (pm.coop_partner_id) {
        await fetch(
          this.getUrl(
            `player_missions?game_id=eq.${params.gameId}&player_id=eq.${pm.coop_partner_id}&mission_id=eq.${pm.mission_id}`
          ),
          {
            method: 'PATCH',
            headers: this.getHeaders(),
            body: JSON.stringify({
              status: 'completed',
              completed_at: new Date().toISOString(),
              earned_points: earned,
            }),
          }
        );
        await this.incrementScore(params.gameId, pm.coop_partner_id, earned, 1, 0);
      }

      return { playerMission: { ...updatedPm, mission: missionCatalog } };
    }

    // Richiede testimone
    const verifierUuid = ensureUuid(params.verifierPlayerId);
    if (verifierUuid === requesterUuid) {
      throw new Error(
        'Non puoi essere il testimone di te stesso per questa missione.'
      );
    }

    // Imposta pending_verification
    const pmUpdateRes = await fetch(
      this.getUrl(`player_missions?id=eq.${pm.id}`),
      {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify({ status: 'pending_verification' }),
      }
    );
    const updatedPm = (await pmUpdateRes.json())[0] || pm;

    const verificationPayload = {
      player_mission_id: pm.id,
      game_id: params.gameId,
      requester_player_id: requesterUuid,
      verifier_player_id: verifierUuid,
      status: 'pending',
    };

    const verRes = await fetch(this.getUrl('mission_verifications'), {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(verificationPayload),
    });

    let verification: MissionVerification;
    if (verRes.ok) {
      const verifications = await verRes.json();
      verification = verifications[0];
    } else {
      // Fallback in-memory se RLS su Supabase blocca l'inserimento
      verification = {
        id: ensureUuid('ver_' + Date.now()),
        player_mission_id: pm.id,
        game_id: params.gameId,
        requester_player_id: requesterUuid,
        verifier_player_id: verifierUuid,
        status: 'pending',
        created_at: new Date().toISOString(),
      };
      const list = this.fallbackVerifications.get(params.gameId) || [];
      list.push(verification);
      this.fallbackVerifications.set(params.gameId, list);
    }

    return {
      playerMission: { ...updatedPm, mission: missionCatalog },
      verification,
    };
  }

  async resolveVerification(params: {
    gameId: string;
    verificationId: string;
    verifierPlayerId: string;
    approved: boolean;
    note?: string;
  }): Promise<{
    verification: MissionVerification;
    playerMission: PlayerMission;
  }> {
    const verifierUuid = ensureUuid(params.verifierPlayerId);
    const verId = ensureUuid(params.verificationId);

    const vRes = await fetch(
      this.getUrl(`mission_verifications?id=eq.${verId}&limit=1`),
      { headers: this.getHeaders(), cache: 'no-store' }
    );
    let v: MissionVerification | undefined;
    let isFallback = false;

    if (vRes.ok) {
      const verList = await vRes.json();
      if (Array.isArray(verList) && verList.length > 0) {
        v = verList[0];
      }
    }

    if (!v) {
      const fallbackList = this.fallbackVerifications.get(params.gameId) || [];
      v = fallbackList.find((item) => item.id === verId || item.id === params.verificationId);
      isFallback = true;
    }

    if (!v) {
      throw new Error('Richiesta di verifica non trovata.');
    }

    if (v.verifier_player_id !== verifierUuid) {
      throw new Error('Non sei il testimone designato per questa verifica.');
    }
    if (v.status !== 'pending') {
      throw new Error('Questa verifica è già stata gestita o elaborata.');
    }

    v.status = params.approved ? 'approved' : 'rejected';
    v.note = params.note || undefined;
    v.resolved_at = new Date().toISOString();

    if (!isFallback) {
      await fetch(this.getUrl(`mission_verifications?id=eq.${v.id}`), {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify({
          status: v.status,
          note: v.note || null,
          resolved_at: v.resolved_at,
        }),
      });
    }

    // Fetch player mission
    const pmRes = await fetch(
      this.getUrl(`player_missions?id=eq.${v.player_mission_id}&limit=1`),
      { headers: this.getHeaders(), cache: 'no-store' }
    );
    const pmList = await pmRes.json();
    const pm: PlayerMission = pmList[0];

    // Fetch catalog mission
    const catRes = await fetch(
      this.getUrl(`missions?id=eq.${pm.mission_id}&limit=1`),
      { headers: this.getHeaders(), cache: 'no-store' }
    );
    const cats = await catRes.json();
    const missionCatalog: Mission = cats[0] || MISSIONS_DATABASE.find((m) => m.id === pm.mission_id)!;

    if (params.approved) {
      // Calcola punti con eventi attivi
      const evRes = await fetch(
        this.getUrl(`game_events?game_id=eq.${params.gameId}&is_active=eq.true`),
        { headers: this.getHeaders(), cache: 'no-store' }
      );
      const events: GameEvent[] = evRes.ok ? await evRes.json() : [];
      const points = calculateMissionPoints(missionCatalog, events);

      await fetch(this.getUrl(`player_missions?id=eq.${pm.id}`), {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify({
          status: 'completed',
          completed_at: new Date().toISOString(),
          earned_points: points,
        }),
      });

      await this.incrementScore(
        params.gameId,
        v.requester_player_id,
        points,
        1,
        0
      );

      // Se collaborativa, premia anche il partner
      if (pm.coop_partner_id) {
        await fetch(
          this.getUrl(
            `player_missions?game_id=eq.${params.gameId}&player_id=eq.${pm.coop_partner_id}&mission_id=eq.${pm.mission_id}`
          ),
          {
            method: 'PATCH',
            headers: this.getHeaders(),
            body: JSON.stringify({
              status: 'completed',
              completed_at: new Date().toISOString(),
              earned_points: points,
            }),
          }
        );
        await this.incrementScore(params.gameId, pm.coop_partner_id, points, 1, 0);
      }
    } else {
      await fetch(this.getUrl(`player_missions?id=eq.${pm.id}`), {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify({ status: 'failed' }),
      });
      await this.incrementScore(params.gameId, v.requester_player_id, 0, 0, 1);
    }

    return {
      verification: v,
      playerMission: { ...pm, status: params.approved ? 'completed' : 'failed', mission: missionCatalog },
    };
  }

  private async incrementScore(
    gameId: string,
    playerUuid: string,
    deltaPoints: number,
    deltaCompleted: number,
    deltaFailed: number
  ) {
    const sRes = await fetch(
      this.getUrl(
        `scores?game_id=eq.${gameId}&player_id=eq.${playerUuid}&limit=1`
      ),
      { headers: this.getHeaders(), cache: 'no-store' }
    );
    const list = await sRes.json();
    if (!Array.isArray(list) || list.length === 0) return;
    const current: PlayerScore = list[0];

    await fetch(this.getUrl(`scores?id=eq.${current.id}`), {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({
        total_points: (current.total_points || 0) + deltaPoints,
        completed_count: (current.completed_count || 0) + deltaCompleted,
        failed_count: (current.failed_count || 0) + deltaFailed,
        updated_at: new Date().toISOString(),
      }),
    });
  }

  // ==========================================
  // CHAOS EVENTS
  // ==========================================
  async triggerEvent(params: {
    gameId: string;
    type: GameEvent['type'];
    title: string;
    description: string;
    multiplier?: number;
    durationMinutes?: number;
  }): Promise<GameEvent> {
    const duration = params.durationMinutes || 5;
    const eventPayload = {
      game_id: params.gameId,
      type: params.type,
      title: params.title,
      description: params.description,
      multiplier: params.multiplier || 1.5,
      starts_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + duration * 60 * 1000).toISOString(),
      is_active: true,
    };

    const res = await fetch(this.getUrl('game_events'), {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(eventPayload),
    });

    const data = await res.json();
    return data[0];
  }

  // ==========================================
  // FINISH GAME
  // ==========================================
  async finishGame(gameId: string): Promise<{
    game: Game;
    awards: GameAward[];
    scores: PlayerScore[];
  }> {
    // 1. Termina Game
    const gUpdateRes = await fetch(this.getUrl(`games?id=eq.${gameId}`), {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ status: 'completed' }),
    });
    const game: Game = (await gUpdateRes.json())[0];

    // 2. Termina Room
    if (game?.room_id) {
      await fetch(this.getUrl(`rooms?id=eq.${game.room_id}`), {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify({ status: 'finished' }),
      });
    }

    // 3. Fetch Scores
    const sRes = await fetch(
      this.getUrl(`scores?game_id=eq.${gameId}&order=total_points.desc`),
      { headers: this.getHeaders(), cache: 'no-store' }
    );
    const scores: PlayerScore[] = sRes.ok ? await sRes.json() : [];

    // 4. Fetch Mission catalog & completed missions for awards
    const catRes = await fetch(this.getUrl('missions?select=*'), {
      headers: this.getHeaders(),
      cache: 'no-store',
    });
    const catalogList: Mission[] = catRes.ok ? await catRes.json() : [];
    const catMap = new Map(catalogList.map((m) => [m.id, m]));

    const pmRes = await fetch(
      this.getUrl(`player_missions?game_id=eq.${gameId}&status=eq.completed`),
      { headers: this.getHeaders(), cache: 'no-store' }
    );
    const completedRaw: PlayerMission[] = pmRes.ok ? await pmRes.json() : [];
    const completed = completedRaw
      .filter((pm) => catMap.has(pm.mission_id))
      .map((pm) => ({
        playerId: pm.player_id,
        mission: catMap.get(pm.mission_id)!,
      }));

    const awards = calculateEndGameAwards(scores, completed);
    return { game, awards, scores };
  }
}

export const supabaseStore = new SupabaseStore();
