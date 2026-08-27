// Single source of truth for onboarding screen order.
// Plan-critical data (restrictions → habit/medication) is collected BEFORE
// first generation so the first plan is medication- and injection-aware.
export const ONBOARDING_SCREEN_ORDER = [
  '01-welcome',
  '02-problem',
  '03-solution',
  '04-aha',
  '05-question1',
  '06-mirror1',
  '07-question2',
  '08-mirror2',
  '08b-apple-health',
  '09-try-intro',
  '10-restrictions',
  '10b-aversions',
  '11-budget',
  '12-appetite',
  '17-habit',          // medication / injection day / dose / check-in — BEFORE generate
  '13-generating',
  '13b-create-account',
  '14-meal-reveal',
  '15-review',
  '16-summary',
  '18-commitment',
  '19-pricing-intro',
  '20-comparison',
  '21-notification',
  '21b-disclosure',
  '22-paywall',
] as const;

export type OnboardingScreenKey = typeof ONBOARDING_SCREEN_ORDER[number];

/** Resume helper — onboarding_step indexes into this list. */
export function getOnboardingScreenAtStep(step: number): OnboardingScreenKey {
  const i = Math.min(Math.max(0, step), ONBOARDING_SCREEN_ORDER.length - 1);
  return ONBOARDING_SCREEN_ORDER[i];
}

const START_PCT = 10;
const END_PCT = 100;

export function getOnboardingProgressPct(screenKey: OnboardingScreenKey): number {
  const index = ONBOARDING_SCREEN_ORDER.indexOf(screenKey);
  const total = ONBOARDING_SCREEN_ORDER.length;
  if (index === -1) return START_PCT;
  return START_PCT + (index / (total - 1)) * (END_PCT - START_PCT);
}
