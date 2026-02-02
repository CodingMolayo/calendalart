'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginAnonymously, createGoal } from '@/lib/firebase';
import { generateMandal } from '@/lib/ai';
import { CycleType } from '../../types';
import AppLayout from '@/components/AppLayout';

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
      const user = await loginAnonymously();
      const { mainGoal, subGoals } = await generateMandal(goalText, cycleType);
      const goalId = await createGoal({
        userId: user.uid,
        cycleType,
        mainGoal,
        subGoals,
        createdAt: new Date(),
      });
      router.push(`/goal/${goalId}`);
    } catch (error) {
      console.error(error);
      alert('생성 실패: ' + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center min-h-full p-4 sm:p-8 bg-white rounded-2xl shadow-lg">
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-4 sm:mb-8 text-center text-gray-800">새로운 목표 수립</h1>
        <p className="text-gray-500 mb-6 sm:mb-8 text-center">AI와 함께 체계적인 목표를 세워보세요.</p>

        {/* 기간 선택 */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 w-full max-w-md">
          <button
            onClick={() => setCycleType('weekly')}
            className={`flex-1 px-6 py-3 rounded-xl text-lg font-semibold transition-all duration-200 ${
              cycleType === 'weekly' 
                ? 'bg-blue-500 text-white shadow-lg transform hover:scale-105' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            주간 (1주)
          </button>
          <button
            onClick={() => setCycleType('focus')}
            className={`flex-1 px-6 py-3 rounded-xl text-lg font-semibold transition-all duration-200 ${
              cycleType === 'focus' 
                ? 'bg-purple-500 text-white shadow-lg transform hover:scale-105' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            집중 (8주)
          </button>
        </div>

        {/* 목표 입력 */}
        <textarea
          value={goalText}
          onChange={(e) => setGoalText(e.target.value)}
          placeholder="예: 건강한 식습관 만들기"
          className="w-full max-w-md h-36 p-4 border-2 border-gray-300 rounded-xl mb-6 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
        />

        {/* 생성 버튼 */}
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full max-w-md px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xl font-bold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg transform hover:scale-105"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              생성 중...
            </div>
          ) : '만다라트 생성'}
        </button>
        
        <p className="absolute bottom-4 text-xs text-gray-400">
          v0.0.2-모바일 반응형 및 체크리스트 활성화
        </p>

      </div>
    </AppLayout>
  );
}

// todo : (0) 전체적으로 3*3 board가 3*3 형태로 나타나는 만다라트 구조로.
// todo : (1) 개별 mandalboard를 3*3 형태로 나타내기
// todo : (2) 첫 화면에서, 목표 기간에 따라 예시 문구 다르게 나타내기
// todo : (3) calendar에서 board 눌렀을 때 동작 - board popup + 삭제 버튼
// todo : (4) 모바일 친화성 : 8주 달력 가로로 한 줄. 
// todo : (5) 여러 LLM 모델을 돌아가면서 사용하도록?
// todo : (6) 목표들 지우기, 아카이브화 하기