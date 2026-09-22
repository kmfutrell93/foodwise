-- Launch seed: GLP-1-friendly library recipes so Recipes tab never hits empty-table AI fallback.
-- Idempotent: skips if any recipes already exist.

INSERT INTO public.recipes (
  name, meal_type, medication_suitability, texture, phase_suitability,
  protein_g, calories, cook_time_mins, skill_level, serving_size,
  ingredients, instructions, nova_score, allergens, budget_tier, tags, dietitian_reviewed
)
SELECT * FROM (VALUES
  (
    'Greek Yogurt Berry Parfait'::text,
    ARRAY['breakfast']::text[],
    ARRAY['semaglutide','tirzepatide','liraglutide']::text[],
    'soft'::text,
    ARRAY['injection_day','post_injection','standard']::text[],
    26::numeric, 280, 5, 'simple'::text, 1,
    '[{"qty":"3/4","unit":"cup","name":"plain nonfat Greek yogurt"},{"qty":"1/4","unit":"cup","name":"low-fat cottage cheese"},{"qty":"1/2","unit":"cup","name":"mixed berries"},{"qty":"2","unit":"tbsp","name":"low-sugar granola"},{"qty":"1","unit":"tsp","name":"chia seeds"},{"qty":"1","unit":"tsp","name":"honey"}]'::jsonb,
    ARRAY[
      'Stir Greek yogurt and cottage cheese until smooth.',
      'Layer half the yogurt mix in a glass, then half the berries.',
      'Add remaining yogurt, top with berries, granola, chia, and a drizzle of honey.',
      'Eat slowly — stop when comfortably satisfied.'
    ]::text[],
    2, ARRAY['dairy']::text[], 'budget'::text,
    ARRAY['high-protein','no-cook','soft']::text[],
    true
  ),
  (
    'Turkey & Egg Breakfast Bowl',
    ARRAY['breakfast'],
    ARRAY['semaglutide','tirzepatide','liraglutide'],
    'soft',
    ARRAY['post_injection','standard'],
    32::numeric, 360, 15, 'simple', 1,
    '[{"qty":"3","unit":"oz","name":"lean ground turkey"},{"qty":"2","unit":"large","name":"eggs"},{"qty":"1","unit":"cup","name":"baby spinach"},{"qty":"1/4","unit":"cup","name":"diced tomato"},{"qty":"1","unit":"tsp","name":"olive oil"},{"qty":"1","unit":"pinch","name":"salt and pepper"}]'::jsonb,
    ARRAY[
      'Warm olive oil in a nonstick skillet over medium heat.',
      'Cook turkey until browned, breaking into small pieces, about 5 minutes.',
      'Add spinach and tomato; cook until spinach wilts.',
      'Push mixture aside, scramble eggs gently until just set.',
      'Fold together, season lightly, and serve warm.'
    ]::text[],
    1, ARRAY['eggs']::text[], 'budget',
    ARRAY['high-protein','savory','breakfast'],
    true
  ),
  (
    'Grilled Chicken Power Salad',
    ARRAY['lunch'],
    ARRAY['semaglutide','tirzepatide','liraglutide'],
    'normal',
    ARRAY['standard','post_injection'],
    38::numeric, 420, 20, 'simple', 1,
    '[{"qty":"5","unit":"oz","name":"boneless chicken breast"},{"qty":"3","unit":"cups","name":"mixed salad greens"},{"qty":"1/2","unit":"cup","name":"cucumber, sliced"},{"qty":"1/4","unit":"cup","name":"cherry tomatoes"},{"qty":"2","unit":"tbsp","name":"crumbled feta"},{"qty":"1","unit":"tbsp","name":"olive oil"},{"qty":"1","unit":"tbsp","name":"lemon juice"}]'::jsonb,
    ARRAY[
      'Season chicken lightly with salt and pepper.',
      'Grill or pan-sear 5–6 minutes per side until cooked through; rest 3 minutes and slice.',
      'Toss greens, cucumber, and tomatoes with olive oil and lemon.',
      'Top with sliced chicken and feta. Serve immediately.'
    ]::text[],
    1, ARRAY['dairy']::text[], 'mid',
    ARRAY['high-protein','salad','glp-1'],
    true
  ),
  (
    'Lentil & Cottage Cheese Bowl',
    ARRAY['lunch'],
    ARRAY['semaglutide','tirzepatide','liraglutide'],
    'soft',
    ARRAY['injection_day','standard','constipation_phase'],
    30::numeric, 390, 25, 'simple', 1,
    '[{"qty":"3/4","unit":"cup","name":"cooked brown lentils"},{"qty":"1/2","unit":"cup","name":"low-fat cottage cheese"},{"qty":"1/2","unit":"cup","name":"roasted sweet potato cubes"},{"qty":"1","unit":"handful","name":"arugula"},{"qty":"1","unit":"tsp","name":"olive oil"},{"qty":"1/2","unit":"tsp","name":"cumin"}]'::jsonb,
    ARRAY[
      'Warm lentils with cumin and a splash of water until heated through.',
      'Add sweet potato cubes and stir gently.',
      'Spoon into a bowl, top with cottage cheese and arugula.',
      'Finish with olive oil. Eat slowly for best digestion.'
    ]::text[],
    1, ARRAY['dairy']::text[], 'budget',
    ARRAY['fiber','vegetarian','soft'],
    true
  ),
  (
    'Lemon Herb Baked Salmon',
    ARRAY['dinner'],
    ARRAY['semaglutide','tirzepatide','liraglutide'],
    'soft',
    ARRAY['injection_day','post_injection','standard'],
    36::numeric, 480, 25, 'simple', 1,
    '[{"qty":"5","unit":"oz","name":"salmon fillet"},{"qty":"1","unit":"cup","name":"steamed broccoli"},{"qty":"1/2","unit":"cup","name":"cooked quinoa"},{"qty":"1","unit":"tsp","name":"olive oil"},{"qty":"1","unit":"tbsp","name":"lemon juice"},{"qty":"1","unit":"tsp","name":"dried dill"},{"qty":"1","unit":"pinch","name":"salt and pepper"}]'::jsonb,
    ARRAY[
      'Preheat oven to 400°F (200°C).',
      'Place salmon on a lined sheet; brush with olive oil, lemon, dill, salt, and pepper.',
      'Bake 12–14 minutes until just opaque and flakes easily.',
      'Serve with quinoa and steamed broccoli. Keep portions modest.'
    ]::text[],
    1, ARRAY['fish']::text[], 'mid',
    ARRAY['omega-3','high-protein','gentle'],
    true
  ),
  (
    'Soft Turkey Chili',
    ARRAY['dinner'],
    ARRAY['semaglutide','tirzepatide','liraglutide'],
    'soft',
    ARRAY['injection_day','post_injection','standard'],
    34::numeric, 410, 35, 'simple', 2,
    '[{"qty":"8","unit":"oz","name":"lean ground turkey"},{"qty":"1","unit":"cup","name":"canned crushed tomatoes"},{"qty":"1/2","unit":"cup","name":"canned black beans, rinsed"},{"qty":"1/2","unit":"cup","name":"diced zucchini"},{"qty":"1","unit":"tsp","name":"chili powder"},{"qty":"1/2","unit":"tsp","name":"cumin"},{"qty":"1","unit":"tsp","name":"olive oil"}]'::jsonb,
    ARRAY[
      'Brown turkey in olive oil over medium heat, breaking into fine pieces.',
      'Add zucchini, spices, tomatoes, and beans.',
      'Simmer uncovered 20 minutes until thick and soft.',
      'Serve a half portion in a small bowl; refrigerate leftovers.'
    ]::text[],
    2, ARRAY[]::text[], 'budget',
    ARRAY['soft','make-ahead','high-protein'],
    true
  ),
  (
    'Cottage Cheese & Cucumber Snack',
    ARRAY['snack'],
    ARRAY['semaglutide','tirzepatide','liraglutide'],
    'soft',
    ARRAY['injection_day','post_injection','standard'],
    18::numeric, 180, 5, 'simple', 1,
    '[{"qty":"3/4","unit":"cup","name":"low-fat cottage cheese"},{"qty":"1/2","unit":"cup","name":"cucumber, diced"},{"qty":"1","unit":"tsp","name":"everything bagel seasoning"},{"qty":"1","unit":"tsp","name":"lemon juice"}]'::jsonb,
    ARRAY[
      'Spoon cottage cheese into a small bowl.',
      'Top with cucumber, lemon juice, and seasoning.',
      'Enjoy as a protein-forward snack between meals.'
    ]::text[],
    1, ARRAY['dairy']::text[], 'budget',
    ARRAY['no-cook','snack','high-protein'],
    true
  ),
  (
    'Silken Tofu Miso Soup',
    ARRAY['snack','dinner'],
    ARRAY['semaglutide','tirzepatide','liraglutide'],
    'soft',
    ARRAY['injection_day','post_injection','constipation_phase'],
    16::numeric, 190, 12, 'simple', 1,
    '[{"qty":"2","unit":"cups","name":"low-sodium broth"},{"qty":"4","unit":"oz","name":"silken tofu, cubed"},{"qty":"1","unit":"tbsp","name":"white miso paste"},{"qty":"1","unit":"handful","name":"baby spinach"},{"qty":"1","unit":"tsp","name":"scallions, sliced"}]'::jsonb,
    ARRAY[
      'Warm broth gently — do not boil hard.',
      'Whisk a ladle of hot broth into miso, then return to the pot.',
      'Add tofu and spinach; heat 2–3 minutes until spinach wilts.',
      'Top with scallions and sip slowly.'
    ]::text[],
    2, ARRAY['soy']::text[], 'budget',
    ARRAY['soft','injection-day','warm'],
    true
  )
) AS v(
  name, meal_type, medication_suitability, texture, phase_suitability,
  protein_g, calories, cook_time_mins, skill_level, serving_size,
  ingredients, instructions, nova_score, allergens, budget_tier, tags, dietitian_reviewed
)
WHERE NOT EXISTS (SELECT 1 FROM public.recipes LIMIT 1);
