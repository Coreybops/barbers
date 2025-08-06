import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { format, addMinutes } from 'date-fns';
import { 
  X, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Scissors, 
  DollarSign,
  ChevronDown
} from 'lucide-react';
import { useCalendarStore } from '../../../store/calendarStore';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
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

export function MobileAppointmentForm() {
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
  const [showCustomerSelect, setShowCustomerSelect] = useState(false);
  const [showBarberSelect, setShowBarberSelect] = useState(false);
  const [showServiceSelect, setShowServiceSelect] = useState(false);

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
  const watchedCustomerId = watch('customerId');
  const watchedBarberId = watch('barberId');

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
    setShowCustomerSelect(false);
    setShowBarberSelect(false);
    setShowServiceSelect(false);
    closeAppointmentModal();
  };

  const getSelectedCustomer = () => mockCustomers.find(c => c.id === watchedCustomerId);
  const getSelectedBarber = () => mockBarbers.find(b => b.id === watchedBarberId);
  const getSelectedService = () => mockServices.find(s => s.id === watchedServiceId);

  if (!isAppointmentModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
      <div className="bg-white rounded-t-lg w-full max-w-md max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h3 className="text-lg font-semibold text-gray-900">
            {isEditingAppointment ? 'Edit Appointment' : 'New Appointment'}
          </h3>
          <button
            onTouchStart={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
          {/* Customer Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <User className="h-4 w-4 mr-1" />
              Customer
            </label>
            <div
              className="p-3 border border-gray-300 rounded-md bg-white cursor-pointer"
              onClick={() => setShowCustomerSelect(!showCustomerSelect)}
            >
              <div className="flex items-center justify-between">
                <span className={getSelectedCustomer() ? 'text-gray-900' : 'text-gray-500'}>
                  {getSelectedCustomer() ? 
                    `${getSelectedCustomer()!.firstName} ${getSelectedCustomer()!.lastName}` : 
                    'Select a customer'
                  }
                </span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
              {getSelectedCustomer() && (
                <div className="text-xs text-gray-500 mt-1">
                  {getSelectedCustomer()!.phone}
                </div>
              )}
            </div>
            
            {showCustomerSelect && (
              <div className="border border-gray-200 rounded-md bg-white max-h-40 overflow-y-auto">
                {mockCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className="p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 active:bg-gray-100"
                    onClick={() => {
                      setValue('customerId', customer.id);
                      setShowCustomerSelect(false);
                    }}
                  >
                    <div className="font-medium">{customer.firstName} {customer.lastName}</div>
                    <div className="text-xs text-gray-500">{customer.phone}</div>
                  </div>
                ))}
              </div>
            )}
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
            <div
              className="p-3 border border-gray-300 rounded-md bg-white cursor-pointer"
              onClick={() => setShowBarberSelect(!showBarberSelect)}
            >
              <div className="flex items-center justify-between">
                <span className={getSelectedBarber() ? 'text-gray-900' : 'text-gray-500'}>
                  {getSelectedBarber() ? getSelectedBarber()!.name : 'Select a barber'}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
              {getSelectedBarber() && (
                <div className="text-xs text-gray-500 mt-1">
                  {getSelectedBarber()!.specialties.join(', ')}
                </div>
              )}
            </div>
            
            {showBarberSelect && (
              <div className="border border-gray-200 rounded-md bg-white max-h-40 overflow-y-auto">
                {mockBarbers.map((barber) => (
                  <div
                    key={barber.id}
                    className="p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 active:bg-gray-100"
                    onClick={() => {
                      setValue('barberId', barber.id);
                      setShowBarberSelect(false);
                    }}
                  >
                    <div className="font-medium">{barber.name}</div>
                    <div className="text-xs text-gray-500">{barber.specialties.join(', ')}</div>
                  </div>
                ))}
              </div>
            )}
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
            <div
              className="p-3 border border-gray-300 rounded-md bg-white cursor-pointer"
              onClick={() => setShowServiceSelect(!showServiceSelect)}
            >
              <div className="flex items-center justify-between">
                <span className={getSelectedService() ? 'text-gray-900' : 'text-gray-500'}>
                  {getSelectedService() ? getSelectedService()!.name : 'Select a service'}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </div>
              {getSelectedService() && (
                <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                  <span>{getSelectedService()!.duration} min</span>
                  <span>${getSelectedService()!.price.toFixed(2)}</span>
                </div>
              )}
            </div>
            
            {showServiceSelect && (
              <div className="border border-gray-200 rounded-md bg-white max-h-40 overflow-y-auto">
                {mockServices.map((service) => (
                  <div
                    key={service.id}
                    className="p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 active:bg-gray-100"
                    onClick={() => {
                      setValue('serviceId', service.id);
                      setShowServiceSelect(false);
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{service.name}</div>
                        <div className="text-xs text-gray-500">{service.duration} min</div>
                      </div>
                      <div className="font-medium">${service.price.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                <div className="text-center">
                  <div className="text-gray-600">Duration</div>
                  <div className="font-medium">{selectedService.duration}m</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-600">End Time</div>
                  <div className="font-medium">{calculatedEndTime}</div>
                </div>
                <div className="text-center">
                  <div className="text-gray-600">Price</div>
                  <div className="font-medium flex items-center justify-center">
                    <DollarSign className="h-4 w-4" />
                    {selectedService.price.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Notes (Optional)
            </label>
            <Textarea
              {...register('notes')}
              placeholder="Any special instructions or notes..."
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            <Button
              type="submit"
              className="w-full"
              disabled={loading || !selectedService}
            >
              {loading && <LoadingSpinner size="sm" className="mr-2" />}
              {isEditingAppointment ? 'Update Appointment' : 'Create Appointment'}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MobileAppointmentForm;