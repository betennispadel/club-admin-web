'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useClubStore } from '@/stores/clubStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Percent,
  Clock,
  Plus,
  Trash2,
  Bell,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Court, AppliedDiscount, CourtDiscountFormData, DEFAULT_COURT_DISCOUNT_FORM } from '@/lib/types/discounts';
import {
  addCourtDiscount,
  removeCourtDiscount,
  clearAllCourtDiscounts,
  sendDiscountNotification,
  formatTimeRange,
} from '@/lib/firebase/discounts';

interface CourtDiscountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  court: Court;
  onUpdate: (court: Court) => void;
}

export default function CourtDiscountDialog({
  open,
  onOpenChange,
  court,
  onUpdate,
}: CourtDiscountDialogProps) {
  const t = useTranslations('discounts.courtDiscounts');
  const tCommon = useTranslations('discounts');
  const { selectedClub } = useClubStore();

  const [formData, setFormData] = useState<CourtDiscountFormData>({
    percentage: '',
    fromTime: '08:00',
    untilTime: '22:00',
    applyToAllHours: true,
  });
  const [loading, setLoading] = useState(false);
  const [sendingNotification, setSendingNotification] = useState<string | null>(null);
  const [deletingDiscount, setDeletingDiscount] = useState<string | null>(null);

  const discounts = court.appliedDiscounts || [];

  const handleAddDiscount = async () => {
    if (!selectedClub?.id) return;

    const percentage = parseInt(formData.percentage, 10);
    if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
      toast.error(t('errors.invalidPercentage'), {
        description: t('errors.invalidPercentageDesc'),
      });
      return;
    }

    if (!formData.applyToAllHours) {
      if (!formData.fromTime || !formData.untilTime) {
        toast.error(t('errors.invalidTimeRange'), {
          description: t('errors.invalidTimeRangeDesc'),
        });
        return;
      }
    }

    setLoading(true);
    try {
      const newDiscount: Omit<AppliedDiscount, 'id' | 'appliedAt'> = {
        percentage,
        isAllHours: formData.applyToAllHours,
        ...(formData.applyToAllHours
          ? {}
          : {
              timeRange: {
                from: formData.fromTime,
                until: formData.untilTime,
              },
            }),
      };

      const updatedDiscounts = await addCourtDiscount(
        selectedClub.id,
        court.id,
        discounts,
        newDiscount
      );

      onUpdate({
        ...court,
        appliedDiscounts: updatedDiscounts,
      });

      // Reset form
      setFormData({
        percentage: '',
        fromTime: '08:00',
        untilTime: '22:00',
        applyToAllHours: true,
      });

      toast.success(t('addSuccess'), {
        description: t('addSuccessDesc'),
      });
    } catch (error) {
      console.error('Error adding discount:', error);
      toast.error(t('errors.addError'), {
        description: t('errors.addErrorDesc'),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDiscount = async (discountId: string) => {
    if (!selectedClub?.id) return;

    setDeletingDiscount(discountId);
    try {
      const updatedDiscounts = await removeCourtDiscount(
        selectedClub.id,
        court.id,
        discounts,
        discountId
      );

      onUpdate({
        ...court,
        appliedDiscounts: updatedDiscounts,
      });

      toast.success(t('removeSuccess'), {
        description: t('removeSuccessDesc'),
      });
    } catch (error) {
      console.error('Error removing discount:', error);
      toast.error(t('errors.removeError'), {
        description: t('errors.removeErrorDesc'),
      });
    } finally {
      setDeletingDiscount(null);
    }
  };

  const handleClearAllDiscounts = async () => {
    if (!selectedClub?.id) return;

    setLoading(true);
    try {
      await clearAllCourtDiscounts(selectedClub.id, court.id);

      onUpdate({
        ...court,
        appliedDiscounts: [],
      });

      toast.success(t('clearSuccess'), {
        description: t('clearSuccessDesc'),
      });
    } catch (error) {
      console.error('Error clearing discounts:', error);
      toast.error(t('errors.clearError'), {
        description: t('errors.clearErrorDesc'),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async (discount: AppliedDiscount) => {
    if (!selectedClub?.id) return;

    setSendingNotification(discount.id);
    try {
      const count = await sendDiscountNotification(
        selectedClub.id,
        selectedClub.name || 'Club',
        court.name,
        discount.percentage,
        discount.timeRange
      );

      toast.success(t('notificationSent'), {
        description: t('notificationSentDesc', { count }),
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error(t('errors.notificationError'), {
        description: t('errors.notificationErrorDesc'),
      });
    } finally {
      setSendingNotification(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            {court.name} - {t('dialogTitle')}
          </DialogTitle>
          <DialogDescription>{t('dialogDescription')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Discount Form */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <h4 className="font-medium flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {t('addNew')}
            </h4>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="percentage">{t('percentage')}</Label>
                <div className="relative">
                  <Input
                    id="percentage"
                    type="number"
                    min="1"
                    max="100"
                    placeholder="10"
                    value={formData.percentage}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, percentage: e.target.value }))
                    }
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    %
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="allHours" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {t('allHours')}
                </Label>
                <Switch
                  id="allHours"
                  checked={formData.applyToAllHours}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, applyToAllHours: checked }))
                  }
                />
              </div>

              {!formData.applyToAllHours && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="fromTime">{t('from')}</Label>
                    <Input
                      id="fromTime"
                      type="time"
                      value={formData.fromTime}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, fromTime: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="untilTime">{t('until')}</Label>
                    <Input
                      id="untilTime"
                      type="time"
                      value={formData.untilTime}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, untilTime: e.target.value }))
                      }
                    />
                  </div>
                </div>
              )}

              <Button
                onClick={handleAddDiscount}
                disabled={loading || !formData.percentage}
                className="w-full"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                {t('addDiscount')}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Active Discounts */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">{t('activeDiscounts')}</h4>
              {discounts.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAllDiscounts}
                  disabled={loading}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  {t('clearAll')}
                </Button>
              )}
            </div>

            {discounts.length === 0 ? (
              <div className="text-center py-8 border rounded-lg">
                <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">{t('noDiscounts')}</p>
              </div>
            ) : (
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {discounts.map((discount) => (
                    <div
                      key={discount.id}
                      className="flex items-center justify-between p-3 border rounded-lg bg-card"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="text-lg font-bold">
                          %{discount.percentage}
                        </Badge>
                        <div>
                          <p className="text-sm font-medium">
                            {formatTimeRange(discount, t('allHours'), t('notSpecified'))}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(discount.appliedAt).toLocaleDateString('tr-TR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleSendNotification(discount)}
                          disabled={sendingNotification === discount.id}
                          title={t('sendNotification')}
                        >
                          {sendingNotification === discount.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Bell className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveDiscount(discount.id)}
                          disabled={deletingDiscount === discount.id}
                          className="text-destructive hover:text-destructive"
                        >
                          {deletingDiscount === discount.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
