import { View, Text, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Colors, FontSize, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';

export default function Welcome() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleStart() {
    setLoading(true);
    // Anonymous sign-in so we can persist progress immediately
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      await supabase.auth.signInAnonymously();
    }
    router.push('/(onboarding)/02-problem');
    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.top}>
          <Image
            source={require('@/assets/images/nori.png')}
            style={styles.nori}
            resizeMode="contain"
          />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>For GLP-1 Users</Text>
          </View>
        </View>

        <View style={styles.copy}>
          <Text style={styles.title}>Meet Nori,{'\n'}your GLP-1{'\n'}nutrition guide.</Text>
          <Text style={styles.subtitle}>
            Smart meal plans that work with your medication — protecting your muscle while you lose weight.
          </Text>
        </View>

        <View style={styles.bottom}>
          <Button label="Get started — it's free" onPress={handleStart} loading={loading} />
          <Text style={styles.disclaimer}>No credit card required · Cancel anytime</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing['2xl'], paddingBottom: Spacing.xl },
  top: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  nori: { width: 180, height: 180, marginBottom: Spacing.lg },
  badge: {
    backgroundColor: 'rgba(232,157,53,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(232,157,53,0.3)',
    borderRadius: 9999,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  badgeText: { color: Colors.primary, fontFamily: 'PlusJakartaSans-SemiBold', fontSize: FontSize.sm },
  copy: { marginBottom: Spacing['2xl'] },
  title: {
    fontSize: FontSize['4xl'],
    fontFamily: 'PlusJakartaSans-ExtraBold',
    color: Colors.foreground,
    lineHeight: 44,
    marginBottom: Spacing.lg,
  },
  subtitle: {
    fontSize: FontSize.base,
    color: Colors.mutedForeground,
    lineHeight: 24,
  },
  bottom: { gap: Spacing.md },
  disclaimer: {
    textAlign: 'center',
    color: Colors.mutedForeground,
    fontSize: FontSize.xs,
  },
});
