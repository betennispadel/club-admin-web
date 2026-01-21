'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { doc, getDoc, setDoc, collection, getDocs, writeBatch, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { uploadFile, deleteFile, listFiles } from '@/lib/firebase/storage';
import { useClubStore } from '@/stores/clubStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  Eye,
  EyeOff,
  Camera,
  Plus,
  X,
  Check,
  Loader2,
  AlertTriangle,
  Trash2,
  Save,
  Palette,
  Image as ImageIcon,
} from 'lucide-react';
import { Country, State, City } from 'country-state-city';

interface ClubData {
  clubId: string;
  clubName: string;
  authorizedPersonName: string;
  authorizedPersonEmail: string;
  clubPhone: string;
  phoneCountryCode: string;
  country: string;
  countryName: string;
  state: string;
  stateName: string;
  city: string;
  clubLogo: string | null;
  clubPhotos: string[];
  adminUsername: string;
  adminPassword: string;
  status: string;
  hasTennis: boolean;
  hasPadel: boolean;
  themeColor: string;
}

const THEME_COLORS = [
  { color: '#0066CC', key: 'blue' },
  { color: '#218838', key: 'green' },
  { color: '#C82333', key: 'red' },
  { color: '#5A32A3', key: 'purple' },
  { color: '#E8590C', key: 'orange' },
  { color: '#E6A800', key: 'yellow' },
  { color: '#17A085', key: 'turquoise' },
  { color: '#D63384', key: 'pink' },
  { color: '#138496', key: 'cyan' },
];

const PHONE_COUNTRY_CODES = [
  { code: '90', country: 'TR', label: '+90 (Türkiye)' },
  { code: '1', country: 'US', label: '+1 (USA)' },
  { code: '44', country: 'GB', label: '+44 (UK)' },
  { code: '49', country: 'DE', label: '+49 (Germany)' },
  { code: '33', country: 'FR', label: '+33 (France)' },
  { code: '34', country: 'ES', label: '+34 (Spain)' },
  { code: '39', country: 'IT', label: '+39 (Italy)' },
  { code: '31', country: 'NL', label: '+31 (Netherlands)' },
  { code: '7', country: 'RU', label: '+7 (Russia)' },
  { code: '86', country: 'CN', label: '+86 (China)' },
  { code: '81', country: 'JP', label: '+81 (Japan)' },
  { code: '82', country: 'KR', label: '+82 (South Korea)' },
  { code: '971', country: 'AE', label: '+971 (UAE)' },
  { code: '966', country: 'SA', label: '+966 (Saudi Arabia)' },
];

export default function MyClubPage() {
  const t = useTranslations('myClub');
  const tCommon = useTranslations('common');
  const { selectedClub, refreshClubData } = useClubStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clubData, setClubData] = useState<ClubData | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Location states
  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);

  // Delete modal states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [deleteClubName, setDeleteClubName] = useState('');
  const [deleteAdminUsername, setDeleteAdminUsername] = useState('');
  const [deleteAdminPassword, setDeleteAdminPassword] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // File input refs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load countries
    const allCountries = Country.getAllCountries();
    setCountries(allCountries);
  }, []);

  useEffect(() => {
    if (selectedClub) {
      fetchClubData();
    }
  }, [selectedClub]);

  useEffect(() => {
    // Load states when country changes
    if (clubData?.country) {
      const countryStates = State.getStatesOfCountry(clubData.country);
      setStates(countryStates);
    } else {
      setStates([]);
    }
  }, [clubData?.country]);

  useEffect(() => {
    // Load cities when state changes
    if (clubData?.country && clubData?.state) {
      const stateCities = City.getCitiesOfState(clubData.country, clubData.state);
      setCities(stateCities);
    } else {
      setCities([]);
    }
  }, [clubData?.country, clubData?.state]);

  const fetchClubData = async () => {
    if (!selectedClub) return;

    try {
      setLoading(true);
      const clubRef = doc(db, selectedClub.id, 'clubInfo');
      const clubDoc = await getDoc(clubRef);

      if (clubDoc.exists()) {
        const data = clubDoc.data();

        // Parse phone number
        let phoneCountryCode = '90';
        let phoneNumber = '';
        const phoneStr = data.clubPhone || data.phoneNumber || '';
        if (phoneStr) {
          const phoneMatch = phoneStr.match(/^\+(\d{1,4})(\d+)$/);
          if (phoneMatch) {
            phoneCountryCode = phoneMatch[1];
            phoneNumber = phoneMatch[2];
          } else {
            phoneNumber = phoneStr.replace(/\D/g, '');
          }
        }

        setClubData({
          clubId: selectedClub.id,
          clubName: data.clubName || 'Default Tennis Academy',
          authorizedPersonName: data.authorizedPersonName || data.ownerName || '',
          authorizedPersonEmail: data.authorizedPersonEmail || data.ownerEmail || '',
          clubPhone: phoneNumber,
          phoneCountryCode,
          country: data.country || '',
          countryName: data.countryName || '',
          state: data.state || '',
          stateName: data.stateName || '',
          city: data.city || '',
          clubLogo: data.clubLogo || null,
          clubPhotos: data.clubPhotos || [],
          adminUsername: data.adminUsername || '',
          adminPassword: data.adminPassword || '',
          status: data.status || 'active',
          hasTennis: data.hasTennis ?? true,
          hasPadel: data.hasPadel ?? false,
          themeColor: data.themeColor || '#0066CC',
        });
      } else {
        setClubData({
          clubId: selectedClub.id,
          clubName: 'Default Tennis Academy',
          authorizedPersonName: '',
          authorizedPersonEmail: '',
          clubPhone: '',
          phoneCountryCode: '90',
          country: '',
          countryName: '',
          state: '',
          stateName: '',
          city: '',
          clubLogo: null,
          clubPhotos: [],
          adminUsername: '',
          adminPassword: '',
          status: 'active',
          hasTennis: true,
          hasPadel: false,
          themeColor: '#0066CC',
        });
      }
    } catch (error) {
      toast.error(t('messages.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!clubData || !selectedClub) return;

    try {
      setSaving(true);
      const clubRef = doc(db, selectedClub.id, 'clubInfo');

      const formattedPhone = clubData.clubPhone
        ? `+${clubData.phoneCountryCode}${clubData.clubPhone}`
        : '';

      await setDoc(clubRef, {
        ...clubData,
        clubPhone: formattedPhone,
        updatedAt: new Date(),
      }, { merge: true });

      await refreshClubData();
      toast.success(t('messages.saveSuccess'));
    } catch (error) {
      toast.error(t('messages.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedClub || !clubData) return;

    try {
      setUploadingLogo(true);
      const path = `${selectedClub.id}/clubLogo/logo_${Date.now()}`;
      const downloadUrl = await uploadFile(path, file);

      setClubData({ ...clubData, clubLogo: downloadUrl });

      const clubRef = doc(db, selectedClub.id, 'clubInfo');
      await setDoc(clubRef, {
        clubLogo: downloadUrl,
        updatedAt: new Date(),
      }, { merge: true });

      toast.success(t('messages.logoUploaded'));
    } catch (error) {
      toast.error(t('messages.logoUploadError'));
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) {
        logoInputRef.current.value = '';
      }
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedClub || !clubData) return;

    if (clubData.clubPhotos.length >= 3) {
      toast.error(t('messages.maxPhotos'));
      return;
    }

    try {
      setUploadingPhoto(true);
      const path = `${selectedClub.id}/clubPhotos/photo_${Date.now()}`;
      const downloadUrl = await uploadFile(path, file);

      const newPhotos = [...clubData.clubPhotos, downloadUrl];
      setClubData({ ...clubData, clubPhotos: newPhotos });

      const clubRef = doc(db, selectedClub.id, 'clubInfo');
      await setDoc(clubRef, {
        clubPhotos: newPhotos,
        updatedAt: new Date(),
      }, { merge: true });

      toast.success(t('messages.photoUploaded'));
    } catch (error) {
      toast.error(t('messages.photoUploadError'));
    } finally {
      setUploadingPhoto(false);
      if (photoInputRef.current) {
        photoInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = async (index: number) => {
    if (!clubData || !selectedClub) return;

    try {
      const newPhotos = [...clubData.clubPhotos];
      newPhotos.splice(index, 1);
      setClubData({ ...clubData, clubPhotos: newPhotos });

      const clubRef = doc(db, selectedClub.id, 'clubInfo');
      await setDoc(clubRef, {
        clubPhotos: newPhotos,
        updatedAt: new Date(),
      }, { merge: true });

      toast.success(t('messages.photoDeleted'));
    } catch (error) {
      toast.error(t('messages.photoDeleteError'));
    }
  };

  const handleCountryChange = (countryCode: string) => {
    if (!clubData) return;
    const country = countries.find(c => c.isoCode === countryCode);
    setClubData({
      ...clubData,
      country: countryCode,
      countryName: country?.name || '',
      state: '',
      stateName: '',
      city: '',
    });
  };

  const handleStateChange = (stateCode: string) => {
    if (!clubData) return;
    const state = states.find(s => s.isoCode === stateCode);
    setClubData({
      ...clubData,
      state: stateCode,
      stateName: state?.name || '',
      city: '',
    });
  };

  const handleCityChange = (cityName: string) => {
    if (!clubData) return;
    setClubData({ ...clubData, city: cityName });
  };

  const isDeleteFormValid = () => {
    if (!clubData) return false;
    const clubNameMatch = deleteClubName.trim().toLowerCase() === clubData.clubName.trim().toLowerCase();
    const usernameMatch = deleteAdminUsername.trim().toLowerCase() === clubData.adminUsername.trim().toLowerCase();
    const passwordMatch = deleteAdminPassword === clubData.adminPassword;
    return clubNameMatch && usernameMatch && passwordMatch;
  };

  const handleDeleteClub = async () => {
    if (!selectedClub || !clubData) return;

    try {
      setIsDeleting(true);

      // Delete all subcollections
      const collectionsToDelete = [
        'reservations', 'courts', 'users', 'wallets', 'transactions',
        'coupons', 'notifications', 'settings', 'trainers', 'lessons',
        'packages', 'subscriptions', 'apiKeys', 'privateLessons',
        'performanceteams', 'tournaments', 'leagues', 'magazine',
        'sliders', 'storeProducts', 'restaurantOrders',
      ];

      for (const collectionName of collectionsToDelete) {
        try {
          const collectionRef = collection(db, selectedClub.id, collectionName, collectionName);
          const snapshot = await getDocs(collectionRef);

          if (!snapshot.empty) {
            const batch = writeBatch(db);
            snapshot.docs.forEach((docSnap) => {
              batch.delete(docSnap.ref);
            });
            await batch.commit();
          }
        } catch {
          // Collection might not exist, continue
        }
      }

      // Delete clubInfo
      try {
        const clubInfoRef = doc(db, selectedClub.id, 'clubInfo');
        await deleteDoc(clubInfoRef);
      } catch {
        // Continue even if error
      }

      // Delete from clubRegistrations
      try {
        const registrationRef = doc(db, 'clubRegistrations', selectedClub.id);
        await deleteDoc(registrationRef);
      } catch {
        // Continue even if error
      }

      setShowDeleteConfirmDialog(false);
      setShowDeleteDialog(false);
      toast.success(t('delete.successMessage'));

      // Refresh and redirect
      await refreshClubData();
      window.location.href = '/';
    } catch (error) {
      toast.error(t('delete.errorMessage'));
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">{t('loading')}</span>
      </div>
    );
  }

  if (!clubData) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <AlertTriangle className="h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">{t('notFound')}</p>
        <Button onClick={fetchClubData} className="mt-4">
          {t('retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {tCommon('save')}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {t('sections.basicInfo')}
            </CardTitle>
            <CardDescription>{t('sections.basicInfoDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Club ID */}
            <div className="space-y-2">
              <Label>{t('fields.clubId')}</Label>
              <Input
                value={clubData.clubId}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">{t('helpers.clubIdReadonly')}</p>
            </div>

            {/* Club Name */}
            <div className="space-y-2">
              <Label>{t('fields.clubName')}</Label>
              <Input
                value={clubData.clubName}
                onChange={(e) => setClubData({ ...clubData, clubName: e.target.value.replace(/\s+/g, ' ').trim() })}
                placeholder={t('placeholders.clubName')}
              />
            </div>

            {/* Club Types */}
            <div className="space-y-2">
              <Label>{t('fields.clubType')}</Label>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={clubData.hasTennis}
                    onCheckedChange={(checked) => setClubData({ ...clubData, hasTennis: checked })}
                  />
                  <span>🎾 {t('types.tennis')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={clubData.hasPadel}
                    onCheckedChange={(checked) => setClubData({ ...clubData, hasPadel: checked })}
                  />
                  <span>🏸 {t('types.padel')}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t('sections.contactInfo')}
            </CardTitle>
            <CardDescription>{t('sections.contactInfoDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Authorized Person Name */}
            <div className="space-y-2">
              <Label>{t('fields.authorizedPerson')}</Label>
              <Input
                value={clubData.authorizedPersonName}
                onChange={(e) => setClubData({ ...clubData, authorizedPersonName: e.target.value })}
                placeholder={t('placeholders.authorizedPerson')}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label>{t('fields.email')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={clubData.authorizedPersonEmail}
                  onChange={(e) => setClubData({ ...clubData, authorizedPersonEmail: e.target.value.toLowerCase().replace(/\s/g, '') })}
                  placeholder={t('placeholders.email')}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label>{t('fields.phone')}</Label>
              <div className="flex gap-2">
                <Select
                  value={clubData.phoneCountryCode}
                  onValueChange={(value) => setClubData({ ...clubData, phoneCountryCode: value })}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PHONE_COUNTRY_CODES.map((item) => (
                      <SelectItem key={item.code} value={item.code}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative flex-1">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="tel"
                    value={clubData.clubPhone}
                    onChange={(e) => setClubData({ ...clubData, clubPhone: e.target.value.replace(/\D/g, '') })}
                    placeholder={t('placeholders.phone')}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {t('sections.location')}
            </CardTitle>
            <CardDescription>{t('sections.locationDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Country */}
            <div className="space-y-2">
              <Label>{t('fields.country')}</Label>
              <Select
                value={clubData.country}
                onValueChange={handleCountryChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('placeholders.selectCountry')} />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {countries.map((country) => (
                    <SelectItem key={country.isoCode} value={country.isoCode}>
                      {country.flag} {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* State */}
            <div className="space-y-2">
              <Label>{t('fields.state')}</Label>
              <Select
                value={clubData.state}
                onValueChange={handleStateChange}
                disabled={!clubData.country || states.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('placeholders.selectState')} />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {states.map((state) => (
                    <SelectItem key={state.isoCode} value={state.isoCode}>
                      {state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* City */}
            <div className="space-y-2">
              <Label>{t('fields.city')}</Label>
              <Select
                value={clubData.city}
                onValueChange={handleCityChange}
                disabled={!clubData.state || cities.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('placeholders.selectCity')} />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {cities.map((city) => (
                    <SelectItem key={city.name} value={city.name}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Admin Credentials */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              {t('sections.adminCredentials')}
            </CardTitle>
            <CardDescription>{t('sections.adminCredentialsDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Admin Username */}
            <div className="space-y-2">
              <Label>{t('fields.adminUsername')}</Label>
              <Input
                value={clubData.adminUsername}
                onChange={(e) => setClubData({ ...clubData, adminUsername: e.target.value.toLowerCase().replace(/\s/g, '') })}
                placeholder={t('placeholders.adminUsername')}
              />
              <p className="text-xs text-muted-foreground">{t('helpers.usernameInfo')}</p>
            </div>

            {/* Admin Password */}
            <div className="space-y-2">
              <Label>{t('fields.adminPassword')}</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={clubData.adminPassword}
                  onChange={(e) => setClubData({ ...clubData, adminPassword: e.target.value.replace(/\s/g, '') })}
                  placeholder={t('placeholders.adminPassword')}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{t('helpers.noSpaces')}</p>
            </div>
          </CardContent>
        </Card>

        {/* Club Logo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              {t('sections.clubLogo')}
            </CardTitle>
            <CardDescription>{t('sections.clubLogoDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                {clubData.clubLogo ? (
                  <img
                    src={clubData.clubLogo}
                    alt="Club Logo"
                    className="w-32 h-32 rounded-full object-cover border-4 border-muted"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center border-4 border-dashed border-muted-foreground/25">
                    <Building2 className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                {uploadingLogo && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                  </div>
                )}
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
              >
                <Camera className="h-4 w-4 mr-2" />
                {clubData.clubLogo ? t('buttons.changeLogo') : t('buttons.uploadLogo')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Club Photos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              {t('sections.clubPhotos')}
            </CardTitle>
            <CardDescription>{t('sections.clubPhotosDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {clubData.clubPhotos.map((photo, index) => (
                <div key={index} className="relative aspect-video rounded-lg overflow-hidden border">
                  <img
                    src={photo}
                    alt={`Club Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={() => handleRemovePhoto(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {clubData.clubPhotos.length < 3 && (
                <div
                  className="aspect-video rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => photoInputRef.current?.click()}
                >
                  {uploadingPhoto ? (
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <Plus className="h-8 w-8 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground mt-1">{t('buttons.addPhoto')}</span>
                    </>
                  )}
                </div>
              )}
            </div>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {t('helpers.maxPhotos', { count: 3 - clubData.clubPhotos.length })}
            </p>
          </CardContent>
        </Card>

        {/* Theme Color */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              {t('sections.themeColor')}
            </CardTitle>
            <CardDescription>{t('sections.themeColorDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {THEME_COLORS.map((theme) => (
                <button
                  key={theme.color}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                    clubData.themeColor === theme.color
                      ? 'ring-4 ring-offset-2 ring-primary scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: theme.color }}
                  onClick={() => setClubData({ ...clubData, themeColor: theme.color })}
                >
                  {clubData.themeColor === theme.color && (
                    <Check className="h-6 w-6 text-white" />
                  )}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 mt-4 p-3 bg-muted rounded-lg">
              <div
                className="w-8 h-8 rounded-full"
                style={{ backgroundColor: clubData.themeColor }}
              />
              <div>
                <p className="font-medium">
                  {t(`colors.${THEME_COLORS.find(c => c.color === clubData.themeColor)?.key || 'custom'}`)}
                </p>
                <p className="text-sm text-muted-foreground">{clubData.themeColor}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="lg:col-span-2 border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {t('delete.dangerZone')}
            </CardTitle>
            <CardDescription>{t('delete.warningText')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t('delete.deleteButton')}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Delete Club Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {t('delete.modalTitle')}
            </DialogTitle>
            <DialogDescription>{t('delete.irreversibleAction')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <p className="text-sm text-destructive">
                {t('delete.allDataWillBeDeleted')}
              </p>
            </div>

            <div className="space-y-2">
              <Label>{t('delete.enterClubName')}</Label>
              <p className="text-xs text-muted-foreground">
                {t('delete.clubNameHint', { clubName: clubData.clubName })}
              </p>
              <Input
                value={deleteClubName}
                onChange={(e) => setDeleteClubName(e.target.value)}
                placeholder={clubData.clubName}
              />
              {deleteClubName.trim().toLowerCase() === clubData.clubName.trim().toLowerCase() && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <Check className="h-3 w-3" /> {tCommon('confirm')}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t('delete.enterAdminUsername')}</Label>
              <Input
                value={deleteAdminUsername}
                onChange={(e) => setDeleteAdminUsername(e.target.value)}
                placeholder={t('delete.adminUsernamePlaceholder')}
              />
              {deleteAdminUsername.trim().toLowerCase() === clubData.adminUsername.trim().toLowerCase() && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <Check className="h-3 w-3" /> {tCommon('confirm')}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t('delete.enterAdminPassword')}</Label>
              <div className="relative">
                <Input
                  type={showDeletePassword ? 'text' : 'password'}
                  value={deleteAdminPassword}
                  onChange={(e) => setDeleteAdminPassword(e.target.value)}
                  placeholder={t('delete.adminPasswordPlaceholder')}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowDeletePassword(!showDeletePassword)}
                >
                  {showDeletePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {deleteAdminPassword === clubData.adminPassword && deleteAdminPassword !== '' && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <Check className="h-3 w-3" /> {tCommon('confirm')}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              {tCommon('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirmDialog(true)}
              disabled={!isDeleteFormValid()}
            >
              {t('delete.confirmDeleteButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Final Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirmDialog} onOpenChange={setShowDeleteConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {t('delete.finalConfirmTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('delete.finalConfirmMessage', { clubName: clubData.clubName })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {tCommon('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteClub}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('delete.deleting')}
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('delete.confirmDelete')}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
