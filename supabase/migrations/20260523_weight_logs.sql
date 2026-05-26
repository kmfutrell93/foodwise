-- Weight logs table
create table if not exists public.weight_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.profiles(id) on delete cascade not null,
  logged_date  date not null,
  weight_lbs   numeric(5,1) not null,
  note         text,
  source       text default 'manual', -- 'manual' | 'apple_health'
  created_at   timestamptz default now(),
  unique(user_id, logged_date)
);

alter table public.weight_logs enable row level security;
create policy "weight_logs_select" on public.weight_logs for select using ((select auth.uid()) = user_id);
create policy "weight_logs_insert" on public.weight_logs for insert with check ((select auth.uid()) = user_id);
create policy "weight_logs_update" on public.weight_logs for update using ((select auth.uid()) = user_id);
create policy "weight_logs_delete" on public.weight_logs for delete using ((select auth.uid()) = user_id);

-- Weight log preference on profiles
alter table public.profiles add column if not exists show_weight_log boolean default true;
