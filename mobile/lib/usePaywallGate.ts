import { useRouter } from 'expo-router';
import { useRevenueCat } from '@/context/RevenueCatContext';
import { trackPaywallShown, PaywallTrigger } from '@/lib/analytics';
import { waitForPaywallResult } from '@/lib/paywall-result';

/**
 * Returns a function that checks entitlement and opens the custom in-app
 * paywall (/(app)/paywall) if needed — never RevenueCat's hosted template.
 * Resolves true if the user is/becomes Pro, false if they cancel or close.
 *
 * Usage:
 *   const requirePro = usePaywallGate();
 *   const allowed = await requirePro();
 *   if (!allowed) return;
 */
export function usePaywallGate() {
  const { isPro, refreshCustomerInfo } = useRevenueCat();
  const router = useRouter();

  return async (trigger: PaywallTrigger = 'meal_generation'): Promise<boolean> => {
    if (isPro) return true;

    trackPaywallShown(trigger);
    const resultPromise = waitForPaywallResult();
    router.push('/(app)/paywall' as any);
    const purchased = await resultPromise;
    if (purchased) await refreshCustomerInfo();
    return purchased;
  };
}
