import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { format, addMinutes } from 'date-fns';
import { 
  X, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Scissors, 
  Phone, 
  Mail,
  FileText,
  DollarSign
} from 'lucide-react';
import { useCalendarStore } from '../../../store/calendarStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Textarea } from '../../ui/textarea';
import { LoadingSpinner } from '../../ui/LoadingSpinner';

// Mock data - replace with actual API calls
const mockBarbers = [
  { id: '1', name: 'John Smith', specialties: ['Haircut', 'Beard Trim'] },
  { id: '2', name: 'Mike Johnson', specialties: ['Haircut', 'Styling'] },
  { id: '3', name: 'Sarah Wilson', specialties: ['Haircut', 'Coloring'] }
];

const mockServices = [
  { id: '1', name: 'Haircut', duration: 30, price: 25.00 },
  { id: '2', name: 'Beard Trim', duration: 15, price: 15.00 },
  { id: '3', name: 'Hair Wash', duration: 10, price: 10.00 },
  { id: '4', name: 'Styling', duration: 45, price: 35.00 }
];

const mockCustomers = [
  { id: '1', firstName: 'John', lastName: 'Doe', phone: '555-0101', email: 'john@example.com' },
  { id: '2', firstName: 'Jane', lastName: 'Smith', phone: '555-0102', email: 'jane@example.com' },
  { id: '3', firstName: 'Bob', lastName: 'Johnson', phone: '555-0103', email: 'bob@example.com' }
];

interface AppointmentFormData {
  customerId: string;
  barberId: string;
  serviceId: string;
  date: string;
  startTime: string;
  notes: string;
}

export function AppointmentModal() {
  const {
    isAppointmentModalOpen,
    isEditingAppointment,
    selectedEvent,
    selectedDate,
    loading,
    closeAppointmentModal,
    createAppointment,
    updateAppointment
  } = useCalendarStore();

  const [selectedService, setSelectedService] = useState<typeof mockServices[0] | null>(null);
  const [calculatedEndTime, setCalculatedEndTime] = useState<string>('');

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<AppointmentFormData>({
    defaultValues: {
      customerId: '',
      barberId: '',
      serviceId: '',
      date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      startTime: selectedDate ? format(selectedDate, 'HH:mm') : '09:00',
      notes: ''
    }
  });

  const watchedServiceId = watch('serviceId');
  const watchedStartTime = watch('startTime');

  // Update form when editing an existing appointment
  useEffect(() => {
    if (isEditingAppointment && selectedEvent?.appointment) {
      const appointment = selectedEvent.appointment;
      reset({
        customerId: appointment.customerId,
        barberId: appointment.barberId,
        serviceId: appointment.serviceId,
        date: format(new Date(appointment.date), 'yyyy-MM-dd'),
        startTime: format(new Date(appointment.startTime), 'HH:mm'),
        notes: appointment.notes || ''
      });
    } else if (selectedDate) {
      setValue('date', format(selectedDate, 'yyyy-MM-dd'));
      setValue('startTime', format(selectedDate, 'HH:mm'));
    }
  }, [isEditingAppointment, selectedEvent, selectedDate, reset, setValue]);

  // Calculate end time when service or start time changes
  useEffect(() => {
    const service = mockServices.find(s => s.id === watchedServiceId);
    setSelectedService(service || null);

    if (service && watchedStartTime) {
      const [hours, minutes] = watchedStartTime.split(':').map(Number);
      const startTime = new Date();
      startTime.setHours(hours, minutes, 0, 0);
      const endTime = addMinutes(startTime, service.duration);
      setCalculatedEndTime(format(endTime, 'HH:mm'));
    }
  }, [watchedServiceId, watchedStartTime]);

  const onSubmit = async (data: AppointmentFormData) => {
    if (!selectedService) return;

    const [hours, minutes] = data.startTime.split(':').map(Number);
    const startDateTime = new Date(data.date);
    startDateTime.setHours(hours, minutes, 0, 0);
    
    const endDateTime = addMinutes(startDateTime, selectedService.duration);

    const appointmentData = {
      customerId: data.customerId,
      barberId: data.barberId,
      serviceId: data.serviceId,
      date: data.date,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      notes: data.notes
    };

    try {
      if (isEditingAppointment && selectedEvent) {
        await updateAppointment(selectedEvent.id, appointmentData);
      } else {
        await createAppointment(appointmentData);
      }
    } catch (error) {
      console.error('Failed to save appointment:', error);
    }
  };

  const handleClose = () => {
    reset();
    closeAppointmentModal();
  };

  if (!isAppointmentModalOpen) return null;

  return (
    <Dialog open={isAppointmentModalOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5" />
            <span>
              {isEditingAppointment ? 'Edit Appointment' : 'New Appointment'}
            </span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Customer Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <User className="h-4 w-4 mr-1" />
              Customer
            </label>
            <Select 
              value={watch('customerId')} 
              onValueChange={(value) => setValue('customerId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a customer" />
              </SelectTrigger>
              <SelectContent>
                {mockCustomers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    <div className="flex flex-col">
                      <span>{customer.firstName} {customer.lastName}</span>
                      <span className="text-xs text-gray-500">{customer.phone}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.customerId && (
              <p className="text-sm text-red-600">Customer is required</p>
            )}
          </div>

          {/* Barber Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <User className="h-4 w-4 mr-1" />
              Barber
            </label>
            <Select 
              value={watch('barberId')} 
              onValueChange={(value) => setValue('barberId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a barber" />
              </SelectTrigger>
              <SelectContent>
                {mockBarbers.map((barber) => (
                  <SelectItem key={barber.id} value={barber.id}>
                    <div className="flex flex-col">
                      <span>{barber.name}</span>
                      <span className="text-xs text-gray-500">
                        {barber.specialties.join(', ')}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.barberId && (
              <p className="text-sm text-red-600">Barber is required</p>
            )}
          </div>

          {/* Service Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <Scissors className="h-4 w-4 mr-1" />
              Service
            </label>
            <Select 
              value={watch('serviceId')} 
              onValueChange={(value) => setValue('serviceId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent>
                {mockServices.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    <div className="flex justify-between items-center w-full">
                      <div className="flex flex-col">
                        <span>{service.name}</span>
                        <span className="text-xs text-gray-500">
                          {service.duration} min
                        </span>
                      </div>
                      <span className="font-medium">${service.price.toFixed(2)}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.serviceId && (
              <p className="text-sm text-red-600">Service is required</p>
            )}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
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
          </div>

          {/* Duration and Price Display */}
          {selectedService && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Duration:</span>
                  <div className="font-medium">{selectedService.duration} minutes</div>
                </div>
                <div>
                  <span className="text-gray-600">End Time:</span>
                  <div className="font-medium">{calculatedEndTime}</div>
                </div>
                <div>
                  <span className="text-gray-600">Price:</span>
                  <div className="font-medium flex items-center">
                    <DollarSign className="h-4 w-4" />
                    {selectedService.price.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <FileText className="h-4 w-4 mr-1" />
              Notes (Optional)
            </label>
            <Textarea
              {...register('notes')}
              placeholder="Any special instructions or notes..."
              rows={3}
            />
          </div>

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
              disabled={loading || !selectedService}
            >
              {loading && <LoadingSpinner size="sm" className="mr-2" />}
              {isEditingAppointment ? 'Update Appointment' : 'Create Appointment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AppointmentModal;