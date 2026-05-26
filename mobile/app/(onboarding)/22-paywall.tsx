import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Colors, FontSize, Spacing, Radius } from '@/constants/theme';
import { useOnboarding } from '@/context/OnboardingContext';

type Plan = 'monthly' | 'annual';

export default function Paywall() {
  const router = useRouter();
  const { completeOnboarding } = useOnboarding();
  const [plan, setPlan] = useState<Plan>('annual');
  const [loading, setLoading] = useState(false);

  async function handleStart() {
    setLoading(true);
    // RevenueCat purchase will be wired here in Phase 3
    // For now, save onboarding and route to app
    await completeOnboarding();
    router.replace('/(app)/home');
    setLoading(false);
  }

  async function handleFree() {
    setLoading(true);
    await completeOnboarding();
    router.replace('/(app)/home');
    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.emoji}>🦉</Text>
        <Text style={styles.label}>Start free today</Text>
        <Text style={styles.title}>7 days free.{'\n'}Cancel anytime.</Text>

        <View style={styles.plans}>
          <TouchableOpacity
            style={[styles.planCard, plan === 'annual' && styles.planCardSelected]}
            onPress={() => setPlan('annual')}
            activeOpacity={0.85}
          >
            <View style={styles.planBadge}>
              <Text style={styles.planBadgeText}>BEST VALUE</Text>
            </View>
            <View style={styles.planRow}>
              <View>
                <Text style={[styles.planName, plan === 'annual' && styles.planNameSelected]}>Annual</Text>
                <Text style={styles.planPrice}>$79.99/yr</Text>
              </View>
              <View style={styles.perWeekBadge}>
                <Text style={styles.perWeek}>$1.54</Text>
                <Text style={styles.perWeekSub}>/week</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.planCard, plan === 'monthly' && styles.planCardSelected]}
            onPress={() => setPlan('monthly')}
            activeOpacity={0.85}
          >
            <View style={styles.planRow}>
              <View>
                <Text style={[styles.planName, plan === 'monthly' && styles.planNameSelected]}>Monthly</Text>
                <Text style={styles.planPrice}>$12.99/mo</Text>
              </View>
              <View>
                <Text style={styles.perWeek}>$2.99</Text>
                <Text style={styles.perWeekSub}>/week</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <Button
          label={`Start 7-day free trial`}
          onPress={handleStart}
          loading={loading}
          style={{ marginBottom: Spacing.sm }}
        />

        <Text style={styles.trialNote}>
          After 7 days, {plan === 'annual' ? '$79.99/year' : '$12.99/month'}. Cancel before trial ends and you won't be charged.
        </Text>

        <Text style={styles.freeCta} onPress={handleFree}>Continue with free plan →</Text>

        <Text style={styles.legal}>
          Subscription automatically renews unless cancelled at least 24 hours before the renewal date. Manage in App Store settings.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.xl, paddingTop: Spacing['3xl'], paddingBottom: Spacing['3xl'] },
  emoji: { fontSize: 48, textAlign: 'center', marginBottom: Spacing.lg },
  label: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Bold', color: Colors.primary, letterSpacing: 2, textTransform: 'uppercase', marginBottom: Spacing.sm, textAlign: 'center' },
  title: { fontSize: FontSize['3xl'], fontFamily: 'PlusJakartaSans-ExtraBold', color: Colors.foreground, lineHeight: 38, marginBottom: Spacing['2xl'], textAlign: 'center' },
  plans: { gap: Spacing.sm, marginBottom: Spacing.xl },
  planCard: { padding: Spacing.xl, borderRadius: Radius.xl, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.card },
  planCardSelected: { borderColor: Colors.primary, backgroundColor: 'rgba(232,157,53,0.06)' },
  planBadge: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: Spacing.sm },
  planBadgeText: { fontSize: FontSize.xs, color: Colors.primaryForeground, fontFamily: 'PlusJakartaSans-Bold', letterSpacing: 0.5 },
  planRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  planName: { fontSize: FontSize.xl, fontFamily: 'PlusJakartaSans-Bold', color: Colors.foreground },
  planNameSelected: { color: Colors.primary },
  planPrice: { fontSize: FontSize.sm, color: Colors.mutedForeground, marginTop: 2 },
  perWeekBadge: { alignItems: 'flex-end' },
  perWeek: { fontSize: FontSize['2xl'], fontFamily: 'PlusJakartaSans-ExtraBold', color: Colors.foreground },
  perWeekSub: { fontSize: FontSize.xs, color: Colors.mutedForeground },
  trialNote: { fontSize: FontSize.xs, color: Colors.mutedForeground, textAlign: 'center', marginBottom: Spacing.lg, lineHeight: 18 },
  freeCta: { textAlign: 'center', color: Colors.mutedForeground, fontSize: FontSize.base, paddingVertical: Spacing.md },
  legal: { fontSize: FontSize.xs, color: Colors.mutedForeground, textAlign: 'center', lineHeight: 18, marginTop: Spacing.md },
});
