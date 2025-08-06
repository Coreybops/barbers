import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Plus,
  Settings,
  Download,
  RefreshCw
} from 'lucide-react';
import { useCalendarStore } from '../../store/calendarStore';
import { formatCalendarDate } from '../../utils/calendar';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

export function CalendarHeader() {
  const {
    settings,
    loading,
    navigateDate,
    goToToday,
    setView,
    refreshData,
    openAppointmentModal,
    openTimeBlockModal
  } = useCalendarStore();

  const { view, currentDate } = settings;

  const handleViewChange = (newView: string) => {
    setView(newView as 'month' | 'week' | 'day');
  };

  const handleRefresh = () => {
    refreshData();
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export calendar');
  };

  return (
    <div className="flex flex-col space-y-4 p-4 border-b border-gray-200 bg-gray-50">
      {/* Top Row - Navigation and Actions */}
      <div className="flex items-center justify-between">
        {/* Left Side - Navigation */}
        <div className="flex items-center space-x-4">
          {/* Date Navigation */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('prev')}
              disabled={loading}
              className="p-2"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('next')}
              disabled={loading}
              className="p-2"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              disabled={loading}
              className="px-3 py-2"
            >
              Today
            </Button>
          </div>

          {/* Current Date Display */}
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">
              {formatCalendarDate(currentDate, view)}
            </h2>
          </div>
        </div>

        {/* Right Side - Actions */}
        <div className="flex items-center space-x-2">
          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="p-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          {/* Export Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={loading}
            className="p-2"
          >
            <Download className="h-4 w-4" />
          </Button>

          {/* Add Time Block Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={openTimeBlockModal}
            disabled={loading}
            className="hidden sm:flex items-center space-x-1 px-3 py-2"
          >
            <Settings className="h-4 w-4" />
            <span>Block Time</span>
          </Button>

          {/* Add Appointment Button */}
          <Button
            size="sm"
            onClick={() => openAppointmentModal(false)}
            disabled={loading}
            className="flex items-center space-x-1 px-3 py-2"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Appointment</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </div>

      {/* Bottom Row - View Controls */}
      <div className="flex items-center justify-between">
        {/* View Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">View:</span>
          <Select value={view} onValueChange={handleViewChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="day">Day</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* View-specific Info */}
        <div className="text-sm text-gray-500">
          {view === 'month' && 'Click on a day to see appointments'}
          {view === 'week' && 'Drag appointments to reschedule'}
          {view === 'day' && 'Detailed hourly view'}
        </div>
      </div>
    </div>
  );
}

export default CalendarHeader;