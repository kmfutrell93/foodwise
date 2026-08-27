/**
 * push-weekly-report
 * Scheduled: every Sunday at 6pm UTC (adjust for your target timezone)
 * Set up in Supabase Dashboard → Edge Functions → Schedule, or via pg_cron:
 *   select cron.schedule('weekly-report-push', '0 18 * * 0', $$
 *     select net.http_post(url := 'https://<project>.supabase.co/functions/v1/push-weekly-report',
 *       headers := '{"Authorization": "Bearer <service_role_key>"}'::jsonb) $$);
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

Deno.serve(async (req) => {
  // Only callable by pg_cron with service role key — reject everything else
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const auth = req.headers.get('Authorization') ?? '';
  if (auth !== `Bearer ${serviceRoleKey}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    serviceRoleKey
  );

  const { data: profiles } = await admin
    .from('profiles')
    .select('id, push_token, full_name')
    .eq('notifications_enabled', true)
    .not('push_token', 'is', null);

  if (!profiles?.length) return new Response('No recipients', { status: 200 });

  // weekly_reports.week_start is always a Monday (see weekly-report/index.ts),
  // not the calendar week-start used here previously — querying by a computed
  // Sunday boundary never matched any row. Instead, look up each user's most
  // recent report directly and just check it's fresh (generated in the last
  // 7 days), which is robust regardless of how week_start is anchored.
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const userIds = profiles.map(p => p.id);
  const { data: reports } = await admin
    .from('weekly_reports')
    .select('user_id, week_start, insight_text')
    .in('user_id', userIds)
    .gte('week_start', sevenDaysAgo)
    .order('week_start', { ascending: false });

  // Keep only the most recent report per user.
  const latestReportByUser = new Map<string, { insight_text: string }>();
  for (const r of reports ?? []) {
    if (!latestReportByUser.has(r.user_id)) latestReportByUser.set(r.user_id, r);
  }

  function firstSentence(text: string | null): string | null {
    if (!text) return null;
    const match = text.match(/^[^.!?]*[.!?]/);
    return (match ? match[0] : text).trim();
  }

  const messages = profiles
    .filter(p => latestReportByUser.has(p.id))
    .map(p => {
      const report = latestReportByUser.get(p.id)!;
      const highlight = firstSentence(report.insight_text);
      return {
        to: p.push_token,
        title: 'Your weekly FoodWise report is ready 📊',
        body: highlight ?? `See how your nutrition stacked up this week, ${p.full_name?.split(' ')[0] ?? 'friend'}.`,
        data: { screen: 'progress' },
        sound: 'default',
      };
    });

  if (!messages.length) return new Response('No reports to notify', { status: 200 });

  await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messages),
  });

  return new Response(JSON.stringify({ sent: messages.length }), { status: 200 });
  } catch (err) {
    console.error('push-weekly-report error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }), { status: 500 });
  }
});
