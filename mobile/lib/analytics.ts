import { Mixpanel } from 'mixpanel-react-native';

const TOKEN = 'df078b22c885c0e329c6f5ba3e9e2d83';

const mixpanel = new Mixpanel(TOKEN, /* trackAutomaticEvents */ true);

export async function initAnalytics(userId: string) {
  await mixpanel.init();
  mixpanel.identify(userId);
}

export function setAnalyticsUserProps(props: Record<string, unknown>) {
  mixpanel.getPeople().set(props);
}

export function resetAnalytics() {
  mixpanel.reset();
}

// ─── Acquisition ────────────────────────────────────────────────────────────

export function trackOnboardingStarted() {
  mixpanel.track('onboarding_started');
}

export function trackOnboardingStepCompleted(step: number, screenName: string) {
  mixpanel.track('onboarding_step_completed', { step, screen_name: screenName });
}

export function trackOnboardingCompleted(props: {
  medication: string;
  injection_day: string;
  has_dietary_restrictions: boolean;
  weekly_budget: number | null;
}) {
  mixpanel.track('onboarding_completed', props);
  mixpanel.getPeople().set({
    medication: props.medication,
    injection_day: props.injection_day,
    weekly_budget: props.weekly_budget,
    onboarding_completed_at: new Date().toISOString(),
  });
}

export function trackFirstMealGenerated() {
  mixpanel.track('first_meal_generated');
}

export function trackAppOpened(source?: string) {
  mixpanel.track('app_opened', source ? { source } : {});
}

// ─── Feature ─────────────────────────────────────────────────────────────────

export function trackMealViewed(props: { slot: string; meal_name: string; day: string }) {
  mixpanel.track('meal_viewed', props);
}

export function trackMealSwapped(props: { slot: string; day: string }) {
  mixpanel.track('meal_swapped', props);
}

export function trackSymptomLogged(props: {
  symptoms: string[];
  severity: number;
  energy_level: number;
  has_notes: boolean;
}) {
  mixpanel.track('symptom_logged', props);
}

export function trackInsightViewed(source: 'symptom_tracker' | 'progress') {
  mixpanel.track('insight_viewed', { source });
}

export function trackGroceryListOpened() {
  mixpanel.track('grocery_list_opened');
}

export function trackProgressScreenViewed() {
  mixpanel.track('progress_screen_viewed');
}

// ─── Accountability ──────────────────────────────────────────────────────────

export function trackStreakIncremented(props: { current_streak: number }) {
  mixpanel.track('streak_incremented', props);
}

export function trackStreakBroken(props: { streak_lost: number }) {
  mixpanel.track('streak_broken', props);
}

export function trackMilestoneAchieved(props: { milestone_type: string }) {
  mixpanel.track('milestone_achieved', props);
}

export function trackWeeklyReportOpened() {
  mixpanel.track('weekly_report_opened');
}

export function trackInjectionDayPackageOpened() {
  mixpanel.track('injection_day_package_opened');
}

export function trackReengagementNudgeSent() {
  mixpanel.track('reengagement_nudge_sent');
}

export function trackReengagementNudgeConverted() {
  mixpanel.track('reengagement_nudge_converted');
}

export function trackCheckInCompleted(props: { energy_level: number; severity: number }) {
  mixpanel.track('check_in_completed', props);
}

// ─── Monetization ────────────────────────────────────────────────────────────

export function trackPaywallShown(
  trigger: 'onboarding' | 'meal_generation' | 'symptom_insights' | 'grocery_list',
  extra?: { testimonials_visible?: boolean; testimonial_count?: number },
) {
  mixpanel.track('paywall_shown', { trigger, ...extra });
}

export function trackTrialStarted(props: { product_id: string; plan: 'monthly' | 'yearly' | 'lifetime' }) {
  mixpanel.track('trial_started', props);
  mixpanel.getPeople().set({ plan: props.plan, trial_started_at: new Date().toISOString() });
}

export function trackSubscriptionConverted(props: { product_id: string; plan: 'monthly' | 'yearly' | 'lifetime'; revenue: number }) {
  mixpanel.track('subscription_converted', props);
  mixpanel.getPeople().set({ plan: props.plan, converted_at: new Date().toISOString() });
}

export function trackSubscriptionCancelled(props: { plan: 'monthly' | 'yearly' | 'lifetime' }) {
  mixpanel.track('subscription_cancelled', props);
  mixpanel.getPeople().set({ plan: 'free', cancelled_at: new Date().toISOString() });
}

// ─── Weight & Progress ───────────────────────────────────────────────────────

export function trackWeightLogged(props: { source: 'manual' | 'apple_health'; weight_lbs?: number; has_note?: boolean }) {
  mixpanel.track('weight_logged', props);
}

export function trackWeightChartViewed(props?: { data_points_count: number; has_trend_badge: boolean }) {
  mixpanel.track('weight_chart_viewed', props ?? {});
}

// ─── Grocery ──────────────────────────────────────────────────────────────────

export function trackGroceryListRefreshed() {
  mixpanel.track('grocery_list_refreshed');
}

// ─── Recipes ──────────────────────────────────────────────────────────────────

export function trackRecipeListViewed() {
  mixpanel.track('recipe_list_viewed');
}

export function trackRecipeViewed(props: { recipe_id: string; recipe_name: string; meal_type: string; source?: string }) {
  mixpanel.track('recipe_viewed', props);
}

export function trackRecipeStepsViewed(props: { recipe_name: string }) {
  mixpanel.track('recipe_steps_viewed', props);
}

export function trackRecipeAddedToPlan(props: { recipe_id: string; day: string; slot: string }) {
  mixpanel.track('recipe_added_to_plan', props);
}

export function trackRecipeRated(props: { recipe_id: string; rating: number }) {
  mixpanel.track('recipe_rated', props);
}

// ─── Apple Health ─────────────────────────────────────────────────────────────

export function trackHealthConnectPrompted() {
  mixpanel.track('health_connect_prompted');
}

export function trackHealthConnectAccepted(props: { granted: boolean }) {
  mixpanel.track('health_connect_accepted', props);
}

export function trackHealthConnectSkipped() {
  mixpanel.track('health_connect_skipped');
}

export function trackHealthWeightSynced(props: { count: number }) {
  mixpanel.track('health_weight_synced', props);
}

export function trackHealthStepsSynced(props: { steps: number }) {
  mixpanel.track('health_steps_synced', props);
}

// ─── GLP-1 Dose ──────────────────────────────────────────────────────────────

export function trackDoseUpdated(props: { dose_mg: number; medication: string }) {
  mixpanel.track('dose_updated', props);
}

// ─── Smart Fridge ─────────────────────────────────────────────────────────────

export function trackSmartFridgeOpened() {
  mixpanel.track('smart_fridge_opened');
}

export function trackSmartFridgeIngredientsSelected(props: { count: number; ingredients: string[] }) {
  mixpanel.track('smart_fridge_ingredients_selected', props);
}

export function trackSmartFridgeGenerateTapped(props: { ingredient_count: number }) {
  mixpanel.track('smart_fridge_generate_tapped', props);
}

export function trackSmartFridgeMealsShown(props: { meal_names: string[] }) {
  mixpanel.track('smart_fridge_meals_shown', props);
}

export function trackSmartFridgeMealStepsViewed(props: { meal_name: string }) {
  mixpanel.track('smart_fridge_meal_steps_viewed', props);
}
