'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { 
  getGoal, 
  getCalendarEvents, 
  addCalendarEvent,
  deleteCalendarEvent,
  toggleAction
} from '@/lib/firebase';
import { Goal, CalendarEvent } from '../../../../types';
import MandalBoard from '@/components/MandalBoard';
import Calendar from '@/components/Calendar';
import AppLayout from '@/components/AppLayout';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { startOfWeek, endOfWeek } from 'date-fns';

export default function GoalPage() {
  const params = useParams();
  const goalId = params.id as string;
  const [goal, setGoal] = useState<Goal | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  const loadData = useCallback(async () => {
    if (goalId) {
      const goalData = await getGoal(goalId);
      const eventsData = await getCalendarEvents(goalId);
      setGoal(goalData);
      setEvents(eventsData);
    }
  }, [goalId]);

  useEffect(() => {
    const fetchData = async () => {
      if (goalId) {
        await loadData();
      }
    };
    fetchData();
  }, [goalId, loadData]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.data.current) {
      const { subGoalIndex, title, color } = active.data.current;
      const dropDate = new Date(over.id as string);
      
      if (!goal) return;

      const startDate = goal.cycleType === 'focus' 
        ? startOfWeek(dropDate, { weekStartsOn: 0 }) 
        : dropDate;
      
      const endDate = goal.cycleType === 'focus' 
        ? endOfWeek(dropDate, { weekStartsOn: 0 }) 
        : new Date(dropDate.getTime() + 24 * 60 * 60 * 1000);

      const newEventData = { 
        subGoalIndex, 
        title, 
        color, 
        startDate, 
        endDate 
      };

      try {
        await addCalendarEvent(goalId, newEventData);
        await loadData();
      } catch (error) {
        console.error('이벤트 추가 실패:', error);
        alert('일정 등록에 실패했습니다.');
      }
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteCalendarEvent(goalId, eventId);
      await loadData();
    } catch (error) {
      console.error('이벤트 삭제 실패:', error);
      alert('일정 삭제에 실패했습니다.');
    }
  };

  const handleToggleAction = async (subGoalIndex: number, actionIndex: number) => {
    try {
      await toggleAction(goalId, subGoalIndex, actionIndex);
      await loadData();
    } catch (error) {
      console.error('Action 토글 실패:', error);
    }
  };

  if (!goal) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">로딩 중...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <AppLayout>
        <div className="p-4 md:p-8 space-y-8">
          <h1 className="text-2xl md:text-3xl font-bold text-center text-gray-900">
            {goal.mainGoal}
          </h1>
          
          <Calendar 
            goalId={goalId} 
            cycleType={goal.cycleType} 
            events={events}
            goal={goal}
            onDeleteEvent={handleDeleteEvent}
            onToggleAction={handleToggleAction}
          />

          <MandalBoard 
            goal={goal} 
            onUpdate={loadData} 
          />
        </div>
      </AppLayout>
    </DndContext>
  );
}