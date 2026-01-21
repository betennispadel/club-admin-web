'use client';

import { useState, useMemo } from 'react';
import { Court, User, Wallet } from '@/lib/types';
import { useClubStore } from '@/stores/clubStore';
import { collection, getDocs, query, where, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { createBatch, getClubSubDoc } from '@/lib/firebase/firestore';
import { toast } from 'sonner';
import { format, addDays, eachDayOfInterval, getDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Loader2,
  CalendarIcon,
  MapPin,
  User as UserIcon,
  Flame,
  Lightbulb,
  Search,
  Check,
  CreditCard,
  Repeat,
} from 'lucide-react';

interface BulkReservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courts: Court[];
  users: User[];
}

const WEEK_DAYS = [
  { value: '1', label: 'Pazartesi' },
  { value: '2', label: 'Salı' },
  { value: '3', label: 'Çarşamba' },
  { value: '4', label: 'Perşembe' },
  { value: '5', label: 'Cuma' },
  { value: '6', label: 'Cumartesi' },
  { value: '0', label: 'Pazar' },
];

// Helper functions
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

const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
};

const minutesToTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const areSlotsConsecutive = (slots: string[], interval: number): boolean => {
  if (slots.length <= 1) return true;
  const sortedSlots = [...slots].sort();
  for (let i = 1; i < sortedSlots.length; i++) {
    const prevMins = timeToMinutes(sortedSlots[i - 1]);
    const currMins = timeToMinutes(sortedSlots[i]);
    if (currMins - prevMins !== interval) return false;
  }
  return true;
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
};

export function BulkReservationDialog({
  open,
  onOpenChange,
  courts,
  users,
}: BulkReservationDialogProps) {
  const { selectedClub } = useClubStore();

  const [loading, setLoading] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(addDays(new Date(), 30));
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [courtId, setCourtId] = useState<string>('');
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [heater, setHeater] = useState(false);
  const [light, setLight] = useState(false);
  const [allowNegativeBalance, setAllowNegativeBalance] = useState(false);

  const selectedCourt = courts.find(c => c.id === courtId);
  const selectedUser = users.find(u => u.id === selectedUserId);

  // Filter users
  const filteredUsers = useMemo(() => {
    if (!userSearch) return [];
    const search = userSearch.toLowerCase();
    return users.filter(u =>
      u.name?.toLowerCase().includes(search) ||
      u.email?.toLowerCase().includes(search)
    ).slice(0, 10);
  }, [users, userSearch]);

  // Get time slots for selected court
  const timeSlots = useMemo(() => {
    if (!selectedCourt) return [];
    return generateTimeSlots(selectedCourt);
  }, [selectedCourt]);

  // Calculate dates that will have reservations
  const reservationDates = useMemo(() => {
    if (selectedDays.length === 0 || !startDate || !endDate) return [];

    const allDays = eachDayOfInterval({ start: startDate, end: endDate });
    return allDays.filter(day => {
      const dayOfWeek = getDay(day).toString();
      return selectedDays.includes(dayOfWeek);
    });
  }, [startDate, endDate, selectedDays]);

  // Calculate price per session
  const pricePerSession = useMemo(() => {
    if (!selectedCourt || selectedSlots.length === 0) return 0;

    const interval = selectedCourt.timeSlotInterval || 60;
    let totalBasePrice = 0;

    selectedSlots.forEach(slot => {
      if (selectedCourt.priceSchedules) {
        const schedule = selectedCourt.priceSchedules.find(
          s => slot >= s.from && slot < s.until
        );
        if (schedule) {
          totalBasePrice += (schedule.basePrice / 60) * interval;
        }
      } else if (selectedCourt.hourlyRate) {
        totalBasePrice += (selectedCourt.hourlyRate / 60) * interval;
      }
    });

    const heaterCost = heater && selectedCourt.heatingCost
      ? (selectedCourt.heatingCost / 60) * interval * selectedSlots.length
      : 0;
    const lightCost = light && selectedCourt.lightingCost
      ? (selectedCourt.lightingCost / 60) * interval * selectedSlots.length
      : 0;

    return totalBasePrice + heaterCost + lightCost;
  }, [selectedCourt, selectedSlots, heater, light]);

  // Total price
  const totalPrice = pricePerSession * reservationDates.length;

  // Handle day toggle
  const toggleDay = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  // Handle slot selection
  const handleSlotClick = (slot: string) => {
    const interval = selectedCourt?.timeSlotInterval || 60;

    if (selectedSlots.includes(slot)) {
      setSelectedSlots(prev => prev.filter(s => s !== slot));
    } else {
      const newSlots = [...selectedSlots, slot].sort();
      if (areSlotsConsecutive(newSlots, interval)) {
        setSelectedSlots(newSlots);
      } else {
        setSelectedSlots([slot]);
      }
    }
  };

  // Calculate end time
  const endTime = useMemo(() => {
    if (selectedSlots.length === 0 || !selectedCourt) return '';
    const sortedSlots = [...selectedSlots].sort();
    const lastSlot = sortedSlots[sortedSlots.length - 1];
    const interval = selectedCourt.timeSlotInterval || 60;
    return minutesToTime(timeToMinutes(lastSlot) + interval);
  }, [selectedSlots, selectedCourt]);

  // Reset form
  const resetForm = () => {
    setGroupName('');
    setStartDate(new Date());
    setEndDate(addDays(new Date(), 30));
    setSelectedDays([]);
    setCourtId('');
    setSelectedSlots([]);
    setUserSearch('');
    setSelectedUserId('');
    setHeater(false);
    setLight(false);
    setAllowNegativeBalance(false);
  };

  // Handle submit - Uses writeBatch for atomic operations (same as mobile app)
  const handleSubmit = async () => {
    if (!selectedClub || !groupName || !courtId || selectedSlots.length === 0 || selectedDays.length === 0) {
      toast.error('Lütfen tüm alanları doldurun');
      return;
    }

    if (reservationDates.length === 0) {
      toast.error('Seçilen tarih aralığında uygun gün bulunamadı');
      return;
    }

    setLoading(true);
    try {
      const sortedSlots = [...selectedSlots].sort();
      const startTime = sortedSlots[0];
      const totalDuration = sortedSlots.length * (selectedCourt?.timeSlotInterval || 60);
      const amountPerReservation = pricePerSession;
      const totalAmount = totalPrice;

      // Fetch wallet if user is selected
      let walletData: Wallet | null = null;
      let walletDocId: string | null = null;

      if (selectedUserId) {
        const walletsRef = collection(db, selectedClub.id, 'wallets', 'wallets');
        const walletQuery = query(walletsRef, where('userId', '==', selectedUserId));
        const walletSnapshot = await getDocs(walletQuery);

        if (!walletSnapshot.empty) {
          const walletDoc = walletSnapshot.docs[0];
          walletData = { id: walletDoc.id, ...walletDoc.data() } as Wallet;
          walletDocId = walletDoc.id;
        }
      }

      // Calculate negative balance usage (same as mobile app)
      let negativeBalanceUsedPerReservation = 0;
      if (allowNegativeBalance && walletData && (walletData.balance || 0) < totalAmount) {
        const totalNegativeUsed = totalAmount - (walletData.balance || 0);
        negativeBalanceUsedPerReservation = totalNegativeUsed / reservationDates.length;
      }

      // Create batch for atomic operations (birebir mobil ile aynı)
      const batch = createBatch();
      const reservationsRef = collection(db, selectedClub.id, 'reservations', 'reservations');

      // Create reservations for each date
      for (const dateObj of reservationDates) {
        const dateStr = format(dateObj, 'dd.MM.yyyy');
        const reservationRef = doc(reservationsRef);

        batch.set(reservationRef, {
          courtId,
          date: dateStr,
          time: startTime,
          endTime,
          slots: sortedSlots,
          duration: totalDuration,
          userId: selectedUserId || '',
          username: selectedUser?.name || '',
          totalCost: amountPerReservation,
          amountPaid: amountPerReservation,
          heater: heater || false,
          light: light || false,
          allowNegativeBalance: allowNegativeBalance || false,
          negativeBalanceUsed: negativeBalanceUsedPerReservation,
          createdAt: Timestamp.now(),
          status: 'active',
          bulkGroupName: groupName,
        });
      }

      // Update wallet and create activity log if user is selected
      if (walletData && walletDocId && totalAmount > 0) {
        const walletDocRef = doc(db, selectedClub.id, 'wallets', 'wallets', walletDocId);
        const newBalance = (walletData.balance || 0) - totalAmount;
        batch.update(walletDocRef, {
          balance: newBalance,
        });

        // Create activity log (birebir mobil ile aynı yapı)
        const activityId = `${Date.now()}_admin_bulk`;
        const activityRef = getClubSubDoc(
          selectedClub.id,
          'wallets',
          walletDocId,
          'activities',
          activityId
        );
        batch.set(activityRef, {
          service: 'walletScreen.activityLog.bulkReservationCreated', // Translation key (same as mobile)
          amount: -totalAmount, // Negative amount (total deduction)
          date: Timestamp.now(),
          status: 'completed',
          createdBy: 'admin', // Admin tarafından oluşturuldu
          courtName: selectedCourt?.name || '',
          bulkGroupName: groupName,
          reservationCount: reservationDates.length,
          startDate: format(startDate, 'dd.MM.yyyy'),
          endDate: format(endDate, 'dd.MM.yyyy'),
          reservationTime: startTime,
          reservationEndTime: endTime,
          duration: totalDuration,
          amountPerSession: amountPerReservation,
        });
      }

      // Commit all operations atomically
      await batch.commit();

      toast.success(`${reservationDates.length} rezervasyon oluşturuldu`);
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating bulk reservations:', error);
      toast.error('Rezervasyonlar oluşturulurken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => {
      if (!value) resetForm();
      onOpenChange(value);
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5" />
            Toplu Rezervasyon
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-150px)] pr-4">
          <div className="space-y-6 py-4">
            {/* Group Name */}
            <div className="space-y-2">
              <Label>Grup Adı</Label>
              <Input
                placeholder="Örn: Özel Ders - Ahmet Bey"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Başlangıç Tarihi</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {format(startDate, 'dd MMM yyyy', { locale: tr })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(d) => d && setStartDate(d)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Bitiş Tarihi</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {format(endDate, 'dd MMM yyyy', { locale: tr })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(d) => d && setEndDate(d)}
                      disabled={(date) => date < startDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Day Selection */}
            <div className="space-y-2">
              <Label>Günler</Label>
              <div className="flex flex-wrap gap-2">
                {WEEK_DAYS.map(day => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={cn(
                      "px-3 py-2 text-sm rounded-md transition-all",
                      selectedDays.includes(day.value)
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary hover:bg-secondary/80"
                    )}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
              {reservationDates.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {reservationDates.length} gün seçildi
                </p>
              )}
            </div>

            {/* Court Selection */}
            <div className="space-y-2">
              <Label>Kort</Label>
              <Select value={courtId} onValueChange={(value) => {
                setCourtId(value);
                setSelectedSlots([]);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Kort seçin" />
                </SelectTrigger>
                <SelectContent>
                  {courts.map(court => (
                    <SelectItem key={court.id} value={court.id}>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {court.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Time Slot Selection */}
            {selectedCourt && (
              <div className="space-y-2">
                <Label className="flex items-center justify-between">
                  <span>Saat Seçimi</span>
                  {selectedSlots.length > 0 && (
                    <Badge variant="outline">
                      {selectedSlots.sort()[0]} - {endTime}
                    </Badge>
                  )}
                </Label>
                <div className="grid grid-cols-6 gap-2">
                  {timeSlots.map(slot => {
                    const isSelected = selectedSlots.includes(slot);
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => handleSlotClick(slot)}
                        className={cn(
                          "py-2 px-3 text-sm rounded-md transition-all",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary hover:bg-secondary/80"
                        )}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* User Selection (Optional) */}
            <div className="space-y-2">
              <Label>Kullanıcı (Opsiyonel)</Label>
              {selectedUser ? (
                <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-primary" />
                    <div>
                      <p className="font-medium">{selectedUser.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedUserId('');
                      setUserSearch('');
                    }}
                  >
                    Kaldır
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Kullanıcı ara..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  {filteredUsers.length > 0 && (
                    <div className="border rounded-lg max-h-40 overflow-y-auto">
                      {filteredUsers.map(user => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => {
                            setSelectedUserId(user.id);
                            setUserSearch('');
                          }}
                          className="w-full p-2 text-left hover:bg-secondary flex items-center gap-2"
                        >
                          <UserIcon className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Options */}
            <div className="space-y-4">
              <Label>Seçenekler</Label>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">Isıtıcı</span>
                </div>
                <Switch checked={heater} onCheckedChange={setHeater} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">Aydınlatma</span>
                </div>
                <Switch checked={light} onCheckedChange={setLight} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-red-500" />
                  <span className="text-sm">Eksi Bakiye İzni</span>
                </div>
                <Switch checked={allowNegativeBalance} onCheckedChange={setAllowNegativeBalance} />
              </div>
            </div>

            {/* Price Summary */}
            {pricePerSession > 0 && reservationDates.length > 0 && (
              <div className="bg-secondary rounded-lg p-4 space-y-2">
                <h4 className="font-medium">Fiyat Özeti</h4>
                <div className="flex justify-between text-sm">
                  <span>Seans Başı</span>
                  <span>{formatCurrency(pricePerSession)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Seans Sayısı</span>
                  <span>{reservationDates.length}</span>
                </div>
                <div className="flex justify-between font-semibold pt-2 border-t">
                  <span>Toplam</span>
                  <span>{formatCurrency(totalPrice)}</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !groupName || !courtId || selectedSlots.length === 0 || selectedDays.length === 0}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            {reservationDates.length} Rezervasyon Oluştur
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
