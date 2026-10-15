-- ==============================================================================
-- AFTER DARK — Supabase PostgreSQL Schema & Realtime Setup
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES (Anonymous or Authenticated Player Identity)
create table if not exists public.profiles (
  id uuid primary key default uuid_generate_v4(),
  nickname text not null,
  avatar_seed text not null default 'default',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. ROOMS
create table if not exists public.rooms (
  id uuid primary key default uuid_generate_v4(),
  code varchar(8) unique not null,
  group_name text not null default 'I Guerrieri della Notte',
  mode text not null check (mode in ('bar', 'discoteca', 'house_party', 'outdoor', 'chaos')),
  min_players int not null default 3 check (min_players >= 2),
  max_players int not null default 16 check (max_players <= 32),
  duration_minutes int not null default 45,
  allowed_difficulties text[] not null default array['facile', 'media', 'difficile', 'leggendaria'],
  allow_coop boolean not null default true,
  host_id uuid not null,
  status text not null default 'lobby' check (status in ('lobby', 'playing', 'finished', 'abandoned')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '8 hours')
);

create index if not exists idx_rooms_code on public.rooms (code);
create index if not exists idx_rooms_status on public.rooms (status);

-- 3. ROOM_MEMBERS
create table if not exists public.room_members (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  player_id uuid not null,
  nickname text not null,
  avatar_seed text not null default 'default',
  is_host boolean not null default false,
  is_connected boolean not null default true,
  joined_at timestamptz not null default now(),
  last_heartbeat_at timestamptz not null default now(),
  unique (room_id, player_id)
);

create index if not exists idx_room_members_room on public.room_members (room_id);
create index if not exists idx_room_members_player on public.room_members (player_id);

-- 4. GAMES
create table if not exists public.games (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'paused', 'completed')),
  started_at timestamptz not null default now(),
  ends_at timestamptz,
  current_round int not null default 1,
  config jsonb not null default '{}'::jsonb
);

create index if not exists idx_games_room on public.games (room_id);

-- 5. MISSIONS (Master catalog)
create table if not exists public.missions (
  id text primary key,
  title text not null,
  description text not null,
  compatible_modes text[] not null,
  category text not null check (category in ('socializzazione', 'osservazione', 'deduzione', 'persuasione', 'creativita', 'collaborazione', 'bluff', 'chaos')),
  difficulty text not null check (difficulty in ('facile', 'media', 'difficile', 'leggendaria')),
  base_points int not null default 100,
  estimated_duration_minutes int not null default 10,
  target_participants int not null default 2,
  verification_type text not null check (verification_type in ('peer_witness', 'peer_target', 'group_vote', 'self_timer', 'host_approval')),
  special_conditions text[] default array[]::text[],
  is_secret boolean not null default true
);

-- 6. PLAYER_MISSIONS (Assegnazioni delle missioni ai giocatori)
create table if not exists public.player_missions (
  id uuid primary key default uuid_generate_v4(),
  game_id uuid not null references public.games(id) on delete cascade,
  player_id uuid not null,
  mission_id text not null references public.missions(id) on delete restrict,
  coop_partner_id uuid,
  status text not null default 'active' check (status in ('active', 'pending_verification', 'completed', 'failed', 'cancelled')),
  assigned_at timestamptz not null default now(),
  completed_at timestamptz,
  earned_points int not null default 0
);

create index if not exists idx_player_missions_game_player on public.player_missions (game_id, player_id);
create index if not exists idx_player_missions_status on public.player_missions (status);

-- 7. MISSION_VERIFICATIONS (Processo di verifica a due parti)
create table if not exists public.mission_verifications (
  id uuid primary key default uuid_generate_v4(),
  player_mission_id uuid not null references public.player_missions(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete cascade,
  requester_player_id uuid not null,
  verifier_player_id uuid not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'disputed')),
  note text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists idx_verifications_game_verifier on public.mission_verifications (game_id, verifier_player_id);
create index if not exists idx_verifications_mission on public.mission_verifications (player_mission_id);

-- 8. GAME_EVENTS (Eventi Chaos & Bonus a tempo)
create table if not exists public.game_events (
  id uuid primary key default uuid_generate_v4(),
  game_id uuid not null references public.games(id) on delete cascade,
  type text not null check (type in ('bonus_mission', 'double_points', 'countdown_rush', 'collective_goal', 'time_bomb', 'chaos_swap')),
  title text not null,
  description text not null,
  multiplier numeric not null default 1.0,
  payload jsonb default '{}'::jsonb,
  starts_at timestamptz not null default now(),
  expires_at timestamptz not null,
  is_active boolean not null default true
);

create index if not exists idx_game_events_game on public.game_events (game_id);

-- 9. SCORES (Punteggi in tempo reale e titoli di fine serata)
create table if not exists public.scores (
  id uuid primary key default uuid_generate_v4(),
  game_id uuid not null references public.games(id) on delete cascade,
  player_id uuid not null,
  nickname text not null,
  avatar_seed text not null default 'default',
  total_points int not null default 0,
  completed_count int not null default 0,
  failed_count int not null default 0,
  bonus_points int not null default 0,
  awarded_titles text[] not null default array[]::text[],
  updated_at timestamptz not null default now(),
  unique (game_id, player_id)
);

create index if not exists idx_scores_game_points on public.scores (game_id, total_points desc);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.games enable row level security;
alter table public.missions enable row level security;
alter table public.player_missions enable row level security;
alter table public.mission_verifications enable row level security;
alter table public.game_events enable row level security;
alter table public.scores enable row level security;

-- Rooms: chiunque può leggere o creare stanze
create policy "Rooms are readable by all" on public.rooms for select using (true);
create policy "Rooms are insertable by anyone" on public.rooms for insert with check (true);
create policy "Rooms are updatable by host" on public.rooms for update using (true);

-- Room Members: leggibili da tutti, inseribili e aggiornabili
create policy "Room members are viewable by all" on public.room_members for select using (true);
create policy "Room members are insertable" on public.room_members for insert with check (true);
create policy "Room members can update their own presence" on public.room_members for update using (true);

-- Games: leggibili da tutti i partecipanti
create policy "Games are viewable by all" on public.games for select using (true);
create policy "Games can be managed" on public.games for all using (true);

-- Missions: catalogo pubblico in sola lettura
create policy "Missions catalog is readable" on public.missions for select using (true);

-- PLAYER_MISSIONS: SICUREZZA CRITICA!
-- Un giocatore può selezionare SOLO le missioni assegnate a se stesso o in cui è coop partner!
-- Gli avversari NON POSSONO LEGGERE le missioni segrete altrui!
create policy "Player missions secrecy policy" on public.player_missions for select
  using (
    player_id::text = coalesce(auth.jwt()->>'sub', current_setting('request.jwt.claim.sub', true), '')
    or coop_partner_id::text = coalesce(auth.jwt()->>'sub', current_setting('request.jwt.claim.sub', true), '')
    or current_user = 'service_role'
  );

-- Mission Verifications: visibile solo al richiedente e al testimone
create policy "Verifications viewable only by involved parties" on public.mission_verifications for select
  using (
    requester_player_id::text = coalesce(auth.jwt()->>'sub', current_setting('request.jwt.claim.sub', true), '')
    or verifier_player_id::text = coalesce(auth.jwt()->>'sub', current_setting('request.jwt.claim.sub', true), '')
    or current_user = 'service_role'
  );

-- Game Events & Scores: pubblici per tutti i giocatori della partita
create policy "Game events are readable by all" on public.game_events for select using (true);
create policy "Scores are readable by all" on public.scores for select using (true);

-- ==============================================================================
-- REALTIME PUBLICATION
-- ==============================================================================
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.room_members;
alter publication supabase_realtime add table public.games;
alter publication supabase_realtime add table public.player_missions;
alter publication supabase_realtime add table public.mission_verifications;
alter publication supabase_realtime add table public.game_events;
alter publication supabase_realtime add table public.scores;
