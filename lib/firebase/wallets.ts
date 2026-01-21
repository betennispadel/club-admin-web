import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch,
  runTransaction,
  DocumentData,
} from 'firebase/firestore';
import { db } from './config';
import type {
  UserWallet,
  WalletStats,
  Transaction,
  Activity,
  Transfer,
  Reservation,
  WalletUser,
  Court,
} from '@/lib/types/wallets';

// Helper to get club collection reference
const getClubCollectionRef = (clubId: string, collectionName: string) => {
  return collection(db, clubId, collectionName, collectionName);
};

// Helper to get club document reference
const getClubDocRef = (clubId: string, collectionName: string, docId: string) => {
  return doc(db, clubId, collectionName, collectionName, docId);
};

// Fetch all wallets with real-time listener
export const subscribeToWallets = (
  clubId: string,
  usersMap: Map<string, WalletUser>,
  onUpdate: (wallets: UserWallet[], stats: WalletStats) => void,
  onError: (error: Error) => void
) => {
  const walletsRef = getClubCollectionRef(clubId, 'wallets');

  return onSnapshot(
    walletsRef,
    (snapshot) => {
      const wallets: UserWallet[] = [];
      let totalBalance = 0;
      let totalNegativeLimit = 0;
      let activeWallets = 0;
      let blockedWallets = 0;

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const user = usersMap.get(doc.id);

        const wallet: UserWallet = {
          id: doc.id,
          odacinId: doc.id,
          userId: data.userId || doc.id,
          userName: data.userName || user?.username || 'Bilinmiyor',
          name: user
            ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username
            : data.userName || 'Bilinmiyor',
          balance: data.balance || 0,
          negativeBalance: data.negativeBalance || 0,
          isBlocked: data.isBlocked || false,
          createdAt: data.createdAt,
          lastUpdated: data.lastUpdated,
          photoURL: user?.photoURL || null,
        };

        wallets.push(wallet);
        totalBalance += wallet.balance;
        totalNegativeLimit += wallet.negativeBalance;

        if (wallet.isBlocked) {
          blockedWallets++;
        } else {
          activeWallets++;
        }
      });

      const stats: WalletStats = {
        totalWallets: wallets.length,
        activeWallets,
        blockedWallets,
        totalBalance,
        totalNegativeLimit,
      };

      onUpdate(wallets, stats);
    },
    onError
  );
};

// Fetch users map
export const fetchUsersMap = async (clubId: string): Promise<Map<string, WalletUser>> => {
  const usersRef = getClubCollectionRef(clubId, 'users');
  const snapshot = await getDocs(usersRef);

  const usersMap = new Map<string, WalletUser>();
  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    usersMap.set(doc.id, {
      id: doc.id,
      username: data.username || '',
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      email: data.email || '',
      photoURL: data.photoURL || null,
    });
  });

  return usersMap;
};

// Fetch courts map
export const fetchCourtsMap = async (clubId: string): Promise<Map<string, Court>> => {
  const courtsRef = getClubCollectionRef(clubId, 'courts');
  const snapshot = await getDocs(courtsRef);

  const courtsMap = new Map<string, Court>();
  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    courtsMap.set(doc.id, {
      id: doc.id,
      name: data.name || '',
    });
  });

  return courtsMap;
};

// Create new wallet
export const createWallet = async (
  clubId: string,
  userId: string,
  userName: string,
  initialBalance: number = 0
): Promise<void> => {
  const walletRef = getClubDocRef(clubId, 'wallets', userId);

  const walletData = {
    userId,
    userName,
    balance: initialBalance,
    negativeBalance: 0,
    isBlocked: false,
    createdAt: serverTimestamp(),
    lastUpdated: serverTimestamp(),
  };

  await setDoc(walletRef, walletData);

  // Create initial activity
  const activityRef = doc(collection(walletRef, 'activities'));
  await setDoc(activityRef, {
    service: 'Cüzdan Oluşturuldu',
    serviceKey: 'walletCreated',
    amount: initialBalance,
    type: 'system',
    timestamp: serverTimestamp(),
    description: 'Cüzdan başlatıldı',
  });
};

// Fetch users without wallet
export const fetchUsersWithoutWallet = async (clubId: string): Promise<WalletUser[]> => {
  // Get all users
  const usersRef = getClubCollectionRef(clubId, 'users');
  const usersSnapshot = await getDocs(usersRef);

  // Get all wallets
  const walletsRef = getClubCollectionRef(clubId, 'wallets');
  const walletsSnapshot = await getDocs(walletsRef);

  // Create set of user IDs who have wallets
  const usersWithWallets = new Set<string>();
  walletsSnapshot.docs.forEach((doc) => {
    const data = doc.data();
    usersWithWallets.add(data.userId || doc.id);
  });

  // Filter users without wallets
  const usersWithoutWallet: WalletUser[] = [];
  usersSnapshot.docs.forEach((doc) => {
    if (!usersWithWallets.has(doc.id)) {
      const data = doc.data();
      usersWithoutWallet.push({
        id: doc.id,
        username: data.username || '',
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
        photoURL: data.photoURL || null,
      });
    }
  });

  return usersWithoutWallet;
};

// Add balance to wallet
export const addBalance = async (
  clubId: string,
  walletId: string,
  amount: number,
  adminName: string
): Promise<void> => {
  const walletRef = getClubDocRef(clubId, 'wallets', walletId);

  await runTransaction(db, async (transaction) => {
    const walletDoc = await transaction.get(walletRef);
    if (!walletDoc.exists()) {
      throw new Error('Cüzdan bulunamadı');
    }

    const currentBalance = walletDoc.data().balance || 0;
    const newBalance = currentBalance + amount;

    transaction.update(walletRef, {
      balance: newBalance,
      lastUpdated: serverTimestamp(),
    });

    // Add activity
    const activityRef = doc(collection(walletRef, 'activities'));
    transaction.set(activityRef, {
      service: 'Bakiye Eklendi',
      serviceKey: 'balanceAdded',
      serviceParams: { amount: amount.toFixed(2), admin: adminName },
      amount: amount,
      type: 'credit',
      timestamp: serverTimestamp(),
      status: 'completed',
    });
  });
};

// Set negative limit
export const setNegativeLimit = async (
  clubId: string,
  walletId: string,
  limit: number,
  adminName: string
): Promise<void> => {
  const walletRef = getClubDocRef(clubId, 'wallets', walletId);

  await runTransaction(db, async (transaction) => {
    const walletDoc = await transaction.get(walletRef);
    if (!walletDoc.exists()) {
      throw new Error('Cüzdan bulunamadı');
    }

    transaction.update(walletRef, {
      negativeBalance: limit,
      lastUpdated: serverTimestamp(),
    });

    // Add activity
    const activityRef = doc(collection(walletRef, 'activities'));
    transaction.set(activityRef, {
      service: 'Negatif Limit Ayarlandı',
      serviceKey: 'negativeLimitSet',
      serviceParams: { limit: limit.toFixed(2), admin: adminName },
      amount: 0,
      type: 'system',
      timestamp: serverTimestamp(),
      status: 'completed',
    });
  });
};

// Toggle wallet block status
export const toggleWalletBlock = async (
  clubId: string,
  walletId: string,
  block: boolean,
  adminName: string
): Promise<void> => {
  const walletRef = getClubDocRef(clubId, 'wallets', walletId);

  const batch = writeBatch(db);

  batch.update(walletRef, {
    isBlocked: block,
    lastUpdated: serverTimestamp(),
  });

  // Add activity
  const activityRef = doc(collection(walletRef, 'activities'));
  batch.set(activityRef, {
    service: block ? 'Cüzdan Bloke Edildi' : 'Cüzdan Blokesi Kaldırıldı',
    serviceKey: block ? 'walletBlocked' : 'walletUnblocked',
    serviceParams: { admin: adminName },
    amount: 0,
    type: 'system',
    timestamp: serverTimestamp(),
    status: 'completed',
  });

  await batch.commit();
};

// Delete wallet
export const deleteWallet = async (clubId: string, walletId: string): Promise<void> => {
  const walletRef = getClubDocRef(clubId, 'wallets', walletId);
  await deleteDoc(walletRef);
};

// Reset wallet (set balance and negative limit to 0)
export const resetWallet = async (
  clubId: string,
  walletId: string,
  adminName: string
): Promise<void> => {
  const walletRef = getClubDocRef(clubId, 'wallets', walletId);

  const batch = writeBatch(db);

  batch.update(walletRef, {
    balance: 0,
    negativeBalance: 0,
    lastUpdated: serverTimestamp(),
  });

  // Add activity
  const activityRef = doc(collection(walletRef, 'activities'));
  batch.set(activityRef, {
    service: 'Cüzdan Sıfırlandı',
    serviceKey: 'walletReset',
    serviceParams: { admin: adminName },
    amount: 0,
    type: 'system',
    timestamp: serverTimestamp(),
    status: 'completed',
  });

  await batch.commit();
};

// Check if user exists and has wallet
export const checkUserExists = async (
  clubId: string,
  username: string
): Promise<{ exists: boolean; userId?: string; walletId?: string; wallet?: any }> => {
  const usersRef = getClubCollectionRef(clubId, 'users');
  const q = query(usersRef, where('username', '==', username.toLowerCase()));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return { exists: false };
  }

  const userDoc = snapshot.docs[0];
  const userId = userDoc.id;

  // Check if wallet exists
  const walletRef = getClubDocRef(clubId, 'wallets', userId);
  const walletDoc = await getDoc(walletRef);

  if (!walletDoc.exists()) {
    return { exists: false };
  }

  return {
    exists: true,
    userId,
    walletId: userId,
    wallet: walletDoc.data(),
  };
};

// Admin transfer between wallets
export const adminTransfer = async (
  clubId: string,
  senderWalletId: string,
  receiverWalletId: string,
  senderUserId: string,
  receiverUserId: string,
  senderUsername: string,
  receiverUsername: string,
  amount: number,
  adminName: string
): Promise<void> => {
  const senderRef = getClubDocRef(clubId, 'wallets', senderWalletId);
  const receiverRef = getClubDocRef(clubId, 'wallets', receiverWalletId);

  await runTransaction(db, async (transaction) => {
    const senderDoc = await transaction.get(senderRef);
    const receiverDoc = await transaction.get(receiverRef);

    if (!senderDoc.exists() || !receiverDoc.exists()) {
      throw new Error('Cüzdan bulunamadı');
    }

    const senderData = senderDoc.data();
    const receiverData = receiverDoc.data();

    if (senderData.isBlocked || receiverData.isBlocked) {
      throw new Error('Bloke edilmiş cüzdan ile transfer yapılamaz');
    }

    const senderBalance = senderData.balance || 0;
    const senderNegativeLimit = senderData.negativeBalance || 0;
    const availableBalance = senderBalance + senderNegativeLimit;

    if (amount > availableBalance) {
      throw new Error('Yetersiz bakiye');
    }

    // Update sender
    transaction.update(senderRef, {
      balance: senderBalance - amount,
      lastUpdated: serverTimestamp(),
    });

    // Update receiver
    transaction.update(receiverRef, {
      balance: (receiverData.balance || 0) + amount,
      lastUpdated: serverTimestamp(),
    });

    // Add sender activity
    const senderActivityRef = doc(collection(senderRef, 'activities'));
    transaction.set(senderActivityRef, {
      service: 'Transfer Gönderildi',
      serviceKey: 'transferSent',
      serviceParams: { to: receiverUsername, amount: amount.toFixed(2), admin: adminName },
      amount: -amount,
      type: 'debit',
      timestamp: serverTimestamp(),
      status: 'completed',
    });

    // Add receiver activity
    const receiverActivityRef = doc(collection(receiverRef, 'activities'));
    transaction.set(receiverActivityRef, {
      service: 'Transfer Alındı',
      serviceKey: 'transferReceived',
      serviceParams: { from: senderUsername, amount: amount.toFixed(2), admin: adminName },
      amount: amount,
      type: 'credit',
      timestamp: serverTimestamp(),
      status: 'completed',
    });

    // Create transfer record
    const transfersRef = getClubCollectionRef(clubId, 'transfers');
    const transferDoc = doc(transfersRef);
    transaction.set(transferDoc, {
      fromUserId: senderWalletId,
      toUserId: receiverWalletId,
      fromUsername: senderUsername,
      toUsername: receiverUsername,
      amount,
      date: serverTimestamp(),
      status: 'completed',
      initiatedBy: 'admin',
    });
  });
};

// Fetch transaction history for a wallet
export const fetchTransactionHistory = async (
  clubId: string,
  userId: string,
  usersMap?: Map<string, WalletUser>,
  courtsMap?: Map<string, Court>
): Promise<Transaction[]> => {
  // If maps not provided, fetch them
  const finalUsersMap = usersMap || await fetchUsersMap(clubId);
  const finalCourtsMap = courtsMap || await fetchCourtsMap(clubId);
  const walletId = userId;
  const transactions: Transaction[] = [];

  // Fetch activities
  const walletRef = getClubDocRef(clubId, 'wallets', walletId);
  const activitiesRef = collection(walletRef, 'activities');
  const activitiesQuery = query(activitiesRef, orderBy('timestamp', 'desc'), limit(100));
  const activitiesSnapshot = await getDocs(activitiesQuery);

  activitiesSnapshot.docs.forEach((doc) => {
    const data = doc.data() as Activity;
    transactions.push({
      id: doc.id,
      type: 'activity',
      date: data.timestamp || data.date,
      amount: data.amount || 0,
      description: data.service || 'İşlem',
      details: data.description,
      status: data.status,
      rawData: { ...data, id: doc.id },
      isUndoable: ['balanceAdded', 'negativeLimitSet', 'walletBlocked', 'walletUnblocked'].includes(
        data.serviceKey || ''
      ),
      discountApplied: data.discountApplied,
      discountPercentage: data.discountPercentage,
      originalPrice: data.originalPrice,
      discountAmount: data.discountAmount,
      couponApplied: data.couponApplied,
      couponCode: data.couponCode,
      couponType: data.couponType,
      couponValue: data.couponValue,
      couponDiscountAmount: data.couponDiscountAmount,
      priceBeforeCoupon: data.priceBeforeCoupon,
    });
  });

  // Fetch reservations
  const reservationsRef = getClubCollectionRef(clubId, 'reservations');
  const reservationsQuery = query(
    reservationsRef,
    where('userId', '==', walletId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  const reservationsSnapshot = await getDocs(reservationsQuery);

  reservationsSnapshot.docs.forEach((doc) => {
    const data = doc.data() as Reservation;
    const court = finalCourtsMap.get(data.courtId);

    transactions.push({
      id: doc.id,
      type: 'reservation',
      date: data.createdAt || Timestamp.now(),
      amount: -(data.amountPaid || 0),
      description: `Kort Rezervasyonu${court ? ` - ${court.name}` : ''}`,
      details: `${data.date} ${data.time}`,
      status: data.status,
      rawData: { ...data, id: doc.id },
      isUndoable: data.status === 'iptal',
      isGift: data.isGift,
      giftedByUserId: data.giftedByUserId,
      giftedByUsername: data.giftedByUsername,
      giftMessage: data.giftMessage,
    });
  });

  // Fetch transfers (sent)
  const transfersRef = getClubCollectionRef(clubId, 'transfers');
  const sentQuery = query(
    transfersRef,
    where('fromUserId', '==', walletId),
    orderBy('date', 'desc'),
    limit(50)
  );
  const sentSnapshot = await getDocs(sentQuery);

  sentSnapshot.docs.forEach((doc) => {
    const data = doc.data() as Transfer;
    const receiver = finalUsersMap.get(data.toUserId);

    transactions.push({
      id: doc.id,
      type: 'transfer',
      date: data.date,
      amount: -data.amount,
      description: `Transfer Gönderildi`,
      details: `${receiver?.username || data.toUsername || 'Bilinmiyor'} kullanıcısına`,
      status: data.status,
      rawData: { ...data, id: doc.id },
      isUndoable: true,
    });
  });

  // Fetch transfers (received)
  const receivedQuery = query(
    transfersRef,
    where('toUserId', '==', walletId),
    orderBy('date', 'desc'),
    limit(50)
  );
  const receivedSnapshot = await getDocs(receivedQuery);

  receivedSnapshot.docs.forEach((doc) => {
    const data = doc.data() as Transfer;
    const sender = finalUsersMap.get(data.fromUserId);

    transactions.push({
      id: doc.id,
      type: 'transfer',
      date: data.date,
      amount: data.amount,
      description: `Transfer Alındı`,
      details: `${sender?.username || data.fromUsername || 'Bilinmiyor'} kullanıcısından`,
      status: data.status,
      rawData: { ...data, id: doc.id },
      isUndoable: false,
    });
  });

  // Sort all transactions by date
  transactions.sort((a, b) => {
    const dateA = a.date?.toDate?.() || new Date(0);
    const dateB = b.date?.toDate?.() || new Date(0);
    return dateB.getTime() - dateA.getTime();
  });

  return transactions;
};

// Undo transaction
export const undoTransaction = async (
  clubId: string,
  walletId: string,
  userId: string,
  transaction: Transaction,
  adminName: string = 'Admin'
): Promise<void> => {
  const walletRef = getClubDocRef(clubId, 'wallets', walletId);

  await runTransaction(db, async (t) => {
    const walletDoc = await t.get(walletRef);
    if (!walletDoc.exists()) {
      throw new Error('Cüzdan bulunamadı');
    }

    const walletData = walletDoc.data();
    const rawData = transaction.rawData as Activity;

    switch (rawData.serviceKey) {
      case 'balanceAdded': {
        const amount = rawData.amount || 0;
        t.update(walletRef, {
          balance: (walletData.balance || 0) - amount,
          lastUpdated: serverTimestamp(),
        });
        break;
      }
      case 'negativeLimitSet': {
        t.update(walletRef, {
          negativeBalance: 0,
          lastUpdated: serverTimestamp(),
        });
        break;
      }
      case 'walletBlocked': {
        t.update(walletRef, {
          isBlocked: false,
          lastUpdated: serverTimestamp(),
        });
        break;
      }
      case 'walletUnblocked': {
        t.update(walletRef, {
          isBlocked: true,
          lastUpdated: serverTimestamp(),
        });
        break;
      }
    }

    // Add undo activity
    const activityRef = doc(collection(walletRef, 'activities'));
    t.set(activityRef, {
      service: 'İşlem Geri Alındı',
      serviceKey: 'transactionUndone',
      serviceParams: { originalService: rawData.service, admin: adminName },
      amount: 0,
      type: 'system',
      timestamp: serverTimestamp(),
      status: 'completed',
    });
  });
};

// Update global wallet settings
export const updateGlobalSettings = async (
  clubId: string,
  setting: 'transfer' | 'addBalance' | 'pay',
  disabled: boolean
): Promise<void> => {
  const rolesRef = getClubCollectionRef(clubId, 'roles');
  const snapshot = await getDocs(rolesRef);

  const batch = writeBatch(db);

  const permissionMap: Record<string, string> = {
    transfer: 'transferAccess',
    addBalance: 'addBalanceAccess',
    pay: 'payAccess',
  };

  const permissionKey = permissionMap[setting];

  snapshot.docs.forEach((doc) => {
    batch.update(doc.ref, {
      [permissionKey]: !disabled,
    });
  });

  await batch.commit();
};

// Fetch global settings from roles
export const fetchGlobalSettings = async (
  clubId: string
): Promise<{ transferDisabled: boolean; addBalanceDisabled: boolean; payDisabled: boolean }> => {
  const rolesRef = getClubCollectionRef(clubId, 'roles');
  const snapshot = await getDocs(rolesRef);

  let transferDisabled = false;
  let addBalanceDisabled = false;
  let payDisabled = false;

  // Check first role for settings (all roles should have same settings)
  if (!snapshot.empty) {
    const firstRole = snapshot.docs[0].data();
    transferDisabled = firstRole.transferAccess === false;
    addBalanceDisabled = firstRole.addBalanceAccess === false;
    payDisabled = firstRole.payAccess === false;
  }

  return { transferDisabled, addBalanceDisabled, payDisabled };
};
