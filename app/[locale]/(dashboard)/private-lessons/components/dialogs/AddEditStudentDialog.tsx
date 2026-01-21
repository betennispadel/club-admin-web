'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useClubStore } from '@/stores/clubStore';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Loader2,
  CalendarIcon,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import type { StudentOption, LessonType } from '@/lib/types/private-lessons';
import { LESSON_TYPES, USER_LEVELS, GENDERS } from '@/lib/types/private-lessons';
import { createStudent, updateStudent } from '@/lib/firebase/private-lessons';

// Country list (common ones first)
const COUNTRIES = [
  { code: 'TR', name: 'Türkiye' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'AT', name: 'Austria' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'PT', name: 'Portugal' },
  { code: 'RU', name: 'Russia' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'JP', name: 'Japan' },
  { code: 'CN', name: 'China' },
  { code: 'KR', name: 'South Korea' },
];

// Turkey cities
const TURKEY_CITIES = [
  'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep',
  'Şanlıurfa', 'Kocaeli', 'Mersin', 'Diyarbakır', 'Hatay', 'Manisa', 'Kayseri',
  'Samsun', 'Balıkesir', 'Kahramanmaraş', 'Van', 'Aydın', 'Denizli', 'Sakarya',
  'Tekirdağ', 'Muğla', 'Mardin', 'Eskişehir', 'Erzurum', 'Batman', 'Elazığ', 'Trabzon'
];

const PROFESSIONS = [
  'Doktor', 'Mühendis', 'Avukat', 'Öğretmen', 'Hemşire',
  'Polis', 'Asker', 'İşçi', 'Memur', 'Öğrenci',
  'Serbest Meslek', 'Emekli', 'Diğer'
];

const INSTALLMENT_OPTIONS = [
  { label: 'Tek Ödeme', value: 1 },
  { label: '2 Taksit', value: 2 },
  { label: '3 Taksit', value: 3 },
  { label: '4 Taksit', value: 4 },
  { label: '6 Taksit', value: 6 },
  { label: '12 Taksit', value: 12 },
];

interface StudentFormData {
  id?: string;
  // Basic Info
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  // Contact
  phone: string;
  phoneCountry: string;
  // Location
  country: string;
  countryName: string;
  state: string;
  city: string;
  address: string;
  // Identity
  tcId: string;
  idCountry: string;
  // Demographics
  birthDate: Date | null;
  gender: string;
  level: string;
  profession: string;
  // Lesson
  lessonType: string;
  appliedLessonTypes: LessonType[];
  // Finance
  price: string;
  membershipYears: string;
  membershipStartDate: Date | null;
  installmentCount: number;
  installmentDay: string;
  // Other
  notes: string;
  isManual: boolean;
}

const initialFormData: StudentFormData = {
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  password: '',
  phone: '',
  phoneCountry: 'TR',
  country: 'TR',
  countryName: 'Türkiye',
  state: '',
  city: '',
  address: '',
  tcId: '',
  idCountry: 'TR',
  birthDate: null,
  gender: '',
  level: '',
  profession: '',
  lessonType: '',
  appliedLessonTypes: [],
  price: '',
  membershipYears: '1',
  membershipStartDate: new Date(),
  installmentCount: 1,
  installmentDay: '1',
  notes: '',
  isManual: true,
};

interface AddEditStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: StudentOption | null;
  onSuccess: () => void;
}

export default function AddEditStudentDialog({
  open,
  onOpenChange,
  student,
  onSuccess,
}: AddEditStudentDialogProps) {
  const t = useTranslations('privateLessons');
  const { selectedClub } = useClubStore();

  const [formData, setFormData] = useState<StudentFormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [birthDateOpen, setBirthDateOpen] = useState(false);
  const [membershipDateOpen, setMembershipDateOpen] = useState(false);

  // Reset form when dialog opens/closes or student changes
  useEffect(() => {
    if (open) {
      if (student) {
        // Parse name into first and last name
        const nameParts = student.name.split(' ');
        const lastName = nameParts.pop() || '';
        const firstName = nameParts.join(' ') || '';

        setFormData({
          id: student.id,
          firstName,
          lastName,
          username: (student as any).username || '',
          email: student.email || '',
          password: '', // Not needed for editing
          phone: student.phone || '',
          phoneCountry: 'TR',
          country: (student as any).country || 'TR',
          countryName: (student as any).countryName || 'Türkiye',
          state: (student as any).state || '',
          city: (student as any).city || '',
          address: (student as any).address || '',
          tcId: student.tcId || '',
          idCountry: student.idCountry || 'TR',
          birthDate: student.birthDate && typeof (student.birthDate as any).toDate === 'function'
            ? (student.birthDate as any).toDate()
            : null,
          gender: student.gender || '',
          level: student.level || '',
          profession: student.profession || '',
          lessonType: student.lessonType || '',
          appliedLessonTypes: student.appliedLessonTypes || [],
          price: student.price?.toString() || '',
          membershipYears: (student as any).membershipYears?.toString() || '1',
          membershipStartDate: (student as any).membershipStartDate?.toDate?.() || new Date(),
          installmentCount: (student as any).installmentCount || 1,
          installmentDay: (student as any).installmentDay?.toString() || '1',
          notes: student.notes || '',
          isManual: student.type === 'manual',
        });
      } else {
        setFormData(initialFormData);
      }
    }
  }, [open, student]);

  // Handle form field change
  const handleChange = (field: keyof StudentFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle country change
  const handleCountryChange = (code: string) => {
    const country = COUNTRIES.find(c => c.code === code);
    setFormData(prev => ({
      ...prev,
      country: code,
      countryName: country?.name || '',
      state: '',
      city: '',
    }));
  };

  // Handle lesson type multi-select toggle
  const toggleLessonType = (type: LessonType) => {
    setFormData(prev => {
      const current = prev.appliedLessonTypes || [];
      if (current.includes(type)) {
        return { ...prev, appliedLessonTypes: current.filter(t => t !== type) };
      }
      return { ...prev, appliedLessonTypes: [...current, type] };
    });
  };

  // Format price input
  const handlePriceChange = (value: string) => {
    // Remove non-numeric characters except decimal point
    const cleaned = value.replace(/[^\d.,]/g, '').replace(',', '.');
    handleChange('price', cleaned);
  };

  // Calculate installment preview
  const installmentPreview = useMemo(() => {
    const price = parseFloat(formData.price) || 0;
    if (price <= 0 || formData.installmentCount <= 0) return [];

    const installmentAmount = price / formData.installmentCount;
    const startDate = formData.membershipStartDate || new Date();
    const installmentDay = parseInt(formData.installmentDay) || 1;

    return Array.from({ length: formData.installmentCount }, (_, i) => {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      dueDate.setDate(installmentDay);

      return {
        number: i + 1,
        amount: i === formData.installmentCount - 1
          ? price - (installmentAmount * (formData.installmentCount - 1))
          : installmentAmount,
        dueDate,
      };
    });
  }, [formData.price, formData.installmentCount, formData.membershipStartDate, formData.installmentDay]);

  // Validate form
  // Validation: For new students, require username, email, password
  const isValid = formData.id
    ? formData.firstName.trim().length > 0 && formData.lastName.trim().length > 0
    : formData.firstName.trim().length > 0 &&
      formData.lastName.trim().length > 0 &&
      formData.username.trim().length > 0 &&
      formData.email.trim().length > 0 &&
      formData.password.length >= 6;

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  // Handle save
  const handleSave = async () => {
    if (!selectedClub || !isValid) return;

    setSaving(true);
    try {
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
      const price = parseFloat(formData.price) || 0;

      const studentData: any = {
        name: fullName,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        username: formData.username.toLowerCase().trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone,
        country: formData.country,
        countryName: formData.countryName,
        state: formData.state,
        stateName: formData.state,
        city: formData.city,
        address: formData.address || `${formData.city}, ${formData.state}, ${formData.countryName}`,
        tcId: formData.tcId,
        idCountry: formData.idCountry,
        birthDate: formData.birthDate,
        gender: formData.gender || undefined,
        level: formData.level,
        profession: formData.profession,
        lessonType: formData.lessonType || undefined,
        appliedLessonTypes: formData.appliedLessonTypes,
        notes: formData.notes,
      };

      // Add finance fields if price is set
      if (price > 0) {
        const installmentDay = formData.installmentCount > 1
          ? parseInt(formData.installmentDay) || 1
          : (formData.membershipStartDate || new Date()).getDate();

        studentData.price = price;
        studentData.membershipFee = price;
        studentData.membershipYears = parseInt(formData.membershipYears) || 1;
        studentData.membershipStartDate = formData.membershipStartDate;
        studentData.installmentCount = formData.installmentCount;
        studentData.installmentDay = installmentDay;
        studentData.paymentStatus = 'Beklemede';
        studentData.totalPaid = 0;
        studentData.remainingAmount = price;

        // Create installment plan
        studentData.installments = installmentPreview.map(inst => ({
          installmentNumber: inst.number,
          amount: inst.amount,
          dueDate: inst.dueDate,
          status: 'Beklemede',
        }));
      }

      if (formData.id) {
        await updateStudent(selectedClub.id, formData.id, studentData);
        toast.success(t('messages.studentUpdated'));
      } else {
        await createStudent(selectedClub.id, studentData);
        toast.success(t('messages.studentCreated'));
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving student:', error);
      toast.error(t('errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {formData.id ? t('dialogs.editStudent.title') : t('dialogs.addStudent.title')}
          </DialogTitle>
          <DialogDescription>
            {formData.id
              ? t('dialogs.editStudent.description')
              : t('dialogs.addStudent.description')}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh] pr-4">
          <div className="space-y-6 py-4">
            {/* Basic Info Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <User className="h-4 w-4" />
                {t('sections.basicInfo') || 'Temel Bilgiler'}
              </div>

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
                  onChange={(e) => handleChange('username', e.target.value.toLowerCase())}
                  placeholder={t('placeholders.username')}
                  disabled={!!formData.id}
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
                  disabled={!!formData.id}
                />
              </div>

              {/* Password - only for new students */}
              {!formData.id && (
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
              )}
            </div>

            <Separator />

            {/* Contact Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Phone className="h-4 w-4" />
                {t('sections.contactInfo')}
              </div>

              {/* Phone with Country Code */}
              <div className="space-y-2">
                <Label htmlFor="phone">{t('fields.phone')}</Label>
                <div className="flex gap-2">
                  <Select
                    value={formData.phoneCountry}
                    onValueChange={(v) => handleChange('phoneCountry', v)}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder={t('placeholders.phone')}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Location Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <MapPin className="h-4 w-4" />
                {t('sections.location') || 'Konum Bilgileri'}
              </div>

              <div className="grid grid-cols-3 gap-4">
                {/* Country */}
                <div className="space-y-2">
                  <Label>{t('fields.country') || 'Ülke'}</Label>
                  <Select
                    value={formData.country}
                    onValueChange={handleCountryChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Ülke seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* State/Province */}
                <div className="space-y-2">
                  <Label>{t('fields.state') || 'İl'}</Label>
                  <Input
                    value={formData.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                    placeholder="İl"
                  />
                </div>

                {/* City/District */}
                <div className="space-y-2">
                  <Label>{t('fields.city') || 'İlçe'}</Label>
                  {formData.country === 'TR' ? (
                    <Select
                      value={formData.city}
                      onValueChange={(v) => handleChange('city', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="İlçe seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {TURKEY_CITIES.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      placeholder="İlçe"
                    />
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Identity Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <FileText className="h-4 w-4" />
                {t('sections.identity') || 'Kimlik Bilgileri'}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* ID Country */}
                <div className="space-y-2">
                  <Label>{t('fields.idCountry') || 'Kimlik Ülkesi'}</Label>
                  <Select
                    value={formData.idCountry}
                    onValueChange={(v) => handleChange('idCountry', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* TC/ID Number */}
                <div className="space-y-2">
                  <Label htmlFor="tcId">
                    {formData.idCountry === 'TR' ? t('fields.tcId') : 'ID Number'}
                  </Label>
                  <Input
                    id="tcId"
                    value={formData.tcId}
                    onChange={(e) => handleChange('tcId', e.target.value)}
                    placeholder={t('placeholders.tcId')}
                    maxLength={formData.idCountry === 'TR' ? 11 : 20}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
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
                        {formData.birthDate
                          ? format(formData.birthDate, 'dd/MM/yyyy')
                          : t('placeholders.selectDate')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.birthDate || undefined}
                        onSelect={(date) => {
                          handleChange('birthDate', date);
                          setBirthDateOpen(false);
                        }}
                        disabled={(date) => date > new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Gender */}
                <div className="space-y-2">
                  <Label>{t('fields.gender')}</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(v) => handleChange('gender', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('placeholders.selectGender')} />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDERS.map((gender) => (
                        <SelectItem key={gender} value={gender}>
                          {gender}
                        </SelectItem>
                      ))}
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
                      {PROFESSIONS.map((profession) => (
                        <SelectItem key={profession} value={profession}>
                          {profession}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Lesson Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <User className="h-4 w-4" />
                {t('sections.lessonInfo') || 'Ders Bilgileri'}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Level */}
                <div className="space-y-2">
                  <Label>{t('fields.level')}</Label>
                  <Select
                    value={formData.level}
                    onValueChange={(v) => handleChange('level', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('placeholders.selectLevel')} />
                    </SelectTrigger>
                    <SelectContent>
                      {USER_LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Primary Lesson Type */}
                <div className="space-y-2">
                  <Label>{t('fields.lessonType')}</Label>
                  <Select
                    value={formData.lessonType}
                    onValueChange={(v) => handleChange('lessonType', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('placeholders.selectLessonType')} />
                    </SelectTrigger>
                    <SelectContent>
                      {LESSON_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Applied Lesson Types (Multi-select) */}
              <div className="space-y-2">
                <Label>{t('fields.appliedLessonTypes') || 'Başvurulan Ders Türleri'}</Label>
                <div className="flex gap-2">
                  {LESSON_TYPES.map((type) => (
                    <Button
                      key={type}
                      type="button"
                      variant={formData.appliedLessonTypes.includes(type as LessonType) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleLessonType(type as LessonType)}
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <Separator />

            {/* Finance Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <CreditCard className="h-4 w-4" />
                {t('sections.financialSettings')}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Price */}
                <div className="space-y-2">
                  <Label htmlFor="price">{t('fields.price')}</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₺</span>
                    <Input
                      id="price"
                      value={formData.price}
                      onChange={(e) => handlePriceChange(e.target.value)}
                      placeholder="0.00"
                      className="pl-8"
                    />
                  </div>
                </div>

                {/* Membership Years */}
                <div className="space-y-2">
                  <Label htmlFor="membershipYears">{t('fields.membershipYears')}</Label>
                  <Input
                    id="membershipYears"
                    type="number"
                    min="1"
                    value={formData.membershipYears}
                    onChange={(e) => handleChange('membershipYears', e.target.value)}
                    placeholder="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Membership Start Date */}
                <div className="space-y-2">
                  <Label>{t('fields.startDate')}</Label>
                  <Popover open={membershipDateOpen} onOpenChange={setMembershipDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !formData.membershipStartDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.membershipStartDate
                          ? format(formData.membershipStartDate, 'dd/MM/yyyy')
                          : t('placeholders.selectDate')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.membershipStartDate || undefined}
                        onSelect={(date) => {
                          handleChange('membershipStartDate', date);
                          setMembershipDateOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Installment Count */}
                <div className="space-y-2">
                  <Label>{t('fields.installmentCount')}</Label>
                  <Select
                    value={formData.installmentCount.toString()}
                    onValueChange={(v) => handleChange('installmentCount', parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INSTALLMENT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value.toString()}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Installment Day (only if > 1 installment) */}
              {formData.installmentCount > 1 && (
                <div className="space-y-2">
                  <Label htmlFor="installmentDay">{t('fields.installmentDay')}</Label>
                  <Input
                    id="installmentDay"
                    type="number"
                    min="1"
                    max="28"
                    value={formData.installmentDay}
                    onChange={(e) => handleChange('installmentDay', e.target.value)}
                    placeholder="1"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('labels.dayOfMonth', { day: formData.installmentDay || '1' })}
                  </p>
                </div>
              )}

              {/* Installment Preview */}
              {installmentPreview.length > 0 && parseFloat(formData.price) > 0 && (
                <div className="space-y-2 p-3 rounded-lg bg-muted/50">
                  <p className="text-sm font-medium">{t('labels.installmentPreview')}</p>
                  <div className="space-y-1">
                    {installmentPreview.slice(0, 3).map((inst) => (
                      <div key={inst.number} className="flex justify-between text-sm">
                        <span>{inst.number}. Taksit - {format(inst.dueDate, 'dd/MM/yyyy')}</span>
                        <span className="font-medium">{formatCurrency(inst.amount)}</span>
                      </div>
                    ))}
                    {installmentPreview.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{installmentPreview.length - 3} taksit daha...
                      </p>
                    )}
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between text-sm font-semibold">
                    <span>{t('labels.total')}</span>
                    <span>{formatCurrency(parseFloat(formData.price) || 0)}</span>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">{t('fields.notes')}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder={t('placeholders.notes')}
                rows={3}
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {t('actions.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={!isValid || saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {formData.id ? t('actions.save') : t('actions.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
