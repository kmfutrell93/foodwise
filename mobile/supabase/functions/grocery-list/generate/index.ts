import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// The grocery list is already generated as part of meal-plans/generate
// This function re-fetches the latest active plan's grocery list
// and returns it, allowing the grocery screen to request a fresh build.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders() });
  }

  try {
    const { user_id } = await req.json();

    const { data: plan } = await supabase
      .from('meal_plans')
      .select('id, plan_json')
      .eq('user_id', user_id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!plan) return jsonError('No active meal plan found', 404);

    const groceryList = plan.plan_json?.grocery_list;
    if (!groceryList) return jsonError('Grocery list not yet generated — generate a meal plan first', 400);

    return json({ grocery_list: groceryList, plan_id: plan.id });
  } catch (err) {
    return jsonError(String(err), 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  });
}
function jsonError(msg: string, status: number) { return json({ error: msg }, status); }
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}
