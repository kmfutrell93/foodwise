/**
 * push-injection-day
 * Scheduled: every day at 7am UTC
 * Sends a push only to users whose injection_day matches today.
 * Set up via pg_cron:
 *   select cron.schedule('injection-day-push', '0 7 * * *', $$
 *     select net.http_post(url := 'https://<project>.supabase.co/functions/v1/push-injection-day',
 *       headers := '{"Authorization": "Bearer <service_role_key>"}'::jsonb) $$);
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

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

  const todayName = DAY_NAMES[new Date().getDay()];

  const { data: profiles } = await admin
    .from('profiles')
    .select('id, push_token, full_name, medication, hydration_reminders_enabled')
    .eq('injection_day', todayName)
    .eq('notifications_enabled', true)
    .not('push_token', 'is', null);

  if (!profiles?.length) return new Response('No injection day users today', { status: 200 });

  const MEDICATION_NAMES: Record<string, string> = {
    semaglutide: 'Ozempic/Wegovy',
    tirzepatide: 'Mounjaro/Zepbound',
    liraglutide: 'Saxenda',
    other: 'your medication',
  };

  // Morning meal push (7am — this run)
  const morningMessages = profiles.map(p => ({
    to: p.push_token,
    title: '💉 Injection day — your plan is ready',
    body: `Today's meals are optimized for ${MEDICATION_NAMES[p.medication ?? ''] ?? 'your medication'} day. Soft textures, easy on the stomach.`,
    data: { screen: 'meal-plan' },
    sound: 'default',
    priority: 'high',
  }));

  await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(morningMessages),
  });

  // Hydration reminders — schedule for later in the day via pg_cron is complex,
  // so we batch all three hydration pushes here with Expo's scheduledTime field
  const hydrationProfiles = profiles.filter(p => p.hydration_reminders_enabled !== false);
  if (hydrationProfiles.length > 0) {
    const now = new Date();
    const noon = new Date(now); noon.setHours(11, 0, 0, 0);
    const afternoon = new Date(now); afternoon.setHours(15, 0, 0, 0);
    const nextMorning = new Date(now); nextMorning.setDate(nextMorning.getDate() + 1); nextMorning.setHours(10, 0, 0, 0);

    const hydrationMessages = [
      ...hydrationProfiles.map(p => ({
        to: p.push_token,
        title: '💧 Drink a glass of water',
        body: 'Hydration cuts nausea on dose day. Have a full glass before lunch.',
        data: { screen: 'home' },
        sound: 'default',
        ...(now < noon ? { scheduledTime: noon.toISOString() } : {}),
      })),
      ...hydrationProfiles.map(p => ({
        to: p.push_token,
        title: '💧 Half-way through dose day',
        body: 'Had enough water? Dehydration makes nausea worse.',
        data: { screen: 'home' },
        sound: 'default',
        ...(now < afternoon ? { scheduledTime: afternoon.toISOString() } : {}),
      })),
      ...hydrationProfiles.map(p => ({
        to: p.push_token,
        title: '💧 Still feeling off?',
        body: 'Keep sipping water — nausea usually peaks 24–48 hours after your injection.',
        data: { screen: 'home' },
        sound: 'default',
        ...(now < nextMorning ? { scheduledTime: nextMorning.toISOString() } : {}),
      })),
    ];

    await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(hydrationMessages),
    });
  }

  return new Response(JSON.stringify({ sent: morningMessages.length, hydration_sent: hydrationProfiles.length * 3, day: todayName }), { status: 200 });
});
