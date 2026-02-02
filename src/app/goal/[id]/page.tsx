//===src/app/goal/[id]/page.tsx

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { getGoal, getCalendarEvents, addCalendarEvent } from '@/lib/firebase';
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

  // For updates triggered by user actions (drag-end, toggle)
  const loadData = useCallback(async () => {
    if (goalId) {
      const goalData = await getGoal(goalId);
      const eventsData = await getCalendarEvents(goalId);
      setGoal(goalData);
      setEvents(eventsData);
    }
  }, [goalId]);

  // For the initial data load when the component mounts or goalId changes
  useEffect(() => {
    if (goalId) {
      const fetchInitialData = async () => {
        const goalData = await getGoal(goalId);
        const eventsData = await getCalendarEvents(goalId);
        setGoal(goalData);
        setEvents(eventsData);
      };
      fetchInitialData();
    }
  }, [goalId]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.data.current) {
      const { subGoalIndex, title, color } = active.data.current;
      const dropDate = new Date(over.id as string);
      
      if (!goal) return;

      const startDate = goal.cycleType === 'focus' ? startOfWeek(dropDate, { weekStartsOn: 0 }) : dropDate;
      const endDate = goal.cycleType === 'focus' ? endOfWeek(dropDate, { weekStartsOn: 0 }) : new Date(dropDate.getTime() + 24 * 60 * 60 * 1000);

      const newEventData = { subGoalIndex, title, color, startDate, endDate };

      await addCalendarEvent(goalId, newEventData);
      loadData(); // Reload data after adding an event
    }
  };

  if (!goal) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-full">로딩 중...</div>
      </AppLayout>
    );
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <AppLayout>
        <div className="p-4 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 text-center">{goal.mainGoal}</h1>
          
          <div className="mb-8">
            <Calendar 
              goalId={goalId} 
              cycleType={goal.cycleType} 
              events={events}
            />
          </div>

          <MandalBoard 
            goal={goal} 
            onUpdate={loadData} 
          />
        </div>
      </AppLayout>
    </DndContext>
  );
}
