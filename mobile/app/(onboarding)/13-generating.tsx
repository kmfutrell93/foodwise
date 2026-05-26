import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, Spacing } from '@/constants/theme';
import { useOnboarding } from '@/context/OnboardingContext';

const steps = [
  'Analyzing your GLP-1 medication schedule…',
  'Calculating your protein floor…',
  'Matching meals to your budget…',
  'Scheduling injection-day adjustments…',
  'Finalizing your 7-day plan…',
];

export default function Generating() {
  const router = useRouter();
  const { saveStep } = useOnboarding();
  const [step, setStep] = useState(0);
  const dotAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(dotAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ])
    ).start();

    let i = 0;
    const iv = setInterval(() => {
      i++;
      if (i < steps.length) {
        setStep(i);
      } else {
        clearInterval(iv);
        saveStep(13).then(() => {
          router.push('/(onboarding)/14-meal-reveal');
        });
      }
    }, 900);

    return () => clearInterval(iv);
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Animated.View style={[styles.orb, { opacity: dotAnim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }]}>
          <Text style={styles.orbIcon}>🦉</Text>
        </Animated.View>
        <Text style={styles.title}>Building your plan…</Text>
        <View style={styles.stepList}>
          {steps.map((s, idx) => (
            <View key={s} style={[styles.stepRow, idx > step && styles.stepFuture]}>
              <Text style={styles.stepDot}>{idx < step ? '✓' : idx === step ? '→' : '·'}</Text>
              <Text style={[styles.stepText, idx === step && styles.stepTextActive]}>{s}</Text>
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
  orb: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(232,157,53,0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(232,157,53,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing['2xl'],
  },
  orbIcon: { fontSize: 48 },
  title: { fontSize: FontSize['2xl'], fontFamily: 'PlusJakartaSans-ExtraBold', color: Colors.foreground, marginBottom: Spacing['2xl'] },
  stepList: { width: '100%', gap: Spacing.md },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  stepFuture: { opacity: 0.3 },
  stepDot: { width: 20, color: Colors.primary, fontFamily: 'PlusJakartaSans-Bold', fontSize: FontSize.sm },
  stepText: { fontSize: FontSize.sm, color: Colors.mutedForeground, flex: 1 },
  stepTextActive: { color: Colors.foreground, fontFamily: 'PlusJakartaSans-SemiBold' },
});
