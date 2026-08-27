-- =============================================================================
-- FoodWise — Apple App Review demo account seed
-- =============================================================================
--
-- HOW TO USE
-- 1. In Supabase Dashboard → Authentication → Users → Add user:
--      Email:    demo@foodwise.app
--      Password: (choose a strong password; put it in App Review notes)
--      Auto-confirm: ON
-- 2. Copy the new user's UUID from auth.users (or the Users table).
-- 3. demo_id below is set to the App Review account UUID.
-- 4. Run this script as a privileged role (Dashboard SQL Editor or):
--      supabase db query --linked -f supabase/seed-demo-account.sql
--    The is_pro update must run as postgres/service_role so prevent_pro_self_grant
--    does not silently revert it.
-- 5. Sign in on device with demo@foodwise.app + password.
--
-- IDEMPOTENT: deletes+reinserts meal_plans/weight/milestones/reports/streaks.
--             symptom_logs are SKIPPED when the user already has any rows
--             (preserves the existing 14-log history for App Review).
-- plan_json.days[].day must be weekday names (monday…sunday) — meal-plan.tsx
-- uses DAY_SHORT[d.day.toLowerCase()], not ISO dates.
-- =============================================================================

do $$
declare
  demo_id uuid := '2623b22e-b1eb-49b1-b2b5-2fb7b6f285c9';
  today   date := current_date;
  week_monday date := (today - ((extract(dow from today)::int + 6) % 7));
  existing_symptoms int;
begin

  if not exists (select 1 from auth.users where id = demo_id) then
    raise exception 'auth.users has no row for %. Create demo@foodwise.app first, then set demo_id.', demo_id;
  end if;

  select count(*) into existing_symptoms from public.symptom_logs where user_id = demo_id;

  -- Wipe prior seed data for this user (keep auth user + existing symptoms if any)
  delete from public.weight_logs where user_id = demo_id;
  delete from public.milestones where user_id = demo_id;
  delete from public.weekly_reports where user_id = demo_id;
  delete from public.meal_plans where user_id = demo_id;
  delete from public.streaks where user_id = demo_id;
  delete from public.saved_recipes where user_id = demo_id;
  delete from public.recipe_user_ratings where user_id = demo_id;

  if existing_symptoms = 0 then
    delete from public.symptom_logs where user_id = demo_id; -- no-op; keeps path explicit
  end if;

  -- Profile (is_pro allowed here only because this runs as superuser/service_role)
  update public.profiles set
    full_name              = 'Demo User',
    email                  = 'demo@foodwise.app',
    medication             = 'semaglutide',
    injection_day          = 'monday',
    dose_mg                = 0.5,
    dose_start_date        = (today - 45),
    time_on_medication     = '1_3_months',
    weekly_budget          = 75,
    protein_goal_range     = '75-100',
    appetite_level         = 'moderate',
    check_in_time          = 'morning',
    primary_struggle       = 'nausea',
    notifications_enabled  = true,
    dietary_restrictions   = '{}',
    food_aversions         = array['greasy/fried foods', 'spicy food'],
    onboarding_completed   = true,
    onboarding_step        = 25,
    is_pro                 = true,
    pro_since              = now() - interval '14 days',
    pro_product_id         = 'foodwise_pro_annual',
    latest_symptom_recommendation =
      'On injection days, favor soft textures (yogurt, eggs, soups) and keep fat low until afternoon.',
    latest_symptom_insight_at = now() - interval '2 days',
    updated_at             = now()
  where id = demo_id;

  if not found then
    raise exception 'profiles row missing for %. Did handle_new_user fire?', demo_id;
  end if;

  -- Current-week meal plan (ready + ingredients + grocery)
  insert into public.meal_plans (
    user_id, week_start, generation_status, updated_at, plan_json, grocery_list
  ) values (
    demo_id,
    week_monday,
    'ready',
    now(),
    jsonb_build_object(
      'days', jsonb_build_array(
        jsonb_build_object(
          'day', 'monday',
          'is_injection_day', true,
          'total_protein_g', 112,
          'total_calories', 1380,
          'day_note', 'Injection day — soft textures, low fat.',
          'meals', jsonb_build_array(
            jsonb_build_object('slot','Breakfast','name','Greek Yogurt Parfait with Banana','protein_g',28,'calories',320,
              'ingredients', jsonb_build_array(
                jsonb_build_object('name','Greek yogurt','quantity','1 cup','estimated_cost',1.50),
                jsonb_build_object('name','Banana','quantity','1','estimated_cost',0.40),
                jsonb_build_object('name','Honey','quantity','1 tsp','estimated_cost',0.15)
              )),
            jsonb_build_object('slot','Lunch','name','Egg Drop Soup with Soft Tofu','protein_g',32,'calories',380,
              'ingredients', jsonb_build_array(
                jsonb_build_object('name','Eggs','quantity','3','estimated_cost',1.20),
                jsonb_build_object('name','Soft tofu','quantity','150g','estimated_cost',1.80),
                jsonb_build_object('name','Chicken broth','quantity','2 cups','estimated_cost',1.00)
              )),
            jsonb_build_object('slot','Snack','name','Cottage Cheese with Peaches','protein_g',20,'calories',180,
              'ingredients', jsonb_build_array(
                jsonb_build_object('name','Cottage cheese','quantity','1 cup','estimated_cost',1.40),
                jsonb_build_object('name','Peaches','quantity','1/2 cup','estimated_cost',0.80)
              )),
            jsonb_build_object('slot','Dinner','name','Baked White Fish with Mashed Potatoes','protein_g',32,'calories',500,
              'ingredients', jsonb_build_array(
                jsonb_build_object('name','White fish fillet','quantity','6 oz','estimated_cost',4.50),
                jsonb_build_object('name','Potato','quantity','1 medium','estimated_cost',0.60),
                jsonb_build_object('name','Olive oil','quantity','1 tsp','estimated_cost',0.10)
              ))
          )
        ),
        jsonb_build_object(
          'day', 'tuesday',
          'is_injection_day', false,
          'total_protein_g', 118,
          'total_calories', 1520,
          'meals', jsonb_build_array(
            jsonb_build_object('slot','Breakfast','name','Veggie Egg Scramble','protein_g',26,'calories',340,
              'ingredients', jsonb_build_array(
                jsonb_build_object('name','Eggs','quantity','3','estimated_cost',1.20),
                jsonb_build_object('name','Spinach','quantity','1 cup','estimated_cost',0.70)
              )),
            jsonb_build_object('slot','Lunch','name','Turkey & Avocado Wrap','protein_g',34,'calories',420,
              'ingredients', jsonb_build_array(
                jsonb_build_object('name','Turkey breast','quantity','4 oz','estimated_cost',2.80),
                jsonb_build_object('name','Whole wheat tortilla','quantity','1','estimated_cost',0.50),
                jsonb_build_object('name','Avocado','quantity','1/4','estimated_cost',0.60)
              )),
            jsonb_build_object('slot','Snack','name','Protein Shake','protein_g',24,'calories',200,
              'ingredients', jsonb_build_array(
                jsonb_build_object('name','Whey protein','quantity','1 scoop','estimated_cost',1.50),
                jsonb_build_object('name','Almond milk','quantity','1 cup','estimated_cost',0.40)
              )),
            jsonb_build_object('slot','Dinner','name','Lemon Chicken with Quinoa','protein_g',34,'calories',560,
              'ingredients', jsonb_build_array(
                jsonb_build_object('name','Chicken breast','quantity','5 oz','estimated_cost',2.50),
                jsonb_build_object('name','Quinoa','quantity','3/4 cup cooked','estimated_cost',0.90),
                jsonb_build_object('name','Broccoli','quantity','1 cup','estimated_cost',0.80)
              ))
          )
        ),
        jsonb_build_object(
          'day', 'wednesday',
          'is_injection_day', false,
          'total_protein_g', 120,
          'total_calories', 1480,
          'day_note', 'High-fiber day — beans and greens.',
          'meals', jsonb_build_array(
            jsonb_build_object('slot','Breakfast','name','Overnight Oats with Greek Yogurt','protein_g',28,'calories',360,
              'ingredients', jsonb_build_array(
                jsonb_build_object('name','Rolled oats','quantity','1/2 cup','estimated_cost',0.40),
                jsonb_build_object('name','Greek yogurt','quantity','1/2 cup','estimated_cost',0.75)
              )),
            jsonb_build_object('slot','Lunch','name','Lentil Soup with Side Salad','protein_g',30,'calories',400,
              'ingredients', jsonb_build_array(
                jsonb_build_object('name','Lentils','quantity','1 cup cooked','estimated_cost',0.80),
                jsonb_build_object('name','Mixed greens','quantity','2 cups','estimated_cost',1.20)
              )),
            jsonb_build_object('slot','Snack','name','Edamame','protein_g',18,'calories',160,
              'ingredients', jsonb_build_array(
                jsonb_build_object('name','Edamame','quantity','1 cup','estimated_cost',1.50)
              )),
            jsonb_build_object('slot','Dinner','name','Salmon with Roasted Vegetables','protein_g',44,'calories',560,
              'ingredients', jsonb_build_array(
                jsonb_build_object('name','Salmon fillet','quantity','5 oz','estimated_cost',5.50),
                jsonb_build_object('name','Zucchini','quantity','1','estimated_cost',0.70),
                jsonb_build_object('name','Bell pepper','quantity','1','estimated_cost',0.90)
              ))
          )
        ),
        jsonb_build_object(
          'day', 'thursday',
          'is_injection_day', false,
          'total_protein_g', 115,
          'total_calories', 1450,
          'meals', jsonb_build_array(
            jsonb_build_object('slot','Breakfast','name','Cottage Cheese Bowl','protein_g',28,'calories',300,
              'ingredients', jsonb_build_array(
                jsonb_build_object('name','Cottage cheese','quantity','1 cup','estimated_cost',1.40),
                jsonb_build_object('name','Berries','quantity','1/2 cup','estimated_cost',1.20)
              )),
            jsonb_build_object('slot','Lunch','name','Chicken Caesar Salad (light dressing)','protein_g',36,'calories',420,
              'ingredients', jsonb_build_array(
                jsonb_build_object('name','Chicken breast','quantity','5 oz','estimated_cost',2.50),
                jsonb_build_object('name','Romaine','quantity','3 cups','estimated_cost',1.00)
              )),
            jsonb_build_object('slot','Snack','name','String Cheese & Apple','protein_g',14,'calories',180,
              'ingredients', jsonb_build_array(
                jsonb_build_object('name','String cheese','quantity','2','estimated_cost',1.00),
                jsonb_build_object('name','Apple','quantity','1','estimated_cost',0.60)
              )),
            jsonb_build_object('slot','Dinner','name','Shrimp Stir-Fry with Brown Rice','protein_g',37,'calories',550,
              'ingredients', jsonb_build_array(
                jsonb_build_object('name','Shrimp','quantity','5 oz','estimated_cost',4.00),
                jsonb_build_object('name','Brown rice','quantity','3/4 cup cooked','estimated_cost',0.50),
                jsonb_build_object('name','Snap peas','quantity','1 cup','estimated_cost',1.20)
              ))
          )
        ),
        jsonb_build_object(
          'day', 'friday',
          'is_injection_day', false,
          'total_protein_g', 122,
          'total_calories', 1500,
          'day_note', 'High-fiber day — oats and beans.',
          'meals', jsonb_build_array(
            jsonb_build_object('slot','Breakfast','name','Protein Smoothie','protein_g',30,'calories',340,
              'ingredients', jsonb_build_array(
                jsonb_build_object('name','Whey protein','quantity','1 scoop','estimated_cost',1.50),
                jsonb_build_object('name','Banana','quantity','1','estimated_cost',0.40),
                jsonb_build_object('name','Spinach','quantity','1 cup','estimated_cost',0.70)
              )),
            jsonb_build_object('slot','Lunch','name','Black Bean Bowl','protein_g',28,'calories',430,
              'ingredients', jsonb_build_array(
                jsonb_build_object('name','Black beans','quantity','1 cup','estimated_cost',0.70),
                jsonb_build_object('name','Brown rice','quantity','1/2 cup','estimated_cost',0.35),
                jsonb_build_object('name','Salsa','quantity','1/4 cup','estimated_cost',0.40)
              )),
            jsonb_build_object('slot','Snack','name','Greek Yogurt','protein_g',20,'calories',150,
              'ingredients', jsonb_build_array(
                jsonb_build_object('name','Greek yogurt','quantity','1 cup','estimated_cost',1.50)
              )),
            jsonb_build_object('slot','Dinner','name','Lean Beef Stir-Fry','protein_g',44,'calories',580,
              'ingredients', jsonb_build_array(
                jsonb_build_object('name','Lean beef strips','quantity','5 oz','estimated_cost',4.20),
                jsonb_build_object('name','Broccoli','quantity','2 cups','estimated_cost',1.20),
                jsonb_build_object('name','Brown rice','quantity','1/2 cup','estimated_cost',0.35)
              ))
          )
        ),
        jsonb_build_object(
          'day', 'saturday',
          'is_injection_day', false,
          'total_protein_g', 116,
          'total_calories', 1460,
          'meals', jsonb_build_array(
            jsonb_build_object('slot','Breakfast','name','Egg White Omelette','protein_g',26,'calories',280,
              'ingredients', jsonb_build_array(
                jsonb_build_object('name','Egg whites','quantity','6','estimated_cost',1.50),
                jsonb_build_object('name','Tomato','quantity','1','estimated_cost',0.50)
              )),
            jsonb_build_object('slot','Lunch','name','Tuna Salad on Greens','protein_g',34,'calories',380,
              'ingredients', jsonb_build_array(
                jsonb_build_object('name','Canned tuna','quantity','1 can','estimated_cost',1.80),
                jsonb_build_object('name','Mixed greens','quantity','3 cups','estimated_cost',1.50)
              )),
            jsonb_build_object('slot','Snack','name','Protein Bar','protein_g',20,'calories',200,
              'ingredients', jsonb_build_array(
                jsonb_build_object('name','Protein bar','quantity','1','estimated_cost',2.50)
              )),
            jsonb_build_object('slot','Dinner','name','Turkey Meatballs with Zucchini Noodles','protein_g',36,'calories',600,
              'ingredients', jsonb_build_array(
                jsonb_build_object('name','Ground turkey','quantity','5 oz','estimated_cost',2.80),
                jsonb_build_object('name','Zucchini','quantity','2','estimated_cost',1.20),
                jsonb_build_object('name','Marinara','quantity','1/2 cup','estimated_cost',0.60)
              ))
          )
        ),
        jsonb_build_object(
          'day', 'sunday',
          'is_injection_day', false,
          'total_protein_g', 114,
          'total_calories', 1420,
          'meals', jsonb_build_array(
            jsonb_build_object('slot','Breakfast','name','Smoked Salmon & Cottage Cheese','protein_g',30,'calories',320,
              'ingredients', jsonb_build_array(
                jsonb_build_object('name','Smoked salmon','quantity','2 oz','estimated_cost',3.00),
                jsonb_build_object('name','Cottage cheese','quantity','3/4 cup','estimated_cost',1.10)
              )),
            jsonb_build_object('slot','Lunch','name','Chicken Quinoa Bowl','protein_g',36,'calories',450,
              'ingredients', jsonb_build_array(
                jsonb_build_object('name','Chicken breast','quantity','5 oz','estimated_cost',2.50),
                jsonb_build_object('name','Quinoa','quantity','3/4 cup','estimated_cost',0.90),
                jsonb_build_object('name','Cucumber','quantity','1/2','estimated_cost',0.40)
              )),
            jsonb_build_object('slot','Snack','name','Hard-Boiled Eggs','protein_g',12,'calories',140,
              'ingredients', jsonb_build_array(
                jsonb_build_object('name','Eggs','quantity','2','estimated_cost',0.80)
              )),
            jsonb_build_object('slot','Dinner','name','Baked Cod with Sweet Potato','protein_g',36,'calories',510,
              'ingredients', jsonb_build_array(
                jsonb_build_object('name','Cod fillet','quantity','6 oz','estimated_cost',4.80),
                jsonb_build_object('name','Sweet potato','quantity','1 medium','estimated_cost',0.80),
                jsonb_build_object('name','Asparagus','quantity','1 bunch','estimated_cost',2.00)
              ))
          )
        )
      )
    ),
    jsonb_build_object(
      'estimated_total', 72.50,
      'generated_at', now(),
      'sections', jsonb_build_array(
        jsonb_build_object('category','Proteins','items', jsonb_build_array(
          jsonb_build_object('name','Chicken breast','quantity','20 oz','unit','oz','estimated_cost',10.00,'nova_score',1),
          jsonb_build_object('name','Greek yogurt','quantity','3 cups','unit','cups','estimated_cost',4.50,'nova_score',1),
          jsonb_build_object('name','Eggs','quantity','1 dozen','unit','count','estimated_cost',3.50,'nova_score',1),
          jsonb_build_object('name','Salmon fillet','quantity','5 oz','unit','oz','estimated_cost',5.50,'nova_score',1)
        )),
        jsonb_build_object('category','Produce','items', jsonb_build_array(
          jsonb_build_object('name','Spinach','quantity','1 bag','unit','bag','estimated_cost',2.50,'nova_score',1),
          jsonb_build_object('name','Broccoli','quantity','2 heads','unit','count','estimated_cost',3.00,'nova_score',1),
          jsonb_build_object('name','Banana','quantity','1 bunch','unit','bunch','estimated_cost',1.50,'nova_score',1)
        )),
        jsonb_build_object('category','Dairy & Eggs','items', jsonb_build_array(
          jsonb_build_object('name','Cottage cheese','quantity','2 cups','unit','cups','estimated_cost',3.50,'nova_score',1)
        )),
        jsonb_build_object('category','Pantry','items', jsonb_build_array(
          jsonb_build_object('name','Quinoa','quantity','1 box','unit','box','estimated_cost',4.00,'nova_score',1),
          jsonb_build_object('name','Brown rice','quantity','1 bag','unit','bag','estimated_cost',3.00,'nova_score',1),
          jsonb_build_object('name','Black beans','quantity','2 cans','unit','cans','estimated_cost',2.00,'nova_score',1)
        )),
        jsonb_build_object('category','Other','items', jsonb_build_array(
          jsonb_build_object('name','Whey protein','quantity','1 tub','unit','tub','estimated_cost',18.00,'nova_score',4),
          jsonb_build_object('name','Protein bar','quantity','1','unit','count','estimated_cost',2.50,'nova_score',4)
        ))
      )
    )
  )
  on conflict (user_id, week_start) do update set
    plan_json = excluded.plan_json,
    grocery_list = excluded.grocery_list,
    generation_status = 'ready',
    updated_at = now();

  -- 14 days of symptom logs (only if none exist — preserve App Review history)
  if existing_symptoms = 0 then
    insert into public.symptom_logs (user_id, symptoms, severity, energy_level, notes, logged_at) values
      (demo_id, array['nausea','fatigue'],     3, 4, 'Injection day, felt rough in the morning', (today - 13)::timestamptz + time '08:12:00'),
      (demo_id, array['nausea'],               2, 5, null,                                        (today - 12)::timestamptz + time '07:45:00'),
      (demo_id, array['fatigue'],              2, 6, 'Getting better',                            (today - 11)::timestamptz + time '08:30:00'),
      (demo_id, array['bloating'],             1, 7, null,                                        (today - 10)::timestamptz + time '09:00:00'),
      (demo_id, array[]::text[],               1, 8, 'Feeling great today!',                      (today - 9)::timestamptz  + time '08:15:00'),
      (demo_id, array['constipation'],         2, 7, null,                                        (today - 8)::timestamptz  + time '07:55:00'),
      (demo_id, array['nausea','fatigue'],     3, 4, 'Injection day again',                       (today - 7)::timestamptz  + time '08:00:00'),
      (demo_id, array['nausea'],               2, 5, null,                                        (today - 6)::timestamptz  + time '08:20:00'),
      (demo_id, array['fatigue'],              2, 6, null,                                        (today - 5)::timestamptz  + time '08:10:00'),
      (demo_id, array['bloating'],             1, 7, 'High fiber day helped',                     (today - 4)::timestamptz  + time '07:50:00'),
      (demo_id, array[]::text[],               1, 8, null,                                        (today - 3)::timestamptz  + time '08:05:00'),
      (demo_id, array[]::text[],               1, 9, 'Best energy in weeks',                      (today - 2)::timestamptz  + time '08:30:00'),
      (demo_id, array['fatigue'],              2, 7, null,                                        (today - 1)::timestamptz  + time '08:00:00'),
      (demo_id, array['nausea','fatigue'],     3, 4, 'Injection day',                             today::timestamptz        + time '08:15:00');
  end if;

  -- Streak
  insert into public.streaks (user_id, current_streak, longest_streak, total_logs, last_logged_at)
  values (demo_id, 7, 7, greatest(existing_symptoms, 14), now())
  on conflict (user_id) do update set
    current_streak  = 7,
    longest_streak  = 7,
    total_logs      = greatest(public.streaks.total_logs, excluded.total_logs),
    last_logged_at  = now();

  -- Weight progress (3 logs over ~3 weeks, downward)
  insert into public.weight_logs (user_id, logged_date, weight_lbs, note, source) values
    (demo_id, today - 21, 198.0, 'Starting weight', 'manual'),
    (demo_id, today - 14, 194.2, null, 'manual'),
    (demo_id, today - 3,  191.5, 'Feeling lighter', 'manual')
  on conflict (user_id, logged_date) do update set
    weight_lbs = excluded.weight_lbs,
    note = excluded.note;

  -- Milestones
  insert into public.milestones (user_id, milestone_type, earned_at) values
    (demo_id, 'first_log',     now() - interval '14 days'),
    (demo_id, '7day_streak',   now() - interval '7 days'),
    (demo_id, 'first_insight', now() - interval '2 days')
  on conflict (user_id, milestone_type) do nothing;

  -- Weekly report
  insert into public.weekly_reports (user_id, week_start, insight_text, avg_protein_g, avg_energy, created_at)
  values (
    demo_id,
    week_monday,
    'Solid week, Demo User. Energy climbed mid-week when you stuck to softer meals after Monday''s injection. Protein averaged above 110g most days — keep the midday protein hit. Grocery stayed under your $75 budget.',
    116.5,
    6.4,
    now() - interval '1 day'
  )
  on conflict (user_id, week_start) do update set
    insight_text = excluded.insight_text,
    avg_protein_g = excluded.avg_protein_g,
    avg_energy = excluded.avg_energy;

  raise notice 'Demo account seeded for % (week starting %, symptoms kept=%)', demo_id, week_monday, existing_symptoms;
end $$;
