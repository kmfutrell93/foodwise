export interface FAQItem {
  question: string
  answer: string
}

export const FAQ_DATA: FAQItem[] = [
  {
    question: 'What GLP-1 medications does FoodWise support?',
    answer: 'Ozempic, Wegovy, Mounjaro, and Zepbound. Each has a tailored meal protocol based on its specific side effect profile and dose escalation schedule.',
  },
  {
    question: 'How does the injection day feature work?',
    answer: 'During onboarding you select your injection day. Your weekly plan automatically assigns soft-texture, easy-to-digest meals on dose day and the day after — when nausea and food sensitivity are highest.',
  },
  {
    question: 'Why does protein matter so much on GLP-1s?',
    answer: 'GLP-1 medications can cause 25–39% of weight lost to come from muscle rather than fat. Eating 100–120g of protein per day significantly reduces this. Every FoodWise meal plan is built to hit this target.',
  },
  {
    question: 'Is FoodWise a medical app?',
    answer: 'No. FoodWise provides nutrition guidance based on general GLP-1 dietary recommendations. It is not a medical device. Always consult your prescribing physician.',
  },
  {
    question: 'Does FoodWise connect to Apple Health?',
    answer: 'Yes, on iOS. FoodWise reads body weight and steps from Apple Health and writes your daily protein intake back. Optional — skip during onboarding if preferred.',
  },
  {
    question: 'How does the symptom tracker work?',
    answer: "A 20-second daily check-in (nausea, constipation, fatigue, food aversions). After 7 days, FoodWise surfaces a correlation insight and adjusts the following week's meal plan automatically.",
  },
  {
    question: 'What is the weekly progress report?',
    answer: 'Every Sunday evening: a personalised summary of protein average, symptom trends, streak count, budget, and one specific tip for next week. Delivered as a push notification and in the Progress tab.',
  },
  {
    question: 'How much does FoodWise cost?',
    answer: 'Free for up to 3 meal plans/month. FoodWise Pro: $12.99/month or $99/year (save 36%). Both include a 7-day free trial.',
  },
  {
    question: 'Can I cancel?',
    answer: 'Yes, anytime. iOS Settings → [Your Name] → Subscriptions → FoodWise. Access continues to end of billing period.',
  },
  {
    question: 'Is my health data private?',
    answer: 'Yes. Encrypted at rest and in transit. We do not sell data or share it with advertisers, insurers, or pharmaceutical companies. See foodwise.app/privacy.',
  },
]
