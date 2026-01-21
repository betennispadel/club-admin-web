import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { db, storage } from './config';
import type { AdBanner } from '@/lib/types/ads';
import { DEFAULT_ADS } from '@/lib/types/ads';

// ============== AD BANNERS ==============

export async function fetchAdBanners(clubId: string): Promise<AdBanner[]> {
  try {
    const adsRef = collection(db, clubId, 'adBanners', 'adBanners');
    const q = query(adsRef, orderBy('order', 'asc'));
    const snapshot = await getDocs(q);

    const ads = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as AdBanner[];

    return ads;
  } catch (error) {
    console.error('Error fetching ad banners:', error);
    throw error;
  }
}

export async function createAdBanner(
  clubId: string,
  adData: Omit<AdBanner, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const adsRef = collection(db, clubId, 'adBanners', 'adBanners');
    const newDocRef = doc(adsRef);

    await setDoc(newDocRef, {
      ...adData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return newDocRef.id;
  } catch (error) {
    console.error('Error creating ad banner:', error);
    throw error;
  }
}

export async function updateAdBanner(
  clubId: string,
  adId: string,
  data: Partial<AdBanner>
): Promise<void> {
  try {
    const adRef = doc(db, clubId, 'adBanners', 'adBanners', adId);
    await updateDoc(adRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating ad banner:', error);
    throw error;
  }
}

export async function deleteAdBanner(clubId: string, adId: string): Promise<void> {
  try {
    const adRef = doc(db, clubId, 'adBanners', 'adBanners', adId);
    await deleteDoc(adRef);
  } catch (error) {
    console.error('Error deleting ad banner:', error);
    throw error;
  }
}

export async function toggleAdActive(
  clubId: string,
  adId: string,
  isActive: boolean
): Promise<void> {
  try {
    const adRef = doc(db, clubId, 'adBanners', 'adBanners', adId);
    await updateDoc(adRef, {
      isActive,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error toggling ad active state:', error);
    throw error;
  }
}

export async function reorderAdBanners(
  clubId: string,
  orderedIds: string[]
): Promise<void> {
  try {
    const batch = writeBatch(db);

    orderedIds.forEach((id, index) => {
      const adRef = doc(db, clubId, 'adBanners', 'adBanners', id);
      batch.update(adRef, { order: index, updatedAt: Timestamp.now() });
    });

    await batch.commit();
  } catch (error) {
    console.error('Error reordering ad banners:', error);
    throw error;
  }
}

export async function initializeDefaultAds(clubId: string): Promise<void> {
  try {
    const batch = writeBatch(db);

    DEFAULT_ADS.forEach((ad, index) => {
      const adsRef = collection(db, clubId, 'adBanners', 'adBanners');
      const newDocRef = doc(adsRef);
      batch.set(newDocRef, {
        ...ad,
        order: index,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    });

    await batch.commit();
  } catch (error) {
    console.error('Error initializing default ads:', error);
    throw error;
  }
}

// ============== IMAGE UPLOADS ==============

export async function uploadAdImage(
  clubId: string,
  file: File,
  adId: string
): Promise<string> {
  try {
    const timestamp = Date.now();
    const filename = `clubs/${clubId}/ads/ad_${adId}_${timestamp}.jpg`;
    const storageRef = ref(storage, filename);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading ad image:', error);
    throw error;
  }
}

export async function deleteAdImage(imageUrl: string): Promise<void> {
  try {
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split('/');
    const encodedPath = pathParts[pathParts.length - 1].split('?')[0];
    const decodedPath = decodeURIComponent(encodedPath);
    const storageRef = ref(storage, decodedPath);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting ad image:', error);
    // Don't throw - image might already be deleted
  }
}
