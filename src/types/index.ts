// ── Enums matching Prisma schema ──

export type UserRole = 'BUYER' | 'SELLER' | 'DELIVERY_PARTNER' | 'ADMIN' | 'PENDING';
export type VerificationStatus = 'GUEST' | 'PROVISIONALLY_VERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';
export type OfferStatus = 'DELIVERED' | 'ACCEPTED' | 'REJECTED' | 'VIEWED';
export type IntentStatus = 'OPEN' | 'CLOSED' | 'EXPIRED' | 'MATCHED' | 'STOPPED';
export type DeliveryStatus = 'REQUESTED' | 'BID_PENDING' | 'BID_ACCEPTED' | 'PICKED_UP' | 'EN_ROUTE' | 'ARRIVED' | 'COMPLETED' | 'CANCELLED';
export type BidStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
export type IntentType = 'GOODS' | 'SERVICE';
export type Urgency = 'TODAY' | 'THIS_WEEK' | 'FLEXIBLE';
export type BundleType = 'STARTER' | 'PRO_DEALER' | 'MARKET_MOVER' | 'BIG_BOSS' | 'EMERGENCY_5' | 'QUICK_20' | 'POWER_100';
export type SubscriptionTier = 'FREE_TRIAL' | 'BASIC' | 'POWER_SELLER' | 'UNLIMITED' | 'STARTER';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED';
export type RejectionReason = 'BLURRY_PHOTO' | 'NAME_MISMATCH' | 'EXPIRED_ID' | 'FAKE_FRAUDULENT' | 'INCOMPLETE_SUBMISSION' | 'OTHER';
export type StopReason = 'found_on_sellai' | 'found_elsewhere' | 'cancelled' | 'deal_accepted';
export type IgnoredReason = 'no_stock' | 'too_far' | 'not_interested' | 'wrong_category';

// ── Data Models ──

export interface User {
  id: string;
  firebaseUid: string;
  phoneNumber: string;
  name: string | null;
  avatarUrl: string | null;
  role: UserRole;
  verificationStatus: VerificationStatus;
  latitude: number | null;
  longitude: number | null;
  location: string | null;
  country: string;
  locale: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
  sellerProfile?: SellerProfile;
  deliveryPartner?: DeliveryPartner;
  _count?: { orders: number; intents: number; reviewsWritten: number };
}

export interface SellerProfile {
  id: string;
  userId: string;
  businessName: string;
  rating: number;
  reviewCount: number;
  subscriptionTier: SubscriptionTier;
  offerCredits: number;
  isServiceProvider: boolean;
  deliveryRadius: number;
  country: string;
  createdAt: string;
  metrics?: SellerMetrics;
}

export interface SellerMetrics {
  totalSales: number;
  avgRating: number;
  avgResponseTime: number;
  fulfillmentRate: number;
  repeatBuyerRate: number;
  trustScore: number;
  lastActiveAt: string | null;
}

export interface DeliveryPartner {
  id: string;
  userId: string;
  vehicleType: string;
  vehiclePlate: string;
  isOnline: boolean;
  currentLat: number | null;
  currentLng: number | null;
  rating: number;
  deliveryCount: number;
  totalEarnings: number;
  createdAt: string;
}

export interface Intent {
  id: string;
  buyerId: string;
  description: string;
  imageUrl: string | null;
  categoryId: string;
  subcategory: string | null;
  latitude: number;
  longitude: number;
  locationName: string | null;
  status: IntentStatus;
  intentType: IntentType;
  urgency: Urgency;
  budgetMin: number | null;
  budgetMax: number | null;
  currency: string;
  country: string;
  expiresAt: string;
  createdAt: string;
  buyer?: User;
  _count?: { offers: number };
}

export interface Offer {
  id: string;
  intentId: string;
  sellerId: string;
  price: number;
  currency: string;
  message: string | null;
  status: OfferStatus;
  createdAt: string;
  seller?: SellerProfile;
  intent?: Intent;
}

export interface Order {
  id: string;
  offerId: string;
  intentId: string;
  buyerId: string;
  sellerId: string;
  totalAmount: number;
  deliveryFee: number | null;
  currency: string;
  status: OrderStatus;
  deliveryAddress: string | null;
  createdAt: string;
  completedAt: string | null;
  cancelledAt: string | null;
  buyer?: User;
  offer?: Offer;
}

export interface Delivery {
  id: string;
  chatId: string;
  pickupAddress: string;
  deliveryAddress: string;
  pickupLat: number;
  pickupLng: number;
  deliveryLat: number;
  deliveryLng: number;
  partnerId: string | null;
  baseFee: number;
  finalPrice: number | null;
  distance: number | null;
  status: DeliveryStatus;
  currency: string;
  requestedAt: string;
  acceptedAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  partner?: DeliveryPartner;
}

export interface Review {
  id: string;
  sellerId: string | null;
  deliveryPartnerId: string | null;
  buyerId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  buyer?: User;
}

export interface VerificationSubmission {
  id: string;
  userId: string;
  fullName: string;
  idNumber: string;
  status: VerificationStatus;
  rejectionReason: RejectionReason | null;
  rejectionNote: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  isPriority: boolean;
  submittedAt: string;
  user?: User;
}

export interface CreditPurchase {
  id: string;
  sellerId: string;
  bundleType: BundleType;
  creditsAdded: number;
  amountPaid: number;
  reference: string | null;
  status: PaymentStatus;
  createdAt: string;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: 'WALLET_TOPUP' | 'COMMISSION_DEDUCT' | 'REFUND';
  amount: number;
  description: string;
  status: PaymentStatus;
  createdAt: string;
}

export interface AdminAuditLog {
  id: string;
  adminUserId: string;
  action: string;
  targetType: string;
  targetId: string;
  reason: string;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

// ── Analytics Types ──

export interface KPICard {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: string;
  trend?: number[];
}

export interface FunnelStep {
  label: string;
  value: number;
  rate?: number;
}

export interface TimeSeriesPoint {
  date: string;
  value: number;
  label?: string;
}

export interface CategoryMetric {
  categoryId: string;
  categoryName: string;
  demandCount: number;
  offerCount: number;
  fillRate: number;
  avgPrice: number;
  revenue: number;
  conversionRate: number;
}

export interface CohortRow {
  cohort: string;
  size: number;
  retention: number[];
}

export interface GeoPoint {
  lat: number;
  lng: number;
  value: number;
  label?: string;
}
