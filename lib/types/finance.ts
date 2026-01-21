import { Timestamp } from 'firebase/firestore';

// ============== FINANCIAL SUMMARY ==============

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  walletPoolTotal: number;
  negativeBalanceTotal: number;
  discountApplied: number;
  incomeBreakdown: CategoryBreakdown[];
  expenseBreakdown: CategoryBreakdown[];
}

export interface CategoryBreakdown {
  label: string;
  key: string;
  value: number;
  percentage: number;
  color: string;
  [key: string]: string | number;
}

// ============== DATE FILTERING ==============

export type DateFilterType = 'all' | 'today' | 'week' | 'month' | 'year' | 'custom';

export interface DateRange {
  start: Date;
  end: Date;
}

// ============== INCOME TYPES ==============

export interface ManualIncome {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: Timestamp;
  createdAt: Timestamp;
  createdBy?: string;
}

export interface TournamentIncome {
  id: string;
  tournamentId: string;
  tournamentName: string;
  amount: number;
  category: string;
  description?: string;
  date: Timestamp;
  createdAt: Timestamp;
}

export interface TournamentParticipantPayment {
  id: string;
  tournamentId: string;
  tournamentName: string;
  participantId: string;
  participantName: string;
  totalPaid: number;
  paymentDate: Timestamp;
}

// ============== EXPENSE TYPES ==============

export interface ManualExpense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: Timestamp;
  createdAt: Timestamp;
  createdBy?: string;
}

export interface CoachPayment {
  id: string;
  coachId: string;
  coachName: string;
  amount: number;
  date: Timestamp;
  period: string;
  notes?: string;
  createdAt: Timestamp;
}

export interface SalaryPayment {
  id: string;
  employeeId: string;
  employeeName: string;
  grossSalary: number;
  netSalary: number;
  deductions: number;
  sgkPremium: number;
  paymentDate: Timestamp;
  periodStart: Timestamp;
  periodEnd: Timestamp;
  paymentStatus: 'Bekliyor' | 'Ödendi';
  paymentMethod?: string;
  notes?: string;
  createdAt: Timestamp;
}

export interface MealCardPayment {
  id: string;
  employeeId: string;
  employeeName: string;
  amount: number;
  date: Timestamp;
  notes?: string;
  createdAt: Timestamp;
}

export interface TeamExpense {
  id: string;
  teamId?: string;
  teamName?: string;
  amount: number;
  category: TeamExpenseCategory;
  description: string;
  date: Timestamp;
  createdAt: Timestamp;
}

export type TeamExpenseCategory =
  | 'Antrenman Ekipmanları'
  | 'Saha/Salon Kirası'
  | 'Ulaşım'
  | 'Forma'
  | 'Turnuva Katılımı'
  | 'Diğer';

export interface TournamentExpense {
  id: string;
  tournamentId: string;
  tournamentName: string;
  amount: number;
  category: TournamentExpenseCategory;
  description?: string;
  date: Timestamp;
  createdAt: Timestamp;
}

export type TournamentExpenseCategory =
  | 'court_rental'
  | 'referee_fee'
  | 'prize_money'
  | 'catering'
  | 'equipment'
  | 'other';

// ============== TRANSACTION ==============

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  subcategory?: string;
  amount: number;
  description: string;
  date: Timestamp;
  sourceType: TransactionSourceType;
  sourceId?: string;
  createdAt: Timestamp;
  createdBy?: string;
}

export type TransactionSourceType =
  | 'membership'
  | 'reservation'
  | 'privateLesson'
  | 'store'
  | 'restaurant'
  | 'tournament'
  | 'salary'
  | 'coach'
  | 'mealCard'
  | 'team'
  | 'manual';

// ============== EMPLOYEE ==============

export interface Employee {
  id: string;
  name: string;
  department: string;
  position: string;
  salary: number;
  sgkNumber: string;
  sgkRate: number;
  startDate: Timestamp;
  status: 'active' | 'inactive';
  bankAccount?: string;
  phone?: string;
  email?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface EmployeeFormData {
  name: string;
  department: string;
  position: string;
  salary: number;
  sgkNumber: string;
  sgkRate: number;
  bankAccount: string;
  phone: string;
  email: string;
}

// ============== FORM DATA ==============

export interface ManualIncomeFormData {
  amount: number;
  category: string;
  description: string;
  date: Date;
}

export interface ManualExpenseFormData {
  amount: number;
  category: string;
  description: string;
  date: Date;
}

export interface SalaryPaymentFormData {
  employeeId: string;
  grossSalary: number;
  deductions: number;
  periodStart: Date;
  periodEnd: Date;
  paymentMethod: string;
  notes: string;
}

// ============== CONSTANTS ==============

export const INCOME_CATEGORIES = [
  { key: 'membership', label: 'Üyelik Gelirleri', color: '#22C55E' },
  { key: 'reservation', label: 'Kort Rezervasyon', color: '#3B82F6' },
  { key: 'lighting', label: 'Aydınlatma Geliri', color: '#EAB308' },
  { key: 'heating', label: 'Isıtma Geliri', color: '#F97316' },
  { key: 'privateLesson', label: 'Özel Ders', color: '#8B5CF6' },
  { key: 'store', label: 'Mağaza', color: '#EC4899' },
  { key: 'restaurant', label: 'Restoran', color: '#14B8A6' },
  { key: 'tournament', label: 'Turnuva Gelirleri', color: '#6366F1' },
  { key: 'manual', label: 'Diğer Gelirler', color: '#64748B' },
];

export const EXPENSE_CATEGORIES = [
  { key: 'salary', label: 'Maaş Ödemeleri', color: '#EF4444' },
  { key: 'coach', label: 'Antrenör Ödemeleri', color: '#F97316' },
  { key: 'mealCard', label: 'Yemek Kartı', color: '#EAB308' },
  { key: 'equipment', label: 'Ekipman', color: '#84CC16' },
  { key: 'venue', label: 'Saha/Salon Kirası', color: '#22C55E' },
  { key: 'transport', label: 'Ulaşım', color: '#14B8A6' },
  { key: 'uniform', label: 'Forma', color: '#06B6D4' },
  { key: 'tournament', label: 'Turnuva Giderleri', color: '#3B82F6' },
  { key: 'manual', label: 'Diğer Giderler', color: '#64748B' },
];

export const MANUAL_INCOME_CATEGORIES = [
  'Sponsorluk',
  'Bağış',
  'Kira Geliri',
  'Reklam Geliri',
  'Etkinlik Geliri',
  'Diğer',
];

export const MANUAL_EXPENSE_CATEGORIES = [
  'Kira',
  'Elektrik',
  'Su',
  'Doğalgaz',
  'İnternet',
  'Telefon',
  'Temizlik',
  'Güvenlik',
  'Bakım/Onarım',
  'Sigorta',
  'Vergi',
  'Diğer',
];

export const DEPARTMENTS = [
  'Yönetim',
  'Antrenörlük',
  'İnsan Kaynakları',
  'Muhasebe',
  'Teknik Hizmetler',
  'Güvenlik',
  'Temizlik',
  'Resepsiyon',
  'Restoran',
  'Mağaza',
  'Diğer',
];

export const PAYMENT_METHODS = [
  'Nakit',
  'Banka Transferi',
  'Kredi Kartı',
  'Çek',
];
