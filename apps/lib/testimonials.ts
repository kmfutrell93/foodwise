export interface Testimonial {
  quote: string
  name: string
  medication: string
}

// Populate with real beta quotes after Day 9 feedback round.
// Section renders nothing while this array is empty.
export const TESTIMONIALS: Testimonial[] = []
