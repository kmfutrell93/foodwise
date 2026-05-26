export type DrugClass = 'semaglutide' | 'tirzepatide' | 'liraglutide' | 'other';

export interface MedicationProfile {
  id: string;
  display_name: string;
  drug_class: DrugClass;
  nausea_profile: 'moderate' | 'higher';
  constipation_risk: 'moderate' | 'high';
  appetite_suppression: 'strong' | 'very_strong';
  injection_frequency: 'weekly' | 'daily';
  typical_side_effect_window_hours: number;
  nausea_foods_to_avoid: string[];
  protein_emphasis: 'high' | 'critical';
  drug_class_note: string;
}

export const MEDICATION_PROFILES: Record<string, MedicationProfile> = {
  semaglutide: {
    id: 'semaglutide',
    display_name: 'Ozempic / Wegovy',
    drug_class: 'semaglutide',
    nausea_profile: 'moderate',
    constipation_risk: 'moderate',
    appetite_suppression: 'strong',
    injection_frequency: 'weekly',
    typical_side_effect_window_hours: 36,
    nausea_foods_to_avoid: ['fatty fried foods', 'spicy dishes', 'carbonated drinks', 'alcohol', 'high-fat dairy'],
    protein_emphasis: 'high',
    drug_class_note: 'Semaglutide — once weekly injection. Acts on GLP-1 receptors to suppress appetite and slow gastric emptying.',
  },
  tirzepatide: {
    id: 'tirzepatide',
    display_name: 'Mounjaro / Zepbound',
    drug_class: 'tirzepatide',
    nausea_profile: 'higher',
    constipation_risk: 'high',
    appetite_suppression: 'very_strong',
    injection_frequency: 'weekly',
    typical_side_effect_window_hours: 24,
    nausea_foods_to_avoid: ['fatty fried foods', 'high-fat dairy', 'rich sauces', 'carbonated drinks', 'alcohol', 'spicy dishes', 'large portions of red meat'],
    protein_emphasis: 'critical',
    drug_class_note: 'Tirzepatide — once weekly injection. Targets both GLP-1 and GIP receptors. Strongest appetite suppression available. Nausea and food aversions can be more intense in the first 8 weeks.',
  },
  liraglutide: {
    id: 'liraglutide',
    display_name: 'Saxenda / Victoza',
    drug_class: 'liraglutide',
    nausea_profile: 'moderate',
    constipation_risk: 'moderate',
    appetite_suppression: 'strong',
    injection_frequency: 'daily',
    typical_side_effect_window_hours: 12,
    nausea_foods_to_avoid: ['fatty fried foods', 'spicy dishes', 'carbonated drinks', 'alcohol'],
    protein_emphasis: 'high',
    drug_class_note: 'Liraglutide — daily injection. Acts on GLP-1 receptors. Shorter action window than weekly options.',
  },
  other: {
    id: 'other',
    display_name: 'Other GLP-1',
    drug_class: 'other',
    nausea_profile: 'moderate',
    constipation_risk: 'moderate',
    appetite_suppression: 'strong',
    injection_frequency: 'weekly',
    typical_side_effect_window_hours: 36,
    nausea_foods_to_avoid: ['fatty fried foods', 'spicy dishes', 'carbonated drinks', 'alcohol'],
    protein_emphasis: 'high',
    drug_class_note: 'GLP-1 medication — weekly injection.',
  },
};
