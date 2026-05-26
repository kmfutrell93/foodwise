import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Radius, FontSize, ThemeColors } from '@/constants/theme';
import { useThemeColors } from '@/context/ThemeContext';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

export function Button({ label, onPress, variant = 'primary', loading, disabled, style, textStyle }: Props) {
  const colors = useThemeColors();
  const s = makeStyles(colors);
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[s.base, s[variant], (disabled || loading) && s.disabled, style]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.primaryForeground : colors.primary} />
      ) : (
        <Text style={[s.text, s[`${variant}Text` as keyof ReturnType<typeof makeStyles>] as TextStyle, textStyle]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

function makeStyles(c: ThemeColors) {
  return StyleSheet.create({
    base: { borderRadius: Radius.full, paddingVertical: 18, paddingHorizontal: 32, alignItems: 'center', justifyContent: 'center', width: '100%' },
    primary: { backgroundColor: c.primary },
    secondary: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: c.border },
    ghost: { backgroundColor: 'transparent' },
    disabled: { opacity: 0.45 },
    text: { fontSize: FontSize.base, fontFamily: 'PlusJakartaSans-Bold' },
    primaryText: { color: c.primaryForeground },
    secondaryText: { color: c.foreground },
    ghostText: { color: c.mutedForeground },
  });
}
