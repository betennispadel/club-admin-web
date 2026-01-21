import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// Locale configuration interface (same as mobile app)
export interface LocaleConfig {
  dateFormat: string;
  timeFormat: '12h' | '24h';
  currency: string;
  currencySymbol: string;
  numberFormat: 'comma' | 'dot';
  timezone: string;
}

// Available date formats
export const DATE_FORMATS = [
  { value: 'DD/MM/YYYY', label: '31/12/2024' },
  { value: 'MM/DD/YYYY', label: '12/31/2024' },
  { value: 'YYYY-MM-DD', label: '2024-12-31' },
  { value: 'DD.MM.YYYY', label: '31.12.2024' },
];

// Available currencies
export const CURRENCIES = [
  { code: 'TRY', symbol: '₺', name: 'Türk Lirası', locale: 'tr-TR' },
  { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
  { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
  { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB' },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble', locale: 'ru-RU' },
  { code: 'SAR', symbol: 'ر.س', name: 'Saudi Riyal', locale: 'ar-SA' },
];

// Default locale config
const defaultLocaleConfig: LocaleConfig = {
  dateFormat: 'DD.MM.YYYY',
  timeFormat: '24h',
  currency: 'TRY',
  currencySymbol: '₺',
  numberFormat: 'comma',
  timezone: 'Europe/Istanbul',
};

interface LocaleState {
  localeConfig: LocaleConfig;
  isLoading: boolean;
  unsubscribe: (() => void) | null;

  // Actions
  setLocaleConfig: (config: LocaleConfig) => void;
  fetchLocaleConfig: (clubId: string) => Promise<void>;
  subscribeToLocaleConfig: (clubId: string) => void;
  unsubscribeFromLocaleConfig: () => void;
  reset: () => void;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set, get) => ({
      localeConfig: defaultLocaleConfig,
      isLoading: false,
      unsubscribe: null,

      setLocaleConfig: (config) => set({ localeConfig: config }),

      fetchLocaleConfig: async (clubId: string) => {
        if (!clubId) return;

        set({ isLoading: true });
        try {
          // Path: {clubId}/settings/settings/locale
          const localeDocRef = doc(db, clubId, 'settings', 'settings', 'locale');
          const docSnap = await getDoc(localeDocRef);

          if (docSnap.exists()) {
            const data = docSnap.data() as LocaleConfig;
            set({ localeConfig: { ...defaultLocaleConfig, ...data } });
          } else {
            set({ localeConfig: defaultLocaleConfig });
          }
        } catch (error) {
          set({ localeConfig: defaultLocaleConfig });
        } finally {
          set({ isLoading: false });
        }
      },

      subscribeToLocaleConfig: (clubId: string) => {
        if (!clubId) return;

        // Unsubscribe from previous listener
        const { unsubscribe: prevUnsubscribe } = get();
        if (prevUnsubscribe) {
          prevUnsubscribe();
        }

        // Path: {clubId}/settings/settings/locale
        const localeDocRef = doc(db, clubId, 'settings', 'settings', 'locale');

        const unsubscribe = onSnapshot(localeDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as LocaleConfig;
            set({ localeConfig: { ...defaultLocaleConfig, ...data } });
          } else {
            set({ localeConfig: defaultLocaleConfig });
          }
        });

        set({ unsubscribe });
      },

      unsubscribeFromLocaleConfig: () => {
        const { unsubscribe } = get();
        if (unsubscribe) {
          unsubscribe();
          set({ unsubscribe: null });
        }
      },

      reset: () => {
        const { unsubscribe } = get();
        if (unsubscribe) {
          unsubscribe();
        }
        set({
          localeConfig: defaultLocaleConfig,
          isLoading: false,
          unsubscribe: null,
        });
      },
    }),
    {
      name: 'locale-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        localeConfig: state.localeConfig,
      }),
    }
  )
);

// Helper functions for formatting

/**
 * Format number with thousand separators (only for 10,000+)
 * Numbers below 10,000 don't get separators
 */
const formatNumberWithSeparator = (
  num: number,
  decimalSeparator: string,
  thousandSeparator: string
): string => {
  const isNegative = num < 0;
  const absNum = Math.abs(num);
  const integerPart = Math.floor(absNum);
  const decimalPart = Math.round((absNum - integerPart) * 100);

  let integerStr = integerPart.toString();

  // Only add thousand separators for numbers >= 10,000
  if (integerPart >= 10000) {
    integerStr = integerStr.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);
  }

  const decimalStr = decimalPart.toString().padStart(2, '0');
  const result = `${integerStr}${decimalSeparator}${decimalStr}`;

  return isNegative ? `-${result}` : result;
};

/**
 * Format currency using locale settings
 * Note: Thousand separators only shown for amounts >= 10,000
 */
export const formatCurrencyByLocale = (
  amount: number,
  config?: LocaleConfig
): string => {
  const localeConfig = config || useLocaleStore.getState().localeConfig;

  // Determine separators based on number format
  const decimalSeparator = localeConfig.numberFormat === 'comma' ? ',' : '.';
  const thousandSeparator = localeConfig.numberFormat === 'comma' ? '.' : ',';

  const formattedNumber = formatNumberWithSeparator(amount, decimalSeparator, thousandSeparator);

  // Position currency symbol based on locale
  if (localeConfig.currency === 'TRY') {
    return `${formattedNumber} ${localeConfig.currencySymbol}`;
  }

  return `${localeConfig.currencySymbol}${formattedNumber}`;
};

/**
 * Format date using locale settings
 */
export const formatDateByLocale = (
  date: Date | string,
  config?: LocaleConfig
): string => {
  const localeConfig = config || useLocaleStore.getState().localeConfig;

  let dateObj: Date;
  if (typeof date === 'string') {
    // Try to parse the date string
    if (date.includes('.')) {
      const [day, month, year] = date.split('.').map(Number);
      dateObj = new Date(year, month - 1, day);
    } else if (date.includes('-')) {
      const [year, month, day] = date.split('-').map(Number);
      dateObj = new Date(year, month - 1, day);
    } else if (date.includes('/')) {
      const parts = date.split('/').map(Number);
      if (parts[2] > 31) {
        // MM/DD/YYYY or DD/MM/YYYY
        dateObj = new Date(parts[2], parts[0] - 1, parts[1]);
      } else {
        dateObj = new Date(parts[2], parts[1] - 1, parts[0]);
      }
    } else {
      dateObj = new Date(date);
    }
  } else {
    dateObj = date;
  }

  if (isNaN(dateObj.getTime())) {
    return date.toString();
  }

  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();

  switch (localeConfig.dateFormat) {
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'DD.MM.YYYY':
    default:
      return `${day}.${month}.${year}`;
  }
};

/**
 * Format time using locale settings
 */
export const formatTimeByLocale = (
  time: string,
  config?: LocaleConfig
): string => {
  const localeConfig = config || useLocaleStore.getState().localeConfig;

  const [hours, minutes] = time.split(':').map(Number);

  if (localeConfig.timeFormat === '12h') {
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
  }

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

/**
 * Get currency symbol
 */
export const getCurrencySymbol = (config?: LocaleConfig): string => {
  const localeConfig = config || useLocaleStore.getState().localeConfig;
  return localeConfig.currencySymbol;
};
