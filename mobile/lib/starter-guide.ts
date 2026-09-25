export interface GuideCard {
  id: string;
  title: string;
  body: string;
  icon: string;
  cta_label: string;
  cta_action: 'symptom_tracker' | 'meal_plan' | 'none';
}

export const STARTER_GUIDE: GuideCard[] = [
  {
    id: 'week1_expectations',
    title: 'What to expect in week 1',
    body: 'Nausea is among the most common GLP-1 side effects and is often strongest in the first weeks or after a dose increase. It usually improves as your body adjusts. Most people feel significantly better by week 4 — follow your clinician’s guidance if symptoms are severe.',
    icon: '📅',
    cta_label: 'Got it',
    cta_action: 'none',
  },
  {
    id: 'protein_nonnegotiable',
    title: 'Why protein is non-negotiable',
    body: 'GLP-1–supported weight loss can include lean-tissue loss alongside fat loss (see STEP 1 body-composition findings). Higher protein intake — often around 100–130g/day depending on body size — is a common strategy to help protect muscle. Every FoodWise meal plan targets this range.',
    icon: '💪',
    cta_label: 'See my meal plan',
    cta_action: 'meal_plan',
  },
  {
    id: 'injection_day_meals',
    title: 'Your injection day meals',
    body: 'On the day you inject and the day after, many people feel more nausea. Clinical dietary guidance for GLP-1 GI symptoms often favors smaller portions and easier-to-digest textures. Your meal plan already accounts for this — follow it on those days.',
    icon: '💉',
    cta_label: 'View my plan',
    cta_action: 'meal_plan',
  },
  {
    id: 'zero_appetite',
    title: 'What to eat with zero appetite',
    body: 'Appetite suppression is the medication working. But you still need nutrition. Protein shakes, Greek yogurt, eggs, and edamame require almost no effort and hit your protein goals even on low-appetite days.',
    icon: '🥚',
    cta_label: 'Got it',
    cta_action: 'none',
  },
  {
    id: 'log_today',
    title: 'One thing to do today',
    body: 'Log how you\'re feeling after your first dose. Even just a 20-second symptom check-in tells FoodWise how to adjust your meals for next week.',
    icon: '✏️',
    cta_label: 'Log my symptoms now',
    cta_action: 'symptom_tracker',
  },
];
