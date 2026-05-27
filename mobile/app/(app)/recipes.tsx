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
  withTiming, withSpring, withRepeat, withSequence, withDelay,
  cancelAnimation, FadeIn,
  Easing,
} from 'react-native-reanimated';
import { supabase, Recipe } from '@/lib/supabase';
import { FontSize, Spacing, Radius, ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/context/ThemeContext';
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

type RecipeWithRating = Recipe & { user_rating: number | null };

// Animated filter chip
function FilterChip({
  label, active, onPress,
}: {
  label: string; active: boolean; onPress: () => void;
}) {
  const colors = useThemeColors();
  const scale = useSharedValue(1);
  const bgAnim = useSharedValue(active ? 1 : 0);
  const prevActive = useRef(active);

  useEffect(() => {
    if (prevActive.current === active) return;
    prevActive.current = active;
    bgAnim.value = withTiming(active ? 1 : 0, { duration: 300 });
    if (active) {
      scale.value = withSequence(withSpring(1.05), withSpring(1.0));
    }
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

// Animated recipe card
function RecipeCard({
  item, index, onPress,
}: {
  item: RecipeWithRating; index: number; onPress: () => void;
}) {
  const colors = useThemeColors();
  const pressScale = useSharedValue(1);
  const delay = Math.min(index, 11) * 40;

  function onPressIn() {
    pressScale.value = withTiming(0.96, { duration: 100, easing: Easing.out(Easing.quad) });
  }
  function onPressOut() {
    pressScale.value = withSpring(1.0, { damping: 15, stiffness: 300 });
  }

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  return (
    <Animated.View entering={FadeIn.delay(delay).duration(350)} style={pressStyle}>
      <TouchableOpacity
        style={[cardS.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
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

// Animated skeleton card
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

  return (
    <Animated.View
      style={[cardS.card, { backgroundColor: colors.muted }, shimmerStyle]}
    />
  );
}

export default function Recipes() {
  const colors = useThemeColors();
  const s = makeStyles(colors);
  const router = useRouter();
  const [recipes, setRecipes] = useState<RecipeWithRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [mealTypeFilter, setMealTypeFilter] = useState('all');
  const [novaFilter, setNovaFilter] = useState<string | null>(null);

  useEffect(() => {
    trackRecipeListViewed();
  }, []);

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
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
      if (res.ok) {
        const data = await res.json();
        setRecipes(data);
      }
    } finally {
      setLoading(false);
    }
  }, [mealTypeFilter, novaFilter]);

  useEffect(() => { fetchRecipes(); }, [fetchRecipes]);

  function renderSkeleton() {
    return (
      <View style={s.grid}>
        {[0, 1, 2, 3].map(i => <SkeletonCard key={i} />)}
      </View>
    );
  }

  function renderEmpty() {
    return (
      <View style={s.emptyState}>
        <Text style={s.emptyIcon}>🥗</Text>
        <Text style={s.emptyTitle}>No recipes found</Text>
        <Text style={s.emptySubtitle}>Try adjusting your filters</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <View style={s.header}>
        <Text style={s.title}>Recipes</Text>
      </View>

      {/* Meal type chips */}
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

      {loading ? (
        renderSkeleton()
      ) : recipes.length === 0 ? (
        renderEmpty()
      ) : (
        <FlatList
          data={recipes}
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
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingBottom: 80 },
    emptyIcon: { fontSize: 48 },
    emptyTitle: { fontSize: FontSize.lg, fontFamily: 'PlusJakartaSans-ExtraBold', color: c.foreground },
    emptySubtitle: { fontSize: FontSize.sm, color: c.mutedForeground },
  });
}
