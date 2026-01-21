import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import {
  ClubPaymentConfig,
  DEFAULT_PAYMENT_CONFIG,
  IyzicoConfig,
  ParatikaConfig,
  StripeConnectConfig,
} from '@/lib/types/pay-management';

// Get payment configuration
export async function getPaymentConfig(clubId: string): Promise<ClubPaymentConfig | null> {
  try {
    const configRef = doc(db, clubId, 'paymentConfig');
    const configSnap = await getDoc(configRef);

    if (configSnap.exists()) {
      return configSnap.data() as ClubPaymentConfig;
    }

    // Create default config if doesn't exist
    const defaultConfig: ClubPaymentConfig = {
      ...DEFAULT_PAYMENT_CONFIG,
      clubId,
      createdAt: Timestamp.now(),
    };
    await setDoc(configRef, defaultConfig);
    return defaultConfig;
  } catch (error) {
    console.error('Error getting payment config:', error);
    throw error;
  }
}

// Update payment configuration
export async function updatePaymentConfig(
  clubId: string,
  updates: Partial<ClubPaymentConfig>
): Promise<void> {
  try {
    const configRef = doc(db, clubId, 'paymentConfig');
    await updateDoc(configRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating payment config:', error);
    throw error;
  }
}

// Save Stripe configuration
export async function saveStripeConfig(
  clubId: string,
  stripeConfig: Partial<StripeConnectConfig>,
  setPrimary: boolean = false
): Promise<void> {
  try {
    const updates: Partial<ClubPaymentConfig> = {
      stripe: {
        ...DEFAULT_PAYMENT_CONFIG.stripe,
        ...stripeConfig,
        updatedAt: Timestamp.now(),
      } as StripeConnectConfig,
    };

    if (setPrimary) {
      updates.primaryProvider = 'stripe';
      updates.onlinePaymentEnabled = true;
    }

    await updatePaymentConfig(clubId, updates);
  } catch (error) {
    console.error('Error saving Stripe config:', error);
    throw error;
  }
}

// Save iyzico configuration
export async function saveIyzicoConfig(
  clubId: string,
  iyzicoConfig: Partial<IyzicoConfig>,
  setPrimary: boolean = true
): Promise<void> {
  try {
    const updates: Partial<ClubPaymentConfig> = {
      iyzico: {
        ...DEFAULT_PAYMENT_CONFIG.iyzico,
        ...iyzicoConfig,
        enabled: true,
        updatedAt: Timestamp.now(),
      } as IyzicoConfig,
    };

    if (setPrimary) {
      updates.primaryProvider = 'iyzico';
      updates.onlinePaymentEnabled = true;
    }

    await updatePaymentConfig(clubId, updates);
  } catch (error) {
    console.error('Error saving iyzico config:', error);
    throw error;
  }
}

// Save Paratika configuration
export async function saveParatikaConfig(
  clubId: string,
  paratikaConfig: Partial<ParatikaConfig>,
  setPrimary: boolean = true
): Promise<void> {
  try {
    const updates: Partial<ClubPaymentConfig> = {
      paratika: {
        ...DEFAULT_PAYMENT_CONFIG.paratika,
        ...paratikaConfig,
        enabled: true,
        updatedAt: Timestamp.now(),
      } as ParatikaConfig,
    };

    if (setPrimary) {
      updates.primaryProvider = 'paratika';
      updates.onlinePaymentEnabled = true;
    }

    await updatePaymentConfig(clubId, updates);
  } catch (error) {
    console.error('Error saving Paratika config:', error);
    throw error;
  }
}

// Save wallet settings
export async function saveWalletSettings(
  clubId: string,
  walletEnabled: boolean,
  allowNegativeBalance: boolean,
  defaultNegativeBalanceLimit: number
): Promise<void> {
  try {
    await updatePaymentConfig(clubId, {
      walletEnabled,
      allowNegativeBalance,
      defaultNegativeBalanceLimit,
    });
  } catch (error) {
    console.error('Error saving wallet settings:', error);
    throw error;
  }
}

// Disable a payment provider
export async function disablePaymentProvider(
  clubId: string,
  provider: 'stripe' | 'iyzico' | 'paratika'
): Promise<void> {
  try {
    const config = await getPaymentConfig(clubId);
    if (!config) return;

    const updates: Partial<ClubPaymentConfig> = {};

    switch (provider) {
      case 'stripe':
        updates.stripe = { ...config.stripe, enabled: false };
        break;
      case 'iyzico':
        updates.iyzico = { ...config.iyzico, enabled: false };
        break;
      case 'paratika':
        updates.paratika = { ...config.paratika, enabled: false };
        break;
    }

    // If this was the primary provider, set to none
    if (config.primaryProvider === provider) {
      updates.primaryProvider = 'none';
      updates.onlinePaymentEnabled = false;
    }

    await updatePaymentConfig(clubId, updates);
  } catch (error) {
    console.error('Error disabling payment provider:', error);
    throw error;
  }
}

// Set primary payment provider
export async function setPrimaryProvider(
  clubId: string,
  provider: 'stripe' | 'iyzico' | 'paratika' | 'none'
): Promise<void> {
  try {
    await updatePaymentConfig(clubId, {
      primaryProvider: provider,
      onlinePaymentEnabled: provider !== 'none',
    });
  } catch (error) {
    console.error('Error setting primary provider:', error);
    throw error;
  }
}
