import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.36.3';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders() });
  }

  try {
    const { user_id } = await req.json();

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single();

    if (profileError || !profile) {
      return jsonError('Profile not found', 404);
    }

    // Build week starting from Monday
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
    monday.setHours(0, 0, 0, 0);

    const weekDates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });

    const injectionDay = profile.injection_day;
    const proteinGoalG = proteinGoalFromRange(profile.protein_goal_range);

    const systemPrompt = buildSystemPrompt(profile, proteinGoalG);
    const userPrompt = buildUserPrompt(weekDates, injectionDay, profile, proteinGoalG);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const rawText = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return jsonError('Failed to parse meal plan from AI', 500);

    const planJson = JSON.parse(jsonMatch[0]);

    // Deactivate old plans
    await supabase
      .from('meal_plans')
      .update({ is_active: false })
      .eq('user_id', user_id)
      .eq('is_active', true);

    // Insert new plan
    const { data: newPlan, error: insertError } = await supabase
      .from('meal_plans')
      .insert({
        user_id,
        week_start: monday.toISOString().split('T')[0],
        plan_json: planJson,
        is_active: true,
      })
      .select()
      .single();

    if (insertError) return jsonError('Failed to save meal plan', 500);

    // Increment meal_plans_generated counter
    await supabase
      .from('profiles')
      .update({ meal_plans_generated: (profile.meal_plans_generated ?? 0) + 1 })
      .eq('id', user_id);

    // Update plan streak
    await incrementStreak(user_id, 'plan');

    // Check milestones
    await checkMilestones(user_id, profile.meal_plans_generated ?? 0);

    return json({ plan: newPlan });
  } catch (err) {
    return jsonError(String(err), 500);
  }
});

function buildSystemPrompt(profile: any, proteinGoalG: number): string {
  return `You are a registered dietitian specializing in GLP-1 medication users (Ozempic, Wegovy, Mounjaro, Zepbound).

Your role is to create 7-day meal plans that:
1. Hit the user's daily protein target of ${proteinGoalG}g even on low-appetite days
2. Use soft, easy-to-digest textures on injection days (patient may experience nausea)
3. Emphasize high-fiber foods on days 3-5 post-injection to manage GI symptoms
4. Respect all dietary restrictions without exception
5. Stay within the weekly grocery budget of $${profile.weekly_budget}
6. Account for the user's current appetite level: ${profile.appetite_level ?? 'moderate'}
7. Exclude any food aversions: ${profile.food_aversions?.join(', ') || 'none reported'}

Always return valid JSON matching the exact schema provided. No markdown, no explanations — pure JSON only.`;
}

function buildUserPrompt(dates: Date[], injectionDay: number | null, profile: any, proteinGoalG: number): string {
  const days = dates.map((d, i) => {
    const dow = d.getDay();
    const isInjection = injectionDay === dow;
    const isDay3To5PostInjection = injectionDay !== null && ((dow - injectionDay + 7) % 7) >= 3 && ((dow - injectionDay + 7) % 7) <= 5;

    return {
      day: DAY_NAMES[dow],
      date: d.toISOString().split('T')[0],
      is_injection_day: isInjection,
      notes: isInjection
        ? 'INJECTION DAY: Use very soft textures. Small portions. Avoid strong smells. Prioritize protein shakes, scrambled eggs, yogurt, pureed soups.'
        : isDay3To5PostInjection
          ? 'POST-INJECTION FIBER WINDOW: Emphasize high-fiber foods to manage GI motility. Include oats, beans, vegetables.'
          : '',
    };
  });

  const schema = `{
  "days": [
    {
      "day": "Monday",
      "date": "YYYY-MM-DD",
      "is_injection_day": false,
      "meals": {
        "breakfast": {
          "name": "string",
          "description": "string (2 sentences max)",
          "protein_g": number,
          "calories": number,
          "cost_usd": number,
          "prep_minutes": number,
          "texture": "soft|normal|crunchy",
          "ingredients": ["string"]
        },
        "lunch": { /* same */ },
        "dinner": { /* same */ },
        "snack": { /* same — optional but include for high protein days */ }
      },
      "totals": {
        "protein_g": number,
        "calories": number,
        "cost_usd": number
      }
    }
  ],
  "weekly_total": {
    "protein_g": number,
    "calories": number,
    "cost_usd": number
  },
  "grocery_list": {
    "sections": [
      {
        "section": "proteins|produce|dairy|pantry",
        "items": [
          {
            "name": "string",
            "quantity": "string (e.g. '2 lbs', '1 dozen')",
            "cost_usd": number,
            "nova_score": 1|2|3|4,
            "cheaper_alternative": "string or null"
          }
        ]
      }
    ],
    "total_cost": number,
    "budget": ${profile.weekly_budget}
  }
}`;

  return `Create a 7-day meal plan for this user:
- Medication: ${profile.medication ?? 'GLP-1'}
- Injection day: ${injectionDay !== null ? DAY_NAMES[injectionDay] : 'unknown'}
- Dietary restrictions: ${profile.dietary_restrictions?.join(', ') || 'none'}
- Weekly budget: $${profile.weekly_budget}
- Appetite level: ${profile.appetite_level ?? 'moderate'}
- Daily protein target: ${proteinGoalG}g
- Food aversions: ${profile.food_aversions?.join(', ') || 'none'}

Week schedule:
${days.map(d => `${d.day} (${d.date})${d.is_injection_day ? ' — INJECTION DAY' : ''}${d.notes ? '\n  Note: ' + d.notes : ''}`).join('\n')}

Return ONLY this JSON schema, filled in completely:
${schema}`;
}

function proteinGoalFromRange(range: string | null): number {
  const map: Record<string, number> = {
    under25: 60, '25-50': 80, '50-75': 100, '75-100': 120, '100plus': 140, unsure: 100,
  };
  return map[range ?? 'unsure'] ?? 100;
}

async function incrementStreak(userId: string, type: 'protein' | 'checkin' | 'plan') {
  const col = `${type}_streak`;
  const lastCol = `last_${type === 'checkin' ? 'checkin' : type === 'plan' ? 'plan_generated' : 'protein_log'}`;

  const { data } = await supabase.from('streaks').select('*').eq('user_id', userId).single();
  if (!data) return;

  const last = data[lastCol] ? new Date(data[lastCol]) : null;
  const now = new Date();
  const hoursSinceLast = last ? (now.getTime() - last.getTime()) / (1000 * 60 * 60) : Infinity;

  let newStreak = data[col] ?? 0;
  if (hoursSinceLast > 48) {
    newStreak = 1; // reset
  } else if (hoursSinceLast >= 20) {
    newStreak += 1; // increment (allow 20h window for daily streaks)
  }

  await supabase.from('streaks').update({ [col]: newStreak, [lastCol]: now.toISOString() }).eq('user_id', userId);
}

async function checkMilestones(userId: string, prevCount: number) {
  const { data: streak } = await supabase.from('streaks').select('plan_streak').eq('user_id', userId).single();
  const planStreak = streak?.plan_streak ?? 0;

  const toCheck: Array<[string, boolean]> = [
    ['plan_streak_7', planStreak >= 7],
  ];

  for (const [type, earned] of toCheck) {
    if (earned) {
      await supabase.from('milestones').upsert({ user_id: userId, type }, { onConflict: 'user_id,type' });
    }
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  });
}

function jsonError(message: string, status: number) {
  return json({ error: message }, status);
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}
