//===src/component/calendar.tsx

'use client';

import { CalendarEvent, CycleType, Goal } from '../../types';
import { 
  format, 
  addMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays,
  startOfToday
} from 'date-fns';
import { useDroppable } from '@dnd-kit/core';
import { useState } from 'react';

interface Props {
  goalId: string;
  cycleType: CycleType;
  events: CalendarEvent[];
  goal: Goal;
  onDeleteEvent?: (eventId: string) => void;
  onToggleAction?: (subGoalIndex: number, actionIndex: number) => void;
}

// 체크리스트 팝업
function ChecklistModal({ 
  event,
  goal,
  onClose,
  onDelete,
  onToggleAction
}: { 
  event: CalendarEvent,
  goal: Goal,
  onClose: () => void,
  onDelete: () => void,
  onToggleAction: (subGoalIndex: number, actionIndex: number) => void
}) {
  const subGoal = goal.subGoals[event.subGoalIndex];

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div 
          className="rounded-lg p-4 mb-4"
          style={{ backgroundColor: event.color }}
        >
          <h3 className="text-xl font-bold text-white">{event.title}</h3>
          <p className="text-sm text-white/90 mt-1">
            {format(event.startDate, 'M/d')} - {format(event.endDate, 'M/d')}
          </p>
        </div>

        {/* 체크리스트 */}
        <div className="space-y-2 mb-6">
          <h4 className="font-semibold text-gray-700 mb-3">실행 체크리스트</h4>
          {subGoal.actions.map((action, actIdx) => (
            <label 
              key={actIdx} 
              className="flex items-start gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={action.done}
                onChange={() => onToggleAction(event.subGoalIndex, actIdx)}
                className="mt-1 w-5 h-5 accent-blue-600"
              />
              <span className={`flex-1 text-sm ${action.done ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                {action.text}
              </span>
            </label>
          ))}
        </div>

        {/* 진행률 */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>진행률</span>
            <span className="font-semibold">
              {subGoal.actions.filter(a => a.done).length}/{subGoal.actions.length}
            </span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full transition-all duration-300"
              style={{ 
                width: `${(subGoal.actions.filter(a => a.done).length / subGoal.actions.length) * 100}%`,
                backgroundColor: event.color
              }}
            />
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3">
          <button
            onClick={onDelete}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            🗑️ 삭제
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

// 루틴/주간 캘린더 - 요일별 셀
function DayCell({ 
  date, 
  dayLabel,
  events,
  onEventClick 
}: { 
  date: Date,
  dayLabel: string,
  events: CalendarEvent[],
  onEventClick: (event: CalendarEvent) => void
}) {
  const { isOver, setNodeRef } = useDroppable({ id: date.toISOString() });

  return (
    <div 
      ref={setNodeRef} 
      className={`border rounded-lg p-2 min-h-[100px] md:min-h-[120px] transition-all ${
        isOver ? 'bg-blue-100 scale-105' : 'bg-white'
      } shadow-sm hover:shadow-md`}
    >
      <div className="text-center mb-2">
        <div className="text-xs md:text-sm font-bold text-gray-500">{dayLabel}</div>
        <div className="text-sm md:text-base font-semibold text-gray-700">{format(date, 'd')}일</div>
      </div>
      <div className="space-y-1">
        {events
          .filter(e => isSameDay(e.startDate, date))
          .map(event => (
            <div 
              key={event.id} 
              onClick={() => onEventClick(event)}
              className="text-[10px] md:text-xs p-1.5 rounded-lg shadow-md font-medium truncate cursor-pointer hover:opacity-80 transition-opacity" 
              style={{ backgroundColor: event.color, color: 'white' }}
            >
              {event.title}
            </div>
          ))}
      </div>
    </div>
  );
}

// 월간 캘린더의 주간 행
function MonthlyCalendarWeek({ 
  week, 
  monthStart, 
  events,
  onEventClick 
}: { 
  week: Date[], 
  monthStart: Date, 
  events: CalendarEvent[],
  onEventClick: (event: CalendarEvent) => void
}) {
  const { isOver, setNodeRef } = useDroppable({ id: week[0].toISOString() });
  const weekEvents = events.filter(e => 
    isSameDay(startOfWeek(e.startDate, { weekStartsOn: 0 }), week[0])
  );

  return (
    <div 
      ref={setNodeRef}
      className={`relative transition-colors ${
        isOver ? 'bg-blue-100' : 'bg-white'
      }`}
    >
      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 h-10 md:h-16 border-b">
        {week.map(day => (
          <div 
            key={day.toISOString()} 
            className={`p-0.5 md:p-1 border-r text-center flex items-center justify-center ${
              !isSameMonth(day, monthStart) ? 'text-gray-300 bg-gray-50' : ''
            }`}
          >
            <span className={`text-[8px] md:text-xs ${
              isSameDay(day, new Date()) 
                ? 'bg-blue-500 text-white rounded-full w-4 h-4 md:w-6 md:h-6 flex items-center justify-center font-bold text-[8px] md:text-xs' 
                : ''
            }`}>
              {format(day, 'd')}
            </span>
          </div>
        ))}
      </div>

      {/* 이벤트 라인 */}
      {weekEvents.map(event => (
        <div
          key={event.id}
          onClick={() => onEventClick(event)}
          className="absolute inset-x-0 top-0 h-10 md:h-16 mx-1 md:mx-2 my-0.5 md:my-1 rounded-md md:rounded-lg shadow-md flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity"
          style={{ backgroundColor: event.color + 'E0', color: 'white' }}
        >
          <p className="text-[8px] md:text-sm font-bold truncate px-1 md:px-2">{event.title}</p>
        </div>
      ))}
    </div>
  );
}

export default function Calendar({ cycleType, events, goal, onDeleteEvent, onToggleAction }: Props) {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };

  const handleDelete = () => {
    if (selectedEvent && onDeleteEvent) {
      onDeleteEvent(selectedEvent.id);
      setSelectedEvent(null);
    }
  };

  const handleToggleAction = (subGoalIndex: number, actionIndex: number) => {
    if (onToggleAction) {
      onToggleAction(subGoalIndex, actionIndex);
    }
  };

  // 루틴 캘린더: 일-월 고정
  const renderRoutineCalendar = () => {
    const today = startOfToday();
    const weekStart = startOfWeek(today, { weekStartsOn: 0 }); // 일요일
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];

    return (
      <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-4 md:p-6 shadow-lg">
        <h3 className="text-lg md:text-xl font-bold text-center mb-4 text-green-700">
          🔄 주간 루틴
        </h3>
        <div className="grid grid-cols-7 gap-2">
          {days.map((date, idx) => (
            <DayCell 
              key={date.toISOString()} 
              date={date} 
              dayLabel={dayLabels[idx]}
              events={events}
              onEventClick={handleEventClick}
            />
          ))}
        </div>
      </div>
    );
  };

  // 단기 캘린더: 오늘부터 7일
  const renderWeeklyCalendar = () => {
    const today = startOfToday();
    const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));
    const dayLabels = days.map(d => format(d, 'EEE', { locale: undefined }));

    return (
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 md:p-6 shadow-lg">
        <h3 className="text-lg md:text-xl font-bold text-center mb-4 text-blue-700">
          ⚡ 이번 주 목표
        </h3>
        <div className="grid grid-cols-7 gap-2">
          {days.map((date, idx) => (
            <DayCell 
              key={date.toISOString()} 
              date={date} 
              dayLabel={dayLabels[idx]}
              events={events}
              onEventClick={handleEventClick}
            />
          ))}
        </div>
      </div>
    );
  };

  // 중장기 캘린더: 2개월
  const renderFocusCalendar = () => {
    const currentDate = new Date();
    const months = [currentDate, addMonths(currentDate, 1)];
    
    return (
      <div className="grid grid-cols-2 gap-2 md:gap-4 lg:gap-6">
        {months.map((month, index) => {
          const monthStart = startOfMonth(month);
          const weeks: Date[][] = [];
          const days = eachDayOfInterval({ 
            start: startOfWeek(monthStart, { weekStartsOn: 0 }), 
            end: endOfWeek(endOfMonth(monthStart), { weekStartsOn: 0 }) 
          });
          
          for (let i = 0; i < days.length; i += 7) {
            weeks.push(days.slice(i, i + 7));
          }

          return (
            <div key={index} className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg md:rounded-xl shadow-lg p-2 md:p-4 lg:p-6">
              <h3 className="text-xs md:text-lg lg:text-xl font-bold text-center mb-2 md:mb-4 text-purple-700">
                {format(month, 'yyyy년 M월')}
              </h3>
              
              {/* 요일 헤더 */}
              <div className="grid grid-cols-7 text-center text-[8px] md:text-xs font-bold text-gray-600 mb-1 md:mb-2 border-b pb-1 md:pb-2">
                <div>일</div><div>월</div><div>화</div><div>수</div>
                <div>목</div><div>금</div><div>토</div>
              </div>

              {/* 주간 행들 */}
              <div>
                {weeks.map((week, weekIndex) => (
                  <MonthlyCalendarWeek 
                    key={weekIndex} 
                    week={week} 
                    monthStart={monthStart} 
                    events={events}
                    onEventClick={handleEventClick}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // 타입별 제목
  const getTitle = () => {
    switch (cycleType) {
      case 'routine': return '🔄 주간 루틴';
      case 'weekly': return '⚡ 주간 플랜';
      case 'focus': return '🎯 8주 플랜';
    }
  };

  return (
    <div className="w-full">
      <h2 className="hidden md:block text-xl md:text-2xl font-bold mb-4 md:mb-6 text-gray-800">
        {getTitle()}
      </h2>
      
      {cycleType === 'routine' && renderRoutineCalendar()}
      {cycleType === 'weekly' && renderWeeklyCalendar()}
      {cycleType === 'focus' && renderFocusCalendar()}
      
      {/* 체크리스트 모달 */}
      {selectedEvent && (
        <ChecklistModal
          event={selectedEvent}
          goal={goal}
          onClose={() => setSelectedEvent(null)}
          onDelete={handleDelete}
          onToggleAction={handleToggleAction}
        />
      )}
    </div>
  );
}