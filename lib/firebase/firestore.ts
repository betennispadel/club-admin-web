import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  CollectionReference,
  DocumentReference,
  Query,
  QueryConstraint,
  Timestamp,
  addDoc,
  writeBatch,
  WriteBatch,
} from 'firebase/firestore';
import { db } from './config';

// Get collection reference for a club
// Path pattern: {clubId}/{collectionName}/{collectionName}
export const getClubCollection = (clubId: string, collectionName: string): CollectionReference => {
  return collection(db, clubId, collectionName, collectionName);
};

// Get document reference for a club
export const getClubDoc = (clubId: string, collectionName: string, docId: string): DocumentReference => {
  return doc(db, clubId, collectionName, collectionName, docId);
};

// Get club info document
export const getClubInfoRef = (clubId: string): DocumentReference => {
  return doc(db, clubId, 'clubInfo');
};

// Fetch club info
export const fetchClubInfo = async (clubId: string) => {
  const clubInfoRef = getClubInfoRef(clubId);
  const clubInfoDoc = await getDoc(clubInfoRef);

  if (clubInfoDoc.exists()) {
    return clubInfoDoc.data();
  }
  return null;
};

// Generic CRUD operations
export const fetchDocument = async <T>(ref: DocumentReference): Promise<T | null> => {
  const docSnap = await getDoc(ref);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as T;
  }
  return null;
};

export const fetchCollection = async <T>(
  ref: CollectionReference,
  ...constraints: QueryConstraint[]
): Promise<T[]> => {
  const q = constraints.length > 0 ? query(ref, ...constraints) : ref;
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
};

export const createDocument = async (ref: CollectionReference, data: any) => {
  return addDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const updateDocument = async (ref: DocumentReference, data: any) => {
  return updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const deleteDocument = async (ref: DocumentReference) => {
  return deleteDoc(ref);
};

// Subscribe to collection changes
export const subscribeToCollection = <T>(
  ref: CollectionReference,
  callback: (data: T[]) => void,
  ...constraints: QueryConstraint[]
) => {
  const q = constraints.length > 0 ? query(ref, ...constraints) : ref;
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
    callback(data);
  });
};

// Subscribe to document changes
export const subscribeToDocument = <T>(
  ref: DocumentReference,
  callback: (data: T | null) => void
) => {
  return onSnapshot(ref, (snapshot) => {
    if (snapshot.exists()) {
      callback({ id: snapshot.id, ...snapshot.data() } as T);
    } else {
      callback(null);
    }
  });
};

// Get subcollection reference (e.g., wallet activities)
// Path: {clubId}/{collectionName}/{collectionName}/{docId}/{subCollectionName}
export const getClubSubCollection = (
  clubId: string,
  collectionName: string,
  docId: string,
  subCollectionName: string
): CollectionReference => {
  return collection(db, clubId, collectionName, collectionName, docId, subCollectionName);
};

// Get subcollection document reference
export const getClubSubDoc = (
  clubId: string,
  collectionName: string,
  docId: string,
  subCollectionName: string,
  subDocId: string
): DocumentReference => {
  return doc(db, clubId, collectionName, collectionName, docId, subCollectionName, subDocId);
};

// Create a new batch for atomic operations
export const createBatch = (): WriteBatch => {
  return writeBatch(db);
};

export {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  addDoc,
  writeBatch,
};

export { db };
