import React, { useRef, useEffect } from 'react';
import { useCalendarStore } from '../../../store/calendarStore';
import { generateTimeSlots } from '../../../utils/calendar';
import { format, isSameDay, isToday, addMinutes, differenceInMinutes } from 'date-fns';
import { CalendarEvent } from '../../../types';
import { cn } from '../../../utils/cn';
import { Clock, User, Scissors, Phone, Mail } from 'lucide-react';

export function DayView() {
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

  const { currentDate } = settings;
  const dayEvents = events.filter(event => isSameDay(event.start, currentDate));

  // Scroll to current time on mount
  useEffect(() => {
    if (scrollRef.current && isToday(currentDate)) {
      const now = new Date();
      const currentHour = now.getHours();
      const scrollPosition = Math.max(0, (currentHour - 7) * 80); // 80px per hour
      scrollRef.current.scrollTop = scrollPosition;
    }
  }, [currentDate]);

  const timeSlots = generateTimeSlots(currentDate, settings);
  const workingHours = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 9 PM

  const handleTimeSlotClick = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const clickTime = new Date(currentDate);
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

  const handleDragOver = (time: string, e: React.DragEvent) => {
    if (dragDropContext.isDragging) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const [hours, minutes] = time.split(':').map(Number);
      const dropTime = new Date(currentDate);
      dropTime.setHours(hours, minutes, 0, 0);
      setDropTarget({ date: dropTime });
    }
  };

  const handleDrop = (time: string, e: React.DragEvent) => {
    e.preventDefault();
    endDrag();
  };

  const getEventPosition = (event: CalendarEvent) => {
    const dayStart = new Date(currentDate);
    dayStart.setHours(7, 0, 0, 0); // Start at 7 AM

    const eventStart = event.start;
    const eventEnd = event.end;

    const startOffset = differenceInMinutes(eventStart, dayStart);
    const duration = differenceInMinutes(eventEnd, eventStart);

    // Each hour is 80px, so each minute is 80/60 = 1.33px
    const pixelsPerMinute = 80 / 60;
    const top = startOffset * pixelsPerMinute;
    const height = Math.max(duration * pixelsPerMinute, 40); // Minimum 40px height

    return { top, height };
  };

  const renderEvent = (event: CalendarEvent) => {
    const position = getEventPosition(event);

    const statusColors = {
      PENDING: 'bg-amber-100 text-amber-900 border-amber-300',
      CONFIRMED: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      IN_PROGRESS: 'bg-blue-100 text-blue-900 border-blue-300',
      COMPLETED: 'bg-gray-100 text-gray-900 border-gray-300',
      CANCELLED: 'bg-red-100 text-red-900 border-red-300',
      NO_SHOW: 'bg-red-100 text-red-900 border-red-300'
    };

    const appointment = event.appointment;

    return (
      <div
        key={event.id}
        draggable={event.type === 'appointment'}
        onDragStart={(e) => handleDragStart(event, e)}
        onClick={(e) => handleEventClick(event, e)}
        className={cn(
          'absolute left-2 right-2 p-3 rounded-lg border-l-4 cursor-pointer shadow-sm hover:shadow-md transition-shadow z-10',
          statusColors[event.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-900 border-gray-300',
          dragDropContext.draggedEvent?.id === event.id && 'opacity-50'
        )}
        style={{
          top: `${position.top}px`,
          height: `${position.height}px`
        }}
      >
        <div className="flex flex-col h-full">
          {/* Time and Status */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span className="font-semibold text-sm">
                {format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}
              </span>
            </div>
            <span className={cn(
              'px-2 py-1 text-xs font-medium rounded-full',
              event.status === 'CONFIRMED' && 'bg-emerald-200 text-emerald-800',
              event.status === 'PENDING' && 'bg-amber-200 text-amber-800',
              event.status === 'IN_PROGRESS' && 'bg-blue-200 text-blue-800',
              event.status === 'COMPLETED' && 'bg-gray-200 text-gray-800',
              event.status === 'CANCELLED' && 'bg-red-200 text-red-800'
            )}>
              {event.status.replace('_', ' ')}
            </span>
          </div>

          {/* Service and Customer Info */}
          {appointment && (
            <div className="flex-1 space-y-1">
              <div className="flex items-center space-x-2">
                <Scissors className="h-4 w-4 text-gray-500" />
                <span className="font-medium text-sm">{appointment.service.name}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm">
                  {appointment.customer.firstName} {appointment.customer.lastName}
                </span>
              </div>

              {appointment.customer.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-xs text-gray-600">{appointment.customer.phone}</span>
                </div>
              )}

              {appointment.notes && (
                <div className="mt-2 text-xs text-gray-600 italic">
                  "{appointment.notes}"
                </div>
              )}

              {/* Price */}
              <div className="mt-2 text-sm font-semibold text-gray-900">
                ${appointment.totalPrice.toFixed(2)}
              </div>
            </div>
          )}

          {/* Non-appointment events */}
          {!appointment && (
            <div className="flex-1">
              <div className="font-medium text-sm">{event.title}</div>
              {event.type === 'break' && (
                <div className="text-xs text-gray-600 mt-1">Time blocked</div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTimeSlots = () => {
    return workingHours.map((hour) => {
      const time = `${hour.toString().padStart(2, '0')}:00`;
      const halfHourTime = `${hour.toString().padStart(2, '0')}:30`;
      
      return (
        <div key={hour} className="relative">
          {/* Full Hour Slot */}
          <div
            className="h-10 border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors flex items-center px-4"
            onClick={() => handleTimeSlotClick(time)}
            onDragOver={(e) => handleDragOver(time, e)}
            onDrop={(e) => handleDrop(time, e)}
          >
            <span className="text-sm font-medium text-gray-700 w-16 flex-shrink-0">
              {format(new Date().setHours(hour, 0, 0, 0), 'HH:mm')}
            </span>
            
            {/* Drop zone indicator for this time slot */}
            {dragDropContext.dropTarget && 
             dragDropContext.dropTarget.date.getHours() === hour &&
             dragDropContext.dropTarget.date.getMinutes() === 0 &&
             dragDropContext.isDragging && (
              <div className="absolute inset-0 border-2 border-dashed border-blue-400 bg-blue-100 bg-opacity-50 rounded pointer-events-none z-20" />
            )}
          </div>

          {/* Half Hour Slot */}
          <div
            className="h-10 border-b border-gray-50 cursor-pointer hover:bg-blue-50 transition-colors flex items-center px-4"
            onClick={() => handleTimeSlotClick(halfHourTime)}
            onDragOver={(e) => handleDragOver(halfHourTime, e)}
            onDrop={(e) => handleDrop(halfHourTime, e)}
          >
            <span className="text-xs text-gray-500 w-16 flex-shrink-0">
              {format(new Date().setHours(hour, 30, 0, 0), 'HH:mm')}
            </span>

            {/* Drop zone indicator for half-hour slot */}
            {dragDropContext.dropTarget && 
             dragDropContext.dropTarget.date.getHours() === hour &&
             dragDropContext.dropTarget.date.getMinutes() === 30 &&
             dragDropContext.isDragging && (
              <div className="absolute inset-0 border-2 border-dashed border-blue-400 bg-blue-100 bg-opacity-50 rounded pointer-events-none z-20" />
            )}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Day Header */}
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {format(currentDate, 'EEEE, MMMM d, yyyy')}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {dayEvents.filter(e => e.type === 'appointment').length} appointments scheduled
            </p>
          </div>
          
          {isToday(currentDate) && (
            <div className="flex items-center space-x-2 text-sm text-blue-600">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
              <span>Today</span>
            </div>
          )}
        </div>
      </div>

      {/* Day Body */}
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
                const offset = (currentHour - 7) * 80 + (currentMinute / 60) * 80;
                return (
                  <div
                    className="absolute left-0 right-0 border-t-2 border-red-500 z-30"
                    style={{ top: `${offset}px` }}
                  >
                    <div className="absolute -left-1 -top-1 w-2 h-2 bg-red-500 rounded-full" />
                    <div className="absolute left-2 -top-3 bg-red-500 text-white text-xs px-2 py-1 rounded">
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

      {/* Day Summary */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">
              Total appointments: {dayEvents.filter(e => e.type === 'appointment').length}
            </span>
            <span className="text-gray-600">
              Revenue: ${dayEvents
                .filter(e => e.appointment)
                .reduce((sum, e) => sum + (e.appointment?.totalPrice || 0), 0)
                .toFixed(2)}
            </span>
          </div>
          
          <div className="text-gray-500">
            Click on any time slot to create an appointment
          </div>
        </div>
      </div>
    </div>
  );
}

export default DayView;