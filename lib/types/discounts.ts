import { Timestamp } from 'firebase/firestore';

// Coupon Types
export type CouponType = 'percentage' | 'fixed';
export type CouponStatus = 'active' | 'expired' | 'used' | 'disabled';

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number; // percentage (0-100) or fixed amount
  description?: string;
  assignedUserIds?: string[]; // If empty/undefined, coupon is available to all
  usedByUserIds?: string[]; // Track who used it
  maxUses?: number; // Total max uses (0 = unlimited)
  maxUsesPerUser?: number; // Max uses per user (default 1)
  currentUses: number;
  minPurchaseAmount?: number;
  validFrom: Timestamp;
  validUntil: Timestamp;
  status: CouponStatus;
  createdAt: Timestamp;
  createdBy?: string;
}

export interface UserForCoupon {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  photoURL?: string;
}

// Court Discount Types
export interface AppliedDiscount {
  id: string;
  percentage: number;
  appliedAt: string;
  timeRange?: {
    from: string;
    until: string;
  };
  isAllHours: boolean;
}

export interface Court {
  id: string;
  name: string;
  appliedDiscounts?: AppliedDiscount[];
  availableFrom: string;
  availableUntil: string;
  status: 'active' | 'maintenance';
}

// Form Types
export interface CouponFormData {
  code: string;
  type: CouponType;
  value: string;
  description: string;
  maxUses: string;
  maxUsesPerUser: string;
  minPurchaseAmount: string;
  validDays: string;
  isForAllUsers: boolean;
  selectedUserIds: string[];
}

export interface CourtDiscountFormData {
  percentage: string;
  fromTime: string;
  untilTime: string;
  applyToAllHours: boolean;
}

// Default values
export const DEFAULT_COUPON_FORM: CouponFormData = {
  code: '',
  type: 'percentage',
  value: '',
  description: '',
  maxUses: '',
  maxUsesPerUser: '1',
  minPurchaseAmount: '',
  validDays: '30',
  isForAllUsers: true,
  selectedUserIds: [],
};

export const DEFAULT_COURT_DISCOUNT_FORM: CourtDiscountFormData = {
  percentage: '',
  fromTime: '08:00',
  untilTime: '22:00',
  applyToAllHours: true,
};
