import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingShell } from '@/components/ui/OnboardingShell';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { FontSize, Spacing, Radius, ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/context/ThemeContext';
import { useOnboarding } from '@/context/OnboardingContext';
import { getOnboardingScreenAtStep } from '@/constants/onboardingFlow';

export default function SignIn() {
  const colors = useThemeColors();
  const s = makeStyles(colors);
  const router = useRouter();
  const { hydrateFromProfile } = useOnboarding();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const [showNameBanner, setShowNameBanner] = useState(false);
  const [nameUserId, setNameUserId] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [savingName, setSavingName] = useState(false);

  async function handleSignIn() {
    setError(null);
    setResetSent(false);
    if (!email || !password) {
      setError('Enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message);
        return;
      }
      if (!data.session) {
        setError('Could not sign in. Please try again.');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed, onboarding_step, full_name')
        .eq('id', data.session.user.id)
        .single();

      if (profile?.onboarding_completed) {
        if (!profile.full_name) {
          setNameUserId(data.session.user.id);
          setShowNameBanner(true);
        } else {
          router.replace('/(app)/home');
        }
      } else {
        await hydrateFromProfile(data.session.user.id);
        const step = profile?.onboarding_step ?? 0;
        const screen = getOnboardingScreenAtStep(step);
        router.replace(`/(onboarding)/${screen}` as any);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveName() {
    if (!nameUserId) return;
    if (!nameInput.trim()) {
      router.replace('/(app)/home');
      return;
    }
    setSavingName(true);
    try {
      await supabase.from('profiles').update({ full_name: nameInput.trim() }).eq('id', nameUserId);
    } finally {
      setSavingName(false);
      router.replace('/(app)/home');
    }
  }

  function handleDismissName() {
    router.replace('/(app)/home');
  }

  async function handleForgotPassword() {
    setError(null);
    setResetSent(false);
    if (!email) {
      setError('Enter your email above first.');
      return;
    }
    try {
      await supabase.auth.resetPasswordForEmail(email, { redirectTo: 'foodwise://reset-password' });
      setResetSent(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not send reset email.');
    }
  }

  if (showNameBanner) {
    return (
      <OnboardingShell step={0} showBack={false}>
        <View style={s.content}>
          <View style={s.logoRow}>
            <Image source={require('@/assets/images/nori_icon.png')} style={s.logoIcon} resizeMode="contain" />
            <Text style={[s.logoText, { color: colors.foreground }]}>FoodWise</Text>
          </View>

          <View style={[s.nameBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={s.nameBannerHeader}>
              <Text style={[s.nameBannerTitle, { color: colors.foreground }]}>What should we call you? (optional)</Text>
              <TouchableOpacity onPress={handleDismissName} activeOpacity={0.7}>
                <Ionicons name="close" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={[s.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground }]}
              placeholder="First name"
              placeholderTextColor={colors.mutedForeground}
              value={nameInput}
              onChangeText={setNameInput}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleSaveName}
              autoFocus
            />
            <TouchableOpacity onPress={handleSaveName} activeOpacity={0.7} style={s.nameSaveBtn} disabled={savingName}>
              <Text style={[s.nameSaveText, { color: colors.primary }]}>{savingName ? 'Saving…' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell step={0}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <View style={s.logoRow}>
          <Image source={require('@/assets/images/nori_icon.png')} style={s.logoIcon} resizeMode="contain" />
          <Text style={[s.logoText, { color: colors.foreground }]}>FoodWise</Text>
        </View>

        <Text style={[s.title, { color: colors.foreground }]}>Welcome back</Text>
        <Text style={[s.sub, { color: colors.mutedForeground }]}>Sign in to your FoodWise account</Text>

        <View style={s.form}>
          <Text style={[s.label, { color: colors.mutedForeground }]}>Email</Text>
          <TextInput
            style={[s.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground }]}
            placeholder="you@example.com"
            placeholderTextColor={colors.mutedForeground}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />

          <Text style={[s.label, { color: colors.mutedForeground }]}>Password</Text>
          <View style={s.passwordRow}>
            <TextInput
              style={[s.input, s.passwordInput, { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground }]}
              placeholder="Your password"
              placeholderTextColor={colors.mutedForeground}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleSignIn}
            />
            <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPassword(v => !v)} activeOpacity={0.7}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {error && <Text style={s.errorText}>{error}</Text>}
          {resetSent && <Text style={[s.successText, { color: colors.primary }]}>Check your email for a reset link.</Text>}

          <TouchableOpacity onPress={handleForgotPassword} activeOpacity={0.7} style={s.forgotBtn}>
            <Text style={[s.forgotText, { color: colors.mutedForeground }]}>Forgot password?</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={s.bottom}>
        <Button label="Sign in" onPress={handleSignIn} loading={loading} />
        <TouchableOpacity onPress={() => router.replace('/(onboarding)/01-welcome')} activeOpacity={0.7} style={s.switchBtn}>
          <Text style={[s.switchText, { color: colors.mutedForeground }]}>
            Don&apos;t have an account? <Text style={{ color: colors.primary, fontFamily: 'PlusJakartaSans-Bold' }}>Start here</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </OnboardingShell>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    content: { flexGrow: 1, paddingTop: Spacing.xl, paddingBottom: Spacing.md },
    logoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing['2xl'] },
    logoIcon: { width: 36, height: 36, borderRadius: Radius.md },
    logoText: { fontSize: FontSize.lg, fontFamily: 'PlusJakartaSans-ExtraBold' },

    title: { fontSize: FontSize['2xl'], fontFamily: 'PlusJakartaSans-ExtraBold', marginBottom: Spacing.xs },
    sub: { fontSize: FontSize.sm, marginBottom: Spacing['2xl'] },

    form: { gap: Spacing.xs },
    label: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-SemiBold', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: Spacing.xs, marginTop: Spacing.md },
    input: { borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.lg, fontSize: FontSize.base, fontFamily: 'PlusJakartaSans-Regular' },
    passwordRow: { position: 'relative' },
    passwordInput: { paddingRight: 48 },
    eyeBtn: { position: 'absolute', right: 4, top: 0, bottom: 0, width: 44, alignItems: 'center', justifyContent: 'center' },

    errorText: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-SemiBold', color: '#EF4444', marginTop: Spacing.md },
    successText: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-SemiBold', marginTop: Spacing.md },

    forgotBtn: { marginTop: Spacing.md, alignSelf: 'flex-start' },
    forgotText: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-SemiBold' },

    bottom: { gap: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.md },
    switchBtn: { alignItems: 'center', paddingVertical: 8 },
    switchText: { fontSize: FontSize.sm },

    nameBanner: { borderRadius: Radius.xl, borderWidth: 1, padding: Spacing.lg, gap: Spacing.md },
    nameBannerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md },
    nameBannerTitle: { flex: 1, fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Bold' },
    nameSaveBtn: { alignSelf: 'flex-end' },
    nameSaveText: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-ExtraBold' },
  });
}
