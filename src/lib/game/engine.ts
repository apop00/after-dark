import {
  GameMode,
  Mission,
  MissionDifficulty,
  PlayerMission,
  PlayerScore,
  GameAward,
  GameEvent,
} from '@/types/game';
import { MISSIONS_DATABASE } from '@/data/missions';

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
}

/**
 * Distribuisce missioni segrete ai giocatori in modo bilanciato ed equo
 */
export function assignMissionsToPlayers(
  gameId: string,
  players: { playerId: string; nickname: string }[],
  config: MissionAssignmentConfig
): PlayerMission[] {
  const missionsPerPlayer = config.missionsPerPlayer || 3;
  const allowedDifficulties = config.allowedDifficulties || [
    'facile',
    'media',
    'difficile',
    'leggendaria',
  ];

  // Filtra il catalogo per la modalità selezionata e difficoltà consentite
  const eligibleMissions = MISSIONS_DATABASE.filter(
    (m) =>
      m.compatible_modes.includes(config.mode) &&
      allowedDifficulties.includes(m.difficulty)
  );

  if (eligibleMissions.length === 0) {
    throw new Error(`Nessuna missione trovata per la modalità ${config.mode}`);
  }

  // Shuffle delle missioni eleggibili
  const shuffled = [...eligibleMissions].sort(() => Math.random() - 0.5);

  const assignedPlayerMissions: PlayerMission[] = [];
  const usedMissionIds = new Set<string>();

  // Per ogni giocatore, cerchiamo di assegnare:
  // 1 Facile/Media, 1 Media/Difficile, 1 Specifica per la modalità
  players.forEach((player, playerIdx) => {
    let assignedCount = 0;
    const playerPool = [...shuffled];

    for (const mission of playerPool) {
      if (assignedCount >= missionsPerPlayer) break;

      // Evita duplicati nella stessa partita se possibile
      if (usedMissionIds.has(mission.id) && usedMissionIds.size < eligibleMissions.length) {
        continue;
      }

      // Se è collaborativa, seleziona un partner diverso dal giocatore attuale
      let coopPartnerId: string | null = null;
      if (mission.category === 'collaborazione' && config.allowCoop && players.length > 1) {
        const otherPlayers = players.filter((p) => p.playerId !== player.playerId);
        const partner = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
        coopPartnerId = partner.playerId;
      }

      usedMissionIds.add(mission.id);
      assignedPlayerMissions.push({
        id: `pm_${Date.now()}_${playerIdx}_${assignedCount}`,
        game_id: gameId,
        player_id: player.playerId,
        mission_id: mission.id,
        coop_partner_id: coopPartnerId,
        status: 'active',
        assigned_at: new Date().toISOString(),
        earned_points: 0,
        mission: mission,
      });

      assignedCount++;
    }
  });

  return assignedPlayerMissions;
}

/**
 * Calcola il punteggio finale di una missione tenendo conto di eventuali eventi Chaos o moltiplicatori attivi
 */
export function calculateMissionPoints(
  mission: Mission,
  activeEvents: GameEvent[] = []
): number {
  let points = mission.base_points;

  // Applica moltiplicatori degli eventi attivi
  for (const event of activeEvents) {
    if (event.is_active && event.multiplier > 1) {
      points = Math.round(points * event.multiplier);
    }
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
