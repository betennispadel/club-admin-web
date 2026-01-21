import { Timestamp } from 'firebase/firestore';

// Payment Provider Types
export type PaymentProvider = 'stripe' | 'iyzico' | 'paratika' | 'none';

export type StripeAccountType = 'standard' | 'express';

// Stripe Connect Configuration
export interface StripeConnectConfig {
  enabled: boolean;
  accountId: string | null;
  accountType: StripeAccountType;
  onboardingCompleted: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  country: string;
  defaultCurrency: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// iyzico Configuration (Turkey only)
export interface IyzicoConfig {
  enabled: boolean;
  apiKey: string;
  secretKey: string;
  baseUrl: 'sandbox' | 'production';
  subMerchantKey: string | null;
  subMerchantType: 'PERSONAL' | 'PRIVATE_COMPANY' | 'LIMITED_OR_JOINT_STOCK_COMPANY';
  merchantName: string;
  contactEmail: string;
  contactPhone: string;
  iban: string;
  identityNumber: string;
  legalCompanyTitle?: string;
  taxOffice?: string;
  taxNumber?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Paratika Configuration (Turkey only - Asseco / Akbank)
export interface ParatikaConfig {
  enabled: boolean;
  merchantCode: string;
  merchantUsername: string;
  merchantPassword: string;
  baseUrl: 'test' | 'production';
  terminalId: string;
  posnetId?: string;
  merchantName: string;
  contactEmail: string;
  contactPhone: string;
  iban: string;
  taxNumber: string;
  taxOffice: string;
  legalCompanyTitle?: string;
  use3DSecure: boolean;
  storeKey?: string;
  installmentsEnabled: boolean;
  maxInstallments: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Combined Payment Configuration for a Club
export interface ClubPaymentConfig {
  id?: string;
  clubId: string;
  primaryProvider: PaymentProvider;
  walletEnabled: boolean;
  walletCurrency: string;
  allowNegativeBalance: boolean;
  defaultNegativeBalanceLimit: number;
  onlinePaymentEnabled: boolean;
  stripe: StripeConnectConfig;
  iyzico: IyzicoConfig;
  paratika: ParatikaConfig;
  platformCommissionPercentage: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Transaction Types
export type TransactionType =
  | 'wallet_load'
  | 'wallet_transfer'
  | 'reservation_payment'
  | 'refund'
  | 'payout';

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface PaymentTransaction {
  id: string;
  clubId: string;
  userId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  provider: PaymentProvider;
  providerTransactionId?: string;
  status: TransactionStatus;
  metadata?: {
    reservationId?: string;
    transferToUserId?: string;
    description?: string;
  };
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

// Stripe Onboarding Response
export interface StripeOnboardingLink {
  url: string;
  expiresAt: number;
}

// iyzico Sub-merchant Registration
export interface IyzicoSubMerchantRequest {
  locale: 'tr' | 'en';
  conversationId: string;
  subMerchantExternalId: string;
  subMerchantType: 'PERSONAL' | 'PRIVATE_COMPANY' | 'LIMITED_OR_JOINT_STOCK_COMPANY';
  address: string;
  contactName: string;
  contactSurname: string;
  email: string;
  gsmNumber: string;
  name: string;
  iban: string;
  identityNumber: string;
  taxOffice?: string;
  legalCompanyTitle?: string;
}

// Default configurations
export const DEFAULT_STRIPE_CONFIG: StripeConnectConfig = {
  enabled: false,
  accountId: null,
  accountType: 'express',
  onboardingCompleted: false,
  chargesEnabled: false,
  payoutsEnabled: false,
  country: '',
  defaultCurrency: 'usd',
};

export const DEFAULT_IYZICO_CONFIG: IyzicoConfig = {
  enabled: false,
  apiKey: '',
  secretKey: '',
  baseUrl: 'sandbox',
  subMerchantKey: null,
  subMerchantType: 'PRIVATE_COMPANY',
  merchantName: '',
  contactEmail: '',
  contactPhone: '',
  iban: '',
  identityNumber: '',
};

export const DEFAULT_PARATIKA_CONFIG: ParatikaConfig = {
  enabled: false,
  merchantCode: '',
  merchantUsername: '',
  merchantPassword: '',
  baseUrl: 'test',
  terminalId: '',
  posnetId: '',
  merchantName: '',
  contactEmail: '',
  contactPhone: '',
  iban: '',
  taxNumber: '',
  taxOffice: '',
  legalCompanyTitle: '',
  use3DSecure: true,
  storeKey: '',
  installmentsEnabled: false,
  maxInstallments: 1,
};

export const DEFAULT_PAYMENT_CONFIG: Omit<ClubPaymentConfig, 'clubId'> = {
  primaryProvider: 'none',
  walletEnabled: true,
  walletCurrency: 'TRY',
  allowNegativeBalance: true,
  defaultNegativeBalanceLimit: 500,
  onlinePaymentEnabled: false,
  stripe: DEFAULT_STRIPE_CONFIG,
  iyzico: DEFAULT_IYZICO_CONFIG,
  paratika: DEFAULT_PARATIKA_CONFIG,
  platformCommissionPercentage: 2.5,
};
