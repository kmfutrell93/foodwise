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
      .select('medication, injection_day')
      .eq('id', user.id)
      .single();

    const logSummary = logs.map(l => ({
      date: l.logged_at.split('T')[0],
      symptoms: l.symptoms,
      severity: l.severity,
      energy: l.energy_level,
      notes: l.notes,
    }));
    console.log('[symptoms-insights] logs:', logs.length, 'user:', user.id);

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: `You are a GLP-1 nutrition coach analyzing symptom patterns to give actionable dietary advice.
Medication: ${profile?.medication ?? 'GLP-1'}
Injection day: ${profile?.injection_day ?? 'unknown'}
Protein target: 100-130g/day

Keep insights concise, warm, and specific. Reference actual dates and patterns you see. Always end with 1-2 concrete food adjustments.`,
      messages: [{
        role: 'user',
        // logSummary MUST be included — previously omitted, so Claude had no data.
        content: `Analyze these ${logs.length} symptom logs from the past 14 days and give me a personalized insight.\n\nLogs (JSON):\n${JSON.stringify(logSummary)}`,
      }],
      tools: [{
        name: 'output',
        description: 'Structured output for this function',
        input_schema: {
          type: 'object',
          properties: {
            insight: { type: 'string', description: '2-3 sentence personalized insight about patterns you see' },
            recommendation: { type: 'string', description: '1-2 specific food adjustments to try this week' },
            severity_trend: { type: 'string', enum: ['improving', 'stable', 'worsening'] },
            energy_trend: { type: 'string', enum: ['improving', 'stable', 'worsening'] },
          },
          required: ['insight', 'recommendation', 'severity_trend', 'energy_trend'],
        },
      }],
      tool_choice: { type: 'tool', name: 'output' },
    });

    const toolBlock = message.content.find(b => b.type === 'tool_use');
    if (!toolBlock || toolBlock.type !== 'tool_use') {
      throw new Error('No tool_use block in Claude response');
    }
    const result = toolBlock.input as { insight: string; recommendation: string; severity_trend: string; energy_trend: string };
    console.log('[symptoms-insights] Claude ok, recommendation length:', result.recommendation?.length ?? 0);

    // Award first_insight milestone
    await supabase.from('milestones').upsert({
      user_id: user.id,
      milestone_type: 'first_insight',
    }, { onConflict: 'user_id,milestone_type', ignoreDuplicates: true });

    // Persist the recommendation so the next meal plan generation can apply it.
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({
        latest_symptom_recommendation: result.recommendation,
        latest_symptom_insight_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (profileUpdateError) {
      console.error('[symptoms-insights] FAILED to write recommendation:', profileUpdateError.message);
      throw new Error(`Failed to save recommendation: ${profileUpdateError.message}`);
    }
    console.log('[symptoms-insights] wrote latest_symptom_recommendation for', user.id);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('symptoms/insights error:', errorMessage(err), err);
    return new Response(
      JSON.stringify({ error: errorMessage(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
