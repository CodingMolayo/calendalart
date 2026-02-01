'use client';

import { useState } from 'react';
import { CycleType, CalendarEvent } from '../../types';
import { updateSubGoal } from '@/lib/firebase';

interface Props {
  goalId: string;
  cycleType: CycleType;
}

export default function Calendar({ goalId, cycleType }: Props) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  // 드래그 시작 (데이터 전달)
  const handleDragStart = (e: React.DragEvent, subGoalIndex: number, title: string, color: string) => {
    e.dataTransfer.setData('subGoalIndex', subGoalIndex.toString());
    e.dataTransfer.setData('title', title);
    e.dataTransfer.setData('color', color);
  };

  // 드롭 처리
  const handleDrop = async (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    const subGoalIndex = parseInt(e.dataTransfer.getData('subGoalIndex'));
    const title = e.dataTransfer.getData('title');
    const color = e.dataTransfer.getData('color');

    // 경고 표시
    if (!confirm('캘린더에 등록하면 Sub-goal을 수정할 수 없습니다. 계속하시겠습니까?')) {
      return;
    }

    // 일정 추가
    const newEvent: CalendarEvent = {
      id: Date.now().toString(),
      subGoalIndex,
      title,
      color,
      startDate: date,
      endDate: new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000), // 기본 7일
    };
    setEvents([...events, newEvent]);

    // Sub-goal Lock 처리
    await updateSubGoal(goalId, subGoalIndex, { locked: true });
  };

  // 간단한 주간 캘린더 (실제는 라이브러리 사용 권장)
  const days = Array.from({ length: cycleType === 'weekly' ? 7 : 56 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return date;
  });

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">캘린더</h2>
      <div className="grid grid-cols-7 gap-2">
        {days.map((date, idx) => (
          <div
            key={idx}
            onDrop={(e) => handleDrop(e, date)}
            onDragOver={(e) => e.preventDefault()}
            className="border rounded p-2 min-h-[80px] hover:bg-gray-50"
          >
            <div className="text-sm text-gray-600">{date.getDate()}일</div>
            {/* 해당 날짜의 일정 표시 */}
            {events
              .filter(e => e.startDate.toDateString() === date.toDateString())
              .map(event => (
                <div
                  key={event.id}
                  className="text-xs p-1 rounded mt-1"
                  style={{ backgroundColor: event.color, color: 'white' }}
                >
                  {event.title}
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}