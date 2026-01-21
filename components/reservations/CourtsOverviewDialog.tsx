'use client';

import { useMemo } from 'react';
import { Court, Reservation } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  Clock,
  User,
  GraduationCap,
  Flame,
  Lightbulb,
  Percent,
} from 'lucide-react';
import { format, addDays, subDays, isToday } from 'date-fns';
import { tr } from 'date-fns/locale';

interface CourtsOverviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courts: Court[];
  reservations: Reservation[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onSlotClick?: (courtId: string, time: string) => void;
}

// Generate time slots for a specific court (using its own interval)
const generateCourtTimeSlots = (court: Court): string[] => {
  const interval = court.timeSlotInterval || 60;
  const slots: string[] = [];

  const [fromH, fromM] = (court.availableFrom || '08:00').split(':').map(Number);
  const [toH, toM] = (court.availableUntil || '22:00').split(':').map(Number);

  const startMinutes = fromH * 60 + (fromM || 0);
  const endMinutes = toH * 60 + (toM || 0);

  for (let minutes = startMinutes; minutes < endMinutes; minutes += interval) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }

  return slots;
};

// Calculate end time from start time and interval
const calculateEndTime = (startTime: string, intervalMinutes: number): string => {
  const [h, m] = startTime.split(':').map(Number);
  const totalMinutes = h * 60 + m + intervalMinutes;
  const endH = Math.floor(totalMinutes / 60);
  const endM = totalMinutes % 60;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
};

// Check if slot has discount
const hasDiscount = (court: Court, time: string): { hasDiscount: boolean; percentage?: number } => {
  if (!court.discounts || court.discounts.length === 0) {
    return { hasDiscount: false };
  }
  const hour = parseInt(time.split(':')[0], 10);
  const discount = court.discounts.find(d => hour >= d.fromHour && hour < d.toHour);
  if (discount) {
    return { hasDiscount: true, percentage: discount.percentage };
  }
  return { hasDiscount: false };
};

// Check if a slot is available for a court
const isSlotInCourtRange = (court: Court, time: string): boolean => {
  const [h, m] = time.split(':').map(Number);
  const slotMinutes = h * 60 + m;

  const [fromH, fromM] = (court.availableFrom || '08:00').split(':').map(Number);
  const [toH, toM] = (court.availableUntil || '22:00').split(':').map(Number);

  const start = fromH * 60 + (fromM || 0);
  const end = toH * 60 + (toM || 0);

  return slotMinutes >= start && slotMinutes < end;
};

// Get reservation for a slot (reservations are already filtered by date)
const getReservation = (
  courtId: string,
  _date: string,
  time: string,
  reservations: Reservation[]
): Reservation | undefined => {
  return reservations.find(
    r => r.courtId === courtId && r.time === time && r.status !== 'cancelled'
  );
};

// Check if time has passed
const isSlotPast = (date: Date, time: string): boolean => {
  if (!isToday(date)) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  }

  const now = new Date();
  const [h, m] = time.split(':').map(Number);
  const slotTime = new Date(date);
  slotTime.setHours(h, m, 0, 0);
  return slotTime < now;
};

// Get slot color based on status
const getSlotStyle = (
  reservation: Reservation | undefined,
  isPast: boolean,
  isInRange: boolean
): { bg: string; text: string; border: string } => {
  if (!isInRange) {
    return { bg: 'bg-gray-50', text: 'text-gray-300', border: 'border-gray-100' };
  }
  if (isPast) {
    return { bg: 'bg-gray-100', text: 'text-gray-400', border: 'border-gray-200' };
  }
  if (reservation) {
    if (reservation.isLesson || reservation.isTraining) {
      return { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' };
    }
    if (reservation.isChallenge) {
      return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' };
    }
    return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' };
  }
  return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' };
};

export function CourtsOverviewDialog({
  open,
  onOpenChange,
  courts,
  reservations,
  selectedDate,
  onDateChange,
  onSlotClick,
}: CourtsOverviewDialogProps) {
  // Format date in both formats for comparison
  const dateStrISO = format(selectedDate, 'yyyy-MM-dd');
  const dateStrDot = format(selectedDate, 'dd.MM.yyyy');

  // Filter reservations for selected date (check both formats)
  const dayReservations = useMemo(() => {
    return reservations.filter(r => r.date === dateStrISO || r.date === dateStrDot);
  }, [reservations, dateStrISO, dateStrDot]);

  const handlePrevDay = () => onDateChange(subDays(selectedDate, 1));
  const handleNextDay = () => onDateChange(addDays(selectedDate, 1));

  const todayCheck = isToday(selectedDate);
  const pastDate = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const check = new Date(selectedDate);
    check.setHours(0, 0, 0, 0);
    return check < today;
  }, [selectedDate]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="!max-w-none !w-screen !h-screen !rounded-none overflow-hidden flex flex-col !p-0 !m-0 !top-0 !left-0 !translate-x-0 !translate-y-0 !gap-0"
        showCloseButton={false}
      >
        <DialogHeader className="flex-shrink-0 px-6 py-4 border-b bg-white">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Grid3X3 className="h-6 w-6" />
              Kort Görünümü
            </DialogTitle>

            {/* Date Navigation - Centered */}
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={handlePrevDay}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-center min-w-[200px]">
                <p className="font-semibold text-lg">
                  {format(selectedDate, 'dd MMMM yyyy', { locale: tr })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(selectedDate, 'EEEE', { locale: tr })}
                </p>
              </div>
              <Button variant="outline" size="icon" onClick={handleNextDay}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Close Button */}
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="gap-2"
            >
              Kapat
            </Button>
          </div>
        </DialogHeader>

        {/* Court Grid - Each court has its own column with time slots */}
        <div className="flex-1 overflow-auto p-4 bg-gray-50">
          <div className="flex gap-4">
            {courts.map(court => {
              const courtSlots = generateCourtTimeSlots(court);
              const courtInterval = court.timeSlotInterval || 60;

              return (
                <div
                  key={court.id}
                  className="flex-shrink-0 w-[200px] bg-white rounded-xl shadow-sm border overflow-hidden"
                >
                  {/* Court Header */}
                  <div className="sticky top-0 bg-white z-10 p-3 border-b">
                    <h3 className="font-semibold text-center">{court.name}</h3>
                    <p className="text-xs text-center text-muted-foreground mt-1">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {court.availableFrom || '08:00'} - {court.availableUntil || '22:00'}
                    </p>
                    <p className="text-xs text-center text-muted-foreground">
                      {courtInterval} dk aralık
                    </p>
                  </div>

                  {/* Time Slots */}
                  <div className="p-2 space-y-1.5">
                    {courtSlots.map(time => {
                      const slotEndTime = calculateEndTime(time, courtInterval);
                      const reservation = getReservation(court.id, '', time, dayReservations);
                      const isPast = isSlotPast(selectedDate, time);
                      const discountInfo = hasDiscount(court, time);

                      // Get style
                      let style = getSlotStyle(reservation, isPast, true);
                      if (!reservation && !isPast && discountInfo.hasDiscount) {
                        style = { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
                      }

                      return (
                        <button
                          key={time}
                          onClick={() => {
                            if (!isPast && !reservation && onSlotClick) {
                              onSlotClick(court.id, time);
                            }
                          }}
                          disabled={isPast || !!reservation}
                          className={cn(
                            "relative w-full p-2.5 rounded-lg text-xs transition-all border",
                            style.bg,
                            style.text,
                            style.border,
                            !isPast && !reservation && "hover:scale-[1.02] cursor-pointer hover:shadow-md",
                            (isPast || reservation) && "cursor-default"
                          )}
                          title={
                            reservation
                              ? `${reservation.username || 'Rezerve'} - ${time} → ${reservation.endTime || slotEndTime}`
                              : isPast
                              ? 'Geçmiş'
                              : discountInfo.hasDiscount
                              ? `Müsait - %${discountInfo.percentage} indirimli`
                              : 'Müsait'
                          }
                        >
                          {/* Discount badge */}
                          {!reservation && !isPast && discountInfo.hasDiscount && (
                            <div className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-medium flex items-center">
                              <Percent className="h-2.5 w-2.5 mr-0.5" />
                              {discountInfo.percentage}
                            </div>
                          )}

                          {/* Time Range - Always visible */}
                          <div className="font-semibold text-sm mb-1">
                            {time} <span className="opacity-60">→</span> {slotEndTime}
                          </div>

                          {reservation ? (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                {reservation.isLesson || reservation.isTraining ? (
                                  <GraduationCap className="h-3 w-3" />
                                ) : (
                                  <User className="h-3 w-3" />
                                )}
                                <span className="truncate max-w-[100px]">
                                  {reservation.username?.split(' ')[0] || 'Dolu'}
                                </span>
                              </div>
                              <div className="flex items-center gap-0.5">
                                {reservation.heater && <Flame className="h-3 w-3 text-orange-500" />}
                                {reservation.light && <Lightbulb className="h-3 w-3 text-yellow-500" />}
                              </div>
                            </div>
                          ) : (
                            <div className="text-[11px] opacity-70">
                              {isPast ? 'Geçmiş' : 'Müsait'}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex-shrink-0 border-t pt-3 px-2">
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-green-100 border border-green-200" />
              <span>Müsait</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-emerald-50 border border-emerald-200" />
              <span>İndirimli</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-red-100 border border-red-200" />
              <span>Dolu</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-purple-100 border border-purple-200" />
              <span>Ders</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-orange-100 border border-orange-200" />
              <span>Maç</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-gray-100 border border-gray-200" />
              <span>Geçmiş</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
