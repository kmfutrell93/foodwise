import React, { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export type OnboardingData = {
  primary_struggle: 'protein' | 'nausea' | 'confusion' | 'muscle' | null;
  protein_goal_range: 'under25' | '25-50' | '50-75' | '75-100' | '100plus' | 'unsure' | null;
  dietary_restrictions: string[];
  weekly_budget: number;
  appetite_level: 'low' | 'moderate' | 'normal' | null;
  check_in_time: string;
  notifications_enabled: boolean;
  medication: 'ozempic' | 'wegovy' | 'mounjaro' | 'zepbound' | 'other' | null;
  injection_day: number | null;
  dose_mg: number | null;
  food_aversions: string[];
};

type OnboardingContextType = {
  data: OnboardingData;
  setField: <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => void;
  saveStep: (step: number) => Promise<void>;
  completeOnboarding: () => Promise<void>;
};

const defaults: OnboardingData = {
  primary_struggle: null,
  protein_goal_range: null,
  dietary_restrictions: [],
  weekly_budget: 75,
  appetite_level: null,
  check_in_time: '08:00',
  notifications_enabled: false,
  medication: null,
  injection_day: null,
  dose_mg: null,
  food_aversions: [],
};

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<OnboardingData>(defaults);

  const setField = useCallback(<K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => {
    setData(prev => ({ ...prev, [key]: value }));
  }, []);

  const saveStep = useCallback(async (step: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('profiles').update({ onboarding_step: step }).eq('id', user.id);
  }, []);

  const completeOnboarding = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('profiles').update({
      ...data,
      onboarding_completed: true,
      onboarding_step: 22,
    }).eq('id', user.id);
  }, [data]);

  return (
    <OnboardingContext.Provider value={{ data, setField, saveStep, completeOnboarding }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used inside OnboardingProvider');
  return ctx;
}
