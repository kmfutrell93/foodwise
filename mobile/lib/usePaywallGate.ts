import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { useRevenueCat, ENTITLEMENT_ID } from '@/context/RevenueCatContext';
import { trackPaywallShown } from '@/lib/analytics';

/**
 * Returns a function that checks entitlement and presents the RC paywall if needed.
 * Resolves true if the user is/becomes Pro, false if they cancel or close.
 *
 * Usage:
 *   const requirePro = usePaywallGate();
 *   const allowed = await requirePro();
 *   if (!allowed) return;
 */
export function usePaywallGate() {
  const { isPro, refreshCustomerInfo } = useRevenueCat();

  return async (): Promise<boolean> => {
    if (isPro) return true;

    trackPaywallShown('meal_generation');
    const result = await RevenueCatUI.presentPaywallIfNeeded({
      requiredEntitlementIdentifier: ENTITLEMENT_ID,
    });

    if (
      result === PAYWALL_RESULT.PURCHASED ||
      result === PAYWALL_RESULT.RESTORED
    ) {
      await refreshCustomerInfo();
      return true;
    }

    return false;
  };
}
