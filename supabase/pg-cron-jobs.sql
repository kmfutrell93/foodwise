-- FoodWise pg_cron scheduled jobs
-- Prerequisites:
--   1. pg_cron extension enabled: Supabase Dashboard → Database → Extensions → pg_cron
--   2. pg_net extension enabled: same page → pg_net
--   3. All three edge functions deployed (push-weekly-report, push-injection-day, push-reengagement)
--   4. Replace eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4eGdraHBwZWV3dWR6YWxld2d5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzc0NjU4MCwiZXhwIjoyMDkzMzIyNTgwfQ.RbbTYJac4-3NZ07w_bvWNeJJ-b6FOwR4HW0MqVWuJzs with your actual service role key (found in
--      Supabase Dashboard → Project Settings → API → service_role secret)
--   5. Replace <PROJECT_REF> with: rxxgkhppeewudzalewgy
--
-- Run this entire file in the Supabase SQL editor.
-- Idempotent: unschedules existing jobs by name before re-creating them.

-- ─────────────────────────────────────────────────────────────────────────────
-- HELPER: remove a job if it already exists (makes this script re-runnable)
-- ─────────────────────────────────────────────────────────────────────────────
select cron.unschedule('weekly-report-push')    where exists (select 1 from cron.job where jobname = 'weekly-report-push');
select cron.unschedule('injection-day-push')    where exists (select 1 from cron.job where jobname = 'injection-day-push');
select cron.unschedule('reengagement-push')     where exists (select 1 from cron.job where jobname = 'reengagement-push');


-- ─────────────────────────────────────────────────────────────────────────────
-- JOB 1: Weekly report push
-- Runs: Every Sunday at 6:00 PM UTC (adjust offset for your target audience's
--        timezone — US Eastern = UTC-4 summer / UTC-5 winter, so 22:00 UTC
--        hits 6pm ET in summer; use 23:00 UTC for winter).
-- What it does: POSTs to push-weekly-report, which finds all users with push
--   tokens + notifications enabled + a weekly_report generated this week, and
--   sends "Your weekly FoodWise report is ready 📊".
-- ─────────────────────────────────────────────────────────────────────────────
select cron.schedule(
  'weekly-report-push',
  '0 22 * * 0',   -- Every Sunday at 22:00 UTC (≈ 6pm ET)
  $$
  select net.http_post(
    url     := 'https://rxxgkhppeewudzalewgy.supabase.co/functions/v1/push-weekly-report',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4eGdraHBwZWV3dWR6YWxld2d5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzc0NjU4MCwiZXhwIjoyMDkzMzIyNTgwfQ.RbbTYJac4-3NZ07w_bvWNeJJ-b6FOwR4HW0MqVWuJzs'
    ),
    body    := '{}'::jsonb
  );
  $$
);


-- ─────────────────────────────────────────────────────────────────────────────
-- JOB 2: Injection day reminder
-- Runs: Every day at 7:00 AM UTC.
-- What it does: POSTs to push-injection-day, which queries profiles where
--   injection_day matches today's day name (e.g. 'monday'), then sends:
--   "💉 Injection day — your plan is ready" with meal-specific body copy.
--   The edge function handles the day-matching logic server-side, so this
--   cron job fires daily and the function self-filters.
-- ─────────────────────────────────────────────────────────────────────────────
select cron.schedule(
  'injection-day-push',
  '0 7 * * *',   -- Every day at 07:00 UTC
  $$
  select net.http_post(
    url     := 'https://rxxgkhppeewudzalewgy.supabase.co/functions/v1/push-injection-day',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4eGdraHBwZWV3dWR6YWxld2d5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzc0NjU4MCwiZXhwIjoyMDkzMzIyNTgwfQ.RbbTYJac4-3NZ07w_bvWNeJJ-b6FOwR4HW0MqVWuJzs'
    ),
    body    := '{}'::jsonb
  );
  $$
);


-- ─────────────────────────────────────────────────────────────────────────────
-- JOB 3: Re-engagement nudge
-- Runs: Every 6 hours (00:00, 06:00, 12:00, 18:00 UTC).
-- What it does: POSTs to push-reengagement, which finds users where:
--   - last_logged_at < 48 hours ago (or null)
--   - last_nudge_sent_at < 72 hours ago (or null)
--   - notifications_enabled = true
--   - push_token is not null
--   Sends one of three rotating messages ("Haven't seen you in a couple days…"
--   etc.) and updates last_nudge_sent_at to prevent spam.
--   Running every 6h instead of hourly reduces load while still catching users
--   within a reasonable window. The 72h throttle on the function side is the
--   true spam guard regardless of how often this fires.
-- ─────────────────────────────────────────────────────────────────────────────
select cron.schedule(
  'reengagement-push',
  '0 */6 * * *',   -- Every 6 hours
  $$
  select net.http_post(
    url     := 'https://rxxgkhppeewudzalewgy.supabase.co/functions/v1/push-reengagement',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4eGdraHBwZWV3dWR6YWxld2d5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzc0NjU4MCwiZXhwIjoyMDkzMzIyNTgwfQ.RbbTYJac4-3NZ07w_bvWNeJJ-b6FOwR4HW0MqVWuJzs'
    ),
    body    := '{}'::jsonb
  );
  $$
);


-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFY: check all three jobs were created
-- ─────────────────────────────────────────────────────────────────────────────
select jobname, schedule, active, jobid
from cron.job
where jobname in ('weekly-report-push', 'injection-day-push', 'reengagement-push')
order by jobname;
