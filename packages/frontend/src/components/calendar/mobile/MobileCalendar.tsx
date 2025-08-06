import React, { useState } from 'react';
import { useCalendarStore } from '../../../store/calendarStore';
import { MobileMonthView } from './MobileMonthView';
import { MobileDayView } from './MobileDayView';
import { MobileEventDetails } from './MobileEventDetails';
import { MobileAppointmentForm } from './MobileAppointmentForm';
import { format } from 'date-fns';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Filter,
  Settings
} from 'lucide-react';
import { Button } from '../../ui/button';

export function MobileCalendar() {
  const {
    settings,
    selectedEvent,
    isAppointmentModalOpen,
    loading,
    navigateDate,
    goToToday,
    openAppointmentModal,
    selectEvent
  } = useCalendarStore();

  const [showFilters, setShowFilters] = useState(false);
  const { view, currentDate } = settings;

  const handleEventTap = (event: any, e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    selectEvent(event);
  };

  const renderView = () => {
    switch (view) {
      case 'month':
        return <MobileMonthView onEventTap={handleEventTap} />;
      case 'day':
        return <MobileDayView onEventTap={handleEventTap} />;
      default:
        return <MobileDayView onEventTap={handleEventTap} />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Mobile Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 sticky top-0 z-10">
        {/* Top Bar */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateDate('prev')}
              className="p-2"
              disabled={loading}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {view === 'month' ? format(currentDate, 'MMMM yyyy') : format(currentDate, 'MMM d, yyyy')}
              </div>
              {view === 'day' && (
                <div className="text-sm text-gray-600">
                  {format(currentDate, 'EEEE')}
                </div>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateDate('next')}
              className="p-2"
              disabled={loading}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="p-2"
            >
              <Filter className="h-4 w-4" />
            </Button>
            
            <Button
              size="sm"
              onClick={() => openAppointmentModal(false)}
              className="px-3 py-2"
              disabled={loading}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center justify-center pb-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => useCalendarStore.getState().setView('month')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view === 'month' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => useCalendarStore.getState().setView('day')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view === 'day' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Day
            </button>
          </div>
        </div>

        {/* Today Button */}
        <div className="flex justify-center pb-3">
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            disabled={loading}
          >
            Today
          </Button>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="flex-1 overflow-hidden">
        {renderView()}
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <MobileEventDetails
          event={selectedEvent}
          onClose={() => selectEvent(null)}
        />
      )}

      {/* Appointment Form Modal */}
      {isAppointmentModalOpen && (
        <MobileAppointmentForm />
      )}
    </div>
  );
}

export default MobileCalendar;