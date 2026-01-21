'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useClubStore } from '@/stores/clubStore';

// Helper to convert hex to HSL
function hexToHSL(hex: string): { h: number; s: number; l: number } {
  // Remove #
  hex = hex.replace('#', '');

  // Parse hex
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useUIStore();
  const { selectedClub } = useClubStore();

  // Handle dark/light mode
  useEffect(() => {
    const root = document.documentElement;

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.toggle('dark', systemTheme === 'dark');
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        root.classList.toggle('dark', e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Handle club theme color
  useEffect(() => {
    if (selectedClub?.themeColor) {
      const hsl = hexToHSL(selectedClub.themeColor);
      const root = document.documentElement;

      // Set CSS custom properties for primary color
      root.style.setProperty('--primary', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
      root.style.setProperty('--primary-foreground', hsl.l > 50 ? '0 0% 0%' : '0 0% 100%');

      // Set darker variant for hover states
      const darkL = Math.max(0, hsl.l - 10);
      root.style.setProperty('--primary-dark', `${hsl.h} ${hsl.s}% ${darkL}%`);

      // Set lighter variant
      const lightL = Math.min(100, hsl.l + 20);
      root.style.setProperty('--primary-light', `${hsl.h} ${hsl.s}% ${lightL}%`);
    }
  }, [selectedClub?.themeColor]);

  return <>{children}</>;
}
