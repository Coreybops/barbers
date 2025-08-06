import React from 'react';
import { format } from 'date-fns';
import { 
  X, 
  Clock, 
  User, 
  Scissors, 
  Phone, 
  Mail, 
  DollarSign,
  FileText,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { CalendarEvent } from '../../types';
import { useCalendarStore } from '../../store/calendarStore';
import { Button } from '../ui/button';
import { cn } from '../../utils/cn';

interface CalendarEventDetailsProps {
  event: CalendarEvent;
  onClose: () => void;
}

export function CalendarEventDetails({ event, onClose }: CalendarEventDetailsProps) {
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {isAppointment ? 'Appointment Details' : 'Time Block Details'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Time and Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-gray-500" />
              <div>
                <div className="font-medium">
                  {format(event.start, 'MMM d, yyyy')}
                </div>
                <div className="text-sm text-gray-600">
                  {format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}
                </div>
              </div>
            </div>
            
            <div className={cn(
              'px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1',
              getStatusColor(event.status)
            )}>
              {getStatusIcon(event.status)}
              <span>{event.status.replace('_', ' ')}</span>
            </div>
          </div>

          {/* Appointment Details */}
          {isAppointment && appointment && (
            <>
              {/* Customer Info */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-gray-500" />
                  <div>
                    <div className="font-medium">
                      {appointment.customer.firstName} {appointment.customer.lastName}
                    </div>
                    {appointment.customer.phone && (
                      <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <Phone className="h-3 w-3" />
                        <span>{appointment.customer.phone}</span>
                      </div>
                    )}
                    {appointment.customer.email && (
                      <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <Mail className="h-3 w-3" />
                        <span>{appointment.customer.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Service Info */}
                <div className="flex items-center space-x-2">
                  <Scissors className="h-5 w-5 text-gray-500" />
                  <div>
                    <div className="font-medium">{appointment.service.name}</div>
                    <div className="text-sm text-gray-600">
                      {appointment.service.duration} minutes
                    </div>
                  </div>
                </div>

                {/* Barber Info */}
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-gray-500" />
                  <div>
                    <div className="font-medium">
                      {appointment.barber.user.firstName} {appointment.barber.user.lastName}
                    </div>
                    <div className="text-sm text-gray-600">Barber</div>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-gray-500" />
                  <div>
                    <div className="font-medium">${appointment.totalPrice.toFixed(2)}</div>
                    <div className="text-sm text-gray-600">
                      Payment: {appointment.paymentStatus.toLowerCase().replace('_', ' ')}
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {appointment.notes && (
                  <div className="flex items-start space-x-2">
                    <FileText className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <div className="font-medium">Notes</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {appointment.notes}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Status Updates */}
              {appointment.status !== 'COMPLETED' && appointment.status !== 'CANCELLED' && (
                <div className="border-t pt-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">Quick Actions</div>
                  <div className="flex flex-wrap gap-2">
                    {appointment.status === 'PENDING' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange('CONFIRMED')}
                        className="text-emerald-600 hover:text-emerald-700"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
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
                        <Clock className="h-3 w-3 mr-1" />
                        Start
                      </Button>
                    )}
                    
                    {appointment.status === 'IN_PROGRESS' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange('COMPLETED')}
                        className="text-gray-600 hover:text-gray-700"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
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
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: event.color }}
                />
                <div>
                  <div className="font-medium">{event.title}</div>
                  <div className="text-sm text-gray-600 capitalize">
                    {event.type.replace('_', ' ')} time block
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-2 p-4 border-t bg-gray-50">
          {isAppointment && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                className="flex items-center space-x-1"
              >
                <Edit className="h-3 w-3" />
                <span>Edit</span>
              </Button>
              
              {appointment?.status !== 'COMPLETED' && appointment?.status !== 'CANCELLED' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Cancel</span>
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default CalendarEventDetails;