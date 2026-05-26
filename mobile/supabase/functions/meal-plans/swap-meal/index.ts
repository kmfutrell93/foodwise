import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.36.3';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);
const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders() });
  }

  try {
    const { plan_id, day_index, slot, user_id } = await req.json();

    const [{ data: plan }, { data: profile }] = await Promise.all([
      supabase.from('meal_plans').select('*').eq('id', plan_id).single(),
      supabase.from('profiles').select('*').eq('id', user_id).single(),
    ]);

    if (!plan || !profile) return jsonError('Not found', 404);

    const targetDay = plan.plan_json.days[day_index];
    if (!targetDay) return jsonError('Invalid day index', 400);

    const currentMeal = targetDay.meals[slot];
    const context = `
Day: ${targetDay.day} ${targetDay.is_injection_day ? '(INJECTION DAY — keep textures soft)' : ''}
Slot: ${slot}
Current meal: ${currentMeal?.name} (${currentMeal?.protein_g}g protein, $${currentMeal?.cost_usd})
Dietary restrictions: ${profile.dietary_restrictions?.join(', ') || 'none'}
Budget remaining today: ~$${(targetDay.totals.cost_usd * 0.35).toFixed(2)} for this meal
Appetite: ${profile.appetite_level}
Food aversions: ${profile.food_aversions?.join(', ') || 'none'}
`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Suggest one alternative meal for this context. Return ONLY JSON matching this schema:
{
  "name": "string",
  "description": "string",
  "protein_g": number,
  "calories": number,
  "cost_usd": number,
  "prep_minutes": number,
  "texture": "soft|normal|crunchy",
  "ingredients": ["string"]
}

Context:
${context}

Return pure JSON only, no explanation.`,
      }],
    });

    const rawText = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return jsonError('Failed to parse swap from AI', 500);

    const newMeal = JSON.parse(jsonMatch[0]);

    // Update the plan in-place
    const updatedPlanJson = { ...plan.plan_json };
    updatedPlanJson.days[day_index].meals[slot] = newMeal;

    // Recalculate day totals
    const meals = Object.values(updatedPlanJson.days[day_index].meals) as any[];
    updatedPlanJson.days[day_index].totals = {
      protein_g: meals.reduce((a, m) => a + (m.protein_g ?? 0), 0),
      calories: meals.reduce((a, m) => a + (m.calories ?? 0), 0),
      cost_usd: meals.reduce((a, m) => a + (m.cost_usd ?? 0), 0),
    };

    await supabase.from('meal_plans').update({ plan_json: updatedPlanJson }).eq('id', plan_id);

    return json({ plan_json: updatedPlanJson, swapped_meal: newMeal });
  } catch (err) {
    return jsonError(String(err), 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  });
}
function jsonError(msg: string, status: number) { return json({ error: msg }, status); }
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}
