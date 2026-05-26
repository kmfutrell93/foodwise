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
    const { user_id } = await req.json();

    const [{ data: logs }, { data: profile }] = await Promise.all([
      supabase.from('symptom_logs').select('*').eq('user_id', user_id).order('logged_at', { ascending: false }).limit(7),
      supabase.from('profiles').select('medication,injection_day,dietary_restrictions,appetite_level').eq('id', user_id).single(),
    ]);

    if (!logs || logs.length < 7) {
      return json({ error: 'Insufficient data — need 7 days of logs', days_needed: 7 - (logs?.length ?? 0) });
    }

    const logSummary = logs.map((l: any) => ({
      date: l.logged_at.split('T')[0],
      nausea: l.nausea,
      constipation: l.constipation,
      fatigue: l.fatigue,
      aversions: l.food_aversions,
      notes: l.notes,
    }));

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: `You are a GLP-1 dietitian analyzing 7 days of symptom data to suggest one specific, actionable meal adjustment. Be warm and direct. Focus on the most impactful change.`,
      messages: [{
        role: 'user',
        content: `Analyze these 7 days of symptom logs for a ${profile?.medication ?? 'GLP-1'} user and suggest one specific meal adjustment.

Logs:
${JSON.stringify(logSummary, null, 2)}

User context:
- Injection day: ${profile?.injection_day ?? 'unknown'}
- Dietary restrictions: ${profile?.dietary_restrictions?.join(', ') || 'none'}
- Appetite level: ${profile?.appetite_level ?? 'moderate'}

Return ONLY this JSON:
{
  "adjustment": "One specific meal change (1-2 sentences, actionable)",
  "reason": "Why this helps based on their symptom pattern (1 sentence)"
}`,
      }],
    });

    const rawText = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return jsonError('Failed to generate insight', 500);

    const insight = JSON.parse(jsonMatch[0]);

    // Award first_insight milestone if this is their first
    await supabase.from('milestones').upsert(
      { user_id, type: 'first_insight' },
      { onConflict: 'user_id,type', ignoreDuplicates: true }
    );

    return json(insight);
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
