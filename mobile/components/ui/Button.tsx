import React from 'react';
import {
  TouchableOpacity, Text, ActivityIndicator,
  ViewStyle, TextStyle, StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import { Colors, Radius, Shadows } from '@/constants/theme';

type Variant = 'primary' | 'outline' | 'ghost';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

export function Button({
  label, onPress, variant = 'primary', loading, disabled, style, textStyle,
}: Props) {
  const scale = useSharedValue(1);

  function onPressIn() {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  }
  function onPressOut() {
    scale.value = withSpring(1.0, { damping: 15, stiffness: 300 });
  }

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const containerStyle = [
    s.base,
    variant === 'primary'  && [s.primary, Shadows.teal],
    variant === 'outline'  && s.outline,
    variant === 'ghost'    && s.ghost,
    (disabled || loading)  && s.disabled,
    style,
  ];

  const labelStyle = [
    s.text,
    variant === 'primary' && s.textPrimary,
    variant === 'outline' && s.textOutline,
    variant === 'ghost'   && s.textGhost,
    textStyle,
  ];

  return (
    <Animated.View style={[animStyle, { width: '100%' }]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled || loading}
        activeOpacity={0.85}
        style={containerStyle}
      >
        {loading ? (
          <ActivityIndicator color={variant === 'primary' ? '#FFFFFF' : Colors.teal} />
        ) : (
          <Text style={labelStyle}>{label}</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  base: {
    borderRadius: Radius.lg,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  primary: {
    backgroundColor: Colors.teal,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.borderTeal,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.45,
  },
  text: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-Bold',
    letterSpacing: 0.2,
  },
  textPrimary:  { color: '#FFFFFF' },
  textOutline:  { color: Colors.mint },
  textGhost:    { color: Colors.textSecondary },
});
