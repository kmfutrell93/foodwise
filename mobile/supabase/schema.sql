-- ============================================================
-- FoodWise Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ============================================================

-- Enable UUID extension (already enabled by default in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id               UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  created_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Onboarding answers
  primary_struggle      TEXT CHECK (primary_struggle IN ('protein','nausea','confusion','muscle')),
  protein_goal_range    TEXT CHECK (protein_goal_range IN ('under25','25-50','50-75','75-100','100plus','unsure')),
  dietary_restrictions  TEXT[]   DEFAULT '{}' NOT NULL,
  weekly_budget         INTEGER  DEFAULT 75 NOT NULL,
  appetite_level        TEXT CHECK (appetite_level IN ('low','moderate','normal')),
  check_in_time         TEXT     DEFAULT '08:00' NOT NULL,  -- HH:MM
  notifications_enabled BOOLEAN  DEFAULT FALSE NOT NULL,
  onboarding_completed  BOOLEAN  DEFAULT FALSE NOT NULL,
  onboarding_step       INTEGER  DEFAULT 0 NOT NULL,

  -- GLP-1 specific (needed for AI meal plan prompt)
  medication            TEXT CHECK (medication IN ('ozempic','wegovy','mounjaro','zepbound','other')),
  injection_day         SMALLINT CHECK (injection_day BETWEEN 0 AND 6),  -- 0=Sun
  dose_mg               NUMERIC(5,2),
  food_aversions        TEXT[]   DEFAULT '{}' NOT NULL,

  -- Subscription state
  is_pro                BOOLEAN  DEFAULT FALSE NOT NULL,
  trial_started_at      TIMESTAMPTZ,
  meal_plans_generated  INTEGER  DEFAULT 0 NOT NULL,
  push_token            TEXT
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- MEAL PLANS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.meal_plans (
  id          UUID     DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID     REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  week_start  DATE     NOT NULL,
  plan_json   JSONB    NOT NULL,
  is_active   BOOLEAN  DEFAULT TRUE NOT NULL
);

CREATE INDEX IF NOT EXISTS meal_plans_user_id_idx ON public.meal_plans(user_id);
CREATE INDEX IF NOT EXISTS meal_plans_active_idx  ON public.meal_plans(user_id, is_active);

-- ============================================================
-- SYMPTOM LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.symptom_logs (
  id             UUID     DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID     REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  logged_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  nausea         SMALLINT CHECK (nausea BETWEEN 1 AND 5),
  constipation   SMALLINT CHECK (constipation BETWEEN 1 AND 5),
  fatigue        SMALLINT CHECK (fatigue BETWEEN 1 AND 5),
  food_aversions TEXT[]   DEFAULT '{}' NOT NULL,
  notes          TEXT
);

CREATE INDEX IF NOT EXISTS symptom_logs_user_id_idx ON public.symptom_logs(user_id);
CREATE INDEX IF NOT EXISTS symptom_logs_date_idx    ON public.symptom_logs(user_id, logged_at);

-- ============================================================
-- STREAKS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.streaks (
  id                   UUID     DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id              UUID     REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  protein_streak       INTEGER  DEFAULT 0 NOT NULL,
  checkin_streak       INTEGER  DEFAULT 0 NOT NULL,
  plan_streak          INTEGER  DEFAULT 0 NOT NULL,
  last_protein_log     TIMESTAMPTZ,
  last_checkin         TIMESTAMPTZ,
  last_plan_generated  TIMESTAMPTZ
);

-- Auto-create streak row on profile creation
CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.streaks (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile();

-- ============================================================
-- MILESTONES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.milestones (
  id         UUID     DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID     REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type       TEXT     NOT NULL CHECK (type IN (
               'first_log','7day_streak','30day_streak',
               'first_insight','first_week_under_budget','plan_streak_7'
             )),
  earned_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (user_id, type)
);

CREATE INDEX IF NOT EXISTS milestones_user_id_idx ON public.milestones(user_id);

-- ============================================================
-- WEEKLY REPORTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.weekly_reports (
  id          UUID     DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID     REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  week_of     DATE     NOT NULL,
  summary     TEXT     NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (user_id, week_of)
);

CREATE INDEX IF NOT EXISTS weekly_reports_user_id_idx ON public.weekly_reports(user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.symptom_logs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_reports  ENABLE ROW LEVEL SECURITY;

-- Profiles: users own their row
CREATE POLICY "users_own_profile"      ON public.profiles      FOR ALL USING (auth.uid() = id);
CREATE POLICY "users_own_meal_plans"   ON public.meal_plans     FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_symptoms"     ON public.symptom_logs   FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_streaks"      ON public.streaks        FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_milestones"   ON public.milestones     FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_reports"      ON public.weekly_reports FOR ALL USING (auth.uid() = user_id);

-- Service role bypass (for Edge Functions using service key)
CREATE POLICY "service_role_all_profiles"  ON public.profiles      FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all_plans"     ON public.meal_plans     FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all_symptoms"  ON public.symptom_logs   FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all_streaks"   ON public.streaks        FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all_miles"     ON public.milestones     FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all_reports"   ON public.weekly_reports FOR ALL TO service_role USING (true);
