import {
  doc,
  setDoc,
  getDoc,
  collection,
  serverTimestamp,
  Timestamp,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from './config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './config';

// Club Data Interface (matching mobile app)
export interface ClubData {
  clubId: string;
  clubName: string;
  authorizedPersonName: string;
  authorizedPersonEmail: string;
  clubPhone: string;
  country: string;       // ISO code (e.g., "TR")
  countryName: string;   // Full name (e.g., "Turkey")
  state: string;         // ISO code
  stateName: string;     // Full name
  city: string;          // City name
  clubLogo: string | null;
  clubPhotos: string[];
  adminUsername: string;
  adminPassword: string;
  status: 'pending' | 'active' | 'suspended' | 'cancelled';
  createdAt: any;
  updatedAt: any;
  hasTennis: boolean;
  hasPadel: boolean;
  themeColor: string;
}

// Subscription Data Interface
export interface SubscriptionData {
  planId: string;
  planName: string;
  courtRange: string;
  tennisCourts: number;
  padelCourts: number;
  totalCourts: number;
  billingCycle: 'monthly' | 'annually';
  price: number;
  currency: string;
  status: 'pending' | 'active' | 'expired' | 'cancelled';
  startDate: any;
  endDate: any;
  nextPaymentDate: any;
  paymentMethod: 'iyzico' | 'bank_transfer';
  lastPaymentId?: string;
  autoRenew: boolean;
  createdAt: any;
  updatedAt: any;
}

// Pricing tiers (in TRY)
export const PRICING_TIERS = {
  starter: {
    id: 'starter',
    courtRange: '1-3',
    minCourts: 1,
    maxCourts: 3,
    monthlyPrice: 5000,
    annualPrice: 50000, // ~2 months free
  },
  professional: {
    id: 'professional',
    courtRange: '4-6',
    minCourts: 4,
    maxCourts: 6,
    monthlyPrice: 10000,
    annualPrice: 100000,
  },
  business: {
    id: 'business',
    courtRange: '7-10',
    minCourts: 7,
    maxCourts: 10,
    monthlyPrice: 13333,
    annualPrice: 133333,
  },
  enterprise: {
    id: 'enterprise',
    courtRange: '10+',
    minCourts: 11,
    maxCourts: Infinity,
    monthlyPrice: 20000,
    annualPrice: 200000,
  },
};

// Generate unique club ID
export const generateClubId = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 20; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Check if admin username already exists
export const checkAdminUsernameExists = async (username: string): Promise<boolean> => {
  const clubRegistrationRef = collection(db, 'clubRegistration');
  const q = query(clubRegistrationRef, where('adminUsername', '==', username.toLowerCase()));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
};

// Check if club name already exists
export const checkClubNameExists = async (clubName: string): Promise<boolean> => {
  const clubRegistrationRef = collection(db, 'clubRegistration');
  const normalizedName = clubName.trim();
  const q = query(clubRegistrationRef, where('clubName', '==', normalizedName));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
};

// Check if email already exists
export const checkEmailExists = async (email: string): Promise<boolean> => {
  const clubRegistrationRef = collection(db, 'clubRegistration');
  const q = query(clubRegistrationRef, where('authorizedPersonEmail', '==', email.toLowerCase().trim()));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
};

// Get pricing tier based on court count
export const getPricingTier = (tennisCourts: number, padelCourts: number) => {
  const totalCourts = tennisCourts + padelCourts;

  if (totalCourts <= 3) return PRICING_TIERS.starter;
  if (totalCourts <= 6) return PRICING_TIERS.professional;
  if (totalCourts <= 10) return PRICING_TIERS.business;
  return PRICING_TIERS.enterprise;
};

// Calculate end date based on billing cycle
const calculateEndDate = (billingCycle: 'monthly' | 'annually'): Date => {
  const now = new Date();
  if (billingCycle === 'monthly') {
    return new Date(now.setMonth(now.getMonth() + 1));
  }
  return new Date(now.setFullYear(now.getFullYear() + 1));
};

// Upload club logo
export const uploadClubLogo = async (clubId: string, file: File): Promise<string> => {
  const storageRef = ref(storage, `clubs/${clubId}/logo/${Date.now()}_${file.name}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

// Upload club photos
export const uploadClubPhotos = async (clubId: string, files: File[]): Promise<string[]> => {
  const urls: string[] = [];
  for (const file of files) {
    const storageRef = ref(storage, `clubs/${clubId}/photos/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    urls.push(url);
  }
  return urls;
};

// Create club registration request (pending payment)
export interface CreateClubParams {
  clubName: string;
  authorizedPersonName: string;
  authorizedPersonEmail: string;
  clubPhone: string;
  country: string;
  countryName: string;
  state: string;
  stateName: string;
  city: string;
  adminUsername: string;
  adminPassword: string;
  hasTennis: boolean;
  hasPadel: boolean;
  tennisCourts: number;
  padelCourts: number;
  themeColor: string;
  billingCycle: 'monthly' | 'annually';
  clubLogo?: File | null;
}

export const createClubRegistration = async (params: CreateClubParams): Promise<{
  clubId: string;
  subscriptionId: string;
  price: number;
  currency: string;
}> => {
  // Generate unique club ID
  const clubId = generateClubId();

  // Check if username already exists
  const usernameExists = await checkAdminUsernameExists(params.adminUsername);
  if (usernameExists) {
    throw new Error('USERNAME_EXISTS');
  }

  // Get pricing tier
  const tier = getPricingTier(params.tennisCourts, params.padelCourts);
  const price = params.billingCycle === 'monthly' ? tier.monthlyPrice : tier.annualPrice;

  // Upload logo if provided
  let logoUrl: string | null = null;
  if (params.clubLogo) {
    logoUrl = await uploadClubLogo(clubId, params.clubLogo);
  }

  // Create club data
  const clubData: ClubData = {
    clubId,
    clubName: params.clubName.trim(),
    authorizedPersonName: params.authorizedPersonName.trim(),
    authorizedPersonEmail: params.authorizedPersonEmail.trim().toLowerCase(),
    clubPhone: params.clubPhone,
    country: params.country,
    countryName: params.countryName,
    state: params.state,
    stateName: params.stateName,
    city: params.city,
    clubLogo: logoUrl,
    clubPhotos: [],
    adminUsername: params.adminUsername.toLowerCase().trim(),
    adminPassword: params.adminPassword,
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    hasTennis: params.hasTennis,
    hasPadel: params.hasPadel,
    themeColor: params.themeColor,
  };

  // Calculate dates
  const endDate = calculateEndDate(params.billingCycle);
  const subscriptionId = `sub_${clubId}_${Date.now()}`;

  // Create subscription data
  const subscriptionData: SubscriptionData = {
    planId: tier.id,
    planName: tier.id,
    courtRange: tier.courtRange,
    tennisCourts: params.tennisCourts,
    padelCourts: params.padelCourts,
    totalCourts: params.tennisCourts + params.padelCourts,
    billingCycle: params.billingCycle,
    price,
    currency: 'TRY',
    status: 'pending',
    startDate: serverTimestamp(),
    endDate: Timestamp.fromDate(endDate),
    nextPaymentDate: Timestamp.fromDate(endDate),
    paymentMethod: 'iyzico',
    autoRenew: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // Save club info to Firestore
  // Path: {clubId}/clubInfo
  const clubInfoRef = doc(db, clubId, 'clubInfo');
  await setDoc(clubInfoRef, clubData);

  // Save subscription to Firestore
  // Path: {clubId}/subscription/subscription/{subscriptionId}
  const subscriptionRef = doc(db, clubId, 'subscription', 'subscription', subscriptionId);
  await setDoc(subscriptionRef, subscriptionData);

  // Also save to global clubs collection for admin listing
  // Path: clubs/{clubId}
  const globalClubRef = doc(db, 'clubs', clubId);
  await setDoc(globalClubRef, {
    clubId,
    clubName: clubData.clubName,
    clubNameLower: clubData.clubName.toLowerCase().trim(), // For case-insensitive uniqueness check
    adminUsername: clubData.adminUsername,
    authorizedPersonEmail: clubData.authorizedPersonEmail,
    status: 'pending',
    subscriptionStatus: 'pending',
    createdAt: serverTimestamp(),
  });

  return {
    clubId,
    subscriptionId,
    price,
    currency: 'TRY',
  };
};

// Activate club after successful payment
export const activateClub = async (
  clubId: string,
  subscriptionId: string,
  paymentId: string
): Promise<void> => {
  // Update club status
  const clubInfoRef = doc(db, clubId, 'clubInfo');
  await setDoc(clubInfoRef, {
    status: 'active',
    updatedAt: serverTimestamp(),
  }, { merge: true });

  // Update subscription status
  const subscriptionRef = doc(db, clubId, 'subscription', 'subscription', subscriptionId);
  await setDoc(subscriptionRef, {
    status: 'active',
    lastPaymentId: paymentId,
    updatedAt: serverTimestamp(),
  }, { merge: true });

  // Update global clubs collection
  const globalClubRef = doc(db, 'clubs', clubId);
  await setDoc(globalClubRef, {
    status: 'active',
    subscriptionStatus: 'active',
    updatedAt: serverTimestamp(),
  }, { merge: true });

  // Create default role for club
  await createDefaultClubRole(clubId);

  // Create default courts
  // This will be handled when user first logs in
};

// Create default admin role for club
const createDefaultClubRole = async (clubId: string): Promise<void> => {
  const roleRef = doc(db, clubId, 'roles', 'roles', 'admin');
  await setDoc(roleRef, {
    id: 'admin',
    roleName: 'Admin',
    description: 'Full access to all features',
    usersManagement: true,
    reservationsManagement: true,
    courtManagements: true,
    tournamentsManagement: true,
    financialManagements: true,
    walletManagements: true,
    teamManagement: true,
    teamPerformance: true,
    employeeSalaryManagement: true,
    mealCardManagement: true,
    roles: true,
    privateLessonArea: true,
    discountManagement: true,
    apiManagement: true,
    restaurantManagement: true,
    storeManagement: true,
    magazineManagement: true,
    sliderManagement: true,
    localeSettings: true,
    myClubManager: true,
    payManagement: true,
    notificationsManagement: true,
    adsManagement: true,
    problemManagement: true,
    gameCenter: true,
    trainingPool: true,
    occupancyManagement: true,
    eventsManagement: true,
    appStoreManagement: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

// Get club subscription status
export const getClubSubscription = async (clubId: string): Promise<SubscriptionData | null> => {
  const subscriptionCollRef = collection(db, clubId, 'subscription', 'subscription');
  const snapshot = await getDocs(subscriptionCollRef);

  if (snapshot.empty) return null;

  // Return the most recent subscription
  const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as (SubscriptionData & { id: string })[];
  return docs.sort((a, b) => {
    const aDate = a.createdAt?.toDate?.() || new Date(0);
    const bDate = b.createdAt?.toDate?.() || new Date(0);
    return bDate.getTime() - aDate.getTime();
  })[0] || null;
};

// Check if subscription is active and valid
export const isSubscriptionActive = (subscription: SubscriptionData | null): boolean => {
  if (!subscription) return false;
  if (subscription.status !== 'active') return false;

  const endDate = subscription.endDate?.toDate?.() || new Date(0);
  return endDate > new Date();
};

// Get days until subscription expires
export const getDaysUntilExpiry = (subscription: SubscriptionData | null): number => {
  if (!subscription) return 0;

  const endDate = subscription.endDate?.toDate?.() || new Date(0);
  const now = new Date();
  const diffTime = endDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
