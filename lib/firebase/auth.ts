import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  EmailAuthProvider,
  reauthenticateWithCredential,
  getIdToken,
} from 'firebase/auth';
import { auth } from './config';

export const signIn = async (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const signOut = async () => {
  return firebaseSignOut(auth);
};

export const reauthenticateUser = async (currentPassword: string) => {
  const user = auth.currentUser;
  if (!user || !user.email) {
    throw new Error('User not found');
  }
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  return reauthenticateWithCredential(user, credential);
};

export const refreshToken = async () => {
  const user = auth.currentUser;
  if (user) {
    return getIdToken(user, true);
  }
  return null;
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export { auth };
