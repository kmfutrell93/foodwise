import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

// HealthKit integration — iOS only. No-ops on Android.
// Library: @kingstinct/react-native-healthkit (add to dependencies when enabling)

 
let Healthkit: any = null;

if (Platform.OS === 'ios') {
  try {
    // @ts-ignore — optional native dep, not installed until HealthKit is enabled
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Healthkit = require('@kingstinct/react-native-healthkit').default;
  } catch {
    // library not installed — all functions are no-ops
  }
}

const WEIGHT_TYPE = 'HKQuantityTypeIdentifierBodyMass';
const STEPS_TYPE = 'HKQuantityTypeIdentifierStepCount';
const PROTEIN_TYPE = 'HKQuantityTypeIdentifierDietaryProtein';

export async function requestHealthPermissions(): Promise<boolean> {
  if (!Healthkit) return false;
  try {
    await Healthkit.requestAuthorization(
      [WEIGHT_TYPE, STEPS_TYPE, PROTEIN_TYPE],
      [PROTEIN_TYPE],
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await supabase.from('profiles').update({ health_connected: true }).eq('id', user.id);
    return true;
  } catch {
    return false;
  }
}

export async function syncWeightFromHealth(): Promise<void> {
  if (!Healthkit) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase.from('profiles').select('health_connected').eq('id', user.id).single();
    if (!profile?.health_connected) return;

    const since = new Date();
    since.setDate(since.getDate() - 7);

    const samples = await Healthkit.queryQuantitySamples(WEIGHT_TYPE, {
      from: since,
      to: new Date(),
      ascending: true,
    });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    for (const s of samples) {
      const weightLbs = s.quantity * 2.20462; // kg → lbs
      const loggedDate = new Date(s.startDate).toISOString().split('T')[0];
      await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/weight-logs`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ weight_lbs: parseFloat(weightLbs.toFixed(1)), logged_date: loggedDate, source: 'apple_health' }),
        }
      );
    }
  } catch {
    // silent — non-critical background sync
  }
}

export async function syncStepsFromHealth(): Promise<number | null> {
  if (!Healthkit) return null;
  try {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const samples = await Healthkit.queryQuantitySamples(STEPS_TYPE, {
      from: start,
      to: today,
    });

    const totalSteps = samples.reduce((sum: number, s: { quantity: number }) => sum + s.quantity, 0);
    return Math.round(totalSteps);
  } catch {
    return null;
  }
}

export async function writeProteinToHealth(grams: number): Promise<void> {
  if (!Healthkit) return;
  try {
    await Healthkit.saveQuantitySample(PROTEIN_TYPE, 'g', grams, {
      start: new Date(),
      end: new Date(),
    });
  } catch {
    // silent
  }
}
