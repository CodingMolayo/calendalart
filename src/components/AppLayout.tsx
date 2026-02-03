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

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 사이드바 */}
      <aside
        className={`bg-white shadow-lg transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                   md:translate-x-0 md:relative md:w-64 flex-shrink-0 transition-transform duration-300 ease-in-out z-20 absolute h-full w-full`}>
        <div className="p-4 border-b flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-gray-800">Calendalart</Link>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <nav className="flex-grow p-4 space-y-2">
          <Link href="/" className="block px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100">
            + 새로운 목표 수립하기
          </Link>
          <h3 className="px-4 pt-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">내 목표 목록</h3>
          {goals.map(goal => (
            <Link
              key={goal.id}
              href={`/goal/${goal.id}`}
              className={`block px-4 py-2 text-sm font-medium rounded-lg truncate ${
                pathname === `/goal/${goal.id}`
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}>
              {goal.mainGoal}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex flex-col flex-1">
        {/* 상단 바 */}
        <header className="bg-white shadow-md md:hidden flex items-center p-4">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
          </button>
          <div className="flex-grow text-center text-xl font-bold text-gray-800">
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
