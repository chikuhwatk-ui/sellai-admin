export type BudgetCategory =
  | 'HOSTING_INFRA' | 'DATABASE' | 'STORAGE_CDN' | 'PAYMENT_GATEWAY'
  | 'SMS_OTP' | 'PUSH_NOTIFICATIONS' | 'EMAIL' | 'MAPS_LOCATION'
  | 'AI_LLM' | 'MONITORING' | 'APP_STORES' | 'DOMAINS_SSL'
  | 'CUSTOMER_SUPPORT' | 'DEV_TOOLS'
  | 'MARKETING' | 'TEAM_SALARIES' | 'OFFICE_OPERATIONS' | 'LEGAL_COMPLIANCE' | 'OTHER';

export type BudgetScalesWith =
  | 'NONE' | 'SELLERS' | 'BUYERS' | 'RUNNERS' | 'TOTAL_USERS'
  | 'PAID_SIGNUPS' | 'TRANSACTIONS' | 'BOOKINGS_USD' | 'DELIVERIES'
  | 'STORAGE_GB' | 'BANDWIDTH_GB' | 'EVENTS' | 'CUSTOM';

export type BudgetPricingModel =
  | 'FREE' | 'FIXED' | 'USAGE' | 'FIXED_PLUS_USAGE'
  | 'PERCENT_OF_GMV' | 'ONE_TIME';

export type BudgetPlatform =
  | 'BACKEND' | 'ADMIN_WEB' | 'MARKETING_WEB' | 'MOBILE_APP'
  | 'DESKTOP_APP' | 'ALL';

export interface BudgetPeriod {
  id: string;
  name: string;
  yearMonth: string;
  projectedSellers: number;
  projectedBuyers: number;
  projectedRunners: number;
  projectedTransactions: number;
  projectedBookingsUsd: number;
  projectedDeliveries: number;
  notes: string | null;
  isActive: boolean;
  createdByAdminId: string;
  createdAt: string;
  updatedAt: string;
  _count?: { lineItems: number };
}

export interface BudgetLineItem {
  id: string;
  budgetPeriodId: string;
  category: BudgetCategory;
  vendor: string;
  purpose: string;
  platform: BudgetPlatform;
  tier: string | null;
  referenceUrl: string | null;
  pricingModel: BudgetPricingModel;
  fixedMonthlyUsd: number;
  unitCostUsd: number;
  unitBasis: string | null;
  freeUnitsPerMonth: number;
  scalesWith: BudgetScalesWith;
  unitsPerScaleUnit: number;
  overrideMonthlyUsd: number | null;
  isProductCost: boolean;
  isActive: boolean;
  displayOrder: number;
  notes: string | null;

  // Computed fields from summarizePeriod
  projectedUnits: number;
  billableUnits: number;
  projectedMonthlyUsd: number;
}

export interface BudgetSummary {
  period: BudgetPeriod;
  lineItems: BudgetLineItem[];
  categoryTotals: Array<{ category: BudgetCategory; recurringUsd: number; oneTimeUsd: number; count: number }>;
  recurringMonthlyTotalUsd: number;
  oneTimeTotalUsd: number;
  launchMonthTotalUsd: number;
  productCostMonthlyUsd: number;
  nonProductCostMonthlyUsd: number;
}

export const CATEGORY_LABEL: Record<BudgetCategory, string> = {
  HOSTING_INFRA: 'Hosting & infrastructure',
  DATABASE: 'Database',
  STORAGE_CDN: 'Storage / CDN',
  PAYMENT_GATEWAY: 'Payment gateways',
  SMS_OTP: 'SMS / OTP',
  PUSH_NOTIFICATIONS: 'Push notifications',
  EMAIL: 'Email',
  MAPS_LOCATION: 'Maps / location',
  AI_LLM: 'AI / LLM',
  MONITORING: 'Monitoring & analytics',
  APP_STORES: 'App stores',
  DOMAINS_SSL: 'Domains & SSL',
  CUSTOMER_SUPPORT: 'Customer support',
  DEV_TOOLS: 'Dev tools',
  MARKETING: 'Marketing',
  TEAM_SALARIES: 'Team / salaries',
  OFFICE_OPERATIONS: 'Office / ops',
  LEGAL_COMPLIANCE: 'Legal / compliance',
  OTHER: 'Other',
};

export const PRICING_LABEL: Record<BudgetPricingModel, string> = {
  FREE: 'Free',
  FIXED: 'Fixed monthly',
  USAGE: 'Pay-per-use',
  FIXED_PLUS_USAGE: 'Base + usage',
  PERCENT_OF_GMV: '% of bookings',
  ONE_TIME: 'One-time',
};

export const SCALES_LABEL: Record<BudgetScalesWith, string> = {
  NONE: 'Fixed',
  SELLERS: 'Sellers',
  BUYERS: 'Buyers',
  RUNNERS: 'Runners',
  TOTAL_USERS: 'Total users',
  PAID_SIGNUPS: 'Paid signups',
  TRANSACTIONS: 'Transactions',
  BOOKINGS_USD: 'Booking value',
  DELIVERIES: 'Deliveries',
  STORAGE_GB: 'Storage GB',
  BANDWIDTH_GB: 'Bandwidth GB',
  EVENTS: 'Events',
  CUSTOM: 'Custom',
};

export const PLATFORM_LABEL: Record<BudgetPlatform, string> = {
  BACKEND: 'Backend',
  ADMIN_WEB: 'Admin web',
  MARKETING_WEB: 'Marketing site',
  MOBILE_APP: 'Mobile app',
  DESKTOP_APP: 'Desktop (business) app',
  ALL: 'All platforms',
};

export function formatMoney(v: number): string {
  const sign = v < 0 ? '-' : '';
  return `${sign}$${Math.abs(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatInt(v: number): string {
  return Math.round(v).toLocaleString();
}
