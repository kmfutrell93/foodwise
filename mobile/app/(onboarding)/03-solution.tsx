import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { OnboardingShell } from '@/components/ui/OnboardingShell';
import { Button } from '@/components/ui/Button';
import { FontSize, Spacing, Radius, ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/context/ThemeContext';

const WITHOUT = ['Guessing what to eat', 'Skipping meals', 'Losing muscle', 'Low energy & fatigue', 'Hitting a plateau'];
const WITH = ['AI-built meal plans', 'High protein, low volume', 'Muscle preserved', 'Steady energy', 'Budget-friendly'];

export default function Solution() {
  const colors = useThemeColors();
  const s = makeStyles(colors);
  const router = useRouter();

  return (
    <OnboardingShell step={3} skipRoute="/(onboarding)/10-restrictions">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>

        <Text style={s.label}>The Right Way</Text>
        <Text style={s.title}>
          Most GLP-1 users{'\n'}make the same{'\n'}<Text style={s.titleAccent}>costly mistake.</Text>
        </Text>
        <Text style={s.sub}>
          They focus on eating <Text style={s.emphStrong}>less.</Text>{'\n'}
          The real goal is eating <Text style={s.emphPrimary}>right.</Text>
        </Text>

        {/* Comparison grid */}
        <View style={s.grid}>
          {/* Without FoodWise */}
          <View style={[s.col, s.colBad]}>
            <View style={s.colHeader}>
              <Text style={[s.colHeaderIcon, { color: colors.destructive }]}>✕</Text>
              <Text style={[s.colHeaderText, { color: colors.destructive }]}>Without{'\n'}FoodWise</Text>
            </View>
            {WITHOUT.map(item => (
              <Text key={item} style={[s.item, { color: colors.mutedForeground }]}>• {item}</Text>
            ))}
          </View>
          {/* With FoodWise */}
          <View style={[s.col, s.colGood]}>
            <View style={s.colHeader}>
              <Text style={[s.colHeaderIcon, { color: colors.secondary }]}>✓</Text>
              <Text style={[s.colHeaderText, { color: colors.secondary }]}>With{'\n'}FoodWise</Text>
            </View>
            {WITH.map(item => (
              <Text key={item} style={[s.item, { color: colors.foreground }]}>• {item}</Text>
            ))}
          </View>
        </View>

        {/* Nori quote */}
        <View style={s.noriCard}>
          <Image
            source={require('@/assets/images/nori_character.png')}
            style={s.noriImg}
            resizeMode="contain"
          />
          <Text style={s.noriQuote}>
            "On GLP-1, every bite counts double. FoodWise makes sure each one works{' '}
            <Text style={s.noriHighlight}>harder for you.</Text>"
          </Text>
        </View>

        <Button label="Show me the right way" onPress={() => router.push('/(onboarding)/04-aha')} />
      </ScrollView>
    </OnboardingShell>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    content: { paddingTop: Spacing.md, paddingBottom: Spacing['2xl'] },

    label: {
      fontSize: FontSize.sm,
      fontFamily: 'PlusJakartaSans-Bold',
      color: c.primary,
      letterSpacing: 2,
      textTransform: 'uppercase',
      marginBottom: Spacing.md,
    },
    title: {
      fontSize: FontSize['3xl'],
      fontFamily: 'PlusJakartaSans-ExtraBold',
      color: c.foreground,
      lineHeight: 38,
      marginBottom: Spacing.md,
    },
    titleAccent: { color: c.accent },
    sub: {
      fontSize: FontSize.base,
      color: c.mutedForeground,
      lineHeight: 24,
      marginBottom: Spacing['2xl'],
    },
    emphStrong: { color: c.foreground, fontFamily: 'PlusJakartaSans-Bold' },
    emphPrimary: { color: c.primary, fontFamily: 'PlusJakartaSans-Bold' },

    grid: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing['2xl'] },
    col: {
      flex: 1,
      padding: Spacing.lg,
      borderRadius: Radius.xl,
      borderWidth: 1,
      gap: Spacing.sm,
    },
    colBad: {
      backgroundColor: 'rgba(29,158,117,0.10)',
      borderColor: 'rgba(29,158,117,0.20)',
    },
    colGood: {
      backgroundColor: 'rgba(29,158,117,0.10)',
      borderColor: 'rgba(29,158,117,0.25)',
    },
    colHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    colHeaderIcon: { fontSize: 14, fontFamily: 'PlusJakartaSans-Bold' },
    colHeaderText: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-Bold', lineHeight: 14 },
    item: { fontSize: FontSize.xs, lineHeight: 16 },

    noriCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.md,
      padding: Spacing.lg,
      borderRadius: Radius.xl,
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: Spacing['2xl'],
    },
    noriImg: { width: 40, height: 40, marginTop: 2 },
    noriQuote: {
      flex: 1,
      fontSize: FontSize.sm,
      color: c.foreground,
      lineHeight: 20,
    },
    noriHighlight: { color: c.primary, fontFamily: 'PlusJakartaSans-Bold' },
  });
}
