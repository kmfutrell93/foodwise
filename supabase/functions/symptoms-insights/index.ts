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

    // Get last 14 days of symptom logs
    const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const { data: logs } = await supabase
      .from('symptom_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('logged_at', since)
      .order('logged_at', { ascending: true });

    if (!logs || logs.length === 0) {
      return new Response(
        JSON.stringify({ insight: 'Log more symptoms to receive personalized insights.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('medication, injection_day, protein_goal_range')
      .eq('id', user.id)
      .single();

    const logSummary = logs.map(l => ({
      date: l.logged_at.split('T')[0],
      symptoms: l.symptoms,
      severity: l.severity,
      energy: l.energy_level,
      notes: l.notes,
    }));

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: `You are a GLP-1 nutrition coach analyzing symptom patterns to give actionable dietary advice.
Medication: ${profile?.medication ?? 'GLP-1'}
Injection day: ${profile?.injection_day ?? 'unknown'}
Protein target: ${profile?.protein_goal_range ?? 'unknown'}

Keep insights concise, warm, and specific. Reference actual dates and patterns you see. Always end with 1-2 concrete food adjustments.`,
      messages: [{
        role: 'user',
        content: `Analyze these ${logs.length} symptom logs from the past 14 days and give me a personalized insight:

${JSON.stringify(logSummary, null, 2)}

Return JSON only:
{
  "insight": "2-3 sentence personalized insight about patterns you see",
  "recommendation": "1-2 specific food adjustments to try this week",
  "severity_trend": "improving|stable|worsening",
  "energy_trend": "improving|stable|worsening"
}`
      }],
    });

    const rawText = message.content[0].type === 'text' ? message.content[0].text : '{}';
    const result = JSON.parse(rawText);

    // Award first_insight milestone
    await supabase.from('milestones').upsert({
      user_id: user.id,
      milestone_type: 'first_insight',
    }, { onConflict: 'user_id,milestone_type', ignoreDuplicates: true });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('symptoms/insights error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
