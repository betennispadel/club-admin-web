'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useClubStore } from '@/stores/clubStore';
import { useLocaleStore, formatCurrencyByLocale } from '@/stores/localeStore';
import { collection, getDocs, doc, deleteDoc, updateDoc, onSnapshot, Timestamp, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { createBatch, getClubSubDoc } from '@/lib/firebase/firestore';
import { Reservation, Court, User, LessonGroup, Team, Role, Wallet } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Loader2,
  Search,
  Plus,
  CalendarIcon,
  Clock,
  User as UserIcon,
  MapPin,
  MoreHorizontal,
  Trash2,
  XCircle,
  Eye,
  Flame,
  Lightbulb,
  Users,
  Trophy,
  Gift,
  Percent,
  CreditCard,
  BarChart3,
  Grid3X3,
  List,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Shield,
  GraduationCap,
  LayoutGrid,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  CourtsOverview,
  ReservationDetailDialog,
  NewReservationDialog,
  BulkReservationDialog,
  ReservationStatsDialog,
  PrivateLessonWizard,
  TeamReservationWizard,
  CourtsOverviewDialog,
  UserStatisticsDialog,
  ReservationWall,
} from '@/components/reservations';
import { exportReservationsPDF, exportReservationsCSV, exportDayReportPDF } from '@/lib/utils/pdfExport';

// Helper functions
const formatDateToDisplay = (dateString: string): string => {
  if (dateString.includes('-')) {
    const [year, month, day] = dateString.split('-');
    return `${day}.${month}.${year}`;
  }
  return dateString;
};

const isPastReservation = (dateString: string, timeString?: string): boolean => {
  const parts = dateString.includes('.')
    ? dateString.split('.')
    : dateString.split('-').reverse();
  const [day, month, year] = parts.map(Number);
  const reservationDate = new Date(year, month - 1, day);

  if (timeString) {
    const [hour, minute] = timeString.split(':').map(Number);
    reservationDate.setHours(hour, minute, 0, 0);
  } else {
    reservationDate.setHours(23, 59, 59, 999);
  }

  return reservationDate.getTime() < Date.now();
};

// Reservation type info
const getReservationTypeInfo = (item: Reservation) => {
  if (item.isLesson) {
    return { label: 'Ders', color: 'bg-indigo-100 text-indigo-700', icon: GraduationCap };
  }
  if (item.isTraining) {
    return { label: 'Antrenman', color: 'bg-purple-100 text-purple-700', icon: Users };
  }
  if (item.isChallenge && item.matchType === 'double') {
    return { label: 'Çiftler Maç', color: 'bg-pink-100 text-pink-700', icon: Users };
  }
  if (item.isChallenge && item.matchType === 'single') {
    return { label: 'Tekler Maç', color: 'bg-blue-100 text-blue-700', icon: UserIcon };
  }
  if (item.isChallenge) {
    return { label: 'Meydan Okuma', color: 'bg-orange-100 text-orange-700', icon: Trophy };
  }
  if (item.isGift) {
    return { label: 'Hediye', color: 'bg-green-100 text-green-700', icon: Gift };
  }
  return { label: 'Normal', color: 'bg-gray-100 text-gray-700', icon: CalendarIcon };
};

// Format currency using locale settings
const formatCurrency = (amount: number) => {
  return formatCurrencyByLocale(amount);
};

export default function ReservationsPage() {
  const t = useTranslations('reservations');
  const { selectedClub } = useClubStore();
  const { fetchLocaleConfig } = useLocaleStore();

  // State
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [lessonGroups, setLessonGroups] = useState<LessonGroup[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourtId, setSelectedCourtId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'wall'>('grid');

  // Dialogs
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isNewReservationOpen, setIsNewReservationOpen] = useState(false);
  const [isBulkReservationOpen, setIsBulkReservationOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isPrivateLessonOpen, setIsPrivateLessonOpen] = useState(false);
  const [isTeamReservationOpen, setIsTeamReservationOpen] = useState(false);
  const [isCourtsOverviewOpen, setIsCourtsOverviewOpen] = useState(false);
  const [isUserStatsOpen, setIsUserStatsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch locale config when club changes
  useEffect(() => {
    if (selectedClub) {
      fetchLocaleConfig(selectedClub.id);
    }
  }, [selectedClub, fetchLocaleConfig]);

  // Fetch data
  useEffect(() => {
    if (!selectedClub) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch courts
        const courtsRef = collection(db, selectedClub.id, 'courts', 'courts');
        const courtsSnapshot = await getDocs(courtsRef);
        const courtsData = courtsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Court[];
        setCourts(courtsData);

        // Fetch users
        const usersRef = collection(db, selectedClub.id, 'users', 'users');
        const usersSnapshot = await getDocs(usersRef);
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as User[];
        setUsers(usersData);

        // Fetch roles
        try {
          const rolesRef = collection(db, selectedClub.id, 'roles', 'roles');
          const rolesSnapshot = await getDocs(rolesRef);
          const rolesData = rolesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as Role[];
          setRoles(rolesData);
        } catch (e) {
          console.log('No roles collection');
        }

        // Fetch lesson groups (from privateLessons collection - same as mobile app)
        try {
          const lessonGroupsRef = collection(db, selectedClub.id, 'privateLessons', 'privateLessons');
          const lessonGroupsSnapshot = await getDocs(lessonGroupsRef);
          const lessonGroupsData = lessonGroupsSnapshot.docs.map(doc => ({
            id: doc.id,
            groupName: doc.data().groupName || '',
            ...doc.data(),
          })) as LessonGroup[];
          setLessonGroups(lessonGroupsData);
        } catch (e) {
          // Lesson groups collection may not exist
        }

        // Fetch teams (from performanceteams collection - same as mobile app)
        try {
          const teamsRef = collection(db, selectedClub.id, 'performanceteams', 'performanceteams');
          const teamsSnapshot = await getDocs(teamsRef);
          const teamsData = teamsSnapshot.docs
            .map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                name: data.name || '',
                ...data,
              } as Team;
            })
            .filter(team => team.status === 'active' || (team as any).status === 'Aktif');
          setTeams(teamsData);
        } catch (e) {
          // Teams collection may not exist
        }

        // Subscribe to reservations
        const reservationsRef = collection(db, selectedClub.id, 'reservations', 'reservations');
        const unsubscribe = onSnapshot(reservationsRef, (snapshot) => {
          const reservationsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as Reservation[];
          setReservations(reservationsData);
          setLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Veriler yüklenirken hata oluştu');
        setLoading(false);
      }
    };

    const unsubscribePromise = fetchData();
    return () => {
      unsubscribePromise.then(unsub => unsub && unsub());
    };
  }, [selectedClub]);

  // Filter reservations
  const filteredReservations = useMemo(() => {
    let filtered = [...reservations];

    // Filter by date
    const selectedDateStr = format(selectedDate, 'dd.MM.yyyy');
    filtered = filtered.filter(r => {
      const resDate = r.date.includes('-') ? formatDateToDisplay(r.date) : r.date;
      return resDate === selectedDateStr;
    });

    // Filter by court
    if (selectedCourtId !== 'all') {
      filtered = filtered.filter(r => r.courtId === selectedCourtId);
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(r => r.status === selectedStatus);
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(r => {
        switch (selectedType) {
          case 'normal': return !r.isChallenge && !r.isTraining && !r.isGift && !r.isLesson;
          case 'match': return r.isChallenge;
          case 'training': return r.isTraining;
          case 'gift': return r.isGift;
          case 'lesson': return r.isLesson;
          default: return true;
        }
      });
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.username?.toLowerCase().includes(query) ||
        r.courtName?.toLowerCase().includes(query) ||
        r.guestName?.toLowerCase().includes(query)
      );
    }

    // Sort by time
    filtered.sort((a, b) => a.time.localeCompare(b.time));

    return filtered;
  }, [reservations, selectedDate, selectedCourtId, selectedStatus, selectedType, searchQuery]);

  // Get court name
  const getCourtName = (courtId: string) => {
    return courts.find(c => c.id === courtId)?.name || courtId;
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedReservation || !selectedClub) return;

    setIsProcessing(true);
    try {
      const reservationRef = doc(db, selectedClub.id, 'reservations', 'reservations', selectedReservation.id);
      await deleteDoc(reservationRef);
      toast.success('Rezervasyon silindi');
      setIsDeleteOpen(false);
      setSelectedReservation(null);
    } catch (error) {
      console.error('Error deleting reservation:', error);
      toast.error('Rezervasyon silinirken hata oluştu');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle cancel
  const handleCancel = async () => {
    if (!selectedReservation || !selectedClub) return;

    setIsProcessing(true);
    try {
      const reservationRef = doc(db, selectedClub.id, 'reservations', 'reservations', selectedReservation.id);
      await updateDoc(reservationRef, { status: 'cancelled' });

      toast.success('Rezervasyon iptal edildi');
      setIsCancelOpen(false);
      setSelectedReservation(null);
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      toast.error('Rezervasyon iptal edilirken hata oluştu');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle private lesson submit - Uses writeBatch for atomic operations (same as mobile app)
  const handlePrivateLessonSubmit = async (data: any) => {
    if (!selectedClub) return;

    try {
      // Calculate lesson dates
      const allDays = eachDayOfInterval({ start: data.startDate, end: data.endDate });
      const datesToReserve = allDays.filter(date => data.selectedDays.includes(getDay(date)));

      if (datesToReserve.length === 0) {
        toast.error('Seçilen tarih aralığında uygun gün bulunamadı');
        return;
      }

      const selectedCourt = courts.find(c => c.id === data.courtId);
      const startTime = data.selectedSlots[0];
      const sortedSlots = [...data.selectedSlots].sort();
      const totalDuration = data.duration;

      // Calculate price per session (simplified - would use priceCalculation utility in real scenario)
      const amountPerReservation = selectedCourt?.hourlyRate
        ? (selectedCourt.hourlyRate / 60) * totalDuration
        : 0;
      const totalAmount = amountPerReservation * datesToReserve.length;

      // Fetch wallet if user is selected
      let walletData: Wallet | null = null;
      let walletDocId: string | null = null;

      if (data.userId) {
        const walletsRef = collection(db, selectedClub.id, 'wallets', 'wallets');
        const walletQuery = query(walletsRef, where('userId', '==', data.userId));
        const walletSnapshot = await getDocs(walletQuery);

        if (!walletSnapshot.empty) {
          const walletDoc = walletSnapshot.docs[0];
          walletData = { id: walletDoc.id, ...walletDoc.data() } as Wallet;
          walletDocId = walletDoc.id;
        }
      }

      // Calculate negative balance usage (same as mobile app)
      let negativeBalanceUsedPerReservation = 0;
      if (data.allowNegativeBalance && walletData && (walletData.balance || 0) < totalAmount) {
        const totalNegativeUsed = totalAmount - (walletData.balance || 0);
        negativeBalanceUsedPerReservation = totalNegativeUsed / datesToReserve.length;
      }

      // Create batch for atomic operations (birebir mobil ile aynı)
      const batch = createBatch();
      const reservationsRef = collection(db, selectedClub.id, 'reservations', 'reservations');

      // Create reservations for each lesson date
      for (const dateObj of datesToReserve) {
        const dateStr = format(dateObj, 'dd.MM.yyyy');
        const reservationRef = doc(reservationsRef);

        batch.set(reservationRef, {
          courtId: data.courtId,
          date: dateStr,
          time: startTime,
          endTime: data.endTime,
          slots: sortedSlots,
          duration: totalDuration,
          userId: data.userId || '',
          username: data.userName || data.groupName,
          totalCost: amountPerReservation,
          amountPaid: amountPerReservation,
          heater: data.heater || false,
          light: data.light || false,
          allowNegativeBalance: data.allowNegativeBalance || false,
          negativeBalanceUsed: negativeBalanceUsedPerReservation,
          createdAt: Timestamp.now(),
          status: 'active',
          bulkGroupName: data.groupName,
          isPrivateLesson: true,
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
        const activityId = `${Date.now()}_admin_private_lesson`;
        const activityRef = getClubSubDoc(
          selectedClub.id,
          'wallets',
          walletDocId,
          'activities',
          activityId
        );
        batch.set(activityRef, {
          service: 'walletScreen.activityLog.privateLessonCreated', // Translation key (same as mobile)
          amount: -totalAmount, // Negative amount (total deduction)
          date: Timestamp.now(),
          status: 'completed',
          createdBy: 'admin',
          courtName: selectedCourt?.name || '',
          lessonGroupName: data.groupName,
          reservationCount: datesToReserve.length,
          startDate: format(data.startDate, 'dd.MM.yyyy'),
          endDate: format(data.endDate, 'dd.MM.yyyy'),
          reservationTime: startTime,
          reservationEndTime: data.endTime,
          duration: totalDuration,
          amountPerSession: amountPerReservation,
        });
      }

      // Commit all operations atomically
      await batch.commit();

      toast.success(`${datesToReserve.length} özel ders rezervasyonu oluşturuldu`);
    } catch (error) {
      console.error('Error creating private lesson:', error);
      toast.error('Özel ders oluşturulurken hata oluştu');
      throw error;
    }
  };

  // Handle team reservation submit - Uses writeBatch for atomic operations (same as mobile app)
  const handleTeamReservationSubmit = async (data: any) => {
    if (!selectedClub) return;

    try {
      // Calculate reservation dates if bulk
      let datesToReserve: Date[] = [];
      if (data.startDate && data.endDate && data.selectedDays?.length > 0) {
        const allDays = eachDayOfInterval({ start: data.startDate, end: data.endDate });
        datesToReserve = allDays.filter(date => data.selectedDays.includes(getDay(date)));
      } else if (data.date) {
        datesToReserve = [data.date];
      }

      if (datesToReserve.length === 0) {
        toast.error('Seçilen tarih aralığında uygun gün bulunamadı');
        return;
      }

      const selectedCourt = courts.find(c => c.id === data.courtId);
      const startTime = data.selectedSlots?.[0] || data.time;
      const sortedSlots = data.selectedSlots ? [...data.selectedSlots].sort() : [startTime];
      const totalDuration = data.duration;

      // Calculate price per session
      const amountPerReservation = selectedCourt?.hourlyRate
        ? (selectedCourt.hourlyRate / 60) * totalDuration
        : 0;
      const totalAmount = amountPerReservation * datesToReserve.length;

      // Fetch wallet for the first user if selected
      const primaryUserId = data.selectedUsers?.[0]?.id || data.userId;
      let walletData: Wallet | null = null;
      let walletDocId: string | null = null;

      if (primaryUserId) {
        const walletsRef = collection(db, selectedClub.id, 'wallets', 'wallets');
        const walletQuery = query(walletsRef, where('userId', '==', primaryUserId));
        const walletSnapshot = await getDocs(walletQuery);

        if (!walletSnapshot.empty) {
          const walletDoc = walletSnapshot.docs[0];
          walletData = { id: walletDoc.id, ...walletDoc.data() } as Wallet;
          walletDocId = walletDoc.id;
        }
      }

      // Calculate negative balance usage (same as mobile app)
      let negativeBalanceUsedPerReservation = 0;
      if (data.allowNegativeBalance && walletData && (walletData.balance || 0) < totalAmount) {
        const totalNegativeUsed = totalAmount - (walletData.balance || 0);
        negativeBalanceUsedPerReservation = totalNegativeUsed / datesToReserve.length;
      }

      // Create batch for atomic operations (birebir mobil ile aynı)
      const batch = createBatch();
      const reservationsRef = collection(db, selectedClub.id, 'reservations', 'reservations');

      // Create reservations for each date
      for (const dateObj of datesToReserve) {
        const dateStr = format(dateObj, 'dd.MM.yyyy');
        const reservationRef = doc(reservationsRef);

        batch.set(reservationRef, {
          courtId: data.courtId,
          date: dateStr,
          time: startTime,
          endTime: data.endTime,
          slots: sortedSlots,
          duration: totalDuration,
          userId: primaryUserId || '',
          username: data.teamName,
          totalCost: amountPerReservation,
          amountPaid: amountPerReservation,
          heater: data.heater || false,
          light: data.light || false,
          allowNegativeBalance: data.allowNegativeBalance || false,
          negativeBalanceUsed: negativeBalanceUsedPerReservation,
          createdAt: Timestamp.now(),
          status: 'active',
          bulkGroupName: `Takım: ${data.teamName}`,
          isTeamReservation: true,
          teamId: data.teamId,
          teamName: data.teamName,
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
        const activityId = `${Date.now()}_admin_team_reservation`;
        const activityRef = getClubSubDoc(
          selectedClub.id,
          'wallets',
          walletDocId,
          'activities',
          activityId
        );
        batch.set(activityRef, {
          service: 'walletScreen.activityLog.teamReservationCreated', // Translation key (same as mobile)
          amount: -totalAmount, // Negative amount (total deduction)
          date: Timestamp.now(),
          status: 'completed',
          createdBy: 'admin',
          courtName: selectedCourt?.name || '',
          teamName: data.teamName,
          reservationCount: datesToReserve.length,
          startDate: datesToReserve.length > 1 ? format(datesToReserve[0], 'dd.MM.yyyy') : format(data.date, 'dd.MM.yyyy'),
          endDate: datesToReserve.length > 1 ? format(datesToReserve[datesToReserve.length - 1], 'dd.MM.yyyy') : format(data.date, 'dd.MM.yyyy'),
          reservationTime: startTime,
          reservationEndTime: data.endTime,
          duration: totalDuration,
          amountPerSession: amountPerReservation,
        });
      }

      // Commit all operations atomically
      await batch.commit();

      toast.success(`${datesToReserve.length} takım rezervasyonu oluşturuldu`);
    } catch (error) {
      console.error('Error creating team reservation:', error);
      toast.error('Takım rezervasyonu oluşturulurken hata oluştu');
      throw error;
    }
  };

  // Handle PDF export
  const handleExportPDF = () => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);

    const monthReservations = reservations.filter(r => {
      const date = new Date(r.date);
      return date >= monthStart && date <= monthEnd;
    });

    exportReservationsPDF(
      monthReservations,
      courts,
      users,
      { start: monthStart, end: monthEnd },
      selectedClub?.name
    );
  };

  // Handle CSV export
  const handleExportCSV = () => {
    exportReservationsCSV(reservations, courts, users);
  };

  // Handle day report
  const handleDayReport = () => {
    exportDayReportPDF(selectedDate, filteredReservations, courts, selectedClub?.name);
  };

  // Navigate dates
  const goToPreviousDay = () => setSelectedDate(prev => addDays(prev, -1));
  const goToNextDay = () => setSelectedDate(prev => addDays(prev, 1));
  const goToToday = () => setSelectedDate(new Date());

  // Stats for selected date
  const dateStats = useMemo(() => {
    const dateReservations = filteredReservations.filter(r => r.status !== 'cancelled');
    return {
      total: filteredReservations.length,
      active: dateReservations.length,
      cancelled: filteredReservations.filter(r => r.status === 'cancelled').length,
      revenue: dateReservations.reduce((sum, r) => sum + (r.amountPaid || 0), 0),
    };
  }, [filteredReservations]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Export Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Dışa Aktar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDayReport}>
                <FileText className="h-4 w-4 mr-2" />
                Günlük Rapor (PDF)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF}>
                <FileText className="h-4 w-4 mr-2" />
                Aylık Rapor (PDF)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportCSV}>
                <FileText className="h-4 w-4 mr-2" />
                CSV Olarak İndir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Stats & Views */}
          <Button variant="outline" onClick={() => setIsUserStatsOpen(true)}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Kullanıcı İstatistikleri
          </Button>
          <Button variant="outline" onClick={() => setIsStatsOpen(true)}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Genel İstatistikler
          </Button>
          <Button variant="outline" onClick={() => setIsCourtsOverviewOpen(true)}>
            <Grid3X3 className="h-4 w-4 mr-2" />
            Kort Görünümü
          </Button>

          {/* New Reservation Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Yeni Rezervasyon
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsNewReservationOpen(true)}>
                <CalendarIcon className="h-4 w-4 mr-2" />
                Tekli Rezervasyon
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsBulkReservationOpen(true)}>
                <Grid3X3 className="h-4 w-4 mr-2" />
                Toplu Rezervasyon
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsPrivateLessonOpen(true)}>
                <GraduationCap className="h-4 w-4 mr-2" />
                Özel Ders Rezervasyonu
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsTeamReservationOpen(true)}>
                <Shield className="h-4 w-4 mr-2" />
                Takım Rezervasyonu
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Date Navigation & Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 justify-between">
            {/* Date Navigation */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={goToPreviousDay}>
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="min-w-[200px]">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {format(selectedDate, 'dd MMMM yyyy, EEEE', { locale: tr })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Button variant="outline" size="icon" onClick={goToNextDay}>
                <ChevronRight className="h-4 w-4" />
              </Button>

              <Button variant="ghost" size="sm" onClick={goToToday}>
                Bugün
              </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Kullanıcı ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>

              <Select value={selectedCourtId} onValueChange={setSelectedCourtId}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Kort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Kortlar</SelectItem>
                  {courts.map(court => (
                    <SelectItem key={court.id} value={court.id}>{court.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Durum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Durumlar</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="pending">Beklemede</SelectItem>
                  <SelectItem value="cancelled">İptal</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Tür" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Türler</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="match">Maç</SelectItem>
                  <SelectItem value="training">Antrenman</SelectItem>
                  <SelectItem value="lesson">Ders</SelectItem>
                  <SelectItem value="gift">Hediye</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  title="Kılavuz Görünümü"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                  title="Liste Görünümü"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'wall' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('wall')}
                  title="Duvar Görünümü"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-4 mt-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Toplam:</span>
              <Badge variant="secondary">{dateStats.total}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Aktif:</span>
              <Badge variant="default" className="bg-green-500">{dateStats.active}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">İptal:</span>
              <Badge variant="destructive">{dateStats.cancelled}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Gelir:</span>
              <Badge variant="outline">{formatCurrency(dateStats.revenue)}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      {viewMode === 'wall' ? (
        <ReservationWall
          courts={courts}
          reservations={filteredReservations}
          selectedDate={selectedDate}
          onReservationClick={(reservation) => {
            setSelectedReservation(reservation);
            setIsDetailOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Courts Overview */}
          <div className="xl:col-span-1">
            <CourtsOverview
              courts={courts}
              reservations={filteredReservations}
              selectedDate={selectedDate}
              onSlotClick={(courtId, time) => {
                setIsNewReservationOpen(true);
              }}
            />
          </div>

          {/* Reservations List */}
          <div className="xl:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Rezervasyonlar</span>
                  <Badge variant="outline">{filteredReservations.length} adet</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredReservations.length === 0 ? (
                  <div className="text-center py-12">
                    <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Bu tarihte rezervasyon bulunmuyor</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-3">
                      <AnimatePresence>
                        {filteredReservations.map((reservation, index) => {
                          const typeInfo = getReservationTypeInfo(reservation);
                          const TypeIcon = typeInfo.icon;
                          const isCancelled = reservation.status === 'cancelled';
                          const isPast = isPastReservation(reservation.date, reservation.time);

                          return (
                            <motion.div
                              key={reservation.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <Card className={cn(
                                "cursor-pointer hover:shadow-md transition-all",
                                isCancelled && "opacity-60 bg-red-50",
                                isPast && !isCancelled && "opacity-80"
                              )}>
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        <Badge className={typeInfo.color}>
                                          <TypeIcon className="h-3 w-3 mr-1" />
                                          {typeInfo.label}
                                        </Badge>
                                        {reservation.heater && (
                                          <Badge variant="outline" className="text-orange-500 border-orange-200">
                                            <Flame className="h-3 w-3 mr-1" />
                                            Isıtıcı
                                          </Badge>
                                        )}
                                        {reservation.light && (
                                          <Badge variant="outline" className="text-yellow-500 border-yellow-200">
                                            <Lightbulb className="h-3 w-3 mr-1" />
                                            Aydınlatma
                                          </Badge>
                                        )}
                                        {isCancelled && (
                                          <Badge variant="destructive">İptal</Badge>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-4 text-sm">
                                        <div className="flex items-center gap-1">
                                          <Clock className="h-4 w-4 text-muted-foreground" />
                                          <span className="font-medium">{reservation.time}</span>
                                          {reservation.endTime && (
                                            <span className="text-muted-foreground">- {reservation.endTime}</span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <MapPin className="h-4 w-4 text-muted-foreground" />
                                          <span>{getCourtName(reservation.courtId)}</span>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2 mt-2">
                                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                                        {reservation.isGuestReservation ? (
                                          <span className="text-orange-600">
                                            {reservation.guestName || 'Misafir'}
                                          </span>
                                        ) : (
                                          <span>{reservation.username}</span>
                                        )}
                                        {reservation.challengeUsername && (
                                          <span className="text-muted-foreground">vs {reservation.challengeUsername}</span>
                                        )}
                                        {reservation.lessonGroupName && (
                                          <Badge variant="outline" className="text-indigo-500 text-xs">
                                            {reservation.lessonGroupName}
                                          </Badge>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-2 mt-2">
                                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">{formatCurrency(reservation.amountPaid)}</span>
                                        {reservation.discountApplied && (
                                          <Badge variant="outline" className="text-green-500 text-xs">
                                            <Percent className="h-3 w-3 mr-1" />
                                            %{reservation.discountPercentage}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>

                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => {
                                          setSelectedReservation(reservation);
                                          setIsDetailOpen(true);
                                        }}>
                                          <Eye className="h-4 w-4 mr-2" />
                                          Detaylar
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        {!isPast && !isCancelled && (
                                          <DropdownMenuItem
                                            onClick={() => {
                                              setSelectedReservation(reservation);
                                              setIsCancelOpen(true);
                                            }}
                                            className="text-orange-600"
                                          >
                                            <XCircle className="h-4 w-4 mr-2" />
                                            İptal Et
                                          </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem
                                          onClick={() => {
                                            setSelectedReservation(reservation);
                                            setIsDeleteOpen(true);
                                          }}
                                          className="text-red-600"
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Sil
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <ReservationDetailDialog
        reservation={selectedReservation}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        courts={courts}
        users={users}
      />

      <NewReservationDialog
        open={isNewReservationOpen}
        onOpenChange={setIsNewReservationOpen}
        courts={courts}
        users={users}
        roles={roles}
        selectedDate={selectedDate}
      />

      <BulkReservationDialog
        open={isBulkReservationOpen}
        onOpenChange={setIsBulkReservationOpen}
        courts={courts}
        users={users}
      />

      <ReservationStatsDialog
        open={isStatsOpen}
        onOpenChange={setIsStatsOpen}
        reservations={reservations}
        courts={courts}
        selectedDate={selectedDate}
      />

      <PrivateLessonWizard
        open={isPrivateLessonOpen}
        onOpenChange={setIsPrivateLessonOpen}
        courts={courts}
        users={users}
        roles={roles}
        lessonGroups={lessonGroups}
        reservations={reservations}
        onSubmit={handlePrivateLessonSubmit}
      />

      <TeamReservationWizard
        open={isTeamReservationOpen}
        onOpenChange={setIsTeamReservationOpen}
        courts={courts}
        users={users}
        roles={roles}
        teams={teams}
        reservations={reservations}
        selectedDate={selectedDate}
        onSubmit={handleTeamReservationSubmit}
      />

      <CourtsOverviewDialog
        open={isCourtsOverviewOpen}
        onOpenChange={setIsCourtsOverviewOpen}
        courts={courts}
        reservations={reservations}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onSlotClick={(courtId, time) => {
          setIsCourtsOverviewOpen(false);
          setIsNewReservationOpen(true);
        }}
      />

      <UserStatisticsDialog
        open={isUserStatsOpen}
        onOpenChange={setIsUserStatsOpen}
        users={users}
        reservations={reservations}
        courts={courts}
      />

      {/* Delete Confirmation */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rezervasyonu Sil</DialogTitle>
            <DialogDescription>
              Bu rezervasyonu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              İptal
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation */}
      <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rezervasyonu İptal Et</DialogTitle>
            <DialogDescription>
              Bu rezervasyonu iptal etmek istediğinizden emin misiniz? Ödeme tutarı kullanıcının cüzdanına iade edilecektir.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelOpen(false)}>
              Vazgeç
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              İptal Et
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
