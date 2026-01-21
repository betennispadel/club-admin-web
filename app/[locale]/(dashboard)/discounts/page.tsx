'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useClubStore } from '@/stores/clubStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Percent,
  Ticket,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Users,
  Calendar,
  Clock,
  Bell,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import type { Court, Coupon, UserForCoupon } from '@/lib/types/discounts';
import {
  fetchCourts,
  fetchCoupons,
  fetchUsersForCoupon,
  deleteCoupon,
  toggleCouponStatus,
  getCouponStatusColor,
} from '@/lib/firebase/discounts';
import CourtDiscountDialog from './components/CourtDiscountDialog';
import CouponDialog from './components/CouponDialog';

export default function DiscountsPage() {
  const t = useTranslations('discounts');
  const { selectedClub } = useClubStore();

  const [activeTab, setActiveTab] = useState('courts');
  const [courts, setCourts] = useState<Court[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [users, setUsers] = useState<UserForCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog states
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [courtDialogOpen, setCourtDialogOpen] = useState(false);
  const [couponDialogOpen, setCouponDialogOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (selectedClub?.id) {
      loadData();
    }
  }, [selectedClub?.id]);

  const loadData = async () => {
    if (!selectedClub?.id) return;
    setLoading(true);
    try {
      const [courtsData, couponsData, usersData] = await Promise.all([
        fetchCourts(selectedClub.id),
        fetchCoupons(selectedClub.id),
        fetchUsersForCoupon(selectedClub.id),
      ]);
      setCourts(courtsData);
      setCoupons(couponsData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error(t('errors.loadError'), {
        description: t('errors.loadErrorDesc'),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCourtClick = (court: Court) => {
    setSelectedCourt(court);
    setCourtDialogOpen(true);
  };

  const handleCreateCoupon = () => {
    setSelectedCoupon(null);
    setCouponDialogOpen(true);
  };

  const handleEditCoupon = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setCouponDialogOpen(true);
  };

  const handleDeleteCoupon = (coupon: Coupon) => {
    setCouponToDelete(coupon);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteCoupon = async () => {
    if (!selectedClub?.id || !couponToDelete) return;
    setActionLoading(couponToDelete.id);
    try {
      await deleteCoupon(selectedClub.id, couponToDelete.id);
      setCoupons((prev) => prev.filter((c) => c.id !== couponToDelete.id));
      toast.success(t('coupon.deleteSuccess'), {
        description: t('coupon.deleteSuccessDesc'),
      });
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast.error(t('errors.deleteError'), {
        description: t('errors.deleteErrorDesc'),
      });
    } finally {
      setActionLoading(null);
      setDeleteDialogOpen(false);
      setCouponToDelete(null);
    }
  };

  const handleToggleCouponStatus = async (coupon: Coupon) => {
    if (!selectedClub?.id) return;
    setActionLoading(coupon.id);
    try {
      await toggleCouponStatus(selectedClub.id, coupon.id, coupon.status);
      setCoupons((prev) =>
        prev.map((c) =>
          c.id === coupon.id
            ? { ...c, status: c.status === 'active' ? 'disabled' : 'active' }
            : c
        )
      );
      toast.success(t('coupon.statusUpdated'), {
        description: t('coupon.statusUpdatedDesc'),
      });
    } catch (error) {
      console.error('Error toggling coupon status:', error);
      toast.error(t('errors.updateError'), {
        description: t('errors.updateErrorDesc'),
      });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredCoupons = coupons.filter(
    (coupon) =>
      coupon.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coupon.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDiscountCount = (court: Court) => {
    return court.appliedDiscounts?.length || 0;
  };

  const formatCouponValue = (coupon: Coupon) => {
    if (coupon.type === 'percentage') {
      return `%${coupon.value}`;
    }
    return `${coupon.value} ₺`;
  };

  const formatDate = (timestamp: { toDate: () => Date }) => {
    if (!timestamp?.toDate) return '-';
    return timestamp.toDate().toLocaleDateString('tr-TR');
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="courts" className="flex items-center gap-2">
            <Percent className="h-4 w-4" />
            {t('tabs.courtDiscounts')}
          </TabsTrigger>
          <TabsTrigger value="coupons" className="flex items-center gap-2">
            <Ticket className="h-4 w-4" />
            {t('tabs.coupons')}
          </TabsTrigger>
        </TabsList>

        {/* Court Discounts Tab */}
        <TabsContent value="courts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5" />
                {t('courtDiscounts.title')}
              </CardTitle>
              <CardDescription>{t('courtDiscounts.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              {courts.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">{t('courtDiscounts.noCourts')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {courts.map((court) => (
                    <Card
                      key={court.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleCourtClick(court)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{court.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {court.availableFrom} - {court.availableUntil}
                            </p>
                          </div>
                          <Badge
                            variant={court.status === 'active' ? 'default' : 'secondary'}
                          >
                            {court.status === 'active' ? t('status.active') : t('status.maintenance')}
                          </Badge>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Percent className="h-4 w-4 text-primary" />
                            <span className="text-sm">
                              {getDiscountCount(court)} {t('courtDiscounts.activeDiscounts')}
                            </span>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>

                        {court.appliedDiscounts && court.appliedDiscounts.length > 0 && (
                          <div className="mt-3 space-y-1">
                            {court.appliedDiscounts.slice(0, 2).map((discount) => (
                              <div
                                key={discount.id}
                                className="text-xs bg-primary/10 text-primary px-2 py-1 rounded flex items-center gap-1"
                              >
                                <span>%{discount.percentage}</span>
                                {discount.isAllHours ? (
                                  <span>• {t('courtDiscounts.allHours')}</span>
                                ) : discount.timeRange ? (
                                  <span>
                                    • {discount.timeRange.from} - {discount.timeRange.until}
                                  </span>
                                ) : null}
                              </div>
                            ))}
                            {court.appliedDiscounts.length > 2 && (
                              <p className="text-xs text-muted-foreground">
                                +{court.appliedDiscounts.length - 2} {t('courtDiscounts.more')}
                              </p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Coupons Tab */}
        <TabsContent value="coupons" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Ticket className="h-5 w-5" />
                    {t('coupons.title')}
                  </CardTitle>
                  <CardDescription>{t('coupons.description')}</CardDescription>
                </div>
                <Button onClick={handleCreateCoupon}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('coupons.createCoupon')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('coupons.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {filteredCoupons.length === 0 ? (
                <div className="text-center py-12">
                  <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {searchQuery ? t('coupons.noSearchResults') : t('coupons.noCoupons')}
                  </p>
                  {!searchQuery && (
                    <Button className="mt-4" onClick={handleCreateCoupon}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t('coupons.createFirst')}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCoupons.map((coupon) => (
                    <Card key={coupon.id} className="relative overflow-hidden">
                      <div
                        className="absolute top-0 left-0 w-1 h-full"
                        style={{ backgroundColor: getCouponStatusColor(coupon.status) }}
                      />
                      <CardContent className="p-4 pl-5">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <code className="font-mono font-bold text-lg">{coupon.code}</code>
                              <Badge
                                variant="outline"
                                style={{
                                  borderColor: getCouponStatusColor(coupon.status),
                                  color: getCouponStatusColor(coupon.status),
                                }}
                              >
                                {t(`coupon.status.${coupon.status}`)}
                              </Badge>
                            </div>
                            {coupon.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {coupon.description}
                              </p>
                            )}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" disabled={actionLoading === coupon.id}>
                                {actionLoading === coupon.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MoreHorizontal className="h-4 w-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditCoupon(coupon)}>
                                <Edit className="h-4 w-4 mr-2" />
                                {t('actions.edit')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleCouponStatus(coupon)}>
                                {coupon.status === 'active' ? (
                                  <>
                                    <ToggleLeft className="h-4 w-4 mr-2" />
                                    {t('actions.disable')}
                                  </>
                                ) : (
                                  <>
                                    <ToggleRight className="h-4 w-4 mr-2" />
                                    {t('actions.enable')}
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteCoupon(coupon)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {t('actions.delete')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="mt-4 space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{t('coupon.value')}</span>
                            <span className="font-semibold text-primary">
                              {formatCouponValue(coupon)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {t('coupon.usage')}
                            </span>
                            <span>
                              {coupon.currentUses} / {coupon.maxUses || '∞'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {t('coupon.validUntil')}
                            </span>
                            <span>{formatDate(coupon.validUntil)}</span>
                          </div>

                          {coupon.assignedUserIds && coupon.assignedUserIds.length > 0 && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Users className="h-3 w-3" />
                              {t('coupon.assignedTo', { count: coupon.assignedUserIds.length })}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Court Discount Dialog */}
      {selectedCourt && (
        <CourtDiscountDialog
          open={courtDialogOpen}
          onOpenChange={setCourtDialogOpen}
          court={selectedCourt}
          onUpdate={(updatedCourt) => {
            setCourts((prev) =>
              prev.map((c) => (c.id === updatedCourt.id ? updatedCourt : c))
            );
          }}
        />
      )}

      {/* Coupon Dialog */}
      <CouponDialog
        open={couponDialogOpen}
        onOpenChange={setCouponDialogOpen}
        coupon={selectedCoupon}
        users={users}
        onSuccess={() => {
          loadData();
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('coupon.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('coupon.deleteDescription', { code: couponToDelete?.code || '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteCoupon}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('actions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
