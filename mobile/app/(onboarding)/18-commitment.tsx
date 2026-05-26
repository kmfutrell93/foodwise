import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Colors, FontSize, Spacing, Radius } from '@/constants/theme';

export default function Commitment() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.emoji}>🤝</Text>
        <Text style={styles.label}>Our commitment to you</Text>
        <Text style={styles.title}>FoodWise{'\n'}promises.</Text>

        <View style={styles.promises}>
          {[
            { icon: '🔒', text: 'Your health data never leaves your device without your permission' },
            { icon: '🧬', text: "We'll never give you advice that contradicts your doctor's guidance" },
            { icon: '🎯', text: 'Every meal plan is built around your specific protein target' },
            { icon: '💉', text: "We'll always respect your injection schedule, no matter what" },
          ].map((p) => (
            <View key={p.text} style={styles.promise}>
              <Text style={styles.promiseIcon}>{p.icon}</Text>
              <Text style={styles.promiseText}>{p.text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            FoodWise provides nutrition guidance only. Always consult your healthcare provider for medical advice about your GLP-1 medication.
          </Text>
        </View>

        <View style={styles.spacer} />
        <Button label="I'm in — let's see pricing" onPress={() => router.push('/(onboarding)/19-pricing-intro')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing['3xl'], paddingBottom: Spacing.xl },
  emoji: { fontSize: 48, marginBottom: Spacing.lg },
  label: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Bold', color: Colors.primary, letterSpacing: 2, textTransform: 'uppercase', marginBottom: Spacing.sm },
  title: { fontSize: FontSize['3xl'], fontFamily: 'PlusJakartaSans-ExtraBold', color: Colors.foreground, lineHeight: 38, marginBottom: Spacing['2xl'] },
  promises: { gap: Spacing.lg, marginBottom: Spacing.xl },
  promise: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  promiseIcon: { fontSize: 22, width: 30 },
  promiseText: { flex: 1, fontSize: FontSize.base, color: Colors.foreground, lineHeight: 24 },
  disclaimer: {
    padding: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: Colors.muted,
  },
  disclaimerText: { fontSize: FontSize.xs, color: Colors.mutedForeground, lineHeight: 18 },
  spacer: { flex: 1 },
});
