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
    body: 'Nausea is most common in the first 2–4 weeks. It usually peaks 24–48 hours after your injection and improves as your body adjusts. Most people feel significantly better by week 4.',
    icon: '📅',
    cta_label: 'Got it',
    cta_action: 'none',
  },
  {
    id: 'protein_nonnegotiable',
    title: 'Why protein is non-negotiable',
    body: 'GLP-1s can cause up to 30% of weight lost to come from muscle, not fat. Hitting 100–120g protein per day is the main thing you can do to prevent this. Every meal plan FoodWise builds hits this target.',
    icon: '💪',
    cta_label: 'See my meal plan',
    cta_action: 'meal_plan',
  },
  {
    id: 'injection_day_meals',
    title: 'Your injection day meals',
    body: 'On the day you inject and the day after: soft textures, easy to digest, no heavy red meat or greasy food. Your meal plan already accounts for this — just follow it on those days.',
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
