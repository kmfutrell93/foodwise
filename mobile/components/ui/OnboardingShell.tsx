import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Spacing, ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/context/ThemeContext';

type Props = {
  step: number;
  children: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  // Show "Skip" in top-right that navigates to this route (screens 1–7)
  skipRoute?: string;
  // Optional callback invoked before skip navigation (for analytics)
  onSkip?: () => void;
  // Optional text badge shown in nav center (e.g. "Question 1 of 2")
  centerLabel?: string;
};

const BOTTOM_DOT_COUNT = 7;
const STEP_NAV_START = 10;
const STEP_NAV_END = 12;

export function OnboardingShell({ step, children, showBack = true, onBack, skipRoute, onSkip, centerLabel }: Props) {
  const router = useRouter();
  const colors = useThemeColors();
  const s = makeStyles(colors);

  const showBottomDots = step >= 1 && step <= BOTTOM_DOT_COUNT;
  const showStepNav = step >= STEP_NAV_START && step <= STEP_NAV_END;
  const questionStep = showStepNav ? step - STEP_NAV_START + 1 : 0;

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      {/* Nav row */}
      <View style={s.nav}>
        {showBack ? (
          <TouchableOpacity
            onPress={onBack ?? (() => router.back())}
            style={s.backBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={22} color={colors.foreground} />
          </TouchableOpacity>
        ) : (
          <View style={s.backBtn} />
        )}

        {showStepNav ? (
          <View style={s.stepDots}>
            {[1, 2, 3].map(i => (
              <View
                key={i}
                style={[s.dot, i === questionStep ? s.dotActive : s.dotInactive]}
              />
            ))}
          </View>
        ) : centerLabel ? (
          <View style={s.centerBadgeWrap}>
            <Text style={s.centerBadge}>{centerLabel}</Text>
          </View>
        ) : (
          <View style={{ flex: 1 }} />
        )}

        {skipRoute ? (
          <TouchableOpacity
            onPress={() => { onSkip?.(); router.push(skipRoute as any); }}
            style={s.skipBtn}
            activeOpacity={0.7}
          >
            <Text style={s.skipText}>Skip</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 52 }} />
        )}
      </View>

      {/* Screen content */}
      <View style={s.content}>{children}</View>

      {/* Bottom progress dots for screens 1–7 */}
      {showBottomDots && (
        <View style={s.dotsBar}>
          {Array.from({ length: BOTTOM_DOT_COUNT }).map((_, i) => (
            <View
              key={i}
              style={[s.dot, i === step - 1 ? s.dotActive : s.dotInactive]}
            />
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },

    nav: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.sm,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.muted,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Step nav (screens 10–12)
    stepDots: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },

    // Text badge in nav center (e.g. "Question 1 of 2")
    centerBadgeWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    centerBadge: {
      fontSize: 11,
      fontFamily: 'PlusJakartaSans-Bold',
      color: c.mutedForeground,
      backgroundColor: c.muted,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      overflow: 'hidden',
    },

    // Skip link (screens 1–7)
    skipBtn: { width: 52, alignItems: 'flex-end', justifyContent: 'center', height: 40 },
    skipText: { fontSize: 14, color: c.mutedForeground },

    content: { flex: 1, paddingHorizontal: Spacing.xl },

    // Shared dot + bottom dots bar
    dotsBar: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 16,
    },
    dot: { height: 8, borderRadius: 999 },
    dotActive: { width: 24, backgroundColor: c.primary },
    dotInactive: { width: 8, backgroundColor: c.muted },
  });
}
