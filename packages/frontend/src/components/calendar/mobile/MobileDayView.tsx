import React, { useRef, useEffect } from 'react';
import { useCalendarStore } from '../../../store/calendarStore';
import { format, isSameDay, isToday, addMinutes, differenceInMinutes } from 'date-fns';
import { CalendarEvent } from '../../../types';
import { cn } from '../../../utils/cn';
import { Clock, User, Scissors, DollarSign } from 'lucide-react';

interface MobileDayViewProps {
  onEventTap: (event: CalendarEvent, e: React.TouchEvent) => void;
}

export function MobileDayView({ onEventTap }: MobileDayViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const {
    settings,
    events,
    selectDate,
    openAppointmentModal
  } = useCalendarStore();

  const { currentDate } = settings;
  const dayEvents = events.filter(event => isSameDay(event.start, currentDate));

  // Scroll to current time on mount for today
  useEffect(() => {
    if (scrollRef.current && isToday(currentDate)) {
      const now = new Date();
      const currentHour = now.getHours();
      const scrollPosition = Math.max(0, (currentHour - 7) * 60); // 60px per hour
      scrollRef.current.scrollTop = scrollPosition;
    }
  }, [currentDate]);

  const workingHours = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 9 PM

  const handleTimeSlotTap = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const clickTime = new Date(currentDate);
    clickTime.setHours(hours, minutes, 0, 0);
    
    selectDate(clickTime);
    openAppointmentModal(false);
  };

  const getEventPosition = (event: CalendarEvent) => {
    const dayStart = new Date(currentDate);
    dayStart.setHours(7, 0, 0, 0); // Start at 7 AM

    const eventStart = event.start;
    const eventEnd = event.end;

    const startOffset = differenceInMinutes(eventStart, dayStart);
    const duration = differenceInMinutes(eventEnd, eventStart);

    // Each hour is 60px, so each minute is 1px
    const top = startOffset;
    const height = Math.max(duration, 30); // Minimum 30px height

    return { top, height };
  };

  const renderEvent = (event: CalendarEvent) => {
    const position = getEventPosition(event);
    const appointment = event.appointment;

    const statusColors = {
      PENDING: 'bg-amber-100 text-amber-900 border-l-amber-400',
      CONFIRMED: 'bg-emerald-100 text-emerald-900 border-l-emerald-400',
      IN_PROGRESS: 'bg-blue-100 text-blue-900 border-l-blue-400',
      COMPLETED: 'bg-gray-100 text-gray-900 border-l-gray-400',
      CANCELLED: 'bg-red-100 text-red-900 border-l-red-400',
      NO_SHOW: 'bg-red-100 text-red-900 border-l-red-400'
    };

    return (
      <div
        key={event.id}
        onTouchStart={(e) => onEventTap(event, e)}
        className={cn(
          'absolute left-1 right-1 p-2 rounded border-l-4 shadow-sm z-10 active:scale-95 transition-transform',
          statusColors[event.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-900 border-l-gray-400'
        )}
        style={{
          top: `${position.top}px`,
          height: `${position.height}px`
        }}
      >
        <div className="flex flex-col h-full text-xs">
          {/* Time */}
          <div className="flex items-center space-x-1 mb-1">
            <Clock className="h-3 w-3" />
            <span className="font-semibold">
              {format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}
            </span>
          </div>

          {/* Appointment Details */}
          {appointment && (
            <div className="flex-1 space-y-1">
              <div className="flex items-center space-x-1">
                <Scissors className="h-3 w-3 text-gray-500" />
                <span className="font-medium truncate">{appointment.service.name}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <User className="h-3 w-3 text-gray-500" />
                <span className="truncate">
                  {appointment.customer.firstName} {appointment.customer.lastName}
                </span>
              </div>

              <div className="flex items-center space-x-1">
                <DollarSign className="h-3 w-3 text-gray-500" />
                <span className="font-medium">${appointment.totalPrice.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Non-appointment events */}
          {!appointment && (
            <div className="flex-1">
              <div className="font-medium truncate">{event.title}</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTimeSlots = () => {
    return workingHours.map((hour) => {
      const time = `${hour.toString().padStart(2, '0')}:00`;
      
      return (
        <div key={hour} className="relative">
          {/* Hour Slot */}
          <div
            className="h-16 border-b border-gray-100 cursor-pointer active:bg-blue-50 transition-colors flex items-start px-3 pt-1"
            onTouchStart={() => handleTimeSlotTap(time)}
          >
            <span className="text-xs font-medium text-gray-600 w-12 flex-shrink-0">
              {format(new Date().setHours(hour, 0, 0, 0), 'h a')}
            </span>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Day Header */}
      <div className="flex-shrink-0 p-4 bg-gray-50 border-b border-gray-200">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">
            {format(currentDate, 'EEEE')}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {dayEvents.filter(e => e.type === 'appointment').length} appointments
          </div>
          {isToday(currentDate) && (
            <div className="flex items-center justify-center space-x-1 text-xs text-blue-600 mt-1">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
              <span>Today</span>
            </div>
          )}
        </div>
      </div>

      {/* Day Content */}
      <div className="flex-1 relative overflow-hidden">
        <div ref={scrollRef} className="h-full overflow-y-auto">
          <div className="relative">
            {/* Time Grid */}
            {renderTimeSlots()}

            {/* Current Time Indicator */}
            {isToday(currentDate) && (() => {
              const now = new Date();
              const currentHour = now.getHours();
              const currentMinute = now.getMinutes();
              
              if (currentHour >= 7 && currentHour <= 21) {
                const offset = (currentHour - 7) * 64 + (currentMinute / 60) * 64;
                return (
                  <div
                    className="absolute left-0 right-0 border-t-2 border-red-500 z-20"
                    style={{ top: `${offset}px` }}
                  >
                    <div className="absolute -left-1 -top-1 w-2 h-2 bg-red-500 rounded-full" />
                    <div className="absolute left-2 -top-3 bg-red-500 text-white text-xs px-1 py-0.5 rounded">
                      {format(now, 'HH:mm')}
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Events */}
            {dayEvents.map(renderEvent)}
          </div>
        </div>
      </div>

      {/* Mobile Action Bar */}
      <div className="flex-shrink-0 p-3 bg-gray-50 border-t border-gray-200 text-center">
        <p className="text-sm text-gray-600">
          Tap on a time slot to create an appointment
        </p>
      </div>
    </div>
  );
}

export default MobileDayView;