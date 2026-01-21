'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useClubStore } from '@/stores/clubStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import {
  Megaphone,
  Plus,
  Edit,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  Loader2,
  Upload,
  X,
  Trophy,
  Clock,
  Award,
  ShoppingCart,
  Star,
  Circle,
  Gift,
  Zap,
  Heart,
  Tag,
  Rocket,
  Sparkles,
  Calendar,
  Dumbbell,
  UtensilsCrossed,
  Link,
  Image as ImageIcon,
  Wand2,
} from 'lucide-react';
import { toast } from 'sonner';
import type { AdBanner, AdFormData } from '@/lib/types/ads';
import { AVAILABLE_ICONS, GRADIENT_PRESETS, DEFAULT_AD_FORM } from '@/lib/types/ads';
import {
  fetchAdBanners,
  createAdBanner,
  updateAdBanner,
  deleteAdBanner,
  toggleAdActive,
  uploadAdImage,
  deleteAdImage,
  initializeDefaultAds,
} from '@/lib/firebase/ads';

const ICON_MAP: Record<string, React.ElementType> = {
  trophy: Trophy,
  clock: Clock,
  award: Award,
  'shopping-cart': ShoppingCart,
  star: Star,
  circle: Circle,
  gift: Gift,
  zap: Zap,
  heart: Heart,
  tag: Tag,
  megaphone: Megaphone,
  rocket: Rocket,
  sparkles: Sparkles,
  calendar: Calendar,
  dumbbell: Dumbbell,
  utensils: UtensilsCrossed,
};

export default function AdsPage() {
  const t = useTranslations('ads');
  const { selectedClub } = useClubStore();

  const [ads, setAds] = useState<AdBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState<AdBanner | null>(null);
  const [isNewAd, setIsNewAd] = useState(false);

  // Form state
  const [form, setForm] = useState<AdFormData>(DEFAULT_AD_FORM);

  useEffect(() => {
    if (selectedClub?.id) {
      loadAds();
    }
  }, [selectedClub?.id]);

  const loadAds = async () => {
    if (!selectedClub?.id) return;
    setLoading(true);
    try {
      const data = await fetchAdBanners(selectedClub.id);
      setAds(data);

      // Initialize default ads if empty
      if (data.length === 0) {
        await initializeDefaultAds(selectedClub.id);
        const newData = await fetchAdBanners(selectedClub.id);
        setAds(newData);
      }
    } catch (error) {
      console.error('Error loading ads:', error);
      toast.error(t('errors.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setIsNewAd(true);
    setSelectedAd(null);
    setForm({
      ...DEFAULT_AD_FORM,
      order: ads.length,
    } as AdFormData);
    setEditDialogOpen(true);
  };

  const handleEdit = (ad: AdBanner) => {
    setIsNewAd(false);
    setSelectedAd(ad);
    setForm({
      title: ad.title,
      subtitle: ad.subtitle,
      icon: ad.icon,
      color: ad.color,
      gradient: ad.gradient,
      isActive: ad.isActive,
      buttonText: ad.buttonText || 'Detaylar',
      linkUrl: ad.linkUrl || '',
      bannerImage: ad.bannerImage || '',
    });
    setEditDialogOpen(true);
  };

  const handleDelete = (ad: AdBanner) => {
    setSelectedAd(ad);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedClub?.id || !selectedAd) return;
    setSaving(true);
    try {
      if (selectedAd.bannerImage) {
        await deleteAdImage(selectedAd.bannerImage);
      }
      await deleteAdBanner(selectedClub.id, selectedAd.id);
      setAds((prev) => prev.filter((a) => a.id !== selectedAd.id));
      toast.success(t('deleteSuccess'));
    } catch (error) {
      console.error('Error deleting ad:', error);
      toast.error(t('errors.deleteError'));
    } finally {
      setSaving(false);
      setDeleteDialogOpen(false);
      setSelectedAd(null);
    }
  };

  const handleToggleActive = async (ad: AdBanner) => {
    if (!selectedClub?.id) return;
    try {
      await toggleAdActive(selectedClub.id, ad.id, !ad.isActive);
      setAds((prev) =>
        prev.map((a) => (a.id === ad.id ? { ...a, isActive: !a.isActive } : a))
      );
      toast.success(ad.isActive ? t('deactivated') : t('activated'));
    } catch (error) {
      console.error('Error toggling ad:', error);
      toast.error(t('errors.toggleError'));
    }
  };

  const handleSave = async () => {
    if (!selectedClub?.id) return;
    if (!form.title.trim()) {
      toast.error(t('errors.titleRequired'));
      return;
    }

    setSaving(true);
    try {
      if (isNewAd) {
        await createAdBanner(selectedClub.id, {
          title: form.title,
          subtitle: form.subtitle,
          icon: form.icon,
          color: form.color,
          gradient: form.gradient,
          isActive: form.isActive,
          order: ads.length,
          buttonText: form.buttonText,
          linkUrl: form.linkUrl,
          bannerImage: form.bannerImage,
        });
        toast.success(t('createSuccess'));
      } else if (selectedAd) {
        await updateAdBanner(selectedClub.id, selectedAd.id, {
          title: form.title,
          subtitle: form.subtitle,
          icon: form.icon,
          color: form.color,
          gradient: form.gradient,
          isActive: form.isActive,
          buttonText: form.buttonText,
          linkUrl: form.linkUrl,
          bannerImage: form.bannerImage,
        });
        toast.success(t('updateSuccess'));
      }
      loadAds();
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Error saving ad:', error);
      toast.error(t('errors.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!selectedClub?.id) return;
    setUploading(true);
    try {
      const adId = selectedAd?.id || `new_${Date.now()}`;
      const url = await uploadAdImage(selectedClub.id, file, adId);
      setForm((prev) => ({ ...prev, bannerImage: url }));
      toast.success(t('imageUploaded'));
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(t('errors.imageUploadError'));
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (form.bannerImage) {
      try {
        await deleteAdImage(form.bannerImage);
      } catch (error) {
        console.error('Error removing image:', error);
      }
      setForm((prev) => ({ ...prev, bannerImage: '' }));
    }
  };

  const IconComponent = (iconName: string) => {
    const Icon = ICON_MAP[iconName] || Circle;
    return Icon;
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
            <Skeleton key={i} className="h-48" />
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
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone className="h-6 w-6" />
            {t('title')}
          </h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          {t('createNew')}
        </Button>
      </div>

      {/* Ads Grid */}
      {ads.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">{t('noAds')}</p>
            <Button className="mt-4" onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              {t('createFirst')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ads.map((ad) => {
            const Icon = IconComponent(ad.icon);
            return (
              <Card
                key={ad.id}
                className={`relative overflow-hidden transition-opacity ${
                  !ad.isActive ? 'opacity-60' : ''
                }`}
              >
                {/* Gradient Banner Preview */}
                <div
                  className="h-24 flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${ad.gradient[0]}, ${ad.gradient[1]})`,
                  }}
                >
                  {ad.bannerImage ? (
                    <img
                      src={ad.bannerImage}
                      alt={ad.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Icon className="h-10 w-10 text-white" />
                  )}
                </div>

                {/* Status Badge */}
                <Badge
                  className={`absolute top-2 right-2 ${
                    ad.isActive ? 'bg-green-500' : 'bg-gray-500'
                  }`}
                >
                  {ad.isActive ? t('active') : t('inactive')}
                </Badge>

                <CardHeader className="pb-2">
                  <CardTitle className="text-base line-clamp-1">{ad.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {ad.subtitle}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={ad.isActive}
                        onCheckedChange={() => handleToggleActive(ad)}
                      />
                      <span className="text-sm text-muted-foreground">
                        {ad.isActive ? t('active') : t('inactive')}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(ad)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(ad)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit/Create Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isNewAd ? t('createTitle') : t('editTitle')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Preview */}
            <div
              className="h-32 rounded-lg flex items-center justify-center relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${form.gradient[0]}, ${form.gradient[1]})`,
              }}
            >
              {form.bannerImage ? (
                <>
                  <img
                    src={form.bannerImage}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <div className="text-center text-white">
                  {(() => {
                    const Icon = IconComponent(form.icon);
                    return <Icon className="h-12 w-12 mx-auto mb-2" />;
                  })()}
                  <p className="font-bold">{form.title || t('previewTitle')}</p>
                  <p className="text-sm opacity-80">{form.subtitle || t('previewSubtitle')}</p>
                </div>
              )}
            </div>

            {/* Image Upload */}
            <div className="space-y-1.5">
              <Label>{t('form.bannerImage')}</Label>
              <div>
                <label className="flex items-center justify-center w-full h-20 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                  {uploading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Upload className="h-5 w-5" />
                      <span>{t('form.uploadImage')}</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>{t('form.title')}</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder={t('form.titlePlaceholder')}
                />
              </div>

              <div className="col-span-2 space-y-1.5">
                <Label>{t('form.subtitle')}</Label>
                <Textarea
                  value={form.subtitle}
                  onChange={(e) => setForm((prev) => ({ ...prev, subtitle: e.target.value }))}
                  placeholder={t('form.subtitlePlaceholder')}
                  rows={2}
                />
              </div>

              <div className="space-y-1.5">
                <Label>{t('form.buttonText')}</Label>
                <Input
                  value={form.buttonText}
                  onChange={(e) => setForm((prev) => ({ ...prev, buttonText: e.target.value }))}
                  placeholder={t('form.buttonTextPlaceholder')}
                />
              </div>

              <div className="space-y-1.5">
                <Label>{t('form.linkUrl')}</Label>
                <Input
                  value={form.linkUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, linkUrl: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* Icon Selection */}
            <div className="space-y-1.5">
              <Label>{t('form.icon')}</Label>
              <div className="grid grid-cols-8 gap-2">
                {AVAILABLE_ICONS.map((iconName) => {
                  const Icon = ICON_MAP[iconName] || Circle;
                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, icon: iconName }))}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        form.icon === iconName
                          ? 'border-primary bg-primary/10'
                          : 'border-muted hover:border-primary/50'
                      }`}
                    >
                      <Icon className="h-5 w-5 mx-auto" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Gradient Selection */}
            <div className="space-y-1.5">
              <Label>{t('form.gradient')}</Label>
              <div className="grid grid-cols-4 gap-2">
                {GRADIENT_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        gradient: preset.colors,
                        color: preset.colors[0],
                      }))
                    }
                    className={`h-12 rounded-lg border-2 transition-all ${
                      form.gradient[0] === preset.colors[0] &&
                      form.gradient[1] === preset.colors[1]
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-transparent'
                    }`}
                    style={{
                      background: `linear-gradient(135deg, ${preset.colors[0]}, ${preset.colors[1]})`,
                    }}
                    title={preset.name}
                  />
                ))}
              </div>
            </div>

            {/* Active Switch */}
            <div className="flex items-center gap-2">
              <Switch
                checked={form.isActive}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({ ...prev, isActive: checked }))
                }
              />
              <Label>{t('form.isActive')}</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              {t('actions.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isNewAd ? t('actions.create') : t('actions.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteDescription', { title: selectedAd?.title || '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('actions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
