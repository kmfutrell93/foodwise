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

    // Get current week boundaries (Monday–Sunday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const weekStartStr = monday.toISOString().split('T')[0];

    const [logsRes, planRes, profileRes, streakRes] = await Promise.all([
      supabase
        .from('symptom_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('logged_at', monday.toISOString())
        .lte('logged_at', sunday.toISOString()),
      supabase
        .from('meal_plans')
        .select('*')
        .eq('user_id', user.id)
        .gte('week_start', weekStartStr)
        .limit(1)
        .single(),
      supabase
        .from('profiles')
        .select('medication, injection_day, weekly_budget')
        .eq('id', user.id)
        .single(),
      supabase
        .from('streaks')
        .select('current_streak, longest_streak, total_logs')
        .eq('user_id', user.id)
        .single(),
    ]);

    const logs = logsRes.data ?? [];
    const plan = planRes.data;
    const profile = profileRes.data;
    const streak = streakRes.data;

    // Compute averages
    const avgEnergy = logs.length > 0
      ? logs.reduce((sum: number, l: { energy_level: number }) => sum + l.energy_level, 0) / logs.length
      : null;

    const symptomCounts: Record<string, number> = {};
    for (const log of logs) {
      for (const sym of (log.symptoms as string[])) {
        symptomCounts[sym] = (symptomCounts[sym] ?? 0) + 1;
      }
    }

    const topSymptoms = Object.entries(symptomCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([sym, count]) => `${sym} (${count}x)`);

    // Day-by-day detail (incl. notes) so the report can reference specific
    // days/patterns instead of only aggregate counts.
    const dailyBreakdown = logs
      .map((l: { logged_at: string; symptoms: string[]; severity: number; energy_level: number; notes: string | null }) => {
        const day = new Date(l.logged_at).toLocaleDateString('en-US', { weekday: 'short' });
        const symptomsStr = l.symptoms.length > 0 ? l.symptoms.join('/') : 'none';
        return `${day}: ${symptomsStr}, severity ${l.severity}/5, energy ${l.energy_level}/10${l.notes ? `, note: "${l.notes}"` : ''}`;
      })
      .join('\n');

    // Estimate avg protein from plan
    const planDays = plan?.plan_json?.days ?? [];
    const avgProtein = planDays.length > 0
      ? planDays.reduce((sum: number, d: { total_protein_g: number }) => sum + (d.total_protein_g ?? 0), 0) / planDays.length
      : null;

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      system: `You are a GLP-1 nutrition coach writing a brief, encouraging weekly summary. Be specific, warm, and actionable — reference an actual day or note from the log detail below when relevant, not just the aggregate counts. 2-3 sentences max.`,
      messages: [{
        role: 'user',
        content: `Write a weekly insight for this GLP-1 user:

Logs this week: ${logs.length}
Top symptoms: ${topSymptoms.join(', ') || 'none'}
Average energy: ${avgEnergy != null ? avgEnergy.toFixed(1) + '/10' : 'unknown'}
Average protein: ${avgProtein != null ? Math.round(avgProtein) + 'g/day' : 'unknown'}
Protein target: 100-130g/day
Current streak: ${streak?.current_streak ?? 0} days
Medication: ${profile?.medication ?? 'GLP-1'}
Injection day: ${profile?.injection_day ?? 'unknown'}

Day-by-day log detail this week:
${dailyBreakdown || 'No logs this week.'}`
      }],
      tools: [{
        name: 'output',
        description: 'Structured output for this function',
        input_schema: {
          type: 'object',
          properties: {
            insight_text: { type: 'string' },
          },
          required: ['insight_text'],
        },
      }],
      tool_choice: { type: 'tool', name: 'output' },
    });

    const toolBlock = message.content.find(b => b.type === 'tool_use');
    if (!toolBlock || toolBlock.type !== 'tool_use') {
      throw new Error('No tool_use block in Claude response');
    }
    const aiResult = toolBlock.input as { insight_text: string };

    const { data: report } = await supabase
      .from('weekly_reports')
      .upsert({
        user_id: user.id,
        week_start: weekStartStr,
        insight_text: aiResult.insight_text,
        avg_protein_g: avgProtein != null ? Math.round(avgProtein) : null,
        avg_energy: avgEnergy,
        symptom_summary: symptomCounts,
      }, { onConflict: 'user_id,week_start' })
      .select()
      .single();

    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('weekly-report error:', errorMessage(err), err);
    return new Response(
      JSON.stringify({ error: errorMessage(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
