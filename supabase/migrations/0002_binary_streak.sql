-- Simplify the daily-log outcome from three tiers to two: only meeting the
-- goal keeps the streak alive. The "over goal but under yesterday -> streak
-- holds, half points" middle tier is removed — any day over goal now behaves
-- like the old "drop" tier, regardless of yesterday's hours.
--
--   reported <= goal   -> beat: streak +1, full points
--   reported >  goal   -> drop: streak -1 (floor 0), no points

-- Reclassify any existing 'hold' rows before tightening the CHECK constraints,
-- since a hold day was always a step short of the goal — it's a 'drop' now.
update public.daily_logs set outcome = 'drop' where outcome = 'hold';
update public.profiles set last_outcome = 'drop' where last_outcome = 'hold';

alter table public.profiles
  drop constraint if exists profiles_last_outcome_check,
  add constraint profiles_last_outcome_check check (last_outcome in ('beat', 'drop'));

alter table public.daily_logs
  drop constraint if exists daily_logs_outcome_check,
  add constraint daily_logs_outcome_check check (outcome in ('beat', 'drop'));

create or replace function public.submit_daily_log(p_hours numeric)
returns jsonb
language plpgsql
security invoker
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile public.profiles;
  v_yesterday numeric;
  v_today date := current_date;
  v_pct numeric;
  v_outcome text;
  v_points int;
  v_streak int;
  v_consecutive_drops int;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  if p_hours < 0 then
    raise exception 'hours must be >= 0';
  end if;

  select * into v_profile from public.profiles where id = v_user_id for update;
  if not found then
    raise exception 'profile not found';
  end if;

  if exists (
    select 1 from public.daily_logs
    where user_id = v_user_id and log_date = v_today
  ) then
    raise exception 'already logged today';
  end if;

  -- Kept for the result payload (the log screen still shows "vs yesterday"),
  -- but no longer read to decide the outcome.
  select hours_reported into v_yesterday
  from public.daily_logs
  where user_id = v_user_id and log_date = v_today - 1;

  if v_yesterday is null then
    v_yesterday := v_profile.baseline_hours;
  end if;

  if p_hours <= v_profile.daily_goal_hours then
    if v_profile.daily_goal_hours = 0 then
      v_pct := 100;
    else
      v_pct := greatest(0, least(100,
        (v_profile.daily_goal_hours - p_hours) / v_profile.daily_goal_hours * 100));
    end if;
    v_outcome := 'beat';
    v_points := round(case when v_pct <= 50 then v_pct else 50 + (v_pct - 50) * 2 end);
    v_streak := v_profile.streak + 1;
    v_consecutive_drops := 0;
  else
    v_outcome := 'drop';
    v_points := 0;
    v_streak := greatest(0, v_profile.streak - 1);
    v_consecutive_drops := v_profile.consecutive_drops + 1;
  end if;

  insert into public.daily_logs
    (user_id, log_date, hours_reported, outcome, points_earned, streak_after)
  values
    (v_user_id, v_today, p_hours, v_outcome, v_points, v_streak);

  update public.profiles
  set streak = v_streak,
      points = points + v_points,
      last_outcome = v_outcome,
      consecutive_drops = v_consecutive_drops,
      updated_at = now()
  where id = v_user_id;

  return jsonb_build_object(
    'outcome', v_outcome,
    'points_earned', v_points,
    'streak', v_streak,
    'points', v_profile.points + v_points,
    'hours_reported', p_hours,
    'yesterday_hours', v_yesterday,
    'goal_hours', v_profile.daily_goal_hours,
    'consecutive_drops', v_consecutive_drops
  );
end;
$$;
