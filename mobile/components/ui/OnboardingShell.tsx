import React from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ProgressBar } from './ProgressBar';
import { Colors, Spacing } from '@/constants/theme';

type Props = {
  step: number;
  children: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
};

const TOTAL_STEPS = 22;

export function OnboardingShell({ step, children, showBack = true, onBack }: Props) {
  const router = useRouter();

  function handleBack() {
    if (onBack) { onBack(); return; }
    router.back();
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={styles.nav}>
        {showBack ? (
          <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color={Colors.foreground} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}
        <View style={styles.progressWrap}>
          <ProgressBar total={TOTAL_STEPS} current={step} />
        </View>
        <View style={{ width: 40 }} />
      </View>
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressWrap: { flex: 1 },
  content: { flex: 1, paddingHorizontal: Spacing.xl },
});
