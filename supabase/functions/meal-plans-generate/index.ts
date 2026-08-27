import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { buildGroceryList, type Day } from '../_shared/build-grocery-list.ts';
import { attachIngredientsToDays, type MealPlanDay as IngredientDay } from '../_shared/generate-ingredients.ts';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.39.0';

const MEAL_PLAN_TOOL = {
  name: 'submit_meal_plan',
  description: 'Submit the generated 7-day meal plan (names and macros only — no ingredients).',
  input_schema: {
    type: 'object',
    properties: {
      days: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            day: { type: 'string' },
            is_injection_day: { type: 'boolean' },
            total_protein_g: { type: 'number' },
            total_calories: { type: 'number' },
            day_note: { type: 'string' },
            meals: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  slot: { type: 'string' },
                  name: { type: 'string' },
                  protein_g: { type: 'number' },
                  calories: { type: 'number' },
                },
                required: ['slot', 'name', 'protein_g', 'calories'],
              },
            },
          },
          required: ['day', 'is_injection_day', 'total_protein_g', 'total_calories', 'meals'],
        },
      },
    },
    required: ['days'],
  },
} as const;

type MealPlanDay = {
  day: string;
  is_injection_day?: boolean;
  total_protein_g?: number;
  total_calories?: number;
  day_note?: string;
  meals: {
    slot: string;
    name: string;
    protein_g: number;
    calories: number;
    ingredients?: { name: string; quantity: string; estimated_cost: number }[];
  }[];
};

function extractToolInput(message: { content: any[] }, toolName: string): any {
  const block = message.content.find((b: any) => b.type === 'tool_use' && b.name === toolName);
  if (!block) throw new Error(`Claude did not call ${toolName}`);
  return block.input;
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err !== null && 'message' in err) return String((err as { message: unknown }).message);
  return 'Internal error';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('[plan-fn] START', new Date().toISOString());
  let planId: string | null = null;
  let supabaseForFail: ReturnType<typeof createClient> | null = null;

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Missing authorization' }), { status: 401, headers: corsHeaders });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    supabaseForFail = supabase;

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile) return new Response(JSON.stringify({ error: 'Profile not found' }), { status: 404, headers: corsHeaders });

    const injectionDay = profile.injection_day ?? 'monday';
    const budget = profile.weekly_budget ?? 75;
    const proteinRange = '100-130g';
    const aversions = (profile.food_aversions ?? []).join(', ') || 'none';
    const appetite = profile.appetite_level ?? 'moderate';
    const medication = profile.medication ?? 'semaglutide';

    function getRestrictionRule(r: string): string {
      switch (r) {
        case 'gluten-free':    return 'EXCLUDE all gluten: no wheat, barley, rye, spelt, kamut, triticale, regular oats. Use certified gluten-free oats, rice, quinoa, corn, or potato instead.';
        case 'dairy-free':     return 'EXCLUDE all dairy: no milk, cheese, butter, cream, yogurt, whey, casein, lactose, or any dairy derivatives. Use plant-based alternatives (oat milk, coconut yogurt, etc.).';
        case 'egg-free':       return 'EXCLUDE all eggs and egg-derived ingredients in any form — no whole eggs, egg whites, mayonnaise, or baked goods containing eggs.';
        case 'nut-free':       return 'EXCLUDE all tree nuts (almonds, cashews, walnuts, pistachios, pecans, hazelnuts, macadamia) and peanuts. No nut butters, nut flours, or nut oils.';
        case 'shellfish-free': return 'EXCLUDE all shellfish: no shrimp, crab, lobster, scallops, clams, mussels, oysters, or crayfish.';
        case 'soy-free':       return 'EXCLUDE all soy: no tofu, edamame, tempeh, miso, soy sauce (use coconut aminos), soy milk, or any ingredient labeled with soy/soya.';
        case 'vegetarian':     return 'EXCLUDE all meat and poultry (beef, pork, chicken, turkey, lamb). Fish and seafood ARE permitted. Dairy and eggs ARE permitted.';
        case 'vegan':          return 'EXCLUDE all animal products: no meat, poultry, fish, seafood, dairy, eggs, honey, or gelatin. Every ingredient must be 100% plant-based.';
        case 'pescatarian':    return 'EXCLUDE all meat and poultry (beef, pork, chicken, turkey, lamb). Fish and seafood ARE permitted.';
        case 'low-fodmap':     return 'EXCLUDE high-FODMAP foods: garlic, onion, leek, wheat, rye, most legumes, lactose, excess fructose, apples, pears, stone fruits, mushrooms, cauliflower, cashews, pistachios. Use low-FODMAP alternatives (chives, green onion tops, rice, oats, lactose-free dairy, strawberries, oranges, carrots, cucumber).';
        case 'halal':          return 'EXCLUDE pork and all pork-derived ingredients (bacon, ham, gelatin from pork, lard). EXCLUDE alcohol in any form — no cooking wine, beer-battered dishes, or vanilla extract made with alcohol. All meat must be halal-certified or clearly labeled halal. When in doubt, use plant-based or seafood proteins.';
        case 'kosher':         return 'EXCLUDE pork and all pork-derived ingredients. EXCLUDE shellfish (shrimp, crab, lobster, scallops, clams). Do NOT mix meat and dairy in any single meal — a meal is either meat-based OR dairy-based, never both. Prefer fish, eggs, and plant proteins when a neutral meal is needed.';
        default:               return `Exclude all ${r} foods`;
      }
    }

    const activeRestrictions: string[] = profile.dietary_restrictions ?? [];
    const restrictionLabels = activeRestrictions.length > 0 ? activeRestrictions.join(', ') : 'none';
    const restrictionRules = activeRestrictions.length > 0
      ? activeRestrictions.map(getRestrictionRule).join('\n')
      : 'No dietary restrictions.';

    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1); // Monday
    const weekStartStr = weekStart.toISOString().split('T')[0];
    const nowIso = new Date().toISOString();

    // Mark generating FAST so the client can poll — keep existing plan_json until ready.
    const { data: existingRow } = await supabase
      .from('meal_plans')
      .select('id')
      .eq('user_id', user.id)
      .eq('week_start', weekStartStr)
      .maybeSingle();

    if (existingRow?.id) {
      const { data: marked, error: markErr } = await supabase
        .from('meal_plans')
        .update({ generation_status: 'generating', updated_at: nowIso })
        .eq('id', existingRow.id)
        .select('id')
        .single();
      if (markErr) throw markErr;
      planId = marked.id;
    } else {
      const { data: inserted, error: insertErr } = await supabase
        .from('meal_plans')
        .insert({
          user_id: user.id,
          week_start: weekStartStr,
          plan_json: { days: [] },
          grocery_list: null,
          generation_status: 'generating',
          updated_at: nowIso,
        })
        .select('id')
        .single();
      if (insertErr) throw insertErr;
      planId = inserted.id;
    }
    console.log('[plan-fn] row created generating', planId, 'week', weekStartStr);

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });

    const doseStartDate: string | null = profile.dose_start_date ?? null;
    let isEscalationWeek = false;
    if (doseStartDate) {
      const daysOnCurrentDose = Math.floor((Date.now() - new Date(doseStartDate).getTime()) / 86_400_000);
      const daysUntilEscalation = Math.max(0, 28 - daysOnCurrentDose);
      isEscalationWeek = daysUntilEscalation <= 7;
    }

    const MED_PROFILES: Record<string, { drug_class: string; nausea_profile: string; appetite_suppression: string; side_effect_window_hours: number; nausea_foods_to_avoid: string; protein_emphasis: string }> = {
      semaglutide: { drug_class: 'semaglutide', nausea_profile: 'moderate', appetite_suppression: 'strong', side_effect_window_hours: 36, nausea_foods_to_avoid: 'fatty fried foods, spicy dishes, carbonated drinks, alcohol, high-fat dairy', protein_emphasis: 'high' },
      tirzepatide: { drug_class: 'tirzepatide', nausea_profile: 'higher', appetite_suppression: 'very_strong', side_effect_window_hours: 24, nausea_foods_to_avoid: 'fatty fried foods, high-fat dairy, rich sauces, carbonated drinks, alcohol, spicy dishes, large portions of red meat', protein_emphasis: 'critical' },
      liraglutide: { drug_class: 'liraglutide', nausea_profile: 'moderate', appetite_suppression: 'strong', side_effect_window_hours: 12, nausea_foods_to_avoid: 'fatty fried foods, spicy dishes, carbonated drinks, alcohol', protein_emphasis: 'high' },
      other: { drug_class: 'other', nausea_profile: 'moderate', appetite_suppression: 'strong', side_effect_window_hours: 36, nausea_foods_to_avoid: 'fatty fried foods, spicy dishes, carbonated drinks, alcohol', protein_emphasis: 'high' },
    };
    const medProfile = MED_PROFILES[medication] ?? MED_PROFILES.semaglutide;

    const symptomContext = profile.latest_symptom_recommendation &&
      profile.latest_symptom_insight_at &&
      (Date.now() - new Date(profile.latest_symptom_insight_at).getTime()) < 14 * 24 * 60 * 60 * 1000
        ? `\nRECENT SYMPTOM INSIGHT: Based on this user's last 14 days of symptom logs, their nutritionist recommended: "${profile.latest_symptom_recommendation}". Apply this guidance when selecting meals for this plan.`
        : '';

    const STRUGGLE_GUIDANCE: Record<string, string> = {
      protein: 'Their #1 goal is hitting protein targets despite low appetite — every meal must be protein-dense and easy to finish even when full quickly.',
      nausea: 'Their #1 challenge is nausea and food aversions — prioritize bland, low-fat, low-odor foods and avoid anything that historically triggers nausea.',
      confusion: 'Their #1 struggle is not knowing what to eat — keep meals simple, familiar, and clearly explained, avoiding exotic ingredients.',
      muscle: 'Their #1 concern is losing muscle mass — maximize protein-per-calorie efficiency and never let a meal fall short of its protein target.',
    };
    const primaryStruggle: string | null = profile.primary_struggle ?? null;
    const struggleContext = primaryStruggle && STRUGGLE_GUIDANCE[primaryStruggle]
      ? `\nPRIMARY GOAL (weight this heavily): ${STRUGGLE_GUIDANCE[primaryStruggle]}`
      : '';

    const checkInTime: string | null = profile.check_in_time ?? null;
    const checkInContext = checkInTime
      ? `\nThe user checks in on the app in the ${checkInTime} — keep this in mind for meal timing/ordering in the plan (e.g. lead with whichever meal fits a ${checkInTime} routine).`
      : '';

    const systemPrompt = `You are a registered dietitian specializing in GLP-1 medication nutrition. Generate exactly 7 days of meals as JSON. Be concise — short meal names, no prose. Every meal must hit protein targets. Honor all dietary restrictions with zero exceptions.
Always generate fresh, varied meal plans. Never repeat the same meals.
Rotate proteins daily. Do NOT include ingredients — meal names and macros only.
Optional day_note (one short string per day) for injection/fiber guidance — never per-meal notes.${symptomContext}${struggleContext}`;

    const userPrompt = `IMPORTANT: Generate a FRESH, VARIED meal plan. Do not repeat meals from previous plans.
Today's randomization seed: ${Date.now()} — use this to ensure variety.
Vary proteins across the week: use chicken, fish, eggs, legumes, Greek yogurt, and beef
on different days. No meal name should repeat across the 7 days.

Generate a complete 7-day meal plan starting Monday ${weekStartStr} and submit it via the submit_meal_plan tool.
Each meal needs only: slot, name, protein_g, calories. Do NOT include ingredients.

Medication: ${medication} (${medProfile.drug_class}). Nausea profile: ${medProfile.nausea_profile}. Appetite suppression: ${medProfile.appetite_suppression}. Foods to minimise: ${medProfile.nausea_foods_to_avoid}.
Injection day: ${injectionDay}. Escalation week: ${isEscalationWeek ? 'yes — maximise soft textures across ALL days' : 'no'}.
Protein target: ${proteinRange} per day. Appetite level: ${appetite} (${appetite === 'low' ? 'use smaller, more frequent, ultra protein-dense meals' : appetite === 'normal' ? 'standard portion sizes are fine' : 'moderate portions, lean on protein-dense staples'}).
Active dietary restrictions: ${restrictionLabels}
Food aversions (also exclude): ${aversions}
${restrictionRules}${checkInContext}

VARIETY REQUIREMENTS:
- No protein source should repeat more than twice across the 7 days
- Breakfast must rotate: eggs, yogurt, oats, smoothie, cottage cheese options
- At least 3 different protein sources per week (chicken, fish, eggs, legumes, beef)
- At least 2 meatless meals per week (eggs, legumes, tofu)
- Injection day meals must be noticeably different from standard days in texture and portion

Rules:
- injection_day = true only for ${injectionDay}
- On injection day: use soft textures (yogurt, eggs, smoothies, soups) — NO tough meats or raw vegetables
- Days 3-5 post-injection: include high-fiber foods (lentils, beans, leafy greens, oats)
- Each day must hit at least ${proteinRange.split('-')[0] ?? '100'}g protein
- Include 3 meals + optional snack per day
- All restrictions excluded: ${restrictionLabels}
- All aversions excluded: ${aversions}
- Use optional day_note for injection-day or fiber guidance (one per day max). Do not add per-meal notes.`;

    console.log('[plan-fn] claude plan started');
    const t1 = Date.now();
    const msg1 = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
      tools: [MEAL_PLAN_TOOL],
      tool_choice: { type: 'tool', name: MEAL_PLAN_TOOL.name },
    });
    const ms1 = Date.now() - t1;
    console.log(`[plan-fn] claude plan done: ${ms1}ms, stop_reason: ${msg1.stop_reason}, tokens: ${msg1.usage?.output_tokens}`);

    if (msg1.stop_reason === 'max_tokens') {
      console.warn('[plan-fn] call 1 truncated at max_tokens — plan may be incomplete');
    }

    const planData = extractToolInput(msg1, MEAL_PLAN_TOOL.name) as { days?: MealPlanDay[] };
    const dayCount = Array.isArray(planData.days) ? planData.days.length : 0;
    const mealCount = Array.isArray(planData.days)
      ? planData.days.reduce((sum, d) => sum + (d.meals?.length ?? 0), 0)
      : 0;
    console.log('[plan-fn] parsed plan', { dayCount, mealCount });

    if (!Array.isArray(planData.days) || planData.days.length < 3) {
      throw new Error(
        `Claude returned an incomplete plan — please try again. [stop_reason=${msg1.stop_reason}, days=${dayCount}, meals=${mealCount}, out_tokens=${msg1.usage?.output_tokens}, ms=${ms1}]`,
      );
    }

    // Ingredients (2 batches) + deterministic grocery — all server-side before ready.
    console.log('[plan-fn] ingredients started');
    const daysWithIngredients = await attachIngredientsToDays(
      anthropic,
      planData.days as IngredientDay[],
    );
    console.log('[plan-fn] ingredients done');
    const groceryList = buildGroceryList(daysWithIngredients as Day[], budget);
    console.log('[plan-fn] grocery done, sections:', groceryList.sections.length, 'total:', groceryList.estimated_total);

    const { data: savedPlan, error: saveError } = await supabase
      .from('meal_plans')
      .update({
        plan_json: { days: daysWithIngredients },
        grocery_list: groceryList,
        generation_status: 'ready',
        updated_at: new Date().toISOString(),
      })
      .eq('id', planId!)
      .select()
      .single();

    if (saveError) {
      console.error('[plan-fn] DB save failed', saveError);
      throw saveError;
    }
    console.log('[plan-fn] status ready', { planId: savedPlan?.id, weekStart: weekStartStr });

    if (groceryList.estimated_total <= budget) {
      await supabase.from('milestones').upsert({
        user_id: user.id,
        milestone_type: 'first_week_under_budget',
      }, { onConflict: 'user_id,milestone_type', ignoreDuplicates: true });
    }

    console.log('[plan-fn] END ok', savedPlan?.id);
    return new Response(JSON.stringify(savedPlan), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[plan-fn] ERROR:', errorMessage(err), err);
    if (planId && supabaseForFail) {
      try {
        await supabaseForFail
          .from('meal_plans')
          .update({ generation_status: 'failed', updated_at: new Date().toISOString() })
          .eq('id', planId);
      } catch (markFailErr) {
        console.error('[plan-fn] failed to mark generation_status=failed', markFailErr);
      }
    }
    console.log('[plan-fn] END error');
    return new Response(
      JSON.stringify({ error: errorMessage(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
