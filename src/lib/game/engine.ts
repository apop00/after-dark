import {
  GameMode,
  Mission,
  MissionDifficulty,
  PlayerMission,
  PlayerScore,
  GameAward,
  GameEvent,
  PlayerGender,
  ProgressionMode,
  ScoringMode,
  MissionDistribution,
  SkipDifficultyRule,
  PlayerPenalty,
} from '@/types/game';
import { MISSIONS_DATABASE } from '@/data/missions';
import { PENALTIES_DATABASE } from '@/data/penalties';

/**
 * Genera un codice stanza a 6 caratteri alfanumerici non ambigui
 */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export interface MissionAssignmentConfig {
  mode: GameMode;
  allowedDifficulties?: MissionDifficulty[];
  allowCoop?: boolean;
  missionsPerPlayer?: number; // di default 3
  enableGenderMissions?: boolean;
  includeJeffreyPack?: boolean;
  progressionMode?: ProgressionMode;
  scoringMode?: ScoringMode;
  missionDistribution?: MissionDistribution;
  maxSkipsPerPlayer?: number;
  skipDifficultyRule?: SkipDifficultyRule;
}

/**
 * Raggruppa i giocatori in coppie (o triplette se > 4 giocatori) per le missioni di cooperazione
 */
export function partitionPlayersIntoCoopTeams<T extends { playerId: string; nickname: string }>(
  players: T[]
): T[][] {
  if (players.length < 2) return [];
  if (players.length === 2) return [[players[0], players[1]]];
  if (players.length === 3) return [[players[0], players[1], players[2]]];
  if (players.length === 4) return [[players[0], players[1]], [players[2], players[3]]];

  // Per più di 4 giocatori: raggruppa in triplette e coppie in modo bilanciato
  const shuffled = [...players].sort(() => Math.random() - 0.5);
  const teams: T[][] = [];
  const n = shuffled.length;
  let i = 0;

  if (n % 3 === 0) {
    while (i < n) {
      teams.push([shuffled[i], shuffled[i + 1], shuffled[i + 2]]);
      i += 3;
    }
  } else if (n % 3 === 2) {
    teams.push([shuffled[i], shuffled[i + 1]]);
    i += 2;
    while (i < n) {
      teams.push([shuffled[i], shuffled[i + 1], shuffled[i + 2]]);
      i += 3;
    }
  } else {
    // n % 3 === 1 (es. 7 = 2 + 2 + 3)
    teams.push([shuffled[i], shuffled[i + 1]]);
    i += 2;
    teams.push([shuffled[i], shuffled[i + 1]]);
    i += 2;
    while (i < n) {
      teams.push([shuffled[i], shuffled[i + 1], shuffled[i + 2]]);
      i += 3;
    }
  }

  return teams;
}

/**
 * Distribuisce missioni segrete ai giocatori in modo bilanciato ed equo
 */
export function assignMissionsToPlayers(
  gameId: string,
  players: { playerId: string; nickname: string; gender?: PlayerGender }[],
  config: MissionAssignmentConfig
): PlayerMission[] {
  const missionsPerPlayer = config.missionsPerPlayer || 3;
  const allowedDifficulties = config.allowedDifficulties || [
    'facile',
    'media',
    'difficile',
    'leggendaria',
  ];

  const isJeffreyMode = config.mode === 'jeffrey_island';
  const includeJeffrey = isJeffreyMode || Boolean(config.includeJeffreyPack);

  // Filtra il catalogo per la modalità selezionata e difficoltà consentite
  const eligibleMissions = MISSIONS_DATABASE.filter((m) => {
    // Difficoltà consentite
    if (!allowedDifficulties.includes(m.difficulty)) return false;

    // Se è la modalità specifica Jeffrey Island
    if (isJeffreyMode) {
      return m.category === 'jeffrey_island' || m.compatible_modes.includes('jeffrey_island');
    }

    // Modalità standard (es. bar, house_party, discoteca, chaos, outdoor)
    const matchesMode = m.compatible_modes.includes(config.mode);
    const matchesJeffrey =
      includeJeffrey &&
      (m.category === 'jeffrey_island' || m.compatible_modes.includes('jeffrey_island'));

    return matchesMode || matchesJeffrey;
  });

  if (eligibleMissions.length === 0) {
    throw new Error(`Nessuna missione trovata per la modalità ${config.mode}`);
  }

  const assignedPlayerMissions: PlayerMission[] = [];
  const usedMissionIds = new Set<string>();
  const assignedMissionIdsByPlayer = new Map<string, Set<string>>();

  const coopMissions = eligibleMissions.filter((m) => m.category === 'collaborazione');
  const individualMissions = eligibleMissions.filter((m) => m.category !== 'collaborazione');

  // Mappa conteggio missioni assegnate e set ID per giocatore
  const playerAssignedCounts: Record<string, number> = {};
  players.forEach((p) => {
    playerAssignedCounts[p.playerId] = 0;
    assignedMissionIdsByPlayer.set(p.playerId, new Set<string>());
  });

  // Se coop è abilitata e ci sono almeno 2 giocatori e missioni coop disponibili:
  // Assegniamo 1 missione di squadra condivisa a ogni coppia/tripletta!
  if (config.allowCoop && players.length >= 2 && coopMissions.length > 0 && missionsPerPlayer >= 1) {
    const teams = partitionPlayersIntoCoopTeams(players);
    const shuffledCoop = [...coopMissions].sort(() => Math.random() - 0.5);

    teams.forEach((team, teamIdx) => {
      const teamMission = shuffledCoop[teamIdx % shuffledCoop.length];
      usedMissionIds.add(teamMission.id);

      team.forEach((member) => {
        const partners = team.filter((m) => m.playerId !== member.playerId);
        const partnerNicknames = partners.map((p) => p.nickname).join(' & ');
        const primaryPartnerId = partners[0]?.playerId || null;

        const randomSuffix = Math.random().toString(36).substring(2, 7);
        assignedPlayerMissions.push({
          id: `pm_${Date.now()}_${member.playerId.slice(0, 4)}_${playerAssignedCounts[member.playerId]}_${randomSuffix}`,
          game_id: gameId,
          player_id: member.playerId,
          mission_id: teamMission.id,
          coop_partner_id: primaryPartnerId,
          coop_partner_nickname: partnerNicknames,
          coop_team_nicknames: partners.map((p) => p.nickname),
          status: 'active',
          assigned_at: new Date().toISOString(),
          earned_points: 0,
          mission: teamMission,
        });

        assignedMissionIdsByPlayer.get(member.playerId)?.add(teamMission.id);
        playerAssignedCounts[member.playerId]++;
      });
    });
  }

  // Helper per verificare compatibilità di genere per un giocatore
  const isMissionCompatibleWithPlayer = (mission: Mission, playerGender?: PlayerGender) => {
    // Se le missioni per genere sono disabilitate, usa solo missioni neutre
    if (!config.enableGenderMissions) {
      return !mission.gender_target || mission.gender_target === 'neutro';
    }

    if (mission.gender_target === 'uomo') {
      return playerGender === 'uomo';
    }
    if (mission.gender_target === 'donna') {
      return playerGender === 'donna';
    }
    // Missione neutra o senza target: assegnabile a chiunque (uomo, donna o neutro)
    return true;
  };

  // Completa il resto delle missioni per ciascun giocatore
  const basePool = (individualMissions.length > 0 ? individualMissions : eligibleMissions)
    .sort(() => Math.random() - 0.5);

  // Template di difficoltà equo per "Fair Mode" (es. facile, media, difficile, ...)
  const isFairMode = config.missionDistribution === 'fair';
  const difficultyCycle: MissionDifficulty[] = allowedDifficulties.length > 0
    ? allowedDifficulties
    : ['facile', 'media', 'difficile'];

  players.forEach((player, playerIdx) => {
    const playerAssignedSet = assignedMissionIdsByPlayer.get(player.playerId) || new Set<string>();

    // Filtra la pool personalizzata per il genere del giocatore se opportuno
    const playerSpecificPool = basePool.filter((m) =>
      isMissionCompatibleWithPlayer(m, player.gender)
    );
    const poolToUse =
      playerSpecificPool.length > 0
        ? playerSpecificPool
        : basePool.filter((m) => !m.gender_target || m.gender_target === 'neutro');

    // Mescola e ordina preferendo missioni non ancora usate nella stanza per massimizzare la varietà
    const shuffledPool = [...poolToUse].sort(() => Math.random() - 0.5);
    const sortedPool = [...shuffledPool].sort((a, b) => {
      const aUsed = usedMissionIds.has(a.id) ? 1 : 0;
      const bUsed = usedMissionIds.has(b.id) ? 1 : 0;
      return aUsed - bUsed;
    });

    let assignedForThisPlayer = playerAssignedCounts[player.playerId];
    let slotIndex = 0;

    while (
      assignedForThisPlayer < missionsPerPlayer &&
      slotIndex < missionsPerPlayer * 10
    ) {
      // In Fair Mode, cerchiamo prima una missione della difficoltà prevista per questo slot
      let chosenMission: Mission | undefined;

      if (isFairMode) {
        const targetDiff = difficultyCycle[slotIndex % difficultyCycle.length];
        chosenMission = sortedPool.find(
          (m) =>
            m.difficulty === targetDiff &&
            !playerAssignedSet.has(m.id) &&
            !usedMissionIds.has(m.id)
        );
        // Fallback: se usata in stanza ma non ancora assegnata a questo giocatore
        if (!chosenMission) {
          chosenMission = sortedPool.find(
            (m) => m.difficulty === targetDiff && !playerAssignedSet.has(m.id)
          );
        }
      }

      // Se non è Fair Mode (Chaos/Random) o se non abbiamo trovato la difficoltà target:
      if (!chosenMission) {
        chosenMission = sortedPool.find(
          (m) => !playerAssignedSet.has(m.id) && !usedMissionIds.has(m.id)
        );
        if (!chosenMission) {
          chosenMission = sortedPool.find((m) => !playerAssignedSet.has(m.id));
        }
      }

      slotIndex++;
      if (!chosenMission) break;

      const randomSuffix = Math.random().toString(36).substring(2, 7);
      assignedPlayerMissions.push({
        id: `pm_${Date.now()}_${playerIdx}_${assignedForThisPlayer}_${randomSuffix}`,
        game_id: gameId,
        player_id: player.playerId,
        mission_id: chosenMission.id,
        coop_partner_id: null,
        status: 'active',
        assigned_at: new Date().toISOString(),
        earned_points: 0,
        mission: chosenMission,
      });

      playerAssignedSet.add(chosenMission.id);
      usedMissionIds.add(chosenMission.id);
      assignedForThisPlayer++;
      playerAssignedCounts[player.playerId] = assignedForThisPlayer;
    }
  });

  // Organizziamo le missioni di ciascun giocatore in modo coerente e sincronizzato
  // In particolare: le missioni coop DEVONO uscire nello stesso ordine/slot per entrambi i compagni
  const diffRank: Record<MissionDifficulty, number> = {
    facile: 1,
    media: 2,
    difficile: 3,
    leggendaria: 4,
  };

  // Posizione fissa e identica per tutti i compagni di squadra della missione coop
  // (es. con 3 task, la coop è esattamente allo slot 1 / Task 2 per entrambi i compagni)
  const coopSlotIndex = Math.min(1, Math.max(0, missionsPerPlayer - 1));

  const finalAssignedPlayerMissions: PlayerMission[] = [];

  players.forEach((player) => {
    const playerMissions = assignedPlayerMissions.filter((pm) => pm.player_id === player.playerId);
    const coop = playerMissions.filter(
      (pm) => pm.coop_partner_id !== null || pm.mission?.category === 'collaborazione'
    );
    const individual = playerMissions.filter(
      (pm) => pm.coop_partner_id === null && pm.mission?.category !== 'collaborazione'
    );

    // Se è attiva la modalità sequenziale "Catena di Sfide", ordiniamo le missioni individuali per difficoltà crescente
    if (config.progressionMode === 'sequential') {
      individual.sort((a, b) => {
        const rankA = a.mission ? diffRank[a.mission.difficulty] || 2 : 2;
        const rankB = b.mission ? diffRank[b.mission.difficulty] || 2 : 2;
        return rankA - rankB;
      });
    }

    // Inseriamo la missione coop esattamente allo stesso slot per tutti i membri della squadra
    const ordered: PlayerMission[] = [...individual];
    coop.forEach((c) => {
      const insertAt = Math.min(coopSlotIndex, ordered.length);
      ordered.splice(insertAt, 0, c);
    });

    finalAssignedPlayerMissions.push(...ordered);
  });

  return finalAssignedPlayerMissions;
}

/**
 * Calcola il punteggio finale di una missione tenendo conto di eventuali eventi Chaos o moltiplicatori attivi
 */
export function calculateMissionPoints(
  mission: Mission,
  activeEvents: GameEvent[] = [],
  isDoublePoints: boolean = false
): number {
  let points = mission.base_points;

  // Applica moltiplicatori degli eventi attivi
  for (const event of activeEvents) {
    if (event.is_active && event.multiplier > 1) {
      points = Math.round(points * event.multiplier);
    }
  }

  if (isDoublePoints) {
    points = points * 2;
  }

  return points;
}

/**
 * Calcola i titoli ironici e i riconoscimenti speciali di fine serata
 */
export function calculateEndGameAwards(
  scores: PlayerScore[],
  completedMissions: { playerId: string; mission: Mission }[]
): GameAward[] {
  if (scores.length === 0) return [];

  const awards: GameAward[] = [];

  // 1. Leggenda del Gruppo (Punteggio più alto)
  const sortedByPoints = [...scores].sort((a, b) => b.total_points - a.total_points);
  const winner = sortedByPoints[0];
  if (winner) {
    awards.push({
      id: 'award_winner',
      title: 'Leggenda della Notte',
      tagline: 'Ha dominato la serata senza pietà',
      icon: 'Crown',
      recipient_player_id: winner.player_id,
      recipient_nickname: winner.nickname,
      reason: `Primo posto assoluto con ${winner.total_points} punti conquistati e ${winner.completed_count} missioni portate a termine.`,
    });
  }

  // 2. Agente del Caos (Maggior numero di missioni Chaos / Bluff)
  const chaosCounts: Record<string, number> = {};
  completedMissions.forEach((cm) => {
    if (cm.mission.category === 'chaos' || cm.mission.category === 'bluff') {
      chaosCounts[cm.playerId] = (chaosCounts[cm.playerId] || 0) + 1;
    }
  });
  let maxChaos = 0;
  let chaosPlayerId = '';
  Object.entries(chaosCounts).forEach(([pid, cnt]) => {
    if (cnt > maxChaos) {
      maxChaos = cnt;
      chaosPlayerId = pid;
    }
  });
  if (chaosPlayerId) {
    const p = scores.find((s) => s.player_id === chaosPlayerId);
    if (p) {
      awards.push({
        id: 'award_chaos',
        title: 'Agente del Caos',
        tagline: 'Imprevedibile, sovversivo, pericoloso per la quiete pubblica',
        icon: 'Flame',
        recipient_player_id: p.player_id,
        recipient_nickname: p.nickname,
        reason: `Ha seminato scompiglio con ${maxChaos} missioni di puro caos e sfacciato bluff.`,
      });
    }
  }

  // 3. Manipolatore della Serata (Persuasione / Socializzazione)
  const persuasionCounts: Record<string, number> = {};
  completedMissions.forEach((cm) => {
    if (cm.mission.category === 'persuasione' || cm.mission.category === 'socializzazione') {
      persuasionCounts[cm.playerId] = (persuasionCounts[cm.playerId] || 0) + 1;
    }
  });
  let maxPersuasion = 0;
  let persuasionPlayerId = '';
  Object.entries(persuasionCounts).forEach(([pid, cnt]) => {
    if (cnt > maxPersuasion) {
      maxPersuasion = cnt;
      persuasionPlayerId = pid;
    }
  });
  if (persuasionPlayerId && persuasionPlayerId !== winner?.player_id) {
    const p = scores.find((s) => s.player_id === persuasionPlayerId);
    if (p) {
      awards.push({
        id: 'award_persuasion',
        title: 'Manipolatore della Serata',
        tagline: 'Ti convince che hai torto e ti fa anche ringraziare',
        icon: 'Eye',
        recipient_player_id: p.player_id,
        recipient_nickname: p.nickname,
        reason: `Ha manovrato gli altri partecipanti con ${maxPersuasion} missioni di fine persuasione psicologica.`,
      });
    }
  }

  // 4. Fallimento Glorioso (Chi ha provato ma è rimasto in fondo)
  if (sortedByPoints.length > 2) {
    const last = sortedByPoints[sortedByPoints.length - 1];
    awards.push({
      id: 'award_glorious_fail',
      title: 'Fallimento Glorioso',
      tagline: 'L\'importante non è vincere, è farsi notare provandoci',
      icon: 'Skull',
      recipient_player_id: last.player_id,
      recipient_nickname: last.nickname,
      reason: `Ha resistito fino alla fine chiudendo con ${last.total_points} punti. Ci rivediamo alla prossima rivincita.`,
    });
  }

  return awards;
}

/**
 * Assegna penalità/malus casuali ai giocatori in base alla probabilità configurata (0, 10, 25, 50, 100%).
 * Regola: la penitenza NON compare a tutti i giocatori!
 * - Fino a 6 giocatori: compare a SOLO 1 giocatore nel match.
 * - Da 7 a 10 giocatori: compare a SOLO 2 giocatori nel match.
 * Le punizioni escono a caso dopo la prima task fino a dopo la penultima task (tra 1 e missionsPerPlayer - 1).
 */
export function assignPenaltiesToPlayers<T extends { playerId: string; nickname: string }>(
  players: T[],
  penaltyProbability: number = 0,
  missionsPerPlayer: number = 3
): Record<string, PlayerPenalty> {
  if (!penaltyProbability || penaltyProbability <= 0 || players.length === 0) {
    return {};
  }

  // Roll basato sulla probabilità configurata per la partita
  const probNormalized = Math.min(100, Math.max(0, penaltyProbability));
  const roll = Math.random() * 100;
  if (roll >= probNormalized) {
    return {};
  }

  // Quanti giocatori ricevono il malus:
  // - 1 giocatore fino a 6 partecipanti
  // - 2 giocatori da 7 a 10 partecipanti (e oltre)
  const targetCount = players.length <= 6 ? 1 : 2;
  const actualCount = Math.min(targetCount, players.length);

  // Seleziona casualmente i giocatori bersaglio tra tutti i partecipanti
  const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
  const selectedPlayers = shuffledPlayers.slice(0, actualCount);

  // Range di trigger: da dopo la prima task (1) fino a dopo la penultima task (missionsPerPlayer - 1)
  const minTrigger = 1;
  const maxTrigger = Math.max(1, missionsPerPlayer - 1);

  // Mescola le penalità per dare sfide diverse se ci sono più puniti
  const shuffledPenalties = [...PENALTIES_DATABASE].sort(() => Math.random() - 0.5);

  const assigned: Record<string, PlayerPenalty> = {};

  selectedPlayers.forEach((player, idx) => {
    const def = shuffledPenalties[idx % shuffledPenalties.length];

    // Calcola quando scatterà la penitenza a sorpresa per questo giocatore
    const triggerAfterTask = minTrigger + Math.floor(Math.random() * (maxTrigger - minTrigger + 1));

    let targetPlayerNickname: string | undefined;
    let targetPlayerId: string | undefined;
    let desc = def.description;

    if (def.requires_target_player) {
      const others = players.filter((p) => p.playerId !== player.playerId);
      if (others.length > 0) {
        const target = others[Math.floor(Math.random() * others.length)];
        targetPlayerNickname = target.nickname;
        targetPlayerId = target.playerId;
        desc = desc.replace('{target_player}', target.nickname);
      } else {
        desc = desc.replace('{target_player}', 'un compagno a tua scelta');
      }
    }

    const penalty: PlayerPenalty = {
      id: 'pen_' + player.playerId + '_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      penalty_id: def.id,
      title: def.title,
      description: desc,
      duration_minutes: def.duration_minutes,
      requires_target_player: def.requires_target_player,
      target_player_nickname: targetPlayerNickname,
      target_player_id: targetPlayerId,
      category: def.category,
      icon: def.icon,
      trigger_after_task: triggerAfterTask,
      status: 'active',
      assigned_at: new Date().toISOString(),
    };

    assigned[player.playerId] = penalty;
  });

  return assigned;
}
