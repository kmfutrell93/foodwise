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

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile) return new Response(JSON.stringify({ error: 'Profile not found' }), { status: 404, headers: corsHeaders });

    const injectionDay = profile.injection_day ?? 'monday';
    const budget = profile.weekly_budget ?? 75;
    const proteinRange = profile.protein_goal_range ?? '100-130g';
    const aversions = (profile.food_aversions ?? []).join(', ') || 'none';
    const appetite = profile.appetite_level ?? 'moderate';
    const medication = profile.medication ?? 'semaglutide';

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

    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1); // Monday
    const weekStartStr = weekStart.toISOString().split('T')[0];

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });

    // Compute escalation context
    const doseStartDate: string | null = profile.dose_start_date ?? null;
    const doseMg: number | null = profile.dose_mg ?? null;
    let daysOnCurrentDose = 0;
    let isEscalationWeek = false;
    let sideEffectRisk: 'high' | 'medium' | 'low' = 'low';
    if (doseStartDate) {
      daysOnCurrentDose = Math.floor((Date.now() - new Date(doseStartDate).getTime()) / 86_400_000);
      const daysUntilEscalation = Math.max(0, 28 - daysOnCurrentDose);
      isEscalationWeek = daysUntilEscalation <= 7;
      if (isEscalationWeek || daysOnCurrentDose <= 7) sideEffectRisk = 'high';
      else if (daysOnCurrentDose <= 14) sideEffectRisk = 'medium';
    }

    // Medication-specific profile
    const MED_PROFILES: Record<string, { drug_class: string; nausea_profile: string; appetite_suppression: string; side_effect_window_hours: number; nausea_foods_to_avoid: string; protein_emphasis: string }> = {
      semaglutide: { drug_class: 'semaglutide', nausea_profile: 'moderate', appetite_suppression: 'strong', side_effect_window_hours: 36, nausea_foods_to_avoid: 'fatty fried foods, spicy dishes, carbonated drinks, alcohol, high-fat dairy', protein_emphasis: 'high' },
      tirzepatide: { drug_class: 'tirzepatide', nausea_profile: 'higher', appetite_suppression: 'very_strong', side_effect_window_hours: 24, nausea_foods_to_avoid: 'fatty fried foods, high-fat dairy, rich sauces, carbonated drinks, alcohol, spicy dishes, large portions of red meat', protein_emphasis: 'critical' },
      liraglutide: { drug_class: 'liraglutide', nausea_profile: 'moderate', appetite_suppression: 'strong', side_effect_window_hours: 12, nausea_foods_to_avoid: 'fatty fried foods, spicy dishes, carbonated drinks, alcohol', protein_emphasis: 'high' },
      other: { drug_class: 'other', nausea_profile: 'moderate', appetite_suppression: 'strong', side_effect_window_hours: 36, nausea_foods_to_avoid: 'fatty fried foods, spicy dishes, carbonated drinks, alcohol', protein_emphasis: 'high' },
    };
    const medProfile = MED_PROFILES[medication] ?? MED_PROFILES.semaglutide;

    const systemPrompt = `You are a registered dietitian specializing in GLP-1 medication nutrition.
Your role is to create personalized 7-day meal plans that:
1. Prioritize soft, easy-to-digest textures on injection day (${injectionDay}) — nausea is common
2. Increase dietary fiber on days 3-5 post-injection to combat constipation
3. Front-load protein in each meal (protein floor: never let a day fall below 80% of target)
4. Honor ALL dietary restrictions with zero exceptions — if a food violates any restriction, it must not appear anywhere in the plan or grocery list
5. Stay within the weekly grocery budget
6. Account for reduced appetite by using protein-dense, high-satiety foods in smaller volumes

MEDICATION PROFILE (${medication}):
Drug class: ${medProfile.drug_class}. Nausea profile: ${medProfile.nausea_profile}.
Appetite suppression: ${medProfile.appetite_suppression}.
Peak side effect window: ${medProfile.side_effect_window_hours} hours post-injection.
Protein emphasis: ${medProfile.protein_emphasis}.
Additional foods to minimise for this medication: ${medProfile.nausea_foods_to_avoid}.

Escalation context: is_escalation_week=${isEscalationWeek}, days_on_current_dose=${daysOnCurrentDose}, side_effect_risk=${sideEffectRisk}.
${isEscalationWeek ? 'IMPORTANT: User is in a dose escalation transition week — maximise soft textures across ALL days, not just injection day.' : ''}

Medication: ${medication}
Injection day: ${injectionDay}
Protein target: ${proteinRange} per day
Weekly grocery budget: $${budget}
Active dietary restrictions: ${restrictionLabels}
Food aversions (also exclude): ${aversions}
Appetite level: ${appetite}

DIETARY RESTRICTION RULES — follow every applicable rule exactly:
${restrictionRules}

Output ONLY valid JSON with no markdown, no prose, no code fences.`;

    const userPrompt = `Generate a complete 7-day meal plan starting Monday ${weekStartStr}.

Return a JSON object with this exact structure:
{
  "days": [
    {
      "day": "Monday",
      "is_injection_day": true/false,
      "total_protein_g": 125,
      "total_calories": 1800,
      "estimated_cost": 12.50,
      "meals": [
        {
          "slot": "Breakfast",
          "name": "Greek Yogurt Parfait with Berries",
          "protein_g": 28,
          "calories": 340,
          "cost": 2.10,
          "note": "Soft texture — ideal for injection day"
        }
      ]
    }
  ],
  "grocery_list": {
    "estimated_total": 68.50,
    "sections": [
      {
        "category": "Proteins",
        "items": [
          {
            "name": "Greek Yogurt (32oz)",
            "quantity": "2",
            "unit": "containers",
            "estimated_cost": 8.99,
            "nova_score": 2
          }
        ]
      }
    ]
  }
}

Rules:
- injection_day = true only for ${injectionDay}
- On injection day: use soft textures (yogurt, eggs, smoothies, soups) — NO tough meats or raw vegetables
- Days 3-5 post-injection: include high-fiber foods (lentils, beans, leafy greens, oats)
- Each day must hit at least ${proteinRange.split('-')[0] ?? '100'}g protein
- Total grocery list must not exceed $${budget}
- NOVA scores: 1=unprocessed whole foods, 2=minimally processed, 3=processed, 4=ultra-processed. Prefer 1-2.
- Include 3 meals + optional snack per day
- All restrictions excluded: ${restrictionLabels}
- All aversions excluded: ${aversions}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const rawText = message.content[0].type === 'text' ? message.content[0].text : '';
    const planData = JSON.parse(rawText);

    const { data: savedPlan, error: saveError } = await supabase
      .from('meal_plans')
      .upsert({
        user_id: user.id,
        week_start: weekStartStr,
        plan_json: { days: planData.days },
        grocery_list: planData.grocery_list,
      }, { onConflict: 'user_id,week_start' })
      .select()
      .single();

    if (saveError) throw saveError;

    // Award first_week_under_budget milestone if cost is under budget
    if (planData.grocery_list?.estimated_total <= budget) {
      await supabase.from('milestones').upsert({
        user_id: user.id,
        milestone_type: 'first_week_under_budget',
      }, { onConflict: 'user_id,milestone_type', ignoreDuplicates: true });
    }

    return new Response(JSON.stringify(savedPlan), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('meal-plans/generate error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
