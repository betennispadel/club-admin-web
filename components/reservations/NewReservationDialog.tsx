'use client';

import { useState, useMemo, useEffect } from 'react';
import { Court, User, Wallet, Role } from '@/lib/types';
import { useClubStore } from '@/stores/clubStore';
import { collection, getDocs, query, where, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { createBatch, getClubSubDoc } from '@/lib/firebase/firestore';
import { toast } from 'sonner';
import { format } from 'date-fns';
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
  Clock,
  MapPin,
  User as UserIcon,
  Flame,
  Lightbulb,
  Search,
  Check,
  CreditCard,
  Wallet as WalletIcon,
  AlertTriangle,
  TrendingDown,
  Percent,
} from 'lucide-react';
import {
  calculateTotalPrice,
  canUserAfford,
  formatCurrency,
  getAppliedDiscountForHour,
} from '@/lib/utils/priceCalculation';
import { TimeSlotGrid } from './TimeSlotButton';

interface NewReservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courts: Court[];
  users: User[];
  roles?: Role[];
  selectedDate?: Date;
}

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

export function NewReservationDialog({
  open,
  onOpenChange,
  courts,
  users,
  roles = [],
  selectedDate: initialDate,
}: NewReservationDialogProps) {
  const { selectedClub } = useClubStore();

  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<Date>(initialDate || new Date());
  const [courtId, setCourtId] = useState<string>('');
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [heater, setHeater] = useState(false);
  const [light, setLight] = useState(false);
  const [allowNegativeBalance, setAllowNegativeBalance] = useState(false);

  // Wallet state
  const [userWallet, setUserWallet] = useState<Wallet | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(false);

  const selectedCourt = courts.find(c => c.id === courtId);
  const selectedUser = users.find(u => u.id === selectedUserId);
  const selectedUserRole = roles.find(r => r.id === selectedUser?.role);

  // Fetch user wallet when user is selected
  useEffect(() => {
    const fetchUserWallet = async () => {
      if (!selectedClub || !selectedUserId) {
        setUserWallet(null);
        return;
      }

      setLoadingWallet(true);
      try {
        const walletsRef = collection(db, selectedClub.id, 'wallets', 'wallets');
        const walletQuery = query(walletsRef, where('userId', '==', selectedUserId));
        const walletSnapshot = await getDocs(walletQuery);

        if (!walletSnapshot.empty) {
          const walletDoc = walletSnapshot.docs[0];
          setUserWallet({ id: walletDoc.id, ...walletDoc.data() } as Wallet);
        } else {
          setUserWallet(null);
        }
      } catch (error) {
        console.error('Error fetching wallet:', error);
        setUserWallet(null);
      } finally {
        setLoadingWallet(false);
      }
    };

    fetchUserWallet();
  }, [selectedClub, selectedUserId]);

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

  // Calculate price using the utility function
  const priceInfo = useMemo(() => {
    if (!selectedCourt || selectedSlots.length === 0) return null;

    const userRoleId = selectedUser?.role || 'member';
    const result = calculateTotalPrice(
      selectedCourt,
      selectedSlots,
      userRoleId,
      { heater, light }
    );

    return {
      courtFee: result.breakdown.courtFee,
      heaterFee: result.breakdown.heaterFee,
      lightFee: result.breakdown.lightFee,
      discountAmount: result.breakdown.discountAmount,
      total: result.total,
    };
  }, [selectedCourt, selectedSlots, heater, light, selectedUser?.role]);

  // Check if first selected slot has a discount
  const appliedDiscount = useMemo(() => {
    if (!selectedCourt || selectedSlots.length === 0) return null;
    const firstSlot = [...selectedSlots].sort()[0];
    const hour = parseInt(firstSlot.split(':')[0], 10);
    return getAppliedDiscountForHour(selectedCourt, hour);
  }, [selectedCourt, selectedSlots]);

  // Check affordability
  const affordabilityCheck = useMemo(() => {
    if (!priceInfo || !userWallet) return null;

    return canUserAfford(
      priceInfo.total,
      userWallet.balance || 0,
      userWallet.negativeBalance || 0,
      allowNegativeBalance
    );
  }, [priceInfo, userWallet, allowNegativeBalance]);

  // Handle slot selection
  const handleSlotClick = (slot: string) => {
    const interval = selectedCourt?.timeSlotInterval || 60;

    if (selectedSlots.includes(slot)) {
      // Deselect
      setSelectedSlots(prev => prev.filter(s => s !== slot));
    } else {
      // Select
      const newSlots = [...selectedSlots, slot].sort();
      if (areSlotsConsecutive(newSlots, interval)) {
        setSelectedSlots(newSlots);
      } else {
        // Start fresh with just this slot
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
    setDate(initialDate || new Date());
    setCourtId('');
    setSelectedSlots([]);
    setUserSearch('');
    setSelectedUserId('');
    setHeater(false);
    setLight(false);
    setAllowNegativeBalance(false);
    setUserWallet(null);
  };

  // Handle submit - Uses writeBatch for atomic operations (same as mobile app)
  const handleSubmit = async () => {
    if (!selectedClub || !courtId || selectedSlots.length === 0 || !selectedUserId) {
      toast.error('Lütfen tüm alanları doldurun');
      return;
    }

    // Check affordability if wallet exists
    if (userWallet && affordabilityCheck && !affordabilityCheck.canAfford) {
      toast.error('Yetersiz bakiye. Lütfen eksi bakiye izni verin veya bakiye yükleyin.');
      return;
    }

    // Check if wallet is blocked
    if (userWallet?.isBlocked) {
      toast.error('Bu kullanıcının cüzdanı bloke edilmiş. Rezervasyon yapılamaz.');
      return;
    }

    setLoading(true);
    try {
      const dateStr = format(date, 'dd.MM.yyyy');
      const sortedSlots = [...selectedSlots].sort();
      const amountToDeduct = priceInfo?.total || 0;
      const totalDuration = sortedSlots.length * (selectedCourt?.timeSlotInterval || 60);

      // Calculate negative balance used (same as mobile app)
      let negativeBalanceUsed = 0;
      if (allowNegativeBalance && userWallet && (userWallet.balance || 0) < amountToDeduct) {
        negativeBalanceUsed = amountToDeduct - (userWallet.balance || 0);
      }

      // Create batch for atomic operations (birebir mobil ile aynı)
      const batch = createBatch();

      // 1. Create reservation document
      const reservationsRef = collection(db, selectedClub.id, 'reservations', 'reservations');
      const reservationRef = doc(reservationsRef);

      const reservationData: Record<string, unknown> = {
        courtId,
        courtName: selectedCourt?.name || '',
        date: dateStr,
        time: sortedSlots[0], // Start time of reservation
        endTime, // End time of reservation
        slots: sortedSlots, // All selected time slots
        duration: totalDuration, // Total duration in minutes
        userId: selectedUserId,
        username: selectedUser?.name || '',
        totalCost: amountToDeduct, // Total cost of reservation
        amountPaid: amountToDeduct,
        heater: heater || false,
        light: light || false,
        allowNegativeBalance: allowNegativeBalance,
        negativeBalanceUsed: negativeBalanceUsed, // Track debt amount
        createdAt: Timestamp.now(),
        status: 'active',
      };

      // Add discount info if applicable
      if (priceInfo && priceInfo.discountAmount > 0 && appliedDiscount) {
        reservationData.discountApplied = true;
        reservationData.discountPercentage = appliedDiscount.percentage;
        reservationData.originalPrice = priceInfo.courtFee + priceInfo.discountAmount;
      }

      batch.set(reservationRef, reservationData);

      // 2. Update wallet balance
      if (userWallet) {
        const walletDocRef = doc(db, selectedClub.id, 'wallets', 'wallets', userWallet.id);
        const newBalance = (userWallet.balance || 0) - amountToDeduct;
        batch.update(walletDocRef, {
          balance: newBalance,
        });

        // 3. Create activity log (birebir mobil ile aynı yapı)
        const activityId = `${Date.now()}_admin_reservation`;
        const activityRef = getClubSubDoc(
          selectedClub.id,
          'wallets',
          userWallet.id,
          'activities',
          activityId
        );
        batch.set(activityRef, {
          service: 'walletScreen.activityLog.reservationCreated', // Translation key (same as mobile)
          amount: -amountToDeduct, // Negative amount (deduction)
          date: Timestamp.now(),
          status: 'completed',
          relatedReservationId: reservationRef.id,
          createdBy: 'admin', // Admin tarafından oluşturuldu
          courtName: selectedCourt?.name || '',
          reservationDate: dateStr,
          reservationTime: sortedSlots[0],
        });
      }

      // Commit all operations atomically
      await batch.commit();

      toast.success('Rezervasyon oluşturuldu');
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating reservation:', error);
      toast.error('Rezervasyon oluşturulurken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Check if submit is allowed
  const canSubmit = useMemo(() => {
    if (!courtId || selectedSlots.length === 0 || !selectedUserId) return false;
    if (userWallet?.isBlocked) return false;
    if (userWallet && affordabilityCheck && !affordabilityCheck.canAfford) return false;
    return true;
  }, [courtId, selectedSlots, selectedUserId, userWallet, affordabilityCheck]);

  return (
    <Dialog open={open} onOpenChange={(value) => {
      if (!value) resetForm();
      onOpenChange(value);
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Yeni Rezervasyon
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-150px)] pr-4">
          <div className="space-y-6 py-4">
            {/* Date Selection */}
            <div className="space-y-2">
              <Label>Tarih</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {format(date, 'dd MMMM yyyy, EEEE', { locale: tr })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
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
                        <span className="text-muted-foreground text-xs">
                          ({court.availableFrom || '08:00'} - {court.availableUntil || '22:00'})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Time Slot Selection */}
            {selectedCourt && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Saat Seçimi
                  </Label>
                  {selectedSlots.length > 0 && (
                    <Badge variant="secondary" className="font-mono">
                      {selectedSlots.sort()[0]} → {endTime}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Birden fazla ardışık saat seçebilirsiniz. Yeşil bloklar indirimli saatleri gösterir.
                </p>
                <ScrollArea className="h-[280px] pr-2">
                  <TimeSlotGrid
                    slots={timeSlots}
                    court={selectedCourt}
                    selectedSlots={selectedSlots}
                    userRoleId={selectedUser?.role}
                    onSlotClick={handleSlotClick}
                    columns={4}
                    showPrice={true}
                    showTimeRange={true}
                    compact={false}
                  />
                </ScrollArea>
                {selectedSlots.length > 0 && (
                  <div className="flex items-center justify-between p-2 bg-primary/5 rounded-lg">
                    <span className="text-sm text-muted-foreground">
                      Seçilen süre: {selectedSlots.length * (selectedCourt?.timeSlotInterval || 60)} dakika
                    </span>
                    {appliedDiscount && (
                      <Badge variant="outline" className="text-green-600 border-green-300">
                        <Percent className="h-3 w-3 mr-1" />
                        {appliedDiscount.percentage}% indirim
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* User Selection */}
            <div className="space-y-2">
              <Label>Kullanıcı</Label>
              {selectedUser ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserIcon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{selectedUser.name}</p>
                        <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                        {selectedUserRole && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            {selectedUserRole.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedUserId('');
                        setUserSearch('');
                        setUserWallet(null);
                      }}
                    >
                      Değiştir
                    </Button>
                  </div>

                  {/* Wallet Balance Display */}
                  {loadingWallet ? (
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Cüzdan yükleniyor...</span>
                    </div>
                  ) : userWallet ? (
                    <div className="p-3 rounded-lg border space-y-2">
                      <div className="flex items-center gap-2">
                        <WalletIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Cüzdan Durumu</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className={cn(
                          "p-2 rounded-md",
                          (userWallet.balance || 0) >= 0 ? "bg-green-50 dark:bg-green-950" : "bg-red-50 dark:bg-red-950"
                        )}>
                          <p className="text-xs text-muted-foreground">Bakiye</p>
                          <p className={cn(
                            "font-semibold",
                            (userWallet.balance || 0) >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                          )}>
                            {formatCurrency(userWallet.balance || 0)}
                          </p>
                        </div>
                        <div className="p-2 rounded-md bg-orange-50 dark:bg-orange-950">
                          <p className="text-xs text-muted-foreground">Eksi Bakiye Limiti</p>
                          <p className="font-semibold text-orange-600 dark:text-orange-400">
                            {formatCurrency(userWallet.negativeBalance || 0)}
                          </p>
                        </div>
                      </div>
                      {userWallet.isBlocked && (
                        <div className="flex items-center gap-2 p-2 bg-red-100 dark:bg-red-900 rounded-md">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <span className="text-sm text-red-600 dark:text-red-400">Cüzdan bloke edilmiş</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm text-yellow-600 dark:text-yellow-400">Bu kullanıcının cüzdanı bulunamadı</span>
                    </div>
                  )}
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
                  <div>
                    <p className="text-sm font-medium">Isıtıcı</p>
                    {selectedCourt?.heatingCost && (
                      <p className="text-xs text-muted-foreground">
                        +{formatCurrency(selectedCourt.heatingCost)}/saat
                      </p>
                    )}
                  </div>
                </div>
                <Switch checked={heater} onCheckedChange={setHeater} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium">Aydınlatma</p>
                    {selectedCourt?.lightingCost && (
                      <p className="text-xs text-muted-foreground">
                        +{formatCurrency(selectedCourt.lightingCost)}/saat
                      </p>
                    )}
                  </div>
                </div>
                <Switch checked={light} onCheckedChange={setLight} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-sm font-medium">Eksi Bakiye İzni</p>
                    <p className="text-xs text-muted-foreground">
                      Bakiye yetersizse eksi bakiyeye izin ver
                    </p>
                  </div>
                </div>
                <Switch checked={allowNegativeBalance} onCheckedChange={setAllowNegativeBalance} />
              </div>
            </div>

            {/* Price Summary */}
            {priceInfo && (
              <div className="bg-secondary rounded-lg p-4 space-y-3">
                <h4 className="font-medium">Fiyat Özeti</h4>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Kort Ücreti</span>
                    <span>{formatCurrency(priceInfo.courtFee)}</span>
                  </div>

                  {priceInfo.heaterFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-1">
                        <Flame className="h-3 w-3 text-orange-500" />
                        Isıtıcı
                      </span>
                      <span>{formatCurrency(priceInfo.heaterFee)}</span>
                    </div>
                  )}

                  {priceInfo.lightFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-1">
                        <Lightbulb className="h-3 w-3 text-yellow-500" />
                        Aydınlatma
                      </span>
                      <span>{formatCurrency(priceInfo.lightFee)}</span>
                    </div>
                  )}

                  {/* Discount Info */}
                  {priceInfo.discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                      <span className="flex items-center gap-1">
                        <Percent className="h-3 w-3" />
                        İndirim {appliedDiscount && `(%${appliedDiscount.percentage})`}
                      </span>
                      <span>-{formatCurrency(priceInfo.discountAmount)}</span>
                    </div>
                  )}

                  {/* Role-based pricing note */}
                  {selectedUserRole && selectedUserRole.priceMultiplier && selectedUserRole.priceMultiplier !== 1 && (
                    <div className="text-xs text-muted-foreground">
                      * {selectedUserRole.name} üyeliği için özel fiyatlandırma uygulandı
                    </div>
                  )}
                </div>

                <div className="flex justify-between font-semibold pt-2 border-t">
                  <span>Toplam</span>
                  <span>{formatCurrency(priceInfo.total)}</span>
                </div>

                {/* Affordability Check */}
                {userWallet && affordabilityCheck && (
                  <div className={cn(
                    "mt-3 p-3 rounded-md",
                    affordabilityCheck.canAfford
                      ? "bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800"
                      : "bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800"
                  )}>
                    {affordabilityCheck.canAfford ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-600 dark:text-green-400">
                            Bakiye Yeterli
                          </span>
                        </div>
                        {affordabilityCheck.useNegativeBalance && (
                          <div className="flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400">
                            <TrendingDown className="h-3 w-3" />
                            <span>Eksi bakiye kullanılacak: {formatCurrency(affordabilityCheck.negativeBalanceAmount)}</span>
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          İşlem sonrası bakiye: {formatCurrency(affordabilityCheck.remainingBalance)}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <span className="text-sm font-medium text-red-600 dark:text-red-400">
                            Yetersiz Bakiye
                          </span>
                        </div>
                        <div className="text-xs text-red-600 dark:text-red-400">
                          Eksik tutar: {formatCurrency(Math.abs(affordabilityCheck.remainingBalance))}
                        </div>
                        {!allowNegativeBalance && userWallet.negativeBalance && userWallet.negativeBalance > 0 && (
                          <div className="text-xs text-muted-foreground">
                            Eksi bakiye izni vererek bu rezervasyonu yapabilirsiniz
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
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
            disabled={loading || !canSubmit}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Rezervasyon Oluştur
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
