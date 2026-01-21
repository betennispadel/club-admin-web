import { Timestamp } from 'firebase/firestore';

// Activity type for wallet transactions
export interface Activity {
  id: string;
  service: string;
  date: Timestamp;
  amount: number;
  status: string;
  timestamp?: Timestamp;
  discountApplied?: boolean;
  discountPercentage?: number;
  originalPrice?: number;
  discountAmount?: number;
  courtName?: string;
  reservationDate?: string;
  reservationTime?: string;
  couponApplied?: boolean;
  couponCode?: string;
  couponType?: 'percentage' | 'fixed';
  couponValue?: number;
  couponDiscountAmount?: number;
  priceBeforeCoupon?: number;
  serviceKey?: string;
  serviceParams?: Record<string, any>;
  type?: string;
  description?: string;
}

// Reservation type
export interface Reservation {
  id: string;
  courtId: string;
  date: string;
  time: string;
  amountPaid: number;
  status?: string;
  heater?: boolean;
  light?: boolean;
  jointPayment?: boolean;
  jointUserId?: string;
  jointUsername?: string;
  createdAt?: Timestamp;
  isChallenge?: boolean;
  challengeUserId?: string;
  challengeUsername?: string;
  userId: string;
  isGift?: boolean;
  giftedByUserId?: string;
  giftedByUsername?: string;
  giftMessage?: string;
  totalCost?: number;
}

// Transfer type
export interface Transfer {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromUsername?: string;
  toUsername?: string;
  amount: number;
  date: Timestamp;
  status: string;
  initiatedBy?: 'user' | 'admin';
}

// Court type
export interface Court {
  id: string;
  name: string;
}

// User type for wallet
export interface WalletUser {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  photoURL?: string | null;
  [key: string]: any;
}

// Transaction type (unified)
export interface Transaction {
  id: string;
  type: 'reservation' | 'transfer' | 'activity';
  date: Timestamp;
  amount: number;
  description: string;
  details?: string;
  status?: string;
  iconName?: string;
  iconColor?: string;
  rawData: Reservation | Transfer | Activity;
  isUndoable?: boolean;
  isGift?: boolean;
  giftedByUserId?: string;
  giftedByUsername?: string;
  giftMessage?: string;
  // Discount fields
  discountApplied?: boolean;
  discountPercentage?: number;
  originalPrice?: number;
  discountAmount?: number;
  // Coupon fields
  couponApplied?: boolean;
  couponCode?: string;
  couponType?: 'percentage' | 'fixed';
  couponValue?: number;
  couponDiscountAmount?: number;
  priceBeforeCoupon?: number;
}

// User Wallet type
export interface UserWallet {
  id: string;
  odacinId?: string; // Firestore document ID
  odacinName?: string;
  userId: string;
  userName?: string;
  name: string;
  balance: number;
  negativeBalance: number;
  isBlocked: boolean;
  createdAt?: Timestamp;
  lastUpdated?: Timestamp;
  fullTransactionHistory?: Transaction[];
  photoURL?: string | null;
}

// Wallet stats type
export interface WalletStats {
  totalWallets: number;
  activeWallets: number;
  blockedWallets: number;
  totalBalance: number;
  totalNegativeLimit: number;
}

// Filter type
export type WalletFilter = 'all' | 'active' | 'blocked';

// Global settings type
export interface WalletGlobalSettings {
  transferDisabled: boolean;
  addBalanceDisabled: boolean;
  payDisabled: boolean;
}

// Balance operation type
export type BalanceOperationType = 'add' | 'setNegativeLimit';

// Form state for balance modal
export interface BalanceFormState {
  amount: string;
  operationType: BalanceOperationType;
}

// Form state for transfer modal
export interface TransferFormState {
  senderUsername: string;
  receiverUsername: string;
  amount: string;
  senderValid: boolean | null;
  receiverValid: boolean | null;
  senderWalletId: string | null;
  receiverWalletId: string | null;
  senderUserId: string | null;
  receiverUserId: string | null;
}

// Initial states
export const initialBalanceFormState: BalanceFormState = {
  amount: '',
  operationType: 'add',
};

export const initialTransferFormState: TransferFormState = {
  senderUsername: '',
  receiverUsername: '',
  amount: '',
  senderValid: null,
  receiverValid: null,
  senderWalletId: null,
  receiverWalletId: null,
  senderUserId: null,
  receiverUserId: null,
};
