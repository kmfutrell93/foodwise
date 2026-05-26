import { PurchasesPackage, PACKAGE_TYPE } from 'react-native-purchases';

export interface PricingDisplay {
  weeklyDisplay: string;
  fullBillingDisplay: string;
  periodLabel: string;
}

// Floor-rounds to avoid showing a higher weekly price than reality.
// e.g. $11.99 / 4 = $2.9975 → "$2.99" (not "$3.00")
function weeklyString(price: number, weeksPerPeriod: number, currencyCode: string): string {
  const amount = Math.floor((price / weeksPerPeriod) * 100) / 100;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

export function formatPricingDisplay(pkg: PurchasesPackage): PricingDisplay {
  const { product, packageType } = pkg;
  const currencyCode = product.currencyCode ?? 'USD';
  const price = product.price;

  let weeks: number;
  let fullBillingDisplay: string;
  let periodLabel: string;

  switch (packageType) {
    case PACKAGE_TYPE.ANNUAL:
      weeks = 52;
      fullBillingDisplay = `billed annually at ${product.priceString}`;
      periodLabel = 'Annual';
      break;
    case PACKAGE_TYPE.SIX_MONTH:
      weeks = 26;
      fullBillingDisplay = `billed every 6 months at ${product.priceString}`;
      periodLabel = '6 Months';
      break;
    case PACKAGE_TYPE.THREE_MONTH:
      weeks = 13;
      fullBillingDisplay = `billed every 3 months at ${product.priceString}`;
      periodLabel = '3 Months';
      break;
    case PACKAGE_TYPE.MONTHLY:
    default:
      weeks = 4;
      fullBillingDisplay = `billed monthly at ${product.priceString}`;
      periodLabel = 'Monthly';
      break;
  }

  return {
    weeklyDisplay: `${weeklyString(price, weeks, currencyCode)}/week`,
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
