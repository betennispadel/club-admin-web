import { Timestamp } from 'firebase/firestore';

// Permissions type - 33 permissions
export type Permissions = {
  usersManagement: boolean;
  reservationsManagement: boolean;
  courtManagements: boolean;
  tournamentsManagement: boolean;
  financialManagements: boolean;
  walletManagements: boolean;
  teamManagement: boolean;
  teamPerformance: boolean;
  employeeSalaryManagement: boolean;
  mealCardManagement: boolean;
  uyeler: boolean;
  roles: boolean;
  aiChatAssistant: boolean;
  privateLessonArea: boolean;
  reservationPage: boolean;
  tournamentPage: boolean;
  transferAccess: boolean;
  addBalanceAccess: boolean;
  payAccess: boolean;
  memberMessage: boolean;
  discountManagement: boolean;
  apiManagement: boolean;
  restaurantManagement: boolean;
  storeManagement: boolean;
  magazineManagement: boolean;
  sliderManagement: boolean;
  localeSettings: boolean;
  myClubManager: boolean;
  payManagement: boolean;
  notificationsManagement: boolean;
  adsManagement: boolean;
  problemManagement: boolean;
  gameCenter: boolean;
  trainingPool: boolean;
  occupancyManagement: boolean;
};

export const defaultPermissions: Permissions = {
  usersManagement: false,
  reservationsManagement: false,
  courtManagements: false,
  tournamentsManagement: false,
  financialManagements: false,
  walletManagements: false,
  teamManagement: false,
  teamPerformance: false,
  employeeSalaryManagement: false,
  mealCardManagement: false,
  uyeler: false,
  roles: false,
  aiChatAssistant: false,
  privateLessonArea: false,
  reservationPage: false,
  tournamentPage: false,
  transferAccess: false,
  addBalanceAccess: false,
  payAccess: false,
  memberMessage: false,
  discountManagement: false,
  apiManagement: false,
  restaurantManagement: false,
  storeManagement: false,
  magazineManagement: false,
  sliderManagement: false,
  localeSettings: false,
  myClubManager: false,
  payManagement: false,
  notificationsManagement: false,
  adsManagement: false,
  problemManagement: false,
  gameCenter: false,
  trainingPool: false,
  occupancyManagement: false,
};

// Club type
export interface Club {
  id: string;
  name: string;
  logo: string | null;
  location?: string;
  courts?: number;
  rating?: number;
  themeColor?: string;
}

// User type
export interface User {
  id: string;
  email: string;
  name: string;
  username?: string;
  surname?: string;
  phone?: string;
  role: string;
  authUid?: string;
  profileImage?: string;
  createdAt?: Timestamp;
  lastLogin?: Timestamp;
  twoFactorEnabled?: boolean;
  twoFactorPhone?: string;
  trustedDevices?: string[];
  fcmToken?: string;
}

// Role type
export interface Role {
  id: string;
  name: string;
  permissions: Permissions;
  iconName?: string;
  priceMultiplier?: number;
}

// Price Schedule type
export interface PriceSchedule {
  from: string;
  until: string;
  basePrice: number;
  rolePrices?: { [roleId: string]: number };
}

// Applied Discount type
export interface AppliedDiscount {
  id: string;
  percentage: number;
  appliedAt: string;
  timeRange?: { from: string; until: string };
  isAllHours: boolean;
}

// Court Discount type (time-based discount)
export interface CourtDiscount {
  id?: string;
  fromHour: number;
  toHour: number;
  percentage: number;
  description?: string;
}

// Court type
export interface Court {
  id: string;
  name: string;
  type?: string;
  surface?: string;
  indoor?: boolean;
  lights?: boolean;
  status: 'active' | 'maintenance' | 'inactive';
  hourlyRate?: number;
  heatingCost?: number;
  lightingCost?: number;
  availableFrom?: string;
  availableUntil?: string;
  timeSlotInterval?: 15 | 30 | 60;
  priceSchedules?: PriceSchedule[];
  appliedDiscounts?: AppliedDiscount[];
  discounts?: CourtDiscount[]; // Time-based discounts for specific hours
  image?: string;
}

// Reservation type - Full model
export interface Reservation {
  id: string;
  courtId: string;
  courtName?: string;
  date: string;
  time: string;
  userId: string;
  username: string;
  amountPaid: number;
  heater?: boolean;
  light?: boolean;
  allowNegativeBalance?: boolean;
  negativeBalanceUsed?: number;
  status?: 'active' | 'cancelled' | 'pending' | 'declined';
  bulkGroupName?: string;
  isGuestReservation?: boolean;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  createdAt?: Timestamp;
  // Match/Training type fields
  isChallenge?: boolean;
  matchType?: 'single' | 'double';
  challengeUserId?: string;
  challengeUsername?: string;
  isTraining?: boolean;
  trainingParticipantCount?: number;
  isLesson?: boolean;
  lessonGroupName?: string;
  // Payment fields
  totalCost?: number;
  jointPayment?: boolean;
  jointUserId?: string;
  jointUsername?: string;
  jointAmount?: number;
  jointPaymentStatus?: 'pending' | 'completed' | 'declined' | 'cancelled' | 'paid_by_creator';
  // Discount fields
  discountApplied?: boolean;
  discountPercentage?: number;
  originalPrice?: number;
  // Coupon fields
  couponApplied?: boolean;
  couponCode?: string;
  couponType?: 'percentage' | 'fixed';
  couponValue?: number;
  couponDiscountAmount?: number;
  priceBeforeCoupon?: number;
  // Gift fields
  isGift?: boolean;
  giftedByUserId?: string;
  giftedByUsername?: string;
  giftMessage?: string;
  // Multi-slot fields
  slots?: string[];
  endTime?: string;
  duration?: number;
}

// New Reservation type (for forms)
export interface NewReservation {
  courtId?: string;
  date?: string;
  time?: string;
  userId?: string;
  userName?: string;
  heater?: boolean;
  light?: boolean;
  allowNegativeBalance?: boolean;
  selectedSlots?: string[];
  endTime?: string;
  duration?: number;
}

// Bulk Reservation type
export interface BulkReservation {
  groupName: string;
  userName: string;
  courtId: string;
  startDate: string;
  endDate: string;
  selectedDays: string[];
  time: string;
  selectedSlots: string[];
  endTime: string;
  duration: number;
  heater: boolean;
  light: boolean;
  allowNegativeBalance: boolean;
}

// Reservation Statistics
export interface ReservationStats {
  total: number;
  active: number;
  cancelled: number;
  upcoming: number;
  pending: number;
  revenue: number;
  avgRevenue: number;
  heaterCount: number;
  lightCount: number;
  heaterRevenue: number;
  lightRevenue: number;
  revenueByCourt: { [courtId: string]: number };
  reservationTypes: {
    normal: number;
    singleMatch: number;
    doubleMatch: number;
    training: number;
    guest: number;
    gift: number;
  };
  paymentStats: {
    totalRevenue: number;
    walletPayments: number;
    negativeBalancePayments: number;
    jointPayments: number;
    jointPaymentAmount: number;
    avgPaymentPerReservation: number;
  };
  discountStats: {
    totalDiscountedReservations: number;
    totalDiscountAmount: number;
    avgDiscountPercentage: number;
  };
  couponStats: {
    totalCouponUsed: number;
    totalCouponDiscount: number;
    couponsByType: {
      percentage: number;
      fixed: number;
    };
  };
  giftStats: {
    totalGifts: number;
    totalGiftValue: number;
  };
}

// Tournament type
export interface Tournament {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  maxParticipants: number;
  currentParticipants: number;
  entryFee?: number;
  prizePool?: number;
  status: 'upcoming' | 'registration' | 'ongoing' | 'completed' | 'cancelled';
  type: 'singles' | 'doubles' | 'mixed';
  category?: string;
  image?: string;
}

// League type
export interface League {
  id: string;
  name: string;
  season: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  teams: number;
  matches: number;
}

// Private Lesson type
export interface PrivateLesson {
  id: string;
  coachId: string;
  coachName: string;
  studentId: string;
  studentName: string;
  courtId?: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  price: number;
  paymentStatus: 'pending' | 'paid';
  notes?: string;
}

// Coach type
export interface Coach {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  specialization?: string[];
  hourlyRate: number;
  availability?: Record<string, string[]>;
  rating?: number;
  totalLessons?: number;
  profileImage?: string;
}

// Wallet type
export interface Wallet {
  id: string;
  oderId?: string;
  userId: string;
  userName?: string;
  balance: number;
  negativeBalance?: number; // Debt limit allowed for user
  isBlocked?: boolean;
  currency?: string;
  transactions?: WalletTransaction[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface WalletTransaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  date: Timestamp;
  balanceAfter: number;
}

// Employee type
export interface Employee {
  id: string;
  userId?: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  position: string;
  salary: number;
  startDate: string;
  status: 'active' | 'inactive';
  bankAccount?: string;
}

// Expense type
export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  paymentMethod: string;
  receiptUrl?: string;
  createdBy: string;
  createdAt?: Timestamp;
}

// Notification type
export interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'info' | 'warning' | 'success' | 'error';
  targetUsers?: string[];
  targetRoles?: string[];
  sendToAll?: boolean;
  sentAt?: Timestamp;
  createdBy: string;
}

// Problem/Support ticket type
export interface Problem {
  id: string;
  userId: string;
  userName: string;
  title: string;
  description: string;
  category: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt?: Timestamp;
  resolvedAt?: Timestamp;
  assignedTo?: string;
}

// Activity log type
export interface ActivityLog {
  id: string;
  action: string;
  details: string;
  userId: string;
  userAgent: string;
  timestamp: Timestamp;
}

// Store product type
export interface StoreProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  stock: number;
  image?: string;
  status: 'active' | 'inactive';
}

// Store order type
export interface StoreOrder {
  id: string;
  userId: string;
  userName: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  createdAt?: Timestamp;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

// Restaurant order type
export interface RestaurantOrder {
  id: string;
  userId: string;
  userName: string;
  tableNumber?: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'served' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  createdAt?: Timestamp;
}

// Magazine type
export interface Magazine {
  id: string;
  title: string;
  description?: string;
  coverImage: string;
  publishDate: string;
  status: 'draft' | 'published';
  pages: number;
}

// Slider type
export interface Slider {
  id: string;
  title: string;
  image: string;
  link?: string;
  order: number;
  status: 'active' | 'inactive';
}

// Discount type
export interface Discount {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  validFrom: string;
  validUntil: string;
  usageLimit?: number;
  usedCount: number;
  status: 'active' | 'inactive';
}

// Lesson Group type
export interface LessonGroup {
  id: string;
  groupName: string;
  description?: string;
  coachId?: string;
  coachName?: string;
  maxStudents?: number;
  currentStudents?: number;
  schedule?: Record<string, string[]>;
  pricePerSession?: number;
  status?: 'active' | 'inactive';
  createdAt?: Timestamp;
}

// Team type
export interface Team {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  captainId?: string;
  captainName?: string;
  members?: TeamMember[];
  wins?: number;
  losses?: number;
  draws?: number;
  points?: number;
  status?: 'active' | 'inactive';
  createdAt?: Timestamp;
}

export interface TeamMember {
  userId: string;
  username: string;
  role?: 'captain' | 'player' | 'substitute';
  joinedAt?: Timestamp;
}

// API Key type
export interface ApiKey {
  id: string;
  name: string;
  key: string;
  provider: string;
  description?: string;
  isActive: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
