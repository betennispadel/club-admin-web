'use client';

import { useMemo, useState } from 'react';
import { User, Reservation, Court } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  Search,
  User as UserIcon,
  Calendar,
  Clock,
  MapPin,
  TrendingUp,
  Wallet,
  BarChart3,
  ChevronRight,
  Trophy,
  GraduationCap,
  Gift,
  X,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, parse } from 'date-fns';
import { tr } from 'date-fns/locale';

// Parse date string in dd.MM.yyyy or yyyy-MM-dd format
const parseReservationDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();

  // Check if format is dd.MM.yyyy
  if (dateStr.includes('.')) {
    const [day, month, year] = dateStr.split('.').map(Number);
    return new Date(year, month - 1, day);
  }

  // Check if format is yyyy-MM-dd
  if (dateStr.includes('-')) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  return new Date(dateStr);
};
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface UserStatisticsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: User[];
  reservations: Reservation[];
  courts: Court[];
}

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
};

// Get reservation type badge
const getReservationTypeBadge = (reservation: Reservation) => {
  if (reservation.isTraining) {
    return <Badge className="bg-purple-100 text-purple-700 text-xs">Antrenman</Badge>;
  }
  if (reservation.isChallenge) {
    return <Badge className="bg-orange-100 text-orange-700 text-xs">Maç</Badge>;
  }
  if (reservation.isGift) {
    return <Badge className="bg-green-100 text-green-700 text-xs">Hediye</Badge>;
  }
  if (reservation.isLesson) {
    return <Badge className="bg-indigo-100 text-indigo-700 text-xs">Ders</Badge>;
  }
  return <Badge className="bg-gray-100 text-gray-700 text-xs">Normal</Badge>;
};

export function UserStatisticsDialog({
  open,
  onOpenChange,
  users,
  reservations,
  courts,
}: UserStatisticsDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Filter users
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(
      u =>
        u.username?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  // Get user statistics
  const userStats = useMemo(() => {
    if (!selectedUser) return null;

    const userReservations = reservations.filter(
      r => r.userId === selectedUser.id && r.status !== 'cancelled'
    );

    // Total stats
    const totalReservations = userReservations.length;
    const totalSpent = userReservations.reduce((sum, r) => sum + (r.amountPaid || 0), 0);
    const totalHours = userReservations.reduce((sum, r) => {
      const duration = r.duration || 60;
      return sum + duration / 60;
    }, 0);

    // Type breakdown
    const normalCount = userReservations.filter(r => !r.isTraining && !r.isChallenge && !r.isGift && !r.isLesson).length;
    const trainingCount = userReservations.filter(r => r.isTraining).length;
    const matchCount = userReservations.filter(r => r.isChallenge).length;
    const giftCount = userReservations.filter(r => r.isGift).length;
    const lessonCount = userReservations.filter(r => r.isLesson).length;

    // Monthly data (last 6 months)
    const now = new Date();
    const months = eachMonthOfInterval({
      start: subMonths(now, 5),
      end: now,
    });

    const monthlyData = months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      const monthReservations = userReservations.filter(r => {
        const date = new Date(r.date);
        return date >= monthStart && date <= monthEnd;
      });

      return {
        month: format(month, 'MMM', { locale: tr }),
        reservations: monthReservations.length,
        spent: monthReservations.reduce((sum, r) => sum + (r.amountPaid || 0), 0),
      };
    });

    // Most used courts
    const courtUsage: Record<string, number> = {};
    userReservations.forEach(r => {
      courtUsage[r.courtId] = (courtUsage[r.courtId] || 0) + 1;
    });
    const topCourts = Object.entries(courtUsage)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([courtId, count]) => {
        const court = courts.find(c => c.id === courtId);
        return { name: court?.name || courtId, count };
      });

    // Recent reservations
    const recentReservations = [...userReservations]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    return {
      totalReservations,
      totalSpent,
      totalHours,
      normalCount,
      trainingCount,
      matchCount,
      giftCount,
      lessonCount,
      monthlyData,
      topCourts,
      recentReservations,
    };
  }, [selectedUser, reservations, courts]);

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
  };

  const handleBack = () => {
    setSelectedUser(null);
    setSearchQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {selectedUser ? (
              <>
                <Button variant="ghost" size="icon" onClick={handleBack} className="mr-2">
                  <ChevronRight className="h-4 w-4 rotate-180" />
                </Button>
                <UserIcon className="h-5 w-5" />
                {selectedUser.username} - İstatistikler
              </>
            ) : (
              <>
                <BarChart3 className="h-5 w-5" />
                Kullanıcı İstatistikleri
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {!selectedUser ? (
          // User Selection
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Kullanıcı ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {filteredUsers.map((user) => {
                  const userReservationCount = reservations.filter(
                    r => r.userId === user.id && r.status !== 'cancelled'
                  ).length;

                  return (
                    <button
                      key={user.id}
                      onClick={() => handleUserSelect(user)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium">{user.username}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                      <Badge variant="secondary">{userReservationCount} rezervasyon</Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </button>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <UserIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Kullanıcı bulunamadı</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        ) : (
          // User Statistics
          <ScrollArea className="flex-1">
            <div className="space-y-6 pr-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-100">
                        <Calendar className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{userStats?.totalReservations}</p>
                        <p className="text-xs text-muted-foreground">Toplam Rezervasyon</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-100">
                        <Wallet className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{formatCurrency(userStats?.totalSpent || 0)}</p>
                        <p className="text-xs text-muted-foreground">Toplam Harcama</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-100">
                        <Clock className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{userStats?.totalHours.toFixed(1)}</p>
                        <p className="text-xs text-muted-foreground">Toplam Saat</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="overview" className="flex-1">Genel Bakış</TabsTrigger>
                  <TabsTrigger value="history" className="flex-1">Geçmiş</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6 mt-4">
                  {/* Type Breakdown */}
                  <div>
                    <h4 className="font-medium mb-3">Rezervasyon Türleri</h4>
                    <div className="grid grid-cols-5 gap-2">
                      <div className="p-3 rounded-lg bg-gray-50 text-center">
                        <Calendar className="h-5 w-5 mx-auto mb-1 text-gray-500" />
                        <p className="text-lg font-semibold">{userStats?.normalCount}</p>
                        <p className="text-xs text-muted-foreground">Normal</p>
                      </div>
                      <div className="p-3 rounded-lg bg-purple-50 text-center">
                        <GraduationCap className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                        <p className="text-lg font-semibold">{userStats?.trainingCount}</p>
                        <p className="text-xs text-muted-foreground">Antrenman</p>
                      </div>
                      <div className="p-3 rounded-lg bg-orange-50 text-center">
                        <Trophy className="h-5 w-5 mx-auto mb-1 text-orange-500" />
                        <p className="text-lg font-semibold">{userStats?.matchCount}</p>
                        <p className="text-xs text-muted-foreground">Maç</p>
                      </div>
                      <div className="p-3 rounded-lg bg-green-50 text-center">
                        <Gift className="h-5 w-5 mx-auto mb-1 text-green-500" />
                        <p className="text-lg font-semibold">{userStats?.giftCount}</p>
                        <p className="text-xs text-muted-foreground">Hediye</p>
                      </div>
                      <div className="p-3 rounded-lg bg-indigo-50 text-center">
                        <GraduationCap className="h-5 w-5 mx-auto mb-1 text-indigo-500" />
                        <p className="text-lg font-semibold">{userStats?.lessonCount}</p>
                        <p className="text-xs text-muted-foreground">Ders</p>
                      </div>
                    </div>
                  </div>

                  {/* Monthly Chart */}
                  <div>
                    <h4 className="font-medium mb-3">Aylık Rezervasyon</h4>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={userStats?.monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip
                            formatter={(value, name) =>
                              name === 'reservations'
                                ? [`${value} rezervasyon`, 'Rezervasyon']
                                : [formatCurrency(value as number), 'Harcama']
                            }
                          />
                          <Bar dataKey="reservations" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Top Courts */}
                  {userStats?.topCourts && userStats.topCourts.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">En Çok Kullanılan Kortlar</h4>
                      <div className="space-y-2">
                        {userStats.topCourts.map((court, index) => (
                          <div
                            key={court.name}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                                {index + 1}
                              </span>
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{court.name}</span>
                            </div>
                            <Badge variant="secondary">{court.count} kez</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="history" className="mt-4">
                  <div className="space-y-2">
                    {userStats?.recentReservations.map((reservation) => {
                      const court = courts.find(c => c.id === reservation.courtId);
                      return (
                        <div
                          key={reservation.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-center min-w-[50px]">
                              <p className="text-xs text-muted-foreground">
                                {format(parseReservationDate(reservation.date), 'MMM', { locale: tr })}
                              </p>
                              <p className="text-lg font-bold">
                                {format(parseReservationDate(reservation.date), 'd')}
                              </p>
                            </div>
                            <Separator orientation="vertical" className="h-10" />
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{court?.name}</p>
                                {getReservationTypeBadge(reservation)}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {reservation.time}
                                {reservation.endTime && ` - ${reservation.endTime}`}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(reservation.amountPaid)}</p>
                            <Badge
                              variant={reservation.status === 'cancelled' ? 'destructive' : 'outline'}
                              className="text-xs"
                            >
                              {reservation.status === 'cancelled' ? 'İptal' : 'Aktif'}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                    {(!userStats?.recentReservations || userStats.recentReservations.length === 0) && (
                      <div className="text-center py-12 text-muted-foreground">
                        <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Geçmiş rezervasyon bulunamadı</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
