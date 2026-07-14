-- Unplug schema: profiles, daily_logs, RLS, and the two RPCs that own the
-- streak/points/health/level business logic atomically.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  user_name text,
  baseline_hours numeric not null default 4,
  daily_goal_hours numeric not null default 2,
  companion_type text not null default 'plant'
    check (companion_type in ('plant', 'animal', 'character')),
  onboarded boolean not null default false,
  streak int not null default 0,
  points int not null default 0,
  last_outcome text check (last_outcome in ('beat', 'hold', 'drop')),
  consecutive_drops int not null default 0,
  xp int not null default 0,
  level text not null default 'baby'
    check (level in ('baby', 'growing', 'mature')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;

-- Auto-create a blank profile row whenever a new auth user signs up, so
-- onboarding always has a row to update.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- daily_logs
-- ---------------------------------------------------------------------
create table public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  log_date date not null,
  hours_reported numeric not null,
  outcome text not null check (outcome in ('beat', 'hold', 'drop')),
  points_earned int not null default 0,
  streak_after int not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, log_date)
);

alter table public.daily_logs enable row level security;

create policy "daily_logs_select_own" on public.daily_logs
  for select using (auth.uid() = user_id);
create policy "daily_logs_insert_own" on public.daily_logs
  for insert with check (auth.uid() = user_id);

grant select, insert on public.daily_logs to authenticated;

-- ---------------------------------------------------------------------
-- submit_daily_log — the authoritative streak/points/health outcome logic.
--
--   reported <= goal                    -> beat: streak +1, full points
--   goal < reported < yesterday         -> hold: streak unchanged, 50% points
--   reported >= goal AND >= yesterday   -> drop: streak -1 (floor 0), no points
--
-- Points scale is piecewise-linear fit to the brief's three anchor points
-- (10% reduction = 10pts, 50% = 50pts, 100%/no-use = 150pts):
--   pct <= 50 -> pts = pct
--   pct  > 50 -> pts = 50 + (pct-50)*2
-- "beat" measures reduction from goal; "hold" measures reduction from
-- yesterday, since goal isn't a valid denominator once you're over it.
-- ---------------------------------------------------------------------
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
  elsif p_hours < v_yesterday then
    v_pct := greatest(0, least(100, (v_yesterday - p_hours) / v_yesterday * 100));
    v_outcome := 'hold';
    v_points := round((case when v_pct <= 50 then v_pct else 50 + (v_pct - 50) * 2 end) * 0.5);
    v_streak := v_profile.streak;
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

grant execute on function public.submit_daily_log(numeric) to authenticated;

-- ---------------------------------------------------------------------
-- spend_points_on_food — feeds the companion, funding permanent XP/level.
-- Apple 30pts, Smoothie 80pts, Cake 150pts; xp gained = points spent (1:1).
-- Levels: baby [0,200), growing [200,600), mature [600,inf) — monotonic.
-- ---------------------------------------------------------------------
create or replace function public.spend_points_on_food(p_food_key text)
returns jsonb
language plpgsql
security invoker
as $$
declare
  v_user_id uuid := auth.uid();
  v_cost int;
  v_profile public.profiles;
  v_new_xp int;
  v_new_level text;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  v_cost := case p_food_key
    when 'apple' then 30
    when 'smoothie' then 80
    when 'cake' then 150
    else null
  end;

  if v_cost is null then
    raise exception 'unknown food item: %', p_food_key;
  end if;

  select * into v_profile from public.profiles where id = v_user_id for update;
  if not found then
    raise exception 'profile not found';
  end if;

  if v_profile.points < v_cost then
    raise exception 'insufficient points';
  end if;

  v_new_xp := v_profile.xp + v_cost;
  v_new_level := case
    when v_new_xp >= 600 then 'mature'
    when v_new_xp >= 200 then 'growing'
    else 'baby'
  end;

  update public.profiles
  set points = points - v_cost,
      xp = v_new_xp,
      level = v_new_level,
      updated_at = now()
  where id = v_user_id;

  return jsonb_build_object(
    'food_key', p_food_key,
    'cost', v_cost,
    'points', v_profile.points - v_cost,
    'xp', v_new_xp,
    'level', v_new_level,
    'leveled_up', v_new_level <> v_profile.level
  );
end;
$$;

grant execute on function public.spend_points_on_food(text) to authenticated;
