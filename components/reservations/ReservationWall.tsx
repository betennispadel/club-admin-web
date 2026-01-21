'use client';

import { useMemo } from 'react';
import { Court, Reservation } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Clock,
  User,
  GraduationCap,
  Trophy,
  Gift,
  Flame,
  Lightbulb,
  LayoutGrid,
} from 'lucide-react';
import { format, isToday } from 'date-fns';
import { tr } from 'date-fns/locale';

interface ReservationWallProps {
  courts: Court[];
  reservations: Reservation[];
  selectedDate: Date;
  onReservationClick?: (reservation: Reservation) => void;
}

// Generate time slots
const generateTimeSlots = (courts: Court[]): string[] => {
  let minStart = 24 * 60;
  let maxEnd = 0;
  const minInterval = 60;

  courts.forEach(court => {
    const [fromH, fromM] = (court.availableFrom || '08:00').split(':').map(Number);
    const [toH, toM] = (court.availableUntil || '22:00').split(':').map(Number);
    const start = fromH * 60 + (fromM || 0);
    const end = toH * 60 + (toM || 0);
    if (start < minStart) minStart = start;
    if (end > maxEnd) maxEnd = end;
  });

  const slots: string[] = [];
  for (let minutes = minStart; minutes < maxEnd; minutes += minInterval) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
  return slots;
};

// Get reservation for a slot
const getReservation = (
  courtId: string,
  date: string,
  time: string,
  reservations: Reservation[]
): Reservation | undefined => {
  return reservations.find(
    r => r.courtId === courtId && r.date === date && r.time === time && r.status !== 'cancelled'
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

// Get reservation icon
const getReservationIcon = (reservation: Reservation) => {
  if (reservation.isLesson || reservation.isTraining) {
    return <GraduationCap className="h-3 w-3" />;
  }
  if (reservation.isChallenge) {
    return <Trophy className="h-3 w-3" />;
  }
  if (reservation.isGift) {
    return <Gift className="h-3 w-3" />;
  }
  return <User className="h-3 w-3" />;
};

// Get reservation color
const getReservationColor = (reservation: Reservation): string => {
  if (reservation.isLesson || reservation.isTraining) {
    return 'bg-purple-500';
  }
  if (reservation.isChallenge) {
    return 'bg-orange-500';
  }
  if (reservation.isGift) {
    return 'bg-green-500';
  }
  return 'bg-blue-500';
};

// Pixel height per minute
const MINUTE_HEIGHT = 1.5;
const HOUR_HEIGHT = MINUTE_HEIGHT * 60;

export function ReservationWall({
  courts,
  reservations,
  selectedDate,
  onReservationClick,
}: ReservationWallProps) {
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const timeSlots = useMemo(() => generateTimeSlots(courts), [courts]);

  // Calculate position and height for a reservation
  const getReservationStyle = (reservation: Reservation) => {
    const [startH, startM] = reservation.time.split(':').map(Number);
    const startMinutes = startH * 60 + startM;

    // Get the earliest start time
    const firstSlot = timeSlots[0];
    const [firstH, firstM] = firstSlot.split(':').map(Number);
    const baseMinutes = firstH * 60 + firstM;

    const top = (startMinutes - baseMinutes) * MINUTE_HEIGHT;

    // Calculate duration
    let durationMinutes = 60; // default
    if (reservation.endTime) {
      const [endH, endM] = reservation.endTime.split(':').map(Number);
      durationMinutes = (endH * 60 + endM) - startMinutes;
    } else if (reservation.duration) {
      durationMinutes = reservation.duration;
    }

    const height = durationMinutes * MINUTE_HEIGHT;

    return { top, height };
  };

  if (courts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5" />
            Rezervasyon Duvarı
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Kort bulunamadı
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalHeight = timeSlots.length * HOUR_HEIGHT;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5" />
            Rezervasyon Duvarı
          </div>
          <Badge variant="outline">
            {format(selectedDate, 'dd MMMM', { locale: tr })}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <div className="flex min-w-max">
            {/* Time Column */}
            <div className="w-16 flex-shrink-0 border-r">
              <div className="h-10" /> {/* Header spacer */}
              <div className="relative" style={{ height: totalHeight }}>
                {timeSlots.map((time, index) => (
                  <div
                    key={time}
                    className="absolute left-0 right-0 border-t border-dashed border-gray-200 text-xs text-muted-foreground px-2"
                    style={{ top: index * HOUR_HEIGHT }}
                  >
                    {time}
                  </div>
                ))}
              </div>
            </div>

            {/* Court Columns */}
            {courts.map(court => {
              const courtReservations = reservations.filter(
                r => r.courtId === court.id && r.date === dateStr && r.status !== 'cancelled'
              );

              return (
                <div key={court.id} className="w-40 flex-shrink-0 border-r">
                  {/* Court Header */}
                  <div className="h-10 px-2 flex items-center justify-center border-b bg-gray-50">
                    <span className="font-medium text-sm truncate">{court.name}</span>
                  </div>

                  {/* Timeline */}
                  <div className="relative" style={{ height: totalHeight }}>
                    {/* Hour lines */}
                    {timeSlots.map((_, index) => (
                      <div
                        key={index}
                        className="absolute left-0 right-0 border-t border-dashed border-gray-100"
                        style={{ top: index * HOUR_HEIGHT }}
                      />
                    ))}

                    {/* Reservations */}
                    {courtReservations.map(reservation => {
                      const style = getReservationStyle(reservation);
                      const isPast = isSlotPast(selectedDate, reservation.time);

                      return (
                        <button
                          key={reservation.id}
                          onClick={() => onReservationClick?.(reservation)}
                          className={cn(
                            "absolute left-1 right-1 rounded-md p-1.5 text-white text-xs overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02]",
                            getReservationColor(reservation),
                            isPast && "opacity-60"
                          )}
                          style={{
                            top: style.top,
                            height: Math.max(style.height - 2, 24),
                          }}
                        >
                          <div className="flex flex-col h-full">
                            <div className="flex items-center gap-1">
                              {getReservationIcon(reservation)}
                              <span className="truncate font-medium">
                                {reservation.username?.split(' ')[0] || 'Rezerve'}
                              </span>
                            </div>
                            {style.height > 40 && (
                              <div className="text-[10px] opacity-80 mt-auto">
                                {reservation.time}
                                {reservation.endTime && ` - ${reservation.endTime}`}
                              </div>
                            )}
                            {style.height > 50 && (
                              <div className="flex items-center gap-1 mt-0.5">
                                {reservation.heater && <Flame className="h-2.5 w-2.5" />}
                                {reservation.light && <Lightbulb className="h-2.5 w-2.5" />}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-4 pt-4 border-t text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-blue-500" />
            <span>Normal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-purple-500" />
            <span>Ders/Antrenman</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-orange-500" />
            <span>Maç</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span>Hediye</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
