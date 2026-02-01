import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDoc, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { Goal, SubGoal } from '../../types';

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
  return { id: docSnap.id, ...docSnap.data() } as Goal;
};

// 사용자 Goal 목록 (최대 3개 제한)
export const getUserGoals = async (userId: string): Promise<Goal[]> => {
  const q = query(collection(db, 'goals'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal));
};

// SubGoal 업데이트 (Action 체크 or Lock)
export const updateSubGoal = async (goalId: string, subGoalIndex: number, updates: Partial<SubGoal>) => {
  const goalRef = doc(db, 'goals', goalId);
  const goalSnap = await getDoc(goalRef);
  if (!goalSnap.exists()) return;

  const goal = goalSnap.data() as Goal;
  goal.subGoals[subGoalIndex] = { ...goal.subGoals[subGoalIndex], ...updates };
  
  await updateDoc(goalRef, { subGoals: goal.subGoals });
};

// Action 체크 토글
export const toggleAction = async (goalId: string, subGoalIndex: number, actionIndex: number) => {
  const goalRef = doc(db, 'goals', goalId);
  const goalSnap = await getDoc(goalRef);
  if (!goalSnap.exists()) return;

  const goal = goalSnap.data() as Goal;
  goal.subGoals[subGoalIndex].actions[actionIndex].done = 
    !goal.subGoals[subGoalIndex].actions[actionIndex].done;
  
  await updateDoc(goalRef, { subGoals: goal.subGoals });
};

