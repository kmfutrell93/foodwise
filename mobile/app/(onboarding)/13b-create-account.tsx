import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingShell } from '@/components/ui/OnboardingShell';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useOnboarding } from '@/context/OnboardingContext';
import { FontSize, Spacing, Radius, ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/context/ThemeContext';

export default function CreateAccount() {
  const colors = useThemeColors();
  const s = makeStyles(colors);
  const router = useRouter();
  const { saveStep } = useOnboarding();
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [marketingEmails, setMarketingEmails] = useState(true);

  async function handleSave() {
    setError(null);
    if (!firstName.trim()) {
      setError('Please enter your first name');
      return;
    }
    if (!email) {
      setError('Enter your email.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      const { data, error: updateError } = await supabase.auth.updateUser({ email, password });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      if (data.user) {
        await supabase.from('profiles').update({
          email,
          full_name: firstName.trim(),
          marketing_emails_enabled: marketingEmails,
        }).eq('id', data.user.id);
      }
      await saveStep(17); // → 14-meal-reveal
      router.push('/(onboarding)/14-meal-reveal');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Skip leaves full_name as null — home.tsx falls back to "there" in its
  // greeting until the user sets their name later in Settings.
  async function handleSkip() {
    await saveStep(17); // → 14-meal-reveal
    router.push('/(onboarding)/14-meal-reveal');
  }

  return (
    <OnboardingShell step={13} screenKey="13b-create-account" showBack={false}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <Text style={[s.title, { color: colors.foreground }]}>Save your plan</Text>
        <Text style={[s.sub, { color: colors.mutedForeground }]}>Create an account so you never lose your meal plan</Text>
        <Text style={[s.reassurance, { color: colors.primary }]}>Takes 10 seconds. No credit card.</Text>

        <View style={s.form}>
          <Text style={[s.label, { color: colors.mutedForeground }]}>First name</Text>
          <TextInput
            style={[s.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground }]}
            placeholder="First name"
            placeholderTextColor={colors.mutedForeground}
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="next"
          />

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
              placeholder="At least 8 characters"
              placeholderTextColor={colors.mutedForeground}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
            <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPassword(v => !v)} activeOpacity={0.7}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {error && <Text style={s.errorText}>{error}</Text>}

          <TouchableOpacity
            style={s.consentRow}
            onPress={() => setMarketingEmails(v => !v)}
            activeOpacity={0.75}
          >
            <View style={[s.checkbox, { borderColor: colors.primary }, marketingEmails && { backgroundColor: colors.primary }]}>
              {marketingEmails && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={[s.consentText, { color: colors.mutedForeground }]}>
              Send me weekly GLP-1 nutrition tips
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={s.bottom}>
        <Button label="Save my plan" onPress={handleSave} loading={loading} disabled={!firstName.trim()} />
        <TouchableOpacity onPress={handleSkip} activeOpacity={0.7} style={s.skipBtn} disabled={loading}>
          <Text style={[s.skipText, { color: colors.mutedForeground }]}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </OnboardingShell>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    content: { flexGrow: 1, paddingTop: Spacing.xl, paddingBottom: Spacing.md },
    title: { fontSize: FontSize['2xl'], fontFamily: 'PlusJakartaSans-ExtraBold', marginBottom: Spacing.xs },
    sub: { fontSize: FontSize.sm, marginBottom: Spacing.xs, lineHeight: 20 },
    reassurance: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-SemiBold', marginBottom: Spacing['2xl'] },

    form: { gap: Spacing.xs },
    label: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-SemiBold', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: Spacing.xs, marginTop: Spacing.md },
    input: { borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.lg, fontSize: FontSize.base, fontFamily: 'PlusJakartaSans-Regular' },
    passwordRow: { position: 'relative' },
    passwordInput: { paddingRight: 48 },
    eyeBtn: { position: 'absolute', right: 4, top: 0, bottom: 0, width: 44, alignItems: 'center', justifyContent: 'center' },

    errorText: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-SemiBold', color: '#EF4444', marginTop: Spacing.md },

    consentRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.lg },
    checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
    consentText: { fontSize: FontSize.xs, flex: 1 },

    bottom: { gap: Spacing.sm, paddingTop: Spacing.md, paddingBottom: Spacing['3xl'] },
    skipBtn: { alignItems: 'center', paddingVertical: 8 },
    skipText: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-SemiBold' },
  });
}
