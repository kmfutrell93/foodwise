import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { ...corsHeaders, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' } });
  }

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

    // POST /recipes/rate  { recipe_id, rating }
    if (req.method === 'POST') {
      const body = await req.json();
      const { recipe_id, rating, made_it } = body;
      if (!recipe_id || !rating || rating < 1 || rating > 5) {
        return new Response(JSON.stringify({ error: 'recipe_id and rating (1-5) required' }), { status: 400, headers: corsHeaders });
      }
      const { data, error } = await supabase
        .from('recipe_user_ratings')
        .upsert({ user_id: user.id, recipe_id, rating, made_it: made_it ?? false }, { onConflict: 'recipe_id,user_id' })
        .select()
        .single();
      if (error) throw error;
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // GET /recipes  ?meal_type=breakfast&nova_max=3&budget_tier=budget&limit=20&offset=0
    if (req.method === 'GET') {
      const id = url.searchParams.get('id');
      if (id) {
        const { data, error } = await supabase.from('recipes').select('*').eq('id', id).single();
        if (error) throw error;
        let userRating: number | null = null;
        if (data) {
          const { data: ratingRow } = await supabase
            .from('recipe_user_ratings')
            .select('rating')
            .eq('user_id', user.id)
            .eq('recipe_id', id)
            .maybeSingle();
          userRating = ratingRow?.rating ?? null;
        }
        return new Response(JSON.stringify(data ? { ...data, user_rating: userRating } : null), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const mealType = url.searchParams.get('meal_type');
      const novaMax = url.searchParams.get('nova_max');
      const budgetTier = url.searchParams.get('budget_tier');
      const medication = url.searchParams.get('medication');
      const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '40', 10), 100);
      const offset = parseInt(url.searchParams.get('offset') ?? '0', 10);

      let query = supabase.from('recipes').select('*').order('created_at', { ascending: false }).range(offset, offset + limit - 1);

      if (mealType && mealType !== 'all') {
        query = query.contains('meal_type', [mealType]);
      }
      if (novaMax) {
        query = query.lte('nova_score', parseInt(novaMax, 10));
      }
      if (budgetTier) {
        query = query.eq('budget_tier', budgetTier);
      }
      if (medication) {
        query = query.contains('medication_suitability', [medication]);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch user's ratings for these recipes
      const ids = (data ?? []).map((r: { id: string }) => r.id);
      let ratings: Record<string, number> = {};
      if (ids.length > 0) {
        const { data: ratingData } = await supabase
          .from('recipe_user_ratings')
          .select('recipe_id, rating')
          .eq('user_id', user.id)
          .in('recipe_id', ids);
        if (ratingData) {
          for (const r of ratingData) ratings[r.recipe_id] = r.rating;
        }
      }

      const recipes = (data ?? []).map((r: Record<string, unknown>) => ({ ...r, user_rating: ratings[r.id as string] ?? null }));
      return new Response(JSON.stringify(recipes), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });
  } catch (err) {
    console.error('recipes error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: corsHeaders });
  }
});
