'use client';

import { Reservation, Court, User } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Clock,
  User as UserIcon,
  MapPin,
  CreditCard,
  Flame,
  Lightbulb,
  Calendar,
  Users,
  Trophy,
  Gift,
  Percent,
  Tag,
  Phone,
  Mail,
} from 'lucide-react';

interface ReservationDetailDialogProps {
  reservation: Reservation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courts: Court[];
  users: User[];
}

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
};

// Get reservation type info
const getReservationTypeInfo = (item: Reservation) => {
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
  return { label: 'Normal', color: 'bg-gray-100 text-gray-700', icon: Calendar };
};

export function ReservationDetailDialog({
  reservation,
  open,
  onOpenChange,
  courts,
  users,
}: ReservationDetailDialogProps) {
  if (!reservation) return null;

  const court = courts.find(c => c.id === reservation.courtId);
  const user = users.find(u => u.id === reservation.userId);
  const typeInfo = getReservationTypeInfo(reservation);
  const TypeIcon = typeInfo.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Rezervasyon Detayları
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status & Type */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={typeInfo.color}>
              <TypeIcon className="h-3 w-3 mr-1" />
              {typeInfo.label}
            </Badge>
            {reservation.status === 'cancelled' && (
              <Badge variant="destructive">İptal Edildi</Badge>
            )}
            {reservation.status === 'pending' && (
              <Badge variant="secondary">Beklemede</Badge>
            )}
            {reservation.status === 'active' && (
              <Badge className="bg-green-100 text-green-700">Aktif</Badge>
            )}
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
          </div>

          <Separator />

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Tarih</p>
                <p className="font-medium">{reservation.date}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Saat</p>
                <p className="font-medium">
                  {reservation.time}
                  {reservation.endTime && ` - ${reservation.endTime}`}
                </p>
              </div>
            </div>
          </div>

          {/* Court */}
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Kort</p>
              <p className="font-medium">{court?.name || reservation.courtId}</p>
            </div>
          </div>

          <Separator />

          {/* User Info */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Kullanıcı Bilgileri</h4>

            {reservation.isGuestReservation ? (
              <div className="bg-orange-50 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-orange-500" />
                  <span className="font-medium text-orange-700">Misafir Rezervasyonu</span>
                </div>
                {reservation.guestName && (
                  <p className="text-sm">İsim: {reservation.guestName}</p>
                )}
                {reservation.guestEmail && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-3 w-3" />
                    {reservation.guestEmail}
                  </div>
                )}
                {reservation.guestPhone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-3 w-3" />
                    {reservation.guestPhone}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{reservation.username}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>
            )}

            {/* Challenge opponent */}
            {reservation.isChallenge && reservation.challengeUsername && (
              <div className="flex items-center gap-3 pt-2 border-t">
                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Rakip</p>
                  <p className="font-medium">{reservation.challengeUsername}</p>
                </div>
              </div>
            )}

            {/* Joint payment */}
            {reservation.jointPayment && reservation.jointUsername && (
              <div className="flex items-center gap-3 pt-2 border-t">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ortak Ödeme</p>
                  <p className="font-medium">{reservation.jointUsername}</p>
                  {reservation.jointAmount && (
                    <p className="text-sm text-muted-foreground">
                      Payı: {formatCurrency(reservation.jointAmount)}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Payment Info */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Ödeme Bilgileri</h4>

            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Ödenen Tutar</span>
                <span className="font-semibold text-lg">{formatCurrency(reservation.amountPaid)}</span>
              </div>

              {reservation.originalPrice && reservation.originalPrice !== reservation.amountPaid && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Orijinal Fiyat</span>
                  <span className="line-through text-muted-foreground">
                    {formatCurrency(reservation.originalPrice)}
                  </span>
                </div>
              )}

              {reservation.discountApplied && (
                <div className="flex items-center gap-2 text-sm">
                  <Percent className="h-3 w-3 text-green-500" />
                  <span className="text-green-600">%{reservation.discountPercentage} indirim uygulandı</span>
                </div>
              )}

              {reservation.couponApplied && (
                <div className="flex items-center gap-2 text-sm">
                  <Tag className="h-3 w-3 text-blue-500" />
                  <span className="text-blue-600">
                    Kupon: {reservation.couponCode} ({formatCurrency(reservation.couponDiscountAmount || 0)})
                  </span>
                </div>
              )}

              {reservation.allowNegativeBalance && (
                <div className="flex items-center gap-2 text-sm">
                  <CreditCard className="h-3 w-3 text-red-500" />
                  <span className="text-red-600">Eksi bakiye kullanıldı</span>
                </div>
              )}
            </div>
          </div>

          {/* Gift info */}
          {reservation.isGift && reservation.giftedByUsername && (
            <>
              <Separator />
              <div className="bg-green-50 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-700">Hediye Rezervasyonu</span>
                </div>
                <p className="text-sm">Hediye Eden: {reservation.giftedByUsername}</p>
                {reservation.giftMessage && (
                  <p className="text-sm italic">&quot;{reservation.giftMessage}&quot;</p>
                )}
              </div>
            </>
          )}

          {/* Bulk group */}
          {reservation.bulkGroupName && (
            <>
              <Separator />
              <div className="flex items-center gap-2 text-sm">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Grup:</span>
                <span>{reservation.bulkGroupName}</span>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
