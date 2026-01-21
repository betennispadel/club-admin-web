'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useClubStore } from '@/stores/clubStore';
import { Timestamp } from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Ticket,
  RefreshCw,
  Users,
  Search,
  Loader2,
  Percent,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Coupon, UserForCoupon, CouponFormData, DEFAULT_COUPON_FORM } from '@/lib/types/discounts';
import { createCoupon, updateCoupon, generateCouponCode } from '@/lib/firebase/discounts';

interface CouponDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coupon: Coupon | null;
  users: UserForCoupon[];
  onSuccess: () => void;
}

const defaultFormData: CouponFormData = {
  code: '',
  type: 'percentage',
  value: '',
  description: '',
  maxUses: '',
  maxUsesPerUser: '1',
  minPurchaseAmount: '',
  validDays: '30',
  isForAllUsers: true,
  selectedUserIds: [],
};

export default function CouponDialog({
  open,
  onOpenChange,
  coupon,
  users,
  onSuccess,
}: CouponDialogProps) {
  const t = useTranslations('discounts.coupon');
  const tCommon = useTranslations('discounts');
  const { selectedClub } = useClubStore();

  const [formData, setFormData] = useState<CouponFormData>(defaultFormData);
  const [loading, setLoading] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('details');

  const isEditing = !!coupon;

  useEffect(() => {
    if (open) {
      if (coupon) {
        // Editing existing coupon
        setFormData({
          code: coupon.code,
          type: coupon.type,
          value: coupon.value.toString(),
          description: coupon.description || '',
          maxUses: coupon.maxUses?.toString() || '',
          maxUsesPerUser: coupon.maxUsesPerUser?.toString() || '1',
          minPurchaseAmount: coupon.minPurchaseAmount?.toString() || '',
          validDays: '30', // Not editable after creation
          isForAllUsers: !coupon.assignedUserIds || coupon.assignedUserIds.length === 0,
          selectedUserIds: coupon.assignedUserIds || [],
        });
      } else {
        // Creating new coupon
        setFormData({
          ...defaultFormData,
          code: generateCouponCode(),
        });
      }
      setActiveTab('details');
      setUserSearchQuery('');
    }
  }, [open, coupon]);

  const handleGenerateCode = () => {
    setFormData((prev) => ({ ...prev, code: generateCouponCode() }));
  };

  const handleUserSelect = (userId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedUserIds: prev.selectedUserIds.includes(userId)
        ? prev.selectedUserIds.filter((id) => id !== userId)
        : [...prev.selectedUserIds, userId],
    }));
  };

  const handleSelectAllUsers = () => {
    if (formData.selectedUserIds.length === filteredUsers.length) {
      setFormData((prev) => ({ ...prev, selectedUserIds: [] }));
    } else {
      setFormData((prev) => ({
        ...prev,
        selectedUserIds: filteredUsers.map((u) => u.id),
      }));
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      user.firstName?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  const validateForm = (): boolean => {
    if (!formData.code.trim()) {
      toast.error(t('errors.codeRequired'));
      return false;
    }

    const value = parseFloat(formData.value);
    if (isNaN(value) || value <= 0) {
      toast.error(t('errors.invalidValue'));
      return false;
    }

    if (formData.type === 'percentage' && value > 100) {
      toast.error(t('errors.percentageMax'));
      return false;
    }

    if (!formData.isForAllUsers && formData.selectedUserIds.length === 0) {
      toast.error(t('errors.selectUsers'));
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!selectedClub?.id || !validateForm()) return;

    setLoading(true);
    try {
      const now = new Date();
      const validDays = parseInt(formData.validDays, 10) || 30;
      const validUntil = new Date(now.getTime() + validDays * 24 * 60 * 60 * 1000);

      const couponData = {
        code: formData.code.toUpperCase().trim(),
        type: formData.type as 'percentage' | 'fixed',
        value: parseFloat(formData.value),
        description: formData.description.trim() || undefined,
        maxUses: formData.maxUses ? parseInt(formData.maxUses, 10) : undefined,
        maxUsesPerUser: parseInt(formData.maxUsesPerUser, 10) || 1,
        minPurchaseAmount: formData.minPurchaseAmount
          ? parseFloat(formData.minPurchaseAmount)
          : undefined,
        assignedUserIds: formData.isForAllUsers ? undefined : formData.selectedUserIds,
        status: 'active' as const,
        validFrom: Timestamp.fromDate(now),
        validUntil: Timestamp.fromDate(validUntil),
      };

      if (isEditing && coupon) {
        await updateCoupon(selectedClub.id, coupon.id, couponData);
        toast.success(t('updateSuccess'), {
          description: t('updateSuccessDesc'),
        });
      } else {
        await createCoupon(selectedClub.id, couponData);
        toast.success(t('createSuccess'), {
          description: t('createSuccessDesc'),
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving coupon:', error);
      if (error.message === 'COUPON_CODE_EXISTS') {
        toast.error(t('errors.codeExists'), {
          description: t('errors.codeExistsDesc'),
        });
      } else {
        toast.error(t('errors.saveError'), {
          description: t('errors.saveErrorDesc'),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const getUserInitials = (user: UserForCoupon) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user.username.substring(0, 2).toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            {isEditing ? t('editTitle') : t('createTitle')}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? t('editDescription') : t('createDescription')}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">{t('tabs.details')}</TabsTrigger>
            <TabsTrigger value="users">{t('tabs.users')}</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[400px] pr-4">
            <TabsContent value="details" className="space-y-4 mt-4">
              {/* Code */}
              <div className="space-y-2">
                <Label htmlFor="code">{t('code')}</Label>
                <div className="flex gap-2">
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        code: e.target.value.toUpperCase(),
                      }))
                    }
                    placeholder="ABC123"
                    className="font-mono"
                    disabled={isEditing}
                  />
                  {!isEditing && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleGenerateCode}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label>{t('type')}</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      type: value as 'percentage' | 'fixed',
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">
                      <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4" />
                        {t('typePercentage')}
                      </div>
                    </SelectItem>
                    <SelectItem value="fixed">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        {t('typeFixed')}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Value */}
              <div className="space-y-2">
                <Label htmlFor="value">{t('value')}</Label>
                <div className="relative">
                  <Input
                    id="value"
                    type="number"
                    min="0"
                    max={formData.type === 'percentage' ? '100' : undefined}
                    value={formData.value}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, value: e.target.value }))
                    }
                    placeholder={formData.type === 'percentage' ? '10' : '50'}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {formData.type === 'percentage' ? '%' : '₺'}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">{t('description')}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder={t('descriptionPlaceholder')}
                  rows={2}
                />
              </div>

              {/* Max Uses */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="maxUses">{t('maxUses')}</Label>
                  <Input
                    id="maxUses"
                    type="number"
                    min="0"
                    value={formData.maxUses}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, maxUses: e.target.value }))
                    }
                    placeholder={t('unlimited')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxUsesPerUser">{t('maxUsesPerUser')}</Label>
                  <Input
                    id="maxUsesPerUser"
                    type="number"
                    min="1"
                    value={formData.maxUsesPerUser}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        maxUsesPerUser: e.target.value,
                      }))
                    }
                    placeholder="1"
                  />
                </div>
              </div>

              {/* Min Purchase Amount */}
              <div className="space-y-2">
                <Label htmlFor="minPurchase">{t('minPurchase')}</Label>
                <div className="relative">
                  <Input
                    id="minPurchase"
                    type="number"
                    min="0"
                    value={formData.minPurchaseAmount}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        minPurchaseAmount: e.target.value,
                      }))
                    }
                    placeholder={t('noMinimum')}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    ₺
                  </span>
                </div>
              </div>

              {/* Valid Days (only for new coupons) */}
              {!isEditing && (
                <div className="space-y-2">
                  <Label htmlFor="validDays">{t('validDays')}</Label>
                  <Input
                    id="validDays"
                    type="number"
                    min="1"
                    value={formData.validDays}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, validDays: e.target.value }))
                    }
                    placeholder="30"
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="users" className="space-y-4 mt-4">
              {/* All Users Toggle */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label htmlFor="allUsers" className="text-base font-medium">
                    {t('forAllUsers')}
                  </Label>
                  <p className="text-sm text-muted-foreground">{t('forAllUsersDesc')}</p>
                </div>
                <Switch
                  id="allUsers"
                  checked={formData.isForAllUsers}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      isForAllUsers: checked,
                      selectedUserIds: checked ? [] : prev.selectedUserIds,
                    }))
                  }
                />
              </div>

              {!formData.isForAllUsers && (
                <>
                  {/* User Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t('searchUsers')}
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Selected Count & Select All */}
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">
                      <Users className="h-3 w-3 mr-1" />
                      {formData.selectedUserIds.length} {t('selected')}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSelectAllUsers}
                    >
                      {formData.selectedUserIds.length === filteredUsers.length
                        ? t('deselectAll')
                        : t('selectAll')}
                    </Button>
                  </div>

                  {/* User List */}
                  <div className="space-y-2 max-h-[250px] overflow-y-auto">
                    {filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleUserSelect(user.id)}
                      >
                        <Checkbox
                          checked={formData.selectedUserIds.includes(user.id)}
                          onCheckedChange={() => handleUserSelect(user.id)}
                        />
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.photoURL} />
                          <AvatarFallback className="text-xs">
                            {getUserInitials(user)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {user.firstName && user.lastName
                              ? `${user.firstName} ${user.lastName}`
                              : user.username}
                          </p>
                          {user.email && (
                            <p className="text-xs text-muted-foreground truncate">
                              {user.email}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}

                    {filteredUsers.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        {t('noUsersFound')}
                      </div>
                    )}
                  </div>
                </>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tCommon('actions.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? tCommon('actions.save') : tCommon('actions.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
