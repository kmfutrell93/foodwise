import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import Purchases, {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
  LOG_LEVEL,
} from 'react-native-purchases';
import { supabase } from '@/lib/supabase';
import { trackTrialStarted, trackSubscriptionCancelled } from '@/lib/analytics';

// Test key — swap for production key (appl_...) before App Store submission
const RC_API_KEY = 'test_mRBkjBmrncOWclxaxbsAYTEgZyJ';

export const ENTITLEMENT_ID = 'FoodWise Pro';

type RevenueCatContextType = {
  isPro: boolean;
  customerInfo: CustomerInfo | null;
  currentOffering: PurchasesOffering | null;
  isLoading: boolean;
  purchasePackage: (pkg: PurchasesPackage) => Promise<CustomerInfo>;
  restorePurchases: () => Promise<CustomerInfo>;
  refreshCustomerInfo: () => Promise<void>;
};

const RevenueCatContext = createContext<RevenueCatContextType | null>(null);

export function RevenueCatProvider({ children }: { children: React.ReactNode }) {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [currentOffering, setCurrentOffering] = useState<PurchasesOffering | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initialized = useRef(false);

  const isPro = !!customerInfo?.entitlements.active[ENTITLEMENT_ID];

  useEffect(() => {
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') return;
    if (initialized.current) return;
    initialized.current = true;
    setup();

    return () => {
      Purchases.removeCustomerInfoUpdateListener(handleCustomerInfoUpdate);
    };
  }, []);

  function handleCustomerInfoUpdate(info: CustomerInfo) {
    setCustomerInfo(info);
  }

  async function setup() {
    try {
      if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);

      Purchases.configure({ apiKey: RC_API_KEY });
      Purchases.addCustomerInfoUpdateListener(handleCustomerInfoUpdate);

      // Identify the user with their Supabase UID so purchase history
      // is tied to the account, not the device.
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await Purchases.logIn(user.id);
      }

      await Promise.all([refreshCustomerInfo(), loadOfferings()]);
    } catch (e) {
      console.error('[RevenueCat] setup failed:', e);
    } finally {
      setIsLoading(false);
    }
  }

  async function refreshCustomerInfo() {
    try {
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
    } catch (e) {
      console.error('[RevenueCat] getCustomerInfo failed:', e);
    }
  }

  async function loadOfferings() {
    try {
      const offerings = await Purchases.getOfferings();
      setCurrentOffering(offerings.current ?? null);
    } catch (e) {
      console.error('[RevenueCat] getOfferings failed:', e);
    }
  }

  const purchasePackage = useCallback(async (pkg: PurchasesPackage): Promise<CustomerInfo> => {
    const { customerInfo: info } = await Purchases.purchasePackage(pkg);
    setCustomerInfo(info);
    const plan = pkg.packageType.toLowerCase() as 'monthly' | 'yearly' | 'lifetime';
    // All FoodWise products have a 7-day free trial — every initial purchase starts a trial.
    // subscription_converted fires via RC webhook when the trial actually converts to paid.
    trackTrialStarted({ product_id: pkg.product.identifier, plan });
    return info;
  }, []);

  const restorePurchases = useCallback(async (): Promise<CustomerInfo> => {
    const infoBefore = customerInfo;
    const info = await Purchases.restorePurchases();
    setCustomerInfo(info);
    // If Pro was active before restore and is now gone, it was cancelled
    const wasPro = !!infoBefore?.entitlements.active[ENTITLEMENT_ID];
    const nowPro = !!info.entitlements.active[ENTITLEMENT_ID];
    if (wasPro && !nowPro) trackSubscriptionCancelled({ plan: 'monthly' });
    return info;
  }, [customerInfo]);

  return (
    <RevenueCatContext.Provider
      value={{ isPro, customerInfo, currentOffering, isLoading, purchasePackage, restorePurchases, refreshCustomerInfo }}
    >
      {children}
    </RevenueCatContext.Provider>
  );
}

export function useRevenueCat() {
  const ctx = useContext(RevenueCatContext);
  if (!ctx) throw new Error('useRevenueCat must be used within RevenueCatProvider');
  return ctx;
}
