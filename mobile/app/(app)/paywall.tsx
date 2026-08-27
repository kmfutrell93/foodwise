import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Alert, ScrollView, Linking, Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { PACKAGE_TYPE, PurchasesPackage } from 'react-native-purchases';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRevenueCat, ENTITLEMENT_ID } from '@/context/RevenueCatContext';
import { trackPaywallShown } from '@/lib/analytics';
import { formatBillingAmount, calcSavingsPct } from '@/lib/pricing';
import { resolvePaywallResult } from '@/lib/paywall-result';
import { FontSize, Spacing, Radius, ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/context/ThemeContext';

const FEATURES = [
  { icon: '💉', text: 'Meal plans synced to your injection day' },
  { icon: '🌿', text: 'Symptom insights from your AI coach, Nori' },
  { icon: '🛒', text: 'Grocery list with budget & NOVA tracking' },
  { icon: '♾️', text: 'Unlimited plan generation & meal swaps' },
];

export default function AppPaywall() {
  const colors = useThemeColors();
  const s = makeStyles(colors);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentOffering, isLoading, purchasePackage, restorePurchases, refreshCustomerInfo } = useRevenueCat();
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<PurchasesPackage | null>(null);
  const resolved = useRef(false);

  const annualPkg = currentOffering?.annual
    ?? currentOffering?.availablePackages.find((p) => p.packageType === PACKAGE_TYPE.ANNUAL)
    ?? null;
  const monthlyPkg = currentOffering?.monthly
    ?? currentOffering?.availablePackages.find((p) => p.packageType === PACKAGE_TYPE.MONTHLY)
    ?? null;

  useEffect(() => {
    if (!selectedPkg && annualPkg) setSelectedPkg(annualPkg);
    else if (!selectedPkg && monthlyPkg) setSelectedPkg(monthlyPkg);
  }, [annualPkg, monthlyPkg, selectedPkg]);

  useEffect(() => {
    trackPaywallShown('in_app');
    return () => {
      // If the user swipes away without purchasing, resolve the gate as cancelled.
      if (!resolved.current) resolvePaywallResult(false);
    };
  }, []);

  const savingsPct = annualPkg && monthlyPkg ? calcSavingsPct(monthlyPkg, annualPkg) : null;

  function finish(purchased: boolean) {
    if (resolved.current) return;
    resolved.current = true;
    resolvePaywallResult(purchased);
    if (router.canGoBack()) router.back();
    else router.replace('/(app)/home');
  }

  async function handlePurchase() {
    if (!selectedPkg || purchasing) return;
    setPurchasing(true);
    try {
      await purchasePackage(selectedPkg);
      await refreshCustomerInfo();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      finish(true);
    } catch (e: unknown) {
      if (!(e as { userCancelled?: boolean }).userCancelled) {
        Alert.alert('Purchase failed', (e as Error).message ?? 'Something went wrong. Please try again.');
      }
    } finally {
      setPurchasing(false);
    }
  }

  async function handleRestore() {
    setPurchasing(true);
    try {
      const info = await restorePurchases();
      if (info.entitlements.active[ENTITLEMENT_ID]) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        finish(true);
      } else {
        Alert.alert('No subscription found', 'No active FoodWise Pro subscription was found for this Apple ID.');
      }
    } catch {
      Alert.alert('Restore failed', 'Could not restore purchases. Please try again.');
    } finally {
      setPurchasing(false);
    }
  }

  const packages = [annualPkg, monthlyPkg].filter((p): p is PurchasesPackage => p !== null);

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <TouchableOpacity
        style={[s.closeBtn, { top: insets.top + 8 }]}
        onPress={() => finish(false)}
        accessibilityLabel="Close"
        accessibilityRole="button"
      >
        <Ionicons name="close" size={24} color={colors.mutedForeground} />
      </TouchableOpacity>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + 56 }]}
        bounces={false}
      >
        <View style={s.header}>
          <Image
            source={require('@/assets/images/nori_character.png')}
            style={s.nori}
            resizeMode="contain"
          />
          <Text style={s.title}>FoodWise Pro</Text>
          <Text style={s.subtitle}>The nutrition companion built for GLP-1 users</Text>
        </View>

        <View style={s.features}>
          {FEATURES.map(f => (
            <View key={f.text} style={s.featureRow}>
              <Text style={s.featureIcon}>{f.icon}</Text>
              <Text style={s.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>

        {isLoading || packages.length === 0 ? (
          <View style={s.loadingBox}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <View style={s.plans}>
            {packages.map(pkg => {
              const isAnnual = pkg.packageType === PACKAGE_TYPE.ANNUAL;
              const isSelected = selectedPkg?.product.identifier === pkg.product.identifier;
              const periodLabel = isAnnual ? 'Yearly' : 'Monthly';
              const priceLine = formatBillingAmount(pkg);
              return (
                <TouchableOpacity
                  key={pkg.product.identifier}
                  style={[s.planCard, isSelected && s.planCardSelected]}
                  onPress={() => { Haptics.selectionAsync(); setSelectedPkg(pkg); }}
                  activeOpacity={0.8}
                >
                  <View style={s.planCardInner}>
                    <View style={s.planCardLeft}>
                      <View style={s.planLabelRow}>
                        <Text style={[s.periodLabel, isSelected && s.periodLabelSelected]}>
                          {periodLabel}
                        </Text>
                        {isAnnual && savingsPct != null && (
                          <View style={s.badge}>
                            <Text style={s.badgeText}>Save {savingsPct}%</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[s.price, isSelected && s.priceSelected]}>
                        {priceLine}
                      </Text>
                      <Text style={s.billingSubtext}>
                        {isAnnual ? 'Best value · billed once a year' : 'Billed monthly'}
                      </Text>
                    </View>
                    <View style={[s.radio, isSelected && s.radioSelected]}>
                      {isSelected && <View style={s.radioDot} />}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <Text style={s.trialNote}>7-day free trial · Cancel anytime in Settings</Text>

        <TouchableOpacity
          style={[s.ctaBtn, (!selectedPkg || purchasing || isLoading) && s.ctaBtnDisabled]}
          onPress={handlePurchase}
          disabled={!selectedPkg || purchasing || isLoading}
          activeOpacity={0.85}
        >
          {purchasing ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text style={s.ctaBtnText}>Start Free Trial</Text>
          )}
        </TouchableOpacity>

        <View style={s.footer}>
          <TouchableOpacity onPress={handleRestore} disabled={purchasing}>
            <Text style={s.footerLink}>Restore purchases</Text>
          </TouchableOpacity>
          <Text style={s.footerDot}>·</Text>
          <TouchableOpacity onPress={() => finish(false)} disabled={purchasing}>
            <Text style={s.footerLink}>Not now</Text>
          </TouchableOpacity>
        </View>

        <View style={s.legalLinks}>
          <TouchableOpacity onPress={() => Linking.openURL('https://kmfutrell93.github.io/foodwise-legal/privacy')}>
            <Text style={s.footerLink}>Privacy Policy</Text>
          </TouchableOpacity>
          <Text style={s.footerDot}>·</Text>
          <TouchableOpacity onPress={() => Linking.openURL('https://kmfutrell93.github.io/foodwise-legal/terms')}>
            <Text style={s.footerLink}>Terms of Service</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.legal}>
          Payment will be charged to your Apple ID account. Subscription automatically renews unless
          cancelled at least 24 hours before the end of the current period. Manage or cancel in
          iPhone Settings → Apple ID → Subscriptions → FoodWise.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    closeBtn: {
      position: 'absolute',
      right: Spacing.lg,
      zIndex: 10,
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scroll: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing['3xl'] },

    header: { alignItems: 'center', marginBottom: Spacing['2xl'] },
    nori: { width: 96, height: 96, marginBottom: Spacing.md },
    title: { fontSize: FontSize['2xl'], fontFamily: 'PlusJakartaSans-ExtraBold', color: c.foreground, marginBottom: Spacing.sm },
    subtitle: { fontSize: FontSize.sm, color: c.mutedForeground, textAlign: 'center' },

    features: { gap: Spacing.md, marginBottom: Spacing['2xl'] },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    featureIcon: { fontSize: 20, width: 28 },
    featureText: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Medium', color: c.foreground, flex: 1 },

    loadingBox: { height: 160, alignItems: 'center', justifyContent: 'center' },

    plans: { gap: Spacing.md, marginBottom: Spacing.lg },
    planCard: {
      borderRadius: Radius.lg,
      borderWidth: 1.5,
      borderColor: c.border,
      backgroundColor: c.card,
      padding: Spacing.lg,
    },
    planCardSelected: {
      borderColor: c.primary,
      backgroundColor: c.primary + '10',
    },
    planCardInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    planCardLeft: { flex: 1, gap: 4 },
    planLabelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 2 },
    periodLabel: {
      fontSize: FontSize.sm,
      fontFamily: 'PlusJakartaSans-Bold',
      color: c.mutedForeground,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    periodLabelSelected: { color: c.primary },
    badge: {
      backgroundColor: c.primary,
      borderRadius: Radius.full,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    badgeText: {
      fontSize: 10,
      fontFamily: 'PlusJakartaSans-ExtraBold',
      color: c.primaryForeground,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    price: {
      fontSize: FontSize['2xl'],
      fontFamily: 'PlusJakartaSans-ExtraBold',
      color: c.foreground,
    },
    priceSelected: { color: c.primary },
    billingSubtext: {
      fontSize: FontSize.xs,
      color: c.mutedForeground,
      marginTop: 2,
    },
    radio: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: Spacing.md,
    },
    radioSelected: { borderColor: c.primary },
    radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: c.primary },

    trialNote: {
      textAlign: 'center',
      fontSize: FontSize.xs,
      color: c.mutedForeground,
      marginBottom: Spacing.lg,
    },

    ctaBtn: {
      backgroundColor: c.primary,
      borderRadius: Radius.lg,
      paddingVertical: 16,
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    ctaBtnDisabled: { opacity: 0.5 },
    ctaBtnText: {
      fontSize: FontSize.base,
      fontFamily: 'PlusJakartaSans-ExtraBold',
      color: c.primaryForeground,
    },

    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.xl,
    },
    footerLink: { fontSize: FontSize.xs, color: c.mutedForeground, textDecorationLine: 'underline' },
    footerDot: { fontSize: FontSize.xs, color: c.mutedForeground },
    legalLinks: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.sm,
    },

    legal: {
      fontSize: 10,
      color: c.mutedForeground,
      textAlign: 'center',
      lineHeight: 15,
      opacity: 0.7,
    },
  });
}
