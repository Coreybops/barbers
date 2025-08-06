import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { format, addHours } from 'date-fns';
import { 
  X, 
  Clock, 
  User, 
  Settings,
  Calendar as CalendarIcon,
  Repeat,
  AlertCircle
} from 'lucide-react';
import { useCalendarStore } from '../../../store/calendarStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Textarea } from '../../ui/textarea';
import { Checkbox } from '../../ui/checkbox';
import { LoadingSpinner } from '../../ui/LoadingSpinner';

// Mock data - replace with actual API calls
const mockBarbers = [
  { id: '1', name: 'John Smith' },
  { id: '2', name: 'Mike Johnson' },
  { id: '3', name: 'Sarah Wilson' }
];

const timeBlockTypes = [
  { value: 'break', label: 'Break', color: '#fbbf24' },
  { value: 'lunch', label: 'Lunch', color: '#10b981' },
  { value: 'blocked', label: 'Blocked Time', color: '#ef4444' },
  { value: 'holiday', label: 'Holiday', color: '#8b5cf6' }
];

interface TimeBlockFormData {
  title: string;
  type: 'break' | 'lunch' | 'blocked' | 'holiday';
  barberId: string;
  date: string;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  recurringType: 'daily' | 'weekly' | 'monthly';
  recurringInterval: number;
  endDate: string;
  notes: string;
}

export function TimeBlockModal() {
  const {
    isTimeBlockModalOpen,
    selectedDate,
    loading,
    closeTimeBlockModal,
    createTimeBlock
  } = useCalendarStore();

  const [showRecurringOptions, setShowRecurringOptions] = useState(false);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<TimeBlockFormData>({
    defaultValues: {
      title: '',
      type: 'break',
      barberId: '',
      date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      startTime: selectedDate ? format(selectedDate, 'HH:mm') : '12:00',
      endTime: selectedDate ? format(addHours(selectedDate, 1), 'HH:mm') : '13:00',
      isRecurring: false,
      recurringType: 'weekly',
      recurringInterval: 1,
      endDate: format(addHours(new Date(), 24 * 30), 'yyyy-MM-dd'), // 30 days from now
      notes: ''
    }
  });

  const watchedType = watch('type');
  const watchedIsRecurring = watch('isRecurring');

  const onSubmit = async (data: TimeBlockFormData) => {
    const startDateTime = new Date(`${data.date}T${data.startTime}`);
    const endDateTime = new Date(`${data.date}T${data.endTime}`);

    const timeBlockData = {
      title: data.title || getDefaultTitle(data.type),
      type: data.type,
      start: startDateTime,
      end: endDateTime,
      barberId: data.barberId || undefined,
      isRecurring: data.isRecurring,
      recurringPattern: data.isRecurring ? {
        type: data.recurringType,
        interval: data.recurringInterval,
        endDate: new Date(data.endDate)
      } : undefined,
      color: timeBlockTypes.find(t => t.value === data.type)?.color || '#6b7280'
    };

    try {
      await createTimeBlock(timeBlockData);
      handleClose();
    } catch (error) {
      console.error('Failed to create time block:', error);
    }
  };

  const getDefaultTitle = (type: string) => {
    const titles = {
      break: 'Break',
      lunch: 'Lunch Break',
      blocked: 'Blocked Time',
      holiday: 'Holiday'
    };
    return titles[type as keyof typeof titles] || 'Time Block';
  };

  const handleClose = () => {
    reset();
    setShowRecurringOptions(false);
    closeTimeBlockModal();
  };

  if (!isTimeBlockModalOpen) return null;

  return (
    <Dialog open={isTimeBlockModalOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Block Time</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Title
            </label>
            <Input
              {...register('title')}
              placeholder={`Enter title or leave blank for default`}
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Type
            </label>
            <Select 
              value={watchedType} 
              onValueChange={(value) => setValue('type', value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeBlockTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: type.color }}
                      />
                      <span>{type.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Barber Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <User className="h-4 w-4 mr-1" />
              Barber (Optional)
            </label>
            <Select 
              value={watch('barberId')} 
              onValueChange={(value) => setValue('barberId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All barbers (shop-wide block)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All barbers (shop-wide)</SelectItem>
                {mockBarbers.map((barber) => (
                  <SelectItem key={barber.id} value={barber.id}>
                    {barber.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Leave empty to block time for all barbers
            </p>
          </div>

          {/* Date and Time */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <CalendarIcon className="h-4 w-4 mr-1" />
                Date
              </label>
              <Input
                type="date"
                {...register('date', { required: 'Date is required' })}
              />
              {errors.date && (
                <p className="text-sm text-red-600">{errors.date.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Start Time
                </label>
                <Input
                  type="time"
                  {...register('startTime', { required: 'Start time is required' })}
                />
                {errors.startTime && (
                  <p className="text-sm text-red-600">{errors.startTime.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  End Time
                </label>
                <Input
                  type="time"
                  {...register('endTime', { required: 'End time is required' })}
                />
                {errors.endTime && (
                  <p className="text-sm text-red-600">{errors.endTime.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Recurring Options */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isRecurring"
                checked={watchedIsRecurring}
                onCheckedChange={(checked) => {
                  setValue('isRecurring', checked as boolean);
                  setShowRecurringOptions(checked as boolean);
                }}
              />
              <label htmlFor="isRecurring" className="text-sm font-medium text-gray-700 flex items-center">
                <Repeat className="h-4 w-4 mr-1" />
                Repeat this time block
              </label>
            </div>

            {showRecurringOptions && watchedIsRecurring && (
              <div className="pl-6 space-y-3 border-l-2 border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Repeat
                    </label>
                    <Select 
                      value={watch('recurringType')} 
                      onValueChange={(value) => setValue('recurringType', value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Every
                    </label>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        min="1"
                        max="30"
                        {...register('recurringInterval', { 
                          required: 'Interval is required',
                          min: 1,
                          max: 30
                        })}
                        className="w-20"
                      />
                      <span className="text-sm text-gray-600">
                        {watch('recurringType') === 'daily' && 'day(s)'}
                        {watch('recurringType') === 'weekly' && 'week(s)'}
                        {watch('recurringType') === 'monthly' && 'month(s)'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    End Date
                  </label>
                  <Input
                    type="date"
                    {...register('endDate', { required: 'End date is required' })}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Notes (Optional)
            </label>
            <Textarea
              {...register('notes')}
              placeholder="Additional notes or reasons for blocking time..."
              rows={2}
            />
          </div>

          {/* Warning for shop-wide blocks */}
          {!watch('barberId') && (
            <div className="flex items-start space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">Shop-wide time block</p>
                <p>This will block the selected time for all barbers in the shop.</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading && <LoadingSpinner size="sm" className="mr-2" />}
              Block Time
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default TimeBlockModal;