import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

type MedicationId = 'semaglutide' | 'tirzepatide' | 'liraglutide' | 'other';

interface EscalationStep { dose_mg: number; week_start: number; }

const ESCALATION_SCHEDULES: Record<MedicationId, EscalationStep[]> = {
  semaglutide: [{ dose_mg: 0.25, week_start: 1 }, { dose_mg: 0.5, week_start: 5 }, { dose_mg: 1.0, week_start: 9 }],
  tirzepatide: [{ dose_mg: 2.5, week_start: 1 }, { dose_mg: 5.0, week_start: 5 }, { dose_mg: 7.5, week_start: 9 }, { dose_mg: 10.0, week_start: 13 }, { dose_mg: 12.5, week_start: 17 }, { dose_mg: 15.0, week_start: 21 }],
  liraglutide: [{ dose_mg: 0.6, week_start: 1 }, { dose_mg: 1.2, week_start: 2 }, { dose_mg: 1.8, week_start: 3 }, { dose_mg: 2.4, week_start: 4 }, { dose_mg: 3.0, week_start: 5 }],
  other: [{ dose_mg: 0, week_start: 1 }],
};

function computeStatus(medication: MedicationId, doseMg: number | null, doseStartDate: string | null) {
  const today = new Date();
  const schedule = ESCALATION_SCHEDULES[medication] ?? [];
  const daysOnCurrentDose = doseStartDate
    ? Math.floor((today.getTime() - new Date(doseStartDate).getTime()) / 86_400_000)
    : 0;
  const currentIdx = schedule.findIndex(s => s.dose_mg === doseMg);
  const nextStep = currentIdx >= 0 ? (schedule[currentIdx + 1] ?? null) : null;
  const DAYS_PER_STEP = 28;
  const daysUntilEscalation = nextStep ? Math.max(0, DAYS_PER_STEP - daysOnCurrentDose) : null;
  const isEscalationWeek = daysUntilEscalation !== null && daysUntilEscalation <= 7;
  let sideEffectRisk: 'high' | 'medium' | 'low' = 'low';
  if (isEscalationWeek || daysOnCurrentDose <= 7) sideEffectRisk = 'high';
  else if (daysOnCurrentDose <= 14) sideEffectRisk = 'medium';
  return { current_dose_mg: doseMg, days_on_current_dose: daysOnCurrentDose, next_dose_mg: nextStep?.dose_mg ?? null, days_until_escalation: daysUntilEscalation, is_escalation_week: isEscalationWeek, side_effect_risk: sideEffectRisk };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: { ...corsHeaders, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' } });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Missing authorization' }), { status: 401, headers: corsHeaders });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });

    // GET — return current escalation status
    if (req.method === 'GET') {
      const { data: profile } = await supabase.from('profiles').select('medication, dose_mg, dose_start_date').eq('id', user.id).single();
      const status = computeStatus(
        (profile?.medication ?? 'semaglutide') as MedicationId,
        profile?.dose_mg ?? null,
        profile?.dose_start_date ?? null,
      );
      return new Response(JSON.stringify(status), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // POST — update dose info
    if (req.method === 'POST') {
      const { current_dose_mg, dose_start_date } = await req.json();
      const { data: profile } = await supabase.from('profiles').select('medication').eq('id', user.id).single();
      const medication = (profile?.medication ?? 'semaglutide') as MedicationId;
      const schedule = ESCALATION_SCHEDULES[medication] ?? [];

      // Rebuild escalation_schedule from dose_start_date
      const escalationSchedule = schedule.map((step, i) => {
        const startDate = new Date(dose_start_date);
        const prevSteps = schedule.slice(0, i);
        const weeksOffset = prevSteps.reduce((acc, s, idx) => acc + (schedule[idx + 1]?.week_start ?? 99) - s.week_start, 0);
        const stepDate = new Date(startDate);
        stepDate.setDate(stepDate.getDate() + (step.week_start - 1) * 7);
        return { dose_mg: step.dose_mg, start_date: stepDate.toISOString().split('T')[0] };
      });

      await supabase.from('profiles').update({
        dose_mg: current_dose_mg,
        dose_start_date,
        escalation_schedule: escalationSchedule,
      }).eq('id', user.id);

      const status = computeStatus(medication, current_dose_mg, dose_start_date);
      return new Response(JSON.stringify(status), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });
  } catch (err) {
    console.error('escalation-status error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: corsHeaders });
  }
});
