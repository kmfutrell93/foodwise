import React, { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import { FontSize } from '@/constants/theme';
import { useThemeColors } from '@/context/ThemeContext';
import { syncWeightFromHealth } from '@/lib/health-sync';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TABS: { name: string; label: string; icon: IoniconsName; iconFocused: IoniconsName }[] = [
  { name: 'home', label: 'Home', icon: 'home-outline', iconFocused: 'home' },
  { name: 'meal-plan', label: 'Plan', icon: 'restaurant-outline', iconFocused: 'restaurant' },
  { name: 'recipes', label: 'Recipes', icon: 'book-outline', iconFocused: 'book' },
  { name: 'grocery-list', label: 'Grocery', icon: 'cart-outline', iconFocused: 'cart' },
  { name: 'symptom-tracker', label: 'Symptoms', icon: 'pulse-outline', iconFocused: 'pulse' },
  { name: 'progress', label: 'Progress', icon: 'trending-up-outline', iconFocused: 'trending-up' },
  { name: 'settings', label: 'Settings', icon: 'settings-outline', iconFocused: 'settings' },
];

function AnimatedTabIcon({
  name, size, color, focused,
}: {
  name: IoniconsName; size: number; color: string; focused: boolean;
}) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (focused) {
      scale.value = withSpring(1.2, { damping: 12, stiffness: 300 });
    } else {
      scale.value = withSpring(1.0, { damping: 15, stiffness: 300 });
    }
  }, [focused]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      <Ionicons name={name} size={size} color={color} />
    </Animated.View>
  );
}

export default function AppLayout() {
  const colors = useThemeColors();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        syncWeightFromHealth().catch(() => {});
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 16,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarLabelStyle: {
          fontSize: FontSize.xs,
          fontFamily: 'PlusJakartaSans-SemiBold',
        },
      }}
    >
      {TABS.map(tab => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.label,
            tabBarIcon: ({ focused, color, size }) => (
              <AnimatedTabIcon
                name={focused ? tab.iconFocused : tab.icon}
                size={size}
                color={color}
                focused={focused}
              />
            ),
          }}
        />
      ))}
      <Tabs.Screen name="smart-fridge" options={{ href: null }} />
      <Tabs.Screen name="recipe/[id]" options={{ href: null }} />
    </Tabs>
  );
}
