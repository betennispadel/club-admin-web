'use client';

import { useState, useMemo, useEffect } from 'react';
import { Court, User, Reservation, LessonGroup, Wallet, Role } from '@/lib/types';
import { useClubStore } from '@/stores/clubStore';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  GraduationCap,
  User as UserIcon,
  MapPin,
  Calendar as CalendarIcon,
  Clock,
  Check,
  Flame,
  Lightbulb,
  X,
  Wallet as WalletIcon,
  AlertTriangle,
  Loader2,
  TrendingDown,
  Percent,
} from 'lucide-react';
import { format, addDays, eachDayOfInterval, getDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  calculateTotalPrice,
  canUserAfford,
  formatCurrency,
  getAppliedDiscountForHour,
} from '@/lib/utils/priceCalculation';
import { TimeSlotGrid } from './TimeSlotButton';

export interface PrivateLessonData {
  groupName: string;
  userId?: string;
  userName?: string;
  courtId: string;
  startDate: Date;
  endDate: Date;
  selectedDays: number[]; // 0 = Sunday, 1 = Monday, etc.
  time: string;
  selectedSlots: string[];
  endTime: string;
  duration: number;
  heater: boolean;
  light: boolean;
  allowNegativeBalance: boolean;
}

interface PrivateLessonWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courts: Court[];
  users: User[];
  roles?: Role[];
  lessonGroups: LessonGroup[];
  reservations: Reservation[];
  onSubmit: (data: PrivateLessonData) => Promise<void>;
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Pazartesi', short: 'Pzt' },
  { value: 2, label: 'Salı', short: 'Sal' },
  { value: 3, label: 'Çarşamba', short: 'Çar' },
  { value: 4, label: 'Perşembe', short: 'Per' },
  { value: 5, label: 'Cuma', short: 'Cum' },
  { value: 6, label: 'Cumartesi', short: 'Cmt' },
  { value: 0, label: 'Pazar', short: 'Paz' },
];

// Generate time slots
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

// Calculate end time
const calculateEndTime = (startTime: string, slots: number, interval: number): string => {
  const [h, m] = startTime.split(':').map(Number);
  const totalMinutes = h * 60 + m + slots * interval;
  const endH = Math.floor(totalMinutes / 60);
  const endM = totalMinutes % 60;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
};

export function PrivateLessonWizard({
  open,
  onOpenChange,
  courts,
  users,
  roles = [],
  lessonGroups,
  reservations,
  onSubmit,
}: PrivateLessonWizardProps) {
  const { selectedClub } = useClubStore();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Lesson Group
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [groupSearch, setGroupSearch] = useState('');

  // Step 2: User (Optional)
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [skipUser, setSkipUser] = useState(false);

  // Wallet state
  const [userWallet, setUserWallet] = useState<Wallet | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(false);

  // Step 3: Court
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [courtSearch, setCourtSearch] = useState('');

  // Step 4: Date Range & Days
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(addDays(new Date(), 30));
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 3, 5]); // Mon, Wed, Fri

  // Step 5: Time & Options
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [heater, setHeater] = useState(false);
  const [light, setLight] = useState(false);
  const [allowNegativeBalance, setAllowNegativeBalance] = useState(false);

  // User role
  const selectedUserRole = roles.find(r => r.id === selectedUser?.role);

  // Fetch user wallet when user is selected
  useEffect(() => {
    const fetchUserWallet = async () => {
      if (!selectedClub || !selectedUser) {
        setUserWallet(null);
        return;
      }

      setLoadingWallet(true);
      try {
        const walletsRef = collection(db, selectedClub.id, 'wallets', 'wallets');
        const walletQuery = query(walletsRef, where('userId', '==', selectedUser.id));
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
  }, [selectedClub, selectedUser]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setStep(1);
      setSelectedGroup('');
      setGroupSearch('');
      setSelectedUser(null);
      setUserSearch('');
      setSkipUser(false);
      setUserWallet(null);
      setSelectedCourt(null);
      setCourtSearch('');
      setStartDate(new Date());
      setEndDate(addDays(new Date(), 30));
      setSelectedDays([1, 3, 5]);
      setSelectedSlots([]);
      setHeater(false);
      setLight(false);
      setAllowNegativeBalance(false);
    }
  }, [open]);

  // Filtered lists
  const filteredGroups = useMemo(() => {
    if (!groupSearch.trim()) return lessonGroups;
    const query = groupSearch.toLowerCase();
    return lessonGroups.filter(g => g.groupName?.toLowerCase().includes(query));
  }, [lessonGroups, groupSearch]);

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users;
    const query = userSearch.toLowerCase();
    return users.filter(u =>
      u.username?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query)
    );
  }, [users, userSearch]);

  const filteredCourts = useMemo(() => {
    if (!courtSearch.trim()) return courts;
    const query = courtSearch.toLowerCase();
    return courts.filter(c => c.name?.toLowerCase().includes(query));
  }, [courts, courtSearch]);

  // Time slots for selected court
  const timeSlots = useMemo(() => {
    if (!selectedCourt) return [];
    return generateTimeSlots(selectedCourt);
  }, [selectedCourt]);

  // Calculate lesson dates
  const lessonDates = useMemo(() => {
    if (!startDate || !endDate || selectedDays.length === 0) return [];
    const allDays = eachDayOfInterval({ start: startDate, end: endDate });
    return allDays.filter(date => selectedDays.includes(getDay(date)));
  }, [startDate, endDate, selectedDays]);

  // Calculate price per session using utility
  const pricePerSession = useMemo(() => {
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

  // Calculate total price for all sessions
  const totalPrice = useMemo(() => {
    if (!pricePerSession) return 0;
    return pricePerSession.total * lessonDates.length;
  }, [pricePerSession, lessonDates]);

  // Check if first selected slot has a discount
  const appliedDiscount = useMemo(() => {
    if (!selectedCourt || selectedSlots.length === 0) return null;
    const firstSlot = [...selectedSlots].sort()[0];
    const hour = parseInt(firstSlot.split(':')[0], 10);
    return getAppliedDiscountForHour(selectedCourt, hour);
  }, [selectedCourt, selectedSlots]);

  // Check affordability
  const affordabilityCheck = useMemo(() => {
    if (!userWallet || totalPrice === 0) return null;

    return canUserAfford(
      totalPrice,
      userWallet.balance || 0,
      userWallet.negativeBalance || 0,
      allowNegativeBalance
    );
  }, [totalPrice, userWallet, allowNegativeBalance]);

  // Handle slot selection (consecutive)
  const handleSlotClick = (slot: string) => {
    if (selectedSlots.length === 0) {
      setSelectedSlots([slot]);
      return;
    }

    const slotIndex = timeSlots.indexOf(slot);
    const firstSelected = timeSlots.indexOf(selectedSlots[0]);
    const lastSelected = timeSlots.indexOf(selectedSlots[selectedSlots.length - 1]);

    if (selectedSlots.includes(slot)) {
      // Deselect
      if (slot === selectedSlots[0]) {
        setSelectedSlots(selectedSlots.slice(1));
      } else if (slot === selectedSlots[selectedSlots.length - 1]) {
        setSelectedSlots(selectedSlots.slice(0, -1));
      }
    } else {
      // Select consecutive
      if (slotIndex === lastSelected + 1) {
        setSelectedSlots([...selectedSlots, slot]);
      } else if (slotIndex === firstSelected - 1) {
        setSelectedSlots([slot, ...selectedSlots]);
      } else {
        // Start new selection
        setSelectedSlots([slot]);
      }
    }
  };

  // Toggle day selection
  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  // Navigation
  const canGoNext = () => {
    switch (step) {
      case 1: return !!selectedGroup;
      case 2: return skipUser || !!selectedUser;
      case 3: return !!selectedCourt;
      case 4: return startDate && endDate && selectedDays.length > 0 && lessonDates.length > 0;
      case 5: return selectedSlots.length > 0;
      default: return true;
    }
  };

  const handleNext = () => {
    if (step < 6) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!selectedCourt || !startDate || !endDate) return;

    setIsSubmitting(true);
    try {
      const interval = selectedCourt.timeSlotInterval || 60;
      const endTime = calculateEndTime(selectedSlots[0], selectedSlots.length, interval);

      await onSubmit({
        groupName: selectedGroup,
        userId: selectedUser?.id,
        userName: selectedUser?.username,
        courtId: selectedCourt.id,
        startDate,
        endDate,
        selectedDays,
        time: selectedSlots[0],
        selectedSlots,
        endTime,
        duration: selectedSlots.length * interval,
        heater,
        light,
        allowNegativeBalance,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating private lesson:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 mb-4">
                <GraduationCap className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold">Ders Grubu Seçin</h3>
              <p className="text-sm text-muted-foreground">Özel ders için grup seçin</p>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Grup ara..."
                value={groupSearch}
                onChange={(e) => setGroupSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {filteredGroups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => setSelectedGroup(group.groupName)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg border transition-all",
                      selectedGroup === group.groupName
                        ? "border-purple-500 bg-purple-50"
                        : "border-transparent bg-gray-50 hover:bg-gray-100"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      selectedGroup === group.groupName ? "bg-purple-500" : "bg-gray-200"
                    )}>
                      <GraduationCap className={cn(
                        "h-5 w-5",
                        selectedGroup === group.groupName ? "text-white" : "text-gray-500"
                      )} />
                    </div>
                    <span className={cn(
                      "font-medium",
                      selectedGroup === group.groupName && "text-purple-700"
                    )}>
                      {group.groupName}
                    </span>
                    {selectedGroup === group.groupName && (
                      <Check className="h-5 w-5 text-purple-500 ml-auto" />
                    )}
                  </button>
                ))}
                {filteredGroups.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <GraduationCap className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Grup bulunamadı</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                <UserIcon className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold">Kullanıcı Seçin</h3>
              <p className="text-sm text-muted-foreground">Opsiyonel - kullanıcı seçebilirsiniz</p>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm">Kullanıcı seçmeden devam et</span>
              <Switch checked={skipUser} onCheckedChange={(checked) => {
                setSkipUser(checked);
                if (checked) {
                  setSelectedUser(null);
                  setUserWallet(null);
                }
              }} />
            </div>

            {!skipUser && (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Kullanıcı ara..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {filteredUsers.map((user) => {
                      const userRole = roles.find(r => r.id === user.role);
                      return (
                        <button
                          key={user.id}
                          onClick={() => setSelectedUser(user)}
                          className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-lg border transition-all",
                            selectedUser?.id === user.id
                              ? "border-blue-500 bg-blue-50"
                              : "border-transparent bg-gray-50 hover:bg-gray-100"
                          )}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center",
                            selectedUser?.id === user.id ? "bg-blue-500" : "bg-gray-200"
                          )}>
                            <UserIcon className={cn(
                              "h-5 w-5",
                              selectedUser?.id === user.id ? "text-white" : "text-gray-500"
                            )} />
                          </div>
                          <div className="text-left flex-1">
                            <p className={cn(
                              "font-medium",
                              selectedUser?.id === user.id && "text-blue-700"
                            )}>
                              {user.username || user.name}
                            </p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                            {userRole && (
                              <Badge variant="outline" className="mt-1 text-xs">
                                {userRole.name}
                              </Badge>
                            )}
                          </div>
                          {selectedUser?.id === user.id && (
                            <Check className="h-5 w-5 text-blue-500" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>

                {/* Wallet Balance Display */}
                {selectedUser && (
                  <div className="mt-3">
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
                            (userWallet.balance || 0) >= 0 ? "bg-green-50" : "bg-red-50"
                          )}>
                            <p className="text-xs text-muted-foreground">Bakiye</p>
                            <p className={cn(
                              "font-semibold",
                              (userWallet.balance || 0) >= 0 ? "text-green-600" : "text-red-600"
                            )}>
                              {formatCurrency(userWallet.balance || 0)}
                            </p>
                          </div>
                          <div className="p-2 rounded-md bg-orange-50">
                            <p className="text-xs text-muted-foreground">Eksi Bakiye Limiti</p>
                            <p className="font-semibold text-orange-600">
                              {formatCurrency(userWallet.negativeBalance || 0)}
                            </p>
                          </div>
                        </div>
                        {userWallet.isBlocked && (
                          <div className="flex items-center gap-2 p-2 bg-red-100 rounded-md">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                            <span className="text-sm text-red-600">Cüzdan bloke edilmiş</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm text-yellow-600">Bu kullanıcının cüzdanı bulunamadı</span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <MapPin className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold">Kort Seçin</h3>
              <p className="text-sm text-muted-foreground">Ders için kort seçin</p>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Kort ara..."
                value={courtSearch}
                onChange={(e) => setCourtSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {filteredCourts.map((court) => (
                  <button
                    key={court.id}
                    onClick={() => setSelectedCourt(court)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg border transition-all",
                      selectedCourt?.id === court.id
                        ? "border-green-500 bg-green-50"
                        : "border-transparent bg-gray-50 hover:bg-gray-100"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center",
                      selectedCourt?.id === court.id ? "bg-green-500" : "bg-gray-200"
                    )}>
                      <MapPin className={cn(
                        "h-5 w-5",
                        selectedCourt?.id === court.id ? "text-white" : "text-gray-500"
                      )} />
                    </div>
                    <div className="text-left flex-1">
                      <p className={cn(
                        "font-medium",
                        selectedCourt?.id === court.id && "text-green-700"
                      )}>
                        {court.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {court.availableFrom || '08:00'} - {court.availableUntil || '22:00'}
                      </p>
                    </div>
                    {selectedCourt?.id === court.id && (
                      <Check className="h-5 w-5 text-green-500" />
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 mb-4">
                <CalendarIcon className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold">Tarih Aralığı ve Günler</h3>
              <p className="text-sm text-muted-foreground">Ders tarihlerini belirleyin</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Başlangıç</Label>
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  locale={tr}
                  className="rounded-md border"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Bitiş</Label>
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  locale={tr}
                  disabled={(date) => startDate ? date < startDate : false}
                  className="rounded-md border"
                />
              </div>
            </div>

            <Separator />

            <div>
              <Label className="text-sm font-medium mb-3 block">Ders Günleri</Label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day.value}
                    onClick={() => toggleDay(day.value)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-all",
                      selectedDays.includes(day.value)
                        ? "bg-orange-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    )}
                  >
                    {day.short}
                  </button>
                ))}
              </div>
            </div>

            {lessonDates.length > 0 && (
              <div className="p-3 bg-orange-50 rounded-lg">
                <p className="text-sm font-medium text-orange-700">
                  Toplam {lessonDates.length} ders günü
                </p>
                <p className="text-xs text-orange-600">
                  {startDate && format(startDate, 'dd MMM', { locale: tr })} -{' '}
                  {endDate && format(endDate, 'dd MMM yyyy', { locale: tr })}
                </p>
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 mb-4">
                <Clock className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold">Saat ve Seçenekler</h3>
              <p className="text-sm text-muted-foreground">Ardışık saatler seçin</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Saat Seçimi</Label>
                {selectedSlots.length > 0 && (
                  <Badge variant="secondary" className="font-mono">
                    {selectedSlots[0]} → {calculateEndTime(selectedSlots[0], selectedSlots.length, selectedCourt?.timeSlotInterval || 60)}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Yeşil bloklar indirimli saatleri gösterir
              </p>
              <ScrollArea className="h-[200px] pr-2">
                {selectedCourt && (
                  <TimeSlotGrid
                    slots={timeSlots}
                    court={selectedCourt}
                    selectedSlots={selectedSlots}
                    userRoleId={selectedUser?.role}
                    onSlotClick={handleSlotClick}
                    columns={4}
                    showPrice={true}
                    showTimeRange={true}
                    compact={true}
                  />
                )}
              </ScrollArea>
              {selectedSlots.length > 0 && (
                <div className="flex items-center justify-between p-2 bg-indigo-50 rounded-lg">
                  <span className="text-sm text-indigo-600">
                    Süre: {selectedSlots.length * (selectedCourt?.timeSlotInterval || 60)} dk
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

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-500" />
                  <span className="font-medium">Isıtıcı</span>
                  {selectedCourt?.heatingCost && (
                    <span className="text-sm text-muted-foreground">
                      (+{formatCurrency(selectedCourt.heatingCost)}/saat)
                    </span>
                  )}
                </div>
                <Switch checked={heater} onCheckedChange={setHeater} />
              </div>

              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  <span className="font-medium">Aydınlatma</span>
                  {selectedCourt?.lightingCost && (
                    <span className="text-sm text-muted-foreground">
                      (+{formatCurrency(selectedCourt.lightingCost)}/saat)
                    </span>
                  )}
                </div>
                <Switch checked={light} onCheckedChange={setLight} />
              </div>

              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Eksi Bakiye İzni</span>
                </div>
                <Switch checked={allowNegativeBalance} onCheckedChange={setAllowNegativeBalance} />
              </div>
            </div>

            {/* Price preview per session */}
            {pricePerSession && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-700">Seans Başına Fiyat</p>
                <p className="text-lg font-bold text-blue-600">{formatCurrency(pricePerSession.total)}</p>
                {pricePerSession.discountAmount > 0 && (
                  <p className="text-xs text-green-600">
                    <Percent className="inline h-3 w-3 mr-1" />
                    İndirim: -{formatCurrency(pricePerSession.discountAmount)}
                  </p>
                )}
              </div>
            )}
          </div>
        );

      case 6:
        const interval = selectedCourt?.timeSlotInterval || 60;
        const endTime = selectedSlots.length > 0
          ? calculateEndTime(selectedSlots[0], selectedSlots.length, interval)
          : '';

        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold">Onay</h3>
              <p className="text-sm text-muted-foreground">Bilgileri kontrol edin</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-purple-500" />
                  <span className="text-sm text-muted-foreground">Ders Grubu</span>
                </div>
                <span className="font-medium">{selectedGroup}</span>
              </div>

              {selectedUser && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-blue-500" />
                    <span className="text-sm text-muted-foreground">Kullanıcı</span>
                  </div>
                  <span className="font-medium">{selectedUser.username}</span>
                </div>
              )}

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">Kort</span>
                </div>
                <span className="font-medium">{selectedCourt?.name}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-muted-foreground">Tarih Aralığı</span>
                </div>
                <span className="font-medium">
                  {startDate && format(startDate, 'dd MMM', { locale: tr })} -{' '}
                  {endDate && format(endDate, 'dd MMM', { locale: tr })}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-indigo-500" />
                  <span className="text-sm text-muted-foreground">Saat</span>
                </div>
                <span className="font-medium">{selectedSlots[0]} - {endTime}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-muted-foreground">Günler</span>
                <div className="flex gap-1">
                  {selectedDays.sort().map(d => (
                    <Badge key={d} variant="outline" className="text-xs">
                      {DAYS_OF_WEEK.find(day => day.value === d)?.short}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-muted-foreground">Toplam Ders</span>
                <span className="font-medium">{lessonDates.length} ders</span>
              </div>

              <div className="flex items-center gap-2">
                {heater && (
                  <Badge variant="outline" className="text-orange-500 border-orange-200">
                    <Flame className="h-3 w-3 mr-1" />
                    Isıtıcı
                  </Badge>
                )}
                {light && (
                  <Badge variant="outline" className="text-yellow-500 border-yellow-200">
                    <Lightbulb className="h-3 w-3 mr-1" />
                    Aydınlatma
                  </Badge>
                )}
              </div>

              <Separator />

              {/* Price Breakdown */}
              {pricePerSession && (
                <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium">Fiyat Detayı (Seans Başına)</p>
                  <div className="flex justify-between text-sm">
                    <span>Kort Ücreti</span>
                    <span>{formatCurrency(pricePerSession.courtFee)}</span>
                  </div>
                  {pricePerSession.heaterFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-1">
                        <Flame className="h-3 w-3 text-orange-500" />
                        Isıtıcı
                      </span>
                      <span>{formatCurrency(pricePerSession.heaterFee)}</span>
                    </div>
                  )}
                  {pricePerSession.lightFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-1">
                        <Lightbulb className="h-3 w-3 text-yellow-500" />
                        Aydınlatma
                      </span>
                      <span>{formatCurrency(pricePerSession.lightFee)}</span>
                    </div>
                  )}
                  {pricePerSession.discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span className="flex items-center gap-1">
                        <Percent className="h-3 w-3" />
                        İndirim {appliedDiscount && `(%${appliedDiscount.percentage})`}
                      </span>
                      <span>-{formatCurrency(pricePerSession.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-medium pt-1 border-t">
                    <span>Seans Başına</span>
                    <span>{formatCurrency(pricePerSession.total)}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <span className="font-semibold text-green-700">Toplam Tutar</span>
                  <p className="text-xs text-green-600">({lessonDates.length} seans)</p>
                </div>
                <span className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalPrice)}
                </span>
              </div>

              {/* Affordability Check */}
              {selectedUser && userWallet && affordabilityCheck && (
                <div className={cn(
                  "p-3 rounded-lg",
                  affordabilityCheck.canAfford
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                )}>
                  {affordabilityCheck.canAfford ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-600">
                          Bakiye Yeterli
                        </span>
                      </div>
                      {affordabilityCheck.useNegativeBalance && (
                        <div className="flex items-center gap-2 text-xs text-orange-600">
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
                        <span className="text-sm font-medium text-red-600">
                          Yetersiz Bakiye
                        </span>
                      </div>
                      <div className="text-xs text-red-600">
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
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Özel Ders Rezervasyonu
          </DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between px-2 py-3">
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                  s < step && "bg-green-500 text-white",
                  s === step && "bg-primary text-white",
                  s > step && "bg-gray-100 text-gray-400"
                )}
              >
                {s < step ? <Check className="h-4 w-4" /> : s}
              </div>
              {s < 6 && (
                <div
                  className={cn(
                    "w-8 h-1 mx-1",
                    s < step ? "bg-green-500" : "bg-gray-100"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        <ScrollArea className="flex-1 px-1">
          {renderStep()}
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Geri
          </Button>

          {step < 6 ? (
            <Button onClick={handleNext} disabled={!canGoNext()}>
              İleri
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? 'Oluşturuluyor...' : 'Dersleri Oluştur'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
