// Scheduled: every Sunday at 6pm UTC
// Set up in Supabase Dashboard → Edge Functions → Scheduled Functions
// Schedule: 0 18 * * 0
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.36.3';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);
const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders() });

  try {
    // Get all users with notifications enabled
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, push_token, notifications_enabled, medication, injection_day, weekly_budget')
      .eq('notifications_enabled', true)
      .eq('onboarding_completed', true);

    if (!profiles?.length) return json({ processed: 0 });

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const weekOf = weekStart.toISOString().split('T')[0];

    let processed = 0;

    for (const profile of profiles) {
      try {
        await generateAndSaveReport(profile, weekOf);
        processed++;
      } catch (err) {
        console.error(`Failed for user ${profile.id}:`, err);
      }
    }

    return json({ processed });
  } catch (err) {
    return jsonError(String(err), 500);
  }
});

async function generateAndSaveReport(profile: any, weekOf: string) {
  // Gather this week's data
  const [{ data: logs }, { data: streak }, { data: plan }] = await Promise.all([
    supabase.from('symptom_logs').select('*').eq('user_id', profile.id).gte('logged_at', weekOf).order('logged_at'),
    supabase.from('streaks').select('*').eq('user_id', profile.id).single(),
    supabase.from('meal_plans').select('plan_json').eq('user_id', profile.id).eq('is_active', true).order('created_at', { ascending: false }).limit(1).single(),
  ]);

  const avgNausea = logs?.length ? logs.reduce((a: number, l: any) => a + (l.nausea ?? 0), 0) / logs.length : 0;
  const avgFatigue = logs?.length ? logs.reduce((a: number, l: any) => a + (l.fatigue ?? 0), 0) / logs.length : 0;
  const totalCost = plan?.plan_json?.weekly_total?.cost_usd ?? 0;
  const underBudget = totalCost <= (profile.weekly_budget ?? 75);

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 256,
    system: 'You write warm, encouraging 3-sentence weekly progress summaries for GLP-1 medication users. Be specific, use data, be motivating.',
    messages: [{
      role: 'user',
      content: `Write a 3-sentence weekly summary for a ${profile.medication ?? 'GLP-1'} user:
- Check-ins logged: ${logs?.length ?? 0}
- Avg nausea this week: ${avgNausea.toFixed(1)}/5
- Avg fatigue: ${avgFatigue.toFixed(1)}/5
- Current check-in streak: ${streak?.checkin_streak ?? 0} days
- Grocery cost: $${totalCost.toFixed(2)} ${underBudget ? '(under budget! 🎉)' : '(over budget)'}
- Protein streak: ${streak?.protein_streak ?? 0} days

Start with their biggest win, mention an area to watch, end with encouragement.`,
    }],
  });

  const summary = message.content[0].type === 'text' ? message.content[0].text.trim() : '';

  // Save report
  await supabase.from('weekly_reports').upsert(
    { user_id: profile.id, week_of: weekOf, summary },
    { onConflict: 'user_id,week_of' }
  );

  // Send push notification (Expo push service — no Apple account needed for development)
  if (profile.push_token) {
    await sendPush(profile.push_token, '📬 Your weekly progress report is ready', summary.split('.')[0] + '.');
  }
}

async function sendPush(token: string, title: string, body: string) {
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: token, title, body, sound: 'default' }),
  });
}

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
