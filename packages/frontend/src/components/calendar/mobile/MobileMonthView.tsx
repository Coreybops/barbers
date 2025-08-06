import React from 'react';
import { useCalendarStore } from '../../../store/calendarStore';
import { generateCalendarMonth } from '../../../utils/calendar';
import { format, isSameDay, isToday } from 'date-fns';
import { CalendarEvent } from '../../../types';
import { cn } from '../../../utils/cn';

interface MobileMonthViewProps {
  onEventTap: (event: CalendarEvent, e: React.TouchEvent) => void;
}

export function MobileMonthView({ onEventTap }: MobileMonthViewProps) {
  const {
    settings,
    events,
    selectDate,
    openAppointmentModal
  } = useCalendarStore();

  const monthData = generateCalendarMonth(settings.currentDate, settings, events);

  const handleDayTap = (date: Date) => {
    selectDate(date);
    // Switch to day view on mobile when tapping a day
    useCalendarStore.getState().setView('day');
    useCalendarStore.getState().setCurrentDate(date);
  };

  const renderEvent = (event: CalendarEvent) => {
    const statusColors = {
      PENDING: 'bg-amber-100 text-amber-800',
      CONFIRMED: 'bg-emerald-100 text-emerald-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800',
      NO_SHOW: 'bg-red-100 text-red-800'
    };

    return (
      <div
        key={event.id}
        onTouchStart={(e) => onEventTap(event, e)}
        className={cn(
          'text-xs p-1 mb-1 rounded truncate',
          statusColors[event.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
        )}
      >
        <div className="truncate">
          {format(event.start, 'HH:mm')}
        </div>
      </div>
    );
  };

  const renderDay = (day: any) => {
    const dayEvents = events.filter(event => isSameDay(event.start, day.date));
    const isCurrentMonth = day.isCurrentMonth;
    const isDayToday = isToday(day.date);

    return (
      <div
        key={day.date.toISOString()}
        className={cn(
          'min-h-[80px] p-2 border-b border-r border-gray-200 cursor-pointer active:bg-gray-100',
          !isCurrentMonth && 'bg-gray-50 text-gray-400',
          isDayToday && 'bg-blue-50'
        )}
        onTouchStart={() => handleDayTap(day.date)}
      >
        {/* Day Number */}
        <div className="flex items-center justify-between mb-1">
          <span
            className={cn(
              'text-sm font-medium',
              isDayToday && 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs'
            )}
          >
            {format(day.date, 'd')}
          </span>
          
          {/* Event Count Indicator */}
          {dayEvents.length > 2 && (
            <span className="text-xs text-gray-500 bg-gray-200 px-1 rounded">
              +{dayEvents.length - 2}
            </span>
          )}
        </div>

        {/* Events - Show only first 2 on mobile */}
        <div className="space-y-1">
          {dayEvents.slice(0, 2).map(renderEvent)}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Week Day Headers */}
      <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200 flex-shrink-0">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
          <div key={index} className="p-2 text-center text-sm font-medium text-gray-700">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 grid grid-cols-7 border-l border-t border-gray-200 overflow-y-auto">
        {monthData.weeks.map((week) =>
          week.days.map(renderDay)
        )}
      </div>

      {/* Mobile Footer */}
      <div className="flex-shrink-0 p-3 bg-gray-50 border-t border-gray-200 text-center">
        <p className="text-sm text-gray-600">
          Tap a day to see detailed appointments
        </p>
      </div>
    </div>
  );
}

export default MobileMonthView;