-- LTE-resilient generation: client polls this status instead of holding a long HTTP connection.
alter table public.meal_plans
  add column if not exists generation_status text not null default 'ready';

alter table public.meal_plans
  add column if not exists updated_at timestamptz not null default now();

comment on column public.meal_plans.generation_status is
  'generating | ready | failed — polled by clients during meal plan generation';
