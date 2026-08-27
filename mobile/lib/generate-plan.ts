import { supabase, MealPlan } from '@/lib/supabase';

const POLL_INTERVAL_MS = 4000;
const MAX_ATTEMPTS = 22; // ~88s after first wait ≈ 90s total

export type GeneratePlanResult =
  | { success: true; plan: MealPlan }
  | { success: false; error: string };

/**
 * LTE-resilient meal plan generation.
 * Fires meal-plans-generate without aborting (server keeps working), then polls
 * meal_plans for generation_status ready/failed via short DB reads.
 *
 * Polls on updated_at (not created_at) because same-week upserts keep created_at.
 */
export async function generatePlanWithPolling(
  onStatus?: (msg: string) => void,
): Promise<GeneratePlanResult> {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    return { success: false, error: 'Missing Supabase URL' };
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return { success: false, error: 'Not signed in' };
  }

  const userId = session.user.id;
  // Slightly in the past so the first DB write can't land before startTime.
  const startTime = new Date(Date.now() - 2000).toISOString();

  onStatus?.('Starting your plan…');

  const url = `${supabaseUrl}/functions/v1/meal-plans-generate`;
  console.log('[gen] fire', { url, userId, startTime, hasToken: !!session.access_token });

  // Fire-and-forget: do NOT abort. Aborting can cancel the edge function.
  // Client connection may drop on LTE — polling is the source of truth.
  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
    },
    body: JSON.stringify({}),
  }).catch((e) => {
    console.log('[gen] fire fetch error (ok if polling continues):', e?.message ?? e);
  });

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    onStatus?.(`Building your plan… (${(i + 1) * 4}s)`);

    try {
      const { data, error } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('user_id', userId)
        .gte('updated_at', startTime)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      console.log('[gen] poll attempt', i, 'found:', !!data, 'status:', data?.generation_status, 'err:', error?.message);

      if (error) {
        continue;
      }

      if (!data) continue;

      if (data.generation_status === 'ready') {
        const days = data.plan_json?.days;
        if (Array.isArray(days) && days.length > 0) {
          console.log('[gen] ready', { planId: data.id, days: days.length });
          return { success: true, plan: data as MealPlan };
        }
        // Ready but empty — treat as still in progress / bad write
        continue;
      }

      if (data.generation_status === 'failed') {
        console.log('[gen] failed status from server');
        return { success: false, error: 'Generation failed — please try again.' };
      }

      // still 'generating'
    } catch (e) {
      console.log('[gen] poll exception:', e);
    }
  }

  return {
    success: false,
    error: 'Generation is taking longer than expected. Please try again.',
  };
}
