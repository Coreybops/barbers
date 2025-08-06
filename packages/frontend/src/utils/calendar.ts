import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  format, 
  isSameDay, 
  isToday, 
  isWeekend, 
  addDays,
  addWeeks,
  addMonths,
  subDays,
  subWeeks,
  subMonths,
  startOfDay,
  endOfDay,
  addMinutes,
  setHours,
  setMinutes,
  parseISO,
  formatISO,
  differenceInMinutes,
  isSameMonth,
  getDay
} from 'date-fns';

import {
  CalendarDay,
  CalendarWeek,
  CalendarMonth,
  CalendarTimeSlot,
  CalendarEvent,
  CalendarView,
  CalendarSettings,
  Appointment,
  TimeBlock,
  AvailabilitySlot
} from '../types';

export const DEFAULT_WORKING_HOURS = {
  start: '09:00',
  end: '18:00'
};

export const DEFAULT_TIME_SLOT_DURATION = 30; // minutes

/**
 * Generate calendar month data
 */
export function generateCalendarMonth(
  date: Date,
  settings: CalendarSettings,
  events: CalendarEvent[] = []
): CalendarMonth {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const allDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd
  }).map(day => generateCalendarDay(day, date, settings, events));

  // Group days into weeks
  const weeks: CalendarWeek[] = [];
  for (let i = 0; i < allDays.length; i += 7) {
    const weekDays = allDays.slice(i, i + 7);
    weeks.push({
      weekStart: weekDays[0].date,
      weekEnd: weekDays[6].date,
      days: weekDays
    });
  }

  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    weeks,
    allDays: allDays.filter(day => isSameMonth(day.date, date))
  };
}

/**
 * Generate calendar week data
 */
export function generateCalendarWeek(
  date: Date,
  settings: CalendarSettings,
  events: CalendarEvent[] = []
): CalendarWeek {
  const weekStart = startOfWeek(date);
  const weekEnd = endOfWeek(date);

  const days = eachDayOfInterval({
    start: weekStart,
    end: weekEnd
  }).map(day => generateCalendarDay(day, date, settings, events));

  return {
    weekStart,
    weekEnd,
    days
  };
}

/**
 * Generate calendar day data
 */
export function generateCalendarDay(
  date: Date,
  currentDate: Date,
  settings: CalendarSettings,
  events: CalendarEvent[] = []
): CalendarDay {
  const dayEvents = events.filter(event =>
    isSameDay(event.start, date)
  );

  const timeSlots = generateTimeSlots(date, settings, dayEvents);

  return {
    date,
    isCurrentMonth: isSameMonth(date, currentDate),
    isToday: isToday(date),
    isWeekend: isWeekend(date),
    timeSlots,
    events: dayEvents
  };
}

/**
 * Generate time slots for a day
 */
export function generateTimeSlots(
  date: Date,
  settings: CalendarSettings,
  events: CalendarEvent[] = []
): CalendarTimeSlot[] {
  const slots: CalendarTimeSlot[] = [];
  const [startHour, startMinute] = settings.workingHours.start.split(':').map(Number);
  const [endHour, endMinute] = settings.workingHours.end.split(':').map(Number);

  let currentTime = setMinutes(setHours(startOfDay(date), startHour), startMinute);
  const endTime = setMinutes(setHours(startOfDay(date), endHour), endMinute);

  while (currentTime < endTime) {
    const slotEnd = addMinutes(currentTime, settings.timeSlotDuration);
    const slotEvents = events.filter(event =>
      event.start <= currentTime && event.end > currentTime
    );

    slots.push({
      start: currentTime,
      end: slotEnd,
      isAvailable: slotEvents.length === 0,
      isBooked: slotEvents.some(e => e.type === 'appointment'),
      appointments: slotEvents,
      barberId: settings.filters.barberId
    });

    currentTime = slotEnd;
  }

  return slots;
}

/**
 * Convert appointment to calendar event
 */
export function appointmentToCalendarEvent(appointment: Appointment): CalendarEvent {
  return {
    id: appointment.id,
    title: `${appointment.service.name} - ${appointment.customer.firstName} ${appointment.customer.lastName}`,
    start: parseISO(appointment.startTime),
    end: parseISO(appointment.endTime),
    type: 'appointment',
    status: appointment.status,
    color: getStatusColor(appointment.status),
    appointment,
    barber: appointment.barber
  };
}

/**
 * Convert time block to calendar event
 */
export function timeBlockToCalendarEvent(timeBlock: TimeBlock): CalendarEvent {
  return {
    id: timeBlock.id,
    title: timeBlock.title,
    start: timeBlock.start,
    end: timeBlock.end,
    type: 'break',
    status: 'CONFIRMED',
    color: timeBlock.color
  };
}

/**
 * Get color based on appointment status
 */
export function getStatusColor(status: string): string {
  const colors = {
    PENDING: '#f59e0b', // amber
    CONFIRMED: '#10b981', // emerald
    IN_PROGRESS: '#3b82f6', // blue
    COMPLETED: '#6b7280', // gray
    CANCELLED: '#ef4444', // red
    NO_SHOW: '#dc2626' // dark red
  };
  return colors[status as keyof typeof colors] || '#6b7280';
}

/**
 * Check if time slot conflicts with existing events
 */
export function hasTimeConflict(
  start: Date,
  end: Date,
  events: CalendarEvent[],
  excludeEventId?: string
): boolean {
  return events.some(event => {
    if (excludeEventId && event.id === excludeEventId) return false;
    return (start < event.end && end > event.start);
  });
}

/**
 * Find available time slots for a service
 */
export function findAvailableSlots(
  date: Date,
  duration: number, // in minutes
  settings: CalendarSettings,
  events: CalendarEvent[] = [],
  availability: AvailabilitySlot[] = []
): CalendarTimeSlot[] {
  const timeSlots = generateTimeSlots(date, settings, events);
  const availableSlots: CalendarTimeSlot[] = [];

  for (let i = 0; i < timeSlots.length; i++) {
    const slot = timeSlots[i];
    const requiredSlots = Math.ceil(duration / settings.timeSlotDuration);
    
    // Check if we have enough consecutive slots
    if (i + requiredSlots <= timeSlots.length) {
      const consecutiveSlots = timeSlots.slice(i, i + requiredSlots);
      const isAvailable = consecutiveSlots.every(s => s.isAvailable) &&
        !hasAvailabilityConflict(slot.start, addMinutes(slot.start, duration), availability);

      if (isAvailable) {
        availableSlots.push({
          ...slot,
          end: addMinutes(slot.start, duration)
        });
      }
    }
  }

  return availableSlots;
}

/**
 * Check if time conflicts with availability restrictions
 */
function hasAvailabilityConflict(
  start: Date,
  end: Date,
  availability: AvailabilitySlot[]
): boolean {
  return availability.some(slot => {
    if (slot.isAvailable) return false;
    return (start < slot.end && end > slot.start);
  });
}

/**
 * Navigate calendar date
 */
export function navigateCalendar(
  currentDate: Date,
  direction: 'prev' | 'next',
  view: CalendarView
): Date {
  switch (view) {
    case 'month':
      return direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1);
    case 'week':
      return direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1);
    case 'day':
      return direction === 'next' ? addDays(currentDate, 1) : subDays(currentDate, 1);
    default:
      return currentDate;
  }
}

/**
 * Format calendar date for display
 */
export function formatCalendarDate(date: Date, view: CalendarView): string {
  switch (view) {
    case 'month':
      return format(date, 'MMMM yyyy');
    case 'week':
      const weekStart = startOfWeek(date);
      const weekEnd = endOfWeek(date);
      return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
    case 'day':
      return format(date, 'EEEE, MMMM d, yyyy');
    default:
      return format(date, 'MMMM yyyy');
  }
}

/**
 * Get calendar date range for data fetching
 */
export function getCalendarDateRange(date: Date, view: CalendarView): { start: Date; end: Date } {
  switch (view) {
    case 'month':
      return {
        start: startOfWeek(startOfMonth(date)),
        end: endOfWeek(endOfMonth(date))
      };
    case 'week':
      return {
        start: startOfWeek(date),
        end: endOfWeek(date)
      };
    case 'day':
      return {
        start: startOfDay(date),
        end: endOfDay(date)
      };
    default:
      return {
        start: startOfMonth(date),
        end: endOfMonth(date)
      };
  }
}

/**
 * Calculate appointment duration
 */
export function calculateDuration(start: Date, end: Date): number {
  return differenceInMinutes(end, start);
}

/**
 * Format time for display
 */
export function formatTime(date: Date): string {
  return format(date, 'HH:mm');
}

/**
 * Format time range for display
 */
export function formatTimeRange(start: Date, end: Date): string {
  return `${formatTime(start)} - ${formatTime(end)}`;
}

/**
 * Check if current time is within business hours
 */
export function isWithinBusinessHours(
  time: Date,
  workingHours: { start: string; end: string }
): boolean {
  const timeStr = format(time, 'HH:mm');
  return timeStr >= workingHours.start && timeStr <= workingHours.end;
}

/**
 * Get next available date
 */
export function getNextAvailableDate(
  startDate: Date,
  settings: CalendarSettings,
  events: CalendarEvent[] = []
): Date | null {
  let currentDate = startDate;
  const maxDays = 30; // Look ahead 30 days maximum

  for (let i = 0; i < maxDays; i++) {
    if (!settings.showWeekends && isWeekend(currentDate)) {
      currentDate = addDays(currentDate, 1);
      continue;
    }

    const availableSlots = findAvailableSlots(
      currentDate,
      30, // Minimum 30-minute slot
      settings,
      events.filter(e => isSameDay(e.start, currentDate))
    );

    if (availableSlots.length > 0) {
      return currentDate;
    }

    currentDate = addDays(currentDate, 1);
  }

  return null;
}

/**
 * Export calendar events to iCal format
 */
export function exportToICal(events: CalendarEvent[], options: {
  title?: string;
  description?: string;
}): string {
  const now = new Date();
  const icalEvents = events.map(event => {
    const start = formatISO(event.start, { format: 'basic' }).replace(/[-:]/g, '');
    const end = formatISO(event.end, { format: 'basic' }).replace(/[-:]/g, '');
    const created = formatISO(now, { format: 'basic' }).replace(/[-:]/g, '');

    return [
      'BEGIN:VEVENT',
      `UID:${event.id}@barberbooking.com`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `DTSTAMP:${created}`,
      `SUMMARY:${event.title}`,
      `STATUS:${event.status}`,
      'END:VEVENT'
    ].join('\r\n');
  }).join('\r\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:BarberBooking Calendar',
    `X-WR-CALNAME:${options.title || 'Barber Appointments'}`,
    `X-WR-CALDESC:${options.description || 'Barber appointment calendar'}`,
    icalEvents,
    'END:VCALENDAR'
  ].join('\r\n');
}