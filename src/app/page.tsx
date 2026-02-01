'use client';

// 🔥 임시 디버깅 코드
console.log('Firebase 설정 확인:', {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅ 있음' : '❌ 없음',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✅ 있음' : '❌ 없음',
});

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginAnonymously, createGoal } from '@/lib/firebase';
import { generateMandal } from '@/lib/ai';
import { CycleType } from '../../types';

export default function WelcomePage() {
  const router = useRouter();
  const [cycleType, setCycleType] = useState<CycleType>('weekly');
  const [goalText, setGoalText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!goalText.trim()) {
      alert('목표를 입력해주세요');
      return;
    }

    setLoading(true);
    try {
      // 1. 익명 로그인
      const user = await loginAnonymously();

      // 2. AI로 만다라트 생성
      const { mainGoal, subGoals } = await generateMandal(goalText, cycleType);

      // 3. Firestore에 저장
      const goalId = await createGoal({
        userId: user.uid,
        cycleType,
        mainGoal,
        subGoals,
        createdAt: new Date(),
      });

      // 4. 메인 화면으로 이동
      router.push(`/goal/${goalId}`);
    } catch (error) {
      console.error(error);
      alert('생성 실패: ' + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-8">Calendalart</h1>
      <p className="text-gray-600 mb-8">목표를 입력하면 AI가 만다라트로 만들어드립니다</p>

      {/* 기간 선택 */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setCycleType('weekly')}
          className={`px-6 py-3 rounded-lg ${
            cycleType === 'weekly' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          주간 (1주)
        </button>
        <button
          onClick={() => setCycleType('focus')}
          className={`px-6 py-3 rounded-lg ${
            cycleType === 'focus' ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          집중 (8주)
        </button>
      </div>

      {/* 목표 입력 */}
      <textarea
        value={goalText}
        onChange={(e) => setGoalText(e.target.value)}
        placeholder="예: 토익 800점 달성하기"
        className="w-full max-w-md h-32 p-4 border rounded-lg mb-4"
      />

      {/* 생성 버튼 */}
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
      >
        {loading ? '생성 중...' : '만다라트 생성'}
      </button>
    </div>
  );
}

