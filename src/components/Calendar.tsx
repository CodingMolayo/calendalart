'use client';

import { CalendarEvent, CycleType } from '../../types';
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
  addDays 
} from 'date-fns';
import { useDroppable } from '@dnd-kit/core';
import { useState } from 'react';

interface Props {
  goalId: string;
  cycleType: CycleType;
  events: CalendarEvent[];
}

function WeeklyCalendarDay({ date, events }: { date: Date, events: CalendarEvent[] }) {
  const { isOver, setNodeRef } = useDroppable({ id: date.toISOString() });

  return (
    <div 
      ref={setNodeRef} 
      className={`calendar-day border rounded-lg p-2 min-h-[120px] transition-colors shadow-sm ${
        isOver ? 'bg-blue-100' : 'bg-white'
      }`}
    >
      <div className="text-center text-sm font-semibold text-gray-600">{format(date, 'd')}일</div>
      <div className="mt-2 space-y-1">
        {events
          .filter(e => isSameDay(e.startDate, date))
          .map(event => (
            <div key={event.id} className="text-xs p-1.5 rounded-lg shadow-md font-medium truncate" style={{ backgroundColor: event.color, color: 'white' }}>
              {event.title}
            </div>
          ))}
      </div>
    </div>
  );
}

function MonthlyCalendarWeek({ week, monthStart, events }: { week: Date[], monthStart: Date, events: CalendarEvent[] }) {
  const { isOver, setNodeRef } = useDroppable({ id: week[0].toISOString() });

  return (
    <div 
      ref={setNodeRef}
      className={`grid grid-cols-7 h-24 border rounded-md transition-colors relative ${
        isOver ? 'bg-blue-100' : 'bg-white hover:bg-gray-50'
      }`}
    >
      {week.map(day => (
        <div key={day.toISOString()} className={`p-1 border-r text-center ${!isSameMonth(day, monthStart) ? 'text-gray-300' : ''}`}>
          <span className={`text-[10px] ${isSameDay(day, new Date()) ? 'bg-blue-500 text-white rounded-full p-1' : ''}`}>
            {format(day, 'd')}
          </span>
        </div>
      ))}
      {events.filter(e => isSameDay(startOfWeek(e.startDate, { weekStartsOn: 0 }), week[0])).map(event => (
        <div
          key={event.id}
          className="absolute inset-0 bg-opacity-70 m-1 p-1 rounded-lg shadow flex items-center justify-center"
          style={{ backgroundColor: event.color, color: 'white' }}
        >
          <p className="text-xs font-bold text-center truncate">{event.title}</p>
        </div>
      ))}
    </div>
  )
}

export default function Calendar({ cycleType, events }: Props) {
  const [currentDate] = useState(new Date());

  const renderWeeklyCalendar = () => {
    const days = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));
    return (
      <div className="grid grid-cols-7 gap-2">
        {days.map(date => <WeeklyCalendarDay key={date.toISOString()} date={date} events={events} />)}
      </div>
    );
  };

  const renderMonthlyCalendars = () => {
    const months = [currentDate, addMonths(currentDate, 1)];
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {months.map((month, index) => renderMonth(month, index))}
      </div>
    );
  };

  const renderMonth = (date: Date, monthIndex: number) => {
    const monthStart = startOfMonth(date);
    const weeks: Date[][] = [];
    const days = eachDayOfInterval({ start: startOfWeek(monthStart, { weekStartsOn: 0 }), end: endOfWeek(endOfMonth(monthStart), { weekStartsOn: 0 }) });
    for (let i = 0; i < days.length; i += 7) {
        weeks.push(days.slice(i, i + 7));
    }

    return (
      <div key={monthIndex} className="bg-white rounded-xl shadow-lg p-4 md:p-6">
        <h3 className="text-lg font-bold text-center mb-4">{format(date, 'yyyy년 M월')}</h3>
        <div className="grid grid-cols-7 text-center text-xs font-bold text-gray-500 mb-2">
          <div>일</div><div>월</div><div>화</div><div>수</div><div>목</div><div>금</div><div>토</div>
        </div>
        <div className="space-y-1">
          {weeks.map((week, weekIndex) => (
            <MonthlyCalendarWeek key={weekIndex} week={week} monthStart={monthStart} events={events} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">캘린더</h2>
      {cycleType === 'weekly' ? renderWeeklyCalendar() : renderMonthlyCalendars()}
    </div>
  );
}
