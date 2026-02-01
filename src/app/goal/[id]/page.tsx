'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getGoal } from '@/lib/firebase';
import { Goal } from '../../../../types';
import MandalBoard from '@/components/MandalBoard';
import Calendar from '@/components/Calendar';

export default function GoalPage() {
  const params = useParams();
  const goalId = params.id as string;
  const [goal, setGoal] = useState<Goal | null>(null);

  useEffect(() => {
    const loadGoal = async () => {
      const data = await getGoal(goalId);
      setGoal(data);
    };
    loadGoal();
  }, [goalId]);

  if (!goal) return <div className="flex items-center justify-center min-h-screen">로딩 중...</div>;

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">{goal.mainGoal}</h1>
      
      {/* 캘린더 */}
      <div className="mb-8">
        <Calendar goalId={goalId} cycleType={goal.cycleType} />
      </div>

      {/* 만다라트 */}
      <MandalBoard goal={goal} onUpdate={() => setGoal(goal)} />
    </div>
  );
}

