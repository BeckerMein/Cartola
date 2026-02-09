-- Backend MVP: scoring + round control + league ranking
-- Run this in Supabase SQL Editor.

-- Compute team scores for a round (captain gets 2x)
create or replace function public.calculate_team_scores(p_round_id int)
returns void
language plpgsql
as $$
begin
  insert into public.team_scores (round_id, team_id, points)
  select
    l.round_id,
    l.team_id,
    coalesce(sum(
      case
        when s.athlete_id = l.captain_athlete_id then s.points * 2
        else s.points
      end
    ), 0) as points
  from public.lineups l
  left join public.lineup_players lp on lp.lineup_id = l.id and lp.is_starter = true
  left join public.athlete_scores s on s.round_id = l.round_id and s.athlete_id = lp.athlete_id
  where l.round_id = p_round_id
  group by l.round_id, l.team_id
  on conflict (round_id, team_id)
  do update set points = excluded.points;
end;
$$;

-- Close a round (used after scores are processed)
create or replace function public.close_round(p_round_id int)
returns void
language plpgsql
as $$
begin
  update public.rounds
  set is_open = false
  where id = p_round_id;
end;
$$;

-- League ranking for a given round
create or replace view public.league_rankings as
select
  lm.league_id,
  ts.round_id,
  t.id as team_id,
  t.name as team_name,
  ts.points
from public.league_members lm
join public.teams t on t.id = lm.team_id
join public.team_scores ts on ts.team_id = t.id;
