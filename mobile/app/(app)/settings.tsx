import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, TextInput, Modal, ActivityIndicator, Linking, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import RevenueCatUI from 'react-native-purchases-ui';
import { supabase, Profile } from '@/lib/supabase';
import { FontSize, Spacing, Radius, ThemeColors } from '@/constants/theme';
import { useThemeColors, useTheme } from '@/context/ThemeContext';
import { useRevenueCat, ENTITLEMENT_ID } from '@/context/RevenueCatContext';
import { formatBillingAmount } from '@/lib/pricing';
import { getDoseOptions, computeEscalationStatus } from '@/lib/escalation';
import { formatProteinRange } from '@/lib/utils';

const MEDICATION_LABELS: Record<string, string> = {
  semaglutide: 'Ozempic / Wegovy (Semaglutide)',
  tirzepatide: 'Mounjaro / Zepbound (Tirzepatide)',
  liraglutide: 'Saxenda / Victoza (Liraglutide)',
  other: 'Other',
};

const RESTRICTION_OPTIONS = [
  'gluten-free', 'dairy-free', 'egg-free', 'nut-free', 'shellfish-free', 'soy-free',
  'vegetarian', 'vegan', 'pescatarian', 'low-fodmap', 'halal', 'kosher',
];
const RESTRICTION_LABELS: Record<string, string> = {
  'gluten-free': 'Gluten-Free', 'dairy-free': 'Dairy-Free', 'egg-free': 'Egg-Free',
  'nut-free': 'Nut-Free', 'shellfish-free': 'Shellfish-Free', 'soy-free': 'Soy-Free',
  vegetarian: 'Vegetarian', vegan: 'Vegan', pescatarian: 'Pescatarian',
  'low-fodmap': 'Low FODMAP', halal: 'Halal', kosher: 'Kosher',
};

const AVERSION_OPTIONS = [
  'greasy/fried foods', 'red meat', 'eggs', 'dairy', 'fish/seafood',
  'cruciferous veggies', 'spicy foods', 'beans/legumes', 'strong smells',
  'sweet foods', 'carbonated drinks', 'raw foods',
];

const APPETITE_OPTIONS: { value: 'low' | 'moderate' | 'normal'; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'normal', label: 'Normal' },
];

const appVersion = Constants.expoConfig?.version ?? '1.0.0';

export default function Settings() {
  const router = useRouter();
  const colors = useThemeColors();
  const { theme, toggleTheme } = useTheme();
  const s = makeStyles(colors);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [notifToggles, setNotifToggles] = useState({ protein: false, hydration: false, injection: false, weekly: false, hydrationDose: false });
  const [hydrationSaving, setHydrationSaving] = useState(false);
  const [doseEditOpen, setDoseEditOpen] = useState(false);
  const [editDoseMg, setEditDoseMg] = useState<number | null>(null);
  const [editDoseStartDate, setEditDoseStartDate] = useState<string>('');
  const [doseSaving, setDoseSaving] = useState(false);
  const [glp1ProfileEditOpen, setGlp1ProfileEditOpen] = useState(false);
  const [editAversions, setEditAversions] = useState<string[]>([]);
  const [editRestrictions, setEditRestrictions] = useState<string[]>([]);
  const [editAppetite, setEditAppetite] = useState<'low' | 'moderate' | 'normal' | null>(null);
  const [editBudget, setEditBudget] = useState('');
  const [glp1ProfileSaving, setGlp1ProfileSaving] = useState(false);
  const { isPro, customerInfo, currentOffering } = useRevenueCat();

  const activeProductId = customerInfo?.entitlements.active[ENTITLEMENT_ID]?.productIdentifier;
  const activePkg = currentOffering?.availablePackages.find(
    (p: any) => p.product.identifier === activeProductId,
  ) ?? (
    activeProductId?.includes('annual') || activeProductId?.includes('year')
      ? currentOffering?.annual
      : currentOffering?.monthly
  ) ?? null;
  const billingAmount = activePkg ? formatBillingAmount(activePkg) : null;

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserEmail(user.email ?? null);
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) {
        setProfile(data);
        setNameInput(data.full_name ?? '');
        const on = data.notifications_enabled ?? false;
        setNotifToggles({ protein: on, hydration: on, injection: on, weekly: on, hydrationDose: data.hydration_reminders_enabled ?? true });
      }
    })();
  }, []);

  async function saveName() {
    if (!profile) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('profiles').update({ full_name: nameInput.trim() || null }).eq('id', user.id);
    setProfile(prev => prev ? { ...prev, full_name: nameInput.trim() || null } : prev);
    setEditingName(false);
  }

  async function toggleHydrationDose(val: boolean) {
    setNotifToggles(t => ({ ...t, hydrationDose: val }));
    setHydrationSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await supabase.from('profiles').update({ hydration_reminders_enabled: val }).eq('id', user.id);
    setHydrationSaving(false);
  }

  async function saveDose() {
    if (!editDoseMg || !editDoseStartDate) return;
    setDoseSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/escalation-status`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ current_dose_mg: editDoseMg, dose_start_date: editDoseStartDate }),
        }
      );
      if (res.ok) {
        setProfile(prev => prev ? { ...prev, dose_mg: editDoseMg, dose_start_date: editDoseStartDate } : prev);
        setDoseEditOpen(false);
      }
    } finally { setDoseSaving(false); }
  }

  function toggleEditChip(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter(v => v !== value) : [...list, value]);
  }

  function openGlp1ProfileEdit() {
    setEditAversions(profile?.food_aversions ?? []);
    setEditRestrictions(profile?.dietary_restrictions ?? []);
    setEditAppetite((profile?.appetite_level as 'low' | 'moderate' | 'normal' | null) ?? null);
    setEditBudget(profile?.weekly_budget ? String(profile.weekly_budget) : '');
    setGlp1ProfileEditOpen(true);
  }

  async function saveGlp1Profile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setGlp1ProfileSaving(true);
    try {
      const parsedBudget = parseFloat(editBudget);
      const weeklyBudget = !isNaN(parsedBudget) && parsedBudget > 0 ? parsedBudget : (profile?.weekly_budget ?? 75);
      const updates = {
        food_aversions: editAversions,
        dietary_restrictions: editRestrictions,
        appetite_level: editAppetite,
        weekly_budget: weeklyBudget,
      };
      await supabase.from('profiles').update(updates).eq('id', user.id);
      setProfile(prev => prev ? { ...prev, ...updates } : prev);
      setGlp1ProfileEditOpen(false);
    } finally {
      setGlp1ProfileSaving(false);
    }
  }

  async function handleSignOut() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace('/(onboarding)/sign-in');
        },
      },
    ]);
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Delete account',
      'This will permanently delete your account and all data — meal plans, symptom logs, streaks, and milestones. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete my account', style: 'destructive', onPress: confirmDelete },
      ]
    );
  }

  async function confirmDelete() {
    setDeletingAccount(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        await supabase.auth.signOut();
        router.replace('/(onboarding)/01-welcome');
        return;
      }
      const res = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/delete-account`,
        { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` } }
      );
      if (!res.ok) throw new Error('Failed to delete account');
      await supabase.auth.signOut();
      router.replace('/(onboarding)/01-welcome');
    } catch {
      setDeletingAccount(false);
      Alert.alert('Error', 'Could not delete your account. Please try again or contact support@foodwise.app.');
    }
  }

  const injectionDayDisplay = profile?.injection_day
    ? `Every ${profile.injection_day.charAt(0).toUpperCase() + profile.injection_day.slice(1)}`
    : '—';

  const escalationStatus = profile?.medication
    ? computeEscalationStatus(
        profile.medication as Parameters<typeof computeEscalationStatus>[0],
        profile.dose_mg ?? null,
        profile.dose_start_date ?? null,
      )
    : null;

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      {deletingAccount && (
        <View style={s.deletingOverlay}>
          <ActivityIndicator color={colors.primaryForeground} size="large" />
          <Text style={s.deletingText}>Deleting account…</Text>
        </View>
      )}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <Text style={s.screenTitle}>Profile & Settings</Text>

        {/* User card */}
        <TouchableOpacity style={s.userCard} onPress={() => setEditingName(true)} activeOpacity={0.85}>
          <Image source={require('@/assets/images/nori_character.png')} style={s.userAvatar} resizeMode="contain" />
          <View style={s.userInfo}>
            <Text style={s.userName}>{profile?.full_name ?? 'Your Name'}</Text>
            <Text style={s.userEmail}>{userEmail ?? '—'}</Text>
            {isPro && (
              <View style={s.premiumBadge}>
                <Text style={s.premiumBadgeText}>👑 FoodWise Premium</Text>
              </View>
            )}
          </View>
          <Text style={s.editPen}>✏️</Text>
        </TouchableOpacity>

        {/* GLP-1 Medication */}
        <Text style={s.sectionLabel}>GLP-1 Medication</Text>
        <View style={s.card}>
          <View style={[s.iconRow, s.rowBorder]}>
            <View style={[s.iconCircle, s.circleAmber]}>
              <Text style={s.iconEmoji}>💉</Text>
            </View>
            <View style={s.rowContent}>
              <Text style={s.rowTitle}>Medication</Text>
              <Text style={s.rowSub} numberOfLines={1}>{MEDICATION_LABELS[profile?.medication ?? ''] ?? '—'}</Text>
            </View>
          </View>
          <View style={[s.iconRow, s.rowBorder]}>
            <View style={[s.iconCircle, s.circleSalmon]}>
              <Text style={s.iconEmoji}>📅</Text>
            </View>
            <View style={s.rowContent}>
              <Text style={s.rowTitle}>Injection Day</Text>
              <Text style={s.rowSub}>{injectionDayDisplay}</Text>
            </View>
          </View>
          <View style={s.iconRow}>
            <View style={[s.iconCircle, s.circleGreen]}>
              <Text style={s.iconEmoji}>📈</Text>
            </View>
            <View style={s.rowContent}>
              <Text style={s.rowTitle}>Dosage</Text>
              <Text style={s.rowSub}>Not tracked</Text>
            </View>
          </View>
        </View>

        {/* My GLP-1 Dose */}
        <Text style={s.sectionLabel}>My GLP-1 Dose</Text>
        <View style={s.card}>
          <View style={[s.iconRow, s.rowBorder]}>
            <View style={[s.iconCircle, s.circleGreen]}>
              <Text style={s.iconEmoji}>💉</Text>
            </View>
            <View style={s.rowContent}>
              <Text style={s.rowTitle}>Current Dose</Text>
              <Text style={s.rowSub}>{profile?.dose_mg ? `${profile.dose_mg} mg` : 'Not set'}</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setEditDoseMg(profile?.dose_mg ?? null);
                setEditDoseStartDate(profile?.dose_start_date ?? '');
                setDoseEditOpen(true);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={s.editPenSmall}>✏️</Text>
            </TouchableOpacity>
          </View>
          <View style={[s.iconRow, s.rowBorder]}>
            <View style={[s.iconCircle, s.circleAmber]}>
              <Text style={s.iconEmoji}>📅</Text>
            </View>
            <View style={s.rowContent}>
              <Text style={s.rowTitle}>Started Dose</Text>
              <Text style={s.rowSub}>
                {profile?.dose_start_date
                  ? new Date(profile.dose_start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : 'Not set'}
              </Text>
            </View>
          </View>
          <View style={s.iconRow}>
            <View style={[s.iconCircle, s.circleSalmon]}>
              <Text style={s.iconEmoji}>📈</Text>
            </View>
            <View style={s.rowContent}>
              <Text style={s.rowTitle}>Next Escalation</Text>
              <Text style={s.rowSub}>
                {escalationStatus?.next_dose_mg
                  ? escalationStatus.days_until_escalation === 0
                    ? `Today → ${escalationStatus.next_dose_mg} mg`
                    : `In ${escalationStatus.days_until_escalation} days → ${escalationStatus.next_dose_mg} mg`
                  : 'At maintenance dose'}
              </Text>
            </View>
          </View>
        </View>

        {/* GLP-1 Profile — editable */}
        <View style={s.sectionLabelRow}>
          <Text style={s.sectionLabel}>GLP-1 Profile</Text>
          <TouchableOpacity onPress={openGlp1ProfileEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={s.editPenSmall}>✏️</Text>
          </TouchableOpacity>
        </View>
        <View style={s.card}>
          <View style={[s.iconRow, s.rowBorder]}>
            <View style={[s.iconCircle, s.circleAmber]}>
              <Text style={s.iconEmoji}>🚫</Text>
            </View>
            <View style={s.rowContent}>
              <Text style={s.rowTitle}>Food Aversions</Text>
              <Text style={s.rowSub} numberOfLines={2}>
                {(profile?.food_aversions ?? []).length > 0 ? profile!.food_aversions.join(', ') : 'None set'}
              </Text>
            </View>
          </View>
          <View style={[s.iconRow, s.rowBorder]}>
            <View style={[s.iconCircle, s.circleSalmon]}>
              <Text style={s.iconEmoji}>🌱</Text>
            </View>
            <View style={s.rowContent}>
              <Text style={s.rowTitle}>Dietary Restrictions</Text>
              <Text style={s.rowSub} numberOfLines={2}>
                {(profile?.dietary_restrictions ?? []).length > 0
                  ? profile!.dietary_restrictions.map(r => RESTRICTION_LABELS[r] ?? r).join(', ')
                  : 'None set'}
              </Text>
            </View>
          </View>
          <View style={s.iconRow}>
            <View style={[s.iconCircle, s.circleGreen]}>
              <Text style={s.iconEmoji}>🍽️</Text>
            </View>
            <View style={s.rowContent}>
              <Text style={s.rowTitle}>Appetite Level</Text>
              <Text style={s.rowSub}>
                {APPETITE_OPTIONS.find(o => o.value === profile?.appetite_level)?.label ?? 'Not set'}
              </Text>
            </View>
          </View>
        </View>

        {/* Nutrition Goals */}
        <Text style={s.sectionLabel}>Nutrition Goals</Text>
        <View style={s.card}>
          <View style={[s.iconRow, s.rowBorder]}>
            <View style={[s.iconCircle, s.circleAmber]}>
              <Text style={s.iconEmoji}>🥩</Text>
            </View>
            <View style={s.rowContent}>
              <Text style={s.rowTitle}>Daily Protein Goal</Text>
              <Text style={s.rowSub}>{formatProteinRange(profile?.protein_goal_range)}</Text>
            </View>
          </View>
          <View style={[s.iconRow, s.rowBorder]}>
            <View style={[s.iconCircle, s.circleSalmon]}>
              <Text style={s.iconEmoji}>🔥</Text>
            </View>
            <View style={s.rowContent}>
              <Text style={s.rowTitle}>Calorie Target</Text>
              <Text style={s.rowSub}>From your meal plan</Text>
            </View>
          </View>
          <View style={s.iconRow}>
            <View style={[s.iconCircle, s.circleAmber]}>
              <Text style={s.iconEmoji}>🛒</Text>
            </View>
            <View style={s.rowContent}>
              <Text style={s.rowTitle}>Weekly Budget</Text>
              <Text style={s.rowSub}>{profile?.weekly_budget ? `$${profile.weekly_budget} / week` : '—'}</Text>
            </View>
            <TouchableOpacity onPress={openGlp1ProfileEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={s.editPenSmall}>✏️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications */}
        <Text style={s.sectionLabel}>Notifications</Text>
        <View style={s.card}>
          <View style={[s.notifRow, s.rowBorder]}>
            <View style={s.rowContent}>
              <Text style={s.rowTitle}>Daily Protein Reminder</Text>
              <Text style={s.rowSub}>8:00 AM</Text>
            </View>
            <Switch
              value={notifToggles.protein}
              onValueChange={v => setNotifToggles(t => ({ ...t, protein: v }))}
              trackColor={{ false: colors.muted, true: colors.primary + '99' }}
              thumbColor={notifToggles.protein ? colors.primary : colors.mutedForeground}
            />
          </View>
          <View style={[s.notifRow, s.rowBorder]}>
            <View style={s.rowContent}>
              <Text style={s.rowTitle}>Hydration Reminders</Text>
              <Text style={s.rowSub}>Every 2 hours</Text>
            </View>
            <Switch
              value={notifToggles.hydration}
              onValueChange={v => setNotifToggles(t => ({ ...t, hydration: v }))}
              trackColor={{ false: colors.muted, true: colors.primary + '99' }}
              thumbColor={notifToggles.hydration ? colors.primary : colors.mutedForeground}
            />
          </View>
          <View style={[s.notifRow, s.rowBorder]}>
            <View style={s.rowContent}>
              <Text style={s.rowTitle}>Injection Day Alert</Text>
              <Text style={s.rowSub}>Morning of injection day</Text>
            </View>
            <Switch
              value={notifToggles.injection}
              onValueChange={v => setNotifToggles(t => ({ ...t, injection: v }))}
              trackColor={{ false: colors.muted, true: colors.primary + '99' }}
              thumbColor={notifToggles.injection ? colors.primary : colors.mutedForeground}
            />
          </View>
          <View style={[s.notifRow, s.rowBorder]}>
            <View style={s.rowContent}>
              <Text style={s.rowTitle}>Injection Day Hydration</Text>
              <Text style={s.rowSub}>Reminders on your injection day</Text>
            </View>
            <Switch
              value={notifToggles.hydrationDose}
              onValueChange={toggleHydrationDose}
              trackColor={{ false: colors.muted, true: colors.primary + '99' }}
              thumbColor={notifToggles.hydrationDose ? colors.primary : colors.mutedForeground}
              disabled={hydrationSaving}
            />
          </View>
          <View style={s.notifRow}>
            <View style={s.rowContent}>
              <Text style={s.rowTitle}>Weekly Report</Text>
              <Text style={s.rowSub}>Every Sunday, 7:00 PM</Text>
            </View>
            <Switch
              value={notifToggles.weekly}
              onValueChange={v => setNotifToggles(t => ({ ...t, weekly: v }))}
              trackColor={{ false: colors.muted, true: colors.primary + '99' }}
              thumbColor={notifToggles.weekly ? colors.primary : colors.mutedForeground}
            />
          </View>
        </View>

        {/* App & Legal */}
        <Text style={s.sectionLabel}>App & Legal</Text>
        <View style={s.card}>
          <TouchableOpacity style={[s.linkRow, s.rowBorder]} onPress={() => RevenueCatUI.presentCustomerCenter()} activeOpacity={0.75}>
            <View style={s.rowContent}>
              <Text style={s.rowTitle}>Subscription</Text>
            </View>
            {isPro ? (
              <View style={s.activeBadge}>
                <Text style={s.activeBadgeText}>Active</Text>
              </View>
            ) : billingAmount ? (
              <Text style={s.rowSub}>{billingAmount}</Text>
            ) : null}
            <Text style={s.chevron}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.linkRow, s.rowBorder]} onPress={() => Linking.openURL('https://kmfutrell93.github.io/foodwise-legal/terms#3-medical-disclaimer')} activeOpacity={0.75}>
            <View style={s.rowContent}>
              <Text style={s.rowTitle}>Medical Disclaimer</Text>
              <Text style={s.rowSub}>Not medical advice</Text>
            </View>
            <Text style={s.chevron}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.linkRow, s.rowBorder]} onPress={() => Linking.openURL('https://kmfutrell93.github.io/foodwise-legal/terms')} activeOpacity={0.75}>
            <View style={s.rowContent}>
              <Text style={s.rowTitle}>Terms of Service</Text>
            </View>
            <Text style={s.chevron}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.linkRow, s.rowBorder]} onPress={() => Linking.openURL('https://kmfutrell93.github.io/foodwise-legal/privacy')} activeOpacity={0.75}>
            <View style={s.rowContent}>
              <Text style={s.rowTitle}>Privacy Policy</Text>
            </View>
            <Text style={s.chevron}>›</Text>
          </TouchableOpacity>
          <View style={[s.linkRow, s.rowBorder]}>
            <View style={s.rowContent}>
              <Text style={s.rowTitle}>Dark Mode</Text>
            </View>
            <Switch
              value={theme === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.muted, true: colors.primary + '99' }}
              thumbColor={theme === 'dark' ? colors.primary : colors.mutedForeground}
            />
          </View>
          <View style={s.linkRow}>
            <View style={s.rowContent}>
              <Text style={s.rowTitle}>About FoodWise</Text>
              <Text style={s.rowSub}>v{appVersion}</Text>
            </View>
          </View>
        </View>

        {/* Danger zone */}
        <View style={s.dangerCard}>
          <TouchableOpacity style={[s.dangerRow, s.rowBorder]} onPress={handleSignOut} activeOpacity={0.75}>
            <Text style={s.dangerEmoji}>🚪</Text>
            <Text style={s.dangerText}>Sign Out</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.dangerRow} onPress={handleDeleteAccount} activeOpacity={0.75}>
            <Text style={s.dangerEmoji}>🗑️</Text>
            <Text style={s.dangerText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.version}>FoodWise v{appVersion} · Made with ❤️ for GLP-1 users</Text>
      </ScrollView>

      <Modal visible={editingName} transparent animationType="slide" onRequestClose={() => setEditingName(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setEditingName(false)} />
        <View style={[s.modalSheet, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <Text style={[s.modalTitle, { color: colors.foreground }]}>Your name</Text>
          <TextInput
            style={[s.modalInput, { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground }]}
            placeholder="Enter your name"
            placeholderTextColor={colors.mutedForeground}
            value={nameInput}
            onChangeText={setNameInput}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={saveName}
          />
          <TouchableOpacity style={[s.modalBtn, { backgroundColor: colors.primary }]} onPress={saveName} activeOpacity={0.85}>
            <Text style={[s.modalBtnText, { color: colors.primaryForeground }]}>Save</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal visible={doseEditOpen} transparent animationType="slide" onRequestClose={() => setDoseEditOpen(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setDoseEditOpen(false)} />
        <View style={[s.modalSheet, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <Text style={[s.modalTitle, { color: colors.foreground }]}>Update Dose</Text>
          <Text style={[s.doseChipLabel, { color: colors.mutedForeground }]}>Select dose (mg)</Text>
          <View style={s.doseChipGrid}>
            {getDoseOptions((profile?.medication ?? 'semaglutide') as Parameters<typeof getDoseOptions>[0]).map(dose => {
              const selected = editDoseMg === dose;
              return (
                <TouchableOpacity
                  key={dose}
                  style={[s.doseChip, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primary + '15' : colors.input }]}
                  onPress={() => setEditDoseMg(dose)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.doseChipText, { color: selected ? colors.primary : colors.foreground }]}>{dose} mg</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={[s.doseChipLabel, { color: colors.mutedForeground, marginTop: Spacing.lg }]}>Date started (YYYY-MM-DD)</Text>
          <TextInput
            style={[s.modalInput, { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground }]}
            placeholder="e.g. 2024-01-15"
            placeholderTextColor={colors.mutedForeground}
            value={editDoseStartDate}
            onChangeText={setEditDoseStartDate}
            keyboardType="numeric"
          />
          <View style={s.doseModalBtns}>
            <TouchableOpacity
              style={[s.doseModalCancelBtn, { borderColor: colors.border }]}
              onPress={() => setDoseEditOpen(false)}
              activeOpacity={0.75}
            >
              <Text style={[s.doseModalCancelText, { color: colors.mutedForeground }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.doseModalSaveBtn, { backgroundColor: colors.primary }, (!editDoseMg || !editDoseStartDate || doseSaving) && s.ctaDisabled]}
              onPress={saveDose}
              disabled={!editDoseMg || !editDoseStartDate || doseSaving}
              activeOpacity={0.85}
            >
              {doseSaving
                ? <ActivityIndicator color={colors.primaryForeground} />
                : <Text style={[s.modalBtnText, { color: colors.primaryForeground }]}>Save</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={glp1ProfileEditOpen} transparent animationType="slide" onRequestClose={() => setGlp1ProfileEditOpen(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setGlp1ProfileEditOpen(false)} />
        <View style={[s.modalSheet, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={[s.modalTitle, { color: colors.foreground }]}>Edit GLP-1 Profile</Text>

            <Text style={[s.doseChipLabel, { color: colors.mutedForeground }]}>Food aversions</Text>
            <View style={s.doseChipGrid}>
              {AVERSION_OPTIONS.map(opt => {
                const selected = editAversions.includes(opt);
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[s.doseChip, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primary + '15' : colors.input }]}
                    onPress={() => toggleEditChip(editAversions, setEditAversions, opt)}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.doseChipText, { color: selected ? colors.primary : colors.foreground }]}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[s.doseChipLabel, { color: colors.mutedForeground, marginTop: Spacing.lg }]}>Dietary restrictions</Text>
            <View style={s.doseChipGrid}>
              {RESTRICTION_OPTIONS.map(opt => {
                const selected = editRestrictions.includes(opt);
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[s.doseChip, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primary + '15' : colors.input }]}
                    onPress={() => toggleEditChip(editRestrictions, setEditRestrictions, opt)}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.doseChipText, { color: selected ? colors.primary : colors.foreground }]}>{RESTRICTION_LABELS[opt]}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[s.doseChipLabel, { color: colors.mutedForeground, marginTop: Spacing.lg }]}>Appetite level</Text>
            <View style={s.doseChipGrid}>
              {APPETITE_OPTIONS.map(opt => {
                const selected = editAppetite === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[s.doseChip, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primary + '15' : colors.input }]}
                    onPress={() => setEditAppetite(opt.value)}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.doseChipText, { color: selected ? colors.primary : colors.foreground }]}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[s.doseChipLabel, { color: colors.mutedForeground, marginTop: Spacing.lg }]}>Weekly budget ($)</Text>
            <TextInput
              style={[s.modalInput, { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground }]}
              placeholder="e.g. 75"
              placeholderTextColor={colors.mutedForeground}
              value={editBudget}
              onChangeText={setEditBudget}
              keyboardType="numeric"
            />

            <View style={s.doseModalBtns}>
              <TouchableOpacity
                style={[s.doseModalCancelBtn, { borderColor: colors.border }]}
                onPress={() => setGlp1ProfileEditOpen(false)}
                activeOpacity={0.75}
              >
                <Text style={[s.doseModalCancelText, { color: colors.mutedForeground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.doseModalSaveBtn, { backgroundColor: colors.primary }, glp1ProfileSaving && s.ctaDisabled]}
                onPress={saveGlp1Profile}
                disabled={glp1ProfileSaving}
                activeOpacity={0.85}
              >
                {glp1ProfileSaving
                  ? <ActivityIndicator color={colors.primaryForeground} />
                  : <Text style={[s.modalBtnText, { color: colors.primaryForeground }]}>Save</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    scroll: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: 120 },
    screenTitle: { fontSize: FontSize['2xl'], fontFamily: 'PlusJakartaSans-ExtraBold', color: c.foreground, marginBottom: Spacing.xl },
    // User card
    userCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, backgroundColor: c.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: c.border, padding: Spacing.xl, marginBottom: Spacing['2xl'] },
    userAvatar: { width: 64, height: 64 },
    userInfo: { flex: 1 },
    userName: { fontSize: FontSize.lg, fontFamily: 'PlusJakartaSans-ExtraBold', color: c.foreground },
    userEmail: { fontSize: FontSize.sm, color: c.mutedForeground, marginTop: 2 },
    premiumBadge: { alignSelf: 'flex-start', marginTop: Spacing.xs, backgroundColor: 'rgba(29,158,117,0.1)', borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 },
    premiumBadgeText: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-Bold', color: c.primary },
    editPen: { fontSize: 18, opacity: 0.5 },
    // Section label
    sectionLabel: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-ExtraBold', color: c.mutedForeground, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: Spacing.sm },
    sectionLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
    // Cards
    card: { backgroundColor: c.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: c.border, marginBottom: Spacing['2xl'], overflow: 'hidden' },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: c.border },
    // Icon rows (GLP-1, Nutrition)
    iconRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, gap: Spacing.md },
    iconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    circleAmber: { backgroundColor: 'rgba(29,158,117,0.12)' },
    circleSalmon: { backgroundColor: 'rgba(29,158,117,0.12)' },
    circleGreen: { backgroundColor: 'rgba(29,158,117,0.12)' },
    iconEmoji: { fontSize: 16 },
    rowContent: { flex: 1 },
    rowTitle: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-SemiBold', color: c.foreground },
    rowSub: { fontSize: FontSize.xs, color: c.mutedForeground, marginTop: 2 },
    chevron: { fontSize: 22, color: c.mutedForeground, lineHeight: 26 },
    // Notification rows
    notifRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, gap: Spacing.md },
    // Link rows (App & Legal)
    linkRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, gap: Spacing.sm },
    activeBadge: { backgroundColor: 'rgba(29,158,117,0.1)', borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3, marginRight: 4 },
    activeBadgeText: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-Bold', color: c.secondary },
    // Danger zone
    dangerCard: { backgroundColor: c.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: 'rgba(29,158,117,0.2)', marginBottom: Spacing.xl, overflow: 'hidden' },
    dangerRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, gap: Spacing.md },
    dangerEmoji: { fontSize: 18 },
    dangerText: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-SemiBold', color: c.destructive },
    // Version
    version: { fontSize: FontSize.xs, color: c.mutedForeground, textAlign: 'center', marginBottom: Spacing.md },
    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
    modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.xl, paddingBottom: 40, borderTopWidth: 1 },
    modalTitle: { fontSize: FontSize.xl, fontFamily: 'PlusJakartaSans-ExtraBold', marginBottom: Spacing.xl },
    modalInput: { borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.lg, fontSize: FontSize.base, fontFamily: 'PlusJakartaSans-Regular', marginBottom: Spacing.xl },
    modalBtn: { borderRadius: Radius.lg, paddingVertical: 14, alignItems: 'center' },
    modalBtnText: { fontSize: FontSize.base, fontFamily: 'PlusJakartaSans-ExtraBold' },
    // Deleting overlay
    deletingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 100, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg },
    deletingText: { color: '#fff', fontFamily: 'PlusJakartaSans-SemiBold', fontSize: FontSize.base },
    // Dose section
    editPenSmall: { fontSize: 16, opacity: 0.6 },
    doseChipLabel: { fontSize: FontSize.xs, fontFamily: 'PlusJakartaSans-SemiBold', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.sm },
    doseChipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
    doseChip: { borderRadius: Radius.md, borderWidth: 1.5, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
    doseChipText: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-SemiBold' },
    doseModalBtns: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm },
    doseModalCancelBtn: { flex: 1, borderRadius: Radius.lg, borderWidth: 1, paddingVertical: 14, alignItems: 'center' },
    doseModalCancelText: { fontSize: FontSize.base, fontFamily: 'PlusJakartaSans-SemiBold' },
    doseModalSaveBtn: { flex: 1, borderRadius: Radius.lg, paddingVertical: 14, alignItems: 'center' },
    ctaDisabled: { opacity: 0.5 },
  });
}
