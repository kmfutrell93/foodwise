import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Colors, FontSize, Spacing, Radius } from '@/constants/theme';

export default function PricingIntro() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.label}>Before we start</Text>
        <Text style={styles.title}>FoodWise Pro{'\n'}pays for itself{'\n'}in one week.</Text>

        <View style={styles.cards}>
          <View style={styles.card}>
            <Text style={styles.cardIcon}>🍔</Text>
            <Text style={styles.cardTitle}>Random meal planning</Text>
            <View style={styles.divider} />
            <Text style={styles.cost}>$47/wk</Text>
            <Text style={styles.costSub}>avg. extra food waste + poor choices</Text>
          </View>
          <View style={[styles.card, styles.cardHighlight]}>
            <Text style={styles.cardIcon}>🦉</Text>
            <Text style={[styles.cardTitle, { color: Colors.primary }]}>FoodWise Pro</Text>
            <View style={styles.divider} />
            <Text style={[styles.cost, { color: Colors.primary }]}>$1.54/wk</Text>
            <Text style={styles.costSub}>annual plan · 7-day free trial</Text>
          </View>
        </View>

        <Text style={styles.note}>
          The average GLP-1 user wastes $180/month on food that doesn't fit their new appetite. FoodWise fixes that.
        </Text>

        <View style={styles.spacer} />
        <Button label="See the plans" onPress={() => router.push('/(onboarding)/20-comparison')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing['3xl'], paddingBottom: Spacing.xl },
  label: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Bold', color: Colors.primary, letterSpacing: 2, textTransform: 'uppercase', marginBottom: Spacing.md },
  title: { fontSize: FontSize['3xl'], fontFamily: 'PlusJakartaSans-ExtraBold', color: Colors.foreground, lineHeight: 38, marginBottom: Spacing['2xl'] },
  cards: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
  card: { flex: 1, padding: Spacing.xl, borderRadius: Radius.xl, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', gap: Spacing.sm },
  cardHighlight: { borderColor: 'rgba(232,157,53,0.4)', backgroundColor: 'rgba(232,157,53,0.06)' },
  cardIcon: { fontSize: 32 },
  cardTitle: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Bold', color: Colors.foreground, textAlign: 'center' },
  divider: { width: '100%', height: 1, backgroundColor: Colors.border },
  cost: { fontSize: FontSize['2xl'], fontFamily: 'PlusJakartaSans-ExtraBold', color: Colors.foreground },
  costSub: { fontSize: FontSize.xs, color: Colors.mutedForeground, textAlign: 'center', lineHeight: 16 },
  note: { fontSize: FontSize.sm, color: Colors.mutedForeground, lineHeight: 22, textAlign: 'center' },
  spacer: { flex: 1 },
});
