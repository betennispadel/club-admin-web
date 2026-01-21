import { LocaleConfig, defaultLocaleConfig } from '@/lib/types/locale';
import { format as dateFnsFormat, Locale } from 'date-fns';
import { tr, enUS, de, fr, es, it, pt, ru, ar, zhCN, ja } from 'date-fns/locale';

// Locale map for date-fns
const localeMap: Record<string, Locale> = {
  tr: tr,
  en: enUS,
  de: de,
  fr: fr,
  es: es,
  it: it,
  pt: pt,
  ru: ru,
  ar: ar,
  zh: zhCN,
  ja: ja,
};

/**
 * Format price with locale settings
 */
export const formatPrice = (
  amount: number,
  config: LocaleConfig = defaultLocaleConfig
): string => {
  const { currencySymbol, numberFormat } = config;

  // Format number
  let formattedNumber: string;
  if (numberFormat === 'comma') {
    // European style: 1.234,56
    formattedNumber = amount.toLocaleString('tr-TR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  } else {
    // US style: 1,234.56
    formattedNumber = amount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }

  return `${formattedNumber} ${currencySymbol}`;
};

/**
 * Format date with locale settings
 */
export const formatDate = (
  date: Date | string,
  config: LocaleConfig = defaultLocaleConfig,
  localeCode: string = 'tr'
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const locale = localeMap[localeCode] || tr;

  // Convert format pattern
  let pattern: string;
  switch (config.dateFormat) {
    case 'DD/MM/YYYY':
      pattern = 'dd/MM/yyyy';
      break;
    case 'MM/DD/YYYY':
      pattern = 'MM/dd/yyyy';
      break;
    case 'YYYY-MM-DD':
      pattern = 'yyyy-MM-dd';
      break;
    case 'DD.MM.YYYY':
      pattern = 'dd.MM.yyyy';
      break;
    default:
      pattern = 'dd/MM/yyyy';
  }

  return dateFnsFormat(dateObj, pattern, { locale });
};

/**
 * Format time with locale settings
 */
export const formatTime = (
  time: string,
  config: LocaleConfig = defaultLocaleConfig
): string => {
  if (!time || !time.includes(':')) return time;

  const [hours, minutes] = time.split(':').map(Number);

  if (config.timeFormat === '12h') {
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
  }

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

/**
 * Format time range (e.g., "09:15 -> 09:30")
 */
export const formatTimeRange = (
  startTime: string,
  endTime: string,
  config: LocaleConfig = defaultLocaleConfig
): string => {
  const formattedStart = formatTime(startTime, config);
  const formattedEnd = formatTime(endTime, config);
  return `${formattedStart} → ${formattedEnd}`;
};

/**
 * Calculate end time from start time and interval
 */
export const calculateSlotEndTime = (startTime: string, intervalMinutes: number): string => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + intervalMinutes;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
};

/**
 * Format slot display with time range
 */
export const formatSlotDisplay = (
  startTime: string,
  intervalMinutes: number,
  config: LocaleConfig = defaultLocaleConfig
): string => {
  const endTime = calculateSlotEndTime(startTime, intervalMinutes);
  return formatTimeRange(startTime, endTime, config);
};

/**
 * Format discount percentage
 */
export const formatDiscount = (percentage: number): string => {
  return `%${percentage}`;
};

/**
 * Format duration in minutes to human readable
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} dk`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} saat`;
  }
  return `${hours} saat ${remainingMinutes} dk`;
};
