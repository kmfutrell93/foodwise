export interface Testimonial {
  quote: string;
  name: string;
  medication: string;
  weeks_on_app: number;
}

// Populate with real beta tester quotes after the Day 9 feedback round.
// Leave empty until then — the paywall hides the section when array is empty.
export const TESTIMONIALS: Testimonial[] = [
  // {
  //   quote: "[PASTE BETA TESTER QUOTE]",
  //   name: "First name only",
  //   medication: "Ozempic",
  //   weeks_on_app: 2,
  // },
];
