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

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile>;
        Update: Partial<Profile>;
      };
      meal_plans: {
        Row: MealPlan;
        Insert: Partial<MealPlan>;
        Update: Partial<MealPlan>;
      };
      symptom_logs: {
        Row: SymptomLog;
        Insert: Partial<SymptomLog>;
        Update: Partial<SymptomLog>;
      };
      streaks: {
        Row: Streak;
        Insert: Partial<Streak>;
        Update: Partial<Streak>;
      };
      milestones: {
        Row: Milestone;
        Insert: Partial<Milestone>;
        Update: Partial<Milestone>;
      };
      weekly_reports: {
        Row: WeeklyReport;
        Insert: Partial<WeeklyReport>;
        Update: Partial<WeeklyReport>;
      };
    };
  };
};

export type Profile = {
  id: string;
  created_at: string;
  updated_at: string;
  // Onboarding
  primary_struggle: 'protein' | 'nausea' | 'confusion' | 'muscle' | null;
  protein_goal_range: 'under25' | '25-50' | '50-75' | '75-100' | '100plus' | 'unsure' | null;
  dietary_restrictions: string[];
  weekly_budget: number;
  appetite_level: 'low' | 'moderate' | 'normal' | null;
  check_in_time: string; // HH:MM format
  notifications_enabled: boolean;
  onboarding_completed: boolean;
  onboarding_step: number;
  // GLP-1 specific
  medication: 'ozempic' | 'wegovy' | 'mounjaro' | 'zepbound' | 'other' | null;
  injection_day: number | null; // 0=Sun, 1=Mon, ... 6=Sat
  dose_mg: number | null;
  food_aversions: string[];
  // App state
  is_pro: boolean;
  trial_started_at: string | null;
  meal_plans_generated: number;
  push_token: string | null;
};

export type MealDay = {
  day: string;
  date: string;
  is_injection_day: boolean;
  meals: {
    breakfast: MealItem;
    lunch: MealItem;
    dinner: MealItem;
    snack?: MealItem;
  };
  totals: { protein_g: number; calories: number; cost_usd: number };
};

export type MealItem = {
  name: string;
  description: string;
  protein_g: number;
  calories: number;
  cost_usd: number;
  prep_minutes: number;
  texture: 'soft' | 'normal' | 'crunchy';
  ingredients: string[];
};

export type MealPlan = {
  id: string;
  user_id: string;
  created_at: string;
  week_start: string;
  plan_json: { days: MealDay[]; weekly_total: { protein_g: number; calories: number; cost_usd: number } };
  is_active: boolean;
};

export type SymptomLog = {
  id: string;
  user_id: string;
  logged_at: string;
  nausea: number | null;
  constipation: number | null;
  fatigue: number | null;
  food_aversions: string[];
  notes: string | null;
};

export type Streak = {
  id: string;
  user_id: string;
  protein_streak: number;
  checkin_streak: number;
  plan_streak: number;
  last_protein_log: string | null;
  last_checkin: string | null;
  last_plan_generated: string | null;
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
  type: MilestoneType;
  earned_at: string;
};

export type WeeklyReport = {
  id: string;
  user_id: string;
  week_of: string;
  summary: string;
  created_at: string;
};
