import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { Colors, FontSize, Spacing, Radius } from '@/constants/theme';
import * as Haptics from 'expo-haptics';

type GroceryItem = {
  name: string;
  quantity: string;
  cost_usd: number;
  nova_score: number;
  checked: boolean;
  cheaper_alternative?: string;
};

type GrocerySection = {
  section: string;
  items: GroceryItem[];
};

type GroceryList = {
  sections: GrocerySection[];
  total_cost: number;
  budget: number;
};

const NOVA_COLORS: Record<number, string> = { 1: '#8A9A7C', 2: '#E89D35', 3: '#D87F63', 4: '#E85353' };
const SECTION_ICONS: Record<string, string> = {
  proteins: '🥩', produce: '🥦', dairy: '🥛', pantry: '🥫', other: '🛒',
};

export default function GroceryListScreen() {
  const [list, setList] = useState<GroceryList | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: plan } = await supabase
      .from('meal_plans')
      .select('plan_json')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (plan?.plan_json?.grocery_list) {
      setList(plan.plan_json.grocery_list);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function generateList() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setGenerating(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const { data, error } = await supabase.functions.invoke('grocery-list/generate', {
      body: { user_id: user.id },
    });

    if (!error && data?.grocery_list) {
      setList(data.grocery_list);
    }
    setGenerating(false);
  }

  function toggleItem(key: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));
  }

  async function shareList() {
    if (!list) return;
    const text = list.sections.map(s =>
      `${s.section.toUpperCase()}\n` +
      s.items.map(i => `• ${i.quantity} ${i.name}`).join('\n')
    ).join('\n\n');
    await Share.share({ message: `FoodWise Grocery List\n\n${text}\n\nTotal: ~$${list.total_cost.toFixed(2)}` });
  }

  const budgetPct = list ? Math.min(list.total_cost / list.budget, 1) : 0;
  const totalChecked = Object.values(checkedItems).filter(Boolean).length;
  const totalItems = list?.sections.reduce((acc, s) => acc + s.items.length, 0) ?? 0;

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Grocery List</Text>
        <View style={styles.headerActions}>
          {list && (
            <TouchableOpacity style={styles.iconBtn} onPress={shareList} activeOpacity={0.75}>
              <Text style={styles.iconBtnText}>⬆ Share</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.genBtn, generating && styles.genBtnLoading]}
            onPress={generateList}
            disabled={generating}
            activeOpacity={0.8}
          >
            {generating
              ? <ActivityIndicator size="small" color={Colors.primaryForeground} />
              : <Text style={styles.genBtnText}>⚡ Generate</Text>}
          </TouchableOpacity>
        </View>
      </View>

      {!list ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyTitle}>No grocery list yet</Text>
          <Text style={styles.emptySub}>Generate a meal plan first, then tap Generate to build your grouped, budget-tracked grocery list.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Budget bar */}
          <View style={styles.budgetCard}>
            <View style={styles.budgetRow}>
              <Text style={styles.budgetLabel}>Weekly budget</Text>
              <Text style={styles.budgetAmount}>
                ${list.total_cost.toFixed(2)} <Text style={styles.budgetOf}>/ ${list.budget}</Text>
              </Text>
            </View>
            <View style={styles.budgetTrack}>
              <View style={[styles.budgetFill, { width: `${budgetPct * 100}%`, backgroundColor: budgetPct > 1 ? Colors.destructive : Colors.secondary }]} />
            </View>
            <Text style={styles.budgetStatus}>
              {budgetPct <= 1
                ? `$${(list.budget - list.total_cost).toFixed(2)} under budget 🎉`
                : `$${(list.total_cost - list.budget).toFixed(2)} over budget`}
            </Text>
          </View>

          {/* Progress */}
          <View style={styles.progressRow}>
            <Text style={styles.progressText}>{totalChecked} / {totalItems} items checked</Text>
          </View>

          {/* Sections */}
          {list.sections.map((section) => (
            <View key={section.section} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>{SECTION_ICONS[section.section.toLowerCase()] ?? '🛒'}</Text>
                <Text style={styles.sectionTitle}>{section.section}</Text>
                <Text style={styles.sectionCount}>{section.items.length} items</Text>
              </View>
              {section.items.map((item) => {
                const key = `${section.section}-${item.name}`;
                const checked = checkedItems[key] ?? false;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.item, checked && styles.itemChecked]}
                    onPress={() => toggleItem(key)}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                      {checked && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <View style={styles.itemBody}>
                      <View style={styles.itemRow}>
                        <Text style={[styles.itemName, checked && styles.itemNameChecked]}>{item.quantity} {item.name}</Text>
                        <View style={[styles.novaBadge, { backgroundColor: `${NOVA_COLORS[item.nova_score]}22`, borderColor: NOVA_COLORS[item.nova_score] }]}>
                          <Text style={[styles.novaText, { color: NOVA_COLORS[item.nova_score] }]}>N{item.nova_score}</Text>
                        </View>
                      </View>
                      {item.cheaper_alternative && (
                        <Text style={styles.altText}>💡 Try: {item.cheaper_alternative}</Text>
                      )}
                      <Text style={styles.itemCost}>~${item.cost_usd.toFixed(2)}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing.md },
  headerTitle: { fontSize: FontSize['2xl'], fontFamily: 'PlusJakartaSans-ExtraBold', color: Colors.foreground },
  headerActions: { flexDirection: 'row', gap: Spacing.sm },
  iconBtn: { paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border },
  iconBtnText: { fontSize: FontSize.xs, color: Colors.foreground, fontFamily: 'PlusJakartaSans-SemiBold' },
  genBtn: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: Spacing.lg, paddingVertical: 10 },
  genBtnLoading: { opacity: 0.7 },
  genBtnText: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Bold', color: Colors.primaryForeground },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl, gap: Spacing.md },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontSize: FontSize['2xl'], fontFamily: 'PlusJakartaSans-ExtraBold', color: Colors.foreground },
  emptySub: { fontSize: FontSize.base, color: Colors.mutedForeground, textAlign: 'center', lineHeight: 24 },
  scroll: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing['3xl'], gap: Spacing.lg },
  budgetCard: { padding: Spacing.xl, borderRadius: Radius.xl, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm },
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  budgetLabel: { fontSize: FontSize.sm, color: Colors.mutedForeground, fontFamily: 'PlusJakartaSans-SemiBold' },
  budgetAmount: { fontSize: FontSize.lg, fontFamily: 'PlusJakartaSans-ExtraBold', color: Colors.foreground },
  budgetOf: { fontSize: FontSize.sm, color: Colors.mutedForeground, fontFamily: 'PlusJakartaSans-Medium' },
  budgetTrack: { height: 6, borderRadius: Radius.full, backgroundColor: Colors.border, overflow: 'hidden' },
  budgetFill: { height: '100%', borderRadius: Radius.full },
  budgetStatus: { fontSize: FontSize.sm, color: Colors.secondary, fontFamily: 'PlusJakartaSans-SemiBold' },
  progressRow: { alignItems: 'center' },
  progressText: { fontSize: FontSize.sm, color: Colors.mutedForeground },
  section: { gap: Spacing.xs },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingBottom: Spacing.sm },
  sectionIcon: { fontSize: 20 },
  sectionTitle: { flex: 1, fontSize: FontSize.base, fontFamily: 'PlusJakartaSans-Bold', color: Colors.foreground, textTransform: 'capitalize' },
  sectionCount: { fontSize: FontSize.xs, color: Colors.mutedForeground },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, padding: Spacing.md, borderRadius: Radius.lg, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  itemChecked: { opacity: 0.5 },
  checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checkboxChecked: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  checkmark: { color: Colors.foreground, fontSize: 11, fontFamily: 'PlusJakartaSans-Bold' },
  itemBody: { flex: 1, gap: 2 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  itemName: { flex: 1, fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-SemiBold', color: Colors.foreground },
  itemNameChecked: { textDecorationLine: 'line-through', color: Colors.mutedForeground },
  novaBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  novaText: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-Bold' },
  altText: { fontSize: FontSize.xs, color: Colors.accent, lineHeight: 16 },
  itemCost: { fontSize: FontSize.xs, color: Colors.mutedForeground },
});
