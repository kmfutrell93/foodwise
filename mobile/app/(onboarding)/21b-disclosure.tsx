import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingShell } from '@/components/ui/OnboardingShell';
import { Button } from '@/components/ui/Button';
import { FontSize, Spacing, Radius, ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/context/ThemeContext';

const DATA_POINTS = [
  { icon: '💊', label: 'Your GLP-1 medication & injection day' },
  { icon: '🤢', label: 'Symptoms you log (nausea, fatigue, etc.)' },
  { icon: '🚫', label: 'Food aversions & dietary restrictions' },
  { icon: '🎯', label: 'Protein goal & weekly budget' },
  { icon: '🍳', label: 'Cooking preferences & serving size' },
];

export default function AiDisclosure() {
  const colors = useThemeColors();
  const s = makeStyles(colors);
  const router = useRouter();

  return (
    <OnboardingShell step={21} screenKey="21b-disclosure">
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <Text style={s.label}>AI & Privacy</Text>
        <Text style={s.title}>How Nori{'\n'}works</Text>
        <Text style={s.sub}>
          FoodWise uses Claude by Anthropic to generate your personalized meal plans and insights.
        </Text>

        <View style={s.card}>
          <Text style={s.cardTitle}>What we send to Anthropic</Text>
          <View style={s.list}>
            {DATA_POINTS.map(d => (
              <View key={d.label} style={s.listRow}>
                <Text style={s.listIcon}>{d.icon}</Text>
                <Text style={s.listText}>{d.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[s.card, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
          <Text style={[s.cardTitle, { color: colors.primary }]}>🔒 Your data is protected</Text>
          <Text style={s.noteText}>
            Anthropic does <Text style={s.noteBold}>not</Text> store your data or use it to train AI models.
            Your information is only used to generate your response and is discarded immediately after.
          </Text>
        </View>

        <View style={s.disclaimer}>
          <Text style={s.disclaimerText}>
            ⚠️ <Text style={s.disclaimerBold}>Medical disclaimer:</Text> FoodWise is a nutrition support
            tool, not a medical device. Meal suggestions are not a substitute for advice from your
            doctor, dietitian, or prescribing provider. Always follow your healthcare team&apos;s guidance
            regarding your GLP-1 medication.
          </Text>
        </View>
      </ScrollView>
      <View style={s.footer}>
        <Button label="I understand, continue" onPress={() => router.push('/(onboarding)/22-paywall')} />
      </View>
    </OnboardingShell>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    content: { paddingTop: Spacing.lg, paddingBottom: Spacing.md },
    footer: { paddingTop: Spacing.md, paddingBottom: Spacing.xl },
    label: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Bold', color: c.primary, letterSpacing: 2, textTransform: 'uppercase', marginBottom: Spacing.md },
    title: { fontSize: FontSize['3xl'], fontFamily: 'PlusJakartaSans-ExtraBold', color: c.foreground, lineHeight: 38, marginBottom: Spacing.sm },
    sub: { fontSize: FontSize.sm, color: c.mutedForeground, marginBottom: Spacing.xl, lineHeight: 22 },
    card: { backgroundColor: c.card, borderRadius: Radius.xl, borderWidth: 1, borderColor: c.border, padding: Spacing.xl, marginBottom: Spacing.lg },
    cardTitle: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-ExtraBold', color: c.foreground, marginBottom: Spacing.lg },
    list: { gap: Spacing.md },
    listRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
    listIcon: { fontSize: 16, width: 24 },
    listText: { fontSize: FontSize.sm, color: c.foreground, flex: 1, lineHeight: 20 },
    noteText: { fontSize: FontSize.sm, color: c.foreground, lineHeight: 22 },
    noteBold: { fontFamily: 'PlusJakartaSans-Bold' },
    disclaimer: { backgroundColor: c.muted, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.xl },
    disclaimerText: { fontSize: FontSize.xs, color: c.mutedForeground, lineHeight: 20 },
    disclaimerBold: { fontFamily: 'PlusJakartaSans-Bold', color: c.foreground },
  });
}
