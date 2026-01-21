'use client';

import { useMemo } from 'react';
import { Court, Reservation } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Clock, MapPin, Flame, Lightbulb, Percent } from 'lucide-react';

interface CourtsOverviewProps {
  courts: Court[];
  reservations: Reservation[];
  selectedDate: Date;
  onSlotClick?: (courtId: string, time: string) => void;
}

// Generate time slots for a court
const generateTimeSlots = (court: Court): string[] => {
  const interval = court.timeSlotInterval || 60;
  const slots: string[] = [];

  const fromTime = court.availableFrom || '08:00';
  const untilTime = court.availableUntil || '22:00';

  const [fromHour, fromMinute] = fromTime.split(':').map(Number);
  const [untilHour, untilMinute] = untilTime.split(':').map(Number);

  const startMinutes = fromHour * 60 + (fromMinute || 0);
  const endMinutes = untilHour * 60 + (untilMinute || 0);

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

// Check if a slot is reserved
const isSlotReserved = (courtId: string, time: string, reservations: Reservation[]): Reservation | undefined => {
  return reservations.find(r =>
    r.courtId === courtId &&
    r.time === time &&
    r.status !== 'cancelled'
  );
};

// Check if current time has passed
const isSlotPast = (time: string): boolean => {
  const now = new Date();
  const [hour, minute] = time.split(':').map(Number);
  const slotTime = new Date();
  slotTime.setHours(hour, minute, 0, 0);
  return slotTime.getTime() < now.getTime();
};

export function CourtsOverview({ courts, reservations, selectedDate, onSlotClick }: CourtsOverviewProps) {
  // Get all unique time slots across all courts
  const allTimeSlots = useMemo(() => {
    const slotsSet = new Set<string>();
    courts.forEach(court => {
      generateTimeSlots(court).forEach(slot => slotsSet.add(slot));
    });
    return Array.from(slotsSet).sort();
  }, [courts]);

  // Check if selected date is today
  const isToday = useMemo(() => {
    const today = new Date();
    return (
      selectedDate.getDate() === today.getDate() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear()
    );
  }, [selectedDate]);

  // Check if selected date is in the past
  const isPastDate = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    return selected < today;
  }, [selectedDate]);

  if (courts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Kort Durumu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Henüz kort bulunmuyor
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Kort Durumu
          </div>
          <Badge variant="outline">{courts.length} kort</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <div className="space-y-4">
            {courts.map(court => {
              const courtSlots = generateTimeSlots(court);
              const courtReservations = reservations.filter(r => r.courtId === court.id);

              return (
                <div key={court.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">{court.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {court.availableFrom || '08:00'} - {court.availableUntil || '22:00'}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    {courtSlots.map(slot => {
                      const interval = court.timeSlotInterval || 60;
                      const endTime = calculateEndTime(slot, interval);
                      const reservation = isSlotReserved(court.id, slot, reservations);
                      const isPast = isToday ? isSlotPast(slot) : isPastDate;
                      const isReserved = !!reservation;
                      const isCancelled = reservation?.status === 'cancelled';
                      const discountInfo = hasDiscount(court, slot);

                      return (
                        <button
                          key={slot}
                          onClick={() => !isReserved && !isPast && onSlotClick?.(court.id, slot)}
                          disabled={isReserved || isPast}
                          className={cn(
                            "relative text-xs py-2.5 px-2 rounded-lg transition-all border",
                            "hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary/50",
                            isPast && "bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200",
                            isReserved && !isCancelled && "bg-red-50 text-red-700 cursor-not-allowed border-red-200",
                            isCancelled && "bg-orange-50 text-orange-700 line-through cursor-not-allowed border-orange-200",
                            !isReserved && !isPast && !discountInfo.hasDiscount && "bg-green-50 text-green-700 hover:bg-green-100 cursor-pointer border-green-200",
                            !isReserved && !isPast && discountInfo.hasDiscount && "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer border-emerald-300"
                          )}
                          title={
                            reservation
                              ? `${reservation.username} - ${slot} → ${reservation.endTime || endTime}`
                              : isPast
                              ? 'Geçmiş saat'
                              : discountInfo.hasDiscount
                              ? `Müsait - %${discountInfo.percentage} indirimli`
                              : 'Müsait'
                          }
                        >
                          {/* Discount badge */}
                          {!isReserved && !isPast && discountInfo.hasDiscount && (
                            <div className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white text-[9px] px-1 py-0.5 rounded-full font-medium flex items-center">
                              <Percent className="h-2 w-2 mr-0.5" />
                              {discountInfo.percentage}
                            </div>
                          )}

                          {/* Time Range Display */}
                          <div className="font-medium">
                            {slot} <span className="text-[10px] opacity-70">→</span> {endTime}
                          </div>

                          {/* Reservation Info */}
                          {isReserved && reservation && (
                            <div className="mt-1 flex items-center justify-center gap-1 text-[10px] opacity-80">
                              <span className="truncate max-w-[60px]">{reservation.username?.split(' ')[0]}</span>
                              {reservation.heater && <Flame className="h-2.5 w-2.5 text-orange-500" />}
                              {reservation.light && <Lightbulb className="h-2.5 w-2.5 text-yellow-500" />}
                            </div>
                          )}

                          {/* Status text for available/past */}
                          {!isReserved && (
                            <div className="mt-0.5 text-[10px] opacity-70">
                              {isPast ? 'Geçmiş' : 'Müsait'}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Court stats */}
                  <div className="flex gap-2 mt-3 pt-3 border-t">
                    <Badge variant="secondary" className="text-xs">
                      {courtReservations.filter(r => r.status !== 'cancelled').length} rezervasyon
                    </Badge>
                    <Badge variant="outline" className="text-xs text-green-600">
                      {courtSlots.length - courtReservations.filter(r => r.status !== 'cancelled').length} müsait
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-green-50 border border-green-200" />
              <span>Müsait</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-emerald-50 border border-emerald-300" />
              <span>İndirimli</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-red-50 border border-red-200" />
              <span>Dolu</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-gray-50 border border-gray-200" />
              <span>Geçmiş</span>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
