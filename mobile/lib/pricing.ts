import { PurchasesPackage, PACKAGE_TYPE } from 'react-native-purchases';

export interface PricingDisplay {
  /** Primary price line — actual billed period amount (Apple IAP disclosure). */
  periodPriceDisplay: string;
  fullBillingDisplay: string;
  periodLabel: string;
}

/**
 * Hero pricing for paywalls: show the real charged amount (/month or /year),
 * not a weekly equivalent. Apple requires the actual billed price to be clear.
 */
export function formatPricingDisplay(pkg: PurchasesPackage): PricingDisplay {
  const { product, packageType } = pkg;

  let fullBillingDisplay: string;
  let periodLabel: string;

  switch (packageType) {
    case PACKAGE_TYPE.ANNUAL:
      fullBillingDisplay = 'Best value · billed once a year';
      periodLabel = 'Yearly';
      break;
    case PACKAGE_TYPE.SIX_MONTH:
      fullBillingDisplay = `billed every 6 months at ${product.priceString}`;
      periodLabel = '6 Months';
      break;
    case PACKAGE_TYPE.THREE_MONTH:
      fullBillingDisplay = `billed every 3 months at ${product.priceString}`;
      periodLabel = '3 Months';
      break;
    case PACKAGE_TYPE.MONTHLY:
    default:
      fullBillingDisplay = 'Billed monthly';
      periodLabel = 'Monthly';
      break;
  }

  return {
    periodPriceDisplay: formatBillingAmount(pkg),
    fullBillingDisplay,
    periodLabel,
  };
}

// Returns integer savings percentage between two packages, or null if it can't be computed.
export function calcSavingsPct(
  monthlyPkg: PurchasesPackage,
  annualPkg: PurchasesPackage,
): number | null {
  const monthlyPerYear = monthlyPkg.product.pricePerYear;
  const annualPrice = annualPkg.product.price;
  if (monthlyPerYear == null || !annualPrice || monthlyPerYear <= 0) return null;
  const pct = Math.round(((monthlyPerYear - annualPrice) / monthlyPerYear) * 100);
  return pct > 0 ? pct : null;
}

// Returns the real billing amount for display in settings after purchase.
// e.g. "$11.99/month" or "$59.99/year"
export function formatBillingAmount(pkg: PurchasesPackage): string {
  const { product, packageType } = pkg;
  switch (packageType) {
    case PACKAGE_TYPE.ANNUAL:     return `${product.priceString}/year`;
    case PACKAGE_TYPE.SIX_MONTH:  return `${product.priceString}/6 mo`;
    case PACKAGE_TYPE.THREE_MONTH: return `${product.priceString}/3 mo`;
    case PACKAGE_TYPE.WEEKLY:     return `${product.priceString}/week`;
    case PACKAGE_TYPE.MONTHLY:
    default:                      return `${product.priceString}/month`;
  }
}
