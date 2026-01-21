import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import type { Coupon, Court, AppliedDiscount, UserForCoupon } from '@/lib/types/discounts';

// ============== COURTS ==============

export async function fetchCourts(clubId: string): Promise<Court[]> {
  try {
    const courtsRef = collection(db, clubId, 'courts', 'courts');
    const snapshot = await getDocs(courtsRef);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Court[];
  } catch (error) {
    console.error('Error fetching courts:', error);
    throw error;
  }
}

export async function updateCourtDiscounts(
  clubId: string,
  courtId: string,
  discounts: AppliedDiscount[]
): Promise<void> {
  try {
    const courtRef = doc(db, clubId, 'courts', 'courts', courtId);
    await updateDoc(courtRef, { appliedDiscounts: discounts });
  } catch (error) {
    console.error('Error updating court discounts:', error);
    throw error;
  }
}

export async function addCourtDiscount(
  clubId: string,
  courtId: string,
  currentDiscounts: AppliedDiscount[],
  newDiscount: Omit<AppliedDiscount, 'id' | 'appliedAt'>
): Promise<AppliedDiscount[]> {
  const discount: AppliedDiscount = {
    ...newDiscount,
    id: Date.now().toString(),
    appliedAt: new Date().toISOString(),
  };

  const updatedDiscounts = [...currentDiscounts, discount];
  await updateCourtDiscounts(clubId, courtId, updatedDiscounts);
  return updatedDiscounts;
}

export async function removeCourtDiscount(
  clubId: string,
  courtId: string,
  currentDiscounts: AppliedDiscount[],
  discountId: string
): Promise<AppliedDiscount[]> {
  const updatedDiscounts = currentDiscounts.filter((d) => d.id !== discountId);
  await updateCourtDiscounts(clubId, courtId, updatedDiscounts);
  return updatedDiscounts;
}

export async function clearAllCourtDiscounts(
  clubId: string,
  courtId: string
): Promise<void> {
  await updateCourtDiscounts(clubId, courtId, []);
}

// ============== COUPONS ==============

export async function fetchCoupons(clubId: string): Promise<Coupon[]> {
  try {
    const couponsRef = collection(db, clubId, 'coupons', 'coupons');
    const snapshot = await getDocs(couponsRef);
    const coupons = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Coupon[];

    // Sort by createdAt descending
    return coupons.sort(
      (a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)
    );
  } catch (error) {
    console.error('Error fetching coupons:', error);
    throw error;
  }
}

export async function createCoupon(
  clubId: string,
  couponData: Omit<Coupon, 'id' | 'createdAt' | 'currentUses'>
): Promise<string> {
  try {
    const couponsRef = collection(db, clubId, 'coupons', 'coupons');

    // Check if code already exists
    const existingQuery = query(couponsRef, where('code', '==', couponData.code));
    const existingSnapshot = await getDocs(existingQuery);

    if (!existingSnapshot.empty) {
      throw new Error('COUPON_CODE_EXISTS');
    }

    const docRef = await addDoc(couponsRef, {
      ...couponData,
      currentUses: 0,
      createdAt: Timestamp.now(),
    });

    return docRef.id;
  } catch (error) {
    console.error('Error creating coupon:', error);
    throw error;
  }
}

export async function updateCoupon(
  clubId: string,
  couponId: string,
  couponData: Partial<Coupon>
): Promise<void> {
  try {
    const couponRef = doc(db, clubId, 'coupons', 'coupons', couponId);
    await updateDoc(couponRef, couponData);
  } catch (error) {
    console.error('Error updating coupon:', error);
    throw error;
  }
}

export async function deleteCoupon(clubId: string, couponId: string): Promise<void> {
  try {
    const couponRef = doc(db, clubId, 'coupons', 'coupons', couponId);
    await deleteDoc(couponRef);
  } catch (error) {
    console.error('Error deleting coupon:', error);
    throw error;
  }
}

export async function toggleCouponStatus(
  clubId: string,
  couponId: string,
  currentStatus: string
): Promise<void> {
  const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
  await updateCoupon(clubId, couponId, { status: newStatus as 'active' | 'disabled' });
}

// ============== USERS ==============

export async function fetchUsersForCoupon(clubId: string): Promise<UserForCoupon[]> {
  try {
    const usersRef = collection(db, clubId, 'users', 'users');
    const snapshot = await getDocs(usersRef);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        username: data.username || data.email?.split('@')[0] || '',
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        photoURL: data.profilePicture || data.photoURL,
      };
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

// ============== NOTIFICATIONS ==============

export async function sendDiscountNotification(
  clubId: string,
  clubName: string,
  courtName: string,
  percentage: number,
  timeRange?: { from: string; until: string }
): Promise<number> {
  try {
    const usersRef = collection(db, clubId, 'users', 'users');
    const notificationsRef = collection(db, clubId, 'notifications', 'notifications');

    const usersSnapshot = await getDocs(usersRef);

    const timeText = timeRange
      ? `${timeRange.from} - ${timeRange.until}`
      : 'Tüm saatler';

    const message = `${courtName} kortunda %${percentage} indirim! ${timeText} saatleri arası geçerli.`;

    let batch = writeBatch(db);
    let notificationCount = 0;
    let batchCount = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      if (userData.authUid) {
        const notificationRef = doc(notificationsRef);
        batch.set(notificationRef, {
          type: 'discountNotification',
          fromUserId: 'admin',
          toUserId: userData.authUid,
          message,
          title: 'Yeni İndirim!',
          date: serverTimestamp(),
          isRead: false,
          status: 'pending',
          clubName,
          data: {
            courtName,
            percentage,
            timeRange: timeRange || 'all',
            action: 'open_court_availability',
          },
        });
        notificationCount++;
        batchCount++;

        if (batchCount >= 450) {
          await batch.commit();
          batch = writeBatch(db);
          batchCount = 0;
        }
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }

    return notificationCount;
  } catch (error) {
    console.error('Error sending notifications:', error);
    throw error;
  }
}

// ============== HELPERS ==============

export function generateCouponCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function formatTimeRange(
  discount: AppliedDiscount,
  allHoursLabel: string,
  notSpecifiedLabel: string
): string {
  if (discount.isAllHours) return allHoursLabel;
  if (discount.timeRange) {
    return `${discount.timeRange.from} - ${discount.timeRange.until}`;
  }
  return notSpecifiedLabel;
}

export function getCouponStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return '#22C55E';
    case 'expired':
      return '#9E9E9E';
    case 'used':
      return '#3B82F6';
    case 'disabled':
      return '#EF4444';
    default:
      return '#9E9E9E';
  }
}
