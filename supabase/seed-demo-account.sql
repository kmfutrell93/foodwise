-- Demo account seed for Apple reviewer
-- Run AFTER creating demo@foodwise.app via Supabase Auth dashboard
-- Replace 2623b22e-b1eb-49b1-b2b5-2fb7b6f285c9 with the actual UUID from auth.users

do $$
declare
  demo_id uuid := '2623b22e-b1eb-49b1-b2b5-2fb7b6f285c9';
  today   date := current_date;
begin

-- Profile
update public.profiles set
  full_name           = 'Alex (Demo)',
  medication          = 'semaglutide',
  injection_day       = 'monday',
  dose_mg             = 1.0,
  weekly_budget       = 100,
  protein_goal_range  = '75-100',
  appetite_level      = 'low',
  check_in_time       = 'morning',
  notifications_enabled = true,
  dietary_restrictions  = '{}',
  food_aversions        = array['greasy/fried foods','red meat'],
  onboarding_completed  = true,
  onboarding_step       = 22,
  is_pro                = true,
  pro_since             = now() - interval '7 days'
where id = demo_id;

-- 14 days of symptom logs
insert into public.symptom_logs (user_id, symptoms, severity, energy_level, notes, logged_at) values
  (demo_id, array['nausea','fatigue'],     3, 4, 'Injection day, felt rough in the morning', (today - 13)::timestamptz + time '08:12:00'),
  (demo_id, array['nausea'],               2, 5, null,                                        (today - 12)::timestamptz + time '07:45:00'),
  (demo_id, array['fatigue'],              2, 6, 'Getting better',                            (today - 11)::timestamptz + time '08:30:00'),
  (demo_id, array['bloating'],             1, 7, null,                                        (today - 10)::timestamptz + time '09:00:00'),
  (demo_id, array[]::text[],                       1, 8, 'Feeling great today!',                      (today - 9)::timestamptz  + time '08:15:00'),
  (demo_id, array['constipation'],         2, 7, null,                                        (today - 8)::timestamptz  + time '07:55:00'),
  (demo_id, array['nausea','fatigue'],     3, 4, 'Injection day again',                       (today - 7)::timestamptz  + time '08:00:00'),
  (demo_id, array['nausea'],               2, 5, null,                                        (today - 6)::timestamptz  + time '08:20:00'),
  (demo_id, array['fatigue'],              2, 6, null,                                        (today - 5)::timestamptz  + time '08:10:00'),
  (demo_id, array['bloating'],             1, 7, 'High fiber day helped',                     (today - 4)::timestamptz  + time '07:50:00'),
  (demo_id, array[]::text[],                       1, 8, null,                                        (today - 3)::timestamptz  + time '08:05:00'),
  (demo_id, array[]::text[],                       1, 9, 'Best energy in weeks',                      (today - 2)::timestamptz  + time '08:30:00'),
  (demo_id, array['fatigue'],              2, 7, null,                                        (today - 1)::timestamptz  + time '08:00:00'),
  (demo_id, array['nausea','fatigue'],     3, 4, 'Injection day',                             today::timestamptz        + time '08:15:00');

-- Streak
insert into public.streaks (user_id, current_streak, longest_streak, total_logs, last_logged_at)
values (demo_id, 14, 14, 14, now())
on conflict (user_id) do update set
  current_streak  = 14,
  longest_streak  = 14,
  total_logs      = 14,
  last_logged_at  = now();

-- Milestones
insert into public.milestones (user_id, milestone_type, earned_at) values
  (demo_id, 'first_log',     now() - interval '14 days'),
  (demo_id, '7day_streak',   now() - interval '7 days')
on conflict do nothing;

-- Weekly report
insert into public.weekly_reports (user_id, week_start, insight_text, avg_protein_g, created_at)
values (
  demo_id,
  date_trunc('week', now()),
  'This was a solid week for you, Alex. Your energy levels climbed from 4 to 8 through the week — a pattern we''ve seen before when you stick to the high-fiber meals on days 3–5 after your injection. Nausea was minimal after Tuesday, which lines up with your lighter breakfast swaps. Keep prioritizing protein at lunch; your best energy days both had 35g+ at midday.',
  82,
  now() - interval '1 day'
);

end $$;
