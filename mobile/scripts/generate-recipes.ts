/**
 * Generates 150 recipe SQL seeds via the Claude API and writes them to
 * supabase/seeds/recipes.sql. Run with:
 *   npx ts-node --esm scripts/generate-recipes.ts
 * Requires ANTHROPIC_API_KEY env var.
 */
import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const BATCHES = [
  { meal_types: ['breakfast', 'snack'], count: 50, description: 'high-protein breakfasts and snacks suitable for GLP-1 users — soft textures, easy to eat, protein-forward' },
  { meal_types: ['lunch'], count: 50, description: 'protein-rich lunches with soft or normal textures, low NOVA score, budget-friendly' },
  { meal_types: ['dinner'], count: 50, description: 'nutrient-dense dinners with lean proteins, minimal ultra-processed ingredients, simple prep' },
];

const MEDICATIONS = ['semaglutide', 'tirzepatide', 'liraglutide'];
const PHASES = ['injection_day', 'post_injection', 'standard', 'constipation_phase'];
const BUDGET_TIERS = ['budget', 'mid', 'premium'];
const SKILL_LEVELS = ['simple', 'intermediate', 'advanced'];

function buildPrompt(batch: typeof BATCHES[0], startId: number): string {
  return `You are a registered dietitian creating recipes specifically for people using GLP-1 medications (Ozempic, Wegovy, Mounjaro, Zepbound, Saxenda).

Generate exactly ${batch.count} ${batch.description}.

Return a JSON array of exactly ${batch.count} recipe objects. Each object must have:
- name: string (concise, appetizing)
- meal_type: string[] (from: breakfast, lunch, dinner, snack)
- medication_suitability: string[] (from: ${MEDICATIONS.join(', ')}) — all three unless there's a reason to exclude one
- texture: string (one of: soft, normal, firm)
- phase_suitability: string[] (subset of: ${PHASES.join(', ')})
- protein_g: number (grams, 15-60 range, accurate estimate)
- calories: number (200-700 range)
- cook_time_mins: number (5-90)
- skill_level: string (one of: ${SKILL_LEVELS.join(', ')})
- serving_size: number (1-4)
- ingredients: Array<{ name: string; qty: string; unit: string }>
- instructions: string[] (3-8 clear steps)
- nova_score: number (1-4, prefer 1-2)
- allergens: string[] (from: gluten, dairy, eggs, nuts, soy, fish, shellfish)
- budget_tier: string (one of: ${BUDGET_TIERS.join(', ')})
- tags: string[] (2-5 descriptive tags)
- dietitian_reviewed: false

Rules:
- Protein must be accurate (e.g. Greek yogurt has ~17g/cup, chicken breast ~31g/100g)
- NOVA 1 = unprocessed whole foods, NOVA 4 = ultra-processed — aim for 1-2
- injection_day phase = very soft, easy to eat, small portions
- Ensure diversity: different cuisines, proteins, prep methods
- Do not repeat recipe names

Return ONLY the JSON array, no explanation, no markdown code fences.`;
}

function recipesToSql(recipes: Record<string, unknown>[]): string {
  const rows = recipes.map(r => {
    const escape = (s: string) => s.replace(/'/g, "''");
    const arr = (a: string[] | undefined) => a ? `ARRAY[${a.map(x => `'${escape(x)}'`).join(',')}]` : 'NULL';
    const jsonb = (v: unknown) => `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
    return `  (
    ${jsonb(r.ingredients)},
    ${arr(r.instructions as string[])},
    ${arr(r.meal_type as string[])},
    ${arr(r.medication_suitability as string[])},
    '${escape(r.texture as string)}',
    ${arr(r.phase_suitability as string[])},
    ${r.protein_g},
    ${r.calories},
    ${r.cook_time_mins},
    '${escape(r.skill_level as string)}',
    ${r.serving_size ?? 1},
    '${escape(r.name as string)}',
    ${r.nova_score ?? 2},
    ${arr(r.allergens as string[])},
    '${escape(r.budget_tier as string)}',
    ${arr(r.tags as string[])},
    ${r.dietitian_reviewed ? 'true' : 'false'}
  )`;
  });

  return `-- Generated recipe seeds (${recipes.length} recipes)
-- Run: psql $DATABASE_URL < supabase/seeds/recipes.sql

INSERT INTO public.recipes (
  ingredients, instructions, meal_type, medication_suitability,
  texture, phase_suitability, protein_g, calories, cook_time_mins,
  skill_level, serving_size, name, nova_score, allergens,
  budget_tier, tags, dietitian_reviewed
) VALUES
${rows.join(',\n')};
`;
}

async function generateBatch(batch: typeof BATCHES[0]): Promise<Record<string, unknown>[]> {
  console.log(`Generating ${batch.count} ${batch.meal_types.join('/')} recipes…`);

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 16000,
    messages: [{ role: 'user', content: buildPrompt(batch, 0) }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/```\s*$/, '');

  try {
    const recipes = JSON.parse(cleaned);
    if (!Array.isArray(recipes)) throw new Error('Response is not an array');
    console.log(`  → got ${recipes.length} recipes`);
    return recipes;
  } catch (err) {
    console.error('Failed to parse batch response:', err);
    console.error('Raw response (first 500 chars):', text.slice(0, 500));
    return [];
  }
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is required');
    process.exit(1);
  }

  const outDir = path.join(__dirname, '../../../supabase/seeds');
  fs.mkdirSync(outDir, { recursive: true });

  const allRecipes: Record<string, unknown>[] = [];

  for (const batch of BATCHES) {
    const recipes = await generateBatch(batch);
    allRecipes.push(...recipes);
    // Respect rate limits between batches
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`\nTotal recipes generated: ${allRecipes.length}`);

  const sql = recipesToSql(allRecipes);
  const outPath = path.join(outDir, 'recipes.sql');
  fs.writeFileSync(outPath, sql, 'utf8');
  console.log(`Written to ${outPath}`);
}

main().catch(err => { console.error(err); process.exit(1); });
