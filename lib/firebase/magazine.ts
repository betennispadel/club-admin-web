import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { db, storage } from './config';
import type { MagazineVersion, MagazinePage, TableOfContentItem } from '@/lib/types/magazine';

// ============== MAGAZINE VERSIONS ==============

export async function fetchMagazineVersions(clubId: string): Promise<MagazineVersion[]> {
  try {
    const versionsRef = collection(db, clubId, 'magazineVersions', 'magazineVersions');
    const q = query(versionsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as MagazineVersion[];
  } catch (error) {
    console.error('Error fetching magazine versions:', error);
    throw error;
  }
}

export async function createMagazineVersion(
  clubId: string,
  versionData: Omit<MagazineVersion, 'id' | 'createdAt' | 'updatedAt' | 'versionNumber'>,
  existingVersionsCount: number
): Promise<string> {
  try {
    const versionsRef = collection(db, clubId, 'magazineVersions', 'magazineVersions');
    const versionNumber = `v${existingVersionsCount + 1}.0`;

    const docRef = await addDoc(versionsRef, {
      ...versionData,
      versionNumber,
      isPublished: false,
      notifyAll: true,
      notificationBody: '',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return docRef.id;
  } catch (error) {
    console.error('Error creating magazine version:', error);
    throw error;
  }
}

export async function updateMagazineVersion(
  clubId: string,
  versionId: string,
  data: Partial<MagazineVersion>
): Promise<void> {
  try {
    const versionRef = doc(db, clubId, 'magazineVersions', 'magazineVersions', versionId);
    await updateDoc(versionRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating magazine version:', error);
    throw error;
  }
}

export async function deleteMagazineVersion(clubId: string, versionId: string): Promise<void> {
  try {
    const versionRef = doc(db, clubId, 'magazineVersions', 'magazineVersions', versionId);
    await deleteDoc(versionRef);
  } catch (error) {
    console.error('Error deleting magazine version:', error);
    throw error;
  }
}

// ============== PUBLISH MAGAZINE ==============

export async function publishMagazine(
  clubId: string,
  version: MagazineVersion
): Promise<void> {
  try {
    const versionsRef = collection(db, clubId, 'magazineVersions', 'magazineVersions');
    const pagesRef = collection(db, clubId, 'magazinePages', 'magazinePages');

    // Update version to published
    await updateDoc(doc(versionsRef, version.id), {
      isPublished: true,
      updatedAt: Timestamp.now(),
      notifyAll: true,
    });

    // Delete existing pages
    const existingPages = await getDocs(pagesRef);
    const deletePromises = existingPages.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    // Add new pages
    const addPromises = version.pages.map((page) =>
      addDoc(pagesRef, {
        ...page,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
    );
    await Promise.all(addPromises);
  } catch (error) {
    console.error('Error publishing magazine:', error);
    throw error;
  }
}

export async function unpublishMagazine(clubId: string, versionId: string): Promise<void> {
  try {
    const versionRef = doc(db, clubId, 'magazineVersions', 'magazineVersions', versionId);
    await updateDoc(versionRef, {
      isPublished: false,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error unpublishing magazine:', error);
    throw error;
  }
}

// ============== NOTIFICATIONS ==============

export async function sendMagazineNotification(
  clubId: string,
  clubName: string,
  version: MagazineVersion,
  fromUserId: string
): Promise<number> {
  try {
    const usersRef = collection(db, clubId, 'users', 'users');
    const notificationsRef = collection(db, clubId, 'notifications', 'notifications');

    const usersSnapshot = await getDocs(usersRef);

    const message = `${version.title}${version.versionName ? ` - ${version.versionName}` : ''}${version.year ? ` (${version.year})` : ''} yayınlandı!`;

    let batch = writeBatch(db);
    let notificationCount = 0;
    let batchCount = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      if (userData.authUid) {
        const notificationRef = doc(notificationsRef);
        batch.set(notificationRef, {
          type: 'magazinePublished',
          fromUserId,
          toUserId: userData.authUid,
          magazineId: version.id,
          magazineTitle: version.title,
          versionName: version.versionName || '',
          year: version.year || '',
          message,
          date: serverTimestamp(),
          isRead: false,
          status: 'pending',
          clubName,
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
    console.error('Error sending magazine notification:', error);
    throw error;
  }
}

// ============== IMAGE UPLOADS ==============

export async function uploadMagazineImage(
  clubId: string,
  file: File,
  type: 'cover' | 'content' | 'inline',
  pageId?: string
): Promise<string> {
  try {
    const timestamp = Date.now();
    let filename: string;

    switch (type) {
      case 'cover':
        filename = `clubs/${clubId}/magazine/magazine_${timestamp}.jpg`;
        break;
      case 'content':
        filename = `clubs/${clubId}/magazine/content/content_${pageId}_${timestamp}.jpg`;
        break;
      case 'inline':
        const imageId = Math.floor(100 + Math.random() * 900);
        filename = `clubs/${clubId}/magazine/inline/inline_${pageId}_${imageId}.jpg`;
        break;
      default:
        filename = `clubs/${clubId}/magazine/image_${timestamp}.jpg`;
    }

    const storageRef = ref(storage, filename);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    return downloadURL;
  } catch (error) {
    console.error('Error uploading magazine image:', error);
    throw error;
  }
}

export async function deleteMagazineImage(imageUrl: string): Promise<void> {
  try {
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split('/');
    const encodedPath = pathParts[pathParts.length - 1].split('?')[0];
    const decodedPath = decodeURIComponent(encodedPath);
    const storageRef = ref(storage, decodedPath);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting magazine image:', error);
    // Don't throw - image might already be deleted
  }
}

// ============== HELPERS ==============

export function createNewPage(order: number, type: MagazinePage['type'] = 'article'): MagazinePage {
  return {
    id: `page_${Date.now()}_${order}`,
    type,
    title: '',
    subtitle: '',
    content: '',
    imageUrl: '',
    contentImages: [],
    tableOfContents: [],
    inlineImages: {},
    order,
  };
}

export function createTableOfContentItem(): TableOfContentItem {
  return {
    id: `toc_${Date.now()}_${Math.random()}`,
    title: '',
    page: 1,
  };
}

export function formatVersionDisplay(version: MagazineVersion): string {
  const parts = [version.title];
  if (version.versionName) parts.push(version.versionName);
  if (version.year) parts.push(`(${version.year})`);
  return parts.join(' - ');
}
