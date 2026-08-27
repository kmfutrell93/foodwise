import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Dimensions, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle, interpolateColor,
  withTiming, withSpring, withRepeat, withSequence,
  cancelAnimation, FadeIn,
  Easing,
} from 'react-native-reanimated';
import { supabase, Recipe, SavedRecipe } from '@/lib/supabase';
import { FontSize, Spacing, Radius, ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/context/ThemeContext';
import { useRevenueCat, ENTITLEMENT_ID } from '@/context/RevenueCatContext';
import { usePaywallGate } from '@/lib/usePaywallGate';
import { trackRecipeListViewed, trackRecipeViewed } from '@/lib/analytics';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Spacing.xl * 2 - Spacing.md) / 2;

const MEAL_TYPE_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Breakfast', value: 'breakfast' },
  { label: 'Lunch', value: 'lunch' },
  { label: 'Dinner', value: 'dinner' },
  { label: 'Snack', value: 'snack' },
];

const NOVA_FILTERS = [
  { label: 'Any', value: null },
  { label: 'Nova ≤ 2', value: '2' },
  { label: 'Nova ≤ 3', value: '3' },
];

type LibraryRecipe = Recipe & { user_rating: number | null };

// Shown only when the recipes table returns zero results with no filters
// active (i.e. likely unseeded) — generated on tap via the existing
// mode=generate detail flow, not eagerly, to avoid 6 Claude calls per view.
const FALLBACK_SUGGESTIONS = [
  { name: 'Greek Yogurt Berry Parfait', slot: 'breakfast', protein_g: 26, calories: 280 },
  { name: 'Turkey & Egg Breakfast Bowl', slot: 'breakfast', protein_g: 32, calories: 360 },
  { name: 'Grilled Chicken Power Salad', slot: 'lunch', protein_g: 38, calories: 420 },
  { name: 'Lentil & Cottage Cheese Bowl', slot: 'lunch', protein_g: 30, calories: 390 },
  { name: 'Lemon Herb Baked Salmon', slot: 'dinner', protein_g: 36, calories: 480 },
  { name: 'Cottage Cheese & Cucumber Snack', slot: 'snack', protein_g: 18, calories: 180 },
];

// ── Animated filter chip ──────────────────────────────────────────────────────

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const colors = useThemeColors();
  const scale = useSharedValue(1);
  const bgAnim = useSharedValue(active ? 1 : 0);
  const prevActive = useRef(active);

  useEffect(() => {
    if (prevActive.current === active) return;
    prevActive.current = active;
    bgAnim.value = withTiming(active ? 1 : 0, { duration: 300 });
    if (active) scale.value = withSequence(withSpring(1.05), withSpring(1.0));
  }, [active]);

  const chipStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(bgAnim.value, [0, 1], [colors.card, colors.primary]),
    borderColor: interpolateColor(bgAnim.value, [0, 1], [colors.border, colors.primary]),
    transform: [{ scale: scale.value }],
  }));
  const textStyle = useAnimatedStyle(() => ({
    color: interpolateColor(bgAnim.value, [0, 1], [colors.mutedForeground, colors.primaryForeground]),
  }));

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Animated.View style={[chipS.chip, chipStyle]}>
        <Animated.Text style={[chipS.text, textStyle]}>{label}</Animated.Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const chipS = StyleSheet.create({
  chip: { borderRadius: Radius.full, borderWidth: 1.5, paddingHorizontal: Spacing.md, paddingVertical: 6 },
  text: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-SemiBold' },
});

// ── Library recipe card ───────────────────────────────────────────────────────

function RecipeCard({ item, index, onPress }: { item: LibraryRecipe; index: number; onPress: () => void }) {
  const colors = useThemeColors();
  const pressScale = useSharedValue(1);
  const delay = Math.min(index, 11) * 40;

  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: pressScale.value }] }));

  return (
    <Animated.View entering={FadeIn.delay(delay).duration(350)} style={pressStyle}>
      <TouchableOpacity
        style={[cardS.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={onPress}
        onPressIn={() => { pressScale.value = withTiming(0.96, { duration: 100, easing: Easing.out(Easing.quad) }); }}
        onPressOut={() => { pressScale.value = withSpring(1.0, { damping: 15, stiffness: 300 }); }}
        activeOpacity={1}
      >
        <View style={cardS.macro}>
          <Text style={cardS.protein}>{item.protein_g}g</Text>
          <Text style={[cardS.proteinLabel, { color: colors.mutedForeground }]}>protein</Text>
        </View>
        <Text style={[cardS.name, { color: colors.foreground }]} numberOfLines={2}>{item.name}</Text>
        <View style={cardS.footer}>
          <View style={cardS.meta}>
            <Ionicons name="time-outline" size={11} color={colors.mutedForeground} />
            <Text style={[cardS.metaText, { color: colors.mutedForeground }]}>{item.cook_time_mins}m</Text>
          </View>
          <View style={cardS.meta}>
            <Text style={[cardS.metaText, { color: colors.mutedForeground }]}>{item.calories} cal</Text>
          </View>
          {item.user_rating && (
            <View style={cardS.meta}>
              <Ionicons name="star" size={11} color="#F59E0B" />
              <Text style={[cardS.metaText, { color: colors.mutedForeground }]}>{item.user_rating}</Text>
            </View>
          )}
        </View>
        {item.nova_score <= 2 && (
          <View style={cardS.novaBadge}>
            <Text style={cardS.novaBadgeText}>Low Nova</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Saved recipe card ─────────────────────────────────────────────────────────

function SavedRecipeCard({ item, index, isPro, onPress }: { item: SavedRecipe; index: number; isPro: boolean; onPress: () => void }) {
  const colors = useThemeColors();
  const pressScale = useSharedValue(1);
  const delay = Math.min(index, 11) * 40;
  const isExpiring = !isPro && !!item.expires_at;

  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: pressScale.value }] }));

  return (
    <Animated.View entering={FadeIn.delay(delay).duration(350)} style={pressStyle}>
      <TouchableOpacity
        style={[cardS.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={onPress}
        onPressIn={() => { pressScale.value = withTiming(0.96, { duration: 100 }); }}
        onPressOut={() => { pressScale.value = withSpring(1.0, { damping: 15, stiffness: 300 }); }}
        activeOpacity={1}
      >
        <View style={cardS.macro}>
          <Text style={cardS.protein}>{item.protein_g ?? '—'}g</Text>
          <Text style={[cardS.proteinLabel, { color: colors.mutedForeground }]}>protein</Text>
        </View>
        <Text style={[cardS.name, { color: colors.foreground }]} numberOfLines={2}>{item.recipe_name}</Text>
        <View style={cardS.footer}>
          {item.meal_slot && (
            <View style={[cardS.meta, { backgroundColor: 'rgba(29,158,117,0.1)', borderRadius: Radius.full, paddingHorizontal: 6, paddingVertical: 2 }]}>
              <Text style={[cardS.metaText, { color: '#1D9E75' }]}>{item.meal_slot}</Text>
            </View>
          )}
          {item.total_time_min != null && (
            <View style={cardS.meta}>
              <Ionicons name="time-outline" size={11} color={colors.mutedForeground} />
              <Text style={[cardS.metaText, { color: colors.mutedForeground }]}>{item.total_time_min}m</Text>
            </View>
          )}
          {item.calories != null && (
            <Text style={[cardS.metaText, { color: colors.mutedForeground }]}>{item.calories} cal</Text>
          )}
        </View>
        {isExpiring && (
          <View style={[cardS.novaBadge, { backgroundColor: 'rgba(245,158,11,0.12)' }]}>
            <Text style={[cardS.novaBadgeText, { color: '#F59E0B' }]}>Expires Sun</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const cardS = StyleSheet.create({
  card: { width: CARD_WIDTH, borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.md, minHeight: 130 },
  macro: { flexDirection: 'row', alignItems: 'baseline', gap: 2, marginBottom: 4 },
  protein: { fontSize: FontSize.xl, fontFamily: 'PlusJakartaSans-ExtraBold', color: '#1D9E75' },
  proteinLabel: { fontSize: 10, fontFamily: 'PlusJakartaSans-Medium' },
  name: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-SemiBold', flex: 1, marginBottom: Spacing.sm },
  footer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap', marginTop: 'auto' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  metaText: { fontSize: 10, fontFamily: 'PlusJakartaSans-Medium' },
  novaBadge: { position: 'absolute', top: Spacing.sm, right: Spacing.sm, backgroundColor: 'rgba(29,158,117,0.12)', borderRadius: Radius.full, paddingHorizontal: 6, paddingVertical: 2 },
  novaBadgeText: { fontSize: 9, fontFamily: 'PlusJakartaSans-Bold', color: '#1D9E75' },
});

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonCard() {
  const colors = useThemeColors();
  const shimmer = useSharedValue(0.3);

  useEffect(() => {
    shimmer.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      ),
      -1, false,
    );
    return () => cancelAnimation(shimmer);
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({ opacity: shimmer.value }));

  return <Animated.View style={[cardS.card, { backgroundColor: colors.muted }, shimmerStyle]} />;
}

// ── Segment control ───────────────────────────────────────────────────────────

function SegmentControl({ value, onChange }: { value: 'library' | 'saved'; onChange: (v: 'library' | 'saved') => void }) {
  const colors = useThemeColors();
  return (
    <View style={[segS.wrap, { backgroundColor: colors.muted, borderColor: colors.border }]}>
      {(['library', 'saved'] as const).map(seg => (
        <TouchableOpacity
          key={seg}
          style={[segS.btn, value === seg && { backgroundColor: colors.primary }]}
          onPress={() => onChange(seg)}
          activeOpacity={0.8}
        >
          <Text style={[segS.text, { color: value === seg ? colors.primaryForeground : colors.mutedForeground }]}>
            {seg === 'library' ? 'Library' : 'Saved'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const segS = StyleSheet.create({
  wrap: { flexDirection: 'row', borderRadius: Radius.full, borderWidth: 1, padding: 3, marginHorizontal: Spacing.xl, marginBottom: Spacing.md },
  btn: { flex: 1, paddingVertical: 8, borderRadius: Radius.full, alignItems: 'center' },
  text: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-ExtraBold' },
});

// ── Main screen ───────────────────────────────────────────────────────────────

export default function Recipes() {
  const colors = useThemeColors();
  const s = makeStyles(colors);
  const router = useRouter();
  const { customerInfo } = useRevenueCat();
  const isPro = !!customerInfo?.entitlements.active[ENTITLEMENT_ID];
  const requirePro = usePaywallGate();

  const [segment, setSegment] = useState<'library' | 'saved'>('library');

  // Library state
  const [libraryRecipes, setLibraryRecipes] = useState<LibraryRecipe[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [mealTypeFilter, setMealTypeFilter] = useState('all');
  const [novaFilter, setNovaFilter] = useState<string | null>(null);

  // Saved state
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [savedSlotFilter, setSavedSlotFilter] = useState('all');

  useEffect(() => {
    trackRecipeListViewed();
  }, []);

  // Library fetch
  const fetchLibrary = useCallback(async () => {
    setLibraryLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const params = new URLSearchParams({ limit: '40' });
      if (mealTypeFilter !== 'all') params.set('meal_type', mealTypeFilter);
      if (novaFilter) params.set('nova_max', novaFilter);
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/recipes?${params}`,
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );
      if (res.ok) setLibraryRecipes(await res.json());
    } finally {
      setLibraryLoading(false);
    }
  }, [mealTypeFilter, novaFilter]);

  useEffect(() => {
    if (segment === 'library') fetchLibrary();
  }, [segment, fetchLibrary]);

  // Saved fetch
  const fetchSaved = useCallback(async () => {
    setSavedLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('saved_recipes')
        .select('*')
        .eq('user_id', user.id)
        .order('saved_at', { ascending: false });

      // Free users: only show non-expired recipes
      if (!isPro) {
        const now = new Date().toISOString();
        query = query.or(`expires_at.is.null,expires_at.gt.${now}`);
      }

      if (savedSlotFilter !== 'all') {
        query = query.eq('meal_slot', savedSlotFilter);
      }

      const { data, error } = await query;
      if (!error && data) setSavedRecipes(data as SavedRecipe[]);
    } finally {
      setSavedLoading(false);
    }
  }, [isPro, savedSlotFilter]);

  useEffect(() => {
    if (segment === 'saved') fetchSaved();
  }, [segment, fetchSaved]);

  function renderSkeleton() {
    return (
      <View style={s.grid}>
        {[0, 1, 2, 3].map(i => <SkeletonCard key={i} />)}
      </View>
    );
  }

  function renderLibraryEmpty() {
    const noFiltersActive = mealTypeFilter === 'all' && novaFilter === null;
    if (!noFiltersActive) {
      return (
        <View style={s.emptyState}>
          <Text style={s.emptyIcon}>🥗</Text>
          <Text style={s.emptyTitle}>No recipes found</Text>
          <Text style={s.emptySubtitle}>Try adjusting your filters</Text>
        </View>
      );
    }
    // Library is genuinely empty (no filters narrowing it down) — offer
    // AI-generated suggestions instead of a dead end.
    return (
      <View style={s.fallbackSection}>
        <Text style={s.emptyIcon}>🥗</Text>
        <Text style={s.emptyTitle}>Building your recipe library</Text>
        <Text style={s.emptySubtitle}>Try one of these to get started:</Text>
        <View style={s.grid}>
          {FALLBACK_SUGGESTIONS.map((sugg) => (
            <TouchableOpacity
              key={sugg.name}
              style={[cardS.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              activeOpacity={0.85}
              onPress={() => {
                router.push({
                  pathname: '/(app)/recipe/[id]' as any,
                  params: {
                    id: 'generate',
                    mode: 'generate',
                    source: 'recipes',
                    mealName: sugg.name,
                    mealSlot: sugg.slot,
                    proteinG: String(sugg.protein_g),
                    calories: String(sugg.calories),
                  },
                });
              }}
            >
              <View style={cardS.macro}>
                <Text style={cardS.protein}>{sugg.protein_g}g</Text>
                <Text style={[cardS.proteinLabel, { color: colors.mutedForeground }]}>protein</Text>
              </View>
              <Text style={[cardS.name, { color: colors.foreground }]} numberOfLines={2}>{sugg.name}</Text>
              <View style={cardS.footer}>
                <Text style={[cardS.metaText, { color: colors.mutedForeground }]}>{sugg.calories} cal</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  function renderSavedEmpty() {
    return (
      <View style={s.emptyState}>
        <Ionicons name="bookmark-outline" size={48} color={colors.mutedForeground} />
        <Text style={s.emptyTitle}>No saved recipes</Text>
        <Text style={s.emptySubtitle}>
          {isPro
            ? 'Save recipes from your meal plan to build your collection.'
            : 'Save recipes from your meal plan to access them here. Free tier recipes expire every Sunday.'}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <View style={s.header}>
        <Text style={s.title}>Recipes</Text>
      </View>

      {/* Segment */}
      <SegmentControl value={segment} onChange={setSegment} />

      {/* Library tab */}
      {segment === 'library' && (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.filterRow}
            style={s.filterScroll}
          >
            {MEAL_TYPE_FILTERS.map(f => (
              <FilterChip
                key={f.value}
                label={f.label}
                active={mealTypeFilter === f.value}
                onPress={() => setMealTypeFilter(f.value)}
              />
            ))}
            <View style={s.chipDivider} />
            {NOVA_FILTERS.map(f => (
              <FilterChip
                key={f.label}
                label={f.label}
                active={novaFilter === f.value}
                onPress={() => setNovaFilter(f.value)}
              />
            ))}
          </ScrollView>

          {libraryLoading ? renderSkeleton() : libraryRecipes.length === 0 ? renderLibraryEmpty() : (
            <FlatList
              data={libraryRecipes}
              keyExtractor={item => item.id}
              numColumns={2}
              columnWrapperStyle={s.row}
              contentContainerStyle={s.listContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item, index }) => (
                <RecipeCard
                  item={item}
                  index={index}
                  onPress={() => {
                    trackRecipeViewed({ recipe_id: item.id, recipe_name: item.name, meal_type: item.meal_type?.[0] ?? '' });
                    router.push({ pathname: '/(app)/recipe/[id]' as any, params: { id: item.id } });
                  }}
                />
              )}
            />
          )}
        </>
      )}

      {/* Saved tab */}
      {segment === 'saved' && (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.filterRow}
            style={s.filterScroll}
          >
            {MEAL_TYPE_FILTERS.map(f => (
              <FilterChip
                key={f.value}
                label={f.label}
                active={savedSlotFilter === f.value}
                onPress={() => setSavedSlotFilter(f.value)}
              />
            ))}
          </ScrollView>

          {!isPro && (
            <View style={s.freeBanner}>
              <Ionicons name="time-outline" size={14} color="#F59E0B" />
              <Text style={s.freeBannerText}>Free recipes expire every Sunday · </Text>
              <TouchableOpacity onPress={() => { requirePro('recipe_upsell'); }}>
                <Text style={s.freeBannerLink}>Go Pro</Text>
              </TouchableOpacity>
            </View>
          )}

          {savedLoading ? renderSkeleton() : savedRecipes.length === 0 ? renderSavedEmpty() : (
            <FlatList
              data={savedRecipes}
              keyExtractor={item => item.id}
              numColumns={2}
              columnWrapperStyle={s.row}
              contentContainerStyle={s.listContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item, index }) => (
                <SavedRecipeCard
                  item={item}
                  index={index}
                  isPro={isPro}
                  onPress={() => {
                    trackRecipeViewed({ recipe_id: item.id, recipe_name: item.recipe_name, meal_type: item.meal_slot ?? '', source: 'saved' });
                    router.push({ pathname: '/(app)/recipe/[id]' as any, params: { id: item.id, source: 'saved' } });
                  }}
                />
              )}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    header: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
    title: { fontSize: FontSize['2xl'], fontFamily: 'PlusJakartaSans-ExtraBold', color: c.foreground },
    filterScroll: { flexGrow: 0 },
    filterRow: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.lg, gap: Spacing.sm, flexDirection: 'row', alignItems: 'center' },
    chipDivider: { width: 1, height: 20, backgroundColor: c.border, marginHorizontal: Spacing.xs },
    grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.xl, gap: Spacing.md },
    listContent: { paddingHorizontal: Spacing.xl, paddingBottom: 120 },
    row: { gap: Spacing.md, marginBottom: Spacing.md },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingBottom: 80, paddingHorizontal: Spacing.xl, paddingTop: Spacing['3xl'] },
    emptyIcon: { fontSize: 48 },
    emptyTitle: { fontSize: FontSize.lg, fontFamily: 'PlusJakartaSans-ExtraBold', color: c.foreground },
    emptySubtitle: { fontSize: FontSize.sm, color: c.mutedForeground, textAlign: 'center', lineHeight: 20 },
    fallbackSection: { alignItems: 'center', gap: Spacing.sm, paddingTop: Spacing['2xl'], paddingBottom: Spacing.lg },
    freeBanner: { flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.xl, marginBottom: Spacing.md, backgroundColor: 'rgba(245,158,11,0.08)', borderRadius: Radius.lg, padding: Spacing.md, gap: 4 },
    freeBannerText: { fontSize: FontSize.xs, color: '#F59E0B', fontFamily: 'PlusJakartaSans-SemiBold' },
    freeBannerLink: { fontSize: FontSize.xs, color: '#1D9E75', fontFamily: 'PlusJakartaSans-ExtraBold' },
  });
}
