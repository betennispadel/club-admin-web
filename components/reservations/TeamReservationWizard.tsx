'use client';

import { useState, useMemo, useEffect } from 'react';
import { Court, User, Reservation, Team, Wallet, Role } from '@/lib/types';
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
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Users,
  User as UserIcon,
  MapPin,
  Calendar as CalendarIcon,
  Clock,
  Check,
  Flame,
  Lightbulb,
  X,
  Shield,
  Wallet as WalletIcon,
  AlertTriangle,
  Loader2,
  Percent,
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  calculateTotalPrice,
  formatCurrency,
  getAppliedDiscountForHour,
} from '@/lib/utils/priceCalculation';
import { TimeSlotGrid } from './TimeSlotButton';

export interface TeamReservationData {
  teamId: string;
  teamName: string;
  selectedUsers: User[];
  courtId: string;
  date: Date;
  time: string;
  selectedSlots: string[];
  endTime: string;
  duration: number;
  heater: boolean;
  light: boolean;
  matchType: 'single' | 'double';
}

interface TeamReservationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courts: Court[];
  users: User[];
  roles?: Role[];
  teams: Team[];
  reservations: Reservation[];
  selectedDate: Date;
  onSubmit: (data: TeamReservationData) => Promise<void>;
}

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

// Check if slot is reserved
const isSlotReserved = (
  courtId: string,
  date: string,
  time: string,
  reservations: Reservation[]
): boolean => {
  return reservations.some(
    (r) => r.courtId === courtId && r.date === date && r.time === time && r.status !== 'cancelled'
  );
};

export function TeamReservationWizard({
  open,
  onOpenChange,
  courts,
  users,
  roles = [],
  teams,
  reservations,
  selectedDate,
  onSubmit,
}: TeamReservationWizardProps) {
  const { selectedClub } = useClubStore();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Team Selection
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamSearch, setTeamSearch] = useState('');

  // Step 2: User Selection
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [matchType, setMatchType] = useState<'single' | 'double'>('double');

  // Wallet states for first user (primary payer)
  const [userWallets, setUserWallets] = useState<Map<string, Wallet>>(new Map());
  const [loadingWallets, setLoadingWallets] = useState(false);

  // Step 3: Date & Court Selection
  const [date, setDate] = useState<Date | undefined>(selectedDate);
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [courtSearch, setCourtSearch] = useState('');

  // Step 4: Time Selection & Options
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [heater, setHeater] = useState(false);
  const [light, setLight] = useState(false);

  // Fetch wallets when users are selected
  useEffect(() => {
    const fetchWallets = async () => {
      if (!selectedClub || selectedUsers.length === 0) {
        setUserWallets(new Map());
        return;
      }

      setLoadingWallets(true);
      try {
        const walletsRef = collection(db, selectedClub.id, 'wallets', 'wallets');
        const newWallets = new Map<string, Wallet>();

        for (const user of selectedUsers) {
          const walletQuery = query(walletsRef, where('userId', '==', user.id));
          const walletSnapshot = await getDocs(walletQuery);

          if (!walletSnapshot.empty) {
            const walletDoc = walletSnapshot.docs[0];
            newWallets.set(user.id, { id: walletDoc.id, ...walletDoc.data() } as Wallet);
          }
        }

        setUserWallets(newWallets);
      } catch (error) {
        console.error('Error fetching wallets:', error);
      } finally {
        setLoadingWallets(false);
      }
    };

    fetchWallets();
  }, [selectedClub, selectedUsers]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setStep(1);
      setSelectedTeam(null);
      setTeamSearch('');
      setSelectedUsers([]);
      setUserSearch('');
      setMatchType('double');
      setUserWallets(new Map());
      setDate(selectedDate);
      setSelectedCourt(null);
      setCourtSearch('');
      setSelectedSlots([]);
      setHeater(false);
      setLight(false);
    }
  }, [open, selectedDate]);

  // Filtered lists
  const filteredTeams = useMemo(() => {
    if (!teamSearch.trim()) return teams;
    const query = teamSearch.toLowerCase();
    return teams.filter((t) => t.name?.toLowerCase().includes(query));
  }, [teams, teamSearch]);

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users;
    const query = userSearch.toLowerCase();
    return users.filter(
      (u) => u.username?.toLowerCase().includes(query) || u.email?.toLowerCase().includes(query)
    );
  }, [users, userSearch]);

  const filteredCourts = useMemo(() => {
    if (!courtSearch.trim()) return courts;
    const query = courtSearch.toLowerCase();
    return courts.filter((c) => c.name?.toLowerCase().includes(query));
  }, [courts, courtSearch]);

  // Time slots for selected court
  const timeSlots = useMemo(() => {
    if (!selectedCourt) return [];
    return generateTimeSlots(selectedCourt);
  }, [selectedCourt]);

  // Get reservations for selected date and court
  const dateStr = date ? format(date, 'yyyy-MM-dd') : '';

  // Calculate price using utility
  const priceInfo = useMemo(() => {
    if (!selectedCourt || selectedSlots.length === 0) return null;

    // Use first selected user's role for pricing, default to 'member'
    const userRoleId = selectedUsers.length > 0 ? selectedUsers[0].role || 'member' : 'member';
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
  }, [selectedCourt, selectedSlots, heater, light, selectedUsers]);

  const totalPrice = priceInfo?.total || 0;

  // Calculate price per player
  const pricePerPlayer = useMemo(() => {
    if (selectedUsers.length === 0 || totalPrice === 0) return 0;
    return totalPrice / selectedUsers.length;
  }, [totalPrice, selectedUsers.length]);

  // Check if first slot has a discount
  const appliedDiscount = useMemo(() => {
    if (!selectedCourt || selectedSlots.length === 0) return null;
    const firstSlot = [...selectedSlots].sort()[0];
    const hour = parseInt(firstSlot.split(':')[0], 10);
    return getAppliedDiscountForHour(selectedCourt, hour);
  }, [selectedCourt, selectedSlots]);

  // Handle user selection
  const toggleUserSelection = (user: User) => {
    const maxUsers = matchType === 'single' ? 2 : 4;
    if (selectedUsers.find((u) => u.id === user.id)) {
      setSelectedUsers(selectedUsers.filter((u) => u.id !== user.id));
    } else if (selectedUsers.length < maxUsers) {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  // Handle slot selection (consecutive)
  const handleSlotClick = (slot: string) => {
    const isReserved = isSlotReserved(selectedCourt?.id || '', dateStr, slot, reservations);
    if (isReserved) return;

    if (selectedSlots.length === 0) {
      setSelectedSlots([slot]);
      return;
    }

    const slotIndex = timeSlots.indexOf(slot);
    const firstSelected = timeSlots.indexOf(selectedSlots[0]);
    const lastSelected = timeSlots.indexOf(selectedSlots[selectedSlots.length - 1]);

    if (selectedSlots.includes(slot)) {
      if (slot === selectedSlots[0]) {
        setSelectedSlots(selectedSlots.slice(1));
      } else if (slot === selectedSlots[selectedSlots.length - 1]) {
        setSelectedSlots(selectedSlots.slice(0, -1));
      }
    } else {
      if (slotIndex === lastSelected + 1) {
        setSelectedSlots([...selectedSlots, slot]);
      } else if (slotIndex === firstSelected - 1) {
        setSelectedSlots([slot, ...selectedSlots]);
      } else {
        setSelectedSlots([slot]);
      }
    }
  };

  // Navigation
  const canGoNext = () => {
    switch (step) {
      case 1:
        return !!selectedTeam;
      case 2:
        const minUsers = matchType === 'single' ? 2 : 2;
        return selectedUsers.length >= minUsers;
      case 3:
        return date && selectedCourt;
      case 4:
        return selectedSlots.length > 0;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!selectedTeam || !selectedCourt || !date) return;

    setIsSubmitting(true);
    try {
      const interval = selectedCourt.timeSlotInterval || 60;
      const endTime = calculateEndTime(selectedSlots[0], selectedSlots.length, interval);

      await onSubmit({
        teamId: selectedTeam.id,
        teamName: selectedTeam.name,
        selectedUsers,
        courtId: selectedCourt.id,
        date,
        time: selectedSlots[0],
        selectedSlots,
        endTime,
        duration: selectedSlots.length * interval,
        heater,
        light,
        matchType,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating team reservation:', error);
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
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold">Takım Seçin</h3>
              <p className="text-sm text-muted-foreground">Rezervasyon için takım seçin</p>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Takım ara..."
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {filteredTeams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => setSelectedTeam(team)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-lg border transition-all',
                      selectedTeam?.id === team.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-transparent bg-gray-50 hover:bg-gray-100'
                    )}
                  >
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center',
                        selectedTeam?.id === team.id ? 'bg-blue-500' : 'bg-gray-200'
                      )}
                    >
                      <Shield
                        className={cn(
                          'h-5 w-5',
                          selectedTeam?.id === team.id ? 'text-white' : 'text-gray-500'
                        )}
                      />
                    </div>
                    <span
                      className={cn('font-medium', selectedTeam?.id === team.id && 'text-blue-700')}
                    >
                      {team.name}
                    </span>
                    {selectedTeam?.id === team.id && (
                      <Check className="h-5 w-5 text-blue-500 ml-auto" />
                    )}
                  </button>
                ))}
                {filteredTeams.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Takım bulunamadı</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        );

      case 2:
        const maxUsers = matchType === 'single' ? 2 : 4;
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold">Oyuncuları Seçin</h3>
              <p className="text-sm text-muted-foreground">
                {matchType === 'single' ? '2 oyuncu' : '2-4 oyuncu'} seçin
              </p>
            </div>

            {/* Match Type Toggle */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
              <button
                onClick={() => {
                  setMatchType('single');
                  setSelectedUsers(selectedUsers.slice(0, 2));
                }}
                className={cn(
                  'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all',
                  matchType === 'single' ? 'bg-white shadow text-blue-600' : 'text-gray-600'
                )}
              >
                <UserIcon className="h-4 w-4 inline mr-2" />
                Tekler
              </button>
              <button
                onClick={() => setMatchType('double')}
                className={cn(
                  'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all',
                  matchType === 'double' ? 'bg-white shadow text-blue-600' : 'text-gray-600'
                )}
              >
                <Users className="h-4 w-4 inline mr-2" />
                Çiftler
              </button>
            </div>

            {/* Selected Users */}
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((user) => (
                  <Badge
                    key={user.id}
                    variant="secondary"
                    className="pl-3 pr-1 py-1.5 flex items-center gap-2"
                  >
                    {user.username}
                    <button
                      onClick={() => toggleUserSelection(user)}
                      className="hover:bg-gray-300 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <span className="text-sm text-muted-foreground self-center">
                  ({selectedUsers.length}/{maxUsers})
                </span>
              </div>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Kullanıcı ara..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <ScrollArea className="h-[180px]">
              <div className="space-y-2">
                {filteredUsers.map((user) => {
                  const isSelected = selectedUsers.some((u) => u.id === user.id);
                  const isDisabled = !isSelected && selectedUsers.length >= maxUsers;
                  const userRole = roles.find(r => r.id === user.role);
                  return (
                    <button
                      key={user.id}
                      onClick={() => toggleUserSelection(user)}
                      disabled={isDisabled}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-lg border transition-all',
                        isSelected
                          ? 'border-green-500 bg-green-50'
                          : isDisabled
                            ? 'border-transparent bg-gray-50 opacity-50 cursor-not-allowed'
                            : 'border-transparent bg-gray-50 hover:bg-gray-100'
                      )}
                    >
                      <div
                        className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center',
                          isSelected ? 'bg-green-500' : 'bg-gray-200'
                        )}
                      >
                        <UserIcon
                          className={cn('h-5 w-5', isSelected ? 'text-white' : 'text-gray-500')}
                        />
                      </div>
                      <div className="text-left flex-1">
                        <p className={cn('font-medium', isSelected && 'text-green-700')}>
                          {user.username || user.name}
                        </p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                        {userRole && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            {userRole.name}
                          </Badge>
                        )}
                      </div>
                      {isSelected && <Check className="h-5 w-5 text-green-500" />}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Wallet Status for Selected Users */}
            {selectedUsers.length > 0 && (
              <div className="mt-3 p-3 rounded-lg border space-y-2">
                <div className="flex items-center gap-2">
                  <WalletIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Cüzdan Durumları</span>
                  {loadingWallets && <Loader2 className="h-3 w-3 animate-spin" />}
                </div>
                <div className="space-y-1">
                  {selectedUsers.map((user) => {
                    const wallet = userWallets.get(user.id);
                    return (
                      <div key={user.id} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{user.username || user.name}</span>
                        {wallet ? (
                          <span className={cn(
                            "font-medium",
                            (wallet.balance || 0) >= 0 ? "text-green-600" : "text-red-600"
                          )}>
                            {formatCurrency(wallet.balance || 0)}
                          </span>
                        ) : (
                          <span className="text-yellow-600 text-xs">Cüzdan yok</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 mb-4">
                <CalendarIcon className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold">Tarih ve Kort</h3>
              <p className="text-sm text-muted-foreground">Tarih ve kort seçin</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Tarih</Label>
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  locale={tr}
                  disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                  className="rounded-md border"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Kort</Label>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Kort ara..."
                    value={courtSearch}
                    onChange={(e) => setCourtSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <ScrollArea className="h-[280px]">
                  <div className="space-y-2">
                    {filteredCourts.map((court) => (
                      <button
                        key={court.id}
                        onClick={() => {
                          setSelectedCourt(court);
                          setSelectedSlots([]);
                        }}
                        className={cn(
                          'w-full flex items-center gap-3 p-3 rounded-lg border transition-all',
                          selectedCourt?.id === court.id
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-transparent bg-gray-50 hover:bg-gray-100'
                        )}
                      >
                        <div
                          className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center',
                            selectedCourt?.id === court.id ? 'bg-orange-500' : 'bg-gray-200'
                          )}
                        >
                          <MapPin
                            className={cn(
                              'h-4 w-4',
                              selectedCourt?.id === court.id ? 'text-white' : 'text-gray-500'
                            )}
                          />
                        </div>
                        <div className="text-left flex-1">
                          <p
                            className={cn(
                              'font-medium text-sm',
                              selectedCourt?.id === court.id && 'text-orange-700'
                            )}
                          >
                            {court.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {court.availableFrom || '08:00'} - {court.availableUntil || '22:00'}
                          </p>
                        </div>
                        {selectedCourt?.id === court.id && (
                          <Check className="h-4 w-4 text-orange-500" />
                        )}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
        );

      case 4:
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
                    {selectedSlots[0]} → {calculateEndTime(
                      selectedSlots[0],
                      selectedSlots.length,
                      selectedCourt?.timeSlotInterval || 60
                    )}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Yeşil bloklar indirimli saatleri, kırmızı bloklar dolu saatleri gösterir
              </p>
              <ScrollArea className="h-[180px] pr-2">
                {selectedCourt && (
                  <TimeSlotGrid
                    slots={timeSlots}
                    court={selectedCourt}
                    selectedSlots={selectedSlots}
                    reservedSlots={reservations
                      .filter(r => r.courtId === selectedCourt.id && r.date === dateStr && r.status !== 'cancelled')
                      .map(r => r.time)}
                    userRoleId={selectedUsers.length > 0 ? selectedUsers[0].role : 'member'}
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
            </div>

            {/* Price Preview */}
            {priceInfo && selectedUsers.length > 0 && (
              <div className="p-3 bg-blue-50 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-blue-700">Toplam</span>
                  <span className="font-bold text-blue-600">{formatCurrency(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-blue-600">Kişi başı</span>
                  <span className="font-medium text-blue-600">{formatCurrency(pricePerPlayer)}</span>
                </div>
                {priceInfo.discountAmount > 0 && (
                  <p className="text-xs text-green-600">
                    <Percent className="inline h-3 w-3 mr-1" />
                    İndirim: -{formatCurrency(priceInfo.discountAmount)}
                  </p>
                )}
              </div>
            )}
          </div>
        );

      case 5:
        const interval = selectedCourt?.timeSlotInterval || 60;
        const endTime =
          selectedSlots.length > 0
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
                  <Shield className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Takım</span>
                </div>
                <span className="font-medium">{selectedTeam?.name}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">Maç Tipi</span>
                </div>
                <Badge variant="outline">{matchType === 'single' ? 'Tekler' : 'Çiftler'}</Badge>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <UserIcon className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">Oyuncular</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedUsers.map((user) => (
                    <Badge key={user.id} variant="secondary">
                      {user.username}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-muted-foreground">Kort</span>
                </div>
                <span className="font-medium">{selectedCourt?.name}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-muted-foreground">Tarih</span>
                </div>
                <span className="font-medium">
                  {date && format(date, 'dd MMMM yyyy', { locale: tr })}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-indigo-500" />
                  <span className="text-sm text-muted-foreground">Saat</span>
                </div>
                <span className="font-medium">
                  {selectedSlots[0]} - {endTime}
                </span>
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
              {priceInfo && (
                <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium">Fiyat Detayı</p>
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
                  {priceInfo.discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span className="flex items-center gap-1">
                        <Percent className="h-3 w-3" />
                        İndirim {appliedDiscount && `(%${appliedDiscount.percentage})`}
                      </span>
                      <span>-{formatCurrency(priceInfo.discountAmount)}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <span className="font-semibold text-blue-700">Toplam Tutar</span>
                  {selectedUsers.length > 0 && (
                    <p className="text-xs text-blue-600">
                      (Kişi başı: {formatCurrency(pricePerPlayer)})
                    </p>
                  )}
                </div>
                <span className="text-2xl font-bold text-blue-600">
                  {formatCurrency(totalPrice)}
                </span>
              </div>

              {/* Wallet Status Summary */}
              {selectedUsers.length > 0 && userWallets.size > 0 && (
                <div className="p-3 rounded-lg border space-y-2">
                  <div className="flex items-center gap-2">
                    <WalletIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Cüzdan Durumları</span>
                  </div>
                  <div className="space-y-1">
                    {selectedUsers.map((user) => {
                      const wallet = userWallets.get(user.id);
                      const hasEnough = wallet && (wallet.balance || 0) >= pricePerPlayer;
                      return (
                        <div key={user.id} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-2">
                            {hasEnough ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <AlertTriangle className="h-3 w-3 text-orange-500" />
                            )}
                            {user.username || user.name}
                          </span>
                          {wallet ? (
                            <span className={cn(
                              "font-medium",
                              (wallet.balance || 0) >= pricePerPlayer ? "text-green-600" : "text-orange-600"
                            )}>
                              {formatCurrency(wallet.balance || 0)}
                            </span>
                          ) : (
                            <span className="text-yellow-600 text-xs">Cüzdan yok</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
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
            <Shield className="h-5 w-5" />
            Takım Rezervasyonu
          </DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between px-4 py-3">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                  s < step && 'bg-green-500 text-white',
                  s === step && 'bg-primary text-white',
                  s > step && 'bg-gray-100 text-gray-400'
                )}
              >
                {s < step ? <Check className="h-4 w-4" /> : s}
              </div>
              {s < 5 && (
                <div className={cn('w-10 h-1 mx-1', s < step ? 'bg-green-500' : 'bg-gray-100')} />
              )}
            </div>
          ))}
        </div>

        <ScrollArea className="flex-1 px-1">{renderStep()}</ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleBack} disabled={step === 1}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Geri
          </Button>

          {step < 5 ? (
            <Button onClick={handleNext} disabled={!canGoNext()}>
              İleri
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? 'Oluşturuluyor...' : 'Rezervasyon Oluştur'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
