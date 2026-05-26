-- Recipe library tables
create table if not exists public.recipes (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null,
  meal_type            text[],
  medication_suitability text[],
  texture              text,  -- 'soft' | 'normal' | 'firm'
  phase_suitability    text[], -- ['injection_day','post_injection','standard','constipation_phase']
  protein_g            numeric(5,1) not null,
  calories             int not null,
  cook_time_mins       int not null,
  skill_level          text,  -- 'simple' | 'intermediate' | 'advanced'
  serving_size         int default 1,
  ingredients          jsonb,
  instructions         text[],
  nova_score           int,
  allergens            text[],
  budget_tier          text,  -- 'budget' | 'mid' | 'premium'
  tags                 text[],
  dietitian_reviewed   boolean default false,
  created_at           timestamptz default now()
);

alter table public.recipes enable row level security;
create policy "recipes_select" on public.recipes for select to authenticated using (true);

create table if not exists public.recipe_user_ratings (
  id          uuid primary key default gen_random_uuid(),
  recipe_id   uuid references public.recipes(id) on delete cascade,
  user_id     uuid references public.profiles(id) on delete cascade,
  rating      int check (rating between 1 and 5),
  made_it     boolean default false,
  created_at  timestamptz default now(),
  unique(recipe_id, user_id)
);

alter table public.recipe_user_ratings enable row level security;
create policy "ratings_select" on public.recipe_user_ratings for select using ((select auth.uid()) = user_id);
create policy "ratings_insert" on public.recipe_user_ratings for insert with check ((select auth.uid()) = user_id);
create policy "ratings_update" on public.recipe_user_ratings for update using ((select auth.uid()) = user_id);
create policy "ratings_delete" on public.recipe_user_ratings for delete using ((select auth.uid()) = user_id);
