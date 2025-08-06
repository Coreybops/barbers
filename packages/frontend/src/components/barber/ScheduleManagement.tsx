import React, { useState, useEffect } from 'react';
import { Barber, WeeklySchedule } from '../../types';
import { scheduleApi } from '../../services/barberApi';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useToast } from '../../hooks/useToast';
import { 
  Clock, 
  Save, 
  X, 
  RotateCcw,
  CheckCircle,
  XCircle,
  Calendar,
  Copy
} from 'lucide-react';

interface ScheduleManagementProps {
  barber: Barber;
  onClose: () => void;
}

const ScheduleManagement: React.FC<ScheduleManagementProps> = ({
  barber,
  onClose
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [schedule, setSchedule] = useState<WeeklySchedule[]>([]);
  const [originalSchedule, setOriginalSchedule] = useState<WeeklySchedule[]>([]);

  const days = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 
    'Thursday', 'Friday', 'Saturday'
  ];

  useEffect(() => {
    fetchSchedule();
  }, [barber.id]);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const scheduleData = await scheduleApi.getSchedule(barber.id);
      setSchedule(scheduleData);
      setOriginalSchedule(JSON.parse(JSON.stringify(scheduleData)));
    } catch (error) {
      console.error('Error fetching schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch schedule',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleChange = (dayOfWeek: number, field: keyof WeeklySchedule, value: any) => {
    setSchedule(prev => prev.map(day => 
      day.dayOfWeek === dayOfWeek 
        ? { ...day, [field]: value }
        : day
    ));
  };

  const toggleDayActive = (dayOfWeek: number) => {
    setSchedule(prev => prev.map(day => 
      day.dayOfWeek === dayOfWeek 
        ? { 
            ...day, 
            isActive: !day.isActive,
            startTime: day.isActive ? null : '09:00',
            endTime: day.isActive ? null : '17:00'
          }
        : day
    ));
  };

  const copySchedule = (fromDay: number, toDay: number) => {
    const sourceDay = schedule.find(day => day.dayOfWeek === fromDay);
    if (sourceDay && sourceDay.isActive) {
      setSchedule(prev => prev.map(day => 
        day.dayOfWeek === toDay 
          ? { 
              ...day, 
              isActive: true,
              startTime: sourceDay.startTime,
              endTime: sourceDay.endTime
            }
          : day
      ));
    }
  };

  const setCommonSchedule = (startTime: string, endTime: string, activeDays: number[]) => {
    setSchedule(prev => prev.map(day => ({
      ...day,
      isActive: activeDays.includes(day.dayOfWeek),
      startTime: activeDays.includes(day.dayOfWeek) ? startTime : null,
      endTime: activeDays.includes(day.dayOfWeek) ? endTime : null
    })));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Validate schedule
      for (const day of schedule) {
        if (day.isActive) {
          if (!day.startTime || !day.endTime) {
            toast({
              title: 'Validation Error',
              description: `Please set both start and end times for ${day.dayName}`,
              variant: 'destructive',
            });
            return;
          }
          
          if (day.startTime >= day.endTime) {
            toast({
              title: 'Validation Error',
              description: `Start time must be before end time for ${day.dayName}`,
              variant: 'destructive',
            });
            return;
          }
        }
      }

      await scheduleApi.updateWeeklySchedule(barber.id, schedule);
      setOriginalSchedule(JSON.parse(JSON.stringify(schedule)));
      
      toast({
        title: 'Success',
        description: 'Schedule updated successfully',
      });
    } catch (error: any) {
      console.error('Error saving schedule:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to save schedule',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const resetSchedule = () => {
    setSchedule(JSON.parse(JSON.stringify(originalSchedule)));
  };

  const hasChanges = JSON.stringify(schedule) !== JSON.stringify(originalSchedule);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Schedule Management
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Set working hours for {barber.user.firstName} {barber.user.lastName}
              </p>
            </div>
            <Button variant="ghost" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCommonSchedule('09:00', '17:00', [1, 2, 3, 4, 5])}
            >
              Mon-Fri 9-5
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCommonSchedule('10:00', '18:00', [1, 2, 3, 4, 5, 6])}
            >
              Mon-Sat 10-6
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCommonSchedule('08:00', '16:00', [1, 2, 3, 4, 5])}
            >
              Mon-Fri 8-4
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSchedule(prev => prev.map(day => ({ ...day, isActive: false, startTime: null, endTime: null })))}
            >
              Clear All
            </Button>
          </div>
        </div>

        {/* Schedule Grid */}
        <div className="p-6">
          <div className="space-y-4">
            {schedule.map((day) => (
              <div
                key={day.dayOfWeek}
                className={`p-4 rounded-lg border-2 transition-all ${
                  day.isActive 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Toggle */}
                    <button
                      onClick={() => toggleDayActive(day.dayOfWeek)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        day.isActive
                          ? 'border-green-500 bg-green-500 text-white'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {day.isActive && <CheckCircle className="w-4 h-4" />}
                    </button>

                    {/* Day Name */}
                    <div className="min-w-[100px]">
                      <h3 className={`font-medium ${day.isActive ? 'text-green-900' : 'text-gray-500'}`}>
                        {day.dayName}
                      </h3>
                    </div>

                    {/* Time Inputs */}
                    {day.isActive ? (
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <Input
                            type="time"
                            value={day.startTime || ''}
                            onChange={(e) => handleScheduleChange(day.dayOfWeek, 'startTime', e.target.value)}
                            className="w-32"
                          />
                          <span className="text-gray-500">to</span>
                          <Input
                            type="time"
                            value={day.endTime || ''}
                            onChange={(e) => handleScheduleChange(day.dayOfWeek, 'endTime', e.target.value)}
                            className="w-32"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-500 italic">Not working</div>
                    )}
                  </div>

                  {/* Copy Actions */}
                  {day.isActive && day.startTime && day.endTime && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Copy to:</span>
                      <div className="flex gap-1">
                        {schedule
                          .filter(d => d.dayOfWeek !== day.dayOfWeek)
                          .map(targetDay => (
                            <Button
                              key={targetDay.dayOfWeek}
                              size="sm"
                              variant="ghost"
                              onClick={() => copySchedule(day.dayOfWeek, targetDay.dayOfWeek)}
                              className="text-xs h-6 px-2"
                              title={`Copy to ${targetDay.dayName}`}
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              {targetDay.dayName.slice(0, 3)}
                            </Button>
                          ))
                        }
                      </div>
                    </div>
                  )}
                </div>

                {/* Schedule Summary */}
                {day.isActive && day.startTime && day.endTime && (
                  <div className="mt-2 text-sm text-gray-600">
                    Working {((new Date(`2000-01-01T${day.endTime}`).getTime() - new Date(`2000-01-01T${day.startTime}`).getTime()) / (1000 * 60 * 60)).toFixed(1)} hours
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Schedule Summary */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Weekly Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Working Days:</span>
                <span className="ml-2 font-medium">
                  {schedule.filter(day => day.isActive).length}
                </span>
              </div>
              <div>
                <span className="text-blue-700">Total Hours:</span>
                <span className="ml-2 font-medium">
                  {schedule
                    .filter(day => day.isActive && day.startTime && day.endTime)
                    .reduce((total, day) => {
                      const hours = (new Date(`2000-01-01T${day.endTime!}`).getTime() - 
                                   new Date(`2000-01-01T${day.startTime!}`).getTime()) / (1000 * 60 * 60);
                      return total + hours;
                    }, 0)
                    .toFixed(1)
                  }h
                </span>
              </div>
              <div>
                <span className="text-blue-700">Earliest Start:</span>
                <span className="ml-2 font-medium">
                  {schedule
                    .filter(day => day.isActive && day.startTime)
                    .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
                    [0]?.startTime || 'N/A'
                  }
                </span>
              </div>
              <div>
                <span className="text-blue-700">Latest End:</span>
                <span className="ml-2 font-medium">
                  {schedule
                    .filter(day => day.isActive && day.endTime)
                    .sort((a, b) => (b.endTime || '').localeCompare(a.endTime || ''))
                    [0]?.endTime || 'N/A'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-4">
            {hasChanges && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetSchedule}
                className="text-gray-600"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Changes
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving || !hasChanges}
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Schedule'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleManagement;