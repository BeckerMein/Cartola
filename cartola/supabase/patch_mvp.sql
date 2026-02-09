-- MVP patch: invite codes, formation, budget
alter table public.leagues
  add column if not exists invite_code text unique;

alter table public.teams
  add column if not exists balance numeric(10,2) not null default 200;

alter table public.lineups
  add column if not exists formation text not null default '4-3-3';
