//===src/component/AppLayout.tsx

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Goal } from '../../types';
import { getUserGoals, auth } from '@/lib/firebase';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        getUserGoals(user.uid).then(setGoals);
      } else {
        setGoals([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // 타입별로 목표 분류
  const routineGoals = goals.filter(g => g.cycleType === 'routine');
  const weeklyGoals = goals.filter(g => g.cycleType === 'weekly');
  const focusGoals = goals.filter(g => g.cycleType === 'focus');

  // 목표 그룹 렌더링
  const renderGoalGroup = (title: string, emoji: string, groupGoals: Goal[], color: string) => {
    if (groupGoals.length === 0) return null;
    
    return (
      <div className="mb-4">
        <h3 className="px-4 py-2 text-xs font-semibold uppercase tracking-wider flex items-center gap-2"
            style={{ color }}>
          <span>{emoji}</span>
          <span>{title}</span>
          <span className="ml-auto bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-[10px]">
            {groupGoals.length}
          </span>
        </h3>
        <div className="space-y-1">
          {groupGoals.map(goal => (
            <Link
              key={goal.id}
              href={`/goal/${goal.id}`}
              className={`block px-4 py-2 text-sm font-medium rounded-lg truncate mx-2 ${
                pathname === `/goal/${goal.id}`
                  ? `bg-opacity-20 font-bold`
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              style={pathname === `/goal/${goal.id}` ? { backgroundColor: color + '30', color } : {}}>
              {goal.mainGoal}
            </Link>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 사이드바 */}
      <aside
        className={`bg-white shadow-lg transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                   md:translate-x-0 md:relative md:w-64 flex-shrink-0 transition-transform duration-300 ease-in-out z-20 absolute h-full w-full overflow-y-auto`}>
        
        {/* 헤더 */}
        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
          <Link href="/" className="text-2xl font-bold text-gray-800">
            Calendalart
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 네비게이션 */}
        <nav className="flex-grow p-4 space-y-2">
          <Link 
            href="/" 
            className="block px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg hover:opacity-90 transition-opacity text-center shadow-md"
          >
            ✨ 새로운 목표 수립하기
          </Link>

          {/* 구분선 */}
          {goals.length > 0 && (
            <div className="border-t pt-4 mt-4">
              <h2 className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                내 목표 목록
              </h2>
            </div>
          )}

          {/* 타입별 목표 그룹 */}
          {renderGoalGroup('루틴', '🔄', routineGoals, '#10b981')}
          {renderGoalGroup('단기 목표', '⚡', weeklyGoals, '#3b82f6')}
          {renderGoalGroup('중장기 목표', '🎯', focusGoals, '#8b5cf6')}

          {/* 빈 상태 */}
          {goals.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-gray-500 mb-2">아직 목표가 없습니다</p>
              <p className="text-xs text-gray-400">위 버튼을 눌러 첫 목표를 만들어보세요!</p>
            </div>
          )}
        </nav>
      </aside>

      <div className="flex flex-col flex-1">
        {/* 상단 바 (모바일) */}
        <header className="bg-white shadow-md md:hidden flex items-center p-4 sticky top-0 z-10">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
          <div className="flex-grow text-center text-lg font-bold text-gray-800">
            {pathname === '/' ? '새 목표' : goals.find(g => `/goal/${g.id}` === pathname)?.mainGoal || '목표'}
          </div>
        </header>

        {/* 메인 콘텐츠 */}
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}