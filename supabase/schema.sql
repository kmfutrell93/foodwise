-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- PROFILES
-- ============================================================
create table if not exists public.profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  full_name             text,
  email                 text,

  -- onboarding state
  onboarding_step       int not null default 0,
  onboarding_completed  boolean not null default false,

  -- question answers
  primary_struggle      text,
  protein_goal_range    text,
  dietary_restrictions  text[] default '{}',
  weekly_budget         numeric(10,2) default 75,
  appetite_level        text,
  check_in_time         text,
  notifications_enabled boolean default false,
  push_token            text,

  -- GLP-1 specifics
  medication            text,
  injection_day         text,
  dose_mg               numeric(6,2),
  food_aversions        text[] default '{}',

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Use (select auth.uid()) subquery form — avoids uuid=text operator error on some Supabase versions
create policy "profiles_select" on public.profiles
  for select using ((select auth.uid()) = id);
create policy "profiles_update" on public.profiles
  for update using ((select auth.uid()) = id);

-- Auto-create profile on sign-up (anonymous or email)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', null)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- MEAL PLANS
-- ============================================================
create table if not exists public.meal_plans (
  id                 uuid primary key default uuid_generate_v4(),
  user_id            uuid not null references public.profiles(id) on delete cascade,
  week_start         date not null,
  plan_json          jsonb not null default '{}',
  grocery_list       jsonb,
  generation_status  text not null default 'ready',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (user_id, week_start)
);

alter table public.meal_plans enable row level security;
create policy "meal_plans_select" on public.meal_plans
  for select using ((select auth.uid()) = user_id);
create policy "meal_plans_insert" on public.meal_plans
  for insert with check ((select auth.uid()) = user_id);
create policy "meal_plans_update" on public.meal_plans
  for update using ((select auth.uid()) = user_id);
create policy "meal_plans_delete" on public.meal_plans
  for delete using ((select auth.uid()) = user_id);

-- ============================================================
-- SYMPTOM LOGS
-- ============================================================
create table if not exists public.symptom_logs (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  symptoms     text[] not null default '{}',
  severity     int not null check (severity between 1 and 5),
  energy_level int not null check (energy_level between 1 and 10),
  notes        text,
  logged_at    timestamptz not null default now()
);

alter table public.symptom_logs enable row level security;
create policy "symptom_logs_select" on public.symptom_logs
  for select using ((select auth.uid()) = user_id);
create policy "symptom_logs_insert" on public.symptom_logs
  for insert with check ((select auth.uid()) = user_id);

-- ============================================================
-- STREAKS
-- ============================================================
create table if not exists public.streaks (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null unique references public.profiles(id) on delete cascade,
  current_streak  int not null default 0,
  longest_streak  int not null default 0,
  total_logs      int not null default 0,
  last_logged_at  timestamptz,
  updated_at      timestamptz not null default now()
);

alter table public.streaks enable row level security;
create policy "streaks_select" on public.streaks
  for select using ((select auth.uid()) = user_id);
create policy "streaks_insert" on public.streaks
  for insert with check ((select auth.uid()) = user_id);
create policy "streaks_update" on public.streaks
  for update using ((select auth.uid()) = user_id);

-- Auto-create streak row when a profile is created
create or replace function public.handle_new_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.streaks (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_profile_created on public.profiles;
create trigger on_profile_created
  after insert on public.profiles
  for each row execute procedure public.handle_new_profile();

-- ============================================================
-- MILESTONES
-- ============================================================
create table if not exists public.milestones (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  milestone_type   text not null,
  earned_at        timestamptz not null default now(),
  unique (user_id, milestone_type)
);

alter table public.milestones enable row level security;
create policy "milestones_select" on public.milestones
  for select using ((select auth.uid()) = user_id);
create policy "milestones_insert" on public.milestones
  for insert with check ((select auth.uid()) = user_id);

-- ============================================================
-- WEEKLY REPORTS
-- ============================================================
create table if not exists public.weekly_reports (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  week_start      date not null,
  insight_text    text,
  avg_protein_g   numeric(6,1),
  avg_energy      numeric(4,1),
  symptom_summary jsonb default '{}',
  created_at      timestamptz not null default now(),
  unique (user_id, week_start)
);

alter table public.weekly_reports enable row level security;
create policy "weekly_reports_select" on public.weekly_reports
  for select using ((select auth.uid()) = user_id);
create policy "weekly_reports_insert" on public.weekly_reports
  for insert with check ((select auth.uid()) = user_id);
create policy "weekly_reports_update" on public.weekly_reports
  for update using ((select auth.uid()) = user_id);
