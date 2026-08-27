import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.39.0';

export const INGREDIENTS_TOOL = {
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

export type MealPlanDay = {
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

function extractToolInput(message: { content: any[] }, toolName: string): any {
  const block = message.content.find((b: any) => b.type === 'tool_use' && b.name === toolName);
  if (!block) throw new Error(`Claude did not call ${toolName}`);
  return block.input;
}

export function flattenMeals(days: MealPlanDay[]): FlatMeal[] {
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

/**
 * Claude often echoes the whole prompt line as meal_key, e.g.
 * "2026-08-10|Breakfast | Greek Yogurt Parfait..." instead of "2026-08-10|Breakfast".
 * Normalize to the first two pipe segments (date|slot).
 */
export function normalizeMealKey(raw: string): string {
  const s = String(raw ?? '').trim();
  if (!s) return '';
  const parts = s.split('|').map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2 && /^\d{4}-\d{2}-\d{2}$/.test(parts[0])) {
    return `${parts[0]}|${parts[1]}`;
  }
  return s;
}

export function mergeIngredientsByKey(
  days: MealPlanDay[],
  ingredientMeals: { meal_key: string; ingredients: { name: string; quantity: string; estimated_cost: number }[] }[],
): { days: MealPlanDay[]; matched: number } {
  const byKey = new Map<string, typeof ingredientMeals[number]['ingredients']>();
  for (const m of ingredientMeals) {
    const key = normalizeMealKey(m.meal_key ?? '');
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
): Promise<{ meals: { meal_key: string; ingredients: { name: string; quantity: string; estimated_cost: number }[] }[]; stopReason: string | null; outputTokens: number | null }> {
  const mealList = batch
    .map((m) =>
      `meal_key: "${m.meal_key}"\nname: ${m.name}${m.protein_g != null ? `\nprotein_g: ${m.protein_g}\ncalories: ${m.calories ?? '?'}` : ''}`,
    )
    .join('\n\n');

  const t0 = Date.now();
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    system:
      'You list grocery ingredients for meals. Be concise. For each meal list only 3-5 main purchasable ingredients (name, quantity, estimated_cost in USD). Skip salt, pepper, oil, water, and pantry staples. The meal_key field must be EXACTLY the quoted string (e.g. "2026-08-10|Breakfast") — never append the meal name.',
    messages: [{
      role: 'user',
      content: `Generate ingredients for every meal below and submit via submit_meal_ingredients.\nCopy each meal_key EXACTLY as quoted — do not add the meal name to meal_key.\n\nMeals:\n${mealList}`,
    }],
    tools: [INGREDIENTS_TOOL],
    tool_choice: { type: 'tool', name: INGREDIENTS_TOOL.name },
  });
  console.log(`[plan-fn] Claude ingredients ${batchLabel}: ${Date.now() - t0}ms, stop_reason: ${msg.stop_reason}, tokens: ${msg.usage?.output_tokens}`);

  const raw = extractToolInput(msg, INGREDIENTS_TOOL.name) as {
    meals?: { meal_key?: string; day?: string; slot?: string; ingredients?: { name: string; quantity: string; estimated_cost: number }[] }[];
  };

  const mealsRaw = Array.isArray(raw.meals) ? raw.meals : [];
  const meals = mealsRaw.map((m) => {
    const meal_key = normalizeMealKey(
      (m.meal_key && String(m.meal_key).trim())
        || (m.day && m.slot ? `${m.day}|${m.slot}` : ''),
    );
    return {
      meal_key,
      ingredients: Array.isArray(m.ingredients) ? m.ingredients : [],
    };
  }).filter((m) => m.meal_key);

  return {
    meals,
    stopReason: msg.stop_reason ?? null,
    outputTokens: msg.usage?.output_tokens ?? null,
  };
}

/** Two-batch Claude ingredient generation + merge into plan days. */
export async function attachIngredientsToDays(
  anthropic: Anthropic,
  days: MealPlanDay[],
): Promise<MealPlanDay[]> {
  const flat = flattenMeals(days);
  if (flat.length === 0) throw new Error('Plan has no meals to generate ingredients for');

  const mid = Math.ceil(flat.length / 2);
  const batch1 = flat.slice(0, mid);
  const batch2 = flat.slice(mid);

  const r1 = await generateIngredientsForBatch(anthropic, batch1, '1/2');
  const r2 = batch2.length > 0
    ? await generateIngredientsForBatch(anthropic, batch2, '2/2')
    : { meals: [], stopReason: null, outputTokens: 0 };

  const allIngredientMeals = [...r1.meals, ...r2.meals];
  if (allIngredientMeals.length === 0) {
    throw new Error(
      `Claude returned no ingredient meals [stop_reason_1=${r1.stopReason}, stop_reason_2=${r2.stopReason}]`,
    );
  }

  const merged = mergeIngredientsByKey(days, allIngredientMeals);
  console.log('[plan-fn] matched meals with ingredients:', merged.matched, '/', flat.length);
  if (merged.matched === 0) {
    throw new Error(
      `Ingredient merge matched 0/${flat.length} meals — meal_key mismatch. sample=${allIngredientMeals[0]?.meal_key ?? 'none'}`,
    );
  }
  return merged.days;
}
