-- Dose escalation tracking columns on profiles
alter table public.profiles add column if not exists dose_start_date       date;
alter table public.profiles add column if not exists escalation_schedule   jsonb;
alter table public.profiles add column if not exists time_on_medication    text;
