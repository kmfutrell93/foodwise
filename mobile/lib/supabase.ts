import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ── Types ─────────────────────────────────────────────────────────────────────

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;

  // onboarding state
  onboarding_step: number;
  onboarding_completed: boolean;

  // question answers
  primary_struggle: 'protein' | 'nausea' | 'confusion' | 'muscle' | null;
  protein_goal_range: string | null;
  dietary_restrictions: string[];
  weekly_budget: number;
  appetite_level: 'low' | 'moderate' | 'normal' | null;
  check_in_time: 'morning' | 'midday' | 'evening' | null;
  notifications_enabled: boolean;
  push_token: string | null;

  // GLP-1 specifics
  medication: 'semaglutide' | 'tirzepatide' | 'liraglutide' | 'other' | null;
  injection_day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday' | null;
  dose_mg: number | null;
  dose_start_date: string | null;
  escalation_schedule: object | null;
  time_on_medication: string | null;
  food_aversions: string[];

  // Phase 2 preferences
  show_weight_log: boolean;
  hydration_reminders_enabled: boolean;
  starter_guide_completed: boolean;
  starter_guide_step: number;
  health_connected: boolean;
  health_permissions: object | null;
  steps_today: number;
};

export type MealItem = {
  slot: string;
  name: string;
  protein_g: number;
  calories: number;
  cost?: number;
  note?: string;
};

export type MealDay = {
  day: string;
  is_injection_day: boolean;
  total_protein_g: number;
  total_calories: number;
  estimated_cost?: number;
  meals: MealItem[];
};

export type GroceryItem = {
  name: string;
  quantity: string;
  unit: string;
  estimated_cost?: number;
  nova_score?: 1 | 2 | 3 | 4;
};

export type GrocerySection = {
  category: string;
  items: GroceryItem[];
};

export type GroceryList = {
  estimated_total?: number;
  savings_tip?: string;
  sections: GrocerySection[];
};

export type MealPlan = {
  id: string;
  user_id: string;
  created_at: string;
  week_start: string;
  plan_json: { days: MealDay[] };
  grocery_list: GroceryList;
};

export type SymptomLog = {
  id: string;
  user_id: string;
  logged_at: string;
  symptoms: string[];
  severity: number;
  energy_level: number;
  notes: string | null;
};

export type Streak = {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  total_logs: number;
  last_logged_at: string | null;
  updated_at: string;
};

export type MilestoneType =
  | 'first_log'
  | '7day_streak'
  | '30day_streak'
  | 'first_insight'
  | 'first_week_under_budget'
  | 'plan_streak_7';

export type Milestone = {
  id: string;
  user_id: string;
  milestone_type: MilestoneType;
  earned_at: string;
};

export type WeightLog = {
  id: string;
  user_id: string;
  logged_date: string;
  weight_lbs: number;
  note: string | null;
  source: 'manual' | 'apple_health';
  created_at: string;
};

export type Recipe = {
  id: string;
  name: string;
  meal_type: string[];
  medication_suitability: string[];
  texture: string;
  phase_suitability: string[];
  protein_g: number;
  calories: number;
  cook_time_mins: number;
  skill_level: string;
  serving_size: number;
  ingredients: { name: string; qty: string; unit: string }[];
  instructions: string[];
  nova_score: number;
  allergens: string[];
  budget_tier: string;
  tags: string[];
  dietitian_reviewed: boolean;
  created_at: string;
};

export type WeeklyReport = {
  id: string;
  user_id: string;
  week_start: string;
  insight_text: string | null;
  avg_protein_g: number | null;
  avg_energy: number | null;
  symptom_summary: Record<string, number>;
  created_at: string;
};
