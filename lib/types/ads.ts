import { Timestamp } from 'firebase/firestore';

export interface AdBanner {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  gradient: string[];
  isActive: boolean;
  order: number;
  buttonText?: string;
  linkUrl?: string;
  bannerImage?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface AdFormData {
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  gradient: string[];
  isActive: boolean;
  buttonText: string;
  linkUrl: string;
  bannerImage: string;
}

export const AVAILABLE_ICONS = [
  'trophy', 'clock', 'award', 'shopping-cart', 'star', 'circle',
  'gift', 'zap', 'heart', 'tag', 'megaphone', 'rocket',
  'sparkles', 'calendar', 'dumbbell', 'utensils',
];

export const GRADIENT_PRESETS = [
  { name: 'Kırmızı-Turuncu', colors: ['#FF6B6B', '#FF8E53'] },
  { name: 'Turkuaz', colors: ['#4ECDC4', '#44A08D'] },
  { name: 'Yeşil', colors: ['#95E1D3', '#38EF7D'] },
  { name: 'Mavi-Turkuaz', colors: ['#A8E6CF', '#56CCF2'] },
  { name: 'Sarı', colors: ['#FFD93D', '#F6D365'] },
  { name: 'Mor', colors: ['#667EEA', '#764BA2'] },
  { name: 'Pembe', colors: ['#F093FB', '#F5576C'] },
  { name: 'Lacivert', colors: ['#1e3d59', '#2E5077'] },
];

export const DEFAULT_AD_FORM: AdFormData = {
  title: '',
  subtitle: '',
  icon: 'trophy',
  color: '#FF6B6B',
  gradient: ['#FF6B6B', '#FF8E53'],
  isActive: true,
  buttonText: 'Detaylar',
  linkUrl: '',
  bannerImage: '',
};

export const DEFAULT_ADS: Omit<AdBanner, 'id'>[] = [
  {
    title: 'Profesyonel Tenis Dersleri',
    subtitle: 'Uzman antrenörlerimizle seviyenizi geliştirin',
    icon: 'trophy',
    color: '#FF6B6B',
    gradient: ['#FF6B6B', '#FF8E53'],
    isActive: true,
    order: 0,
    buttonText: 'Detaylar',
  },
  {
    title: 'Yeni Kort Rezervasyon Sistemi',
    subtitle: 'Hızlı ve kolay rezervasyon için hemen deneyin',
    icon: 'clock',
    color: '#4ECDC4',
    gradient: ['#4ECDC4', '#44A08D'],
    isActive: true,
    order: 1,
    buttonText: 'Detaylar',
  },
  {
    title: 'Turnuvalara Katılın',
    subtitle: 'Haftalık turnuvalarımızda yerinizi alın',
    icon: 'award',
    color: '#95E1D3',
    gradient: ['#95E1D3', '#38EF7D'],
    isActive: true,
    order: 2,
    buttonText: 'Detaylar',
  },
];
