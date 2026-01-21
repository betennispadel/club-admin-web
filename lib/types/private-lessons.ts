import { Timestamp } from 'firebase/firestore';

// Status Types
export type PaymentStatus = 'Ödendi' | 'Ödenmedi' | 'Beklemede' | 'Kısmi Ödeme';
export type PaymentMethod = 'Nakit' | 'Kredi Kartı' | 'Havale/EFT' | 'Diğer';
export type LessonStatus = 'Planlandı' | 'Devam Ediyor' | 'Tamamlandı' | 'İptal Edildi';
export type LessonLevel = 'Belirtilmedi' | 'Başlangıç' | 'Orta' | 'İleri' | 'Profesyonel';
export type LessonType = 'Bireysel' | 'Grup' | 'Kondisyon' | '';
export type RequestStatus = 'Onay Bekliyor' | 'Onaylandı' | 'Reddedildi' | 'İptal Edildi';
export type AttendanceStatus = 'Geldi' | 'Gelmedi' | 'İzinli' | 'Bekleniyor';
export type Gender = 'Erkek' | 'Kadın' | 'Diğer' | '';
export type StudentType = 'user' | 'manual';
export type PlayerStatus = 'Aktif' | 'Dondurulmuş' | 'Bıraktı' | 'Geçici Dondurulmuş';

// Schedule Types
export interface ScheduleEntry {
  day: string;
  startTime: string;
  endTime: string;
  location?: string;
}

// Installment Types
export interface Installment {
  installmentNumber: number;
  dueDate: Timestamp;
  amount: number;
  status: 'Beklemede' | 'Ödendi' | 'Gecikmiş';
  paymentDate?: Timestamp;
  lateFee?: number;
  paymentMethod?: PaymentMethod;
  notes?: string;
  overduedays?: number;
}

// Lesson Membership
export interface LessonMembership {
  id: string;
  lessonId: string;
  lessonName: string;
  lessonType: LessonType;
  coachId?: string;
  coachName?: string;
  price: number;
  totalPaid: number;
  remainingAmount: number;
  startDate: Timestamp;
  endDate: Timestamp;
  membershipYears: number;
  installmentCount: number;
  installmentDay: number;
  installments: Installment[];
  status: 'Active' | 'Completed' | 'Cancelled' | 'Renewed';
  paymentStatus: 'Beklemede' | 'Ödendi' | 'Gecikmiş' | 'Kısmen Ödendi';
  createdAt: Timestamp;
  createdFrom: 'request_approval' | 'renewal' | 'template_approval' | 'template_approval_group_batch';
  notes?: string;
}

// Lesson Student
export interface LessonStudent {
  studentId: string;
  studentName: string;
  isManual: boolean;
  attendedCount: number;
  renewalRequested?: boolean;
  packageHistory?: {
    packageNumber: number;
    attendedCount: number;
    completedDate?: Timestamp;
    price?: number;
    notes?: string;
  }[];
  currentPackageNumber?: number;
}

// Main Lesson Type
export interface Lesson {
  id: string;
  groupName: string;
  coachId: string;
  coachName: string;
  lessonType: LessonType;
  selectedDays?: string[];
  startTime: string;
  duration: number;
  students: LessonStudent[];
  status: LessonStatus;
  addedDate: Timestamp;
  lessonDate?: Timestamp;
  notes?: string;
  level: LessonLevel;
  location?: string;
  coachNotes?: string;
  packageSize: number;
  autoRenewEnabled?: boolean;
  renewalRequested?: boolean;
  trainingSchedule?: ScheduleEntry[];
  conditioningSchedule?: ScheduleEntry[];
  startDate?: Date;
  endDate?: Date;
  price?: number;
  installmentOption?: string;
  installmentDay?: number;
  automaticRenewal?: boolean;
  membershipYears?: number;
  membershipStartDate?: Timestamp;
  packageHistory?: {
    packageNumber: number;
    startDate: Timestamp;
    endDate?: Timestamp;
    renewedBy?: string;
    renewalDate?: Timestamp;
    price?: number;
    notes?: string;
  }[];
  currentPackageNumber?: number;
}

// Daily Lesson (for attendance)
export interface DailyLesson extends Lesson {
  dailyStartTime: string;
  dailyEndTime: string;
  dailyLocation?: string;
  scheduleType: 'training' | 'conditioning';
}

// Coach Types
export interface CoachFinancialInfo {
  pricePerLesson: number;
  currentPeriodLessonsCompleted: number;
  totalLessonsCompleted: number;
  currentPeriodEarnings: number;
  totalEarnings: number;
  lastPaymentDate?: Timestamp;
  lastPaymentAmount?: number;
  unpaidLessons: number;
  unpaidAmount: number;
  currentPeriodStartDate?: Timestamp;
}

export interface Coach {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  specialization?: string;
  availabilityNotes?: string;
  isManual: boolean;
  role?: string;
  addedDate?: Timestamp;
  financialInfo?: CoachFinancialInfo;
}

export interface ManualCoach {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  specialization?: string;
  availabilityNotes?: string;
  addedDate: Timestamp;
  role?: string;
}

// Student Types
export interface StudentOption {
  id: string;
  name: string;
  type: StudentType;
  phone?: string;
  email?: string;
  username?: string;
  notes?: string;
  addedDate?: Timestamp;
  lessonType?: LessonType;
  role?: string;
  level?: string;
  gender?: Gender;
  birthDate?: Timestamp;
  profession?: string;
  tcId?: string;
  idCountry?: string;
  appliedLessonTypes?: LessonType[];
  playerStatus?: PlayerStatus;
  freezeReason?: string;
  freezeStartDate?: Timestamp;
  freezeEndDate?: Timestamp;
  lastStatusChange?: Timestamp;
  statusChangeReason?: string;
  statusChangeBy?: string;
  lessonMemberships?: LessonMembership[];
  financialHistory?: FinancialHistoryEntry[];
  price?: number;
  totalPaid?: number;
  remainingAmount?: number;
  paymentStatus?: PaymentStatus;
  endDate?: Timestamp;
  startDate?: Timestamp;
  nextPaymentDate?: Timestamp;
  membershipFee?: number;
  membershipYears?: number;
  membershipStartDate?: Timestamp;
  installments?: Installment[];
  installmentOption?: string;
  installmentDay?: number;
  installmentCount?: number;
  userId?: string;
}

export interface ManualStudent {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
  addedDate: Timestamp;
  lessonType?: LessonType;
  level?: string;
  gender?: Gender;
  birthDate?: Timestamp;
  profession?: string;
  tcId?: string;
  idCountry?: string;
  appliedLessonTypes?: LessonType[];
  playerStatus?: PlayerStatus;
  freezeReason?: string;
  freezeStartDate?: Timestamp;
  freezeEndDate?: Timestamp;
  lastStatusChange?: Timestamp;
  statusChangeReason?: string;
  statusChangeBy?: string;
  lessonMemberships?: LessonMembership[];
  financialHistory?: FinancialHistoryEntry[];
  price?: number;
  membershipFee?: number;
  membershipYears?: number;
  membershipStartDate?: Timestamp;
  membershipEndDate?: Timestamp;
  installments?: Installment[];
  paymentHistory?: any[];
  totalPaid?: number;
  remainingAmount?: number;
  paymentStatus?: PaymentStatus;
  installmentOption?: string;
  installmentCount?: number;
  installmentDay?: number;
  nextPaymentDate?: Timestamp;
}

// Financial History
export interface FinancialHistoryEntry {
  id: string;
  lessonId: string;
  lessonName: string;
  lessonType: LessonType;
  coachId?: string;
  coachName?: string;
  price: number;
  totalPaid: number;
  remainingAmount: number;
  startDate: Timestamp;
  endDate: Timestamp;
  membershipYears: number;
  installmentCount: number;
  installments: Installment[];
  status: 'Completed' | 'Cancelled' | 'Renewed';
  completedAt: Timestamp;
  completionReason?: string;
  renewalInfo?: {
    renewedAt: Timestamp;
    newMembershipId: string;
    renewedBy?: string;
  };
  notes?: string;
}

// Request Types
export interface Request {
  id: string;
  studentId: string;
  studentName: string;
  studentPhone?: string;
  studentEmail?: string;
  requestDate: Timestamp;
  status: RequestStatus;
  requestedLessonType?: LessonType;
  lessonType?: LessonType;
  notes?: string;
  studentDetails?: { role?: string; level?: string; };
  canReapply?: boolean;
  reapplyGrantedDate?: Timestamp;
  reapplyGrantedBy?: string;
  reapplyHistory?: ReapplyHistoryEntry[];
  trainingSchedule?: ScheduleEntry[];
  conditioningSchedule?: ScheduleEntry[];
  location?: string;
  packageRenewalHistory?: PackageRenewalEntry[];
}

export interface ReapplyHistoryEntry {
  grantedDate: Timestamp;
  grantedBy: string;
  reason?: string;
}

export interface PackageRenewalEntry {
  renewalDate: Timestamp;
  renewedBy: string;
  packageType: LessonType;
  reason?: string;
}

// Template Request Types
export interface GroupUserInfo {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  tcId?: string;
  idCountry?: string;
  gender?: string;
  birthDate?: Date | Timestamp | null;
  profession?: string;
  level: string;
}

export interface TemplateRequest {
  id: string;
  templateName: string;
  coachId: string;
  coachName: string;
  studentId: string;
  studentName: string;
  requestDate: Timestamp;
  status: RequestStatus;
  lessonType: LessonType;
  duration: number;
  level: LessonLevel;
  maxStudents: number;
  preferredTime?: string;
  preferredDays?: string[];
  packageSize?: number;
  notes?: string;
  studentDetails?: { role?: string; level?: string; };
  studentType?: string;
  studentPhone?: string;
  studentEmail?: string;
  studentLevel?: string;
  studentTcId?: string;
  studentIdCountry?: string;
  studentGender?: string;
  studentBirthDate?: Timestamp;
  studentProfession?: string;
  studentAddress?: string;
  studentNotes?: string;
  finalTemplateName?: string;
  trainingSchedule?: ScheduleEntry[];
  conditioningSchedule?: ScheduleEntry[];
  location?: string;
  groupUsers?: GroupUserInfo[];
  approvedGroupUserEmails?: string[];
  createdUserIds?: string[];
  createdLessonId?: string;
}

// Attendance Types
export interface AttendanceRecord {
  id: string;
  lessonId: string;
  studentId: string;
  studentName?: string;
  coachId: string;
  attendanceDate: Timestamp;
  date?: Timestamp;
  status: AttendanceStatus;
  addedDate: Timestamp;
  rating?: number;
  scheduleType?: 'training' | 'conditioning';
}

// Form Types
export interface LessonFormState {
  id: string | null;
  groupName: string;
  selectedCoachId: string;
  coachId: string;
  lessonType: LessonType;
  selectedStudentOptionIds: string[];
  status: LessonStatus;
  level: LessonLevel;
  packageSize: string;
  trainingSchedule: ScheduleEntry[];
  conditioningSchedule: ScheduleEntry[];
  startDate: Date | null;
  price?: number;
  notes?: string;
}

export interface StudentFormState {
  id: string | null;
  name: string;
  phone: string;
  email: string;
  notes: string;
  lessonType: LessonType;
  level: string;
  gender: Gender;
  birthDate: Date | null;
  profession: string;
  tcId: string;
  idCountry: string;
}

export interface CoachFormState {
  id: string | null;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  phone: string;
  phoneCountryCode: string;
  address: string;
  country: string;
  countryName: string;
  state: string;
  stateName: string;
  city: string;
  tcId: string;
  idCountry: string;
  birthDate: Date | null;
  gender: Gender;
  profession: string;
  sportType: string;
  specialization: string;
  availabilityNotes: string;
}

export interface RequestFinancialData {
  price: number;
  membershipYears: number;
  membershipStartDate: Date;
  installmentCount: number;
  installmentDay: number;
  notes?: string;
  lessonType?: LessonType;
}

export interface PackageRenewalData {
  lessonId: string;
  studentId?: string;
  newPrice: number;
  notes?: string;
  membershipYears: number;
  membershipStartDate: Date;
  installmentCount: number;
  installmentDay: number;
  newPackageSize?: number;
}

// Payment Record Types
export type PaymentType = 'installment' | 'partial' | 'full' | 'lateFee' | 'renewal';

export interface PaymentRecord {
  id: string;
  playerId: string;
  playerName: string;
  teamId?: string | null;
  teamName?: string;
  amount: number;
  paymentDate: Timestamp;
  paymentMethod: PaymentMethod;
  installmentNumbers?: number[];
  isLateFee: boolean;
  membershipPlanId?: string;
  lessonMembershipId?: string;
  notes?: string | null;
  processedBy: string;
  paymentType: PaymentType;
}

export interface CoachPriceHistoryEntry {
  pricePerLesson: number;
  startDate: Timestamp;
  endDate?: Timestamp;
  setBy?: string;
  notes?: string;
}

export interface CoachPaymentRecord {
  id: string;
  coachId: string;
  coachName: string;
  amount: number;
  paymentDate: Timestamp;
  paymentMethod: PaymentMethod;
  lessonsIncluded: number;
  pricePerLesson: number;
  period: {
    startDate: Timestamp;
    endDate: Timestamp;
  };
  notes?: string;
  processedBy: string;
}

export interface CoachAdminNote {
  id: string;
  note: string;
  category: 'general' | 'performance' | 'payment' | 'schedule' | 'other';
  createdAt: Timestamp;
  createdBy: string;
}

// Extended Coach Financial Info
export interface CoachFinancialInfoExtended extends CoachFinancialInfo {
  priceHistory?: CoachPriceHistoryEntry[];
  paymentHistory?: CoachPaymentRecord[];
  adminNotes?: CoachAdminNote[];
}

// Constants
export const PAYMENT_METHODS: PaymentMethod[] = ['Nakit', 'Kredi Kartı', 'Havale/EFT', 'Diğer'];
export const LESSON_STATUSES: LessonStatus[] = ['Planlandı', 'Devam Ediyor', 'Tamamlandı', 'İptal Edildi'];
export const LESSON_LEVELS: LessonLevel[] = ['Belirtilmedi', 'Başlangıç', 'Orta', 'İleri', 'Profesyonel'];
export const USER_LEVELS = ['Master+', 'Master', 'A+', 'A', 'B+', 'B', 'C+', 'C', 'D+', 'D'];
export const LESSON_TYPES: LessonType[] = ['Bireysel', 'Grup', 'Kondisyon'];
export const ATTENDANCE_STATUSES: AttendanceStatus[] = ['Bekleniyor', 'Geldi', 'Gelmedi', 'İzinli'];
export const GENDERS: Gender[] = ['Erkek', 'Kadın', 'Diğer'];

export const WEEK_DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
export const WEEK_DAYS_SHORT = [
  { label: 'Pzt', value: '1' },
  { label: 'Sal', value: '2' },
  { label: 'Çar', value: '3' },
  { label: 'Per', value: '4' },
  { label: 'Cum', value: '5' },
  { label: 'Cmt', value: '6' },
  { label: 'Paz', value: '0' },
];

export const LESSON_PACKAGE_SIZES = Array.from({ length: 12 }, (_, i) => ({
  label: `${i + 1} Ders`,
  value: String(i + 1)
}));

export const LESSONS_PER_LOAD = 10;
export const REQUESTS_PER_LOAD = 10;

export const PLAYER_STATUSES: PlayerStatus[] = ['Aktif', 'Dondurulmuş', 'Geçici Dondurulmuş', 'Bıraktı'];

export const FREEZE_REASONS = [
  'Sağlık Sorunları',
  'İş/Okul Yoğunluğu',
  'Maddi Nedenler',
  'Seyahat/Tatil',
  'Aile Nedenleri',
  'Sakatlık',
  'Kişisel Nedenler',
  'Geçici Ara',
  'Sezon Sonu',
  'Diğer'
];

export const DELETE_REASONS = [
  'Kulüpten Ayrıldı',
  'Ödeme Yapmadı',
  'Kendi İsteğiyle',
  'Disiplin Nedeniyle',
  'Taşındı',
  'Sağlık Nedeniyle',
  'Kayıt Hatası',
  'Diğer'
];

export const PAYMENT_DELETE_REASONS = [
  'Yanlış Giriş',
  'Çift Kayıt',
  'İptal Edildi',
  'İade Yapıldı',
  'Hatalı Tutar',
  'Yanlış Kişi',
  'Test Kaydı',
  'Diğer'
];

export const INSTALLMENT_OPTIONS = [
  { label: 'Tek Ödeme', value: '1' },
  { label: '2 Taksit', value: '2' },
  { label: '3 Taksit', value: '3' },
  { label: '4 Taksit', value: '4' },
  { label: '6 Taksit', value: '6' },
  { label: '12 Taksit', value: '12' },
];

export const MEMBERSHIP_YEARS_OPTIONS = [
  { label: '1 Yıl', value: '1' },
  { label: '2 Yıl', value: '2' },
  { label: '3 Yıl', value: '3' },
  { label: '4 Yıl', value: '4' },
  { label: '5 Yıl', value: '5' },
];

// Initial Form States
export const initialLessonFormState: LessonFormState = {
  id: null,
  groupName: '',
  selectedCoachId: '',
  coachId: '',
  lessonType: '',
  selectedStudentOptionIds: [],
  status: 'Planlandı',
  level: 'Belirtilmedi',
  packageSize: '8',
  trainingSchedule: [],
  conditioningSchedule: [],
  startDate: null,
};

export const initialStudentFormState: StudentFormState = {
  id: null,
  name: '',
  phone: '',
  email: '',
  notes: '',
  lessonType: '',
  level: '',
  gender: '',
  birthDate: null,
  profession: '',
  tcId: '',
  idCountry: 'TR',
};

export const initialCoachFormState: CoachFormState = {
  id: null,
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  password: '',
  phone: '',
  phoneCountryCode: 'TR',
  address: '',
  country: '',
  countryName: '',
  state: '',
  stateName: '',
  city: '',
  tcId: '',
  idCountry: 'TR',
  birthDate: null,
  gender: '',
  profession: '',
  sportType: '',
  specialization: '',
  availabilityNotes: '',
};
