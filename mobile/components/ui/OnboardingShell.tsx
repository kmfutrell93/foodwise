import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { getOnboardingProgressPct, OnboardingScreenKey } from '@/constants/onboardingFlow';

type Props = {
  step: number;
  // Omit on screens outside the linear onboarding funnel (e.g. sign-in,
  // reached as a side entrance rather than a step in the flow) to hide
  // the progress bar instead of showing a meaningless percentage.
  screenKey?: OnboardingScreenKey;
  children: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  skipRoute?: string;
  onSkip?: () => void;
  centerLabel?: string;
};

const BOTTOM_DOT_COUNT = 7;
const STEP_NAV_START   = 10;
const STEP_NAV_END     = 12;

export function OnboardingShell({
  step, screenKey, children, showBack = true, onBack, skipRoute, onSkip, centerLabel,
}: Props) {
  const router = useRouter();

  const showBottomDots = step >= 1 && step <= BOTTOM_DOT_COUNT;
  const showStepNav    = step >= STEP_NAV_START && step <= STEP_NAV_END;
  const questionStep   = showStepNav ? step - STEP_NAV_START + 1 : 0;
  const progressPct    = screenKey ? getOnboardingProgressPct(screenKey) : null;

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      {/* Top progress bar */}
      {progressPct !== null && (
        <View style={s.progressTrack}>
          <View style={[s.progressFill, { width: `${progressPct}%` }]} />
        </View>
      )}

      {/* Nav row */}
      <View style={s.nav}>
        {showBack ? (
          <TouchableOpacity
            onPress={onBack ?? (() => router.back())}
            style={s.backBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
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

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  progressTrack: {
    height: 4,
    backgroundColor: Colors.backgroundMid,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    backgroundColor: Colors.teal,
    borderRadius: 2,
  },

  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundMid,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  stepDots: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  centerBadgeWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  centerBadge: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-Bold',
    color: Colors.textSecondary,
    backgroundColor: Colors.backgroundMid,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },

  skipBtn: { width: 52, alignItems: 'flex-end', justifyContent: 'center', height: 40 },
  skipText: { fontSize: 14, color: Colors.textSecondary },

  content: { flex: 1, paddingHorizontal: Spacing.xl },

  dotsBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  dot: { height: 8, borderRadius: Radius.full },
  dotActive:   { width: 24, backgroundColor: Colors.teal },
  dotInactive: { width: 8,  backgroundColor: Colors.borderStrong },
});
