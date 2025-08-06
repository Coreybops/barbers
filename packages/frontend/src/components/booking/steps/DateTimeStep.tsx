import React, { useState, useEffect } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight, Users, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useBookingStore } from '@/store/bookingStore';
import { AvailabilitySlotDetails } from '@/types';
import { formatDate, formatDateRelative, formatTime, isToday, isTomorrow } from '@/utils/format';

export const DateTimeStep: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'calendar'>('week');

  const {
    selectedBarbershop,
    selectedService,
    selectedBarber,
    selectedTimeSlot,
    availableSlots,
    availabilityLoading,
    loadAvailability,
    setDate,
    setTimeSlot
  } = useBookingStore();

  // Generate week dates
  const getWeekDates = (startDate: Date) => {
    const dates = [];
    const start = new Date(startDate);
    start.setDate(start.getDate() - start.getDay()); // Start from Sunday
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates(currentWeek);

  // Load availability when date changes
  useEffect(() => {
    if (selectedDate && selectedBarbershop && selectedService) {
      loadAvailability(
        selectedBarbershop.id,
        selectedService.id,
        selectedDate,
        selectedBarber?.id
      );
    }
  }, [selectedDate, selectedBarbershop, selectedService, selectedBarber, loadAvailability]);

  // Set initial date to today
  useEffect(() => {
    if (!selectedDate) {
      const today = new Date().toISOString().split('T')[0];
      setSelectedDate(today);
      setDate(today);
    }
  }, [selectedDate, setDate]);

  const handleDateSelect = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    setSelectedDate(dateString);
    setDate(dateString);
    setTimeSlot(null as any); // Clear selected time slot
  };

  const handleTimeSlotSelect = (slot: AvailabilitySlotDetails) => {
    setTimeSlot(slot);
  };

  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeek(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeek(newDate);
  };

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const getDayLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const getTimeSlotsByPeriod = (slots: AvailabilitySlotDetails[]) => {
    const periods = {
      morning: slots.filter(slot => {
        const hour = new Date(slot.startTime).getHours();
        return hour >= 6 && hour < 12;
      }),
      afternoon: slots.filter(slot => {
        const hour = new Date(slot.startTime).getHours();
        return hour >= 12 && hour < 17;
      }),
      evening: slots.filter(slot => {
        const hour = new Date(slot.startTime).getHours();
        return hour >= 17 && hour < 22;
      })
    };
    return periods;
  };

  const timeSlotsByPeriod = getTimeSlotsByPeriod(availableSlots);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Select Date & Time
        </h2>
        <p className="text-gray-600">
          Choose when you'd like your {selectedService?.name} appointment
          {selectedBarber && ` with ${selectedBarber.user?.firstName} ${selectedBarber.user?.lastName}`}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Date Selection */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Select Date</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousWeek}
                disabled={currentWeek <= new Date()}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium text-gray-600 min-w-[120px] text-center">
                {currentWeek.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextWeek}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Week View */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {weekDates.map((date) => {
              const dateString = date.toISOString().split('T')[0];
              const isSelected = selectedDate === dateString;
              const isPast = isPastDate(date);
              
              return (
                <Card
                  key={dateString}
                  className={`p-3 cursor-pointer transition-all duration-200 text-center ${
                    isPast
                      ? 'opacity-50 cursor-not-allowed bg-gray-100'
                      : isSelected
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                  onClick={() => !isPast && handleDateSelect(date)}
                >
                  <div className={`text-xs font-medium mb-1 ${
                    isSelected ? 'text-blue-700' : 'text-gray-600'
                  }`}>
                    {getDayLabel(date)}
                  </div>
                  <div className={`text-lg font-semibold ${
                    isSelected ? 'text-blue-900' : isPast ? 'text-gray-400' : 'text-gray-900'
                  }`}>
                    {date.getDate()}
                  </div>
                  <div className={`text-xs ${
                    isSelected ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {date.toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Quick Date Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDateSelect(new Date())}
              disabled={selectedDate === new Date().toISOString().split('T')[0]}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                handleDateSelect(tomorrow);
              }}
              disabled={selectedDate === new Date(Date.now() + 86400000).toISOString().split('T')[0]}
            >
              Tomorrow
            </Button>
          </div>
        </div>

        {/* Time Selection */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Available Times
            </h3>
            {selectedDate && (
              <Badge variant="outline" className="text-xs">
                {formatDateRelative(selectedDate)}
              </Badge>
            )}
          </div>

          {availabilityLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
              <span className="ml-2 text-sm text-gray-600">Loading times...</span>
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <Clock className="h-12 w-12 mx-auto" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">
                No Available Times
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                No time slots are available for {formatDateRelative(selectedDate)}.
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    handleDateSelect(tomorrow);
                  }}
                >
                  Try Tomorrow
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    /* TODO: Implement waitlist */
                  }}
                >
                  Join Waitlist
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Morning */}
              {timeSlotsByPeriod.morning.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <span>Morning</span>
                    <Badge variant="secondary" className="text-xs">
                      {timeSlotsByPeriod.morning.length} available
                    </Badge>
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlotsByPeriod.morning.map((slot) => {
                      const isSelected = selectedTimeSlot?.startTime === slot.startTime;
                      return (
                        <Button
                          key={slot.startTime}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          className={`text-sm ${isSelected ? 'bg-blue-600' : ''}`}
                          onClick={() => handleTimeSlotSelect(slot)}
                        >
                          {slot.displayTime}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Afternoon */}
              {timeSlotsByPeriod.afternoon.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <span>Afternoon</span>
                    <Badge variant="secondary" className="text-xs">
                      {timeSlotsByPeriod.afternoon.length} available
                    </Badge>
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlotsByPeriod.afternoon.map((slot) => {
                      const isSelected = selectedTimeSlot?.startTime === slot.startTime;
                      return (
                        <Button
                          key={slot.startTime}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          className={`text-sm ${isSelected ? 'bg-blue-600' : ''}`}
                          onClick={() => handleTimeSlotSelect(slot)}
                        >
                          {slot.displayTime}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Evening */}
              {timeSlotsByPeriod.evening.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <span>Evening</span>
                    <Badge variant="secondary" className="text-xs">
                      {timeSlotsByPeriod.evening.length} available
                    </Badge>
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlotsByPeriod.evening.map((slot) => {
                      const isSelected = selectedTimeSlot?.startTime === slot.startTime;
                      return (
                        <Button
                          key={slot.startTime}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          className={`text-sm ${isSelected ? 'bg-blue-600' : ''}`}
                          onClick={() => handleTimeSlotSelect(slot)}
                        >
                          {slot.displayTime}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Selected Time Info */}
              {selectedTimeSlot && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-700 mb-2">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium text-sm">Selected Time</span>
                  </div>
                  <div className="text-blue-900">
                    <div className="font-semibold">
                      {formatDateRelative(selectedDate)} at {selectedTimeSlot.displayTime}
                    </div>
                    <div className="text-sm text-blue-700 mt-1">
                      Duration: {selectedService?.duration} minutes
                      {selectedTimeSlot.barberName && (
                        <span> • With {selectedTimeSlot.barberName}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Booking Tips */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-gray-600">
            <div className="font-medium mb-1">Booking Tips:</div>
            <ul className="space-y-1 text-xs">
              <li>• Morning slots (8-11 AM) are usually less busy</li>
              <li>• Weekday appointments often have more availability</li>
              <li>• Book 24-48 hours in advance for best selection</li>
              <li>• Consider flexible timing for more options</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};