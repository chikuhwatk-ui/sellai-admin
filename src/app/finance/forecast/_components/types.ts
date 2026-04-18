// Mirror of the backend `ForecastInputs` / `ForecastOutputs` shapes.
// Kept in sync manually; if the backend grows a new lever, add it here
// too (TypeScript will flag every place the field is read).

export type TierKey = 'STARTER' | 'PRO_DEALER' | 'MARKET_MOVER' | 'BIG_BOSS';
export type RefillKey = 'EMERGENCY_5' | 'QUICK_20' | 'POWER_100';

export interface PaidTierMix { STARTER: number; PRO_DEALER: number; MARKET_MOVER: number; BIG_BOSS: number }
export interface RefillMix { EMERGENCY_5: number; QUICK_20: number; POWER_100: number }
export interface MonthlyRate { STARTER: number; PRO_DEALER: number; MARKET_MOVER: number; BIG_BOSS: number }
export interface UpgradeRates {
  STARTER_TO_PRO_DEALER: number;
  PRO_DEALER_TO_MARKET_MOVER: number;
  MARKET_MOVER_TO_BIG_BOSS: number;
}
export interface BundlePrices {
  STARTER: number; PRO_DEALER: number; MARKET_MOVER: number; BIG_BOSS: number;
  EMERGENCY_5: number; QUICK_20: number; POWER_100: number;
}
export interface InvestmentInflow { yearMonth: string; amountUsd: number; label?: string }

export interface ForecastInputs {
  startYearMonth: string;
  horizonMonths: number;

  startingActiveSellersByTier: PaidTierMix;
  startingActiveFreeTrialSellers: number;
  startingActiveRunners: number;
  startingDeferredCreditBalanceUsd: number;
  startingDeferredSlotBalanceUsd: number;
  startingRunnerWalletLiabilityUsd: number;
  startingCashUsd: number;

  newSellersMonth1: number;
  newSellersMonthlyGrowth: number;
  newBuyersMonth1: number;
  newBuyersMonthlyGrowth: number;
  newRunnersMonth1: number;
  newRunnersMonthlyGrowth: number;

  trialActivationRate: number;
  trialToPaidRate: number;
  firstPaidTierMix: PaidTierMix;

  upgradeRates: UpgradeRates;
  monthlyRepurchaseRate: MonthlyRate;

  refillAttachRatePerTier: MonthlyRate;
  refillMix: RefillMix;

  bundlePrices: BundlePrices;

  creditsSpentPerActiveSellerPerMonth: number;
  revenuePerCreditUsd: number;

  deliveriesPerActiveRunnerPerMonth: number;
  avgDeliveryFeeUsd: number;
  commissionRate: number;

  gatewayFeePct: number;

  hostingMonthlyUsd: number;
  headcountMonthlyUsd: number;
  marketingMonthlyUsd: number;
  gaMonthlyUsd: number;

  hostingMonthlyGrowth: number;
  headcountMonthlyGrowth: number;
  marketingMonthlyGrowth: number;
  gaMonthlyGrowth: number;

  investmentInflows: InvestmentInflow[];
}

export interface ForecastMonth {
  yearMonth: string;
  monthIndex: number;
  newSellers: number;
  trialActiveSellers: number;
  activePaidSellersStarter: number;
  activePaidSellersProDealer: number;
  activePaidSellersMarketMover: number;
  activePaidSellersBigBoss: number;
  activePaidSellersTotal: number;
  activeRunners: number;
  activeBuyers: number;
  bookingsComboUsd: number;
  bookingsRefillUsd: number;
  bookingsTotalUsd: number;
  walletTopupsUsd: number;
  deferredCreditAddedUsd: number;
  deferredSlotAddedUsd: number;
  deferredCreditRecognizedUsd: number;
  deferredSlotRecognizedUsd: number;
  deferredCreditBalanceEndUsd: number;
  deferredSlotBalanceEndUsd: number;
  creditRevenueUsd: number;
  slotRevenueUsd: number;
  commissionRevenueUsd: number;
  totalRevenueUsd: number;
  gatewayFeesUsd: number;
  grossProfitUsd: number;
  grossMarginPct: number;
  hostingUsd: number;
  headcountUsd: number;
  marketingUsd: number;
  gaUsd: number;
  opexUsd: number;
  ebitdaUsd: number;
  netIncomeUsd: number;
  cashInUsd: number;
  cashOutUsd: number;
  netCashUsd: number;
  closingCashUsd: number;
  runnerWalletLiabilityEndUsd: number;
  creditsSpent: number;
  creditUtilizationPct: number;
  buyerDemandPerActiveSeller: number;
  impliedDeliveryAttachPct: number;
}

export interface ForecastSummary {
  totalBookingsUsd: number;
  totalRevenueUsd: number;
  totalGrossProfitUsd: number;
  totalEbitdaUsd: number;
  endingCashUsd: number;
  lowestCashBalanceUsd: number;
  lowestCashMonth: string;
  runwayMonthsAtMonthEnd: number | null;
  breakEvenMonth: string | null;
  cacUsd: number | null;
  ltvUsd: number | null;
  ltvToCacRatio: number | null;
  paybackMonths: number | null;
}

export interface ForecastOutputs {
  computedAt: string;
  horizonMonths: number;
  months: ForecastMonth[];
  summary: ForecastSummary;
}

export interface ForecastScenario {
  id: string;
  name: string;
  description: string | null;
  isBase: boolean;
  horizonMonths: number;
  startYearMonth: string;
  inputs: ForecastInputs;
  outputs: ForecastOutputs | null;
  computedAt: string | null;
  createdByAdminId: string;
  createdAt: string;
  updatedAt: string;
}

export interface VarianceRow {
  yearMonth: string;
  metric: string;
  planValue: number;
  actualValue: number;
  deltaUsd: number;
  deltaPct: number | null;
}

export function formatMoney(v: number): string {
  const sign = v < 0 ? '-' : '';
  return `${sign}$${Math.abs(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatPct(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

export function formatInt(v: number): string {
  return Math.round(v).toLocaleString();
}
