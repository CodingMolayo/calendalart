import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDoc, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { Goal, SubGoal, CalendarEvent } from '../../types'; // CalendarEvent 추가

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('❌ Firebase 설정이 없습니다! .env.local 파일을 확인하세요.');
  throw new Error('Firebase 설정 오류: .env.local 파일을 확인하세요');
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const loginAnonymously = async () => {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error) {
    console.error('❌ 익명 로그인 실패:', error);
    throw error;
  }
};

export const createGoal = async (goalData: Omit<Goal, 'id'>) => {
  const docRef = await addDoc(collection(db, 'goals'), {
    ...goalData,
    createdAt: new Date(),
  });
  return docRef.id;
};

export const getGoal = async (goalId: string): Promise<Goal | null> => {
  const docSnap = await getDoc(doc(db, 'goals', goalId));
  if (!docSnap.exists()) return null;
  const data = docSnap.data();
  // Firestore 타임스탬프를 Date 객체로 변환
  return { 
    id: docSnap.id, 
    ...data, 
    createdAt: data.createdAt.toDate() 
  } as Goal;
};

export const getUserGoals = async (userId: string): Promise<Goal[]> => {
  const q = query(collection(db, 'goals'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt.toDate(),
    } as Goal;
  });
};

export const updateSubGoal = async (goalId: string, subGoalIndex: number, updates: Partial<SubGoal>) => {
  const goalRef = doc(db, 'goals', goalId);
  const goalSnap = await getDoc(goalRef);
  if (!goalSnap.exists()) return;

  const goal = goalSnap.data() as Goal;
  goal.subGoals[subGoalIndex] = { ...goal.subGoals[subGoalIndex], ...updates };
  
  await updateDoc(goalRef, { subGoals: goal.subGoals });
};

export const toggleAction = async (goalId: string, subGoalIndex: number, actionIndex: number) => {
  const goalRef = doc(db, 'goals', goalId);
  const goalSnap = await getDoc(goalRef);
  if (!goalSnap.exists()) return;

  const goal = goalSnap.data() as Goal;
  goal.subGoals[subGoalIndex].actions[actionIndex].done = 
    !goal.subGoals[subGoalIndex].actions[actionIndex].done;
  
  await updateDoc(goalRef, { subGoals: goal.subGoals });
};

// 캘린더 이벤트 생성
export const addCalendarEvent = async (goalId: string, event: Omit<CalendarEvent, 'id'>) => {
  await addDoc(collection(db, `goals/${goalId}/calendarEvents`), event);
};

// 캘린더 이벤트 목록 조회
export const getCalendarEvents = async (goalId: string): Promise<CalendarEvent[]> => {
  const snapshot = await getDocs(collection(db, `goals/${goalId}/calendarEvents`));
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      startDate: data.startDate.toDate(),
      endDate: data.endDate.toDate(),
    } as CalendarEvent;
  });
};