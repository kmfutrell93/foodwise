import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Colors, FontSize, Spacing, Radius } from '@/constants/theme';

const reviews = [
  { name: 'Sarah M.', handle: '@sarahglp1', text: "Finally a meal planner that understands I can barely eat on shot day. The injection-day meals are a game changer.", stars: 5 },
  { name: 'Jake T.', handle: '@jakewegovy', text: "I was losing muscle and didn't know why. After 3 weeks on FoodWise my protein is consistently at goal.", stars: 5 },
  { name: 'Maria L.', handle: '@marialosingit', text: "The budget feature is underrated. I'm eating better GLP-1 meals for $68/week. Less than I spent eating out.", stars: 5 },
];

export default function Review() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>From the community</Text>
        <Text style={styles.title}>Real people.{'\n'}Real results.</Text>

        <View style={styles.reviews}>
          {reviews.map((r) => (
            <View key={r.name} style={styles.card}>
              <View style={styles.stars}>
                {'★★★★★'.split('').map((s, i) => (
                  <Text key={i} style={styles.star}>{s}</Text>
                ))}
              </View>
              <Text style={styles.reviewText}>"{r.text}"</Text>
              <View style={styles.reviewer}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{r.name[0]}</Text>
                </View>
                <View>
                  <Text style={styles.reviewerName}>{r.name}</Text>
                  <Text style={styles.reviewerHandle}>{r.handle}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <Button label="Continue to summary" onPress={() => router.push('/(onboarding)/16-summary')} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.xl, paddingTop: Spacing['3xl'], paddingBottom: Spacing['3xl'] },
  label: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Bold', color: Colors.primary, letterSpacing: 2, textTransform: 'uppercase', marginBottom: Spacing.md },
  title: { fontSize: FontSize['3xl'], fontFamily: 'PlusJakartaSans-ExtraBold', color: Colors.foreground, lineHeight: 38, marginBottom: Spacing['2xl'] },
  reviews: { gap: Spacing.md, marginBottom: Spacing['2xl'] },
  card: { padding: Spacing.xl, borderRadius: Radius.xl, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md },
  stars: { flexDirection: 'row', gap: 2 },
  star: { color: Colors.primary, fontSize: FontSize.base },
  reviewText: { fontSize: FontSize.base, color: Colors.foreground, lineHeight: 24, fontStyle: 'italic' },
  reviewer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(232,157,53,0.2)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: Colors.primary, fontFamily: 'PlusJakartaSans-Bold', fontSize: FontSize.sm },
  reviewerName: { fontSize: FontSize.sm, fontFamily: 'PlusJakartaSans-Bold', color: Colors.foreground },
  reviewerHandle: { fontSize: FontSize.xs, color: Colors.mutedForeground },
});
