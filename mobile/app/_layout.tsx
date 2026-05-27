import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';
import { OnboardingProvider } from '@/context/OnboardingContext';
import { ThemeProvider, useThemeColors } from '@/context/ThemeContext';
import { RevenueCatProvider } from '@/context/RevenueCatContext';
import { supabase } from '@/lib/supabase';
import { initAnalytics } from '@/lib/analytics';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const colors = useThemeColors();
  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(app)" />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'PlusJakartaSans-Regular':   require('../assets/fonts/PlusJakartaSans-Regular.ttf'),
    'PlusJakartaSans-Medium':    require('../assets/fonts/PlusJakartaSans-Medium.ttf'),
    'PlusJakartaSans-SemiBold':  require('../assets/fonts/PlusJakartaSans-SemiBold.ttf'),
    'PlusJakartaSans-Bold':      require('../assets/fonts/PlusJakartaSans-Bold.ttf'),
    'PlusJakartaSans-ExtraBold': require('../assets/fonts/PlusJakartaSans-ExtraBold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      if (fontError) console.warn('[RootLayout] Font load error:', fontError.message);
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) initAnalytics(user.id);
    });
  }, []);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ThemeProvider>
      <RevenueCatProvider>
        <OnboardingProvider>
          <RootNavigator />
        </OnboardingProvider>
      </RevenueCatProvider>
    </ThemeProvider>
  );
}
