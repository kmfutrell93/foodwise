import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { FontSize, ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/context/ThemeContext';

type Props = {
  /** Optional leading text shown before the tappable Sources link */
  prefix?: string;
  style?: object;
  align?: 'left' | 'center';
};

/** Small, easy-to-find citation entry point (App Store Guideline 1.4.1). */
export function SourcesLink({ prefix = 'Sources & references', style, align = 'center' }: Props) {
  const colors = useThemeColors();
  const s = makeStyles(colors, align);
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() => router.push('/sources' as any)}
      activeOpacity={0.7}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={[s.wrap, style]}
      accessibilityRole="link"
      accessibilityLabel="Open sources and references"
    >
      <Text style={s.text}>
        {prefix}{' '}
        <Text style={s.link}>View sources →</Text>
      </Text>
    </TouchableOpacity>
  );
}

function makeStyles(c: ThemeColors, align: 'left' | 'center') {
  return StyleSheet.create({
    wrap: { marginTop: 8, alignSelf: align === 'center' ? 'center' : 'flex-start' },
    text: {
      fontSize: FontSize.xs,
      color: c.mutedForeground,
      textAlign: align,
      lineHeight: 18,
    },
    link: {
      color: c.primary,
      fontFamily: 'PlusJakartaSans-SemiBold',
      textDecorationLine: 'underline',
    },
  });
}
