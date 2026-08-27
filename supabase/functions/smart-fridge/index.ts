import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.39.0';

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === 'object' && 'message' in err) return String((err as { message: unknown }).message);
  return 'Internal error';
}

type Meal = {
  name: string;
  protein_g: number;
  cook_time_mins: number;
  injection_day_friendly: boolean;
  instructions: string[];
  ingredients_used: string[];
};

// In-memory cache: cacheKey -> { meals, expiresAt }
const cache = new Map<string, { meals: Meal[]; expiresAt: number }>();

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function getInjectionContext(injectionDay: string): string {
  const today = new Date().getDay();
  const injIdx = DAY_NAMES.indexOf(injectionDay.toLowerCase());
  if (injIdx === -1) return 'Day 3 post-injection';
  let diff = today - injIdx;
  if (diff < 0) diff += 7;
  if (diff === 0) return 'Today is injection day';
  if (diff === 1) return 'Day after injection (nausea may peak)';
  return `Day ${diff} post-injection`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: corsHeaders,
      });
    }

    const body = await req.json() as {
      ingredients: string[];
      medication: string;
      injection_day: string;
      protein_goal: number;
    };

    const { ingredients, medication, injection_day, protein_goal } = body;

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return new Response(JSON.stringify({ error: 'ingredients array required' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const clampedIngredients = ingredients.slice(0, 10);
    const sortedKey = [...clampedIngredients].sort().join(',');
    const cacheKey = `${user.id}:${sortedKey}`;

    const now = Date.now();
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return new Response(JSON.stringify({ meals: cached.meals }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const injection_context = getInjectionContext(injection_day ?? 'monday');

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });

    const systemPrompt = `You are a GLP-1 nutrition expert. Given the user's available ingredients, their medication, injection day, and protein goal, suggest 3 meals they can make right now. Each meal must be GLP-1-appropriate, protein-first, and achievable with ONLY the listed ingredients plus common pantry staples (salt, pepper, olive oil, garlic). If today is injection day or the day after, prioritize soft textures. Return ONLY valid JSON — no markdown, no prose, no code fences.`;

    const userPrompt = `Ingredients: ${clampedIngredients.join(', ')}. Medication: ${medication}. Today relative to injection: ${injection_context}. Protein goal: ${protein_goal}g/day.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
      tools: [{
        name: 'output',
        description: 'Structured output for this function',
        input_schema: {
          type: 'object',
          properties: {
            meals: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  protein_g: { type: 'number' },
                  cook_time_mins: { type: 'number' },
                  injection_day_friendly: { type: 'boolean' },
                  instructions: { type: 'array', items: { type: 'string' } },
                  ingredients_used: { type: 'array', items: { type: 'string' } },
                },
                required: ['name', 'protein_g', 'cook_time_mins', 'injection_day_friendly', 'instructions', 'ingredients_used'],
              },
            },
          },
          required: ['meals'],
        },
      }],
      tool_choice: { type: 'tool', name: 'output' },
    });

    const toolBlock = message.content.find(b => b.type === 'tool_use');
    if (!toolBlock || toolBlock.type !== 'tool_use') {
      throw new Error('No tool_use block in Claude response');
    }
    const meals = (toolBlock.input as { meals: Meal[] }).meals;

    // Cache for 30 minutes
    cache.set(cacheKey, { meals, expiresAt: now + 30 * 60 * 1000 });

    return new Response(JSON.stringify({ meals }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('smart-fridge error:', errorMessage(err), err);
    return new Response(
      JSON.stringify({ error: errorMessage(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
