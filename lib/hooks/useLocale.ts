'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useClubStore } from '@/stores/clubStore';
import { LocaleConfig, defaultLocaleConfig } from '@/lib/types/locale';
import {
  formatPrice,
  formatDate,
  formatTime,
  formatTimeRange,
  formatSlotDisplay,
  formatDiscount,
  formatDuration,
  calculateSlotEndTime,
} from '@/lib/utils/formatting';

interface UseLocaleReturn {
  config: LocaleConfig;
  loading: boolean;
  formatPrice: (amount: number) => string;
  formatDate: (date: Date | string, localeCode?: string) => string;
  formatTime: (time: string) => string;
  formatTimeRange: (startTime: string, endTime: string) => string;
  formatSlotDisplay: (startTime: string, intervalMinutes: number) => string;
  formatDiscount: (percentage: number) => string;
  formatDuration: (minutes: number) => string;
  calculateSlotEndTime: (startTime: string, intervalMinutes: number) => string;
}

export function useLocale(): UseLocaleReturn {
  const { selectedClub } = useClubStore();
  const [config, setConfig] = useState<LocaleConfig>(defaultLocaleConfig);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedClub) {
      setConfig(defaultLocaleConfig);
      setLoading(false);
      return;
    }

    // Subscribe to locale settings
    const localeDocRef = doc(db, selectedClub.id, 'settings', 'settings', 'locale');

    const unsubscribe = onSnapshot(
      localeDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setConfig({
            dateFormat: data.dateFormat || defaultLocaleConfig.dateFormat,
            timeFormat: data.timeFormat || defaultLocaleConfig.timeFormat,
            currency: data.currency || defaultLocaleConfig.currency,
            currencySymbol: data.currencySymbol || defaultLocaleConfig.currencySymbol,
            numberFormat: data.numberFormat || defaultLocaleConfig.numberFormat,
            timezone: data.timezone || defaultLocaleConfig.timezone,
          });
        } else {
          setConfig(defaultLocaleConfig);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching locale settings:', error);
        setConfig(defaultLocaleConfig);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [selectedClub]);

  // Memoized formatting functions
  const formatPriceFn = useCallback(
    (amount: number) => formatPrice(amount, config),
    [config]
  );

  const formatDateFn = useCallback(
    (date: Date | string, localeCode: string = 'tr') => formatDate(date, config, localeCode),
    [config]
  );

  const formatTimeFn = useCallback(
    (time: string) => formatTime(time, config),
    [config]
  );

  const formatTimeRangeFn = useCallback(
    (startTime: string, endTime: string) => formatTimeRange(startTime, endTime, config),
    [config]
  );

  const formatSlotDisplayFn = useCallback(
    (startTime: string, intervalMinutes: number) => formatSlotDisplay(startTime, intervalMinutes, config),
    [config]
  );

  const formatDiscountFn = useCallback(
    (percentage: number) => formatDiscount(percentage),
    []
  );

  const formatDurationFn = useCallback(
    (minutes: number) => formatDuration(minutes),
    []
  );

  const calculateSlotEndTimeFn = useCallback(
    (startTime: string, intervalMinutes: number) => calculateSlotEndTime(startTime, intervalMinutes),
    []
  );

  return {
    config,
    loading,
    formatPrice: formatPriceFn,
    formatDate: formatDateFn,
    formatTime: formatTimeFn,
    formatTimeRange: formatTimeRangeFn,
    formatSlotDisplay: formatSlotDisplayFn,
    formatDiscount: formatDiscountFn,
    formatDuration: formatDurationFn,
    calculateSlotEndTime: calculateSlotEndTimeFn,
  };
}
