import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { supabase, Recipe } from '@/lib/supabase';
import { FontSize, Spacing, Radius, ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/context/ThemeContext';
import { trackRecipeRated, trackRecipeAddedToPlan } from '@/lib/analytics';

type RecipeWithRating = Recipe & { user_rating: number | null };

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SLOTS = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function RecipeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();
  const s = makeStyles(colors);
  const router = useRouter();
  const [recipe, setRecipe] = useState<RecipeWithRating | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState<number | null>(null);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [selectedSlot, setSelectedSlot] = useState('dinner');
  const [addingToPlan, setAddingToPlan] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/recipes?id=${id}`,
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        const found = Array.isArray(data) ? data[0] : data;
        setRecipe(found ?? null);
        setRating(found?.user_rating ?? null);
      }
      setLoading(false);
    })();
  }, [id]);

  async function handleRate(stars: number) {
    if (!recipe) return;
    setRatingLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/recipes`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ recipe_id: recipe.id, rating: stars }),
        }
      );
      if (res.ok) {
        setRating(stars);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        trackRecipeRated({ recipe_id: recipe.id, rating: stars });
      }
    } finally {
      setRatingLoading(false);
    }
  }

  async function handleAddToPlan() {
    if (!recipe) return;
    setAddingToPlan(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: plan } = await supabase
        .from('meal_plans')
        .select('id, meal_plan')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (!plan) { Alert.alert('No plan', 'Generate a meal plan first.'); return; }

      const mealPlan = plan.meal_plan as Record<string, Record<string, { name: string; protein_g?: number }>>;
      const day = selectedDay.toLowerCase();
      if (!mealPlan[day]) mealPlan[day] = {};
      mealPlan[day][selectedSlot] = { name: recipe.name, protein_g: recipe.protein_g };

      await supabase.from('meal_plans').update({ meal_plan: mealPlan }).eq('id', plan.id);
      trackRecipeAddedToPlan({ recipe_id: recipe.id, day, slot: selectedSlot });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAddSheetOpen(false);
      Alert.alert('Added!', `${recipe.name} added to ${selectedDay} ${selectedSlot}.`);
    } finally {
      setAddingToPlan(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.loadingCenter}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!recipe) {
    return (
      <SafeAreaView style={s.safe}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={s.loadingCenter}>
          <Text style={s.emptyText}>Recipe not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {/* Back */}
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
          <Text style={s.backText}>Recipes</Text>
        </TouchableOpacity>

        {/* Title block */}
        <View style={s.titleBlock}>
          <Text style={s.recipeName}>{recipe.name}</Text>
          <View style={s.metaRow}>
            {recipe.meal_type?.map(t => (
              <View key={t} style={s.typeChip}>
                <Text style={s.typeChipText}>{t}</Text>
              </View>
            ))}
            {recipe.dietitian_reviewed && (
              <View style={[s.typeChip, s.reviewedChip]}>
                <Ionicons name="checkmark-circle" size={11} color="#1D9E75" />
                <Text style={[s.typeChipText, { color: '#1D9E75' }]}>Reviewed</Text>
              </View>
            )}
          </View>
        </View>

        {/* Macro strip */}
        <View style={s.macroStrip}>
          {[
            { label: 'Protein', value: `${recipe.protein_g}g`, accent: true },
            { label: 'Calories', value: `${recipe.calories}` },
            { label: 'Cook', value: `${recipe.cook_time_mins}m` },
            { label: 'Serves', value: `${recipe.serving_size}` },
          ].map(m => (
            <View key={m.label} style={s.macroItem}>
              <Text style={[s.macroValue, m.accent && s.macroAccent]}>{m.value}</Text>
              <Text style={s.macroLabel}>{m.label}</Text>
            </View>
          ))}
        </View>

        {/* Skill / Nova info row */}
        <View style={s.infoRow}>
          {recipe.skill_level && (
            <View style={s.infoPill}>
              <Ionicons name="flame-outline" size={13} color={colors.mutedForeground} />
              <Text style={s.infoPillText}>{recipe.skill_level}</Text>
            </View>
          )}
          {recipe.nova_score && (
            <View style={s.infoPill}>
              <Text style={s.infoPillText}>Nova {recipe.nova_score}</Text>
            </View>
          )}
          {recipe.budget_tier && (
            <View style={s.infoPill}>
              <Ionicons name="wallet-outline" size={13} color={colors.mutedForeground} />
              <Text style={s.infoPillText}>{recipe.budget_tier}</Text>
            </View>
          )}
        </View>

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

        {/* Rating */}
        <Text style={s.sectionHeader}>Rate this recipe</Text>
        <View style={s.ratingRow}>
          {[1, 2, 3, 4, 5].map(star => (
            <TouchableOpacity
              key={star}
              onPress={() => !ratingLoading && handleRate(star)}
              disabled={ratingLoading}
              activeOpacity={0.7}
            >
              <Ionicons
                name={(rating ?? 0) >= star ? 'star' : 'star-outline'}
                size={32}
                color={(rating ?? 0) >= star ? '#F59E0B' : colors.border}
              />
            </TouchableOpacity>
          ))}
          {ratingLoading && <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 8 }} />}
        </View>

        {/* Add to plan button */}
        <TouchableOpacity
          style={s.addBtn}
          onPress={() => setAddSheetOpen(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="add-circle-outline" size={20} color={colors.primaryForeground} />
          <Text style={s.addBtnText}>Add to Meal Plan</Text>
        </TouchableOpacity>

        {/* Allergens footer */}
        {recipe.allergens && recipe.allergens.length > 0 && (
          <Text style={s.allergenNote}>Contains: {recipe.allergens.join(', ')}</Text>
        )}
      </ScrollView>

      {/* Add to plan sheet */}
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
    scroll: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing['3xl'] },
    loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyText: { fontSize: FontSize.base, color: c.mutedForeground },

    backBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.lg, gap: 4 },
    backText: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-SemiBold', color: c.foreground },

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

    infoRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing['2xl'], flexWrap: 'wrap' },
    infoPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: c.muted, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
    infoPillText: { fontSize: FontSize.xs, color: c.mutedForeground, fontFamily: 'PlusJakartaSans-Medium', textTransform: 'capitalize' },

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

    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing['2xl'] },

    addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: '#1D9E75', borderRadius: Radius.lg, paddingVertical: 16, marginBottom: Spacing.lg },
    addBtnText: { fontSize: FontSize.base, fontFamily: 'PlusJakartaSans-ExtraBold', color: '#fff' },

    allergenNote: { fontSize: FontSize.xs, color: c.mutedForeground, textAlign: 'center', fontStyle: 'italic' },

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
