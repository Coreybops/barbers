import React from 'react';
import { Calendar } from '../components/calendar/Calendar';

export function CalendarPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-600 mt-2">
            Manage appointments and schedule with your interactive calendar.
          </p>
        </div>

        {/* Calendar Component */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <Calendar 
            showFilters={true}
            showHeader={true}
            defaultView="month"
            className="h-[calc(100vh-200px)]"
          />
        </div>
      </div>
    </div>
  );
}

export default CalendarPage;