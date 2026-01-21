'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useClubStore } from '@/stores/clubStore';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, CalendarIcon, User, Phone, MapPin, CreditCard, Dumbbell, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

import type { Coach, CoachFormState, Gender } from '@/lib/types/private-lessons';
import { initialCoachFormState, GENDERS } from '@/lib/types/private-lessons';
import { createCoach } from '@/lib/firebase/private-lessons';

// Country codes for phone input
const PHONE_COUNTRY_CODES = [
  { code: 'TR', dialCode: '+90', name: 'Türkiye' },
  { code: 'US', dialCode: '+1', name: 'United States' },
  { code: 'GB', dialCode: '+44', name: 'United Kingdom' },
  { code: 'DE', dialCode: '+49', name: 'Germany' },
  { code: 'FR', dialCode: '+33', name: 'France' },
  { code: 'IT', dialCode: '+39', name: 'Italy' },
  { code: 'ES', dialCode: '+34', name: 'Spain' },
  { code: 'NL', dialCode: '+31', name: 'Netherlands' },
  { code: 'BE', dialCode: '+32', name: 'Belgium' },
  { code: 'AT', dialCode: '+43', name: 'Austria' },
  { code: 'CH', dialCode: '+41', name: 'Switzerland' },
  { code: 'SE', dialCode: '+46', name: 'Sweden' },
  { code: 'NO', dialCode: '+47', name: 'Norway' },
  { code: 'DK', dialCode: '+45', name: 'Denmark' },
  { code: 'FI', dialCode: '+358', name: 'Finland' },
  { code: 'PL', dialCode: '+48', name: 'Poland' },
  { code: 'RU', dialCode: '+7', name: 'Russia' },
  { code: 'UA', dialCode: '+380', name: 'Ukraine' },
  { code: 'GR', dialCode: '+30', name: 'Greece' },
  { code: 'PT', dialCode: '+351', name: 'Portugal' },
  { code: 'CZ', dialCode: '+420', name: 'Czech Republic' },
  { code: 'RO', dialCode: '+40', name: 'Romania' },
  { code: 'HU', dialCode: '+36', name: 'Hungary' },
  { code: 'BG', dialCode: '+359', name: 'Bulgaria' },
  { code: 'AZ', dialCode: '+994', name: 'Azerbaijan' },
  { code: 'GE', dialCode: '+995', name: 'Georgia' },
  { code: 'AM', dialCode: '+374', name: 'Armenia' },
  { code: 'KZ', dialCode: '+7', name: 'Kazakhstan' },
  { code: 'AE', dialCode: '+971', name: 'United Arab Emirates' },
  { code: 'SA', dialCode: '+966', name: 'Saudi Arabia' },
  { code: 'EG', dialCode: '+20', name: 'Egypt' },
  { code: 'IL', dialCode: '+972', name: 'Israel' },
  { code: 'JP', dialCode: '+81', name: 'Japan' },
  { code: 'CN', dialCode: '+86', name: 'China' },
  { code: 'KR', dialCode: '+82', name: 'South Korea' },
  { code: 'IN', dialCode: '+91', name: 'India' },
  { code: 'AU', dialCode: '+61', name: 'Australia' },
  { code: 'NZ', dialCode: '+64', name: 'New Zealand' },
  { code: 'BR', dialCode: '+55', name: 'Brazil' },
  { code: 'MX', dialCode: '+52', name: 'Mexico' },
  { code: 'CA', dialCode: '+1', name: 'Canada' },
  { code: 'AR', dialCode: '+54', name: 'Argentina' },
];

// Countries for location picker
const COUNTRIES = [
  { code: 'TR', name: 'Türkiye' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'AT', name: 'Austria' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'PL', name: 'Poland' },
  { code: 'RU', name: 'Russia' },
  { code: 'GR', name: 'Greece' },
  { code: 'PT', name: 'Portugal' },
  { code: 'AZ', name: 'Azerbaijan' },
  { code: 'GE', name: 'Georgia' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'JP', name: 'Japan' },
  { code: 'CN', name: 'China' },
  { code: 'KR', name: 'South Korea' },
  { code: 'AU', name: 'Australia' },
  { code: 'BR', name: 'Brazil' },
  { code: 'CA', name: 'Canada' },
];

// Turkey states/cities for location picker
const TURKEY_STATES: { [key: string]: string[] } = {
  'İstanbul': ['Kadıköy', 'Beşiktaş', 'Üsküdar', 'Şişli', 'Bakırköy', 'Beyoğlu', 'Fatih', 'Sarıyer', 'Kartal', 'Ataşehir', 'Maltepe', 'Pendik', 'Tuzla', 'Beylikdüzü', 'Başakşehir', 'Esenyurt'],
  'Ankara': ['Çankaya', 'Keçiören', 'Yenimahalle', 'Mamak', 'Etimesgut', 'Sincan', 'Altındağ', 'Pursaklar', 'Gölbaşı', 'Polatlı'],
  'İzmir': ['Konak', 'Karşıyaka', 'Bornova', 'Buca', 'Çiğli', 'Bayraklı', 'Gaziemir', 'Balçova', 'Narlıdere', 'Karabağlar'],
  'Antalya': ['Muratpaşa', 'Konyaaltı', 'Kepez', 'Alanya', 'Manavgat', 'Serik', 'Side', 'Belek', 'Lara', 'Kemer'],
  'Bursa': ['Osmangazi', 'Nilüfer', 'Yıldırım', 'Mudanya', 'Gemlik', 'İnegöl', 'Gürsu', 'Kestel'],
  'Adana': ['Seyhan', 'Çukurova', 'Yüreğir', 'Sarıçam', 'Ceyhan', 'Kozan'],
  'Konya': ['Selçuklu', 'Meram', 'Karatay', 'Ereğli', 'Akşehir', 'Beyşehir'],
  'Gaziantep': ['Şahinbey', 'Şehitkamil', 'Nizip', 'İslahiye', 'Nurdağı'],
  'Mersin': ['Mezitli', 'Yenişehir', 'Toroslar', 'Akdeniz', 'Tarsus', 'Erdemli'],
  'Kayseri': ['Melikgazi', 'Kocasinan', 'Talas', 'Hacılar', 'İncesu'],
};

// Professions list
const PROFESSIONS = [
  'Doktor',
  'Mühendis',
  'Avukat',
  'Öğretmen',
  'Hemşire',
  'Polis',
  'Asker',
  'İşçi',
  'Memur',
  'Öğrenci',
  'Serbest Meslek',
  'Emekli',
  'Diğer',
];

// ID Countries
const ID_COUNTRIES = [
  { code: 'TR', name: 'T.C. Kimlik No', placeholder: 'XXXXXXXXXXX' },
  { code: 'US', name: 'SSN', placeholder: 'XXX-XX-XXXX' },
  { code: 'GB', name: 'National Insurance', placeholder: 'XX XX XX XX X' },
  { code: 'DE', name: 'Steueridentifikationsnummer', placeholder: 'XX XXX XXX XXX' },
  { code: 'FR', name: 'NIR', placeholder: 'X XX XX XX XXX XXX XX' },
  { code: 'OTHER', name: 'Diğer Ülke ID', placeholder: 'ID Numarası' },
];

interface AddEditCoachDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coach: Coach | null;
  onSuccess: () => void;
}

export default function AddEditCoachDialog({
  open,
  onOpenChange,
  coach,
  onSuccess,
}: AddEditCoachDialogProps) {
  const t = useTranslations('privateLessons');
  const tCommon = useTranslations('common');
  const { selectedClub } = useClubStore();

  const [formData, setFormData] = useState<CoachFormState>(initialCoachFormState);
  const [saving, setSaving] = useState(false);
  const [birthDateOpen, setBirthDateOpen] = useState(false);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      if (coach && !coach.isManual) {
        toast.info(t('messages.editLimitedForRegisteredCoaches'));
      }
      setFormData(initialCoachFormState);
    }
  }, [open, coach, t]);

  // Handle form field change
  const handleChange = (field: keyof CoachFormState, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle country change - reset state and city
  const handleCountryChange = (countryCode: string) => {
    const country = COUNTRIES.find(c => c.code === countryCode);
    setFormData((prev) => ({
      ...prev,
      country: countryCode,
      countryName: country?.name || '',
      state: '',
      stateName: '',
      city: '',
    }));
  };

  // Handle state change - reset city
  const handleStateChange = (stateName: string) => {
    setFormData((prev) => ({
      ...prev,
      state: stateName,
      stateName: stateName,
      city: '',
    }));
  };

  // Get available states based on country
  const availableStates = useMemo(() => {
    if (formData.country === 'TR') {
      return Object.keys(TURKEY_STATES);
    }
    return [];
  }, [formData.country]);

  // Get available cities based on state
  const availableCities = useMemo(() => {
    if (formData.country === 'TR' && formData.state) {
      return TURKEY_STATES[formData.state] || [];
    }
    return [];
  }, [formData.country, formData.state]);

  // Get phone dial code
  const phoneDialCode = useMemo(() => {
    const country = PHONE_COUNTRY_CODES.find(c => c.code === formData.phoneCountryCode);
    return country?.dialCode || '+90';
  }, [formData.phoneCountryCode]);

  // Get ID placeholder
  const idPlaceholder = useMemo(() => {
    const idCountry = ID_COUNTRIES.find(c => c.code === formData.idCountry);
    return idCountry?.placeholder || 'ID Numarası';
  }, [formData.idCountry]);

  // Validate form
  const isValid =
    formData.firstName.trim() &&
    formData.lastName.trim() &&
    formData.username.trim() &&
    formData.email.trim() &&
    formData.password.trim() &&
    formData.password.length >= 6 &&
    formData.sportType;

  // Handle save
  const handleSave = async () => {
    if (!selectedClub || !isValid) return;

    setSaving(true);
    try {
      await createCoach(selectedClub.id, {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone ? `${phoneDialCode}${formData.phone}` : '',
        address: formData.address || `${formData.city}, ${formData.stateName}, ${formData.countryName}`,
        country: formData.country,
        countryName: formData.countryName,
        state: formData.state,
        stateName: formData.stateName,
        city: formData.city,
        tcId: formData.tcId,
        idCountry: formData.idCountry,
        birthDate: formData.birthDate,
        gender: formData.gender,
        profession: formData.profession,
        sportType: formData.sportType,
        specialization: formData.specialization,
        availabilityNotes: formData.availabilityNotes,
      });
      toast.success(t('messages.coachCreated'));
      onSuccess();
    } catch (error: any) {
      console.error('Error creating coach:', error);
      if (error.code === 'auth/email-already-in-use') {
        toast.error(t('errors.emailInUse'));
      } else {
        toast.error(t('errors.saveFailed'));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            {t('dialogs.addCoach.title')}
          </DialogTitle>
          <DialogDescription>{t('dialogs.addCoach.description')}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh] pr-4">
          <div className="space-y-6 py-4">
            {/* Section: Basic Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <User className="h-4 w-4" />
                {t('sections.basicInfo')}
              </div>
              <Separator />

              <div className="grid grid-cols-2 gap-4">
                {/* First Name */}
                <div className="space-y-2">
                  <Label htmlFor="firstName">{t('fields.firstName')} *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    placeholder={t('placeholders.firstName')}
                  />
                </div>

                {/* Last Name */}
                <div className="space-y-2">
                  <Label htmlFor="lastName">{t('fields.lastName')} *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    placeholder={t('placeholders.lastName')}
                  />
                </div>
              </div>

              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username">{t('fields.username')} *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                  placeholder={t('placeholders.username')}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">{t('fields.email')} *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder={t('placeholders.email')}
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">{t('fields.password')} *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder={t('placeholders.password')}
                />
                <p className="text-xs text-muted-foreground">
                  {t('messages.passwordMinLength')}
                </p>
              </div>
            </div>

            {/* Section: Contact */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Phone className="h-4 w-4" />
                {t('sections.contact')}
              </div>
              <Separator />

              {/* Phone with country code */}
              <div className="space-y-2">
                <Label>{t('fields.phone')}</Label>
                <div className="flex gap-2">
                  <Select
                    value={formData.phoneCountryCode}
                    onValueChange={(v) => handleChange('phoneCountryCode', v)}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <ScrollArea className="h-[200px]">
                        {PHONE_COUNTRY_CODES.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.code} {country.dialCode}
                          </SelectItem>
                        ))}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="5XX XXX XX XX"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Section: Location */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {t('sections.location')}
              </div>
              <Separator />

              {/* Country */}
              <div className="space-y-2">
                <Label>{t('fields.country')}</Label>
                <Select
                  value={formData.country}
                  onValueChange={handleCountryChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('placeholders.selectCountry')} />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-[200px]">
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* State/Province */}
                <div className="space-y-2">
                  <Label>{t('fields.stateProvince')}</Label>
                  {formData.country === 'TR' ? (
                    <Select
                      value={formData.state}
                      onValueChange={handleStateChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('placeholders.selectState')} />
                      </SelectTrigger>
                      <SelectContent>
                        <ScrollArea className="h-[200px]">
                          {availableStates.map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={formData.stateName}
                      onChange={(e) => {
                        handleChange('state', e.target.value);
                        handleChange('stateName', e.target.value);
                      }}
                      placeholder={t('placeholders.stateProvince')}
                    />
                  )}
                </div>

                {/* City/District */}
                <div className="space-y-2">
                  <Label>{t('fields.cityDistrict')}</Label>
                  {formData.country === 'TR' && formData.state ? (
                    <Select
                      value={formData.city}
                      onValueChange={(v) => handleChange('city', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t('placeholders.selectCity')} />
                      </SelectTrigger>
                      <SelectContent>
                        <ScrollArea className="h-[200px]">
                          {availableCities.map((city) => (
                            <SelectItem key={city} value={city}>
                              {city}
                            </SelectItem>
                          ))}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      placeholder={t('placeholders.cityDistrict')}
                    />
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address">{t('fields.address')}</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder={t('placeholders.address')}
                  rows={2}
                />
              </div>
            </div>

            {/* Section: Identity */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <CreditCard className="h-4 w-4" />
                {t('sections.identity')}
              </div>
              <Separator />

              {/* TC/ID with country selector */}
              <div className="space-y-2">
                <Label>{t('fields.nationalId')}</Label>
                <div className="flex gap-2">
                  <Select
                    value={formData.idCountry}
                    onValueChange={(v) => handleChange('idCountry', v)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ID_COUNTRIES.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={formData.tcId}
                    onChange={(e) => handleChange('tcId', e.target.value)}
                    placeholder={idPlaceholder}
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Birth Date */}
              <div className="space-y-2">
                <Label>{t('fields.birthDate')}</Label>
                <Popover open={birthDateOpen} onOpenChange={setBirthDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !formData.birthDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.birthDate ? (
                        format(formData.birthDate, 'dd.MM.yyyy', { locale: tr })
                      ) : (
                        tCommon('selectDate')
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.birthDate || undefined}
                      onSelect={(date) => {
                        handleChange('birthDate', date || null);
                        setBirthDateOpen(false);
                      }}
                      disabled={(date) => date > new Date()}
                      initialFocus
                      captionLayout="dropdown"
                      fromYear={1940}
                      toYear={new Date().getFullYear()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Gender */}
                <div className="space-y-2">
                  <Label>{t('fields.gender')}</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(v) => handleChange('gender', v as Gender)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('placeholders.selectGender')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Erkek">{tCommon('male')}</SelectItem>
                      <SelectItem value="Kadın">{tCommon('female')}</SelectItem>
                      <SelectItem value="Diğer">{tCommon('other')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Profession */}
                <div className="space-y-2">
                  <Label>{t('fields.profession')}</Label>
                  <Select
                    value={formData.profession}
                    onValueChange={(v) => handleChange('profession', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('placeholders.selectProfession')} />
                    </SelectTrigger>
                    <SelectContent>
                      <ScrollArea className="h-[200px]">
                        {PROFESSIONS.map((prof) => (
                          <SelectItem key={prof} value={prof}>
                            {t(`professions.${prof.toLowerCase().replace(/\s+/g, '')}`) || prof}
                          </SelectItem>
                        ))}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Section: Coach Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Dumbbell className="h-4 w-4" />
                {t('sections.coachInfo')}
              </div>
              <Separator />

              {/* Sport Type */}
              <div className="space-y-2">
                <Label>{t('fields.sportType')} *</Label>
                <Select
                  value={formData.sportType}
                  onValueChange={(v) => handleChange('sportType', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('placeholders.selectSportType')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tennis">{t('coachRoles.tennis')}</SelectItem>
                    <SelectItem value="conditioning">{t('coachRoles.conditioning')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Specialization */}
              <div className="space-y-2">
                <Label htmlFor="specialization">{t('fields.specialization')}</Label>
                <Input
                  id="specialization"
                  value={formData.specialization}
                  onChange={(e) => handleChange('specialization', e.target.value)}
                  placeholder={t('placeholders.specialization')}
                />
              </div>

              {/* Availability Notes */}
              <div className="space-y-2">
                <Label htmlFor="availabilityNotes">{t('fields.availabilityNotes')}</Label>
                <Textarea
                  id="availabilityNotes"
                  value={formData.availabilityNotes}
                  onChange={(e) => handleChange('availabilityNotes', e.target.value)}
                  placeholder={t('placeholders.availabilityNotes')}
                  rows={3}
                />
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {t('actions.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={!isValid || saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('actions.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
