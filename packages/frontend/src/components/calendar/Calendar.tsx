import React, { useEffect, useState } from 'react';
import { useCalendarStore } from '../../store/calendarStore';
import { CalendarHeader } from './CalendarHeader';
import { CalendarFilters } from './CalendarFilters';
import { MonthView } from './views/MonthView';
import { WeekView } from './views/WeekView';
import { DayView } from './views/DayView';
import { AppointmentModal } from './modals/AppointmentModal';
import { TimeBlockModal } from './modals/TimeBlockModal';
import { CalendarEventDetails } from './CalendarEventDetails';
import { MobileCalendar } from './mobile/MobileCalendar';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorMessage } from '../ui/ErrorMessage';

interface CalendarProps {
  className?: string;
  showFilters?: boolean;
  showHeader?: boolean;
  defaultView?: 'month' | 'week' | 'day';
}

export function Calendar({
  className = '',
  showFilters = true,
  showHeader = true,
  defaultView = 'month'
}: CalendarProps) {
  const {
    settings,
    loading,
    error,
    selectedEvent,
    isAppointmentModalOpen,
    isTimeBlockModalOpen,
    fetchCalendarData,
    setView
  } = useCalendarStore();

  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize calendar
  useEffect(() => {
    if (defaultView !== settings.view) {
      setView(defaultView);
    }
    fetchCalendarData();
  }, []);

  // Render mobile calendar for small screens
  if (isMobile) {
    return (
      <div className={`flex flex-col h-full bg-white ${className}`}>
        <MobileCalendar />
      </div>
    );
  }

  // Render calendar view based on current settings
  const renderCalendarView = () => {
    switch (settings.view) {
      case 'month':
        return <MonthView />;
      case 'week':
        return <WeekView />;
      case 'day':
        return <DayView />;
      default:
        return <MonthView />;
    }
  };

  return (
    <div className={`flex flex-col h-full bg-white rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      {showHeader && <CalendarHeader />}

      {/* Filters */}
      {showFilters && <CalendarFilters />}

      {/* Error Display */}
      {error && (
        <ErrorMessage 
          message={error} 
          className="mx-4 mb-4"
        />
      )}

      {/* Calendar Content */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            {renderCalendarView()}
          </div>
        )}

        {/* Event Details Popup - Only show on desktop */}
        {selectedEvent && !isMobile && (
          <CalendarEventDetails
            event={selectedEvent}
            onClose={() => useCalendarStore.getState().selectEvent(null)}
          />
        )}
      </div>

      {/* Modals - Only show on desktop */}
      {!isMobile && isAppointmentModalOpen && <AppointmentModal />}
      {!isMobile && isTimeBlockModalOpen && <TimeBlockModal />}
    </div>
  );
}

export default Calendar;