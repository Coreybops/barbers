import React from 'react';
import { useCalendarStore } from '../../../store/calendarStore';
import { generateCalendarMonth } from '../../../utils/calendar';
import { format, isSameDay, isToday } from 'date-fns';
import { CalendarEvent } from '../../../types';
import { cn } from '../../../utils/cn';

export function MonthView() {
  const {
    settings,
    events,
    selectDate,
    selectEvent,
    openAppointmentModal,
    dragDropContext,
    setDropTarget
  } = useCalendarStore();

  const monthData = generateCalendarMonth(settings.currentDate, settings, events);

  const handleDayClick = (date: Date) => {
    selectDate(date);
    // Open appointment modal for creating new appointment
    openAppointmentModal(false);
  };

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    selectEvent(event);
  };

  const handleDragStart = (event: CalendarEvent, e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    useCalendarStore.getState().startDrag(event);
  };

  const handleDragOver = (date: Date, e: React.DragEvent) => {
    if (dragDropContext.isDragging) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDropTarget({ date });
    }
  };

  const handleDrop = (date: Date, e: React.DragEvent) => {
    e.preventDefault();
    useCalendarStore.getState().endDrag();
  };

  const renderEvent = (event: CalendarEvent) => {
    const statusColors = {
      PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
      CONFIRMED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      IN_PROGRESS: 'bg-blue-100 text-blue-800 border-blue-200',
      COMPLETED: 'bg-gray-100 text-gray-800 border-gray-200',
      CANCELLED: 'bg-red-100 text-red-800 border-red-200',
      NO_SHOW: 'bg-red-100 text-red-800 border-red-200'
    };

    return (
      <div
        key={event.id}
        draggable={event.type === 'appointment'}
        onDragStart={(e) => handleDragStart(event, e)}
        onClick={(e) => handleEventClick(event, e)}
        className={cn(
          'text-xs p-1 mb-1 rounded border cursor-pointer truncate transition-colors',
          statusColors[event.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800 border-gray-200',
          event.type === 'appointment' && 'hover:shadow-sm',
          dragDropContext.draggedEvent?.id === event.id && 'opacity-50'
        )}
        title={`${event.title} (${format(event.start, 'HH:mm')} - ${format(event.end, 'HH:mm')})`}
      >
        <div className="font-medium truncate">
          {format(event.start, 'HH:mm')} {event.title}
        </div>
      </div>
    );
  };

  const renderDay = (day: any) => {
    const dayEvents = events.filter(event => isSameDay(event.start, day.date));
    const isCurrentMonth = day.isCurrentMonth;
    const isDayToday = isToday(day.date);
    const isDropTarget = dragDropContext.dropTarget && 
      isSameDay(dragDropContext.dropTarget.date, day.date);

    return (
      <div
        key={day.date.toISOString()}
        className={cn(
          'min-h-[120px] p-2 border-b border-r border-gray-200 cursor-pointer transition-colors',
          'hover:bg-gray-50',
          !isCurrentMonth && 'bg-gray-50 text-gray-400',
          isDayToday && 'bg-blue-50',
          isDropTarget && dragDropContext.isDragging && 'bg-blue-100 border-blue-300'
        )}
        onClick={() => handleDayClick(day.date)}
        onDragOver={(e) => handleDragOver(day.date, e)}
        onDrop={(e) => handleDrop(day.date, e)}
      >
        {/* Day Number */}
        <div className="flex items-center justify-between mb-2">
          <span
            className={cn(
              'text-sm font-medium',
              isDayToday && 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs'
            )}
          >
            {format(day.date, 'd')}
          </span>
          
          {/* Event Count Indicator */}
          {dayEvents.length > 3 && (
            <span className="text-xs text-gray-500 bg-gray-200 px-1 rounded">
              +{dayEvents.length - 3}
            </span>
          )}
        </div>

        {/* Events */}
        <div className="space-y-1">
          {dayEvents.slice(0, 3).map(renderEvent)}
        </div>

        {/* Drop Zone Indicator */}
        {isDropTarget && dragDropContext.isDragging && (
          <div className="absolute inset-0 border-2 border-dashed border-blue-400 bg-blue-50 bg-opacity-50 rounded pointer-events-none" />
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Week Day Headers */}
      <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="p-3 text-center text-sm font-medium text-gray-700 border-r border-gray-200 last:border-r-0">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 grid grid-cols-7 border-l border-t border-gray-200">
        {monthData.weeks.map((week) =>
          week.days.map(renderDay)
        )}
      </div>

      {/* Legend */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <span className="text-gray-600 font-medium">Status:</span>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-amber-200 border border-amber-300 rounded"></div>
            <span>Pending</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-emerald-200 border border-emerald-300 rounded"></div>
            <span>Confirmed</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-200 border border-blue-300 rounded"></div>
            <span>In Progress</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-gray-200 border border-gray-300 rounded"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-200 border border-red-300 rounded"></div>
            <span>Cancelled</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MonthView;