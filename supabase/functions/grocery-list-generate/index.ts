import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { buildGroceryList, type Day } from '../_shared/build-grocery-list.ts';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.39.0';

const INGREDIENTS_TOOL = {
  name: 'submit_meal_ingredients',
  description: 'Submit purchasable ingredients for meals. Echo meal_key exactly.',
  input_schema: {
    type: 'object',
    properties: {
      meals: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            // Stable key from the prompt — MUST be echoed verbatim (e.g. "2026-08-10|Breakfast")
            meal_key: { type: 'string' },
            ingredients: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  quantity: { type: 'string' },
                  estimated_cost: { type: 'number' },
                },
                required: ['name', 'quantity', 'estimated_cost'],
              },
            },
          },
          required: ['meal_key', 'ingredients'],
        },
      },
    },
    required: ['meals'],
  },
} as const;

type MealPlanDay = {
  day: string;
  meals: {
    slot: string;
    name: string;
    protein_g?: number;
    calories?: number;
    ingredients?: { name: string; quantity: string; estimated_cost: number }[];
  }[];
};

type FlatMeal = {
  meal_key: string;
  day: string;
  slot: string;
  name: string;
  protein_g?: number;
  calories?: number;
};

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === 'object' && 'message' in err) return String((err as { message: unknown }).message);
  return 'Internal error';
}

function extractToolInput(message: { content: any[] }, toolName: string): any {
  const block = message.content.find((b: any) => b.type === 'tool_use' && b.name === toolName);
  if (!block) throw new Error(`Claude did not call ${toolName}`);
  return block.input;
}

function planHasIngredients(days: MealPlanDay[]): boolean {
  return days.some((d) =>
    (d.meals ?? []).some((m) => Array.isArray(m.ingredients) && m.ingredients.length > 0),
  );
}

function flattenMeals(days: MealPlanDay[]): FlatMeal[] {
  const out: FlatMeal[] = [];
  for (const d of days ?? []) {
    for (const m of d.meals ?? []) {
      const day = String(d.day);
      const slot = String(m.slot);
      out.push({
        meal_key: `${day}|${slot}`,
        day,
        slot,
        name: String(m.name),
        protein_g: m.protein_g,
        calories: m.calories,
      });
    }
  }
  return out;
}

function mergeIngredientsByKey(
  days: MealPlanDay[],
  ingredientMeals: { meal_key: string; ingredients: { name: string; quantity: string; estimated_cost: number }[] }[],
): { days: MealPlanDay[]; matched: number } {
  const byKey = new Map<string, typeof ingredientMeals[number]['ingredients']>();
  for (const m of ingredientMeals) {
    // Normalize: Claude may echo "date|slot | Meal Name"
    const raw = String(m.meal_key ?? '').trim();
    const parts = raw.split('|').map((p) => p.trim()).filter(Boolean);
    const key = parts.length >= 2 && /^\d{4}-\d{2}-\d{2}$/.test(parts[0])
      ? `${parts[0]}|${parts[1]}`
      : raw;
    if (!key) continue;
    byKey.set(key, m.ingredients ?? []);
    byKey.set(key.toLowerCase(), m.ingredients ?? []);
  }

  let matched = 0;
  const merged = days.map((day) => ({
    ...day,
    meals: (day.meals ?? []).map((meal) => {
      const key = `${day.day}|${meal.slot}`;
      const ingredients = byKey.get(key) ?? byKey.get(key.toLowerCase());
      if (ingredients && ingredients.length > 0) {
        matched += 1;
        return { ...meal, ingredients };
      }
      return meal;
    }),
  }));
  return { days: merged, matched };
}

async function generateIngredientsForBatch(
  anthropic: Anthropic,
  batch: FlatMeal[],
  batchLabel: string,
): Promise<{ meals: { meal_key: string; ingredients: { name: string; quantity: string; estimated_cost: number }[] }[]; stopReason: string | null; outputTokens: number | null; ms: number }> {
  const mealList = batch
    .map((m) =>
      `- meal_key=${m.meal_key} | ${m.name}${m.protein_g != null ? ` (${m.protein_g}g protein, ${m.calories ?? '?'} cal)` : ''}`,
    )
    .join('\n');

  const t0 = Date.now();
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    system:
      'You list grocery ingredients for meals. Be concise. For each meal list only 3-5 main purchasable ingredients (name, quantity, estimated_cost in USD). Skip salt, pepper, oil, water, and pantry staples. Echo meal_key EXACTLY as given — do not rename days or slots.',
    messages: [{
      role: 'user',
      content: `Generate ingredients for every meal below and submit via submit_meal_ingredients.\nEcho each meal_key verbatim.\n\nMeals:\n${mealList}`,
    }],
    tools: [INGREDIENTS_TOOL],
    tool_choice: { type: 'tool', name: INGREDIENTS_TOOL.name },
  });
  const ms = Date.now() - t0;
  console.log(`[plan] Claude call 2 (ingredients ${batchLabel}): ${ms}ms, stop_reason: ${msg.stop_reason}, tokens: ${msg.usage?.output_tokens}`);

  if (msg.stop_reason === 'max_tokens') {
    console.warn(`[grocery] ingredients batch ${batchLabel} truncated at max_tokens`);
  }

  const raw = extractToolInput(msg, INGREDIENTS_TOOL.name) as {
    meals?: { meal_key?: string; day?: string; slot?: string; ingredients?: { name: string; quantity: string; estimated_cost: number }[] }[];
  };

  const mealsRaw = Array.isArray(raw.meals) ? raw.meals : [];
  console.log(`[grocery] batch ${batchLabel} raw keys:`, raw ? Object.keys(raw).join(',') : 'null', 'meals_len:', mealsRaw.length);

  // Normalize: prefer meal_key; fall back to day|slot if model ignores schema.
  const meals = mealsRaw.map((m) => {
    const meal_key = (m.meal_key && String(m.meal_key).trim())
      || (m.day && m.slot ? `${m.day}|${m.slot}` : '');
    return {
      meal_key,
      ingredients: Array.isArray(m.ingredients) ? m.ingredients : [],
    };
  }).filter((m) => m.meal_key);

  return {
    meals,
    stopReason: msg.stop_reason ?? null,
    outputTokens: msg.usage?.output_tokens ?? null,
    ms,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const reqStart = Date.now();
  console.log('[grocery] START (ingredients + grocery)', new Date().toISOString());
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Missing authorization' }), { status: 401, headers: corsHeaders });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    console.log('[grocery] auth ok, user:', user.id);

    const body = await req.json();
    const { plan_id } = body as { plan_id: string };

    if (!plan_id) return new Response(JSON.stringify({ error: 'plan_id is required' }), { status: 400, headers: corsHeaders });

    const { data: plan, error: planError } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('id', plan_id)
      .eq('user_id', user.id)
      .single();

    if (planError) console.error('[grocery] plan fetch error', planError.message);
    if (!plan) return new Response(JSON.stringify({ error: 'Plan not found' }), { status: 404, headers: corsHeaders });
    console.log('[grocery] plan fetched, id:', plan.id, 'days:', plan.plan_json?.days?.length);

    const { data: profile } = await supabase
      .from('profiles')
      .select('weekly_budget')
      .eq('id', user.id)
      .single();

    const budget = profile?.weekly_budget ?? 75;
    let days: MealPlanDay[] = plan.plan_json?.days ?? [];
    const flat = flattenMeals(days);
    console.log('[grocery] flat meal count:', flat.length);

    if (!planHasIngredients(days)) {
      if (flat.length === 0) {
        throw new Error('Plan has no meals to generate ingredients for');
      }

      console.log('[grocery] meals missing ingredients — Claude calls starting');
      const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });

      // Split into two batches so one 28-meal tool payload cannot hit max_tokens.
      const mid = Math.ceil(flat.length / 2);
      const batch1 = flat.slice(0, mid);
      const batch2 = flat.slice(mid);

      const r1 = await generateIngredientsForBatch(anthropic, batch1, '1/2');
      const r2 = batch2.length > 0
        ? await generateIngredientsForBatch(anthropic, batch2, '2/2')
        : { meals: [], stopReason: null, outputTokens: 0, ms: 0 };

      const allIngredientMeals = [...r1.meals, ...r2.meals];
      console.log('[grocery] combined ingredient meal rows:', allIngredientMeals.length, 'needed:', flat.length);

      if (allIngredientMeals.length === 0) {
        throw new Error(
          `Claude returned no ingredient meals [stop_reason_1=${r1.stopReason}, stop_reason_2=${r2.stopReason}, out_tokens_1=${r1.outputTokens}, out_tokens_2=${r2.outputTokens}]`,
        );
      }

      const merged = mergeIngredientsByKey(days, allIngredientMeals);
      days = merged.days;
      console.log('[grocery] matched meals with ingredients:', merged.matched, '/', flat.length);

      if (merged.matched === 0) {
        throw new Error(
          `Ingredient merge matched 0/${flat.length} meals — meal_key mismatch. Claude rows=${allIngredientMeals.length}, sample_key=${allIngredientMeals[0]?.meal_key ?? 'none'}, plan_sample_key=${flat[0]?.meal_key ?? 'none'} [stop_reason_1=${r1.stopReason}, stop_reason_2=${r2.stopReason}]`,
        );
      }
    } else {
      console.log('[grocery] ingredients already present — skipping Claude');
    }

    const groceryList = buildGroceryList(days as Day[], budget);
    console.log('[grocery] built deterministically, sections:', groceryList.sections.length, 'total:', groceryList.estimated_total);

    console.log('[grocery] saving to DB, plan_id:', plan_id);
    const { data: updated, error: updateError } = await supabase
      .from('meal_plans')
      .update({
        plan_json: { days },
        grocery_list: groceryList,
      })
      .eq('id', plan_id)
      .select()
      .single();
    if (updateError) {
      console.error('[grocery] DB update failed', updateError);
      throw updateError;
    }
    console.log('[grocery] SAVED ok');
    console.log('[grocery] total duration:', Date.now() - reqStart, 'ms');

    if (groceryList.estimated_total <= budget) {
      await supabase.from('milestones').upsert({
        user_id: user.id,
        milestone_type: 'first_week_under_budget',
      }, { onConflict: 'user_id,milestone_type', ignoreDuplicates: true });
    }

    return new Response(JSON.stringify({ grocery_list: groceryList, plan: updated }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.log('[grocery] ERROR:', errorMessage(err));
    console.error('grocery-list/generate error:', errorMessage(err), err);
    return new Response(
      JSON.stringify({ error: errorMessage(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
