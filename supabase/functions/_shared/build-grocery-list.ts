export type Ingredient = {
  name: string;
  quantity: string;
  category?: string;
  estimated_cost: number;
};

export type Meal = { ingredients?: Ingredient[] };
export type Day = { meals: Meal[] };

export type GroceryListItem = {
  name: string;
  quantity: string;
  unit: string;
  category: string;
  estimated_cost: number;
  nova_score: number;
};

export type GroceryListResult = {
  estimated_total: number;
  sections: { category: string; items: Omit<GroceryListItem, 'category'>[] }[];
  generated_at: string;
};

/** Keyword lookup — Claude no longer emits category per ingredient. */
export function categorizeIngredient(name: string): string {
  const n = name.toLowerCase();
  if (/chicken|beef|turkey|salmon|fish|tuna|shrimp|pork|egg|tofu|protein powder|greek yogurt|cottage cheese/.test(n)) {
    return 'Proteins';
  }
  if (/spinach|kale|broccoli|pepper|tomato|cucumber|lettuce|carrot|onion|garlic|avocado|banana|berry|berries|apple|zucchini|mushroom|sprout/.test(n)) {
    return 'Produce';
  }
  if (/milk|cheese|yogurt|butter|cream|feta|ricotta/.test(n)) return 'Dairy & Eggs';
  if (/frozen/.test(n)) return 'Frozen';
  if (/oat|rice|quinoa|bean|lentil|flour|oil|seed|nut|bread|pasta|chia/.test(n)) return 'Pantry';
  return 'Other';
}

/**
 * Deterministic grocery list from meal-plan ingredients — no Claude call.
 * Deduplicates by name, enforces budget by dropping most expensive items,
 * then groups into store sections.
 */
export function buildGroceryList(days: Day[], budget: number): GroceryListResult {
  const allIngredients: Ingredient[] = [];
  for (const day of days ?? []) {
    for (const meal of day.meals ?? []) {
      if (Array.isArray(meal.ingredients)) {
        for (const ing of meal.ingredients) {
          if (!ing?.name) continue;
          const name = String(ing.name);
          allIngredients.push({
            name,
            quantity: String(ing.quantity ?? ''),
            category: categorizeIngredient(name),
            estimated_cost: Number(ing.estimated_cost) || 0,
          });
        }
      }
    }
  }

  if (allIngredients.length === 0) {
    throw new Error(
      'This meal plan has no ingredients. Generate a new meal plan to build a grocery list.'
    );
  }

  // Deduplicate by normalized name — keep highest cost, note meal count.
  const merged = new Map<string, Ingredient & { count: number }>();
  for (const ing of allIngredients) {
    const key = ing.name.toLowerCase().trim();
    const existing = merged.get(key);
    if (existing) {
      existing.count += 1;
      existing.estimated_cost = Math.max(existing.estimated_cost, ing.estimated_cost);
    } else {
      merged.set(key, { ...ing, count: 1 });
    }
  }

  // Keep category through budget trim so grouping still works.
  let items: GroceryListItem[] = Array.from(merged.values()).map((ing) => ({
    name: ing.name,
    quantity: ing.count > 1 ? `${ing.quantity} (x${ing.count} meals)` : ing.quantity,
    unit: '',
    category: ing.category || 'Other',
    estimated_cost: ing.estimated_cost,
    nova_score: 1,
  }));

  items.sort((a, b) => b.estimated_cost - a.estimated_cost);
  let total = items.reduce((sum, i) => sum + i.estimated_cost, 0);
  while (total > budget && items.length > 0) {
    const removed = items.shift();
    if (removed) total -= removed.estimated_cost;
  }

  if (items.length === 0) {
    throw new Error('Could not build a grocery list within budget.');
  }

  const sectionMap: Record<string, Omit<GroceryListItem, 'category'>[]> = {};
  for (const item of items) {
    const cat = item.category || 'Other';
    if (!sectionMap[cat]) sectionMap[cat] = [];
    sectionMap[cat].push({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      estimated_cost: item.estimated_cost,
      nova_score: item.nova_score,
    });
  }

  return {
    estimated_total: Math.round(total * 100) / 100,
    sections: Object.entries(sectionMap).map(([category, sectionItems]) => ({
      category,
      items: sectionItems,
    })),
    generated_at: new Date().toISOString(),
  };
}
