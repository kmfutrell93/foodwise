import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FontSize, Spacing, Radius, ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/context/ThemeContext';
import {
  CITATIONS, CATEGORY_LABELS, SOURCES_DISCLAIMER, SourceCategory,
} from '@/lib/sources';

const ORDER: SourceCategory[] = ['muscle_glp1', 'protein', 'gi_nausea', 'general'];

export default function SourcesScreen() {
  const colors = useThemeColors();
  const s = makeStyles(colors);
  const router = useRouter();

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={s.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
          <Text style={s.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.content}
      >
        <Text style={s.title}>Sources & References</Text>
        <Text style={s.sub}>
          Health and nutrition recommendations in FoodWise are informed by the following published
          sources. Tap any item to open the full reference.
        </Text>

        {ORDER.map(cat => {
          const items = CITATIONS.filter(c => c.category === cat);
          if (items.length === 0) return null;
          return (
            <View key={cat} style={s.section}>
              <Text style={s.sectionLabel}>{CATEGORY_LABELS[cat]}</Text>
              {items.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={s.card}
                  onPress={() => Linking.openURL(item.url)}
                  activeOpacity={0.75}
                  accessibilityRole="link"
                  accessibilityLabel={`Open ${item.title}`}
                >
                  <View style={s.cardTop}>
                    <Text style={s.cardTitle}>{item.title}</Text>
                    <Ionicons name="open-outline" size={16} color={colors.primary} />
                  </View>
                  <Text style={s.cardAuthors}>{item.authors}</Text>
                  <Text style={s.cardDetail}>{item.detail}</Text>
                  <Text style={s.cardBacks}>Supports: {item.backs}</Text>
                  <Text style={s.cardUrl} numberOfLines={1}>{item.url}</Text>
                </TouchableOpacity>
              ))}
            </View>
          );
        })}

        <View style={s.disclaimer}>
          <Text style={s.disclaimerText}>{SOURCES_DISCLAIMER}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
    backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: Spacing.sm },
    backText: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-SemiBold', color: c.foreground },
    content: { paddingHorizontal: Spacing.xl, paddingBottom: 48 },
    title: {
      fontSize: FontSize['2xl'],
      fontFamily: 'PlusJakartaSans-ExtraBold',
      color: c.foreground,
      marginBottom: Spacing.sm,
    },
    sub: {
      fontSize: FontSize.sm,
      color: c.mutedForeground,
      lineHeight: 20,
      marginBottom: Spacing['2xl'],
    },
    section: { marginBottom: Spacing.xl },
    sectionLabel: {
      fontSize: FontSize.xs,
      fontFamily: 'PlusJakartaSans-ExtraBold',
      color: c.mutedForeground,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: Spacing.md,
    },
    card: {
      backgroundColor: c.card,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
      gap: 6,
    },
    cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: Spacing.sm },
    cardTitle: {
      flex: 1,
      fontSize: FontSize.sm,
      fontFamily: 'PlusJakartaSans-ExtraBold',
      color: c.foreground,
      lineHeight: 20,
    },
    cardAuthors: { fontSize: FontSize.xs, color: c.mutedForeground, lineHeight: 16 },
    cardDetail: { fontSize: FontSize.xs, color: c.foreground, lineHeight: 18, marginTop: 2 },
    cardBacks: {
      fontSize: FontSize.xs,
      fontFamily: 'PlusJakartaSans-SemiBold',
      color: c.primary,
      marginTop: 4,
    },
    cardUrl: { fontSize: 10, color: c.mutedForeground, marginTop: 2 },
    disclaimer: {
      backgroundColor: c.muted,
      borderRadius: Radius.lg,
      padding: Spacing.lg,
      marginTop: Spacing.md,
    },
    disclaimerText: { fontSize: FontSize.xs, color: c.mutedForeground, lineHeight: 18 },
  });
}
