// push-reengagement
// Scheduled: every 6 hours (checks for users who haven't logged in 48hrs)
// Max one nudge per user per 72hrs — tracked via last_nudge_sent_at on profiles.
// Set up via pg_cron:
//   select cron.schedule('reengagement-push', '0 */6 * * *', $$
//     select net.http_post(url := 'https://<project>.supabase.co/functions/v1/push-reengagement',
//       headers := '{"Authorization": "Bearer <service_role_key>"}'::jsonb) $$);
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

  const now = new Date();
  const cutoff48h = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();
  const cutoff72h = new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString();

  // Users who: have push tokens, have notifications on, haven't logged in 48h,
  // and haven't received a nudge in the past 72h
  const { data: streaks } = await admin
    .from('streaks')
    .select('user_id, last_logged_at')
    .or(`last_logged_at.lt.${cutoff48h},last_logged_at.is.null`);

  if (!streaks?.length) return new Response('No inactive users', { status: 200 });

  const userIds = streaks.map((s: { user_id: string }) => s.user_id);

  const { data: allProfiles } = await admin
    .from('profiles')
    .select('id, push_token, full_name, last_nudge_sent_at, check_in_time')
    .in('id', userIds)
    .eq('notifications_enabled', true)
    .not('push_token', 'is', null)
    .or(`last_nudge_sent_at.lt.${cutoff72h},last_nudge_sent_at.is.null`);

  if (!allProfiles?.length) return new Response('No eligible users', { status: 200 });

  // No real per-user timezone is stored — check_in_time is a rough US-Eastern-
  // anchored bucket. Only fire for users whose bucket roughly matches the
  // current UTC hour, so a 6-hourly cron doesn't wake someone at 3am.
  // Users with no preference set are never excluded by this filter.
  const CHECK_IN_UTC_HOURS: Record<string, number[]> = {
    morning: [11, 12, 13, 14, 15],   // ~7-11am ET
    midday: [16, 17, 18, 19, 20],    // ~11am-3pm ET
    evening: [21, 22, 23, 0, 1, 2],  // ~4pm-9pm ET (wraps midnight UTC)
  };
  const currentUtcHour = now.getUTCHours();
  const profiles = allProfiles.filter(p =>
    !p.check_in_time || (CHECK_IN_UTC_HOURS[p.check_in_time] ?? []).includes(currentUtcHour)
  );

  if (!profiles.length) return new Response('No eligible users in this time window', { status: 200 });

  const MESSAGES = [
    { title: 'How are you feeling today? 🌿', body: "Log your symptoms — Nori's waiting to spot any patterns." },
    { title: 'Missing your streak ⚡', body: "It's been a couple days. Log today to keep your momentum going." },
    { title: 'Quick check-in? 🍽️', body: 'A 30-second log today helps Nori make better meal suggestions.' },
  ];

  const messages = profiles.map((p, i) => {
    const msg = MESSAGES[i % MESSAGES.length];
    return {
      to: p.push_token,
      title: msg.title,
      body: msg.body,
      data: { screen: 'symptom-tracker' },
      sound: 'default',
    };
  });

  await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messages),
  });

  // Update last_nudge_sent_at for all notified users
  const notifiedIds = profiles.map(p => p.id);
  await admin
    .from('profiles')
    .update({ last_nudge_sent_at: now.toISOString() })
    .in('id', notifiedIds);

  return new Response(JSON.stringify({ sent: messages.length }), { status: 200 });
  } catch (err) {
    console.error('push-reengagement error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }), { status: 500 });
  }
});
