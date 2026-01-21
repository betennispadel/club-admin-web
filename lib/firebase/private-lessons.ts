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
  startAfter,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch,
  QueryDocumentSnapshot,
  DocumentData,
  documentId,
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { db, secondaryAuth } from './config';
import type {
  Lesson,
  LessonStudent,
  Coach,
  ManualCoach,
  StudentOption,
  Request,
  TemplateRequest,
  AttendanceRecord,
  LessonFormState,
  LessonType,
  LessonStatus,
  LessonLevel,
  AttendanceStatus,
  RequestFinancialData,
  ScheduleEntry,
  Installment,
  LessonMembership,
  LESSONS_PER_LOAD,
  REQUESTS_PER_LOAD,
} from '../types/private-lessons';

// Helper to get club-specific collection reference
export const getClubCollectionRef = (clubId: string, collectionName: string) => {
  return collection(db, clubId, collectionName, collectionName);
};

// Helper to get club-specific document reference
export const getClubDocRef = (clubId: string, collectionName: string, docId: string) => {
  return doc(db, clubId, collectionName, collectionName, docId);
};

// Parse Functions
export const parseLessonDoc = (docSnap: QueryDocumentSnapshot<DocumentData>): Lesson => {
  const data = docSnap.data();
  if (!data) {
    return {
      id: docSnap.id,
      groupName: 'İsimsiz Ders',
      coachId: '',
      coachName: 'Bilinmiyor',
      lessonType: '',
      startTime: '00:00',
      duration: 60,
      students: [],
      status: 'Planlandı',
      addedDate: Timestamp.now(),
      notes: '',
      level: 'Belirtilmedi',
      location: '',
      coachNotes: '',
      packageSize: 8,
      trainingSchedule: [],
      conditioningSchedule: [],
    };
  }

  const parsedStudents = Array.isArray(data.students) ? data.students
    .filter((s: any) => s !== null && s !== undefined)
    .map((s: any) => ({
      studentId: typeof s?.studentId === 'string' ? s.studentId : '',
      studentName: typeof s?.studentName === 'string' ? s.studentName : 'Bilinmiyor',
      isManual: typeof s?.isManual === 'boolean' ? s.isManual : false,
      attendedCount: typeof s?.attendedCount === 'number' ? s.attendedCount : 0,
      renewalRequested: typeof s?.renewalRequested === 'boolean' ? s.renewalRequested : false,
      packageHistory: Array.isArray(s?.packageHistory) ? s.packageHistory : [],
      currentPackageNumber: typeof s?.currentPackageNumber === 'number' ? s.currentPackageNumber : 1
    })) : [];

  return {
    id: docSnap.id,
    groupName: typeof data.groupName === 'string' ? data.groupName : 'İsimsiz Ders',
    coachId: typeof data.coachId === 'string' ? data.coachId : '',
    coachName: typeof data.coachName === 'string' ? data.coachName : 'Bilinmiyor',
    lessonType: data.lessonType as LessonType || '',
    selectedDays: Array.isArray(data.selectedDays) ? data.selectedDays.map(String) : undefined,
    startTime: typeof data.startTime === 'string' ? data.startTime : '00:00',
    duration: typeof data.duration === 'number' ? data.duration : 60,
    students: parsedStudents,
    status: data.status as LessonStatus || 'Planlandı',
    addedDate: data.addedDate instanceof Timestamp ? data.addedDate : Timestamp.now(),
    lessonDate: data.lessonDate instanceof Timestamp ? data.lessonDate : undefined,
    notes: typeof data.notes === 'string' ? data.notes : '',
    level: data.level as LessonLevel || 'Belirtilmedi',
    location: typeof data.location === 'string' ? data.location : '',
    coachNotes: typeof data.coachNotes === 'string' ? data.coachNotes : '',
    packageSize: typeof data.packageSize === 'number' ? data.packageSize : 8,
    trainingSchedule: Array.isArray(data.trainingSchedule) ? data.trainingSchedule : [],
    conditioningSchedule: Array.isArray(data.conditioningSchedule) ? data.conditioningSchedule : [],
    startDate: data.startDate instanceof Timestamp ? data.startDate.toDate() : undefined,
    endDate: data.endDate instanceof Timestamp ? data.endDate.toDate() : undefined,
    price: typeof data.price === 'number' ? data.price : undefined,
  };
};

export const parseRequestDoc = (docSnap: QueryDocumentSnapshot<DocumentData>): Request => {
  const data = docSnap.data() || {};
  return {
    id: docSnap.id,
    studentId: typeof data.studentId === 'string' ? data.studentId : '',
    studentName: typeof data.studentName === 'string' ? data.studentName : 'Bilinmiyor',
    studentPhone: typeof data.studentPhone === 'string' ? data.studentPhone : undefined,
    studentEmail: typeof data.studentEmail === 'string' ? data.studentEmail : undefined,
    requestDate: data.requestDate instanceof Timestamp ? data.requestDate : Timestamp.now(),
    status: data.status || 'Onay Bekliyor',
    requestedLessonType: data.requestedLessonType as LessonType || undefined,
    lessonType: data.lessonType as LessonType || undefined,
    notes: typeof data.notes === 'string' ? data.notes : '',
    studentDetails: data.studentDetails || {},
    canReapply: typeof data.canReapply === 'boolean' ? data.canReapply : false,
    reapplyGrantedDate: data.reapplyGrantedDate instanceof Timestamp ? data.reapplyGrantedDate : undefined,
    reapplyGrantedBy: typeof data.reapplyGrantedBy === 'string' ? data.reapplyGrantedBy : undefined,
    reapplyHistory: Array.isArray(data.reapplyHistory) ? data.reapplyHistory : [],
    trainingSchedule: Array.isArray(data.trainingSchedule) ? data.trainingSchedule : undefined,
    conditioningSchedule: Array.isArray(data.conditioningSchedule) ? data.conditioningSchedule : undefined,
    location: typeof data.location === 'string' ? data.location : undefined,
    packageRenewalHistory: Array.isArray(data.packageRenewalHistory) ? data.packageRenewalHistory : [],
  };
};

export const parseTemplateRequestDoc = (docSnap: QueryDocumentSnapshot<DocumentData>): TemplateRequest => {
  const data = docSnap.data() || {};
  return {
    id: docSnap.id,
    templateName: typeof data.templateName === 'string' ? data.templateName : '',
    coachId: typeof data.coachId === 'string' ? data.coachId : '',
    coachName: typeof data.coachName === 'string' ? data.coachName : '',
    studentId: typeof data.studentId === 'string' ? data.studentId : '',
    studentName: typeof data.studentName === 'string' ? data.studentName : '',
    requestDate: data.requestDate instanceof Timestamp ? data.requestDate : Timestamp.now(),
    status: data.status || 'Onay Bekliyor',
    lessonType: data.lessonType as LessonType || '',
    duration: typeof data.duration === 'number' ? data.duration : 60,
    level: data.level as LessonLevel || 'Belirtilmedi',
    maxStudents: typeof data.maxStudents === 'number' ? data.maxStudents : 1,
    preferredTime: data.preferredTime,
    preferredDays: Array.isArray(data.preferredDays) ? data.preferredDays : undefined,
    packageSize: typeof data.packageSize === 'number' ? data.packageSize : undefined,
    notes: data.notes,
    studentDetails: data.studentDetails,
    studentType: data.studentType,
    studentPhone: data.studentPhone,
    studentEmail: data.studentEmail,
    studentLevel: data.studentLevel,
    studentTcId: data.studentTcId,
    studentIdCountry: data.studentIdCountry,
    studentGender: data.studentGender,
    studentBirthDate: data.studentBirthDate instanceof Timestamp ? data.studentBirthDate : undefined,
    studentProfession: data.studentProfession,
    studentAddress: data.studentAddress,
    studentNotes: data.studentNotes,
    finalTemplateName: data.finalTemplateName,
    trainingSchedule: Array.isArray(data.trainingSchedule) ? data.trainingSchedule : undefined,
    conditioningSchedule: Array.isArray(data.conditioningSchedule) ? data.conditioningSchedule : undefined,
    location: data.location,
    groupUsers: Array.isArray(data.groupUsers) ? data.groupUsers : undefined,
    approvedGroupUserEmails: Array.isArray(data.approvedGroupUserEmails) ? data.approvedGroupUserEmails : undefined,
    createdUserIds: Array.isArray(data.createdUserIds) ? data.createdUserIds : undefined,
    createdLessonId: data.createdLessonId,
  };
};

export const parseAttendanceRecordDoc = (docSnap: QueryDocumentSnapshot<DocumentData>): AttendanceRecord => {
  const data = docSnap.data() || {};
  return {
    id: docSnap.id,
    lessonId: data.lessonId || '',
    studentId: data.studentId || '',
    studentName: data.studentName || '',
    coachId: data.coachId || '',
    attendanceDate: data.attendanceDate instanceof Timestamp ? data.attendanceDate : Timestamp.now(),
    date: data.date instanceof Timestamp ? data.date : undefined,
    status: data.status as AttendanceStatus || 'Bekleniyor',
    addedDate: data.addedDate instanceof Timestamp ? data.addedDate : Timestamp.now(),
    rating: typeof data.rating === 'number' ? data.rating : undefined,
    scheduleType: data.scheduleType || 'training',
  };
};

// LESSON OPERATIONS
export const fetchLessons = async (
  clubId: string,
  limitCount: number = 20,
  lastDoc?: QueryDocumentSnapshot<DocumentData>
) => {
  const lessonsRef = getClubCollectionRef(clubId, 'privateLessons');
  let q = query(lessonsRef, orderBy('addedDate', 'desc'), limit(limitCount));

  if (lastDoc) {
    q = query(lessonsRef, orderBy('addedDate', 'desc'), startAfter(lastDoc), limit(limitCount));
  }

  const snapshot = await getDocs(q);
  const lessons = snapshot.docs.map(parseLessonDoc);
  const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;

  return { lessons, lastVisible, hasMore: snapshot.docs.length === limitCount };
};

export const createLesson = async (clubId: string, formData: LessonFormState, coaches: Coach[], students: StudentOption[]) => {
  const lessonsRef = getClubCollectionRef(clubId, 'privateLessons');
  const newDocRef = doc(lessonsRef);

  const selectedCoach = coaches.find(c => c.id === formData.selectedCoachId);
  const selectedStudents = students.filter(s =>
    formData.selectedStudentOptionIds.includes(`${s.type}_${s.id}`) ||
    formData.selectedStudentOptionIds.includes(s.id)
  );

  const lessonStudents: LessonStudent[] = selectedStudents.map(s => ({
    studentId: s.id,
    studentName: s.name,
    isManual: s.type === 'manual',
    attendedCount: 0,
    renewalRequested: false,
    packageHistory: [],
    currentPackageNumber: 1
  }));

  const lessonData = {
    groupName: formData.groupName.trim(),
    coachId: formData.selectedCoachId,
    coachName: selectedCoach?.name || 'Bilinmiyor',
    lessonType: formData.lessonType,
    students: lessonStudents,
    status: formData.status || 'Planlandı',
    level: formData.level || 'Belirtilmedi',
    packageSize: parseInt(formData.packageSize) || 8,
    trainingSchedule: formData.trainingSchedule || [],
    conditioningSchedule: formData.conditioningSchedule || [],
    startDate: formData.startDate ? Timestamp.fromDate(formData.startDate) : null,
    price: formData.price || null,
    notes: formData.notes || '',
    addedDate: serverTimestamp(),
    startTime: formData.trainingSchedule?.[0]?.startTime || '00:00',
    duration: 60,
    location: formData.trainingSchedule?.[0]?.location || '',
  };

  await setDoc(newDocRef, lessonData);
  return newDocRef.id;
};

export const updateLesson = async (
  clubId: string,
  lessonId: string,
  formData: LessonFormState,
  coaches: Coach[],
  students: StudentOption[],
  existingLesson: Lesson
) => {
  const lessonRef = getClubDocRef(clubId, 'privateLessons', lessonId);

  const selectedCoach = coaches.find(c => c.id === formData.selectedCoachId);

  // Preserve existing student attendance data
  const existingStudentMap = new Map(
    existingLesson.students.map(s => [s.studentId, s])
  );

  const selectedStudents = students.filter(s =>
    formData.selectedStudentOptionIds.includes(`${s.type}_${s.id}`) ||
    formData.selectedStudentOptionIds.includes(s.id)
  );

  const lessonStudents: LessonStudent[] = selectedStudents.map(s => {
    const existing = existingStudentMap.get(s.id);
    return {
      studentId: s.id,
      studentName: s.name,
      isManual: s.type === 'manual',
      attendedCount: existing?.attendedCount || 0,
      renewalRequested: existing?.renewalRequested || false,
      packageHistory: existing?.packageHistory || [],
      currentPackageNumber: existing?.currentPackageNumber || 1
    };
  });

  const updateData = {
    groupName: formData.groupName.trim(),
    coachId: formData.selectedCoachId,
    coachName: selectedCoach?.name || 'Bilinmiyor',
    lessonType: formData.lessonType,
    students: lessonStudents,
    status: formData.status,
    level: formData.level,
    packageSize: parseInt(formData.packageSize) || 8,
    trainingSchedule: formData.trainingSchedule || [],
    conditioningSchedule: formData.conditioningSchedule || [],
    startDate: formData.startDate ? Timestamp.fromDate(formData.startDate) : null,
    price: formData.price || null,
    notes: formData.notes || '',
    startTime: formData.trainingSchedule?.[0]?.startTime || existingLesson.startTime,
    location: formData.trainingSchedule?.[0]?.location || existingLesson.location,
  };

  await updateDoc(lessonRef, updateData);
};

export const deleteLesson = async (clubId: string, lessonId: string) => {
  const lessonRef = getClubDocRef(clubId, 'privateLessons', lessonId);
  await deleteDoc(lessonRef);
};

// COACH OPERATIONS
export const fetchCoaches = async (clubId: string) => {
  // Fetch user coaches (from users collection with role: coach or conditioning)
  const usersRef = getClubCollectionRef(clubId, 'users');
  const userCoachesQuery = query(usersRef, where('role', 'in', ['coach', 'conditioning']));
  const userCoachesSnapshot = await getDocs(userCoachesQuery);

  const userCoaches: Coach[] = userCoachesSnapshot.docs.map(docSnap => {
    const d = docSnap.data();
    return {
      id: docSnap.id,
      name: `${d?.firstName || ''} ${d?.lastName || ''}`.trim() || d?.email || 'İsimsiz Eğitmen',
      phone: d?.phone || d?.phoneNumber,
      email: d?.email,
      isManual: false,
      role: d?.role,
      addedDate: d?.createdAt instanceof Timestamp ? d.createdAt : undefined,
      financialInfo: d?.financialInfo || undefined
    };
  });

  // Fetch manual coaches
  const coachesRef = getClubCollectionRef(clubId, 'coaches');
  const manualCoachesSnapshot = await getDocs(query(coachesRef, orderBy('name')));

  const manualCoaches: Coach[] = manualCoachesSnapshot.docs.map(docSnap => {
    const d = docSnap.data();
    return {
      id: docSnap.id,
      name: d?.name || 'İsimsiz Eğitmen',
      phone: d?.phone,
      email: d?.email,
      specialization: d?.specialization,
      availabilityNotes: d?.availabilityNotes,
      isManual: true,
      role: d?.role,
      addedDate: d?.addedDate instanceof Timestamp ? d.addedDate : undefined,
    };
  });

  return [...userCoaches, ...manualCoaches];
};

export const createCoach = async (
  clubId: string,
  formData: {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
    sportType: string;
    specialization?: string;
    availabilityNotes?: string;
    country?: string;
    countryName?: string;
    state?: string;
    stateName?: string;
    city?: string;
    tcId?: string;
    idCountry?: string;
    birthDate?: Date | null;
    gender?: string;
    profession?: string;
  }
) => {
  // Create Firebase Auth user
  const userCredential = await createUserWithEmailAndPassword(
    secondaryAuth,
    formData.email.trim(),
    formData.password
  );
  const firebaseUser = userCredential.user;

  // Sign out from secondary auth
  await signOut(secondaryAuth);

  const userRole = formData.sportType === 'conditioning' ? 'conditioning' : 'coach';

  const userData = {
    firstName: formData.firstName.trim(),
    lastName: formData.lastName.trim(),
    username: formData.username.toLowerCase().trim(),
    email: formData.email.trim(),
    role: userRole,
    phone: formData.phone || '',
    address: formData.address || `${formData.city || ''}, ${formData.stateName || ''}, ${formData.countryName || ''}`,
    country: formData.country || '',
    countryName: formData.countryName || '',
    state: formData.state || '',
    stateName: formData.stateName || '',
    city: formData.city || '',
    tcId: formData.tcId || '',
    idCountry: formData.idCountry || 'TR',
    birthDate: formData.birthDate ? Timestamp.fromDate(formData.birthDate) : null,
    gender: formData.gender || '',
    profession: formData.profession || '',
    specialization: formData.specialization || '',
    sportType: formData.sportType,
    availabilityNotes: formData.availabilityNotes || '',
    createdAt: serverTimestamp(),
    isManual: false,
    status: 'active',
    authUid: firebaseUser.uid,
    dateAdded: serverTimestamp(),
    lastLogin: Timestamp.now()
  };

  const walletData = {
    userId: firebaseUser.uid,
    userName: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
    balance: 0,
    negativeBalance: 0,
    isBlocked: false,
    createdAt: serverTimestamp(),
    lastUpdated: serverTimestamp()
  };

  const usersRef = getClubCollectionRef(clubId, 'users');
  const walletsRef = getClubCollectionRef(clubId, 'wallets');

  const batch = writeBatch(db);
  batch.set(doc(usersRef, firebaseUser.uid), userData);
  batch.set(doc(walletsRef, firebaseUser.uid), walletData);

  // Create initial wallet activity
  const activityRef = doc(collection(doc(walletsRef, firebaseUser.uid), 'activities'));
  batch.set(activityRef, {
    service: 'Cüzdan Oluşturuldu',
    amount: 0,
    type: 'system',
    timestamp: serverTimestamp(),
    description: 'Cüzdan başlatıldı',
    balanceBefore: 0,
    balanceAfter: 0
  });

  await batch.commit();
  return firebaseUser.uid;
};

export const deleteCoach = async (clubId: string, coachId: string, isManual: boolean) => {
  if (isManual) {
    const coachRef = getClubDocRef(clubId, 'coaches', coachId);
    await deleteDoc(coachRef);
  } else {
    const userRef = getClubDocRef(clubId, 'users', coachId);
    await deleteDoc(userRef);
  }
};

// STUDENT OPERATIONS
export const fetchStudents = async (clubId: string) => {
  const financeStudentsRef = getClubCollectionRef(clubId, 'financeStudents');
  const snapshot = await getDocs(query(financeStudentsRef, orderBy('name')));

  const students: StudentOption[] = snapshot.docs.map(docSnap => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      name: data?.name || 'İsimsiz',
      type: data?.type || 'user',
      phone: data?.phone,
      email: data?.email,
      username: data?.username,
      role: data?.role,
      lessonType: data?.lessonType,
      level: data?.level,
      appliedLessonTypes: data?.appliedLessonTypes || [],
      lessonMemberships: data?.lessonMemberships || [],
      financialHistory: data?.financialHistory || [],
      price: data?.price,
      totalPaid: data?.totalPaid,
      remainingAmount: data?.remainingAmount,
      paymentStatus: data?.paymentStatus,
      installments: data?.installments,
      membershipFee: data?.membershipFee,
      membershipYears: data?.membershipYears,
      membershipStartDate: data?.membershipStartDate,
      installmentOption: data?.installmentOption,
      installmentCount: data?.installmentCount,
      installmentDay: data?.installmentDay,
      nextPaymentDate: data?.nextPaymentDate,
      addedDate: data?.lastUpdated || Timestamp.now(),
      gender: data?.gender,
      birthDate: data?.birthDate instanceof Timestamp ? data.birthDate : undefined,
      profession: data?.profession,
      tcId: data?.tcId,
      playerStatus: data?.playerStatus,
    };
  });

  return students;
};

export const createStudent = async (
  clubId: string,
  formData: {
    name: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
    country?: string;
    countryName?: string;
    state?: string;
    stateName?: string;
    city?: string;
    notes?: string;
    lessonType?: LessonType;
    appliedLessonTypes?: LessonType[];
    level?: string;
    gender?: string;
    birthDate?: Date | null;
    profession?: string;
    tcId?: string;
    idCountry?: string;
    price?: number;
    membershipFee?: number;
    membershipYears?: number;
    membershipStartDate?: Date | null;
    installmentCount?: number;
    installmentDay?: number;
    installments?: any[];
    paymentStatus?: string;
    totalPaid?: number;
    remainingAmount?: number;
  }
) => {
  // Create Firebase Auth user
  const userCredential = await createUserWithEmailAndPassword(
    secondaryAuth,
    formData.email.trim(),
    formData.password
  );
  const firebaseUser = userCredential.user;
  await signOut(secondaryAuth);

  // Create user data for users collection
  const userData = {
    firstName: formData.firstName.trim(),
    lastName: formData.lastName.trim(),
    username: formData.username.toLowerCase().trim(),
    email: formData.email.trim(),
    role: 'players',
    phone: formData.phone || '',
    address: formData.address || `${formData.city || ''}, ${formData.stateName || ''}, ${formData.countryName || ''}`,
    country: formData.country || '',
    countryName: formData.countryName || '',
    state: formData.state || '',
    stateName: formData.stateName || '',
    city: formData.city || '',
    tcId: formData.tcId || '',
    idCountry: formData.idCountry || 'TR',
    birthDate: formData.birthDate ? Timestamp.fromDate(formData.birthDate) : null,
    gender: formData.gender || '',
    level: formData.level || '',
    profession: formData.profession || '',
    price: formData.price || 0,
    membershipFee: formData.membershipFee || 0,
    membershipYears: formData.membershipYears || 1,
    membershipStartDate: formData.membershipStartDate ? Timestamp.fromDate(formData.membershipStartDate) : null,
    installmentCount: formData.installmentCount || 1,
    installmentDay: formData.installmentDay || 1,
    installments: formData.installments?.map(inst => ({
      ...inst,
      dueDate: inst.dueDate instanceof Date ? Timestamp.fromDate(inst.dueDate) : inst.dueDate,
    })) || [],
    paymentStatus: formData.paymentStatus || 'Ödendi',
    totalPaid: formData.totalPaid || 0,
    remainingAmount: formData.remainingAmount || 0,
    notes: formData.notes || '',
    appliedLessonTypes: formData.appliedLessonTypes || (formData.lessonType ? [formData.lessonType] : []),
    createdAt: serverTimestamp(),
    isManual: false,
    status: 'active',
    playerStatus: 'Aktif',
    authUid: firebaseUser.uid,
    dateAdded: serverTimestamp(),
    lastLogin: Timestamp.now(),
    punctualityScore: 100,
    loyaltyPoints: 0,
    overdueNotificationSent: false,
    membershipExpiredNotificationSent: false,
  };

  // Create wallet data
  const walletData = {
    userId: firebaseUser.uid,
    userName: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
    balance: 0,
    negativeBalance: 0,
    isBlocked: false,
    createdAt: serverTimestamp(),
    lastUpdated: serverTimestamp()
  };

  // Get collection references
  const usersRef = getClubCollectionRef(clubId, 'users');
  const walletsRef = getClubCollectionRef(clubId, 'wallets');

  // Use batch write for atomic operation
  const batch = writeBatch(db);

  // Save user to users collection
  batch.set(doc(usersRef, firebaseUser.uid), userData);

  // Save wallet
  batch.set(doc(walletsRef, firebaseUser.uid), walletData);

  // Create wallet activity
  const activityRef = doc(collection(doc(walletsRef, firebaseUser.uid), 'activities'));
  batch.set(activityRef, {
    service: 'Cüzdan Oluşturuldu (Öğrenci)',
    amount: 0,
    type: 'system',
    timestamp: serverTimestamp(),
    description: 'Cüzdan başlatıldı',
    balanceBefore: 0,
    balanceAfter: 0
  });

  await batch.commit();
  return firebaseUser.uid;
};

export const updateStudent = async (clubId: string, studentId: string, data: Partial<StudentOption>) => {
  const studentRef = getClubDocRef(clubId, 'financeStudents', studentId);
  await updateDoc(studentRef, {
    ...data,
    lastUpdated: serverTimestamp(),
  });
};

export const deleteStudent = async (clubId: string, studentId: string) => {
  const studentRef = getClubDocRef(clubId, 'financeStudents', studentId);
  await deleteDoc(studentRef);
};

// REQUEST OPERATIONS
export const fetchRequests = async (clubId: string, limitCount: number = 20, lastDoc?: QueryDocumentSnapshot<DocumentData>) => {
  const requestsRef = getClubCollectionRef(clubId, 'requests');
  let q = query(requestsRef, orderBy('requestDate', 'desc'), limit(limitCount));

  if (lastDoc) {
    q = query(requestsRef, orderBy('requestDate', 'desc'), startAfter(lastDoc), limit(limitCount));
  }

  const snapshot = await getDocs(q);
  const requests = snapshot.docs.map(parseRequestDoc);
  const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;

  return { requests, lastVisible, hasMore: snapshot.docs.length === limitCount };
};

export const approveRequest = async (
  clubId: string,
  request: Request,
  financialData: RequestFinancialData,
  students: StudentOption[]
) => {
  const requestRef = getClubDocRef(clubId, 'requests', request.id);

  // Update request status
  await updateDoc(requestRef, {
    status: 'Onaylandı',
    approvedDate: serverTimestamp(),
    financialData: {
      price: financialData.price,
      membershipYears: financialData.membershipYears,
      membershipStartDate: Timestamp.fromDate(financialData.membershipStartDate),
      installmentCount: financialData.installmentCount,
      installmentDay: financialData.installmentDay,
      notes: financialData.notes
    }
  });

  const studentOption = students.find(s => s.id === request.studentId);

  // Calculate dates and installments
  const membershipStartDate = financialData.membershipStartDate;
  const membershipEndDate = new Date(membershipStartDate);
  membershipEndDate.setFullYear(membershipEndDate.getFullYear() + financialData.membershipYears);

  const installmentAmount = financialData.price / financialData.installmentCount;
  const installments: Installment[] = [];

  for (let i = 0; i < financialData.installmentCount; i++) {
    const dueDate = new Date(membershipStartDate);
    dueDate.setMonth(dueDate.getMonth() + i);
    dueDate.setDate(financialData.installmentDay);

    installments.push({
      installmentNumber: i + 1,
      amount: i === financialData.installmentCount - 1
        ? financialData.price - (installmentAmount * (financialData.installmentCount - 1))
        : installmentAmount,
      dueDate: Timestamp.fromDate(dueDate),
      status: 'Beklemede'
    });
  }

  const correctLessonType = financialData.lessonType || request.requestedLessonType || request.lessonType || 'Bireysel';

  const lessonMembership: LessonMembership = {
    id: `membership_${Date.now()}`,
    lessonId: '',
    lessonName: `${correctLessonType} Dersi`,
    lessonType: correctLessonType,
    price: financialData.price,
    totalPaid: 0,
    remainingAmount: financialData.price,
    startDate: Timestamp.fromDate(membershipStartDate),
    endDate: Timestamp.fromDate(membershipEndDate),
    membershipYears: financialData.membershipYears,
    installmentCount: financialData.installmentCount,
    installmentDay: financialData.installmentDay,
    installments,
    status: 'Active',
    paymentStatus: 'Beklemede',
    createdAt: Timestamp.now(),
    createdFrom: 'request_approval',
    notes: financialData.notes || request.notes || ''
  };

  // Create or update finance student record
  const financeStudentsRef = getClubCollectionRef(clubId, 'financeStudents');
  const financeDocId = `${request.studentId}_${correctLessonType}`;
  const financeStudentDoc = doc(financeStudentsRef, financeDocId);

  const financeData = {
    id: financeDocId,
    userId: request.studentId,
    name: request.studentName,
    email: request.studentEmail || '',
    phone: request.studentPhone || '',
    type: studentOption ? 'user' : 'manual',
    lessonMemberships: [lessonMembership],
    appliedLessonTypes: [correctLessonType],
    lessonType: correctLessonType,
    level: request.studentDetails?.level || 'Başlangıç',
    financialHistory: [],
    price: financialData.price,
    membershipFee: financialData.price,
    totalPaid: 0,
    remainingAmount: financialData.price,
    membershipStartDate: Timestamp.fromDate(membershipStartDate),
    membershipEndDate: Timestamp.fromDate(membershipEndDate),
    membershipYears: financialData.membershipYears,
    installmentCount: financialData.installmentCount,
    installmentDay: financialData.installmentDay,
    installmentOption: `${financialData.installmentCount} Taksit`,
    installments,
    paymentStatus: 'Beklemede',
    notes: financialData.notes || request.notes || '',
    createdFrom: 'request_approval',
    lastUpdated: Timestamp.now(),
  };

  await setDoc(financeStudentDoc, financeData, { merge: true });
};

export const rejectRequest = async (clubId: string, requestId: string) => {
  const requestRef = getClubDocRef(clubId, 'requests', requestId);
  await updateDoc(requestRef, {
    status: 'Reddedildi',
    rejectedDate: serverTimestamp(),
  });
};

// TEMPLATE REQUEST OPERATIONS
export const fetchTemplateRequests = async (clubId: string, limitCount: number = 20, lastDoc?: QueryDocumentSnapshot<DocumentData>) => {
  const templateRequestsRef = getClubCollectionRef(clubId, 'templateRequests');
  let q = query(templateRequestsRef, orderBy('requestDate', 'desc'), limit(limitCount));

  if (lastDoc) {
    q = query(templateRequestsRef, orderBy('requestDate', 'desc'), startAfter(lastDoc), limit(limitCount));
  }

  const snapshot = await getDocs(q);
  const templateRequests = snapshot.docs.map(parseTemplateRequestDoc);
  const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;

  return { templateRequests, lastVisible, hasMore: snapshot.docs.length === limitCount };
};

// ATTENDANCE OPERATIONS
export const fetchAttendanceRecords = async (clubId: string, lessonId: string, date: string) => {
  const attendanceRef = getClubCollectionRef(clubId, 'attendanceLog');
  const dateTimestamp = Timestamp.fromDate(new Date(date));

  const q = query(
    attendanceRef,
    where('lessonId', '==', lessonId),
    where('attendanceDate', '==', dateTimestamp)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(parseAttendanceRecordDoc);
};

export const saveAttendance = async (
  clubId: string,
  lessonId: string,
  studentId: string,
  date: string,
  status: AttendanceStatus,
  rating?: number
) => {
  const attendanceRef = getClubCollectionRef(clubId, 'attendanceLog');
  const dateTimestamp = Timestamp.fromDate(new Date(date));

  // Check if record exists
  const q = query(
    attendanceRef,
    where('lessonId', '==', lessonId),
    where('studentId', '==', studentId),
    where('attendanceDate', '==', dateTimestamp)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    // Create new record
    const newDocRef = doc(attendanceRef);
    await setDoc(newDocRef, {
      lessonId,
      studentId,
      attendanceDate: dateTimestamp,
      status,
      rating: rating || null,
      addedDate: serverTimestamp(),
    });
  } else {
    // Update existing record
    const existingDoc = snapshot.docs[0];
    await updateDoc(existingDoc.ref, {
      status,
      rating: rating || null,
    });
  }

  // Update student attended count in lesson if marked as present
  if (status === 'Geldi') {
    const lessonRef = getClubDocRef(clubId, 'privateLessons', lessonId);
    const lessonSnap = await getDoc(lessonRef);

    if (lessonSnap.exists()) {
      const lessonData = lessonSnap.data();
      const students = lessonData.students || [];

      const updatedStudents = students.map((s: LessonStudent) => {
        if (s.studentId === studentId) {
          return {
            ...s,
            attendedCount: (s.attendedCount || 0) + 1
          };
        }
        return s;
      });

      await updateDoc(lessonRef, { students: updatedStudents });
    }
  }
};

// REAL-TIME LISTENERS
export const subscribeToLessons = (
  clubId: string,
  callback: (lessons: Lesson[]) => void,
  limitCount: number = 20
) => {
  const lessonsRef = getClubCollectionRef(clubId, 'privateLessons');
  const q = query(lessonsRef, orderBy('addedDate', 'desc'), limit(limitCount));

  return onSnapshot(q, (snapshot) => {
    const lessons = snapshot.docs.map(parseLessonDoc);
    callback(lessons);
  });
};

export const subscribeToStudents = (
  clubId: string,
  callback: (students: StudentOption[]) => void
) => {
  const financeStudentsRef = getClubCollectionRef(clubId, 'financeStudents');
  const q = query(financeStudentsRef, orderBy('name'));

  return onSnapshot(q, (snapshot) => {
    const students: StudentOption[] = snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data?.name || 'İsimsiz',
        type: data?.type || 'user',
        phone: data?.phone,
        email: data?.email,
        username: data?.username,
        role: data?.role,
        lessonType: data?.lessonType,
        level: data?.level,
        appliedLessonTypes: data?.appliedLessonTypes || [],
        lessonMemberships: data?.lessonMemberships || [],
        price: data?.price,
        totalPaid: data?.totalPaid,
        remainingAmount: data?.remainingAmount,
        paymentStatus: data?.paymentStatus,
        playerStatus: data?.playerStatus,
        addedDate: data?.lastUpdated || Timestamp.now(),
      };
    });
    callback(students);
  });
};

export const subscribeToCoaches = (
  clubId: string,
  callback: (coaches: Coach[]) => void
) => {
  const usersRef = getClubCollectionRef(clubId, 'users');
  const coachesRef = getClubCollectionRef(clubId, 'coaches');

  let userCoaches: Coach[] = [];
  let manualCoaches: Coach[] = [];

  const userCoachesQuery = query(usersRef, where('role', 'in', ['coach', 'conditioning']));

  const unsubUsers = onSnapshot(userCoachesQuery, (snapshot) => {
    userCoaches = snapshot.docs.map(docSnap => {
      const d = docSnap.data();
      return {
        id: docSnap.id,
        name: `${d?.firstName || ''} ${d?.lastName || ''}`.trim() || d?.email || 'İsimsiz Eğitmen',
        phone: d?.phone || d?.phoneNumber,
        email: d?.email,
        isManual: false,
        role: d?.role,
        addedDate: d?.createdAt instanceof Timestamp ? d.createdAt : undefined,
        financialInfo: d?.financialInfo || undefined
      };
    });
    callback([...userCoaches, ...manualCoaches]);
  });

  const unsubManual = onSnapshot(query(coachesRef, orderBy('name')), (snapshot) => {
    manualCoaches = snapshot.docs.map(docSnap => {
      const d = docSnap.data();
      return {
        id: docSnap.id,
        name: d?.name || 'İsimsiz Eğitmen',
        phone: d?.phone,
        email: d?.email,
        specialization: d?.specialization,
        availabilityNotes: d?.availabilityNotes,
        isManual: true,
        role: d?.role,
        addedDate: d?.addedDate instanceof Timestamp ? d.addedDate : undefined,
      };
    });
    callback([...userCoaches, ...manualCoaches]);
  });

  return () => {
    unsubUsers();
    unsubManual();
  };
};

export const subscribeToRequests = (
  clubId: string,
  callback: (requests: Request[], pendingCount: number) => void,
  limitCount: number = 20
) => {
  const requestsRef = getClubCollectionRef(clubId, 'requests');
  const q = query(requestsRef, orderBy('requestDate', 'desc'), limit(limitCount));

  return onSnapshot(q, (snapshot) => {
    const requests = snapshot.docs.map(parseRequestDoc);
    const pendingCount = requests.filter(r => r.status === 'Onay Bekliyor').length;
    callback(requests, pendingCount);
  });
};

export const subscribeToTemplateRequests = (
  clubId: string,
  callback: (requests: TemplateRequest[], pendingCount: number) => void,
  limitCount: number = 20
) => {
  const templateRequestsRef = getClubCollectionRef(clubId, 'templateRequests');
  const q = query(templateRequestsRef, orderBy('requestDate', 'desc'), limit(limitCount));

  return onSnapshot(q, (snapshot) => {
    const requests = snapshot.docs.map(parseTemplateRequestDoc);
    const pendingCount = requests.filter(r => r.status === 'Onay Bekliyor').length;
    callback(requests, pendingCount);
  });
};

// TEMPLATE REQUEST APPROVAL
export const approveTemplateRequest = async (
  clubId: string,
  requestId: string,
  approvalData: {
    price: number;
    membershipYears: number;
    installmentCount: number;
    installmentDay: number;
    startDate: Date;
    notes?: string;
  }
) => {
  const requestRef = getClubDocRef(clubId, 'templateRequests', requestId);
  const requestSnap = await getDoc(requestRef);

  if (!requestSnap.exists()) {
    throw new Error('Template request not found');
  }

  const requestData = requestSnap.data();

  // Calculate dates and installments
  const membershipStartDate = approvalData.startDate;
  const membershipEndDate = new Date(membershipStartDate);
  membershipEndDate.setFullYear(membershipEndDate.getFullYear() + approvalData.membershipYears);

  const installmentAmount = approvalData.price / approvalData.installmentCount;
  const installments: Installment[] = [];

  for (let i = 0; i < approvalData.installmentCount; i++) {
    const dueDate = new Date(membershipStartDate);
    dueDate.setMonth(dueDate.getMonth() + i);
    dueDate.setDate(approvalData.installmentDay);

    installments.push({
      installmentNumber: i + 1,
      amount: i === approvalData.installmentCount - 1
        ? approvalData.price - (installmentAmount * (approvalData.installmentCount - 1))
        : installmentAmount,
      dueDate: Timestamp.fromDate(dueDate),
      status: 'Beklemede'
    });
  }

  const lessonType = requestData.lessonType || 'Bireysel';

  const lessonMembership: LessonMembership = {
    id: `membership_${Date.now()}`,
    lessonId: requestData.createdLessonId || '',
    lessonName: requestData.lessonTemplateName || `${lessonType} Dersi`,
    lessonType: lessonType,
    price: approvalData.price,
    totalPaid: 0,
    remainingAmount: approvalData.price,
    startDate: Timestamp.fromDate(membershipStartDate),
    endDate: Timestamp.fromDate(membershipEndDate),
    membershipYears: approvalData.membershipYears,
    installmentCount: approvalData.installmentCount,
    installmentDay: approvalData.installmentDay,
    installments,
    status: 'Active',
    paymentStatus: 'Beklemede',
    createdAt: Timestamp.now(),
    createdFrom: 'template_approval',
    notes: approvalData.notes || requestData.notes || ''
  };

  // Create or update finance student record
  const financeStudentsRef = getClubCollectionRef(clubId, 'financeStudents');
  const financeDocId = `${requestData.studentId}_${lessonType}`;
  const financeStudentDoc = doc(financeStudentsRef, financeDocId);

  const financeData = {
    id: financeDocId,
    userId: requestData.studentId,
    name: requestData.studentName,
    email: requestData.studentEmail || '',
    phone: requestData.studentPhone || '',
    type: 'user',
    lessonMemberships: [lessonMembership],
    appliedLessonTypes: [lessonType],
    lessonType: lessonType,
    level: requestData.studentLevel || 'Başlangıç',
    financialHistory: [],
    price: approvalData.price,
    membershipFee: approvalData.price,
    totalPaid: 0,
    remainingAmount: approvalData.price,
    membershipStartDate: Timestamp.fromDate(membershipStartDate),
    membershipEndDate: Timestamp.fromDate(membershipEndDate),
    membershipYears: approvalData.membershipYears,
    installmentCount: approvalData.installmentCount,
    installmentDay: approvalData.installmentDay,
    installmentOption: `${approvalData.installmentCount} Taksit`,
    installments,
    paymentStatus: 'Beklemede',
    notes: approvalData.notes || requestData.notes || '',
    createdFrom: 'template_approval',
    lastUpdated: Timestamp.now(),
  };

  const batch = writeBatch(db);

  // Update request status
  batch.update(requestRef, {
    status: 'Onaylandı',
    approvedDate: serverTimestamp(),
    financialData: {
      price: approvalData.price,
      membershipYears: approvalData.membershipYears,
      membershipStartDate: Timestamp.fromDate(membershipStartDate),
      installmentCount: approvalData.installmentCount,
      installmentDay: approvalData.installmentDay,
      notes: approvalData.notes
    }
  });

  // Create/update finance student
  batch.set(financeStudentDoc, financeData, { merge: true });

  await batch.commit();
};

export const rejectTemplateRequest = async (clubId: string, requestId: string) => {
  const requestRef = getClubDocRef(clubId, 'templateRequests', requestId);
  await updateDoc(requestRef, {
    status: 'Reddedildi',
    rejectedDate: serverTimestamp(),
  });
};

// PAYMENT OPERATIONS
export const processPayment = async (
  clubId: string,
  studentId: string,
  paymentData: {
    amount: number;
    paymentMethod: string;
    paymentType: 'installment' | 'partial' | 'full' | 'lateFee' | 'renewal';
    installmentNumbers?: number[];
    lessonMembershipId?: string;
    notes?: string;
    processedBy: string;
    playerName: string;
  }
) => {
  const financeStudentRef = getClubDocRef(clubId, 'financeStudents', studentId);
  const studentSnap = await getDoc(financeStudentRef);

  if (!studentSnap.exists()) {
    throw new Error('Student not found');
  }

  const studentData = studentSnap.data();
  const lessonMemberships = studentData.lessonMemberships || [];

  // Find the membership to update
  let updatedMemberships = [...lessonMemberships];

  if (paymentData.lessonMembershipId && paymentData.installmentNumbers) {
    updatedMemberships = lessonMemberships.map((membership: any) => {
      if (membership.id === paymentData.lessonMembershipId) {
        const updatedInstallments = membership.installments.map((inst: any) => {
          if (paymentData.installmentNumbers?.includes(inst.installmentNumber)) {
            return {
              ...inst,
              status: 'Ödendi',
              paymentDate: Timestamp.now(),
              paymentMethod: paymentData.paymentMethod,
            };
          }
          return inst;
        });

        const newTotalPaid = membership.totalPaid + paymentData.amount;
        const newRemaining = membership.price - newTotalPaid;
        const allPaid = updatedInstallments.every((i: any) => i.status === 'Ödendi');

        return {
          ...membership,
          installments: updatedInstallments,
          totalPaid: newTotalPaid,
          remainingAmount: newRemaining,
          paymentStatus: allPaid ? 'Ödendi' : newRemaining > 0 ? 'Kısmen Ödendi' : 'Ödendi',
        };
      }
      return membership;
    });
  }

  // Calculate new totals
  const newTotalPaid = (studentData.totalPaid || 0) + paymentData.amount;
  const newRemaining = (studentData.price || 0) - newTotalPaid;

  // Create payment record
  const paymentRecordsRef = collection(financeStudentRef, 'paymentRecords');
  const paymentRecordData = {
    playerId: studentId,
    playerName: paymentData.playerName,
    amount: paymentData.amount,
    paymentDate: serverTimestamp(),
    paymentMethod: paymentData.paymentMethod,
    paymentType: paymentData.paymentType,
    installmentNumbers: paymentData.installmentNumbers || [],
    lessonMembershipId: paymentData.lessonMembershipId || null,
    isLateFee: paymentData.paymentType === 'lateFee',
    notes: paymentData.notes || null,
    processedBy: paymentData.processedBy,
  };

  const batch = writeBatch(db);

  // Update student document
  batch.update(financeStudentRef, {
    lessonMemberships: updatedMemberships,
    totalPaid: newTotalPaid,
    remainingAmount: newRemaining,
    paymentStatus: newRemaining <= 0 ? 'Ödendi' : newRemaining < (studentData.price || 0) ? 'Kısmi Ödeme' : 'Beklemede',
    lastUpdated: serverTimestamp(),
  });

  // Add payment record
  batch.set(doc(paymentRecordsRef), paymentRecordData);

  await batch.commit();
};

export const fetchPaymentRecords = async (clubId: string, studentId: string) => {
  const financeStudentRef = getClubDocRef(clubId, 'financeStudents', studentId);
  const paymentRecordsRef = collection(financeStudentRef, 'paymentRecords');
  const q = query(paymentRecordsRef, orderBy('paymentDate', 'desc'));

  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...docSnap.data()
  }));
};

export const deletePaymentRecord = async (
  clubId: string,
  studentId: string,
  paymentRecordId: string,
  deleteReason: string,
  deletedBy: string
) => {
  const financeStudentRef = getClubDocRef(clubId, 'financeStudents', studentId);
  const paymentRecordRef = doc(financeStudentRef, 'paymentRecords', paymentRecordId);

  // Get the payment record first
  const paymentSnap = await getDoc(paymentRecordRef);
  if (!paymentSnap.exists()) {
    throw new Error('Payment record not found');
  }

  const paymentData = paymentSnap.data();

  // Get student data
  const studentSnap = await getDoc(financeStudentRef);
  if (!studentSnap.exists()) {
    throw new Error('Student not found');
  }

  const studentData = studentSnap.data();

  // Revert the payment
  const newTotalPaid = (studentData.totalPaid || 0) - paymentData.amount;
  const newRemaining = (studentData.price || 0) - newTotalPaid;

  // Create audit record
  const auditRef = getClubCollectionRef(clubId, 'auditLogs');
  const auditData = {
    action: 'PAYMENT_DELETED',
    entityType: 'payment',
    entityId: paymentRecordId,
    studentId,
    deletedPayment: paymentData,
    deleteReason,
    deletedBy,
    deletedAt: serverTimestamp(),
  };

  const batch = writeBatch(db);

  // Delete payment record
  batch.delete(paymentRecordRef);

  // Update student totals
  batch.update(financeStudentRef, {
    totalPaid: newTotalPaid,
    remainingAmount: newRemaining,
    paymentStatus: newRemaining >= (studentData.price || 0) ? 'Beklemede' : 'Kısmi Ödeme',
    lastUpdated: serverTimestamp(),
  });

  // Add audit log
  batch.set(doc(auditRef), auditData);

  await batch.commit();
};

// STUDENT STATUS OPERATIONS
export const updateStudentStatus = async (
  clubId: string,
  studentId: string,
  statusData: {
    playerStatus: 'Aktif' | 'Dondurulmuş' | 'Bıraktı' | 'Geçici Dondurulmuş';
    freezeReason?: string;
    freezeStartDate?: Date;
    freezeEndDate?: Date;
    statusChangeReason?: string;
    statusChangeBy: string;
  }
) => {
  const financeStudentRef = getClubDocRef(clubId, 'financeStudents', studentId);

  const updateData: any = {
    playerStatus: statusData.playerStatus,
    lastStatusChange: serverTimestamp(),
    statusChangeReason: statusData.statusChangeReason || '',
    statusChangeBy: statusData.statusChangeBy,
    lastUpdated: serverTimestamp(),
  };

  if (statusData.playerStatus === 'Dondurulmuş' || statusData.playerStatus === 'Geçici Dondurulmuş') {
    updateData.freezeReason = statusData.freezeReason || '';
    updateData.freezeStartDate = statusData.freezeStartDate ? Timestamp.fromDate(statusData.freezeStartDate) : null;
    updateData.freezeEndDate = statusData.freezeEndDate ? Timestamp.fromDate(statusData.freezeEndDate) : null;
  } else {
    // Clear freeze data when activating
    updateData.freezeReason = null;
    updateData.freezeStartDate = null;
    updateData.freezeEndDate = null;
  }

  await updateDoc(financeStudentRef, updateData);
};

// PACKAGE RENEWAL OPERATIONS
export const renewPackage = async (
  clubId: string,
  lessonId: string,
  studentId: string | null,
  renewalData: {
    newPrice: number;
    membershipYears: number;
    membershipStartDate: Date;
    installmentCount: number;
    installmentDay: number;
    newPackageSize?: number;
    notes?: string;
    renewedBy: string;
  }
) => {
  const lessonRef = getClubDocRef(clubId, 'privateLessons', lessonId);
  const lessonSnap = await getDoc(lessonRef);

  if (!lessonSnap.exists()) {
    throw new Error('Lesson not found');
  }

  const lessonData = lessonSnap.data();
  const students = lessonData.students || [];

  // Calculate dates and installments
  const membershipStartDate = renewalData.membershipStartDate;
  const membershipEndDate = new Date(membershipStartDate);
  membershipEndDate.setFullYear(membershipEndDate.getFullYear() + renewalData.membershipYears);

  const installmentAmount = renewalData.newPrice / renewalData.installmentCount;
  const installments: Installment[] = [];

  for (let i = 0; i < renewalData.installmentCount; i++) {
    const dueDate = new Date(membershipStartDate);
    dueDate.setMonth(dueDate.getMonth() + i);
    dueDate.setDate(renewalData.installmentDay);

    installments.push({
      installmentNumber: i + 1,
      amount: i === renewalData.installmentCount - 1
        ? renewalData.newPrice - (installmentAmount * (renewalData.installmentCount - 1))
        : installmentAmount,
      dueDate: Timestamp.fromDate(dueDate),
      status: 'Beklemede'
    });
  }

  const batch = writeBatch(db);

  // If studentId is provided, renew for specific student
  // Otherwise, renew for all students in the lesson
  const targetStudents = studentId
    ? students.filter((s: any) => s.studentId === studentId)
    : students;

  for (const student of targetStudents) {
    // Update lesson student data
    const updatedStudents = students.map((s: any) => {
      if (s.studentId === student.studentId) {
        const currentPackageNumber = (s.currentPackageNumber || 1) + 1;
        const packageHistory = s.packageHistory || [];
        packageHistory.push({
          packageNumber: s.currentPackageNumber || 1,
          attendedCount: s.attendedCount || 0,
          completedDate: Timestamp.now(),
          price: renewalData.newPrice,
          notes: renewalData.notes,
        });

        return {
          ...s,
          attendedCount: 0,
          currentPackageNumber,
          packageHistory,
          renewalRequested: false,
        };
      }
      return s;
    });

    batch.update(lessonRef, {
      students: updatedStudents,
      packageSize: renewalData.newPackageSize || lessonData.packageSize,
    });

    // Update finance student
    const financeStudentRef = getClubDocRef(clubId, 'financeStudents', `${student.studentId}_${lessonData.lessonType}`);
    const financeSnap = await getDoc(financeStudentRef);

    if (financeSnap.exists()) {
      const financeData = financeSnap.data();
      const existingMemberships = financeData.lessonMemberships || [];
      const financialHistory = financeData.financialHistory || [];

      // Move current membership to history
      const currentMembership = existingMemberships.find((m: any) => m.lessonId === lessonId && m.status === 'Active');
      if (currentMembership) {
        financialHistory.push({
          ...currentMembership,
          status: 'Renewed',
          completedAt: Timestamp.now(),
          renewalInfo: {
            renewedAt: Timestamp.now(),
            newMembershipId: `membership_${Date.now()}`,
            renewedBy: renewalData.renewedBy,
          },
        });
      }

      // Create new membership
      const newMembership: LessonMembership = {
        id: `membership_${Date.now()}`,
        lessonId,
        lessonName: lessonData.groupName,
        lessonType: lessonData.lessonType,
        coachId: lessonData.coachId,
        coachName: lessonData.coachName,
        price: renewalData.newPrice,
        totalPaid: 0,
        remainingAmount: renewalData.newPrice,
        startDate: Timestamp.fromDate(membershipStartDate),
        endDate: Timestamp.fromDate(membershipEndDate),
        membershipYears: renewalData.membershipYears,
        installmentCount: renewalData.installmentCount,
        installmentDay: renewalData.installmentDay,
        installments,
        status: 'Active',
        paymentStatus: 'Beklemede',
        createdAt: Timestamp.now(),
        createdFrom: 'renewal',
        notes: renewalData.notes || '',
      };

      // Update memberships - deactivate old, add new
      const updatedMemberships = existingMemberships
        .map((m: any) => m.lessonId === lessonId && m.status === 'Active' ? { ...m, status: 'Renewed' } : m)
        .concat([newMembership]);

      batch.update(financeStudentRef, {
        lessonMemberships: updatedMemberships,
        financialHistory,
        price: renewalData.newPrice,
        totalPaid: 0,
        remainingAmount: renewalData.newPrice,
        installments,
        paymentStatus: 'Beklemede',
        membershipStartDate: Timestamp.fromDate(membershipStartDate),
        membershipEndDate: Timestamp.fromDate(membershipEndDate),
        lastUpdated: serverTimestamp(),
      });
    }
  }

  await batch.commit();
};

// GET STUDENT FULL DETAILS
export const getStudentFullDetails = async (clubId: string, studentId: string) => {
  const financeStudentRef = getClubDocRef(clubId, 'financeStudents', studentId);
  const studentSnap = await getDoc(financeStudentRef);

  if (!studentSnap.exists()) {
    return null;
  }

  const data = studentSnap.data();

  // Fetch payment records
  const paymentRecordsRef = collection(financeStudentRef, 'paymentRecords');
  const paymentSnapshot = await getDocs(query(paymentRecordsRef, orderBy('paymentDate', 'desc')));
  const paymentRecords = paymentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  return {
    ...data,
    id: studentSnap.id,
    paymentRecords,
  };
};
