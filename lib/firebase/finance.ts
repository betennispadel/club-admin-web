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
  onSnapshot,
} from 'firebase/firestore';
import { db } from './config';
import type {
  ManualIncome,
  ManualExpense,
  CoachPayment,
  SalaryPayment,
  MealCardPayment,
  TeamExpense,
  TournamentIncome,
  TournamentExpense,
  TournamentParticipantPayment,
  Employee,
  DateRange,
  FinancialSummary,
  CategoryBreakdown,
} from '@/lib/types/finance';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '@/lib/types/finance';

// ============== REAL-TIME SUBSCRIPTIONS ==============

export interface FinanceDataState {
  users: any[];
  reservations: any[];
  privateLessons: any[];
  storeOrders: any[];
  restaurantOrders: any[];
  manualIncomes: ManualIncome[];
  coachPayments: CoachPayment[];
  manualExpenses: ManualExpense[];
  salaryPayments: SalaryPayment[];
  mealCardPayments: MealCardPayment[];
  teamExpenses: TeamExpense[];
  tournamentIncomes: TournamentIncome[];
  tournamentExpenses: TournamentExpense[];
  tournamentParticipantPayments: TournamentParticipantPayment[];
  wallets: any[];
}

export function subscribeToFinanceData(
  clubId: string,
  onDataChange: (data: FinanceDataState) => void,
  onError: (error: Error) => void
): () => void {
  const state: FinanceDataState = {
    users: [],
    reservations: [],
    privateLessons: [],
    storeOrders: [],
    restaurantOrders: [],
    manualIncomes: [],
    coachPayments: [],
    manualExpenses: [],
    salaryPayments: [],
    mealCardPayments: [],
    teamExpenses: [],
    tournamentIncomes: [],
    tournamentExpenses: [],
    tournamentParticipantPayments: [],
    wallets: [],
  };

  const unsubscribers: (() => void)[] = [];

  const emitChange = () => {
    onDataChange({ ...state });
  };

  try {
    // Users
    const usersRef = collection(db, clubId, 'users', 'users');
    unsubscribers.push(
      onSnapshot(usersRef, (snapshot) => {
        state.users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        emitChange();
      }, onError)
    );

    // Reservations
    const reservationsRef = collection(db, clubId, 'reservations', 'reservations');
    unsubscribers.push(
      onSnapshot(reservationsRef, (snapshot) => {
        state.reservations = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        emitChange();
      }, onError)
    );

    // Private Lessons
    const lessonsRef = collection(db, clubId, 'privateLessons', 'privateLessons');
    unsubscribers.push(
      onSnapshot(lessonsRef, (snapshot) => {
        state.privateLessons = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        emitChange();
      }, onError)
    );

    // Store Orders
    const storeRef = collection(db, clubId, 'storeOrders', 'storeOrders');
    unsubscribers.push(
      onSnapshot(storeRef, (snapshot) => {
        state.storeOrders = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        emitChange();
      }, onError)
    );

    // Restaurant Orders
    const restaurantRef = collection(db, clubId, 'restaurantOrders', 'restaurantOrders');
    unsubscribers.push(
      onSnapshot(restaurantRef, (snapshot) => {
        state.restaurantOrders = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        emitChange();
      }, onError)
    );

    // Manual Incomes
    const incomesRef = collection(db, clubId, 'manualIncomes', 'manualIncomes');
    unsubscribers.push(
      onSnapshot(incomesRef, (snapshot) => {
        state.manualIncomes = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ManualIncome[];
        emitChange();
      }, onError)
    );

    // Coach Payments
    const coachRef = collection(db, clubId, 'coachPayments', 'coachPayments');
    unsubscribers.push(
      onSnapshot(coachRef, (snapshot) => {
        state.coachPayments = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as CoachPayment[];
        emitChange();
      }, onError)
    );

    // Manual Expenses
    const expensesRef = collection(db, clubId, 'manualExpenses', 'manualExpenses');
    unsubscribers.push(
      onSnapshot(expensesRef, (snapshot) => {
        state.manualExpenses = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ManualExpense[];
        emitChange();
      }, onError)
    );

    // Salary Payments
    const salaryRef = collection(db, clubId, 'salaryPayments', 'salaryPayments');
    unsubscribers.push(
      onSnapshot(salaryRef, (snapshot) => {
        state.salaryPayments = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as SalaryPayment[];
        emitChange();
      }, onError)
    );

    // Meal Card Payments
    const mealCardRef = collection(db, clubId, 'mealCardPayments', 'mealCardPayments');
    unsubscribers.push(
      onSnapshot(mealCardRef, (snapshot) => {
        state.mealCardPayments = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as MealCardPayment[];
        emitChange();
      }, onError)
    );

    // Team Expenses (expenses collection)
    const teamExpensesRef = collection(db, clubId, 'expenses', 'expenses');
    unsubscribers.push(
      onSnapshot(teamExpensesRef, (snapshot) => {
        state.teamExpenses = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as TeamExpense[];
        emitChange();
      }, onError)
    );

    // Wallets
    const walletsRef = collection(db, clubId, 'wallets', 'wallets');
    unsubscribers.push(
      onSnapshot(walletsRef, (snapshot) => {
        state.wallets = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        emitChange();
      }, onError)
    );

    // Tournaments with sub-collections
    const tournamentsRef = collection(db, clubId, 'tournaments', 'tournaments');
    unsubscribers.push(
      onSnapshot(tournamentsRef, async (snapshot) => {
        const allIncomes: TournamentIncome[] = [];
        const allExpenses: TournamentExpense[] = [];
        const allParticipantPayments: TournamentParticipantPayment[] = [];

        for (const tournamentDoc of snapshot.docs) {
          const tournamentId = tournamentDoc.id;
          const tournamentData = tournamentDoc.data();

          try {
            // Get tournament incomes
            const incomesRef = collection(
              db,
              clubId,
              'tournaments',
              'tournaments',
              tournamentId,
              'incomes'
            );
            const incomesSnapshot = await getDocs(incomesRef);
            incomesSnapshot.docs.forEach((doc) => {
              allIncomes.push({
                id: doc.id,
                tournamentId,
                tournamentName: tournamentData.name || '',
                ...doc.data(),
              } as TournamentIncome);
            });

            // Get tournament expenses
            const expensesRef = collection(
              db,
              clubId,
              'tournaments',
              'tournaments',
              tournamentId,
              'expenses'
            );
            const expensesSnapshot = await getDocs(expensesRef);
            expensesSnapshot.docs.forEach((doc) => {
              allExpenses.push({
                id: doc.id,
                tournamentId,
                tournamentName: tournamentData.name || '',
                ...doc.data(),
              } as TournamentExpense);
            });

            // Get participant finances
            const financesRef = collection(
              db,
              clubId,
              'tournaments',
              'tournaments',
              tournamentId,
              'participantFinances'
            );
            const financesSnapshot = await getDocs(financesRef);
            financesSnapshot.docs.forEach((doc) => {
              const data = doc.data();
              if (data.totalPaid > 0) {
                allParticipantPayments.push({
                  id: doc.id,
                  tournamentId,
                  tournamentName: tournamentData.name || '',
                  ...data,
                } as TournamentParticipantPayment);
              }
            });
          } catch (error) {
            console.error(`Error fetching tournament ${tournamentId} finances:`, error);
          }
        }

        state.tournamentIncomes = allIncomes;
        state.tournamentExpenses = allExpenses;
        state.tournamentParticipantPayments = allParticipantPayments;
        emitChange();
      }, onError)
    );
  } catch (error) {
    onError(error as Error);
  }

  // Return unsubscribe function
  return () => {
    unsubscribers.forEach((unsubscribe) => unsubscribe());
  };
}

// ============== MANUAL INCOMES ==============

export async function createManualIncome(
  clubId: string,
  data: Omit<ManualIncome, 'id' | 'createdAt'>
): Promise<string> {
  const ref = collection(db, clubId, 'manualIncomes', 'manualIncomes');
  const newDoc = doc(ref);
  await setDoc(newDoc, {
    ...data,
    createdAt: Timestamp.now(),
  });
  return newDoc.id;
}

export async function updateManualIncome(
  clubId: string,
  incomeId: string,
  data: Partial<ManualIncome>
): Promise<void> {
  const ref = doc(db, clubId, 'manualIncomes', 'manualIncomes', incomeId);
  await updateDoc(ref, data);
}

export async function deleteManualIncome(clubId: string, incomeId: string): Promise<void> {
  const ref = doc(db, clubId, 'manualIncomes', 'manualIncomes', incomeId);
  await deleteDoc(ref);
}

// ============== MANUAL EXPENSES ==============

export async function createManualExpense(
  clubId: string,
  data: Omit<ManualExpense, 'id' | 'createdAt'>
): Promise<string> {
  const ref = collection(db, clubId, 'manualExpenses', 'manualExpenses');
  const newDoc = doc(ref);
  await setDoc(newDoc, {
    ...data,
    createdAt: Timestamp.now(),
  });
  return newDoc.id;
}

export async function updateManualExpense(
  clubId: string,
  expenseId: string,
  data: Partial<ManualExpense>
): Promise<void> {
  const ref = doc(db, clubId, 'manualExpenses', 'manualExpenses', expenseId);
  await updateDoc(ref, data);
}

export async function deleteManualExpense(clubId: string, expenseId: string): Promise<void> {
  const ref = doc(db, clubId, 'manualExpenses', 'manualExpenses', expenseId);
  await deleteDoc(ref);
}

// ============== EMPLOYEES ==============

export async function fetchEmployees(clubId: string): Promise<Employee[]> {
  try {
    const ref = collection(db, clubId, 'employees', 'employees');
    const q = query(ref, orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Employee[];
  } catch (error) {
    console.error('Error fetching employees:', error);
    return [];
  }
}

export async function createEmployee(
  clubId: string,
  data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const ref = collection(db, clubId, 'employees', 'employees');
  const newDoc = doc(ref);
  await setDoc(newDoc, {
    ...data,
    status: 'active',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return newDoc.id;
}

export async function updateEmployee(
  clubId: string,
  employeeId: string,
  data: Partial<Employee>
): Promise<void> {
  const ref = doc(db, clubId, 'employees', 'employees', employeeId);
  await updateDoc(ref, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteEmployee(clubId: string, employeeId: string): Promise<void> {
  const ref = doc(db, clubId, 'employees', 'employees', employeeId);
  await deleteDoc(ref);
}

// ============== SALARY PAYMENTS ==============

export async function createSalaryPayment(
  clubId: string,
  data: Omit<SalaryPayment, 'id' | 'createdAt'>
): Promise<string> {
  const ref = collection(db, clubId, 'salaryPayments', 'salaryPayments');
  const newDoc = doc(ref);
  await setDoc(newDoc, {
    ...data,
    createdAt: Timestamp.now(),
  });
  return newDoc.id;
}

export async function updateSalaryPayment(
  clubId: string,
  paymentId: string,
  data: Partial<SalaryPayment>
): Promise<void> {
  const ref = doc(db, clubId, 'salaryPayments', 'salaryPayments', paymentId);
  await updateDoc(ref, data);
}

// ============== DATE UTILITIES ==============

export function parseDate(dateValue: any): Date | null {
  if (!dateValue) return null;

  // Handle Firestore Timestamp
  if (dateValue instanceof Timestamp || dateValue?.toDate) {
    return dateValue.toDate();
  }

  // Handle string dates
  if (typeof dateValue === 'string') {
    // Format: DD.MM.YYYY
    if (dateValue.includes('.')) {
      const parts = dateValue.split('.');
      if (parts.length === 3) {
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      }
    }
    // Format: YYYY-MM-DD or ISO
    return new Date(dateValue);
  }

  // Handle Date object
  if (dateValue instanceof Date) {
    return dateValue;
  }

  return null;
}

export function isInDateRange(
  item: any,
  dateRange: DateRange,
  dateFields: string[] = ['createdAt', 'date', 'orderDate', 'paymentDate']
): boolean {
  for (const field of dateFields) {
    if (item[field]) {
      const date = parseDate(item[field]);
      if (date && date >= dateRange.start && date <= dateRange.end) {
        return true;
      }
    }
  }
  return false;
}

export function getDateRange(
  filter: string,
  customStart?: Date,
  customEnd?: Date
): DateRange {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  let start = new Date();

  switch (filter) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      break;
    case 'week':
      start = new Date(now);
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      break;
    case 'month':
      start = new Date(now);
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      break;
    case 'year':
      start = new Date(now);
      start.setFullYear(start.getFullYear() - 1);
      start.setHours(0, 0, 0, 0);
      break;
    case 'custom':
      if (customStart && customEnd) {
        return {
          start: new Date(customStart.setHours(0, 0, 0, 0)),
          end: new Date(customEnd.setHours(23, 59, 59, 999)),
        };
      }
      break;
    case 'all':
    default:
      start = new Date(2020, 0, 1);
      break;
  }

  return { start, end };
}

// ============== FINANCIAL CALCULATIONS ==============

export function calculateFinancialSummary(
  data: FinanceDataState,
  dateRange: DateRange
): FinancialSummary {
  // Wallet totals (not filtered by date)
  const walletPoolTotal = data.wallets.reduce((sum, w) => sum + (w.balance || 0), 0);
  const negativeBalanceTotal = data.wallets.reduce(
    (sum, w) => sum + Math.abs(w.negativeBalance || 0),
    0
  );

  // Filter data by date range
  const filteredUsers = data.users.filter((u) =>
    isInDateRange(u, dateRange, ['createdAt', 'membershipStartDate'])
  );
  const filteredReservations = data.reservations.filter((r) =>
    isInDateRange(r, dateRange, ['date', 'createdAt'])
  );
  const filteredLessons = data.privateLessons.filter((l) =>
    isInDateRange(l, dateRange, ['createdAt', 'startDate'])
  );
  const filteredStoreOrders = data.storeOrders.filter((o) =>
    isInDateRange(o, dateRange, ['orderDate', 'createdAt'])
  );
  const filteredRestaurantOrders = data.restaurantOrders.filter((o) =>
    isInDateRange(o, dateRange, ['orderDate', 'createdAt'])
  );
  const filteredManualIncomes = data.manualIncomes.filter((i) =>
    isInDateRange(i, dateRange, ['date', 'createdAt'])
  );
  const filteredCoachPayments = data.coachPayments.filter((p) =>
    isInDateRange(p, dateRange, ['date', 'createdAt'])
  );
  const filteredManualExpenses = data.manualExpenses.filter((e) =>
    isInDateRange(e, dateRange, ['date', 'createdAt'])
  );
  const filteredSalaryPayments = data.salaryPayments.filter((p) =>
    isInDateRange(p, dateRange, ['paymentDate', 'periodStart', 'createdAt'])
  );
  const filteredMealCardPayments = data.mealCardPayments.filter((p) =>
    isInDateRange(p, dateRange, ['date', 'createdAt'])
  );
  const filteredTeamExpenses = data.teamExpenses.filter((e) =>
    isInDateRange(e, dateRange, ['date', 'createdAt'])
  );
  const filteredTournamentIncomes = data.tournamentIncomes.filter((i) =>
    isInDateRange(i, dateRange, ['date', 'createdAt'])
  );
  const filteredTournamentExpenses = data.tournamentExpenses.filter((e) =>
    isInDateRange(e, dateRange, ['date', 'createdAt'])
  );
  const filteredTournamentPayments = data.tournamentParticipantPayments.filter((p) =>
    isInDateRange(p, dateRange, ['paymentDate', 'createdAt'])
  );

  // Calculate incomes
  const membershipIncome = filteredUsers.reduce((sum, u) => sum + (u.totalPaid || 0), 0);

  // Reservation income breakdown
  const activeReservations = filteredReservations.filter(
    (r) => r.status === 'active' || r.status === 'completed'
  );
  const lightIncome = activeReservations
    .filter((r) => r.light)
    .reduce((sum, r) => sum + (r.lightCost || 0), 0);
  const heaterIncome = activeReservations
    .filter((r) => r.heater)
    .reduce((sum, r) => sum + (r.heaterCost || 0), 0);
  const totalReservationPaid = activeReservations.reduce(
    (sum, r) => sum + (r.amountPaid || 0),
    0
  );
  const baseReservationIncome = totalReservationPaid - lightIncome - heaterIncome;

  // Discount applied
  const discountApplied = activeReservations.reduce((sum, r) => {
    let discount = 0;
    if (r.couponDiscountAmount) {
      discount += r.couponDiscountAmount;
    }
    if (r.discountApplied && r.originalPrice) {
      const basePrice = r.priceBeforeCoupon ?? r.totalCost ?? 0;
      const courtDiscount = r.originalPrice - basePrice;
      if (courtDiscount > 0) discount += courtDiscount;
    }
    return sum + discount;
  }, 0);

  const lessonIncome = filteredLessons.reduce(
    (sum, l) => sum + (l.price || 0) * (l.students?.length || 0),
    0
  );
  const storeIncome = filteredStoreOrders
    .filter((o) => o.status === 'completed' || o.status === 'delivered')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const restaurantIncome = filteredRestaurantOrders
    .filter((o) => o.status === 'completed' || o.status === 'delivered')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const manualIncome = filteredManualIncomes.reduce((sum, i) => sum + (i.amount || 0), 0);

  // Tournament incomes
  const tournamentRegistrationIncome = filteredTournamentPayments.reduce(
    (sum, p) => sum + (p.totalPaid || 0),
    0
  );
  const tournamentOtherIncome = filteredTournamentIncomes.reduce(
    (sum, i) => sum + (i.amount || 0),
    0
  );
  const totalTournamentIncome = tournamentRegistrationIncome + tournamentOtherIncome;

  const totalIncome =
    membershipIncome +
    baseReservationIncome +
    lightIncome +
    heaterIncome +
    lessonIncome +
    storeIncome +
    restaurantIncome +
    manualIncome +
    totalTournamentIncome;

  // Calculate expenses
  const coachExpense = filteredCoachPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const manualExpense = filteredManualExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const salaryExpense = filteredSalaryPayments
    .filter((p) => p.paymentStatus === 'Ödendi')
    .reduce((sum, p) => sum + (p.netSalary || 0), 0);
  const mealCardExpense = filteredMealCardPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  // Team expenses by category
  const equipmentExpense = filteredTeamExpenses
    .filter((e) => e.category === 'Antrenman Ekipmanları')
    .reduce((sum, e) => sum + (e.amount || 0), 0);
  const venueExpense = filteredTeamExpenses
    .filter((e) => e.category === 'Saha/Salon Kirası')
    .reduce((sum, e) => sum + (e.amount || 0), 0);
  const transportExpense = filteredTeamExpenses
    .filter((e) => e.category === 'Ulaşım')
    .reduce((sum, e) => sum + (e.amount || 0), 0);
  const uniformExpense = filteredTeamExpenses
    .filter((e) => e.category === 'Forma')
    .reduce((sum, e) => sum + (e.amount || 0), 0);
  const tournamentCategoryExpense = filteredTeamExpenses
    .filter((e) => e.category === 'Turnuva Katılımı')
    .reduce((sum, e) => sum + (e.amount || 0), 0);
  const otherTeamExpense = filteredTeamExpenses
    .filter((e) => e.category === 'Diğer' || !e.category)
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  // Tournament expenses
  const tournamentCourtRental = filteredTournamentExpenses
    .filter((e) => e.category === 'court_rental')
    .reduce((sum, e) => sum + (e.amount || 0), 0);
  const tournamentReferee = filteredTournamentExpenses
    .filter((e) => e.category === 'referee_fee')
    .reduce((sum, e) => sum + (e.amount || 0), 0);
  const tournamentPrize = filteredTournamentExpenses
    .filter((e) => e.category === 'prize_money')
    .reduce((sum, e) => sum + (e.amount || 0), 0);
  const tournamentCatering = filteredTournamentExpenses
    .filter((e) => e.category === 'catering')
    .reduce((sum, e) => sum + (e.amount || 0), 0);
  const tournamentOther = filteredTournamentExpenses
    .filter((e) => !['court_rental', 'referee_fee', 'prize_money', 'catering'].includes(e.category))
    .reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalTournamentExpense =
    tournamentCourtRental + tournamentReferee + tournamentPrize + tournamentCatering + tournamentOther;

  const totalExpense =
    coachExpense +
    manualExpense +
    salaryExpense +
    mealCardExpense +
    equipmentExpense +
    venueExpense +
    transportExpense +
    uniformExpense +
    tournamentCategoryExpense +
    otherTeamExpense +
    totalTournamentExpense;

  const netProfit = totalIncome - totalExpense;

  // Income breakdown
  const incomeItems: CategoryBreakdown[] = [
    { key: 'membership', label: 'Üyelik', value: membershipIncome, percentage: 0, color: '#22C55E' },
    { key: 'reservation', label: 'Kort Rezervasyon', value: baseReservationIncome, percentage: 0, color: '#3B82F6' },
    { key: 'lighting', label: 'Aydınlatma Geliri', value: lightIncome, percentage: 0, color: '#EAB308' },
    { key: 'heating', label: 'Isıtma Geliri', value: heaterIncome, percentage: 0, color: '#F97316' },
    { key: 'privateLesson', label: 'Özel Ders', value: lessonIncome, percentage: 0, color: '#8B5CF6' },
    { key: 'store', label: 'Mağaza', value: storeIncome, percentage: 0, color: '#EC4899' },
    { key: 'restaurant', label: 'Restoran', value: restaurantIncome, percentage: 0, color: '#14B8A6' },
    { key: 'tournamentRegistration', label: 'Turnuva Kayıt', value: tournamentRegistrationIncome, percentage: 0, color: '#6366F1' },
    { key: 'tournamentOther', label: 'Turnuva Diğer Gelir', value: tournamentOtherIncome, percentage: 0, color: '#4F46E5' },
    { key: 'manual', label: 'Diğer Gelirler', value: manualIncome, percentage: 0, color: '#64748B' },
  ].map((item) => ({
    ...item,
    percentage: totalIncome > 0 ? (item.value / totalIncome) * 100 : 0,
  }));

  // Expense breakdown
  const expenseItems: CategoryBreakdown[] = [
    { key: 'salary', label: 'Personel Maaşları', value: salaryExpense, percentage: 0, color: '#EF4444' },
    { key: 'coach', label: 'Antrenör Ödemeleri', value: coachExpense, percentage: 0, color: '#F97316' },
    { key: 'mealCard', label: 'Yemek Kartı', value: mealCardExpense, percentage: 0, color: '#EAB308' },
    { key: 'equipment', label: 'Antrenman Ekipmanları', value: equipmentExpense, percentage: 0, color: '#84CC16' },
    { key: 'venue', label: 'Saha/Salon Kirası', value: venueExpense, percentage: 0, color: '#22C55E' },
    { key: 'transport', label: 'Ulaşım', value: transportExpense, percentage: 0, color: '#14B8A6' },
    { key: 'uniform', label: 'Forma', value: uniformExpense, percentage: 0, color: '#06B6D4' },
    { key: 'tournamentCategory', label: 'Turnuva Katılımı', value: tournamentCategoryExpense, percentage: 0, color: '#3B82F6' },
    { key: 'teamOther', label: 'Diğer Takım Giderleri', value: otherTeamExpense, percentage: 0, color: '#6366F1' },
    { key: 'tournamentCourtRental', label: 'Turnuva Kort Kiralama', value: tournamentCourtRental, percentage: 0, color: '#8B5CF6' },
    { key: 'tournamentReferee', label: 'Turnuva Hakem Ücreti', value: tournamentReferee, percentage: 0, color: '#EC4899' },
    { key: 'tournamentPrize', label: 'Turnuva Ödül Parası', value: tournamentPrize, percentage: 0, color: '#F472B6' },
    { key: 'tournamentCatering', label: 'Turnuva İkram', value: tournamentCatering, percentage: 0, color: '#FB7185' },
    { key: 'tournamentOtherExpense', label: 'Turnuva Diğer Gider', value: tournamentOther, percentage: 0, color: '#FDA4AF' },
    { key: 'manual', label: 'Diğer Giderler', value: manualExpense, percentage: 0, color: '#64748B' },
  ].map((item) => ({
    ...item,
    percentage: totalExpense > 0 ? (item.value / totalExpense) * 100 : 0,
  }));

  return {
    totalIncome,
    totalExpense,
    netProfit,
    walletPoolTotal,
    negativeBalanceTotal,
    discountApplied,
    incomeBreakdown: incomeItems.filter((i) => i.value > 0),
    expenseBreakdown: expenseItems.filter((i) => i.value > 0),
  };
}
