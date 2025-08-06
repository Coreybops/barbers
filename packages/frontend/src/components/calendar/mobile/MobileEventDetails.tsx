import React from 'react';
import { format } from 'date-fns';
import { 
  X, 
  Clock, 
  User, 
  Scissors, 
  Phone, 
  DollarSign,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { CalendarEvent } from '../../../types';
import { useCalendarStore } from '../../../store/calendarStore';
import { Button } from '../../ui/button';
import { cn } from '../../../utils/cn';

interface MobileEventDetailsProps {
  event: CalendarEvent;
  onClose: () => void;
}

export function MobileEventDetails({ event, onClose }: MobileEventDetailsProps) {
  const {
    openAppointmentModal,
    cancelAppointment,
    updateAppointment,
    selectEvent
  } = useCalendarStore();

  const appointment = event.appointment;
  const isAppointment = event.type === 'appointment';

  const handleEdit = () => {
    selectEvent(event);
    openAppointmentModal(true);
  };

  const handleCancel = async () => {
    if (appointment && window.confirm('Are you sure you want to cancel this appointment?')) {
      await cancelAppointment(appointment.id);
      onClose();
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (appointment) {
      await updateAppointment(appointment.id, { status: newStatus as any });
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      PENDING: 'text-amber-700 bg-amber-100',
      CONFIRMED: 'text-emerald-700 bg-emerald-100',
      IN_PROGRESS: 'text-blue-700 bg-blue-100',
      COMPLETED: 'text-gray-700 bg-gray-100',
      CANCELLED: 'text-red-700 bg-red-100',
      NO_SHOW: 'text-red-700 bg-red-100'
    };
    return colors[status as keyof typeof colors] || 'text-gray-700 bg-gray-100';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <CheckCircle className="h-4 w-4" />;
      case 'CANCELLED':
      case 'NO_SHOW':
        return <XCircle className="h-4 w-4" />;
      case 'PENDING':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
      <div className="bg-white rounded-t-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h3 className="text-lg font-semibold text-gray-900">
            {isAppointment ? 'Appointment' : 'Time Block'}
          </h3>
          <button
            onTouchStart={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Time and Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-gray-500" />
              <div>
                <div className="font-medium text-lg">
                  {format(event.start, 'MMM d, yyyy')}
                </div>
                <div className="text-gray-600">
                  {format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}
                </div>
              </div>
            </div>
            
            <div className={cn(
              'px-3 py-2 rounded-full text-sm font-medium flex items-center space-x-2',
              getStatusColor(event.status)
            )}>
              {getStatusIcon(event.status)}
              <span>{event.status.replace('_', ' ')}</span>
            </div>
          </div>

          {/* Appointment Details */}
          {isAppointment && appointment && (
            <>
              {/* Service */}
              <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <Scissors className="h-5 w-5 text-gray-500 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-lg">{appointment.service.name}</div>
                  <div className="text-sm text-gray-600">
                    {appointment.service.duration} minutes
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-lg flex items-center">
                    <DollarSign className="h-4 w-4" />
                    {appointment.totalPrice.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-600">
                    {appointment.paymentStatus.toLowerCase().replace('_', ' ')}
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <User className="h-5 w-5 text-gray-500 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-lg">
                    {appointment.customer.firstName} {appointment.customer.lastName}
                  </div>
                  {appointment.customer.phone && (
                    <div className="flex items-center space-x-1 text-sm text-gray-600 mt-1">
                      <Phone className="h-3 w-3" />
                      <a 
                        href={`tel:${appointment.customer.phone}`}
                        className="text-blue-600 hover:underline"
                      >
                        {appointment.customer.phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Barber Info */}
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <User className="h-5 w-5 text-gray-500" />
                <div>
                  <div className="font-medium">
                    {appointment.barber.user.firstName} {appointment.barber.user.lastName}
                  </div>
                  <div className="text-sm text-gray-600">Barber</div>
                </div>
              </div>

              {/* Notes */}
              {appointment.notes && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-2">Notes</div>
                  <div className="text-sm text-gray-600">
                    {appointment.notes}
                  </div>
                </div>
              )}

              {/* Quick Status Updates */}
              {appointment.status !== 'COMPLETED' && appointment.status !== 'CANCELLED' && (
                <div className="space-y-3">
                  <div className="text-sm font-medium text-gray-700">Quick Actions</div>
                  <div className="grid grid-cols-2 gap-2">
                    {appointment.status === 'PENDING' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange('CONFIRMED')}
                        className="text-emerald-600 hover:text-emerald-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Confirm
                      </Button>
                    )}
                    
                    {(appointment.status === 'CONFIRMED' || appointment.status === 'PENDING') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange('IN_PROGRESS')}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        Start
                      </Button>
                    )}
                    
                    {appointment.status === 'IN_PROGRESS' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange('COMPLETED')}
                        className="text-gray-600 hover:text-gray-700 col-span-2"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Complete
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Time Block Details */}
          {!isAppointment && (
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div 
                className="w-5 h-5 rounded-full flex-shrink-0"
                style={{ backgroundColor: event.color }}
              />
              <div>
                <div className="font-medium text-lg">{event.title}</div>
                <div className="text-sm text-gray-600 capitalize">
                  {event.type.replace('_', ' ')} time block
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {isAppointment && (
          <div className="p-4 border-t bg-gray-50 space-y-2">
            <Button
              className="w-full"
              onClick={handleEdit}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Appointment
            </Button>
            
            {appointment?.status !== 'COMPLETED' && appointment?.status !== 'CANCELLED' && (
              <Button
                variant="outline"
                className="w-full text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                onClick={handleCancel}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Cancel Appointment
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MobileEventDetails;