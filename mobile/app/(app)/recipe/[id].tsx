import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Modal, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  withRepeat, withSequence, cancelAnimation, Easing,
} from 'react-native-reanimated';
import { supabase, Recipe, SavedRecipe } from '@/lib/supabase';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';
import { FontSize, Spacing, Radius, ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/context/ThemeContext';
import { useRevenueCat, ENTITLEMENT_ID } from '@/context/RevenueCatContext';
import { usePaywallGate } from '@/lib/usePaywallGate';
import {
  trackRecipeRated, trackRecipeAddedToPlan, trackRecipeViewed,
  trackRecipeStepsViewed, trackRecipeGenerated, trackRecipeSaved, trackRecipeUpsellShown,
} from '@/lib/analytics';
import { CHECKIN_TIMEOUT_MS } from '@/lib/constants';
import { logError } from '@/lib/utils';

type LibraryRecipe = Recipe & { user_rating: number | null };

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SLOTS = ['breakfast', 'lunch', 'dinner', 'snack'];

function nextSundayMidnightUTC(): string {
  const now = new Date();
  const day = now.getUTCDay();
  const daysUntilSunday = day === 0 ? 7 : 7 - day;
  return new Date(Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntilSunday
  )).toISOString();
}

// ── Skeleton shimmer ─────────────────────────────────────────────────────────

function SkeletonLine({ width, height = 14, mb = 8 }: { width: string | number; height?: number; mb?: number }) {
  const colors = useThemeColors();
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      ),
      -1, false
    );
    return () => cancelAnimation(opacity);
  }, []);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[{ height, borderRadius: 6, backgroundColor: colors.muted, marginBottom: mb }, style, { width: width as any }]}
    />
  );
}

function GeneratingPreview({
  mealName, mealSlot, proteinG, calories, s,
}: {
  mealName: string; mealSlot?: string; proteinG?: string; calories?: string; s: ReturnType<typeof makeStyles>;
}) {
  return (
    <>
      <View style={s.titleBlock}>
        <Text style={s.recipeName}>{mealName}</Text>
        {mealSlot && (
          <View style={s.metaRow}>
            <View style={s.typeChip}>
              <Text style={s.typeChipText}>{mealSlot}</Text>
            </View>
          </View>
        )}
      </View>
      {(proteinG || calories) && (
        <View style={s.macroStrip}>
          {proteinG && (
            <View style={s.macroItem}>
              <Text style={[s.macroValue, s.macroAccent]}>{proteinG}g</Text>
              <Text style={s.macroLabel}>Protein</Text>
            </View>
          )}
          {calories && (
            <View style={s.macroItem}>
              <Text style={s.macroValue}>{calories}</Text>
              <Text style={s.macroLabel}>Calories</Text>
            </View>
          )}
        </View>
      )}
      <SkeletonLine width="30%" height={12} mb={Spacing.md} />
      {[0, 1, 2, 3].map(i => <SkeletonLine key={i} width={`${80 - i * 5}%`} height={14} mb={10} />)}
      <SkeletonLine width="30%" height={12} mb={Spacing.md} />
      {[0, 1, 2].map(i => <SkeletonLine key={i} width={`${85 - i * 8}%`} height={14} mb={10} />)}
    </>
  );
}

function GenerateSkeleton({ colors }: { colors: ThemeColors }) {
  return (
    <View style={{ paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg }}>
      <SkeletonLine width="70%" height={28} mb={12} />
      <SkeletonLine width="40%" height={18} mb={Spacing.xl} />
      <View style={{ flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl }}>
        {[0, 1, 2, 3].map(i => (
          <SkeletonLine key={i} width={60} height={52} mb={0} />
        ))}
      </View>
      <SkeletonLine width="30%" height={12} mb={Spacing.md} />
      {[0, 1, 2, 3].map(i => (
        <SkeletonLine key={i} width={`${80 - i * 5}%`} height={14} mb={10} />
      ))}
      <SkeletonLine width="30%" height={12} mb={Spacing.md} />
      {[0, 1, 2].map(i => (
        <SkeletonLine key={i} width={`${85 - i * 8}%`} height={14} mb={10} />
      ))}
    </View>
  );
}

// ── Toast ────────────────────────────────────────────────────────────────────

function Toast({
  text, actionLabel, onAction, onDismiss,
}: {
  text: string; actionLabel?: string; onAction?: () => void; onDismiss: () => void;
}) {
  const colors = useThemeColors();
  const ty = useSharedValue(120);

  useEffect(() => {
    ty.value = withSpring(0, { damping: 20, stiffness: 220 });
    const t = setTimeout(() => {
      ty.value = withTiming(120, { duration: 300 });
      setTimeout(onDismiss, 350);
    }, 4000);
    return () => clearTimeout(t);
  }, []);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: ty.value }] }));

  return (
    <Animated.View style={[toastS.wrap, style, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Ionicons name="checkmark-circle" size={18} color="#1D9E75" />
      <Text style={[toastS.text, { color: colors.foreground }]} numberOfLines={2}>{text}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
          <Text style={toastS.action}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const toastS = StyleSheet.create({
  wrap: {
    position: 'absolute', bottom: 100, left: Spacing.xl, right: Spacing.xl,
    borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  text: { flex: 1, fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-SemiBold', lineHeight: 18 },
  action: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-ExtraBold', color: '#1D9E75', flexShrink: 0 },
});

// ── Generated / Saved recipe view ────────────────────────────────────────────

function GeneratedRecipeView({
  recipe,
  savedId,
  isPro,
  colors,
  s,
  onAddToWeek,
  addingToWeek,
}: {
  recipe: SavedRecipe;
  savedId: string | null;
  isPro: boolean;
  colors: ThemeColors;
  s: ReturnType<typeof makeStyles>;
  onAddToWeek: () => void;
  addingToWeek: boolean;
}) {
  const isSaved = !!savedId;
  const expiryLabel = !isPro && recipe.expires_at
    ? `Expires ${new Date(recipe.expires_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`
    : null;

  return (
    <>
      {/* Title */}
      <View style={s.titleBlock}>
        <Text style={s.recipeName}>{recipe.recipe_name}</Text>
        <View style={s.metaRow}>
          {recipe.meal_slot && (
            <View style={s.typeChip}>
              <Text style={s.typeChipText}>{recipe.meal_slot}</Text>
            </View>
          )}
          {recipe.injection_day_friendly && (
            <View style={[s.typeChip, s.reviewedChip]}>
              <Ionicons name="medical-outline" size={11} color="#1D9E75" />
              <Text style={[s.typeChipText, { color: '#1D9E75' }]}>Injection-day gentle</Text>
            </View>
          )}
        </View>
      </View>

      {/* Macro strip */}
      <View style={s.macroStrip}>
        {[
          { label: 'Protein', value: `${recipe.protein_g ?? '—'}g`, accent: true },
          { label: 'Calories', value: `${recipe.calories ?? '—'}` },
          { label: 'Fiber', value: `${recipe.fiber_g ?? '—'}g` },
          { label: 'Cost', value: recipe.estimated_cost ? `$${Number(recipe.estimated_cost).toFixed(2)}` : '—' },
        ].map(m => (
          <View key={m.label} style={s.macroItem}>
            <Text style={[s.macroValue, m.accent && s.macroAccent]}>{m.value}</Text>
            <Text style={s.macroLabel}>{m.label}</Text>
          </View>
        ))}
      </View>

      {/* Time / servings row */}
      <View style={s.infoRow}>
        {recipe.total_time_min != null && (
          <View style={s.infoPill}>
            <Ionicons name="time-outline" size={13} color={colors.mutedForeground} />
            <Text style={s.infoPillText}>{recipe.total_time_min} min total</Text>
          </View>
        )}
        {recipe.prep_time_min != null && (
          <View style={s.infoPill}>
            <Text style={s.infoPillText}>{recipe.prep_time_min}m prep</Text>
          </View>
        )}
        {recipe.cook_time_min != null && (
          <View style={s.infoPill}>
            <Text style={s.infoPillText}>{recipe.cook_time_min}m cook</Text>
          </View>
        )}
        {recipe.servings != null && (
          <View style={s.infoPill}>
            <Ionicons name="people-outline" size={13} color={colors.mutedForeground} />
            <Text style={s.infoPillText}>Serves {recipe.servings}</Text>
          </View>
        )}
      </View>

      {/* Tags */}
      {recipe.tags && recipe.tags.length > 0 && (
        <View style={s.tagsRow}>
          {recipe.tags.map(tag => (
            <View key={tag} style={s.tagChip}>
              <Text style={s.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Nori tip */}
      {recipe.nori_tip && (
        <View style={[s.noriCard, { backgroundColor: 'rgba(29,158,117,0.08)', borderColor: 'rgba(29,158,117,0.2)' }]}>
          <Image
            source={require('../../../assets/nori/NoriIcon.png')}
            style={s.noriAvatar}
          />
          <View style={{ flex: 1 }}>
            <Text style={[s.noriLabel, { color: '#1D9E75' }]}>Nori&apos;s tip</Text>
            <Text style={[s.noriTip, { color: colors.foreground }]}>{recipe.nori_tip}</Text>
          </View>
        </View>
      )}

      {/* Ingredients */}
      <Text style={s.sectionHeader}>Ingredients</Text>
      <View style={s.card}>
        {recipe.ingredients?.map((ing, i) => (
          <View key={i} style={[s.ingredientRow, i < recipe.ingredients.length - 1 && s.rowBorder]}>
            <Text style={s.ingredientQty}>{ing.qty} {ing.unit}</Text>
            <Text style={s.ingredientName}>{ing.name}</Text>
          </View>
        ))}
      </View>

      {/* Instructions */}
      <Text style={s.sectionHeader}>Instructions</Text>
      <View style={s.card}>
        {recipe.instructions?.map((step, i) => (
          <View key={i} style={[s.stepRow, i < recipe.instructions.length - 1 && s.rowBorder]}>
            <View style={s.stepNum}>
              <Text style={s.stepNumText}>{i + 1}</Text>
            </View>
            <Text style={s.stepText}>{step}</Text>
          </View>
        ))}
      </View>

      {/* Saved status — the save action itself now lives in the header */}
      {isSaved && !isPro && (
        <Text style={[s.savedExpiryNote, { color: colors.mutedForeground }]}>
          Saved · {expiryLabel ?? 'Expires Sunday'}
        </Text>
      )}

      <TouchableOpacity
        style={[s.addBtn, addingToWeek && { opacity: 0.6 }]}
        onPress={onAddToWeek}
        disabled={addingToWeek}
        activeOpacity={0.85}
      >
        {addingToWeek ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Ionicons name="calendar-outline" size={20} color="#fff" />
            <Text style={s.addBtnText}>Add to this week</Text>
          </>
        )}
      </TouchableOpacity>
    </>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function RecipeDetail() {
  const {
    id,
    mealName, mealSlot, proteinG, calories: calParam, mealPlanId,
    source,
  } = useLocalSearchParams<{
    id: string;
    mealName?: string; mealSlot?: string; proteinG?: string; calories?: string; mealPlanId?: string;
    source?: 'meal_plan' | 'home' | 'recipes' | 'saved';
  }>();

  // 'gen-<day>-<slot>' unique IDs from meal-plan, or legacy 'generate'
  const isGenerate = !!(id?.startsWith('gen-') || id === 'generate');
  const isSavedSource = source === 'saved';
  const isLibrary = !isGenerate && !isSavedSource;

  const colors = useThemeColors();
  const s = makeStyles(colors);
  const router = useRouter();
  const { customerInfo } = useRevenueCat();
  const requirePro = usePaywallGate();
  const isPro = !!customerInfo?.entitlements.active[ENTITLEMENT_ID];

  // Library recipe state
  const [libraryRecipe, setLibraryRecipe] = useState<LibraryRecipe | null>(null);
  const [libraryLoading, setLibraryLoading] = useState(isLibrary);
  const [rating, setRating] = useState<number | null>(null);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [selectedSlot, setSelectedSlot] = useState('dinner');
  const [addingToPlan, setAddingToPlan] = useState(false);
  const [addingToWeek, setAddingToWeek] = useState(false);

  // Generated / saved recipe state
  const [generatedRecipe, setGeneratedRecipe] = useState<SavedRecipe | null>(null);
  const [generating, setGenerating] = useState(isGenerate || isSavedSource);
  const [savedId, setSavedId] = useState<string | null>(isSavedSource ? id : null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [toast, setToast] = useState<{ text: string; action?: string } | null>(null);

  const instructionsY = useRef(0);
  const stepsFired = useRef(false);

  // ── Loaders ──────────────────────────────────────────────────────────────

  useEffect(() => {
    // Reset all transient state whenever the target meal/recipe changes.
    // This fires on first mount AND whenever params change (e.g. user taps a
    // different meal while the screen is still alive in the navigator stack).
    setGeneratedRecipe(null);
    setSavedId(isSavedSource ? id : null);
    setGenerating(isGenerate || isSavedSource);
    setLibraryRecipe(null);
    setLibraryLoading(isLibrary);
    setRating(null);
    setToast(null);
    setSaveLoading(false);
    instructionsY.current = 0;
    stepsFired.current = false;

    if (isLibrary) { loadLibraryRecipe(); return; }
    if (isGenerate) { loadGeneratedRecipe(); return; }
    if (isSavedSource) { loadSavedRecipe(); return; }
  // loadXxx functions close over the params already in deps — no need to list them
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, mealName, mealSlot, mealPlanId, source]);

  async function loadLibraryRecipe() {
    if (!id) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/recipes?id=${id}`,
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        const found = Array.isArray(data) ? data[0] : data;
        setLibraryRecipe(found ?? null);
        setRating(found?.user_rating ?? null);
        if (found) trackRecipeViewed({ recipe_id: found.id, recipe_name: found.name, meal_type: found.meal_type?.[0] ?? '', source: 'recipe_detail' });
      }
    } finally {
      setLibraryLoading(false);
    }
  }

  async function loadSavedRecipe() {
    try {
      const { data, error } = await supabase
        .from('saved_recipes')
        .select('*')
        .eq('id', id)
        .single();
      if (!error && data) {
        setGeneratedRecipe(data as SavedRecipe);
        setSavedId(data.id);
      }
    } finally {
      setGenerating(false);
    }
  }

  async function loadGeneratedRecipe() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setGenerating(false); return; }

      // Check if already saved for this plan slot
      if (mealPlanId && mealSlot) {
        const { data: existing } = await supabase
          .from('saved_recipes')
          .select('*')
          .eq('user_id', user.id)
          .eq('meal_plan_id', mealPlanId)
          .eq('meal_slot', mealSlot)
          .maybeSingle();

        if (existing) {
          setGeneratedRecipe(existing as SavedRecipe);
          setSavedId(existing.id);
          setGenerating(false);
          return;
        }
      }

      // Not saved yet — call the edge function
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setGenerating(false); return; }

      const res = await fetchWithTimeout(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/recipe-generate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({
            meal_name: mealName,
            meal_slot: mealSlot,
            protein_g: proteinG ? parseFloat(proteinG) : undefined,
            calories: calParam ? parseFloat(calParam) : undefined,
          }),
        },
        CHECKIN_TIMEOUT_MS
      );

      if (res.ok) {
        const data = await res.json();
        // Shape the edge function response into a SavedRecipe for display
        const draft: SavedRecipe = {
          id: '',
          user_id: user.id,
          meal_plan_id: mealPlanId ?? null,
          recipe_name: data.recipe_name ?? mealName ?? 'Recipe',
          meal_slot: mealSlot ?? null,
          ingredients: data.ingredients ?? [],
          instructions: data.instructions ?? [],
          prep_time_min: data.prep_time_min ?? null,
          cook_time_min: data.cook_time_min ?? null,
          total_time_min: data.total_time_min ?? null,
          servings: data.servings ?? 1,
          protein_g: data.protein_g ?? null,
          calories: data.calories ?? null,
          fiber_g: data.fiber_g ?? null,
          estimated_cost: data.estimated_cost ?? null,
          tags: data.tags ?? [],
          injection_day_friendly: data.injection_day_friendly ?? false,
          nori_tip: data.nori_tip ?? null,
          saved_at: new Date().toISOString(),
          expires_at: null,
        };
        setGeneratedRecipe(draft);
        trackRecipeGenerated({ meal_name: mealName ?? '', meal_slot: mealSlot ?? '' });
      } else {
        Alert.alert('Could not generate recipe', 'Check your connection and try again.');
      }
    } catch (e: unknown) {
      logError('recipe-detail:loadGeneratedRecipe', e);
      Alert.alert('Error', 'Something went wrong generating this recipe.');
    } finally {
      setGenerating(false);
    }
  }

  // ── Save ─────────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!generatedRecipe || savedId) return;
    setSaveLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const expiresAt = isPro ? null : nextSundayMidnightUTC();

      const { data, error } = await supabase
        .from('saved_recipes')
        .insert({
          user_id: user.id,
          meal_plan_id: generatedRecipe.meal_plan_id,
          recipe_name: generatedRecipe.recipe_name,
          meal_slot: generatedRecipe.meal_slot,
          ingredients: generatedRecipe.ingredients,
          instructions: generatedRecipe.instructions,
          prep_time_min: generatedRecipe.prep_time_min,
          cook_time_min: generatedRecipe.cook_time_min,
          total_time_min: generatedRecipe.total_time_min,
          servings: generatedRecipe.servings,
          protein_g: generatedRecipe.protein_g,
          calories: generatedRecipe.calories,
          fiber_g: generatedRecipe.fiber_g,
          estimated_cost: generatedRecipe.estimated_cost,
          tags: generatedRecipe.tags,
          injection_day_friendly: generatedRecipe.injection_day_friendly,
          nori_tip: generatedRecipe.nori_tip,
          expires_at: expiresAt,
        })
        .select()
        .single();

      if (error) throw error;

      setSavedId(data.id);
      setGeneratedRecipe(prev => prev ? { ...prev, expires_at: expiresAt } : prev);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      trackRecipeSaved({ meal_name: generatedRecipe.recipe_name, meal_slot: generatedRecipe.meal_slot ?? '', is_pro: isPro });

      if (!isPro) {
        setToast({ text: 'Saved! Recipes expire every Sunday — upgrade to Pro to keep them forever.', action: 'Go Pro' });
        trackRecipeUpsellShown({ trigger: 'recipe_save' });
      }
    } catch (e: unknown) {
      logError('recipe-detail:handleSave', e);
      Alert.alert('Save failed', 'Could not save this recipe. Please try again.');
    } finally {
      setSaveLoading(false);
    }
  }

  async function handleGoProFromToast() {
    setToast(null);
    const purchased = await requirePro('recipe_upsell');
    if (purchased && savedId) {
      await supabase.from('saved_recipes').update({ expires_at: null }).eq('id', savedId);
      setGeneratedRecipe(prev => prev ? { ...prev, expires_at: null } : prev);
    }
  }

  // ── Library helpers ──────────────────────────────────────────────────────

  function handleScroll(e: { nativeEvent: { contentOffset: { y: number } } }) {
    if (!libraryRecipe || stepsFired.current || instructionsY.current === 0) return;
    if (e.nativeEvent.contentOffset.y >= instructionsY.current - 100) {
      trackRecipeStepsViewed({ recipe_name: libraryRecipe.name });
      stepsFired.current = true;
    }
  }

  async function handleRate(stars: number) {
    if (!libraryRecipe) return;
    setRatingLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/recipes`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ recipe_id: libraryRecipe.id, rating: stars }),
        }
      );
      if (res.ok) {
        setRating(stars);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        trackRecipeRated({ recipe_id: libraryRecipe.id, rating: stars });
      }
    } finally {
      setRatingLoading(false);
    }
  }

  async function handleAddToPlan() {
    if (!libraryRecipe) return;
    setAddingToPlan(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: plan } = await supabase
        .from('meal_plans')
        .select('id, plan_json')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (!plan) { Alert.alert('No plan', 'Generate a meal plan first.'); return; }

      const planJson = plan.plan_json as { days: Array<{ day: string; meals: Array<{ slot: string; name: string; protein_g: number; calories: number }> }> };
      const dayName = selectedDay.toLowerCase();
      const dayEntry = planJson.days?.find(d => d.day.toLowerCase() === dayName);
      if (!dayEntry) { Alert.alert('Day not found', `${selectedDay} is not in your current plan.`); return; }

      const newMeal = { slot: selectedSlot, name: libraryRecipe.name, protein_g: libraryRecipe.protein_g, calories: libraryRecipe.calories };
      const slotIdx = dayEntry.meals.findIndex(m => m.slot.toLowerCase() === selectedSlot);
      if (slotIdx >= 0) { dayEntry.meals[slotIdx] = newMeal; } else { dayEntry.meals.push(newMeal); }

      await supabase.from('meal_plans').update({ plan_json: planJson }).eq('id', plan.id);
      trackRecipeAddedToPlan({ recipe_id: libraryRecipe.id, day: dayName, slot: selectedSlot });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAddSheetOpen(false);
      Alert.alert('Added!', `${libraryRecipe.name} added to ${selectedDay} ${selectedSlot}.`);
    } finally {
      setAddingToPlan(false);
    }
  }

  // One-tap "add to this week" for a saved/generated recipe — finds the
  // current plan and overwrites the next occurrence of this recipe's own
  // meal slot, starting from today, instead of showing a day/slot picker.
  async function handleAddToWeek() {
    if (!generatedRecipe) return;
    setAddingToWeek(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: plan } = await supabase
        .from('meal_plans')
        .select('id, plan_json')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (!plan) { Alert.alert('No plan', 'Generate a meal plan first.'); return; }

      const planJson = plan.plan_json as { days: Array<{ day: string; meals: Array<{ slot: string; name: string; protein_g: number; calories: number }> }> };
      const targetSlot = (generatedRecipe.meal_slot ?? 'dinner').toLowerCase();
      const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const days = planJson.days ?? [];
      const todayIdx = days.findIndex(d => d.day.toLowerCase() === todayName);
      // Next available slot = today's occurrence of this recipe's meal slot,
      // or the first day in the plan if today isn't in it.
      const dayEntry = todayIdx >= 0 ? days[todayIdx] : days[0];
      if (!dayEntry) { Alert.alert('No plan', 'Generate a meal plan first.'); return; }

      const newMeal = {
        slot: targetSlot,
        name: generatedRecipe.recipe_name,
        protein_g: generatedRecipe.protein_g ?? 0,
        calories: generatedRecipe.calories ?? 0,
      };
      const slotIdx = dayEntry.meals.findIndex(m => m.slot.toLowerCase() === targetSlot);
      if (slotIdx >= 0) { dayEntry.meals[slotIdx] = newMeal; } else { dayEntry.meals.push(newMeal); }

      await supabase.from('meal_plans').update({ plan_json: planJson }).eq('id', plan.id);
      trackRecipeAddedToPlan({ recipe_id: savedId ?? '', day: dayEntry.day, slot: targetSlot });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Added!', `${generatedRecipe.recipe_name} added to ${dayEntry.day} ${targetSlot}.`);
    } catch (e: unknown) {
      logError('recipe-detail:handleAddToWeek', e);
      Alert.alert('Could not add', 'Something went wrong. Please try again.');
    } finally {
      setAddingToWeek(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  const backLabel = source === 'meal_plan' ? 'Meal Plan'
    : source === 'home' ? 'Home'
    : isGenerate ? 'Meal Plan'
    : isSavedSource ? 'Recipes'
    : 'Recipes';

  function handleBackPress() {
    if (source === 'meal_plan') router.push('/(app)/meal-plan' as any);
    else if (source === 'home') router.push('/(app)/home' as any);
    else router.back();
  }

  const showSaveIcon = (isGenerate || isSavedSource) && !!generatedRecipe && !generating;

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        onScroll={isLibrary ? handleScroll : undefined}
        scrollEventThrottle={100}
      >
        {/* Header row */}
        <View style={s.headerRow}>
          <TouchableOpacity style={s.backBtn} onPress={handleBackPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="chevron-back" size={24} color={colors.foreground} />
            <Text style={s.backText}>{backLabel}</Text>
          </TouchableOpacity>

          {showSaveIcon && (
            <TouchableOpacity
              onPress={handleSave}
              disabled={saveLoading}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={s.saveIconBtn}
            >
              {saveLoading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons
                  name={savedId ? 'bookmark' : 'bookmark-outline'}
                  size={24}
                  color={savedId ? colors.primary : colors.foreground}
                />
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Generate mode */}
        {(isGenerate || isSavedSource) && (
          generating ? (
            mealName ? (
              <GeneratingPreview mealName={mealName} mealSlot={mealSlot} proteinG={proteinG} calories={calParam} s={s} />
            ) : (
              <GenerateSkeleton colors={colors} />
            )
          ) : generatedRecipe ? (
            <GeneratedRecipeView
              recipe={generatedRecipe}
              savedId={savedId}
              isPro={isPro}
              colors={colors}
              s={s}
              onAddToWeek={handleAddToWeek}
              addingToWeek={addingToWeek}
            />
          ) : (
            <View style={s.loadingCenter}>
              <Ionicons name="sad-outline" size={40} color={colors.mutedForeground} />
              <Text style={s.emptyText}>Could not generate recipe.</Text>
              <TouchableOpacity onPress={loadGeneratedRecipe} style={{ marginTop: Spacing.md }}>
                <Text style={{ color: '#1D9E75', fontFamily: 'PlusJakartaSans-SemiBold' }}>Try again</Text>
              </TouchableOpacity>
            </View>
          )
        )}

        {/* Library mode */}
        {isLibrary && (
          libraryLoading ? (
            <GenerateSkeleton colors={colors} />
          ) : !libraryRecipe ? (
            <View style={s.loadingCenter}>
              <Text style={s.emptyText}>Recipe not found.</Text>
            </View>
          ) : (
            <>
              <View style={s.titleBlock}>
                <Text style={s.recipeName}>{libraryRecipe.name}</Text>
                <View style={s.metaRow}>
                  {libraryRecipe.meal_type?.map(t => (
                    <View key={t} style={s.typeChip}>
                      <Text style={s.typeChipText}>{t}</Text>
                    </View>
                  ))}
                  {libraryRecipe.dietitian_reviewed && (
                    <View style={[s.typeChip, s.reviewedChip]}>
                      <Ionicons name="checkmark-circle" size={11} color="#1D9E75" />
                      <Text style={[s.typeChipText, { color: '#1D9E75' }]}>Reviewed</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={s.macroStrip}>
                {[
                  { label: 'Protein', value: `${libraryRecipe.protein_g}g`, accent: true },
                  { label: 'Calories', value: `${libraryRecipe.calories}` },
                  { label: 'Cook', value: `${libraryRecipe.cook_time_mins}m` },
                  { label: 'Serves', value: `${libraryRecipe.serving_size}` },
                ].map(m => (
                  <View key={m.label} style={s.macroItem}>
                    <Text style={[s.macroValue, m.accent && s.macroAccent]}>{m.value}</Text>
                    <Text style={s.macroLabel}>{m.label}</Text>
                  </View>
                ))}
              </View>

              <View style={s.infoRow}>
                {libraryRecipe.skill_level && (
                  <View style={s.infoPill}>
                    <Ionicons name="flame-outline" size={13} color={colors.mutedForeground} />
                    <Text style={s.infoPillText}>{libraryRecipe.skill_level}</Text>
                  </View>
                )}
                {libraryRecipe.nova_score && (
                  <View style={s.infoPill}>
                    <Text style={s.infoPillText}>Nova {libraryRecipe.nova_score}</Text>
                  </View>
                )}
                {libraryRecipe.budget_tier && (
                  <View style={s.infoPill}>
                    <Ionicons name="wallet-outline" size={13} color={colors.mutedForeground} />
                    <Text style={s.infoPillText}>{libraryRecipe.budget_tier}</Text>
                  </View>
                )}
              </View>

              <Text style={s.sectionHeader}>Ingredients</Text>
              <View style={s.card}>
                {libraryRecipe.ingredients?.map((ing, i) => (
                  <View key={i} style={[s.ingredientRow, i < libraryRecipe.ingredients.length - 1 && s.rowBorder]}>
                    <Text style={s.ingredientQty}>{ing.qty} {ing.unit}</Text>
                    <Text style={s.ingredientName}>{ing.name}</Text>
                  </View>
                ))}
              </View>

              <Text
                style={s.sectionHeader}
                onLayout={e => { instructionsY.current = e.nativeEvent.layout.y; }}
              >
                Instructions
              </Text>
              <View style={s.card}>
                {libraryRecipe.instructions?.map((step, i) => (
                  <View key={i} style={[s.stepRow, i < libraryRecipe.instructions.length - 1 && s.rowBorder]}>
                    <View style={s.stepNum}><Text style={s.stepNumText}>{i + 1}</Text></View>
                    <Text style={s.stepText}>{step}</Text>
                  </View>
                ))}
              </View>

              {libraryRecipe.allergens && libraryRecipe.allergens.length > 0 && (
                <Text style={s.allergenNote}>Contains: {libraryRecipe.allergens.join(', ')}</Text>
              )}

              <Text style={s.sectionHeader}>Rate this recipe</Text>
              <View style={s.ratingRow}>
                {[1, 2, 3, 4, 5].map(star => (
                  <TouchableOpacity key={star} onPress={() => !ratingLoading && handleRate(star)} disabled={ratingLoading} activeOpacity={0.7}>
                    <Ionicons
                      name={(rating ?? 0) >= star ? 'star' : 'star-outline'}
                      size={32}
                      color={(rating ?? 0) >= star ? '#F59E0B' : colors.border}
                    />
                  </TouchableOpacity>
                ))}
                {ratingLoading && <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 8 }} />}
              </View>

              <TouchableOpacity style={s.addBtn} onPress={() => setAddSheetOpen(true)} activeOpacity={0.85}>
                <Ionicons name="add-circle-outline" size={20} color="#fff" />
                <Text style={s.addBtnText}>Add to Meal Plan</Text>
              </TouchableOpacity>
            </>
          )
        )}
      </ScrollView>

      {/* Toast */}
      {toast && (
        <Toast
          text={toast.text}
          actionLabel={toast.action}
          onAction={toast.action ? handleGoProFromToast : undefined}
          onDismiss={() => setToast(null)}
        />
      )}

      {/* Add-to-plan sheet (library only) */}
      <Modal visible={addSheetOpen} transparent animationType="slide" onRequestClose={() => setAddSheetOpen(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setAddSheetOpen(false)} />
        <View style={[s.sheet, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <Text style={[s.sheetTitle, { color: colors.foreground }]}>Add to Meal Plan</Text>
          <Text style={[s.sheetLabel, { color: colors.mutedForeground }]}>Day</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.dayRow}>
            {DAYS.map(d => (
              <TouchableOpacity
                key={d}
                style={[s.dayChip, selectedDay === d && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                onPress={() => setSelectedDay(d)}
                activeOpacity={0.7}
              >
                <Text style={[s.dayChipText, { color: selectedDay === d ? colors.primaryForeground : colors.mutedForeground }]}>
                  {d.slice(0, 3)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Text style={[s.sheetLabel, { color: colors.mutedForeground, marginTop: Spacing.lg }]}>Meal slot</Text>
          <View style={s.slotRow}>
            {SLOTS.map(sl => (
              <TouchableOpacity
                key={sl}
                style={[s.slotChip, selectedSlot === sl && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                onPress={() => setSelectedSlot(sl)}
                activeOpacity={0.7}
              >
                <Text style={[s.slotChipText, { color: selectedSlot === sl ? colors.primaryForeground : colors.mutedForeground }]}>
                  {sl.charAt(0).toUpperCase() + sl.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[s.sheetBtn, { backgroundColor: colors.primary }, addingToPlan && { opacity: 0.6 }]}
            onPress={handleAddToPlan}
            disabled={addingToPlan}
            activeOpacity={0.85}
          >
            {addingToPlan
              ? <ActivityIndicator color={colors.primaryForeground} />
              : <Text style={[s.sheetBtnText, { color: colors.primaryForeground }]}>Add to Plan</Text>}
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    scroll: { paddingHorizontal: Spacing.xl, paddingBottom: 140 },
    loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: Spacing['3xl'], gap: Spacing.md },
    emptyText: { fontSize: FontSize.base, color: c.mutedForeground, fontFamily: 'PlusJakartaSans-SemiBold' },

    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: Spacing.lg },
    backBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.lg, gap: 4 },
    backText: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-SemiBold', color: c.foreground },
    saveIconBtn: { padding: Spacing.sm },

    titleBlock: { marginBottom: Spacing.lg },
    recipeName: { fontSize: FontSize['2xl'], fontFamily: 'PlusJakartaSans-ExtraBold', color: c.foreground, marginBottom: Spacing.sm },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
    typeChip: { borderRadius: Radius.full, borderWidth: 1, borderColor: c.border, paddingHorizontal: 8, paddingVertical: 3, flexDirection: 'row', alignItems: 'center', gap: 3 },
    typeChipText: { fontSize: 11, fontFamily: 'PlusJakartaSans-SemiBold', color: c.mutedForeground, textTransform: 'capitalize' },
    reviewedChip: { borderColor: 'rgba(29,158,117,0.3)', backgroundColor: 'rgba(29,158,117,0.06)' },

    macroStrip: { flexDirection: 'row', backgroundColor: c.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: c.border, marginBottom: Spacing.lg },
    macroItem: { flex: 1, alignItems: 'center', paddingVertical: Spacing.lg },
    macroValue: { fontSize: FontSize.lg, fontFamily: 'PlusJakartaSans-ExtraBold', color: c.foreground },
    macroAccent: { color: '#1D9E75' },
    macroLabel: { fontSize: 10, color: c.mutedForeground, fontFamily: 'PlusJakartaSans-Medium', marginTop: 2 },

    infoRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg, flexWrap: 'wrap' },
    infoPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: c.muted, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
    infoPillText: { fontSize: FontSize.xs, color: c.mutedForeground, fontFamily: 'PlusJakartaSans-Medium', textTransform: 'capitalize' },

    tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.lg },
    tagChip: { borderRadius: Radius.full, backgroundColor: 'rgba(29,158,117,0.1)', paddingHorizontal: 10, paddingVertical: 4 },
    tagText: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-SemiBold', color: '#1D9E75', textTransform: 'capitalize' },

    noriCard: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.lg, marginBottom: Spacing['2xl'] },
    noriAvatar: { width: 40, height: 40, borderRadius: 20 },
    noriLabel: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-ExtraBold', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
    noriTip: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Regular', lineHeight: 20 },

    sectionHeader: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-ExtraBold', color: c.mutedForeground, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: Spacing.sm },
    card: { backgroundColor: c.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: c.border, marginBottom: Spacing['2xl'], overflow: 'hidden' },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: c.border },

    ingredientRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: 12, gap: Spacing.md },
    ingredientQty: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Bold', color: '#1D9E75', width: 70 },
    ingredientName: { flex: 1, fontSize: FontSize.sm, color: c.foreground, fontFamily: 'PlusJakartaSans-Regular' },

    stepRow: { flexDirection: 'row', padding: Spacing.lg, gap: Spacing.md },
    stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#1D9E75', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
    stepNumText: { fontSize: 12, fontFamily: 'PlusJakartaSans-ExtraBold', color: '#fff' },
    stepText: { flex: 1, fontSize: FontSize.sm, color: c.foreground, lineHeight: 22, fontFamily: 'PlusJakartaSans-Regular' },

    addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: '#1D9E75', borderRadius: Radius.lg, paddingVertical: 16, marginBottom: Spacing.lg },
    addBtnText: { fontSize: FontSize.base, fontFamily: 'PlusJakartaSans-ExtraBold', color: '#fff' },
    savedExpiryNote: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-SemiBold', textAlign: 'center', marginBottom: Spacing.xl },

    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing['2xl'] },
    allergenNote: { fontSize: FontSize.xs, color: c.mutedForeground, textAlign: 'center', fontStyle: 'italic', marginBottom: Spacing.lg },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
    sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.xl, paddingBottom: 44, borderTopWidth: 1 },
    sheetTitle: { fontSize: FontSize.xl, fontFamily: 'PlusJakartaSans-ExtraBold', marginBottom: Spacing.xl },
    sheetLabel: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-ExtraBold', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.sm },
    dayRow: { flexDirection: 'row', gap: Spacing.sm, paddingBottom: 4 },
    dayChip: { borderRadius: Radius.full, borderWidth: 1.5, borderColor: c.border, paddingHorizontal: Spacing.md, paddingVertical: 8, backgroundColor: c.input },
    dayChipText: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-SemiBold' },
    slotRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl },
    slotChip: { borderRadius: Radius.full, borderWidth: 1.5, borderColor: c.border, paddingHorizontal: Spacing.md, paddingVertical: 8, backgroundColor: c.input },
    slotChipText: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-SemiBold' },
    sheetBtn: { borderRadius: Radius.lg, paddingVertical: 14, alignItems: 'center' },
    sheetBtnText: { fontSize: FontSize.base, fontFamily: 'PlusJakartaSans-ExtraBold' },
  });
}
