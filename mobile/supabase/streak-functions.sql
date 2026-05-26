-- ============================================================
-- Streak Engine
-- Run after schema.sql
-- ============================================================

-- RPC called from app: increment_streak(user_id, streak_type)
CREATE OR REPLACE FUNCTION public.increment_streak(
  p_user_id    UUID,
  p_streak_type TEXT  -- 'protein' | 'checkin' | 'plan'
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_col       TEXT;
  v_last_col  TEXT;
  v_last      TIMESTAMPTZ;
  v_current   INTEGER;
  v_hours     NUMERIC;
BEGIN
  -- Map type to column names
  IF p_streak_type = 'protein' THEN
    v_col := 'protein_streak';
    v_last_col := 'last_protein_log';
  ELSIF p_streak_type = 'checkin' THEN
    v_col := 'checkin_streak';
    v_last_col := 'last_checkin';
  ELSIF p_streak_type = 'plan' THEN
    v_col := 'plan_streak';
    v_last_col := 'last_plan_generated';
  ELSE
    RAISE EXCEPTION 'Unknown streak type: %', p_streak_type;
  END IF;

  -- Get current streak state
  EXECUTE format('SELECT %I, %I FROM public.streaks WHERE user_id = $1', v_col, v_last_col)
    INTO v_current, v_last
    USING p_user_id;

  -- Calculate hours since last activity
  IF v_last IS NULL THEN
    v_hours := 999;
  ELSE
    v_hours := EXTRACT(EPOCH FROM (NOW() - v_last)) / 3600;
  END IF;

  -- Streak logic:
  --   < 20h  → same day repeat, don't increment
  --   20-48h → valid next day, increment
  --   > 48h  → missed day, reset to 1
  IF v_hours < 20 THEN
    -- Already logged today, just update timestamp
    NULL;
  ELSIF v_hours <= 48 THEN
    v_current := COALESCE(v_current, 0) + 1;
  ELSE
    v_current := 1;
  END IF;

  -- Persist
  EXECUTE format(
    'UPDATE public.streaks SET %I = $1, %I = NOW() WHERE user_id = $2',
    v_col, v_last_col
  ) USING v_current, p_user_id;

  -- Check milestones
  PERFORM public.check_streak_milestones(p_user_id, p_streak_type, v_current);
END;
$$;

-- Milestone checker called after every streak update
CREATE OR REPLACE FUNCTION public.check_streak_milestones(
  p_user_id     UUID,
  p_streak_type TEXT,
  p_streak      INTEGER
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_streak >= 7 THEN
    INSERT INTO public.milestones (user_id, type)
    VALUES (p_user_id, '7day_streak')
    ON CONFLICT (user_id, type) DO NOTHING;
  END IF;

  IF p_streak >= 30 THEN
    INSERT INTO public.milestones (user_id, type)
    VALUES (p_user_id, '30day_streak')
    ON CONFLICT (user_id, type) DO NOTHING;
  END IF;

  IF p_streak_type = 'plan' AND p_streak >= 7 THEN
    INSERT INTO public.milestones (user_id, type)
    VALUES (p_user_id, 'plan_streak_7')
    ON CONFLICT (user_id, type) DO NOTHING;
  END IF;
END;
$$;

-- Check first_log milestone when a symptom log is inserted
CREATE OR REPLACE FUNCTION public.handle_first_log()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.symptom_logs WHERE user_id = NEW.user_id;
  IF v_count = 1 THEN
    INSERT INTO public.milestones (user_id, type)
    VALUES (NEW.user_id, 'first_log')
    ON CONFLICT (user_id, type) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_symptom_logged ON public.symptom_logs;
CREATE TRIGGER on_symptom_logged
  AFTER INSERT ON public.symptom_logs
  FOR EACH ROW EXECUTE FUNCTION public.handle_first_log();

-- ============================================================
-- Weekly Budget Milestone
-- Called from meal plan generation after grocery list is ready
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_budget_milestone(
  p_user_id   UUID,
  p_total     NUMERIC,
  p_budget    NUMERIC
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_total <= p_budget THEN
    INSERT INTO public.milestones (user_id, type)
    VALUES (p_user_id, 'first_week_under_budget')
    ON CONFLICT (user_id, type) DO NOTHING;
  END IF;
END;
$$;
