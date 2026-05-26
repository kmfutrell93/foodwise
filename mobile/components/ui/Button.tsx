import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Colors, Radius, FontSize } from '@/constants/theme';

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
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[styles.base, styles[variant], (disabled || loading) && styles.disabled, style]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? Colors.primaryForeground : Colors.primary} />
      ) : (
        <Text style={[styles.text, styles[`${variant}Text` as keyof typeof styles], textStyle as TextStyle]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.full,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  primary: { backgroundColor: Colors.primary },
  secondary: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.border },
  ghost: { backgroundColor: 'transparent' },
  disabled: { opacity: 0.45 },
  text: { fontSize: FontSize.base, fontFamily: 'PlusJakartaSans-Bold', letterSpacing: 0.1 },
  primaryText: { color: Colors.primaryForeground },
  secondaryText: { color: Colors.foreground },
  ghostText: { color: Colors.mutedForeground },
});
