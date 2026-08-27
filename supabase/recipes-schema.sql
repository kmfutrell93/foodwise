-- saved_recipes: user-saved AI-generated recipes from their meal plans
-- Run in Supabase SQL editor after the base schema.sql

create table if not exists public.saved_recipes (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  meal_plan_id    uuid references public.meal_plans(id) on delete set null,
  recipe_name     text not null,
  meal_slot       text,
  ingredients     jsonb not null default '[]',
  instructions    jsonb not null default '[]',
  prep_time_min   int,
  cook_time_min   int,
  total_time_min  int,
  servings        int default 1,
  protein_g       numeric(6,2),
  calories        int,
  fiber_g         numeric(6,2),
  estimated_cost  numeric(6,2),
  tags            text[] default '{}',
  injection_day_friendly  boolean default false,
  nori_tip        text,
  saved_at        timestamptz not null default now(),
  expires_at      timestamptz
);

create index if not exists saved_recipes_user_id_idx on public.saved_recipes(user_id);
create index if not exists saved_recipes_expires_at_idx on public.saved_recipes(expires_at) where expires_at is not null;

alter table public.saved_recipes enable row level security;
create policy "Users can read own recipes" on public.saved_recipes
  for select using ((select auth.uid()) = user_id);
create policy "Users can insert own recipes" on public.saved_recipes
  for insert with check ((select auth.uid()) = user_id);
create policy "Users can update own recipes" on public.saved_recipes
  for update using ((select auth.uid()) = user_id);
create policy "Users can delete own recipes" on public.saved_recipes
  for delete using ((select auth.uid()) = user_id);
