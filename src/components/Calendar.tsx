//===src/component/calendar.tsx

'use client';

import { CalendarEvent, CycleType, Goal } from '../../types';
import { 
  format, 
  addMonths, 
  subMonths,
  addWeeks,
  subWeeks,
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays,
  startOfToday,
  isToday
} from 'date-fns';
import { ko } from 'date-fns/locale';
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
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto animate-[fadeIn_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div 
          className="rounded-xl p-5 mb-4 shadow-md"
          style={{ 
            background: `linear-gradient(135deg, ${event.color}, ${event.color}dd)` 
          }}
        >
          <h3 className="text-xl font-bold text-white">{event.title}</h3>
          <p className="text-sm text-white/90 mt-1 flex items-center gap-2">
            📅 {format(event.startDate, 'M월 d일')} - {format(event.endDate, 'M월 d일')}
          </p>
        </div>

        {/* 체크리스트 */}
        <div className="space-y-2 mb-6">
          <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            ✓ 실행 체크리스트
          </h4>
          {subGoal.actions.map((action, actIdx) => (
            <label 
              key={actIdx} 
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-all group border border-transparent hover:border-gray-200"
            >
              <input
                type="checkbox"
                checked={action.done}
                onChange={() => onToggleAction(event.subGoalIndex, actIdx)}
                className="mt-1 w-5 h-5 rounded accent-blue-600 cursor-pointer"
              />
              <span className={`flex-1 text-sm transition-all ${
                action.done 
                  ? 'line-through text-gray-500' 
                  : 'text-gray-800 group-hover:text-gray-900'
              }`}>
                {action.text}
              </span>
            </label>
          ))}
        </div>

        {/* 진행률 */}
        <div className="mb-6 bg-gray-50 rounded-xl p-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span className="font-medium">진행률</span>
            <span className="font-bold text-gray-800">
              {subGoal.actions.filter(a => a.done).length}/{subGoal.actions.length}
            </span>
          </div>
          <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full transition-all duration-500 rounded-full"
              style={{ 
                width: `${(subGoal.actions.filter(a => a.done).length / subGoal.actions.length) * 100}%`,
                background: `linear-gradient(90deg, ${event.color}, ${event.color}cc)`
              }}
            />
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3">
          <button
            onClick={onDelete}
            className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg"
          >
            🗑️ 삭제
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-xl transition-all"
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
  const today = isToday(date);

  return (
    <div 
      ref={setNodeRef} 
      className={`border-2 rounded-xl p-2 md:p-3 min-h-[100px] md:min-h-[120px] transition-all duration-200 ${
        isOver 
          ? 'bg-blue-50 border-blue-400 scale-105 shadow-lg' 
          : today
            ? 'bg-blue-50/50 border-blue-300 shadow-md'
            : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
      }`}
    >
      <div className="text-center mb-2">
        <div className="text-xs md:text-sm font-bold text-gray-500">{dayLabel}</div>
        <div className={`text-sm md:text-base font-bold ${
          today ? 'text-blue-600' : 'text-gray-700'
        }`}>
          {format(date, 'd')}일
        </div>
      </div>
      <div className="space-y-1.5">
        {events
          .filter(e => isSameDay(e.startDate, date))
          .map(event => (
            <div 
              key={event.id} 
              onClick={() => onEventClick(event)}
              className="text-[10px] md:text-xs p-2 rounded-lg shadow-md font-medium truncate cursor-pointer hover:opacity-90 hover:scale-105 transition-all" 
              style={{ 
                background: `linear-gradient(135deg, ${event.color}, ${event.color}dd)`,
                color: 'white' 
              }}
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
      className={`relative transition-all rounded-lg overflow-hidden ${
        isOver ? 'bg-blue-50' : 'bg-white'
      }`}
    >
      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 h-10 md:h-16 border-b border-gray-200">
        {week.map(day => {
          const today = isToday(day);
          return (
            <div 
              key={day.toISOString()} 
              className={`p-0.5 md:p-1 border-r border-gray-100 text-center flex items-center justify-center ${
                !isSameMonth(day, monthStart) ? 'text-gray-300 bg-gray-50' : ''
              }`}
            >
              <span className={`text-[8px] md:text-xs font-medium ${
                today
                  ? 'bg-blue-500 text-white rounded-full w-5 h-5 md:w-7 md:h-7 flex items-center justify-center font-bold shadow-md' 
                  : ''
              }`}>
                {format(day, 'd')}
              </span>
            </div>
          );
        })}
      </div>

      {/* 이벤트 라인 */}
      {weekEvents.map(event => (
        <div
          key={event.id}
          onClick={() => onEventClick(event)}
          className="absolute inset-x-0 top-0 h-10 md:h-16 mx-1 md:mx-2 my-0.5 md:my-1 rounded-lg shadow-lg flex items-center justify-center cursor-pointer hover:scale-[1.02] transition-all"
          style={{ 
            background: `linear-gradient(135deg, ${event.color}, ${event.color}dd)`,
            color: 'white' 
          }}
        >
          <p className="text-[8px] md:text-sm font-bold truncate px-1 md:px-2">{event.title}</p>
        </div>
      ))}
    </div>
  );
}

// 네비게이션 버튼
function NavButton({ 
  onClick, 
  children, 
  disabled 
}: { 
  onClick: () => void, 
  children: React.ReactNode,
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
    >
      {children}
    </button>
  );
}

export default function Calendar({ cycleType, events, goal, onDeleteEvent, onToggleAction }: Props) {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

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

  // 루틴 캘린더: 일-월 고정 (주 단위 네비게이션)
  const renderRoutineCalendar = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];

    return (
      <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-2xl p-4 md:p-6 shadow-xl border border-green-100">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <NavButton onClick={() => setCurrentDate(subWeeks(currentDate, 1))}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </NavButton>
          
          <h3 className="text-lg md:text-xl font-bold text-green-700 flex items-center gap-2">
            🔄 {format(weekStart, 'M월 d일', { locale: ko })} 주
          </h3>
          
          <NavButton onClick={() => setCurrentDate(addWeeks(currentDate, 1))}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </NavButton>
        </div>

        {/* 오늘로 돌아가기 */}
        <button
          onClick={() => setCurrentDate(new Date())}
          className="w-full mb-4 py-2 text-sm text-green-600 hover:text-green-700 font-medium transition-colors"
        >
          📍 오늘로 이동
        </button>

        {/* 캘린더 그리드 */}
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

  // 단기 캘린더: 오늘부터 7일 (일 단위 네비게이션)
  const renderWeeklyCalendar = () => {
    const days = Array.from({ length: 7 }, (_, i) => addDays(currentDate, i));
    const dayLabels = days.map(d => format(d, 'EEE', { locale: ko }));

    return (
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-4 md:p-6 shadow-xl border border-blue-100">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <NavButton onClick={() => setCurrentDate(addDays(currentDate, -7))}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </NavButton>
          
          <h3 className="text-lg md:text-xl font-bold text-blue-700 flex items-center gap-2">
            ⚡ {format(currentDate, 'M월 d일', { locale: ko })}부터 7일
          </h3>
          
          <NavButton onClick={() => setCurrentDate(addDays(currentDate, 7))}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </NavButton>
        </div>

        {/* 오늘로 돌아가기 */}
        <button
          onClick={() => setCurrentDate(startOfToday())}
          className="w-full mb-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          📍 오늘로 이동
        </button>

        {/* 캘린더 그리드 */}
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

  // 중장기 캘린더: 2개월 (월 단위 네비게이션)
  const renderFocusCalendar = () => {
    const months = [currentDate, addMonths(currentDate, 1)];
    
    return (
      <div>
        {/* 네비게이션 */}
        <div className="flex items-center justify-between mb-4">
          <NavButton onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </NavButton>
          
          <h3 className="text-lg md:text-xl font-bold text-purple-700">
            {format(currentDate, 'yyyy년 M월', { locale: ko })}
          </h3>
          
          <NavButton onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </NavButton>
        </div>

        {/* 오늘로 돌아가기 */}
        <button
          onClick={() => setCurrentDate(new Date())}
          className="w-full mb-4 py-2 text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors"
        >
          📍 오늘로 이동
        </button>

        {/* 2개월 그리드 */}
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
              <div key={index} className="bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 rounded-xl md:rounded-2xl shadow-xl p-2 md:p-4 lg:p-6 border border-purple-100">
                <h3 className="text-xs md:text-lg lg:text-xl font-bold text-center mb-2 md:mb-4 text-purple-700">
                  {format(month, 'yyyy년 M월', { locale: ko })}
                </h3>
                
                {/* 요일 헤더 */}
                <div className="grid grid-cols-7 text-center text-[8px] md:text-xs font-bold text-gray-600 mb-1 md:mb-2 border-b border-purple-200 pb-1 md:pb-2">
                  <div>일</div><div>월</div><div>화</div><div>수</div>
                  <div>목</div><div>금</div><div>토</div>
                </div>

                {/* 주간 행들 */}
                <div className="space-y-1">
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
      </div>
    );
  };

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