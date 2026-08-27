import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { FontSize, Spacing, Radius, ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/context/ThemeContext';

// Supabase's recovery link carries the token as a URL fragment (implicit flow)
// or a `code` query param (PKCE flow), depending on project auth settings.
// detectSessionInUrl is false in lib/supabase.ts (correct for React Native),
// so neither is parsed automatically — we have to do it ourselves here.
function parseParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  const [beforeHash, hash] = url.split('#');
  const queryIndex = beforeHash.indexOf('?');
  const query = queryIndex !== -1 ? beforeHash.slice(queryIndex + 1) : '';
  for (const part of [query, hash ?? '']) {
    if (!part) continue;
    for (const pair of part.split('&')) {
      const [key, value] = pair.split('=');
      if (key) params[decodeURIComponent(key)] = decodeURIComponent(value ?? '');
    }
  }
  return params;
}

export default function ResetPassword() {
  const colors = useThemeColors();
  const s = makeStyles(colors);
  const router = useRouter();
  const url = Linking.useURL();
  const handledRef = useRef(false);

  const [readyToReset, setReadyToReset] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Secondary signal — fires if the SDK itself recognizes a recovery session.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReadyToReset(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Primary path — manually extract the recovery token from the deep link
  // and establish the session ourselves.
  useEffect(() => {
    if (!url || handledRef.current) return;
    handledRef.current = true;

    (async () => {
      const params = parseParams(url);
      try {
        if (params.code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(params.code);
          if (exchangeError) throw exchangeError;
          setReadyToReset(true);
        } else if (params.access_token && params.refresh_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });
          if (sessionError) throw sessionError;
          setReadyToReset(true);
        } else {
          setLinkError('This reset link is invalid or has expired. Please request a new one.');
        }
      } catch (e: unknown) {
        setLinkError(e instanceof Error ? e.message : 'This reset link is invalid or has expired.');
      }
    })();
  }, [url]);

  async function handleUpdate() {
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError("Passwords don't match."); return; }
    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) { setError(updateError.message); return; }
      setSuccess(true);
      setTimeout(() => router.replace('/(onboarding)/sign-in'), 2000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (linkError) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <Text style={s.emoji}>😔</Text>
          <Text style={[s.title, { color: colors.foreground }]}>Link expired</Text>
          <Text style={[s.sub, { color: colors.mutedForeground }]}>{linkError}</Text>
          <Button
            label="Back to sign in"
            onPress={() => router.replace('/(onboarding)/sign-in')}
            style={{ marginTop: Spacing.xl }}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (success) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <Text style={s.emoji}>✅</Text>
          <Text style={[s.title, { color: colors.foreground }]}>Password updated!</Text>
          <Text style={[s.sub, { color: colors.mutedForeground }]}>Redirecting you to sign in…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!readyToReset) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[s.sub, { color: colors.mutedForeground, marginTop: Spacing.lg }]}>Verifying your reset link…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.content}>
        <Text style={[s.title, { color: colors.foreground }]}>Set a new password</Text>
        <Text style={[s.sub, { color: colors.mutedForeground }]}>Enter a new password for your FoodWise account</Text>

        <View style={s.form}>
          <Text style={[s.label, { color: colors.mutedForeground }]}>New password</Text>
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
              returnKeyType="next"
            />
            <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPassword(v => !v)} activeOpacity={0.7}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <Text style={[s.label, { color: colors.mutedForeground }]}>Confirm password</Text>
          <View style={s.passwordRow}>
            <TextInput
              style={[s.input, s.passwordInput, { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground }]}
              placeholder="Re-enter your password"
              placeholderTextColor={colors.mutedForeground}
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry={!showConfirm}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleUpdate}
            />
            <TouchableOpacity style={s.eyeBtn} onPress={() => setShowConfirm(v => !v)} activeOpacity={0.7}>
              <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {!!error && <Text style={s.errorText}>{error}</Text>}
        </View>

        <Button label="Update password" onPress={handleUpdate} loading={loading} style={{ marginTop: Spacing.xl }} />
      </View>
    </SafeAreaView>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
    content: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing['3xl'] },

    title: { fontSize: FontSize['2xl'], fontFamily: 'PlusJakartaSans-ExtraBold', marginBottom: Spacing.xs, textAlign: 'center' },
    sub: { fontSize: FontSize.sm, marginBottom: Spacing['2xl'], textAlign: 'center', lineHeight: 20 },

    form: { gap: Spacing.xs },
    label: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-SemiBold', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: Spacing.xs, marginTop: Spacing.md },
    input: { borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.lg, fontSize: FontSize.base, fontFamily: 'PlusJakartaSans-Regular' },
    passwordRow: { position: 'relative' },
    passwordInput: { paddingRight: 48 },
    eyeBtn: { position: 'absolute', right: 4, top: 0, bottom: 0, width: 44, alignItems: 'center', justifyContent: 'center' },

    errorText: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-SemiBold', color: '#EF4444', marginTop: Spacing.md },

    emoji: { fontSize: 56, marginBottom: Spacing.lg },
  });
}
