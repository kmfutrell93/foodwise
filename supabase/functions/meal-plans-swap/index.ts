import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.39.0';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

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

    const body = await req.json();
    const { plan_id, day, slot, reason } = body as {
      plan_id: string;
      day: string;
      slot: string;
      reason?: string;
    };

    if (!plan_id || !day || !slot) {
      return new Response(JSON.stringify({ error: 'plan_id, day, and slot are required' }), { status: 400, headers: corsHeaders });
    }

    const { data: plan } = await supabase
      .from('meal_plans')
      .select('*, profiles!inner(*)')
      .eq('id', plan_id)
      .eq('user_id', user.id)
      .single();

    if (!plan) return new Response(JSON.stringify({ error: 'Plan not found' }), { status: 404, headers: corsHeaders });

    const profile = plan.profiles;
    const dayData = plan.plan_json?.days?.find((d: { day: string }) => d.day.toLowerCase() === day.toLowerCase());
    const currentMeal = dayData?.meals?.find((m: { slot: string }) => m.slot === slot);

    if (!currentMeal) return new Response(JSON.stringify({ error: 'Meal not found' }), { status: 404, headers: corsHeaders });

    const RESTRICTION_RULES: Record<string, string> = {
      'gluten-free':    'EXCLUDE all gluten: no wheat, barley, rye, spelt, kamut, triticale, regular oats. Use certified gluten-free oats, rice, quinoa, corn, or potato instead.',
      'dairy-free':     'EXCLUDE all dairy: no milk, cheese, butter, cream, yogurt, whey, casein, lactose, or any dairy derivatives. Use plant-based alternatives (oat milk, coconut yogurt, etc.).',
      'egg-free':       'EXCLUDE all eggs and egg-derived ingredients in any form — no whole eggs, egg whites, mayonnaise, or baked goods containing eggs.',
      'nut-free':       'EXCLUDE all tree nuts (almonds, cashews, walnuts, pistachios, pecans, hazelnuts, macadamia) and peanuts. No nut butters, nut flours, or nut oils.',
      'shellfish-free': 'EXCLUDE all shellfish: no shrimp, crab, lobster, scallops, clams, mussels, oysters, or crayfish.',
      'soy-free':       'EXCLUDE all soy: no tofu, edamame, tempeh, miso, soy sauce (use coconut aminos), soy milk, or any ingredient labeled with soy/soya.',
      'vegetarian':     'EXCLUDE all meat and poultry (beef, pork, chicken, turkey, lamb). Fish and seafood ARE permitted. Dairy and eggs ARE permitted.',
      'vegan':          'EXCLUDE all animal products: no meat, poultry, fish, seafood, dairy, eggs, honey, or gelatin. Every ingredient must be 100% plant-based.',
      'pescatarian':    'EXCLUDE all meat and poultry (beef, pork, chicken, turkey, lamb). Fish and seafood ARE permitted.',
      'low-fodmap':     'EXCLUDE high-FODMAP foods: garlic, onion, leek, wheat, rye, most legumes, lactose, excess fructose, apples, pears, stone fruits, mushrooms, cauliflower, cashews, pistachios. Use low-FODMAP alternatives (chives, green onion tops, rice, oats, lactose-free dairy, strawberries, oranges, carrots, cucumber).',
      'halal':          'EXCLUDE pork and all pork-derived ingredients (bacon, ham, gelatin from pork, lard). EXCLUDE alcohol in any form — no cooking wine, beer-battered dishes, or vanilla extract made with alcohol. All meat must be halal-certified or clearly labeled halal. When in doubt, use plant-based or seafood proteins.',
      'kosher':         'EXCLUDE pork and all pork-derived ingredients. EXCLUDE shellfish (shrimp, crab, lobster, scallops, clams). Do NOT mix meat and dairy in any single meal — a meal is either meat-based OR dairy-based, never both. Prefer fish, eggs, and plant proteins when a neutral meal is needed.',
    };

    const activeRestrictions: string[] = profile.dietary_restrictions ?? [];
    const restrictionLabels = activeRestrictions.length > 0 ? activeRestrictions.join(', ') : 'none';
    const restrictionRules = activeRestrictions.length > 0
      ? activeRestrictions.map(r => RESTRICTION_RULES[r] ?? `Exclude all ${r} foods`).join('\n')
      : 'No dietary restrictions.';
    const aversions = (profile.food_aversions ?? []).join(', ') || 'none';

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      system: `You are a GLP-1 dietitian. You MUST honor all dietary restrictions with zero exceptions — if a food violates any restriction, it must not appear in the suggestion.

DIETARY RESTRICTION RULES — follow every applicable rule exactly:
${restrictionRules}`,
      messages: [{
        role: 'user',
        content: `Suggest ONE alternative meal to replace this ${slot} on ${day}.

Current meal: ${currentMeal.name} (${currentMeal.protein_g}g protein, ${currentMeal.calories} cal, $${currentMeal.cost})
Swap reason: ${reason ?? 'user preference'}
Active restrictions: ${restrictionLabels}
Food aversions (also exclude): ${aversions}
Is injection day: ${dayData.is_injection_day ? 'yes — use soft textures only (yogurt, eggs, smoothies, soups)' : 'no'}

Return ONLY valid JSON with no markdown:
{"name": "...", "protein_g": 28, "calories": 340, "cost": 2.10, "note": "..."}`
      }],
    });

    const rawText = message.content[0].type === 'text' ? message.content[0].text : '{}';
    const newMeal = JSON.parse(rawText);

    // Patch the plan in-place
    const updatedDays = plan.plan_json.days.map((d: { day: string; meals: { slot: string }[] }) => {
      if (d.day.toLowerCase() !== day.toLowerCase()) return d;
      return {
        ...d,
        meals: d.meals.map((m: { slot: string }) => m.slot === slot ? { ...m, ...newMeal } : m),
      };
    });

    const { data: updated } = await supabase
      .from('meal_plans')
      .update({ plan_json: { ...plan.plan_json, days: updatedDays } })
      .eq('id', plan_id)
      .select()
      .single();

    return new Response(JSON.stringify({ meal: newMeal, plan: updated }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('meal-plans/swap-meal error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
