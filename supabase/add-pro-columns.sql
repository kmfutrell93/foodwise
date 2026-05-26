-- Run this in the Supabase SQL editor after the main schema.sql
-- Adds subscription tracking columns to profiles

alter table public.profiles
  add column if not exists is_pro               boolean     not null default false,
  add column if not exists pro_product_id       text,
  add column if not exists pro_since            timestamptz,
  add column if not exists pro_expires_at       timestamptz,
  add column if not exists last_nudge_sent_at   timestamptz;
