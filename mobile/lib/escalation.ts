export type MedicationId = 'semaglutide' | 'tirzepatide' | 'liraglutide' | 'other';

export interface EscalationStep {
  dose_mg: number;
  week_start: number; // week number from starting medication
}

export const ESCALATION_SCHEDULES: Record<MedicationId, EscalationStep[]> = {
  semaglutide: [
    { dose_mg: 0.25, week_start: 1 },
    { dose_mg: 0.5,  week_start: 5 },
    { dose_mg: 1.0,  week_start: 9 },
  ],
  tirzepatide: [
    { dose_mg: 2.5,  week_start: 1 },
    { dose_mg: 5.0,  week_start: 5 },
    { dose_mg: 7.5,  week_start: 9 },
    { dose_mg: 10.0, week_start: 13 },
    { dose_mg: 12.5, week_start: 17 },
    { dose_mg: 15.0, week_start: 21 },
  ],
  liraglutide: [
    { dose_mg: 0.6, week_start: 1 },
    { dose_mg: 1.2, week_start: 2 },
    { dose_mg: 1.8, week_start: 3 },
    { dose_mg: 2.4, week_start: 4 },
    { dose_mg: 3.0, week_start: 5 },
  ],
  other: [
    { dose_mg: 0, week_start: 1 },
  ],
};

export interface EscalationStatus {
  current_dose_mg: number | null;
  days_on_current_dose: number;
  next_dose_mg: number | null;
  days_until_escalation: number | null;
  is_escalation_week: boolean;
  side_effect_risk: 'high' | 'medium' | 'low';
}

export function computeEscalationStatus(
  medication: MedicationId,
  doseMg: number | null,
  doseStartDate: string | null,
): EscalationStatus {
  const today = new Date();
  const schedule = ESCALATION_SCHEDULES[medication] ?? [];

  const daysOnCurrentDose = doseStartDate
    ? Math.floor((today.getTime() - new Date(doseStartDate).getTime()) / 86_400_000)
    : 0;

  const currentStepIdx = schedule.findIndex(s => s.dose_mg === doseMg);
  const nextStep = currentStepIdx >= 0 ? schedule[currentStepIdx + 1] ?? null : null;

  // Each escalation step lasts 28 days (4 weeks)
  const DAYS_PER_STEP = 28;
  const daysUntilEscalation = nextStep
    ? Math.max(0, DAYS_PER_STEP - daysOnCurrentDose)
    : null;

  const isEscalationWeek = daysUntilEscalation !== null && daysUntilEscalation <= 7;

  let sideEffectRisk: 'high' | 'medium' | 'low' = 'low';
  if (isEscalationWeek || daysOnCurrentDose <= 7) sideEffectRisk = 'high';
  else if (daysOnCurrentDose <= 14) sideEffectRisk = 'medium';

  return {
    current_dose_mg: doseMg,
    days_on_current_dose: daysOnCurrentDose,
    next_dose_mg: nextStep?.dose_mg ?? null,
    days_until_escalation: daysUntilEscalation,
    is_escalation_week: isEscalationWeek,
    side_effect_risk: sideEffectRisk,
  };
}

export function getDoseOptions(medication: MedicationId): number[] {
  return ESCALATION_SCHEDULES[medication]?.map(s => s.dose_mg) ?? [];
}
