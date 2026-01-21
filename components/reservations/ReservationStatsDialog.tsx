'use client';

import { useMemo } from 'react';
import { Reservation, Court } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Calendar,
  TrendingUp,
  DollarSign,
  Users,
  Clock,
  MapPin,
  Flame,
  Lightbulb,
  Trophy,
  Gift,
  Percent,
  Tag,
  BarChart3,
} from 'lucide-react';

interface ReservationStatsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservations: Reservation[];
  courts: Court[];
  selectedDate: Date;
}

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
};

// Get date range for the month
const getMonthRange = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0);
  return { startOfMonth, endOfMonth };
};

export function ReservationStatsDialog({
  open,
  onOpenChange,
  reservations,
  courts,
  selectedDate,
}: ReservationStatsDialogProps) {
  // Calculate stats
  const stats = useMemo(() => {
    const activeReservations = reservations.filter(r => r.status !== 'cancelled');
    const cancelledReservations = reservations.filter(r => r.status === 'cancelled');

    // Total counts
    const totalCount = reservations.length;
    const activeCount = activeReservations.length;
    const cancelledCount = cancelledReservations.length;

    // Revenue
    const totalRevenue = activeReservations.reduce((sum, r) => sum + (r.amountPaid || 0), 0);
    const originalRevenue = activeReservations.reduce((sum, r) => sum + (r.originalPrice || r.amountPaid || 0), 0);
    const totalDiscount = originalRevenue - totalRevenue;

    // By court
    const revenueByCourtMap = new Map<string, { count: number; revenue: number }>();
    courts.forEach(court => {
      revenueByCourtMap.set(court.id, { count: 0, revenue: 0 });
    });
    activeReservations.forEach(r => {
      const courtData = revenueByCourtMap.get(r.courtId) || { count: 0, revenue: 0 };
      courtData.count++;
      courtData.revenue += r.amountPaid || 0;
      revenueByCourtMap.set(r.courtId, courtData);
    });
    const revenueByCourt = Array.from(revenueByCourtMap.entries()).map(([courtId, data]) => {
      const court = courts.find(c => c.id === courtId);
      return {
        courtId,
        courtName: court?.name || courtId,
        count: data.count,
        revenue: data.revenue,
      };
    }).sort((a, b) => b.revenue - a.revenue);

    // By type
    const typeStats = {
      normal: { count: 0, revenue: 0 },
      training: { count: 0, revenue: 0 },
      challenge: { count: 0, revenue: 0 },
      gift: { count: 0, revenue: 0 },
    };
    activeReservations.forEach(r => {
      const amount = r.amountPaid || 0;
      if (r.isTraining) {
        typeStats.training.count++;
        typeStats.training.revenue += amount;
      } else if (r.isChallenge) {
        typeStats.challenge.count++;
        typeStats.challenge.revenue += amount;
      } else if (r.isGift) {
        typeStats.gift.count++;
        typeStats.gift.revenue += amount;
      } else {
        typeStats.normal.count++;
        typeStats.normal.revenue += amount;
      }
    });

    // Heater & Light usage
    const heaterCount = activeReservations.filter(r => r.heater).length;
    const lightCount = activeReservations.filter(r => r.light).length;

    // Discount & Coupon usage
    const discountUsed = activeReservations.filter(r => r.discountApplied).length;
    const couponUsed = activeReservations.filter(r => r.couponApplied).length;
    const totalCouponDiscount = activeReservations
      .filter(r => r.couponApplied)
      .reduce((sum, r) => sum + (r.couponDiscountAmount || 0), 0);

    // Guest reservations
    const guestReservations = activeReservations.filter(r => r.isGuestReservation).length;

    // Time distribution (which hours are most popular)
    const hourDistribution = new Map<number, number>();
    activeReservations.forEach(r => {
      if (r.time) {
        const hour = parseInt(r.time.split(':')[0], 10);
        hourDistribution.set(hour, (hourDistribution.get(hour) || 0) + 1);
      }
    });
    const peakHours = Array.from(hourDistribution.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([hour, count]) => ({ hour: `${String(hour).padStart(2, '0')}:00`, count }));

    // Average reservation value
    const avgReservationValue = activeCount > 0 ? totalRevenue / activeCount : 0;

    return {
      totalCount,
      activeCount,
      cancelledCount,
      totalRevenue,
      originalRevenue,
      totalDiscount,
      revenueByCourt,
      typeStats,
      heaterCount,
      lightCount,
      discountUsed,
      couponUsed,
      totalCouponDiscount,
      guestReservations,
      peakHours,
      avgReservationValue,
    };
  }, [reservations, courts]);

  const monthName = selectedDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Rezervasyon İstatistikleri - {monthName}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[70vh] pr-4">
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <span className="text-sm text-muted-foreground">Toplam</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{stats.totalCount}</p>
                  <div className="flex gap-2 mt-1 text-xs">
                    <span className="text-green-600">{stats.activeCount} aktif</span>
                    <span className="text-red-600">{stats.cancelledCount} iptal</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-muted-foreground">Toplam Gelir</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(stats.totalRevenue)}</p>
                  {stats.totalDiscount > 0 && (
                    <p className="text-xs text-red-500 mt-1">
                      -{formatCurrency(stats.totalDiscount)} indirim
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-purple-500" />
                    <span className="text-sm text-muted-foreground">Ort. Değer</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(stats.avgReservationValue)}</p>
                  <p className="text-xs text-muted-foreground mt-1">rezervasyon başına</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-orange-500" />
                    <span className="text-sm text-muted-foreground">Misafir</span>
                  </div>
                  <p className="text-2xl font-bold mt-1">{stats.guestReservations}</p>
                  <p className="text-xs text-muted-foreground mt-1">misafir rezervasyonu</p>
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* Revenue by Court */}
            <div>
              <h3 className="font-semibold flex items-center gap-2 mb-3">
                <MapPin className="h-4 w-4" />
                Kort Bazında Gelir
              </h3>
              <div className="space-y-2">
                {stats.revenueByCourt.map(court => {
                  const percentage = stats.totalRevenue > 0
                    ? (court.revenue / stats.totalRevenue) * 100
                    : 0;
                  return (
                    <div key={court.courtId} className="flex items-center gap-3">
                      <div className="w-24 text-sm font-medium truncate">{court.courtName}</div>
                      <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all"
                          style={{ width: `${Math.max(percentage, 2)}%` }}
                        />
                      </div>
                      <div className="w-20 text-sm text-right">{court.count} rez.</div>
                      <div className="w-28 text-sm font-medium text-right">
                        {formatCurrency(court.revenue)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Reservation Types */}
            <div>
              <h3 className="font-semibold flex items-center gap-2 mb-3">
                <Tag className="h-4 w-4" />
                Rezervasyon Türleri
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Normal</span>
                  </div>
                  <p className="text-lg font-semibold">{stats.typeStats.normal.count}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(stats.typeStats.normal.revenue)}
                  </p>
                </div>

                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">Antrenman</span>
                  </div>
                  <p className="text-lg font-semibold">{stats.typeStats.training.count}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(stats.typeStats.training.revenue)}
                  </p>
                </div>

                <div className="bg-orange-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">Maç</span>
                  </div>
                  <p className="text-lg font-semibold">{stats.typeStats.challenge.count}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(stats.typeStats.challenge.revenue)}
                  </p>
                </div>

                <div className="bg-green-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Gift className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Hediye</span>
                  </div>
                  <p className="text-lg font-semibold">{stats.typeStats.gift.count}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(stats.typeStats.gift.revenue)}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Additional Services */}
            <div>
              <h3 className="font-semibold flex items-center gap-2 mb-3">
                <Flame className="h-4 w-4" />
                Ek Hizmetler
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between bg-orange-50 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Flame className="h-5 w-5 text-orange-500" />
                    <span>Isıtıcı Kullanımı</span>
                  </div>
                  <Badge variant="outline" className="text-orange-600 border-orange-200">
                    {stats.heaterCount} kez
                  </Badge>
                </div>

                <div className="flex items-center justify-between bg-yellow-50 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                    <span>Aydınlatma Kullanımı</span>
                  </div>
                  <Badge variant="outline" className="text-yellow-600 border-yellow-200">
                    {stats.lightCount} kez
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* Discounts & Coupons */}
            <div>
              <h3 className="font-semibold flex items-center gap-2 mb-3">
                <Percent className="h-4 w-4" />
                İndirimler ve Kuponlar
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Percent className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Rol İndirimi</span>
                  </div>
                  <p className="text-lg font-semibold">{stats.discountUsed} rezervasyon</p>
                  <p className="text-xs text-muted-foreground">indirim uygulandı</p>
                </div>

                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Kupon Kullanımı</span>
                  </div>
                  <p className="text-lg font-semibold">{stats.couponUsed} rezervasyon</p>
                  <p className="text-xs text-green-600">
                    {formatCurrency(stats.totalCouponDiscount)} tasarruf
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Peak Hours */}
            <div>
              <h3 className="font-semibold flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4" />
                En Yoğun Saatler
              </h3>
              <div className="space-y-2">
                {stats.peakHours.length > 0 ? (
                  stats.peakHours.map((item, idx) => {
                    const maxCount = stats.peakHours[0]?.count || 1;
                    const percentage = (item.count / maxCount) * 100;
                    return (
                      <div key={item.hour} className="flex items-center gap-3">
                        <div className="w-8 text-sm font-medium text-muted-foreground">
                          #{idx + 1}
                        </div>
                        <div className="w-16 text-sm font-medium">{item.hour}</div>
                        <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="w-20 text-sm text-right">{item.count} rez.</div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground">Yeterli veri yok</p>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
