-- Phase 2 profile columns
alter table public.profiles add column if not exists hydration_reminders_enabled boolean default true;
alter table public.profiles add column if not exists starter_guide_completed     boolean default false;
alter table public.profiles add column if not exists starter_guide_step          int default 0;
alter table public.profiles add column if not exists health_connected            boolean default false;
alter table public.profiles add column if not exists health_permissions          jsonb;
alter table public.profiles add column if not exists steps_today                int default 0;
