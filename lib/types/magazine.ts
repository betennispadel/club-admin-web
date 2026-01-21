import { Timestamp } from 'firebase/firestore';

// Page Types
export type MagazinePageType = 'cover' | 'contents' | 'article' | 'content' | 'back';

// Table of Contents Item
export interface TableOfContentItem {
  id: string;
  title: string;
  page: number;
}

// Magazine Page
export interface MagazinePage {
  id: string;
  type: MagazinePageType;
  title: string;
  subtitle?: string;
  content: string;
  imageUrl?: string;
  contentImages?: string[];
  tableOfContents?: TableOfContentItem[];
  inlineImages?: Record<string, string>;
  order: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Magazine Version
export interface MagazineVersion {
  id: string;
  versionNumber: string;
  versionName: string;
  year: string;
  title: string;
  description: string;
  isPublished: boolean;
  pages: MagazinePage[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  notifyAll?: boolean;
  notificationBody?: string;
}

// Form Types
export interface MagazineFormData {
  title: string;
  description: string;
  versionName: string;
  year: string;
}

export interface PageFormData {
  type: MagazinePageType;
  title: string;
  subtitle: string;
  content: string;
}

// Default values
export const DEFAULT_MAGAZINE_FORM: MagazineFormData = {
  title: '',
  description: '',
  versionName: '',
  year: new Date().getFullYear().toString(),
};

export const DEFAULT_PAGE: Omit<MagazinePage, 'id' | 'order'> = {
  type: 'article',
  title: '',
  subtitle: '',
  content: '',
  imageUrl: '',
  contentImages: [],
  tableOfContents: [],
  inlineImages: {},
};

// Page type configuration
export const PAGE_TYPES: { value: MagazinePageType; labelKey: string; icon: string; color: string }[] = [
  { value: 'cover', labelKey: 'pageTypes.cover', icon: 'BookOpen', color: '#1e3d59' },
  { value: 'contents', labelKey: 'pageTypes.contents', icon: 'List', color: '#6c757d' },
  { value: 'article', labelKey: 'pageTypes.article', icon: 'FileText', color: '#4CAF50' },
  { value: 'content', labelKey: 'pageTypes.content', icon: 'File', color: '#17a2b8' },
  { value: 'back', labelKey: 'pageTypes.back', icon: 'Book', color: '#FF9800' },
];
