-- `submit_daily_log` used `current_date`, which resolves in the database
-- session's timezone (UTC) — not the user's local calendar day. For anyone
-- west of UTC (e.g. Colombia, UTC-5), the app's "today" flipped over hours
-- before their actual midnight, letting a single local day get logged twice
-- under two different UTC dates. Store each user's IANA timezone and derive
-- "today" from that instead.

alter table public.profiles
  add column timezone text not null default 'UTC';

create or replace function public.submit_daily_log(p_hours numeric)
returns jsonb
language plpgsql
security invoker
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile public.profiles;
  v_yesterday numeric;
  v_today date;
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

  v_today := (now() at time zone v_profile.timezone)::date;

  if exists (
    select 1 from public.daily_logs
    where user_id = v_user_id and log_date = v_today
  ) then
    raise exception 'already logged today';
  end if;

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
