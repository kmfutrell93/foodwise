import { supabase } from '@/lib/supabase';

// Fire-and-forget error logging for real-time visibility into what's
// breaking for real users, without needing them to report it. Never throws
// and never surfaces anything to the user — swallow everything.
export async function logError(screen: string, error: unknown): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const message = error instanceof Error ? error.message : String(error);
    await supabase.from('error_logs').insert({
      user_id: user?.id ?? null,
      screen,
      error_message: message,
    });
  } catch {
    // Logging must never itself cause a visible failure.
  }
}

// profiles.protein_goal_range stores how OFTEN a user hits their protein
// goal ('under25' | '25-50' | '50-75' | '75-100' | '100plus' | 'unsure') —
// it is not a gram target. The clinical protein target for GLP-1 users is
// 100-130g/day regardless of that frequency, so every display and every
// value fed to Claude should show that fixed range, not the raw bucket.
export function formatProteinRange(value: string | null | undefined): string {
  if (!value) return '100–130g / day';
  // Legacy/edge case: if a real numeric range was ever stored directly, show it as-is.
  if (/^\d/.test(value)) return `${value}g / day`;
  return '100–130g / day';
}

export function parseProteinGoal(range: string | null | undefined): number {
  if (!range) return 120;
  // Try to parse a numeric value (e.g. "100-130" → 130, "120" → 120)
  const nums = range.match(/\d+/g);
  if (nums && nums.length > 0) {
    return parseInt(nums[nums.length - 1]!);
  }
  // Frequency bucket values (under25, 25-50, etc.) — use clinical default
  return 120;
}
