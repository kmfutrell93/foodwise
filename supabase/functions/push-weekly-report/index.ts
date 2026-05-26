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

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    serviceRoleKey
  );

  // Get all users with push tokens, notifications enabled, and a weekly report this week
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday
  weekStart.setHours(0, 0, 0, 0);

  const { data: profiles } = await admin
    .from('profiles')
    .select('id, push_token, full_name')
    .eq('notifications_enabled', true)
    .not('push_token', 'is', null);

  if (!profiles?.length) return new Response('No recipients', { status: 200 });

  // Only notify users who have a report generated this week
  const { data: reports } = await admin
    .from('weekly_reports')
    .select('user_id')
    .gte('week_start', weekStart.toISOString());

  const reportUserIds = new Set((reports ?? []).map((r: { user_id: string }) => r.user_id));

  const messages = profiles
    .filter(p => reportUserIds.has(p.id))
    .map(p => ({
      to: p.push_token,
      title: 'Your weekly FoodWise report is ready 📊',
      body: `See how your nutrition stacked up this week, ${p.full_name?.split(' ')[0] ?? 'friend'}.`,
      data: { screen: 'progress' },
      sound: 'default',
    }));

  if (!messages.length) return new Response('No reports to notify', { status: 200 });

  await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messages),
  });

  return new Response(JSON.stringify({ sent: messages.length }), { status: 200 });
});
