// Locale configuration types

export interface LocaleConfig {
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' | 'DD.MM.YYYY';
  timeFormat: '24h' | '12h';
  currency: string;
  currencySymbol: string;
  numberFormat: 'comma' | 'dot';
  timezone: string;
}

export const defaultLocaleConfig: LocaleConfig = {
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '24h',
  currency: 'TRY',
  currencySymbol: '₺',
  numberFormat: 'comma',
  timezone: 'Europe/Istanbul',
};

export const CURRENCIES = [
  { code: 'TRY', symbol: '₺', name: 'Türk Lirası' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
  { code: 'SAR', symbol: 'ر.س', name: 'Saudi Riyal' },
];

export const DATE_FORMATS = [
  { value: 'DD/MM/YYYY', example: '31/12/2024' },
  { value: 'MM/DD/YYYY', example: '12/31/2024' },
  { value: 'YYYY-MM-DD', example: '2024-12-31' },
  { value: 'DD.MM.YYYY', example: '31.12.2024' },
];
