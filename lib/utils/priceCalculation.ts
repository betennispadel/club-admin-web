import { Court, AppliedDiscount, User, Role } from '@/lib/types';
import { formatCurrencyByLocale as formatCurrencyFromStore } from '@/stores/localeStore';

export interface PriceInfo {
  basePrice: number;
  heaterCost: number;
  lightCost: number;
  discountPercentage: number;
  discountedPrice: number;
  originalPrice: number;
}

/**
 * Get applied discount for a specific hour on a court
 */
export const getAppliedDiscountForHour = (
  court: Court | undefined,
  hour: number
): AppliedDiscount | undefined => {
  if (!court || !court.appliedDiscounts || court.appliedDiscounts.length === 0) {
    return undefined;
  }

  for (const discount of court.appliedDiscounts) {
    // Check if discount applies to all hours
    if (discount.isAllHours) {
      return discount;
    }

    // Check if hour falls within discount time range
    if (discount.timeRange) {
      const discountFromHour = parseInt(discount.timeRange.from.split(':')[0], 10);
      const discountUntilHour = parseInt(discount.timeRange.until.split(':')[0], 10);
      if (hour >= discountFromHour && hour < discountUntilHour) {
        return discount;
      }
    }
  }

  return undefined;
};

/**
 * Calculate court price for a specific time slot
 */
export const calculateCourtPrice = (
  court: Court | undefined,
  timeString: string,
  userRoleId: string = 'member',
  interval: number = 60 // minutes
): PriceInfo => {
  if (!court) {
    return {
      basePrice: 0,
      heaterCost: 0,
      lightCost: 0,
      discountPercentage: 0,
      discountedPrice: 0,
      originalPrice: 0,
    };
  }

  let basePrice = court.hourlyRate || 0;
  let discountPercentage = 0;
  let hour = 0;

  // Extract hour from time string (e.g., "14:30" -> 14)
  if (timeString && timeString.includes(':')) {
    const [hourPart] = timeString.split(':');
    hour = parseInt(hourPart, 10);
  }

  // Normalize time for schedule matching
  const normalizedTime = `${String(hour).padStart(2, '0')}:00`;

  // Step 1: Find matching price schedule for the time slot
  if (court.priceSchedules && court.priceSchedules.length > 0) {
    const matchedSchedule = court.priceSchedules.find(
      (s) => normalizedTime >= s.from && normalizedTime < s.until
    );

    if (matchedSchedule) {
      // Step 2: Check for role-based pricing
      const rolePrice = matchedSchedule.rolePrices?.[userRoleId];
      if (rolePrice !== undefined) {
        basePrice = rolePrice;
      } else {
        basePrice = matchedSchedule.basePrice;
      }
    }
  }

  // Store original price before discount
  const originalPrice = basePrice;

  // Step 3: Apply discounts if applicable
  const appliedDiscount = getAppliedDiscountForHour(court, hour);
  if (appliedDiscount) {
    discountPercentage = appliedDiscount.percentage;
    basePrice = basePrice * ((100 - discountPercentage) / 100);
  }

  // Calculate costs based on interval (heater/light costs are typically hourly)
  const intervalRatio = interval / 60;
  const heaterCost = (court.heatingCost || 0) * intervalRatio;
  const lightCost = (court.lightingCost || 0) * intervalRatio;

  return {
    basePrice: basePrice * intervalRatio,
    heaterCost,
    lightCost,
    discountPercentage,
    discountedPrice: basePrice * intervalRatio,
    originalPrice: originalPrice * intervalRatio,
  };
};

/**
 * Calculate total price for selected slots
 */
export const calculateTotalPrice = (
  court: Court | undefined,
  selectedSlots: string[],
  userRoleId: string = 'member',
  options: { heater: boolean; light: boolean } = { heater: false, light: false }
): {
  total: number;
  breakdown: {
    courtFee: number;
    heaterFee: number;
    lightFee: number;
    discountAmount: number;
  };
} => {
  if (!court || selectedSlots.length === 0) {
    return {
      total: 0,
      breakdown: { courtFee: 0, heaterFee: 0, lightFee: 0, discountAmount: 0 },
    };
  }

  const interval = court.timeSlotInterval || 60;
  let courtFee = 0;
  let discountAmount = 0;

  // Calculate price for each slot
  selectedSlots.forEach((slot) => {
    const priceInfo = calculateCourtPrice(court, slot, userRoleId, interval);
    courtFee += priceInfo.discountedPrice;
    discountAmount += priceInfo.originalPrice - priceInfo.discountedPrice;
  });

  // Calculate heater and light fees (only once, not per slot)
  const heaterFee = options.heater ? (court.heatingCost || 0) : 0;
  const lightFee = options.light ? (court.lightingCost || 0) : 0;

  const total = courtFee + heaterFee + lightFee;

  return {
    total,
    breakdown: {
      courtFee,
      heaterFee,
      lightFee,
      discountAmount,
    },
  };
};

/**
 * Calculate price for a single slot
 */
export const calculateSlotPrice = (
  court: Court | undefined,
  time: string,
  userRoleId: string = 'member'
): number => {
  if (!court) return 0;
  const interval = court.timeSlotInterval || 60;
  const priceInfo = calculateCourtPrice(court, time, userRoleId, interval);
  return priceInfo.discountedPrice;
};

/**
 * Check if user can afford the reservation
 */
export const canUserAfford = (
  totalPrice: number,
  walletBalance: number,
  negativeBalanceLimit: number = 0,
  allowNegativeBalance: boolean = false
): {
  canAfford: boolean;
  useNegativeBalance: boolean;
  negativeBalanceAmount: number;
  remainingBalance: number;
} => {
  if (totalPrice <= walletBalance) {
    return {
      canAfford: true,
      useNegativeBalance: false,
      negativeBalanceAmount: 0,
      remainingBalance: walletBalance - totalPrice,
    };
  }

  if (allowNegativeBalance) {
    const shortfall = totalPrice - walletBalance;
    if (shortfall <= negativeBalanceLimit) {
      return {
        canAfford: true,
        useNegativeBalance: true,
        negativeBalanceAmount: shortfall,
        remainingBalance: 0 - shortfall,
      };
    }
  }

  return {
    canAfford: false,
    useNegativeBalance: false,
    negativeBalanceAmount: 0,
    remainingBalance: walletBalance - totalPrice,
  };
};

/**
 * Format currency for display using locale settings
 */
export const formatCurrency = (amount: number): string => {
  return formatCurrencyFromStore(amount);
};
