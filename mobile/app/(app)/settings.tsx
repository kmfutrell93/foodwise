import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Switch, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase, Profile } from '@/lib/supabase';
import { Colors, FontSize, Spacing, Radius } from '@/constants/theme';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function Settings() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(data);
      setLoading(false);
    })();
  }, []);

  async function signOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/(onboarding)/01-welcome');
        },
      },
    ]);
  }

  async function deleteAccount() {
    Alert.alert(
      'Delete Account',
      'This will permanently delete all your data — meal plans, symptom logs, progress, and subscription. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              // Cascade delete via RLS — profile deletion triggers FK cascades
              await supabase.from('profiles').delete().eq('id', user.id);
              await supabase.auth.signOut();
            }
            router.replace('/(onboarding)/01-welcome');
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>Settings</Text>

        {/* Subscription status */}
        <View style={styles.proCard}>
          <Text style={styles.proIcon}>{profile?.is_pro ? '⭐' : '🔓'}</Text>
          <View style={styles.proBody}>
            <Text style={styles.proTitle}>{profile?.is_pro ? 'FoodWise Pro' : 'Free Plan'}</Text>
            <Text style={styles.proSub}>{profile?.is_pro ? 'All features unlocked' : '3 meal plan generations'}</Text>
          </View>
          {!profile?.is_pro && (
            <TouchableOpacity
              style={styles.upgradeBtn}
              onPress={() => router.push('/(onboarding)/22-paywall')}
              activeOpacity={0.8}
            >
              <Text style={styles.upgradeBtnText}>Upgrade</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Profile info */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Your Profile</Text>
          {[
            { label: 'Medication', value: profile?.medication ? profile.medication.charAt(0).toUpperCase() + profile.medication.slice(1) : 'Not set' },
            { label: 'Injection Day', value: profile?.injection_day != null ? DAY_NAMES[profile.injection_day] : 'Not set' },
            { label: 'Weekly Budget', value: profile?.weekly_budget ? `$${profile.weekly_budget}/week` : 'Not set' },
            { label: 'Appetite Level', value: profile?.appetite_level ?? 'Not set' },
            { label: 'Check-in Time', value: profile?.check_in_time ?? '8:00 AM' },
            {
              label: 'Dietary Restrictions',
              value: profile?.dietary_restrictions?.length ? profile.dietary_restrictions.join(', ') : 'None',
            },
          ].map((row) => (
            <View key={row.label} style={styles.row}>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Text style={styles.rowValue}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>About</Text>
          <TouchableOpacity style={styles.menuItem} activeOpacity={0.75}>
            <Text style={styles.menuItemText}>AI Disclosure</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} activeOpacity={0.75}>
            <Text style={styles.menuItemText}>Medical Disclaimer</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} activeOpacity={0.75}>
            <Text style={styles.menuItemText}>Privacy Policy</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} activeOpacity={0.75}>
            <Text style={styles.menuItemText}>Terms of Service</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Account</Text>
          <TouchableOpacity style={styles.menuItem} onPress={signOut} activeOpacity={0.75}>
            <Text style={styles.menuItemText}>Sign Out</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, styles.destructiveItem]} onPress={deleteAccount} activeOpacity={0.75}>
            <Text style={styles.destructiveText}>Delete Account</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>FoodWise v1.0.0 · Made with 🦉 for GLP-1 users</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing['3xl'], gap: Spacing.lg },
  screenTitle: { fontSize: FontSize['2xl'], fontFamily: 'PlusJakartaSans-ExtraBold', color: Colors.foreground },
  proCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, padding: Spacing.xl, borderRadius: Radius.xl, backgroundColor: 'rgba(232,157,53,0.08)', borderWidth: 1.5, borderColor: 'rgba(232,157,53,0.3)' },
  proIcon: { fontSize: 32 },
  proBody: { flex: 1 },
  proTitle: { fontSize: FontSize.lg, fontFamily: 'PlusJakartaSans-Bold', color: Colors.foreground },
  proSub: { fontSize: FontSize.sm, color: Colors.mutedForeground },
  upgradeBtn: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: Spacing.lg, paddingVertical: 8 },
  upgradeBtnText: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Bold', color: Colors.primaryForeground },
  section: { borderRadius: Radius.xl, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  sectionLabel: { fontSize: FontSize.xs, color: Colors.mutedForeground, fontFamily: 'PlusJakartaSans-Bold', textTransform: 'uppercase', letterSpacing: 1, padding: Spacing.lg, paddingBottom: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border },
  rowLabel: { fontSize: FontSize.sm, color: Colors.mutedForeground },
  rowValue: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-SemiBold', color: Colors.foreground, maxWidth: '60%', textAlign: 'right' },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border },
  destructiveItem: {},
  menuItemText: { fontSize: FontSize.base, color: Colors.foreground },
  destructiveText: { fontSize: FontSize.base, color: Colors.destructive },
  menuArrow: { fontSize: FontSize.xl, color: Colors.mutedForeground, lineHeight: 24 },
  version: { textAlign: 'center', fontSize: FontSize.xs, color: Colors.mutedForeground, marginTop: Spacing.xl },
});
