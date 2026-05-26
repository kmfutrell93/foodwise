import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: { ...corsHeaders, 'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS' } });

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

    const url = new URL(req.url);

    // DELETE /weight-logs/:id
    if (req.method === 'DELETE') {
      const id = url.pathname.split('/').pop();
      if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400, headers: corsHeaders });
      const { error } = await supabase.from('weight_logs').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    // GET /weight-logs?days=90
    if (req.method === 'GET') {
      const days = parseInt(url.searchParams.get('days') ?? '90', 10);
      const since = new Date();
      since.setDate(since.getDate() - days);
      const { data, error } = await supabase
        .from('weight_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('logged_date', since.toISOString().split('T')[0])
        .order('logged_date', { ascending: true });
      if (error) throw error;
      return new Response(JSON.stringify(data ?? []), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // POST /weight-logs  { weight_lbs, note?, source? }
    if (req.method === 'POST') {
      const body = await req.json();
      const { weight_lbs, note, source = 'manual' } = body;
      if (!weight_lbs) return new Response(JSON.stringify({ error: 'weight_lbs required' }), { status: 400, headers: corsHeaders });

      const logged_date = body.logged_date ?? new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('weight_logs')
        .upsert({ user_id: user.id, logged_date, weight_lbs, note: note ?? null, source }, { onConflict: 'user_id,logged_date' })
        .select()
        .single();
      if (error) throw error;
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });
  } catch (err) {
    console.error('weight-logs error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: corsHeaders });
  }
});
