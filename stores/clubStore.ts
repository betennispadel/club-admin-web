import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Club } from '@/lib/types';
import { collection, CollectionReference, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

const SELECTED_CLUB_KEY = 'selectedClub';
const LOGGED_IN_CLUBS_KEY = 'loggedInClubs';
const CLUB_SESSIONS_KEY = 'clubSessions';

interface ClubSession {
  email: string;
  timestamp: number;
}

interface ClubState {
  selectedClub: Club | null;
  loggedInClubs: string[];
  clubSessions: Record<string, ClubSession>;
  isLoading: boolean;

  // Actions
  setSelectedClub: (club: Club | null) => void;
  selectClub: (clubId: string, clubData: Partial<Club>) => void;
  clearClub: () => void;
  refreshClubData: () => Promise<void>;

  // Collection helpers
  getClubCollection: (collectionName: string) => CollectionReference | null;

  // Multi-club session management
  addLoggedInClub: (clubId: string) => void;
  removeLoggedInClub: (clubId: string) => void;
  hasMultipleLoggedInClubs: () => boolean;

  // Club sessions (for auto-login when switching clubs)
  saveClubSession: (clubId: string, email: string) => void;
  getClubSession: (clubId: string) => ClubSession | null;
  removeClubSession: (clubId: string) => void;

  // Loading
  setIsLoading: (loading: boolean) => void;

  // Reset
  reset: () => void;
}

const SESSION_EXPIRY_DAYS = 30;

const initialState = {
  selectedClub: null,
  loggedInClubs: [],
  clubSessions: {},
  isLoading: false,
};

export const useClubStore = create<ClubState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setSelectedClub: (club) => set({ selectedClub: club }),

      selectClub: (clubId, clubData) => {
        const club: Club = {
          id: clubId,
          name: clubData.name || 'Tennis Club',
          logo: clubData.logo || null,
          location: clubData.location,
          courts: clubData.courts,
          rating: clubData.rating,
          themeColor: clubData.themeColor || '#007BFF',
        };
        set({ selectedClub: club });
      },

      clearClub: () => set({ selectedClub: null }),

      refreshClubData: async () => {
        const { selectedClub } = get();
        if (!selectedClub) return;

        try {
          const clubRef = doc(db, selectedClub.id, 'clubInfo');
          const clubDoc = await getDoc(clubRef);

          if (clubDoc.exists()) {
            const data = clubDoc.data();
            const updatedClub: Club = {
              ...selectedClub,
              name: data.clubName || selectedClub.name,
              logo: data.clubLogo || selectedClub.logo,
              themeColor: data.themeColor || selectedClub.themeColor,
            };
            set({ selectedClub: updatedClub });
          }
        } catch (error) {
          // Silently fail - don't update state if fetch fails
        }
      },

      getClubCollection: (collectionName) => {
        const { selectedClub } = get();
        if (!selectedClub) return null;
        // Path pattern: {clubId}/{collectionName}/{collectionName}
        return collection(db, selectedClub.id, collectionName, collectionName);
      },

      addLoggedInClub: (clubId) => {
        const { loggedInClubs } = get();
        if (!loggedInClubs.includes(clubId)) {
          set({ loggedInClubs: [...loggedInClubs, clubId] });
        }
      },

      removeLoggedInClub: (clubId) => {
        const { loggedInClubs, clubSessions } = get();
        const updatedClubs = loggedInClubs.filter((id) => id !== clubId);
        const updatedSessions = { ...clubSessions };
        delete updatedSessions[clubId];
        set({ loggedInClubs: updatedClubs, clubSessions: updatedSessions });
      },

      hasMultipleLoggedInClubs: () => {
        const { loggedInClubs } = get();
        return loggedInClubs.length > 1;
      },

      saveClubSession: (clubId, email) => {
        const { clubSessions } = get();
        set({
          clubSessions: {
            ...clubSessions,
            [clubId]: {
              email,
              timestamp: Date.now(),
            },
          },
        });
      },

      getClubSession: (clubId) => {
        const { clubSessions } = get();
        const session = clubSessions[clubId];
        if (!session) return null;

        const sessionAge = Date.now() - session.timestamp;
        const sessionExpiryMs = SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

        if (sessionAge > sessionExpiryMs) {
          const { removeClubSession } = get();
          removeClubSession(clubId);
          return null;
        }

        return session;
      },

      removeClubSession: (clubId) => {
        const { clubSessions } = get();
        const updatedSessions = { ...clubSessions };
        delete updatedSessions[clubId];
        set({ clubSessions: updatedSessions });
      },

      setIsLoading: (loading) => set({ isLoading: loading }),

      reset: () => set(initialState),
    }),
    {
      name: 'club-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        selectedClub: state.selectedClub,
        loggedInClubs: state.loggedInClubs,
        clubSessions: state.clubSessions,
      }),
    }
  )
);
