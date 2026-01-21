'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Court, AppliedDiscount } from '@/lib/types';
import { getAppliedDiscountForHour, calculateCourtPrice } from '@/lib/utils/priceCalculation';
import { Percent, Lock, Check } from 'lucide-react';

export type SlotStatus = 'available' | 'selected' | 'reserved' | 'past' | 'disabled';

interface TimeSlotButtonProps {
  time: string;
  court: Court;
  status: SlotStatus;
  userRoleId?: string;
  onClick?: () => void;
  disabled?: boolean;
  showPrice?: boolean;
  showTimeRange?: boolean;
  compact?: boolean;
  className?: string;
}

// Calculate end time from start time
const calculateEndTime = (startTime: string, intervalMinutes: number): string => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + intervalMinutes;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
};

// Format price
const formatPrice = (amount: number, symbol: string = '₺'): string => {
  return `${amount.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ${symbol}`;
};

export function TimeSlotButton({
  time,
  court,
  status,
  userRoleId = 'member',
  onClick,
  disabled = false,
  showPrice = true,
  showTimeRange = true,
  compact = false,
  className,
}: TimeSlotButtonProps) {
  const interval = court.timeSlotInterval || 60;
  const endTime = calculateEndTime(time, interval);
  const hour = parseInt(time.split(':')[0], 10);

  // Get discount for this hour
  const discount = useMemo(() => {
    return getAppliedDiscountForHour(court, hour);
  }, [court, hour]);

  // Calculate price
  const priceInfo = useMemo(() => {
    return calculateCourtPrice(court, time, userRoleId, interval);
  }, [court, time, userRoleId, interval]);

  const hasDiscount = discount && discount.percentage > 0;
  const isClickable = status === 'available' || status === 'selected';
  const isDisabled = disabled || status === 'reserved' || status === 'past' || status === 'disabled';

  // Status-based styles
  const statusStyles = {
    available: hasDiscount
      ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 hover:border-green-400 hover:shadow-md text-green-800'
      : 'bg-white border-gray-200 hover:border-primary/50 hover:shadow-md text-gray-700 hover:text-primary',
    selected: 'bg-gradient-to-br from-primary to-primary/90 border-primary text-white shadow-lg ring-2 ring-primary/30',
    reserved: 'bg-red-50 border-red-200 text-red-400 cursor-not-allowed',
    past: 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-60',
    disabled: 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed',
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={isClickable ? onClick : undefined}
        disabled={isDisabled}
        className={cn(
          'relative flex flex-col items-center justify-center rounded-lg border-2 transition-all duration-200',
          'min-h-[52px] p-1.5',
          statusStyles[status],
          isClickable && 'cursor-pointer active:scale-95',
          className
        )}
      >
        {/* Discount badge */}
        {hasDiscount && status !== 'selected' && (
          <div className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-5 h-5 rounded-full bg-green-500 text-white text-[9px] font-bold shadow-sm">
            <Percent className="w-2.5 h-2.5" />
          </div>
        )}

        {/* Time display */}
        <span className={cn(
          'font-semibold text-xs',
          status === 'selected' && 'text-white'
        )}>
          {time}
        </span>

        {/* Price */}
        {showPrice && priceInfo && (
          <span className={cn(
            'text-[10px] mt-0.5',
            status === 'selected' ? 'text-white/90' : hasDiscount ? 'text-green-600 font-medium' : 'text-gray-500'
          )}>
            {formatPrice(priceInfo.discountedPrice)}
          </span>
        )}

        {/* Reserved icon */}
        {status === 'reserved' && (
          <Lock className="absolute top-1 right-1 w-3 h-3 text-red-400" />
        )}

        {/* Selected check */}
        {status === 'selected' && (
          <Check className="absolute top-1 right-1 w-3 h-3 text-white" />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={isClickable ? onClick : undefined}
      disabled={isDisabled}
      className={cn(
        'relative flex flex-col items-center justify-center rounded-xl border-2 transition-all duration-200',
        'min-h-[72px] p-2',
        statusStyles[status],
        isClickable && 'cursor-pointer active:scale-[0.98]',
        className
      )}
    >
      {/* Discount badge */}
      {hasDiscount && status !== 'selected' && (
        <div className="absolute -top-2 -right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white text-[10px] font-bold shadow-md">
          <Percent className="w-3 h-3" />
          <span>{discount.percentage}</span>
        </div>
      )}

      {/* Time range display */}
      {showTimeRange ? (
        <div className="flex flex-col items-center">
          <span className={cn(
            'font-bold text-sm',
            status === 'selected' && 'text-white'
          )}>
            {time}
          </span>
          <span className={cn(
            'text-[10px] opacity-70',
            status === 'selected' ? 'text-white/80' : 'text-gray-500'
          )}>
            ↓
          </span>
          <span className={cn(
            'font-medium text-xs',
            status === 'selected' ? 'text-white/90' : 'text-gray-600'
          )}>
            {endTime}
          </span>
        </div>
      ) : (
        <span className={cn(
          'font-bold text-sm',
          status === 'selected' && 'text-white'
        )}>
          {time}
        </span>
      )}

      {/* Price display */}
      {showPrice && priceInfo && (
        <div className={cn(
          'mt-1 flex items-center gap-1',
          status === 'selected' ? 'text-white/90' : hasDiscount ? 'text-green-600' : 'text-gray-500'
        )}>
          {hasDiscount && priceInfo.originalPrice !== priceInfo.discountedPrice && (
            <span className="text-[9px] line-through opacity-60">
              {formatPrice(priceInfo.originalPrice)}
            </span>
          )}
          <span className={cn(
            'text-xs font-semibold',
            hasDiscount && 'text-green-600'
          )}>
            {formatPrice(priceInfo.discountedPrice)}
          </span>
        </div>
      )}

      {/* Reserved overlay */}
      {status === 'reserved' && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50/50 rounded-xl">
          <Lock className="w-4 h-4 text-red-400" />
        </div>
      )}

      {/* Selected indicator */}
      {status === 'selected' && (
        <div className="absolute top-1 right-1">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}
    </button>
  );
}

// Grid component for time slots
interface TimeSlotGridProps {
  slots: string[];
  court: Court;
  selectedSlots: string[];
  reservedSlots?: string[];
  pastSlots?: string[];
  userRoleId?: string;
  onSlotClick: (slot: string) => void;
  columns?: number;
  showPrice?: boolean;
  showTimeRange?: boolean;
  compact?: boolean;
  className?: string;
}

export function TimeSlotGrid({
  slots,
  court,
  selectedSlots,
  reservedSlots = [],
  pastSlots = [],
  userRoleId = 'member',
  onSlotClick,
  columns = 4,
  showPrice = true,
  showTimeRange = true,
  compact = false,
  className,
}: TimeSlotGridProps) {
  const getSlotStatus = (slot: string): SlotStatus => {
    if (selectedSlots.includes(slot)) return 'selected';
    if (reservedSlots.includes(slot)) return 'reserved';
    if (pastSlots.includes(slot)) return 'past';
    return 'available';
  };

  // Check if slot can be selected (consecutive logic)
  const canSelectSlot = (slot: string): boolean => {
    const status = getSlotStatus(slot);
    if (status === 'reserved' || status === 'past') return false;
    if (status === 'selected') return true;
    if (selectedSlots.length === 0) return true;

    const slotIndex = slots.indexOf(slot);
    const firstSelectedIndex = slots.indexOf(selectedSlots[0]);
    const lastSelectedIndex = slots.indexOf(selectedSlots[selectedSlots.length - 1]);

    // Can only select adjacent slots
    return slotIndex === firstSelectedIndex - 1 || slotIndex === lastSelectedIndex + 1;
  };

  return (
    <div
      className={cn(
        'grid gap-2',
        className
      )}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {slots.map((slot) => {
        const status = getSlotStatus(slot);
        const canSelect = canSelectSlot(slot);

        return (
          <TimeSlotButton
            key={slot}
            time={slot}
            court={court}
            status={status}
            userRoleId={userRoleId}
            onClick={() => onSlotClick(slot)}
            disabled={!canSelect}
            showPrice={showPrice}
            showTimeRange={showTimeRange}
            compact={compact}
          />
        );
      })}
    </div>
  );
}
