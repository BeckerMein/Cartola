-- Cartola clone baseline schema (Supabase / Postgres)
-- Run this in Supabase SQL Editor.

begin;

create extension if not exists pgcrypto;

-- Profiles (linked to auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  username text unique not null,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Teams (one per user for now)
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (owner_id)
);

-- Reference data from Cartola
create table if not exists public.clubs (
  id int primary key,
  name text not null,
  abbreviation text not null
);

create table if not exists public.positions (
  id int primary key,
  name text not null
);

create table if not exists public.athletes (
  id int primary key,
  name text not null,
  nickname text,
  slug text,
  club_id int references public.clubs(id),
  position_id int references public.positions(id),
  status_id int,
  price numeric(10,2),
  updated_at timestamptz not null default now()
);

-- Rounds and market
create table if not exists public.rounds (
  id int primary key,
  starts_at timestamptz,
  ends_at timestamptz,
  is_open boolean not null default true
);

create table if not exists public.market (
  round_id int references public.rounds(id) on delete cascade,
  athlete_id int references public.athletes(id) on delete cascade,
  price numeric(10,2) not null,
  price_variation numeric(10,2),
  status_id int,
  primary key (round_id, athlete_id)
);

-- Lineups
create table if not exists public.lineups (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  round_id int not null references public.rounds(id) on delete cascade,
  captain_athlete_id int references public.athletes(id),
  created_at timestamptz not null default now(),
  unique (team_id, round_id)
);

create table if not exists public.lineup_players (
  lineup_id uuid not null references public.lineups(id) on delete cascade,
  athlete_id int not null references public.athletes(id),
  is_starter boolean not null default true,
  primary key (lineup_id, athlete_id)
);

-- Scoring
create table if not exists public.athlete_scores (
  round_id int not null references public.rounds(id) on delete cascade,
  athlete_id int not null references public.athletes(id),
  points numeric(10,2) not null,
  primary key (round_id, athlete_id)
);

create table if not exists public.team_scores (
  round_id int not null references public.rounds(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  points numeric(10,2) not null,
  primary key (round_id, team_id)
);

-- Leagues
create table if not exists public.leagues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.league_members (
  league_id uuid not null references public.leagues(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (league_id, team_id)
);

-- Keep updated_at in sync for profiles
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_profiles_set_updated_at on public.profiles;
create trigger trg_profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- RLS
alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.lineups enable row level security;
alter table public.lineup_players enable row level security;
alter table public.leagues enable row level security;
alter table public.league_members enable row level security;

alter table public.clubs enable row level security;
alter table public.positions enable row level security;
alter table public.athletes enable row level security;
alter table public.rounds enable row level security;
alter table public.market enable row level security;
alter table public.athlete_scores enable row level security;
alter table public.team_scores enable row level security;

-- Profiles policies
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert with check (auth.uid() = id);

-- Teams policies
drop policy if exists teams_select_own on public.teams;
create policy teams_select_own on public.teams
  for select using (auth.uid() = owner_id);

drop policy if exists teams_insert_own on public.teams;
create policy teams_insert_own on public.teams
  for insert with check (auth.uid() = owner_id);

drop policy if exists teams_update_own on public.teams;
create policy teams_update_own on public.teams
  for update using (auth.uid() = owner_id);

-- Lineups policies
drop policy if exists lineups_select_own on public.lineups;
create policy lineups_select_own on public.lineups
  for select using (exists (
    select 1 from public.teams t where t.id = team_id and t.owner_id = auth.uid()
  ));

drop policy if exists lineups_insert_own on public.lineups;
create policy lineups_insert_own on public.lineups
  for insert with check (exists (
    select 1 from public.teams t where t.id = team_id and t.owner_id = auth.uid()
  ));

drop policy if exists lineups_update_own on public.lineups;
create policy lineups_update_own on public.lineups
  for update using (exists (
    select 1 from public.teams t where t.id = team_id and t.owner_id = auth.uid()
  ));

-- Lineup players policies
drop policy if exists lineup_players_select_own on public.lineup_players;
create policy lineup_players_select_own on public.lineup_players
  for select using (exists (
    select 1
    from public.lineups l
    join public.teams t on t.id = l.team_id
    where l.id = lineup_id and t.owner_id = auth.uid()
  ));

drop policy if exists lineup_players_insert_own on public.lineup_players;
create policy lineup_players_insert_own on public.lineup_players
  for insert with check (exists (
    select 1
    from public.lineups l
    join public.teams t on t.id = l.team_id
    where l.id = lineup_id and t.owner_id = auth.uid()
  ));

drop policy if exists lineup_players_delete_own on public.lineup_players;
create policy lineup_players_delete_own on public.lineup_players
  for delete using (exists (
    select 1
    from public.lineups l
    join public.teams t on t.id = l.team_id
    where l.id = lineup_id and t.owner_id = auth.uid()
  ));

-- Leagues policies
drop policy if exists leagues_select_all on public.leagues;
create policy leagues_select_all on public.leagues
  for select using (true);

drop policy if exists leagues_insert_own on public.leagues;
create policy leagues_insert_own on public.leagues
  for insert with check (auth.uid() = owner_id);

drop policy if exists leagues_update_own on public.leagues;
create policy leagues_update_own on public.leagues
  for update using (auth.uid() = owner_id);

-- League members policies
drop policy if exists league_members_select_all on public.league_members;
create policy league_members_select_all on public.league_members
  for select using (true);

drop policy if exists league_members_insert_own_team on public.league_members;
create policy league_members_insert_own_team on public.league_members
  for insert with check (exists (
    select 1 from public.teams t where t.id = team_id and t.owner_id = auth.uid()
  ));

drop policy if exists league_members_delete_own_team on public.league_members;
create policy league_members_delete_own_team on public.league_members
  for delete using (exists (
    select 1 from public.teams t where t.id = team_id and t.owner_id = auth.uid()
  ));

-- Public read policies for game data
drop policy if exists clubs_select_all on public.clubs;
create policy clubs_select_all on public.clubs for select using (true);

drop policy if exists positions_select_all on public.positions;
create policy positions_select_all on public.positions for select using (true);

drop policy if exists athletes_select_all on public.athletes;
create policy athletes_select_all on public.athletes for select using (true);

drop policy if exists rounds_select_all on public.rounds;
create policy rounds_select_all on public.rounds for select using (true);

drop policy if exists market_select_all on public.market;
create policy market_select_all on public.market for select using (true);

drop policy if exists athlete_scores_select_all on public.athlete_scores;
create policy athlete_scores_select_all on public.athlete_scores for select using (true);

drop policy if exists team_scores_select_all on public.team_scores;
create policy team_scores_select_all on public.team_scores for select using (true);

-- Profiles bootstrap after signup
create or replace function public.handle_new_user()
returns trigger as $$
declare
  generated_username text;
begin
  generated_username := coalesce(
    nullif(new.raw_user_meta_data->>'username', ''),
    'user_' || replace(left(new.id::text, 8), '-', '')
  );

  insert into public.profiles (id, email, username, full_name)
  values (
    new.id,
    new.email,
    generated_username,
    nullif(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do update set
    email = excluded.email,
    username = excluded.username,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    updated_at = now();

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

commit;

