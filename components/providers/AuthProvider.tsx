'use client';

import { useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useAuthStore } from '@/stores/authStore';
import { useClubStore } from '@/stores/clubStore';
import {
  getClubCollection,
  query,
  where,
  getDocs,
  doc,
  onSnapshot,
} from '@/lib/firebase/firestore';
import { db } from '@/lib/firebase/config';
import { User, Permissions } from '@/lib/types';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const {
    setCurrentUser,
    setUserProfile,
    setRole,
    setPermissions,
    setLoading,
    setPermissionsLoading,
  } = useAuthStore();

  const { selectedClub } = useClubStore();

  useEffect(() => {
    let unsubscribeRole: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
      if (user && selectedClub) {
        setCurrentUser(user);
        setPermissionsLoading(true);

        try {
          // Get user from club's users collection
          const usersRef = getClubCollection(selectedClub.id, 'users');
          const usersQuery = query(usersRef, where('authUid', '==', user.uid));
          const userSnapshot = await getDocs(usersQuery);

          if (!userSnapshot.empty) {
            const userData = userSnapshot.docs[0].data();
            setUserProfile({ ...userData, id: userSnapshot.docs[0].id } as User);
            setRole(userData.role || 'member');

            // Subscribe to role permissions
            if (userData.role) {
              const rolesRef = getClubCollection(selectedClub.id, 'roles');
              const roleDocRef = doc(rolesRef, userData.role);

              if (unsubscribeRole) unsubscribeRole();

              unsubscribeRole = onSnapshot(
                roleDocRef,
                (roleDocSnap) => {
                  if (roleDocSnap.exists()) {
                    const roleData = roleDocSnap.data();
                    setPermissions((roleData.permissions as Permissions) || null);
                  } else {
                    setPermissions(null);
                  }
                  setPermissionsLoading(false);
                },
                () => {
                  setPermissions(null);
                  setPermissionsLoading(false);
                }
              );
            } else {
              setPermissions(null);
              setPermissionsLoading(false);
            }
          } else {
            // User not found in club
            setUserProfile(null);
            setRole(null);
            setPermissions(null);
            setPermissionsLoading(false);
          }
        } catch (error) {
          console.error('Error loading user data:', error);
          setUserProfile(null);
          setRole(null);
          setPermissions(null);
          setPermissionsLoading(false);
        }
      } else {
        // No user or no club selected
        setCurrentUser(null);
        setUserProfile(null);
        setRole(null);
        setPermissions(null);
        setPermissionsLoading(false);

        if (unsubscribeRole) {
          unsubscribeRole();
          unsubscribeRole = undefined;
        }
      }

      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeRole) {
        unsubscribeRole();
      }
    };
  }, [selectedClub]);

  return <>{children}</>;
}
