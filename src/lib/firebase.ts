//=== scr/lib/firebase.ts

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  where,
  arrayRemove,
  arrayUnion,
  Timestamp,
  DocumentData
} from 'firebase/firestore';
import { Goal, SubGoal, CalendarEvent } from '../../types';

// Firebase 설정 검증
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 설정 값 검증
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('❌ Firebase 설정이 없습니다! .env.local 파일을 확인하세요.');
  console.error('현재 설정:', firebaseConfig);
  throw new Error('Firebase 설정 오류: .env.local 파일을 확인하세요');
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Helper to convert Firestore Timestamps
const convertToDate = (date: unknown): Date => {
    if (date instanceof Timestamp) {
        return date.toDate();
    }
    if (date instanceof Date) {
        return date;
    }
    if (typeof date === 'string') {
        return new Date(date);
    }
    // Handle object with toDate method that isn't a Timestamp
    if (date && typeof (date as { toDate?: () => Date }).toDate === 'function') {
        return (date as { toDate: () => Date }).toDate();
    }
    return new Date(); // Fallback
};


// 익명 로그인
export const loginAnonymously = async () => {
  try {
    const result = await signInAnonymously(auth);
    console.log('✅ 익명 로그인 성공:', result.user.uid);
    return result.user;
  } catch (error) {
    console.error('❌ 익명 로그인 실패:', error);
    throw error;
  }
};

// Goal 생성
export const createGoal = async (goalData: Omit<Goal, 'id'>) => {
  const docRef = await addDoc(collection(db, 'goals'), {
    ...goalData,
    createdAt: new Date(),
  });
  return docRef.id;
};

// Goal 조회
export const getGoal = async (goalId: string): Promise<Goal | null> => {
  const docSnap = await getDoc(doc(db, 'goals', goalId));
  if (!docSnap.exists()) return null;
  
  const data = docSnap.data();
  const events = (data.events || []).map((event: DocumentData) => ({
    ...event,
    startDate: convertToDate(event.startDate),
    endDate: convertToDate(event.endDate),
  } as CalendarEvent));

  return { 
    id: docSnap.id, 
    ...data,
    createdAt: convertToDate(data.createdAt),
    events,
  } as Goal;
};

// 사용자 Goal 목록 (최대 3개 제한)
export const getUserGoals = async (userId: string): Promise<Goal[]> => {
  const q = query(collection(db, 'goals'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return { 
      id: doc.id, 
      ...data,
      createdAt: convertToDate(data.createdAt)
    } as Goal;
  });
};

// SubGoal 업데이트
export const updateSubGoal = async (
  goalId: string, 
  subGoalIndex: number, 
  updates: Partial<SubGoal>
) => {
  const goalRef = doc(db, 'goals', goalId);
  const goalSnap = await getDoc(goalRef);
  if (!goalSnap.exists()) return;

  const goal = goalSnap.data() as Goal;
  goal.subGoals[subGoalIndex] = { ...goal.subGoals[subGoalIndex], ...updates };
  
  await updateDoc(goalRef, { subGoals: goal.subGoals });
};

// Action 체크 토글
export const toggleAction = async (
  goalId: string, 
  subGoalIndex: number, 
  actionIndex: number
) => {
  const goalRef = doc(db, 'goals', goalId);
  const goalSnap = await getDoc(goalRef);
  if (!goalSnap.exists()) return;

  const goal = goalSnap.data() as Goal;
  goal.subGoals[subGoalIndex].actions[actionIndex].done = 
    !goal.subGoals[subGoalIndex].actions[actionIndex].done;
  
  await updateDoc(goalRef, { subGoals: goal.subGoals });
};

// SubGoal 단일 조회
export const getSubGoal = async (goalId: string, subGoalIndex: number) => {
  const goal = await getGoal(goalId);
  if (!goal) throw new Error('Goal을 찾을 수 없습니다');
  return goal.subGoals[subGoalIndex];
};

// 캘린더 일정 추가 (Lock 기능 제거)
export const addCalendarEvent = async (
  goalId: string, 
  eventData: Omit<CalendarEvent, 'id'>
) => {
  const goalRef = doc(db, 'goals', goalId);
  const goalSnap = await getDoc(goalRef);
  if (!goalSnap.exists()) throw new Error('Goal을 찾을 수 없습니다');

  const newEvent: CalendarEvent = {
    ...eventData,
    id: crypto.randomUUID(),
  };

  // events 배열에 추가
  await updateDoc(goalRef, {
    events: arrayUnion(newEvent)
  });

  return newEvent.id;
};

// 캘린더 일정 조회
export const getCalendarEvents = async (goalId: string): Promise<CalendarEvent[]> => {
  const goal = await getGoal(goalId);
  return goal?.events || [];
};

// 캘린더 일정 삭제 (Lock 기능 제거)
export const deleteCalendarEvent = async (goalId: string, eventId: string) => {
  const goalRef = doc(db, 'goals', goalId);
  const goalSnap = await getDoc(goalRef);
  if (!goalSnap.exists()) throw new Error('Goal을 찾을 수 없습니다');

  // Firestore에서 직접 데이터를 가져와서 비교합니다.
  const rawData = goalSnap.data();
  const events = rawData.events || [];
  
  // 삭제할 이벤트 찾기
  const eventToDelete = events.find((e: DocumentData) => e.id === eventId);
  if (!eventToDelete) throw new Error('이벤트를 찾을 수 없습니다');

  // 이벤트 삭제
  await updateDoc(goalRef, {
    events: arrayRemove(eventToDelete)
  });
};

// 🔥 Goal 아카이브
export const archiveGoal = async (goalId: string) => {
  const goalRef = doc(db, 'goals', goalId);
  await updateDoc(goalRef, { archived: true });
};

// 🔥 Goal 아카이브 해제
export const unarchiveGoal = async (goalId: string) => {
  const goalRef = doc(db, 'goals', goalId);
  await updateDoc(goalRef, { archived: false });
};

// 🔥 Goal 삭제
export const deleteGoal = async (goalId: string) => {
  const goalRef = doc(db, 'goals', goalId);
  await updateDoc(goalRef, { 
    archived: true,
    deletedAt: new Date() 
  });
  // 실제로는 soft delete (archived + deletedAt)
  // 필요시 hard delete: await deleteDoc(goalRef);
};
