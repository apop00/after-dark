export type GameMode = 'bar' | 'discoteca' | 'house_party' | 'outdoor' | 'chaos' | 'jeffrey_island';

export type MissionCategory =
  | 'socializzazione'
  | 'osservazione'
  | 'deduzione'
  | 'persuasione'
  | 'creativita'
  | 'collaborazione'
  | 'bluff'
  | 'chaos'
  | 'jeffrey_island';

export type MissionDifficulty = 'facile' | 'media' | 'difficile' | 'leggendaria';

export type PlayerGender = 'neutro' | 'uomo' | 'donna';

export type VerificationType =
  | 'peer_witness'    // Un altro giocatore fa da testimone ("ha visto che l'ho fatto")
  | 'peer_target'     // Il bersaglio conferma ("sono io la persona con cui l'ha fatto")
  | 'group_vote'      // Almeno 2-3 persone confermano a voce/voto
  | 'self_timer'      // Missione personale a tempo con autodichiarazione onesta
  | 'host_approval';  // Confermata dall'host della partita

export interface Mission {
  id: string;
  title: string;
  description: string;
  compatible_modes: GameMode[];
  category: MissionCategory;
  difficulty: MissionDifficulty;
  base_points: number;
  estimated_duration_minutes: number;
  target_participants: number; // 1 = solo esecutore, 2 = con 1 testimone/bersaglio, 3+ = gruppo
  verification_type: VerificationType;
  special_conditions?: string[];
  is_secret: boolean;
  repeat_cooldown_games?: number; // Quante partite prima di poter ricomparire
  tags?: string[];
  gender_target?: PlayerGender; // 'neutro' (default, per tutti) | 'uomo' | 'donna'
}

export type ProgressionMode = 'free' | 'sequential'; // 'free' (Tutte Insieme) | 'sequential' (Catena di Sfide 🔥)
export type ScoringMode = 'points' | 'mission_count'; // 'points' (A Punti) | 'mission_count' (Numero di Missioni)
export type MissionDistribution = 'fair' | 'random'; // 'fair' (Difficoltà Simile) | 'random' (Difficoltà Casuali)
export type SkipDifficultyRule = 'same' | 'harder' | 'random'; // 'same' (Stesso Livello) | 'harder' (Più Difficile) | 'random' (Casuale)

export type RoomStatus = 'lobby' | 'playing' | 'finished' | 'abandoned' | 'expired';

export interface Room {
  id: string;
  code: string; // 6 char uppercase alphanumeric (e.g. DARK42)
  group_name: string;
  mode: GameMode;
  min_players: number;
  max_players: number;
  duration_minutes: number; // 30, 45, 60, 90, 120 (0 = open ended)
  allowed_difficulties: MissionDifficulty[];
  allow_coop: boolean;
  require_witness?: boolean;
  missions_per_player?: number;
  enable_gender_missions?: boolean;
  include_jeffrey_pack?: boolean;
  is_public?: boolean; // Se true, compare nell'elenco delle lobby pubbliche aperte
  hide_tasks?: boolean; // Se true (default), le task partono coperte con tocca per rivelare; se false, sono palesi / scoperte
  progression_mode?: ProgressionMode; // 'free' o 'sequential' (Catena di Sfide)
  scoring_mode?: ScoringMode; // 'points' o 'mission_count'
  mission_distribution?: MissionDistribution; // 'fair' o 'random'
  max_skips_per_player?: number; // 0, 1, 2, 3
  skip_difficulty_rule?: SkipDifficultyRule; // 'same', 'harder', 'random'
  penalty_probability?: number; // 0, 10, 25, 50, 100 (% probabilità di ricevere un malus segreto)
  host_id: string; // player_id of creator
  status: RoomStatus;
  created_at: string;
  expires_at: string;
}

export interface PlayerPenalty {
  id: string;
  penalty_id: string;
  title: string;
  description: string;
  duration_minutes?: number;
  requires_target_player?: boolean;
  target_player_nickname?: string;
  target_player_id?: string;
  category?: 'tempo' | 'comportamento' | 'sociale' | 'recitazione';
  icon?: string;
  status: 'active' | 'completed';
  assigned_at: string;
  completed_at?: string | null;
}

export interface RoomMember {
  id: string;
  room_id: string;
  player_id: string;
  nickname: string;
  avatar_seed: string;
  gender?: PlayerGender;
  is_host: boolean;
  is_connected: boolean;
  joined_at: string;
  last_heartbeat_at: string;
}

export type GameStatus = 'active' | 'paused' | 'completed';

export interface Game {
  id: string;
  room_id: string;
  status: GameStatus;
  started_at: string;
  ends_at: string | null;
  current_round: number;
  config: {
    mode: GameMode;
    duration_minutes: number;
    allow_coop: boolean;
    require_witness?: boolean;
    missions_per_player: number;
    enable_gender_missions?: boolean;
    include_jeffrey_pack?: boolean;
    hide_tasks?: boolean;
    progression_mode?: ProgressionMode;
    scoring_mode?: ScoringMode;
    mission_distribution?: MissionDistribution;
    max_skips_per_player?: number;
    skip_difficulty_rule?: SkipDifficultyRule;
    penalty_probability?: number;
    penalties?: Record<string, PlayerPenalty>; // key: player_id
    real_mission_ids?: Record<string, string>;
  };
}

export type PlayerMissionStatus =
  | 'active'
  | 'pending_verification'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface PlayerMission {
  id: string;
  game_id: string;
  player_id: string;
  mission_id: string;
  coop_partner_id?: string | null;
  coop_partner_nickname?: string | null;
  coop_team_nicknames?: string[] | null;
  status: PlayerMissionStatus;
  assigned_at: string;
  completed_at?: string | null;
  earned_points: number;
  mission?: Mission; // Joined data
  verification_id?: string | null;
}

export type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'disputed';

export interface MissionVerification {
  id: string;
  player_mission_id: string;
  game_id: string;
  requester_player_id: string;
  verifier_player_id: string;
  status: VerificationStatus;
  note?: string | null;
  created_at: string;
  resolved_at?: string | null;
}

export type GameEventType =
  | 'bonus_mission'
  | 'double_points'
  | 'countdown_rush'
  | 'collective_goal'
  | 'time_bomb'
  | 'chaos_swap';

export interface GameEvent {
  id: string;
  game_id: string;
  type: GameEventType;
  title: string;
  description: string;
  multiplier: number;
  starts_at: string;
  expires_at: string;
  is_active: boolean;
  payload?: Record<string, unknown>;
}

export interface PlayerScore {
  id: string;
  game_id: string;
  player_id: string;
  nickname: string;
  avatar_seed: string;
  total_points: number;
  completed_count: number;
  failed_count: number;
  bonus_points: number;
  skips_used?: number;
  awarded_titles: string[];
  updated_at: string;
}

export interface GameAward {
  id: string;
  title: string;
  tagline: string;
  icon: string;
  recipient_player_id: string;
  recipient_nickname: string;
  reason: string;
}

export interface PlayerSession {
  playerId: string;
  nickname: string;
  avatarSeed: string;
  gender?: PlayerGender;
  soundEnabled?: boolean;
  hapticEnabled?: boolean;
  currentRoomCode?: string;
  currentGameId?: string;
}
