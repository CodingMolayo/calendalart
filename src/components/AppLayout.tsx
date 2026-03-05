//===src/component/AppLayout.tsx

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Goal } from '../../types';
import { getUserGoals, auth, archiveGoal, unarchiveGoal, deleteGoal } from '@/lib/firebase';

// 목표 메뉴 모달
function GoalMenu({ 
  goal, 
  onClose,
  onArchive,
  onDelete 
}: { 
  goal: Goal,
  onClose: () => void,
  onArchive: () => void,
  onDelete: () => void
}) {
  return (
    <div 
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl p-4 w-64"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-bold text-gray-800 mb-3 truncate">{goal.mainGoal}</h3>
        <div className="space-y-2">
          <button
            onClick={() => {
              onArchive();
              onClose();
            }}
            className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
          >
            📦 {goal.archived ? '아카이브 해제' : '아카이브'}
          </button>
          <button
            onClick={() => {
              if (confirm('정말 삭제하시겠습니까?\n(아카이브로 이동됩니다)')) {
                onDelete();
                onClose();
              }
            }}
            className="w-full text-left px-4 py-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors flex items-center gap-2"
          >
            🗑️ 삭제
          </button>
          <button
            onClick={onClose}
            className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  const loadGoals = async (userId: string) => {
    const allGoals = await getUserGoals(userId);
    setGoals(allGoals);
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        loadGoals(user.uid);
      } else {
        setGoals([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // 아카이브/삭제 핸들러
  const handleArchive = async (goal: Goal) => {
    try {
      if (goal.archived) {
        await unarchiveGoal(goal.id);
      } else {
        await archiveGoal(goal.id);
      }
      const user = auth.currentUser;
      if (user) loadGoals(user.uid);
    } catch (error) {
      console.error('아카이브 실패:', error);
      alert('작업에 실패했습니다.');
    }
  };

  const handleDelete = async (goal: Goal) => {
    try {
      await deleteGoal(goal.id);
      const user = auth.currentUser;
      if (user) loadGoals(user.uid);
      
      // 현재 페이지가 삭제된 목표 페이지면 홈으로 이동
      if (pathname === `/goal/${goal.id}`) {
        router.push('/');
      }
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  // 활성/아카이브 목표 필터링
  const activeGoals = goals.filter(g => !g.archived);
  const archivedGoals = goals.filter(g => g.archived);

  // 타입별로 목표 분류 (활성 목표만)
  const routineGoals = activeGoals.filter(g => g.cycleType === 'routine');
  const weeklyGoals = activeGoals.filter(g => g.cycleType === 'weekly');
  const focusGoals = activeGoals.filter(g => g.cycleType === 'focus');

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
            <div key={goal.id} className="relative group">
              <Link
                href={`/goal/${goal.id}`}
                className={`block px-4 py-2 pr-10 text-sm font-medium rounded-lg truncate mx-2 ${
                  pathname === `/goal/${goal.id}`
                    ? `bg-opacity-20 font-bold`
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                style={pathname === `/goal/${goal.id}` ? { backgroundColor: color + '30', color } : {}}>
                {goal.mainGoal}
              </Link>
              
              {/* 메뉴 버튼 */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedGoal(goal);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200 transition-all"
              >
                <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
                </svg>
              </button>
            </div>
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
          {activeGoals.length > 0 && (
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

          {/* 아카이브 토글 */}
          {archivedGoals.length > 0 && (
            <div className="border-t pt-4 mt-4">
              <button
                onClick={() => setShowArchived(!showArchived)}
                className="w-full px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  📦 아카이브
                  <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-[10px]">
                    {archivedGoals.length}
                  </span>
                </span>
                <svg 
                  className={`w-4 h-4 transition-transform ${showArchived ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* 아카이브된 목표 목록 */}
              {showArchived && (
                <div className="mt-2 space-y-1">
                  {archivedGoals.map(goal => (
                    <div key={goal.id} className="relative group">
                      <Link
                        href={`/goal/${goal.id}`}
                        className="block px-4 py-2 pr-10 text-sm text-gray-500 rounded-lg truncate mx-2 hover:bg-gray-100"
                      >
                        {goal.mainGoal}
                      </Link>
                      
                      {/* 메뉴 버튼 */}
                      <button
                        onClick={() => setSelectedGoal(goal)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200 transition-all"
                      >
                        <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 빈 상태 */}
          {activeGoals.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-gray-500 mb-2">아직 목표가 없습니다</p>
              <p className="text-xs text-gray-400">위 버튼을 눌러 첫 목표를 만들어보세요!</p>
            </div>
          )}
        </nav>

          {/* 버전 정 */}
        <div className="flex-shrink-0 p-4 border-t">
          <p className="text-xs text-center text-gray-400">
            v0.2.0. modal pop-up
          </p>
        </div>
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

      {/* 목표 메뉴 모달 */}
      {selectedGoal && (
        <GoalMenu
          goal={selectedGoal}
          onClose={() => setSelectedGoal(null)}
          onArchive={() => handleArchive(selectedGoal)}
          onDelete={() => handleDelete(selectedGoal)}
        />
      )}
    </div>
  );
}