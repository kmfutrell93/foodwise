import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Image, TextInput, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeIn, useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { supabase, Profile } from '@/lib/supabase';
import { FontSize, Spacing, Radius, ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/context/ThemeContext';
import { parseProteinGoal } from '@/lib/utils';
import {
  trackSmartFridgeOpened,
  trackSmartFridgeIngredientsSelected,
  trackSmartFridgeGenerateTapped,
  trackSmartFridgeMealsShown,
  trackSmartFridgeMealStepsViewed,
} from '@/lib/analytics';

type Meal = {
  name: string;
  protein_g: number;
  cook_time_mins: number;
  injection_day_friendly: boolean;
  instructions: string[];
  ingredients_used: string[];
};

const INGREDIENT_CATEGORIES = [
  {
    label: 'Proteins',
    items: [
      'Greek Yogurt', 'Eggs', 'Chicken Breast', 'Salmon', 'Tuna',
      'Cottage Cheese', 'Protein Powder', 'Turkey', 'Tofu', 'Shrimp',
    ],
  },
  {
    label: 'Vegetables',
    items: [
      'Spinach', 'Broccoli', 'Zucchini', 'Cauliflower',
      'Bell Pepper', 'Cucumber', 'Sweet Potato', 'Avocado',
    ],
  },
  {
    label: 'Grains / Other',
    items: ['Quinoa', 'Brown Rice', 'Oats', 'Whole Wheat Bread'],
  },
  {
    label: 'Dairy / Fats',
    items: ['Olive Oil', 'Butter', 'Cheese', 'Almond Butter'],
  },
];

export default function SmartFridgeScreen() {
  const colors = useThemeColors();
  const s = makeStyles(colors);
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [meals, setMeals] = useState<Meal[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stepsModal, setStepsModal] = useState<Meal | null>(null);

  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

  useEffect(() => {
    trackSmartFridgeOpened();
    loadProfile();
  }, []);

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (data) setProfile(data);
  }

  function toggleIngredient(item: string) {
    Haptics.selectionAsync();
    setSelected(prev => {
      if (prev.includes(item)) return prev.filter(i => i !== item);
      if (prev.length >= 10) return prev;
      const next = [...prev, item];
      trackSmartFridgeIngredientsSelected({ count: next.length, ingredients: next });
      return next;
    });
  }

  function addCustomIngredient() {
    const trimmed = customInput.trim();
    if (!trimmed || selected.length >= 10) return;
    const next = [...selected, trimmed];
    setSelected(next);
    setCustomInput('');
    trackSmartFridgeIngredientsSelected({ count: next.length, ingredients: next });
    Haptics.selectionAsync();
  }

  async function generateMeals() {
    if (selected.length < 2) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    trackSmartFridgeGenerateTapped({ ingredient_count: selected.length });
    setLoading(true);
    setError(null);
    setMeals(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const proteinGoal = parseProteinGoal(profile?.protein_goal_range);

      const res = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/smart-fridge`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            ingredients: selected,
            medication: profile?.medication ?? 'semaglutide',
            injection_day: profile?.injection_day ?? 'monday',
            protein_goal: proteinGoal,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? 'Failed to generate meals');
      }

      const data = await res.json() as { meals: Meal[] };
      setMeals(data.meals);
      trackSmartFridgeMealsShown({ meal_names: data.meals.map(m => m.name) });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  }

  function openSteps(meal: Meal) {
    trackSmartFridgeMealStepsViewed({ meal_name: meal.name });
    Haptics.selectionAsync();
    setStepsModal(meal);
  }

  const isDisabled = selected.length < 2 || loading;

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View style={s.headerText}>
            <Text style={[s.title, { color: colors.foreground }]}>Smart Fridge</Text>
            <Text style={[s.subtitle, { color: colors.mutedForeground }]}>What&apos;s in your fridge?</Text>
          </View>
        </View>

        {/* Nori + speech bubble */}
        <View style={s.noriSection}>
          <Image
            source={require('../../assets/nori/nori_lightbulb.png')}
            style={s.noriImage}
            resizeMode="contain"
          />
          <View style={[s.bubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.bubbleText, { color: colors.foreground }]}>
              Tell me what you have — I&apos;ll find your meal! 🥘
            </Text>
            <View style={s.bubbleTail} />
          </View>
        </View>

        {/* Ingredient selector */}
        <View style={s.section}>
          <Text style={[s.sectionLabel, { color: colors.foreground }]}>
            Tap what you have (max 10)
          </Text>

          {INGREDIENT_CATEGORIES.map(cat => (
            <View key={cat.label} style={s.categoryBlock}>
              <Text style={[s.categoryLabel, { color: colors.mutedForeground }]}>{cat.label}</Text>
              <View style={s.chipsRow}>
                {cat.items.map(item => {
                  const isSelected = selected.includes(item);
                  const isLocked = !isSelected && selected.length >= 10;
                  return (
                    <TouchableOpacity
                      key={item}
                      onPress={() => !isLocked && toggleIngredient(item)}
                      activeOpacity={isLocked ? 1 : 0.7}
                      style={[
                        s.chip,
                        isSelected
                          ? s.chipSelected
                          : [s.chipUnselected, { backgroundColor: colors.card, borderColor: colors.border }],
                        isLocked && s.chipLocked,
                      ]}
                    >
                      <Text style={[
                        s.chipText,
                        { color: isSelected ? '#ffffff' : colors.mutedForeground },
                        isLocked && s.chipTextLocked,
                      ]}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}

          {/* Custom ingredient input */}
          <TextInput
            style={[
              s.customInput,
              {
                backgroundColor: colors.card,
                borderColor: inputFocused ? '#1D9E75' : colors.border,
                color: colors.foreground,
              },
            ]}
            placeholder="+ Add your own ingredient"
            placeholderTextColor={colors.mutedForeground}
            value={customInput}
            onChangeText={setCustomInput}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            onSubmitEditing={addCustomIngredient}
            returnKeyType="done"
            editable={selected.length < 10}
          />

          {/* Selected count */}
          <Text style={[s.countText, { color: colors.mutedForeground }]}>
            {selected.length}/10 ingredients selected
          </Text>
        </View>

        {/* Generate button */}
        <View style={s.btnWrap}>
          <TouchableOpacity
            onPressIn={() => { btnScale.value = withSpring(0.96, { damping: 15, stiffness: 400 }); }}
            onPressOut={() => { btnScale.value = withSpring(1.0, { damping: 15, stiffness: 400 }); }}
            onPress={generateMeals}
            disabled={isDisabled}
            activeOpacity={1}
          >
            <Animated.View style={[s.generateBtn, isDisabled && s.generateBtnDisabled, btnStyle]}>
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={s.generateBtnText}>Find My Meals</Text>
              )}
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Error state */}
        {error && !meals && (
          <View style={s.errorSection}>
            <Image
              source={require('../../assets/nori/nori_lightbulb.png')}
              style={s.errorNori}
              resizeMode="contain"
            />
            <Text style={[s.errorTitle, { color: colors.foreground }]}>
              Nori couldn&apos;t find meals with those ingredients.
            </Text>
            <Text style={[s.errorSub, { color: colors.mutedForeground }]}>
              Try adding more!
            </Text>
            <TouchableOpacity
              onPress={generateMeals}
              style={[s.retryBtn, { borderColor: '#1D9E75' }]}
              activeOpacity={0.8}
            >
              <Text style={s.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Results section */}
        {meals && meals.length > 0 && (
          <Animated.View entering={FadeIn.duration(400)} style={s.resultsSection}>
            <Text style={[s.resultsHeader, { color: colors.foreground }]}>
              Meals you can make right now 🍳
            </Text>
            {meals.map((meal, i) => (
              <View
                key={i}
                style={[s.mealCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={s.mealCardTop}>
                  <View style={s.mealCardInfo}>
                    <Text style={[s.mealName, { color: colors.foreground }]}>{meal.name}</Text>
                    <View style={s.mealBadges}>
                      <View style={s.proteinBadge}>
                        <Text style={s.proteinBadgeText}>{meal.protein_g}g protein</Text>
                      </View>
                      <Text style={[s.cookTime, { color: colors.mutedForeground }]}>
                        {meal.cook_time_mins} min
                      </Text>
                      {meal.injection_day_friendly && (
                        <Text style={s.injectionBadge}>💉</Text>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => openSteps(meal)}
                    style={s.stepsBtn}
                    activeOpacity={0.8}
                  >
                    <Text style={s.stepsBtnText}>View Steps</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </Animated.View>
        )}
      </ScrollView>

      {/* Steps modal */}
      <Modal
        visible={stepsModal !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setStepsModal(null)}
      >
        {stepsModal && (
          <StepsSheet
            meal={stepsModal}
            onClose={() => setStepsModal(null)}
            colors={colors}
          />
        )}
      </Modal>
    </SafeAreaView>
  );
}

function StepsSheet({
  meal, onClose, colors,
}: {
  meal: Meal;
  onClose: () => void;
  colors: ThemeColors;
}) {
  const s = makeSheetStyles(colors);
  return (
    <SafeAreaView style={s.sheet} edges={['top', 'bottom']}>
      <View style={s.handle} />
      <View style={s.sheetHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[s.sheetTitle, { color: colors.foreground }]}>{meal.name}</Text>
          <Text style={[s.sheetSub, { color: colors.mutedForeground }]}>
            {meal.protein_g}g protein · {meal.cook_time_mins} min
          </Text>
        </View>
        <TouchableOpacity onPress={onClose} style={s.closeBtn} activeOpacity={0.7}>
          <Ionicons name="close" size={22} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={s.sheetScroll}>
        {meal.instructions.map((step, i) => (
          <View
            key={i}
            style={[s.stepRow, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={s.stepNum}>
              <Text style={s.stepNumText}>{i + 1}</Text>
            </View>
            <Text style={[s.stepText, { color: colors.foreground }]}>{step}</Text>
          </View>
        ))}
        {meal.ingredients_used.length > 0 && (
          <View style={[s.ingredientsUsed, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.ingredientsUsedLabel, { color: colors.mutedForeground }]}>
              Ingredients used
            </Text>
            <Text style={[s.ingredientsUsedText, { color: colors.foreground }]}>
              {meal.ingredients_used.join(', ')}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function makeSheetStyles(c: ThemeColors) {
  return StyleSheet.create({
    sheet: { flex: 1, backgroundColor: c.background },
    handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center', marginTop: 8, marginBottom: 16 },
    sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, marginBottom: Spacing.xl },
    sheetTitle: { fontSize: FontSize.lg, fontFamily: 'PlusJakartaSans-ExtraBold' },
    sheetSub: { fontSize: FontSize.sm, marginTop: 4 },
    closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: c.muted, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    sheetScroll: { paddingHorizontal: Spacing.xl, paddingBottom: 40, gap: Spacing.md },
    stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, padding: 14, borderRadius: Radius.xl, borderWidth: 1 },
    stepNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#1D9E75', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
    stepNumText: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-ExtraBold', color: '#ffffff' },
    stepText: { flex: 1, fontSize: FontSize.sm, lineHeight: 20 },
    ingredientsUsed: { padding: 14, borderRadius: Radius.xl, borderWidth: 1 },
    ingredientsUsedLabel: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-Bold', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
    ingredientsUsedText: { fontSize: FontSize.sm, lineHeight: 20 },
  });
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    scroll: { paddingBottom: 120 },
    header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, marginBottom: Spacing['2xl'] },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: c.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border },
    headerText: { flex: 1 },
    title: { fontSize: FontSize['2xl'], fontFamily: 'PlusJakartaSans-ExtraBold' },
    subtitle: { fontSize: FontSize.sm, marginTop: 2 },
    noriSection: { alignItems: 'center', marginBottom: Spacing['2xl'], gap: Spacing.md },
    noriImage: { width: 80, height: 80 },
    bubble: { borderRadius: Radius.xl, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 10, maxWidth: '80%', position: 'relative' },
    bubbleText: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-SemiBold', textAlign: 'center' },
    bubbleTail: { position: 'absolute', top: -8, left: '50%', marginLeft: -6, width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderBottomWidth: 8, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: 'rgba(255,255,255,0.08)' },
    section: { paddingHorizontal: Spacing.xl, marginBottom: Spacing['2xl'] },
    sectionLabel: { fontSize: FontSize.base, fontFamily: 'PlusJakartaSans-ExtraBold', marginBottom: Spacing.lg },
    categoryBlock: { marginBottom: Spacing.xl },
    categoryLabel: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-Bold', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.sm },
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.full, borderWidth: 1 },
    chipSelected: { backgroundColor: '#1D9E75', borderColor: 'transparent', shadowColor: '#1D9E75', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 4 },
    chipUnselected: {},
    chipLocked: { opacity: 0.4 },
    chipText: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-SemiBold' },
    chipTextLocked: {},
    customInput: { marginTop: Spacing.lg, borderRadius: Radius.xl, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 12, fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Regular' },
    countText: { fontSize: FontSize.xs, marginTop: Spacing.sm, textAlign: 'right' },
    btnWrap: { paddingHorizontal: Spacing.xl, marginBottom: Spacing['2xl'] },
    generateBtn: { backgroundColor: '#1D9E75', borderRadius: 20, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
    generateBtnDisabled: { opacity: 0.5 },
    generateBtnText: { fontSize: FontSize.base, fontFamily: 'PlusJakartaSans-ExtraBold', color: '#ffffff' },
    errorSection: { alignItems: 'center', paddingHorizontal: Spacing.xl, gap: Spacing.md, marginBottom: Spacing['2xl'] },
    errorNori: { width: 64, height: 64 },
    errorTitle: { fontSize: FontSize.base, fontFamily: 'PlusJakartaSans-ExtraBold', textAlign: 'center' },
    errorSub: { fontSize: FontSize.sm, textAlign: 'center' },
    retryBtn: { borderWidth: 1.5, borderRadius: Radius.full, paddingHorizontal: 24, paddingVertical: 10, marginTop: Spacing.sm },
    retryBtnText: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Bold', color: '#1D9E75' },
    resultsSection: { paddingHorizontal: Spacing.xl, gap: Spacing.md },
    resultsHeader: { fontSize: FontSize.lg, fontFamily: 'PlusJakartaSans-ExtraBold', marginBottom: Spacing.sm },
    mealCard: { borderRadius: Radius.xl, borderWidth: 1, borderLeftWidth: 3, borderLeftColor: '#1D9E75', padding: 16 },
    mealCardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: Spacing.md },
    mealCardInfo: { flex: 1 },
    mealName: { fontSize: FontSize.base, fontFamily: 'PlusJakartaSans-ExtraBold', marginBottom: 6 },
    mealBadges: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
    proteinBadge: { backgroundColor: 'rgba(29,158,117,0.15)', borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 },
    proteinBadgeText: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-Bold', color: '#1D9E75' },
    cookTime: { fontSize: FontSize.xs },
    injectionBadge: { fontSize: 14 },
    stepsBtn: { backgroundColor: 'rgba(29,158,117,0.12)', borderRadius: Radius.lg, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(29,158,117,0.3)', flexShrink: 0 },
    stepsBtnText: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-Bold', color: '#1D9E75' },
  });
}
