import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
  Alert, ActivityIndicator, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withSpring, withSequence, withDelay,
  BounceIn,
} from 'react-native-reanimated';
import { supabase, MealPlan, GrocerySection, GroceryItem } from '@/lib/supabase';
import { FontSize, Spacing, Radius, ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/context/ThemeContext';
import { trackGroceryListOpened } from '@/lib/analytics';
import { GROCERY_TIMEOUT_MS } from '@/lib/constants';
import { logError } from '@/lib/utils';

const SECTION_EMOJIS: Record<string, string> = {
  produce: '🥦', protein: '🥩', proteins: '🥩', dairy: '🥛', 'dairy & eggs': '🥛', grains: '🌾',
  pantry: '🫙', frozen: '🧊', beverages: '🥤', other: '🛒',
};

const NOVA_COLORS: Record<number, string> = {
  1: '#1D9E75', 2: '#A8F0D8', 3: '#F59E0B', 4: '#EF4444',
};

function relativeTime(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs !== 1 ? 's' : ''} ago`;
  return new Date(isoStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Animated grocery item row
function GroceryItemRow({
  item, itemKey, isChecked, onToggle, colors,
}: {
  item: GroceryItem;
  itemKey: string;
  isChecked: boolean;
  onToggle: (key: string) => void;
  colors: ThemeColors;
}) {
  const checkScale   = useSharedValue(isChecked ? 1 : 0);
  const textOpacity  = useSharedValue(isChecked ? 0.4 : 1);
  const flashOpacity = useSharedValue(0);

  const prevChecked = useRef(isChecked);

  useEffect(() => {
    if (prevChecked.current === isChecked) return;
    prevChecked.current = isChecked;

    if (isChecked) {
      checkScale.value  = withSequence(withSpring(1.2), withSpring(1.0));
      textOpacity.value = withTiming(0.4, { duration: 200 });
      flashOpacity.value = withSequence(
        withTiming(0.15, { duration: 80 }),
        withDelay(520, withTiming(0, { duration: 300 })),
      );
    } else {
      checkScale.value  = withTiming(0, { duration: 150 });
      textOpacity.value = withTiming(1, { duration: 200 });
    }
  }, [isChecked]);

  const checkmarkStyle  = useAnimatedStyle(() => ({ transform: [{ scale: checkScale.value }] }));
  const textStyle       = useAnimatedStyle(() => ({ opacity: textOpacity.value }));
  const flashStyle      = useAnimatedStyle(() => ({ opacity: flashOpacity.value }));

  const s = itemStyles;
  return (
    <TouchableOpacity
      style={[s.row, { backgroundColor: colors.card }]}
      onPress={() => onToggle(itemKey)}
      activeOpacity={0.75}
    >
      {/* teal background flash on check */}
      <Animated.View style={[StyleSheet.absoluteFill, s.flash, flashStyle]} pointerEvents="none" />

      <View style={[
        s.checkbox,
        { borderColor: isChecked ? colors.secondary : colors.border, backgroundColor: isChecked ? colors.secondary : colors.card },
      ]}>
        <Animated.View style={checkmarkStyle}>
          {isChecked && <Ionicons name="checkmark" size={13} color="white" />}
        </Animated.View>
      </View>

      <Animated.View style={[s.body, textStyle]}>
        <Text style={[s.name, { color: colors.foreground }, isChecked && s.nameChecked]}>
          {item.name}
        </Text>
        <Text style={[s.sub, { color: colors.mutedForeground }]}>
          {item.quantity}{item.unit ? ` ${item.unit}` : ''}
          {item.estimated_cost != null ? ` · ~$${item.estimated_cost.toFixed(2)}` : ''}
        </Text>
      </Animated.View>

      {item.estimated_cost != null && (
        <Animated.Text style={[s.price, textStyle, isChecked ? { color: colors.mutedForeground } : { color: colors.primary }]}>
          ${item.estimated_cost.toFixed(2)}
        </Animated.Text>
      )}
      {item.nova_score != null && (
        <View style={[s.novaBadge, { backgroundColor: NOVA_COLORS[item.nova_score] + '22', borderColor: NOVA_COLORS[item.nova_score] + '55' }]}>
          <Text style={[s.novaText, { color: NOVA_COLORS[item.nova_score] }]}>{item.nova_score}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const itemStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1.5, borderColor: 'transparent', overflow: 'hidden' },
  flash: { backgroundColor: '#1D9E75', borderRadius: 16 },
  checkbox: { width: 24, height: 24, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  body: { flex: 1 },
  name: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-SemiBold' },
  nameChecked: { textDecorationLine: 'line-through' },
  sub: { fontSize: 11, marginTop: 2 },
  price: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-Bold', flexShrink: 0 },
  novaBadge: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  novaText: { fontSize: 10, fontFamily: 'PlusJakartaSans-ExtraBold' },
});

export default function GroceryListScreen() {
  const colors = useThemeColors();
  const s = makeStyles(colors);
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [hidePantry, setHidePantry] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshingList, setRefreshingList] = useState(false);
  const [isStale, setIsStale] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [weeklyBudget, setWeeklyBudget] = useState(75);
  const [autoGenFailed, setAutoGenFailed] = useState(false);
  const autoGenForPlanRef = useRef<string | null>(null);

  // Reanimated toast
  const toastOpacity = useSharedValue(0);
  const toastStyle = useAnimatedStyle(() => ({ opacity: toastOpacity.value }));

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [{ data }, { data: profileData }] = await Promise.all([
      supabase
        .from('meal_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('week_start', { ascending: false })
        .limit(1)
        .single(),
      supabase.from('profiles').select('weekly_budget').eq('id', user.id).single(),
    ]);
    setWeeklyBudget(profileData?.weekly_budget ?? 75);
    if (data) {
      console.log('[grocery-client] load called, plan grocery_list null?', data.grocery_list === null);
      setPlan(data);
      const listGenAt: string | undefined = (data.grocery_list as any)?.generated_at;
      const planUpdatedAt: string = (data as any).updated_at ?? data.created_at;
      if (listGenAt && planUpdatedAt) {
        setIsStale(new Date(planUpdatedAt) > new Date(listGenAt));
        setLastUpdated(listGenAt);
      } else {
        setLastUpdated(planUpdatedAt ?? data.created_at);
        setIsStale(false);
      }
    }
  }

  useEffect(() => { load(); trackGroceryListOpened(); }, []);

  // When the plan exists but grocery_list is still null, explicitly call
  // grocery-list-generate (ingredients + grocery). No background EdgeRuntime.
  useEffect(() => {
    if (!plan || plan.grocery_list !== null) return;
    if (refreshingList || autoGenFailed) return;
    if (autoGenForPlanRef.current === plan.id) return;
    autoGenForPlanRef.current = plan.id;
    console.log('[grocery-client] grocery_list null — triggering grocery-list-generate');
    void doRefreshList({ auto: true });
  }, [plan?.id, plan?.grocery_list]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, []);

  function toggleItem(key: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(key)) { next.delete(key); } else { next.add(key); }
      return next;
    });
  }

  function showToast() {
    toastOpacity.value = withSequence(
      withTiming(1, { duration: 200 }),
      withDelay(2000, withTiming(0, { duration: 300 })),
    );
  }

  async function doRefreshList(opts?: { auto?: boolean }) {
    if (!plan) return;
    setRefreshingList(true);
    if (!opts?.auto) setAutoGenFailed(false);
    console.log('[grocery-client] refresh triggered', opts?.auto ? '(auto)' : '(manual)');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetchWithTimeout(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/grocery-list-generate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ plan_id: plan.id }),
        },
        GROCERY_TIMEOUT_MS
      );
      console.log('[grocery-client] fetch response status:', res.status);
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        console.log('[grocery-client] error body:', errBody);
        throw new Error(errBody.error ?? 'refresh failed');
      }
      const { plan: updatedPlan } = await res.json();
      if (updatedPlan) {
        setPlan(updatedPlan);
        setIsStale(false);
        setLastUpdated(new Date().toISOString());
        setAutoGenFailed(false);
      }
      setChecked(new Set());
      if (!opts?.auto) {
        showToast();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      console.log('[grocery-client] error:', err.message);
      logError('grocery-list:doRefreshList', e);
      if (opts?.auto) {
        setAutoGenFailed(true);
        autoGenForPlanRef.current = null;
      } else {
        Alert.alert('Couldn\'t refresh', 'Check your connection and try again.');
      }
    } finally {
      setRefreshingList(false);
    }
  }

  async function handleShare() {
    const sections = plan?.grocery_list?.sections ?? [];
    if (sections.length === 0) return;
    const lines: string[] = ['🛒 Grocery List', ''];
    for (const section of sections) {
      lines.push(`${section.category}:`);
      for (const item of section.items) {
        const qty = item.quantity ? `${item.quantity}${item.unit ? ` ${item.unit}` : ''} — ` : '';
        lines.push(`  • ${qty}${item.name}`);
      }
      lines.push('');
    }
    const total = plan?.grocery_list?.estimated_total;
    if (total != null) lines.push(`Estimated total: $${total.toFixed(2)}`);
    try {
      await Share.share({ message: lines.join('\n') });
    } catch { /* user cancelled or share failed silently */ }
  }

  function handleRefresh() {
    if (checked.size > 3) {
      Alert.alert(
        'Clear checked items?',
        'Refreshing will clear your checked items. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Refresh', onPress: () => doRefreshList() },
        ]
      );
    } else {
      doRefreshList();
    }
  }

  // Saved but incomplete — grocery_list is non-null but has no sections
  // (a truncated/malformed Claude response that slipped past validation).
  const groceryListIncomplete = !!plan && plan.grocery_list !== null &&
    (!plan.grocery_list?.sections || plan.grocery_list.sections.length === 0);
  const sections: GrocerySection[] = plan?.grocery_list?.sections ?? [];
  const visibleSections = hidePantry
    ? sections.filter(sec => sec.category.toLowerCase() !== 'pantry')
    : sections;
  const totalItems = sections.reduce((acc, sec) => acc + sec.items.length, 0);
  const checkedCount = checked.size;
  const budgetTotal = plan?.grocery_list?.estimated_total ?? 0;
  const budgetPctRaw = weeklyBudget > 0 ? (budgetTotal / weeklyBudget) * 100 : 0;
  const budgetPct = Math.min(100, Math.round(budgetPctRaw));
  const budgetRemaining = Math.max(0, weeklyBudget - budgetTotal);
  const budgetBarColor = budgetPctRaw > 100 ? '#EF4444' : budgetPctRaw >= 90 ? '#F59E0B' : colors.secondary;

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={[s.screenTitle, { color: colors.foreground }]}>Grocery List</Text>
            <Text style={[s.subTitle, { color: colors.mutedForeground }]}>
              {totalItems > 0 ? `${checkedCount}/${totalItems} checked` : 'No list yet'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <TouchableOpacity
              style={[s.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={handleRefresh}
              disabled={refreshingList}
              activeOpacity={0.8}
            >
              {refreshingList
                ? <ActivityIndicator size="small" color={colors.primary} />
                : <Ionicons name="refresh-outline" size={20} color={colors.primary} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={handleShare}
              activeOpacity={0.8}
            >
              <Ionicons name="share-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Staleness banner */}
        {isStale && (
          <View style={s.staleBanner}>
            <Ionicons name="warning-outline" size={16} color="#F59E0B" />
            <Text style={s.staleBannerText}>Your meal plan has changed — tap Refresh to update your list.</Text>
            <TouchableOpacity onPress={handleRefresh} disabled={refreshingList} style={s.staleRefreshBtn}>
              <Text style={s.staleRefreshText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        )}

        {lastUpdated && (
          <Text style={[s.lastUpdated, { color: colors.mutedForeground }]}>
            Last updated {relativeTime(lastUpdated)}
          </Text>
        )}

        {/* Budget bar */}
        {budgetTotal > 0 && (
          <View style={[s.budgetCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={s.budgetTop}>
              <Text style={[s.budgetLabel, { color: colors.foreground }]}>Weekly Budget</Text>
              <Text style={[s.budgetAmount, { color: budgetBarColor }]}>
                ${budgetTotal.toFixed(2)} / ${weeklyBudget.toFixed(2)}
              </Text>
            </View>
            <View style={[s.barTrack, { backgroundColor: colors.muted }]}>
              <View style={[s.barFill, { width: `${budgetPct}%` as any, backgroundColor: budgetBarColor }]} />
            </View>
            <View style={s.budgetBottom}>
              <Text style={[s.budgetRemaining, { color: colors.mutedForeground }]}>${budgetRemaining.toFixed(2)} remaining</Text>
              <Text style={[s.budgetPct, { color: budgetBarColor }]}>{budgetPct}%</Text>
            </View>
          </View>
        )}

        {/* Pantry toggle */}
        <View style={[s.pantryRow, { backgroundColor: colors.muted }]}>
          <View style={[s.pantryIcon, { backgroundColor: 'rgba(29,158,117,0.12)' }]}>
            <Ionicons name="pricetag-outline" size={18} color={colors.primary} />
          </View>
          <View style={s.pantryText}>
            <Text style={[s.pantryTitle, { color: colors.foreground }]}>Pantry Staples</Text>
            <Text style={[s.pantrySub, { color: colors.mutedForeground }]}>Hide items you likely already have</Text>
          </View>
          <TouchableOpacity
            style={[s.toggle, { backgroundColor: hidePantry ? colors.muted : colors.primary }]}
            onPress={() => setHidePantry(p => !p)}
            activeOpacity={0.8}
          >
            <View style={[s.toggleThumb, { transform: [{ translateX: hidePantry ? 2 : 22 }] }]} />
          </TouchableOpacity>
        </View>

        {/* Tip */}
        {plan?.grocery_list?.savings_tip && (
          <View style={[s.tipRow, { backgroundColor: colors.secondary + '0D', borderColor: colors.secondary + '1A' }]}>
            <Ionicons name="bulb-outline" size={16} color={colors.secondary} />
            <Text style={[s.tipText, { color: colors.foreground }]}>{plan.grocery_list.savings_tip}</Text>
          </View>
        )}

        {/* Empty state — no plan at all */}
        {!plan && (
          <View style={s.emptyState}>
            <Text style={s.emptyIcon}>🛒</Text>
            <Text style={[s.emptyTitle, { color: colors.foreground }]}>No grocery list yet</Text>
            <Text style={[s.emptySub, { color: colors.mutedForeground }]}>Generate a meal plan first, then your grocery list will appear here.</Text>
          </View>
        )}

        {/* Plan exists but grocery list is still generating, or was saved incomplete */}
        {plan && (plan.grocery_list === null || groceryListIncomplete) && (
          <View style={s.emptyState}>
            {(refreshingList || (plan.grocery_list === null && !autoGenFailed)) ? (
              <>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[s.emptyTitle, { color: colors.foreground, marginTop: Spacing.lg }]}>Building your grocery list...</Text>
                <Text style={[s.emptySub, { color: colors.mutedForeground }]}>This can take up to a minute while we list ingredients.</Text>
              </>
            ) : (
              <>
                <Text style={s.emptyIcon}>🛒</Text>
                <Text style={[s.emptyTitle, { color: colors.foreground }]}>
                  {groceryListIncomplete ? "Couldn't finish your list" : 'Still working on it'}
                </Text>
                <Text style={[s.emptySub, { color: colors.mutedForeground }]}>
                  {groceryListIncomplete ? 'Something went wrong generating your items.' : 'Taking longer than expected.'}
                </Text>
                <TouchableOpacity
                  style={[s.iconBtn, { backgroundColor: colors.card, borderColor: colors.border, width: undefined, paddingHorizontal: Spacing.xl, marginTop: Spacing.lg }]}
                  onPress={() => doRefreshList()}
                  disabled={refreshingList}
                  activeOpacity={0.8}
                >
                  {refreshingList
                    ? <ActivityIndicator size="small" color={colors.primary} />
                    : <Text style={{ color: colors.primary, fontFamily: 'PlusJakartaSans-Bold' }}>{groceryListIncomplete ? 'Regenerate' : 'Generate grocery list'}</Text>}
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* Sections */}
        <View style={s.sections}>
          {visibleSections.map(section => {
            const catKey = section.category.toLowerCase();
            const emoji = SECTION_EMOJIS[catKey] ?? '🛒';
            const isPantry = catKey === 'pantry';
            const sectionKeys = section.items.map((item: GroceryItem, i: number) => `${section.category}-${item.name}-${i}`);
            const allChecked = sectionKeys.length > 0 && sectionKeys.every(k => checked.has(k));

            return (
              <View key={section.category} style={s.section}>
                <View style={s.sectionHeader}>
                  <Text style={s.sectionEmoji}>{emoji}</Text>
                  <Text style={[
                    s.sectionTitle,
                    { color: allChecked ? colors.mutedForeground : colors.foreground },
                    allChecked && s.sectionTitleDone,
                  ]}>{section.category}</Text>
                  {isPantry && (
                    <View style={[s.stapleBadge, { backgroundColor: 'rgba(29,158,117,0.1)' }]}>
                      <Text style={[s.stapleBadgeText, { color: colors.primary }]}>Staples</Text>
                    </View>
                  )}
                  {allChecked && (
                    <Animated.View entering={BounceIn.duration(400)} style={s.allCheckedBadge}>
                      <Ionicons name="checkmark-circle" size={16} color="#1D9E75" />
                    </Animated.View>
                  )}
                  <View style={[s.countBadge, { backgroundColor: colors.muted }]}>
                    <Text style={[s.countText, { color: colors.mutedForeground }]}>{section.items.length} items</Text>
                  </View>
                </View>
                <View style={s.itemsList}>
                  {section.items.map((item: GroceryItem, i: number) => {
                    const key = sectionKeys[i]!;
                    return (
                      <GroceryItemRow
                        key={key}
                        item={item}
                        itemKey={key}
                        isChecked={checked.has(key)}
                        onToggle={toggleItem}
                        colors={colors}
                      />
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Toast — Reanimated */}
      <Animated.View style={[s.toast, toastStyle]} pointerEvents="none">
        <Ionicons name="checkmark-circle" size={18} color="#fff" />
        <Text style={s.toastText}>List updated</Text>
      </Animated.View>
    </SafeAreaView>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    scroll: { paddingBottom: 120 },
    header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, marginBottom: Spacing.sm },
    screenTitle: { fontSize: FontSize['2xl'], fontFamily: 'PlusJakartaSans-ExtraBold', marginBottom: 2 },
    subTitle: { fontSize: FontSize.sm },
    iconBtn: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    staleBanner: { marginHorizontal: Spacing.xl, marginBottom: Spacing.sm, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: Radius.lg, backgroundColor: '#FAEEDA', borderLeftWidth: 3, borderLeftColor: '#D97706', borderWidth: 1, borderColor: '#FCD34D' },
    staleBannerText: { flex: 1, fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-SemiBold', color: '#F59E0B' },
    staleRefreshBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full, backgroundColor: 'rgba(245,158,11,0.20)' },
    staleRefreshText: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-ExtraBold', color: '#fff' },
    lastUpdated: { fontSize: FontSize.xs, paddingHorizontal: Spacing.xl, marginBottom: Spacing.md },
    budgetCard: { marginHorizontal: Spacing.xl, borderRadius: Radius.xl, borderWidth: 1, padding: 16, marginBottom: Spacing.lg },
    budgetTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    budgetLabel: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Bold' },
    budgetAmount: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Bold' },
    barTrack: { height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 6 },
    barFill: { height: '100%', borderRadius: 6 },
    budgetBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    budgetRemaining: { fontSize: FontSize.xs },
    budgetPct: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-Bold' },
    pantryRow: { marginHorizontal: Spacing.xl, borderRadius: Radius.xl, padding: 16, flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg },
    pantryIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    pantryText: { flex: 1 },
    pantryTitle: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Bold' },
    pantrySub: { fontSize: FontSize.xs, marginTop: 1 },
    toggle: { width: 48, height: 24, borderRadius: 12, justifyContent: 'center' },
    toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: 'white', position: 'absolute' },
    tipRow: { marginHorizontal: Spacing.xl, flexDirection: 'row', alignItems: 'center', gap: 8, padding: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, marginBottom: Spacing['2xl'] },
    tipText: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-SemiBold', fontStyle: 'italic', flex: 1 },
    emptyState: { alignItems: 'center', paddingTop: Spacing['3xl'], paddingHorizontal: Spacing.xl },
    emptyIcon: { fontSize: 64, marginBottom: Spacing.xl },
    emptyTitle: { fontSize: FontSize.xl, fontFamily: 'PlusJakartaSans-ExtraBold', marginBottom: Spacing.sm },
    emptySub: { fontSize: FontSize.sm, textAlign: 'center', lineHeight: 20 },
    sections: { paddingHorizontal: Spacing.xl, gap: Spacing['3xl'] },
    section: {},
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.md },
    sectionEmoji: { fontSize: 18 },
    sectionTitle: { fontSize: FontSize.base, fontFamily: 'PlusJakartaSans-ExtraBold' },
    sectionTitleDone: { textDecorationLine: 'line-through' },
    stapleBadge: { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
    stapleBadgeText: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-Bold' },
    allCheckedBadge: { marginLeft: 2 },
    countBadge: { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 'auto' },
    countText: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-Bold' },
    itemsList: { gap: 8 },
    toast: { position: 'absolute', bottom: 100, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1D9E75', borderRadius: Radius.full, paddingHorizontal: 20, paddingVertical: 12 },
    toastText: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-ExtraBold', color: '#fff' },
  });
}
