import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.39.0';

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === 'object' && 'message' in err) return String((err as { message: unknown }).message);
  return 'Internal error';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const body = await req.json();
    const { meal_name, meal_slot, protein_g, calories } = body;

    if (!meal_name) {
      return new Response(JSON.stringify({ error: 'meal_name required' }), { status: 400, headers: corsHeaders });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('medication, injection_day, food_aversions, dietary_restrictions, weekly_budget')
      .eq('id', user.id)
      .single();

    const medication = profile?.medication ?? 'semaglutide';
    const injectionDay = profile?.injection_day ?? null;
    const aversions = (profile?.food_aversions ?? []).join(', ') || 'none';
    const restrictions = (profile?.dietary_restrictions ?? []).join(', ') || 'none';
    const budget = profile?.weekly_budget ?? 75;

    const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const isInjectionDay = injectionDay === todayName;

    const injectionContext = isInjectionDay
      ? 'IMPORTANT: Today is the user\'s GLP-1 injection day. Use very soft textures, gentle preparations (steaming, poaching, slow cooking). Avoid anything overly rich, spicy, or high-fat. Keep portions on the smaller side and easy to digest.'
      : 'Standard GLP-1 guidance: smaller portions (about 60-70% of traditional serving), high protein to protect muscle, adequate fiber for satiety, whole-food ingredients preferred.';

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });

    const prompt = `You are Nori, a GLP-1 nutrition AI coach. Generate a complete, detailed recipe for "${meal_name}" as a ${meal_slot ?? 'meal'}.

User profile:
- Medication: ${medication}
- Injection day: ${injectionDay ?? 'not set'}
- Food aversions — MUST EXCLUDE: ${aversions}
- Dietary restrictions: ${restrictions}
- Weekly budget: $${budget}

GLP-1 context:
${injectionContext}

Macro targets: ~${protein_g ?? 30}g protein, ~${calories ?? 400} calories

Instructions: Write practical, home-cook-friendly steps. Keep portions GLP-1 appropriate. The nori_tip should be 1-2 sentences of personalized advice from Nori's perspective relevant to GLP-1 users (e.g. texture tips on injection day, protein tips, digestion notes).`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1800,
      messages: [{ role: 'user', content: prompt }],
      tools: [{
        name: 'output',
        description: 'Structured output for this function',
        input_schema: {
          type: 'object',
          properties: {
            recipe_name: { type: 'string' },
            ingredients: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  qty: { type: 'string' },
                  unit: { type: 'string' },
                  name: { type: 'string' },
                },
                required: ['qty', 'unit', 'name'],
              },
            },
            instructions: { type: 'array', items: { type: 'string' } },
            prep_time_min: { type: 'number' },
            cook_time_min: { type: 'number' },
            total_time_min: { type: 'number' },
            servings: { type: 'number' },
            protein_g: { type: 'number' },
            calories: { type: 'number' },
            fiber_g: { type: 'number' },
            estimated_cost: { type: 'number' },
            tags: { type: 'array', items: { type: 'string' } },
            injection_day_friendly: { type: 'boolean' },
            nori_tip: { type: 'string' },
          },
          required: [
            'recipe_name', 'ingredients', 'instructions', 'prep_time_min', 'cook_time_min',
            'total_time_min', 'servings', 'protein_g', 'calories', 'fiber_g', 'estimated_cost',
            'tags', 'injection_day_friendly', 'nori_tip',
          ],
        },
      }],
      tool_choice: { type: 'tool', name: 'output' },
    });

    const toolBlock = message.content.find(b => b.type === 'tool_use');
    if (!toolBlock || toolBlock.type !== 'tool_use') {
      throw new Error('No tool_use block in Claude response');
    }
    const recipe = toolBlock.input;

    return new Response(JSON.stringify(recipe), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('recipe-generate error:', errorMessage(err), err);
    return new Response(JSON.stringify({ error: errorMessage(err) }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
