import React, { useRef, useEffect } from 'react';
import { useCalendarStore } from '../../../store/calendarStore';
import { generateCalendarWeek, generateTimeSlots } from '../../../utils/calendar';
import { format, isSameDay, isToday, addMinutes, differenceInMinutes } from 'date-fns';
import { CalendarEvent } from '../../../types';
import { cn } from '../../../utils/cn';

export function WeekView() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const {
    settings,
    events,
    selectEvent,
    openAppointmentModal,
    dragDropContext,
    setDropTarget,
    startDrag,
    endDrag
  } = useCalendarStore();

  const weekData = generateCalendarWeek(settings.currentDate, settings, events);

  // Scroll to current time on mount
  useEffect(() => {
    if (scrollRef.current) {
      const now = new Date();
      const currentHour = now.getHours();
      const scrollPosition = (currentHour - 6) * 60; // Assuming 60px per hour
      scrollRef.current.scrollTop = Math.max(0, scrollPosition);
    }
  }, []);

  const timeSlots = generateTimeSlots(weekData.weekStart, settings);
  const workingHours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 8 PM

  const handleTimeSlotClick = (date: Date, time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const clickTime = new Date(date);
    clickTime.setHours(hours, minutes, 0, 0);
    
    useCalendarStore.getState().selectDate(clickTime);
    openAppointmentModal(false);
  };

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    selectEvent(event);
  };

  const handleDragStart = (event: CalendarEvent, e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    startDrag(event);
  };

  const handleDragOver = (date: Date, time: string, e: React.DragEvent) => {
    if (dragDropContext.isDragging) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const [hours, minutes] = time.split(':').map(Number);
      const dropTime = new Date(date);
      dropTime.setHours(hours, minutes, 0, 0);
      setDropTarget({ date: dropTime });
    }
  };

  const handleDrop = (date: Date, time: string, e: React.DragEvent) => {
    e.preventDefault();
    endDrag();
  };

  const getEventPosition = (event: CalendarEvent, dayDate: Date) => {
    if (!isSameDay(event.start, dayDate)) return null;

    const dayStart = new Date(dayDate);
    dayStart.setHours(8, 0, 0, 0); // Start at 8 AM

    const eventStart = event.start;
    const eventEnd = event.end;

    const startOffset = differenceInMinutes(eventStart, dayStart);
    const duration = differenceInMinutes(eventEnd, eventStart);

    // Each hour is 60px, so each minute is 1px
    const top = startOffset;
    const height = Math.max(duration, 30); // Minimum 30px height

    return { top, height };
  };

  const renderEvent = (event: CalendarEvent, dayDate: Date) => {
    const position = getEventPosition(event, dayDate);
    if (!position) return null;

    const statusColors = {
      PENDING: 'bg-amber-200 text-amber-900 border-amber-300',
      CONFIRMED: 'bg-emerald-200 text-emerald-900 border-emerald-300',
      IN_PROGRESS: 'bg-blue-200 text-blue-900 border-blue-300',
      COMPLETED: 'bg-gray-200 text-gray-900 border-gray-300',
      CANCELLED: 'bg-red-200 text-red-900 border-red-300',
      NO_SHOW: 'bg-red-200 text-red-900 border-red-300'
    };

    return (
      <div
        key={event.id}
        draggable={event.type === 'appointment'}
        onDragStart={(e) => handleDragStart(event, e)}
        onClick={(e) => handleEventClick(event, e)}
        className={cn(
          'absolute left-1 right-1 p-2 rounded border cursor-pointer text-xs font-medium shadow-sm z-10',
          statusColors[event.status as keyof typeof statusColors] || 'bg-gray-200 text-gray-900 border-gray-300',
          dragDropContext.draggedEvent?.id === event.id && 'opacity-50'
        )}
        style={{
          top: `${position.top}px`,
          height: `${position.height}px`
        }}
        title={`${event.title} (${format(event.start, 'HH:mm')} - ${format(event.end, 'HH:mm')})`}
      >
        <div className="truncate font-semibold">
          {format(event.start, 'HH:mm')}
        </div>
        <div className="truncate mt-1">
          {event.title}
        </div>
      </div>
    );
  };

  const renderTimeColumn = () => (
    <div className="w-16 flex-shrink-0 border-r border-gray-200">
      {workingHours.map((hour) => (
        <div key={hour} className="h-16 flex items-start justify-end pr-2 pt-1 border-b border-gray-100">
          <span className="text-xs text-gray-500">
            {format(new Date().setHours(hour, 0, 0, 0), 'HH:mm')}
          </span>
        </div>
      ))}
    </div>
  );

  const renderDayColumn = (day: any) => {
    const dayEvents = events.filter(event => isSameDay(event.start, day.date));
    const isDayToday = isToday(day.date);

    return (
      <div key={day.date.toISOString()} className="flex-1 border-r border-gray-200 relative">
        {/* Day Header */}
        <div className={cn(
          'p-2 text-center border-b border-gray-200 bg-gray-50',
          isDayToday && 'bg-blue-50'
        )}>
          <div className="text-xs text-gray-500 uppercase tracking-wide">
            {format(day.date, 'EEE')}
          </div>
          <div className={cn(
            'text-lg font-semibold mt-1',
            isDayToday && 'bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto'
          )}>
            {format(day.date, 'd')}
          </div>
        </div>

        {/* Time Slots */}
        <div className="relative">
          {workingHours.map((hour) => (
            <div
              key={hour}
              className="h-16 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => handleTimeSlotClick(day.date, `${hour}:00`)}
              onDragOver={(e) => handleDragOver(day.date, `${hour}:00`, e)}
              onDrop={(e) => handleDrop(day.date, `${hour}:00`, e)}
            >
              {/* Half-hour line */}
              <div className="absolute left-0 right-0 top-8 border-t border-gray-50" />
            </div>
          ))}

          {/* Current Time Indicator */}
          {isDayToday && (() => {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            
            if (currentHour >= 8 && currentHour <= 20) {
              const offset = (currentHour - 8) * 64 + (currentMinute / 60) * 64;
              return (
                <div
                  className="absolute left-0 right-0 border-t-2 border-red-500 z-20"
                  style={{ top: `${offset}px` }}
                >
                  <div className="absolute -left-1 -top-1 w-2 h-2 bg-red-500 rounded-full" />
                </div>
              );
            }
            return null;
          })()}

          {/* Events */}
          {dayEvents.map(event => renderEvent(event, day.date))}

          {/* Drop Zone Indicator */}
          {dragDropContext.dropTarget && 
           isSameDay(dragDropContext.dropTarget.date, day.date) && 
           dragDropContext.isDragging && (
            <div className="absolute inset-0 border-2 border-dashed border-blue-400 bg-blue-50 bg-opacity-30 pointer-events-none z-30" />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Week Header */}
      <div className="flex border-b border-gray-200 bg-white">
        <div className="w-16 flex-shrink-0" /> {/* Time column spacer */}
        {weekData.days.map((day) => (
          <div key={day.date.toISOString()} className="flex-1 text-center">
            {/* This space is handled by individual day columns */}
          </div>
        ))}
      </div>

      {/* Week Body */}
      <div className="flex-1 flex overflow-hidden">
        <div ref={scrollRef} className="flex-1 flex overflow-y-auto">
          {renderTimeColumn()}
          {weekData.days.map(renderDayColumn)}
        </div>
      </div>

      {/* Week Summary */}
      <div className="p-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
        <div className="flex justify-between items-center">
          <span>
            Week of {format(weekData.weekStart, 'MMM d')} - {format(weekData.weekEnd, 'd, yyyy')}
          </span>
          <span>
            {events.filter(e => e.type === 'appointment').length} appointments this week
          </span>
        </div>
      </div>
    </div>
  );
}

export default WeekView;