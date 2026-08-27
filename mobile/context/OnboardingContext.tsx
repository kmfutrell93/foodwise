import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { trackOnboardingStepCompleted, trackOnboardingCompleted } from '@/lib/analytics';
import { ONBOARDING_SCREEN_ORDER } from '@/constants/onboardingFlow';

export type OnboardingData = {
  primary_struggle: 'protein' | 'nausea' | 'confusion' | 'muscle' | null;
  protein_goal_range: 'under25' | '25-50' | '50-75' | '75-100' | '100plus' | 'unsure' | null;
  dietary_restrictions: string[];
  weekly_budget: number;
  appetite_level: 'low' | 'moderate' | 'normal' | null;
  check_in_time: 'morning' | 'midday' | 'evening' | null;
  notifications_enabled: boolean;
  push_token: string | null;
  medication: 'semaglutide' | 'tirzepatide' | 'liraglutide' | 'other' | null;
  injection_day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday' | null;
  dose_mg: number | null;
  dose_start_date: string | null;
  time_on_medication: string | null;
  food_aversions: string[];
};

type OnboardingContextType = {
  data: OnboardingData;
  setField: <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => void;
  saveStep: (step: number, overrides?: Partial<OnboardingData>) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  /** Load saved answers from profiles into context (call before resume navigate). */
  hydrateFromProfile: (userId: string) => Promise<void>;
};

const defaults: OnboardingData = {
  primary_struggle: null,
  protein_goal_range: null,
  dietary_restrictions: [],
  weekly_budget: 75,
  appetite_level: null,
  check_in_time: null,
  notifications_enabled: false,
  push_token: null,
  medication: null,
  injection_day: null,
  dose_mg: null,
  dose_start_date: null,
  time_on_medication: null,
  food_aversions: [],
};

const PROFILE_FIELDS: (keyof OnboardingData)[] = [
  'primary_struggle',
  'protein_goal_range',
  'dietary_restrictions',
  'weekly_budget',
  'appetite_level',
  'check_in_time',
  'notifications_enabled',
  'push_token',
  'medication',
  'injection_day',
  'dose_mg',
  'dose_start_date',
  'time_on_medication',
  'food_aversions',
];

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<OnboardingData>(defaults);
  // Synchronous mirror — setField updates this immediately so saveStep never
  // persists a stale React state snapshot from the same event handler.
  const dataRef = useRef<OnboardingData>(defaults);

  const setField = useCallback(<K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => {
    dataRef.current = { ...dataRef.current, [key]: value };
    setData(dataRef.current);
  }, []);

  const saveStep = useCallback(async (step: number, overrides: Partial<OnboardingData> = {}) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn('[onboarding] saveStep skipped — no authenticated user');
      return;
    }
    // Merge overrides into the sync ref first, then persist from the ref.
    dataRef.current = { ...dataRef.current, ...overrides };
    setData(dataRef.current);
    const payload = { ...dataRef.current, onboarding_step: step };
    const { error } = await supabase.from('profiles').update(payload).eq('id', user.id);
    if (error) {
      console.error('[onboarding] saveStep profile update failed', error.message);
      throw error;
    }
    if (overrides.push_token || (payload.push_token && overrides.notifications_enabled)) {
      console.log('[push] token saved to profile');
    }
    trackOnboardingStepCompleted(step, `step-${step}`);
  }, []);

  const completeOnboarding = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const snapshot = dataRef.current;
    const { error } = await supabase.from('profiles').update({
      ...snapshot,
      onboarding_completed: true,
      onboarding_step: ONBOARDING_SCREEN_ORDER.length - 1,
    }).eq('id', user.id);
    if (error) {
      console.error('[onboarding] completeOnboarding profile update failed', error.message);
      throw error;
    }
    trackOnboardingCompleted({
      medication: snapshot.medication ?? 'unknown',
      injection_day: snapshot.injection_day ?? 'unknown',
      has_dietary_restrictions: snapshot.dietary_restrictions.length > 0,
      weekly_budget: snapshot.weekly_budget,
    });
  }, []);

  const hydrateFromProfile = useCallback(async (userId: string) => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select(
        'primary_struggle, protein_goal_range, dietary_restrictions, weekly_budget, appetite_level, check_in_time, notifications_enabled, push_token, medication, injection_day, dose_mg, dose_start_date, time_on_medication, food_aversions',
      )
      .eq('id', userId)
      .single();
    if (error || !profile) {
      console.warn('[onboarding] hydrateFromProfile failed', error?.message);
      return;
    }
    const row = profile as unknown as Record<string, unknown>;
    const next: OnboardingData = { ...defaults };
    for (const key of PROFILE_FIELDS) {
      const val = row[key];
      if (val !== undefined && val !== null) {
        (next as any)[key] = val;
      }
    }
    // Keep array defaults if DB returned null
    if (!Array.isArray(next.dietary_restrictions)) next.dietary_restrictions = [];
    if (!Array.isArray(next.food_aversions)) next.food_aversions = [];
    if (typeof next.weekly_budget !== 'number') next.weekly_budget = Number(next.weekly_budget) || 75;
    dataRef.current = next;
    setData(next);
    console.log('[onboarding] hydrated from profile');
  }, []);

  return (
    <OnboardingContext.Provider value={{ data, setField, saveStep, completeOnboarding, hydrateFromProfile }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be inside OnboardingProvider');
  return ctx;
}
