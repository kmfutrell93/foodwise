import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.39.0';

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });

// Simple in-memory cache: user_id → { data, expires_at }
const cache = new Map<string, { data: unknown; expires_at: number }>();

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

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

    // 2-hour cache per user
    const cached = cache.get(user.id);
    if (cached && cached.expires_at > Date.now()) {
      return new Response(JSON.stringify(cached.data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: profile } = await supabase.from('profiles').select('medication, food_aversions, protein_goal_range').eq('id', user.id).single();
    const { data: latestLog } = await supabase.from('symptom_logs').select('*').eq('user_id', user.id).order('logged_at', { ascending: false }).limit(1).single();

    const medication = profile?.medication ?? 'semaglutide';
    const aversions = (profile?.food_aversions ?? []).join(', ') || 'none';
    const proteinGoal = profile?.protein_goal_range ?? '100-130g';

    // Map symptom_logs structure to nausea/constipation/fatigue scores
    const symptoms: string[] = latestLog?.symptoms ?? [];
    const severity: number = latestLog?.severity ?? 0;
    const energyLevel: number = latestLog?.energy_level ?? 5;

    const nauseaScore = symptoms.includes('nausea') ? severity : 0;
    const constipationScore = symptoms.includes('constipation') ? severity : 0;
    const fatigueScore = Math.round((10 - energyLevel) / 2); // invert energy to fatigue 1-5

    let mode: 'nausea' | 'constipation' | 'gentle';
    if (nauseaScore >= 3) mode = 'nausea';
    else if (constipationScore >= 3 && nauseaScore < 3) mode = 'constipation';
    else mode = 'gentle';

    const systemPrompt = `You are a registered dietitian specialising in GLP-1 medication nutrition.
The user is on ${medication} and is currently experiencing:
nausea: ${nauseaScore}/5, constipation: ${constipationScore}/5, fatigue: ${fatigueScore}/5.
Their food aversions are: ${aversions}.
Mode: ${mode}.
Return exactly 5 foods or simple meals they can eat RIGHT NOW.
Rules: soft textures only if nausea >= 3. High-fibre if mode=constipation.
Exclude all food_aversions. Each item: name, one-line why it helps, prep time.
Return JSON: { "items": [{"name": string, "reason": string, "prep_mins": number}] }`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      messages: [{ role: 'user', content: 'Give me 5 foods I can eat right now.' }],
      system: systemPrompt,
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text : '{}';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { items: [] };

    const result = { ...parsed, mode, nausea_score: nauseaScore, medication };

    // Cache for 2 hours
    cache.set(user.id, { data: result, expires_at: Date.now() + 2 * 60 * 60 * 1000 });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('emergency-meal error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: corsHeaders });
  }
});
