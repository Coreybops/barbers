import React from 'react';
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  User, 
  Scissors, 
  Calendar, 
  Mail, 
  Phone,
  MessageSquare,
  Repeat,
  AlertTriangle,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useBookingStore } from '@/store/bookingStore';
import { 
  formatCurrency, 
  formatDate, 
  formatTime, 
  formatDuration,
  formatPhoneNumber 
} from '@/utils/format';

interface ConfirmationStepProps {
  onConfirm: () => void;
}

export const ConfirmationStep: React.FC<ConfirmationStepProps> = ({ onConfirm }) => {
  const {
    selectedBarbershop,
    selectedService,
    selectedBarber,
    selectedDate,
    selectedTimeSlot,
    guestInfo,
    recurringBooking,
    isBooking,
    getBookingSummary
  } = useBookingStore();

  const summary = getBookingSummary();

  const getRecurringDescription = () => {
    if (!recurringBooking) return null;
    
    const { type, interval, occurrences, endDate } = recurringBooking;
    let description = `Every ${interval > 1 ? interval : ''} ${
      type === 'weekly' ? 'week' : 
      type === 'biweekly' ? '2 weeks' : 
      'month'
    }${interval > 1 && type !== 'biweekly' ? 's' : ''}`;
    
    if (occurrences) {
      description += ` (${occurrences} appointments total)`;
    } else if (endDate) {
      description += ` until ${formatDate(endDate)}`;
    }
    
    return description;
  };

  const getTotalPrice = () => {
    if (!selectedService || !recurringBooking?.occurrences) {
      return selectedService?.price || 0;
    }
    return selectedService.price * recurringBooking.occurrences;
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Confirm Your Booking
        </h2>
        <p className="text-gray-600">
          Please review your appointment details before confirming
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Booking Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Barbershop & Service */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Appointment Details
            </h3>
            
            <div className="space-y-4">
              {/* Barbershop */}
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="font-medium text-gray-900">
                    {selectedBarbershop?.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {selectedBarbershop?.address}, {selectedBarbershop?.city}, {selectedBarbershop?.state}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatPhoneNumber(selectedBarbershop?.phone || '')}
                  </div>
                </div>
              </div>

              {/* Service */}
              <div className="flex items-start gap-3">
                <Scissors className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="font-medium text-gray-900">
                    {selectedService?.name}
                  </div>
                  {selectedService?.description && (
                    <div className="text-sm text-gray-600 mt-1">
                      {selectedService.description}
                    </div>
                  )}
                  <div className="flex items-center gap-4 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {formatDuration(selectedService?.duration || 0)}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {formatCurrency(selectedService?.price || 0)}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Barber */}
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="font-medium text-gray-900">
                    {selectedBarber 
                      ? `${selectedBarber.user?.firstName} ${selectedBarber.user?.lastName}`
                      : 'Any Available Barber'
                    }
                  </div>
                  {selectedBarber && (
                    <div className="text-sm text-gray-600">
                      {selectedBarber.experience && `${selectedBarber.experience} years experience`}
                      {selectedBarber.rating && ` • ${selectedBarber.rating.toFixed(1)} ⭐`}
                    </div>
                  )}
                </div>
              </div>

              {/* Date & Time */}
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="font-medium text-gray-900">
                    {selectedDate && formatDate(selectedDate)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {selectedTimeSlot?.displayTime} 
                    {selectedService && (
                      <span> - {formatTime(
                        new Date(new Date(selectedTimeSlot?.endTime || '').getTime())
                      )}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Recurring */}
              {recurringBooking && (
                <div className="flex items-start gap-3">
                  <Repeat className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900">
                      Recurring Appointment
                    </div>
                    <div className="text-sm text-gray-600">
                      {getRecurringDescription()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Customer Information */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Customer Information
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="font-medium text-gray-900">{guestInfo.name}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-gray-900">{guestInfo.email}</div>
                  <div className="text-xs text-gray-500">Confirmation will be sent here</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-gray-900">{formatPhoneNumber(guestInfo.phone)}</div>
                  <div className="text-xs text-gray-500">For appointment reminders</div>
                </div>
              </div>

              {(guestInfo.notes || guestInfo.specialRequests) && (
                <div className="flex items-start gap-3">
                  <MessageSquare className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="space-y-2">
                    {guestInfo.notes && (
                      <div>
                        <div className="text-sm font-medium text-gray-700">Notes:</div>
                        <div className="text-sm text-gray-600">{guestInfo.notes}</div>
                      </div>
                    )}
                    {guestInfo.specialRequests && (
                      <div>
                        <div className="text-sm font-medium text-gray-700">Special Requests:</div>
                        <div className="text-sm text-gray-600">{guestInfo.specialRequests}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {guestInfo.marketingOptIn && (
                <div className="text-xs text-gray-500">
                  ✓ Opted in to receive promotional emails
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Price Summary */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Price Summary
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">{selectedService?.name}</span>
                <span className="font-medium">{formatCurrency(selectedService?.price || 0)}</span>
              </div>

              {recurringBooking?.occurrences && recurringBooking.occurrences > 1 && (
                <>
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>× {recurringBooking.occurrences} appointments</span>
                    <span>
                      {formatCurrency((selectedService?.price || 0) * (recurringBooking.occurrences - 1))}
                    </span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center font-semibold">
                      <span>Total</span>
                      <span className="text-lg">{formatCurrency(getTotalPrice())}</span>
                    </div>
                  </div>
                </>
              )}

              {!recurringBooking?.occurrences && (
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center font-semibold">
                    <span>Total</span>
                    <span className="text-lg">{formatCurrency(selectedService?.price || 0)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-600">
                <div className="font-medium mb-1">Payment</div>
                <p>Payment will be collected at the barbershop. Cash, card, and mobile payments accepted.</p>
              </div>
            </div>
          </Card>

          {/* Policies */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Policies
            </h3>
            
            <div className="space-y-3 text-sm text-gray-600">
              <div>
                <div className="font-medium text-gray-700 mb-1">Cancellation Policy</div>
                <p>Free cancellation up to 24 hours before your appointment. Late cancellations may incur a fee.</p>
              </div>
              
              <div>
                <div className="font-medium text-gray-700 mb-1">No-Show Policy</div>
                <p>No-shows may be charged the full service amount and could affect future booking privileges.</p>
              </div>
              
              <div>
                <div className="font-medium text-gray-700 mb-1">Rescheduling</div>
                <p>Appointments can be rescheduled up to 24 hours in advance subject to availability.</p>
              </div>
              
              {recurringBooking && (
                <div>
                  <div className="font-medium text-gray-700 mb-1">Recurring Appointments</div>
                  <p>You can modify or cancel your recurring series at any time. Individual appointments can also be rescheduled.</p>
                </div>
              )}
            </div>
          </Card>

          {/* Confirmation Button */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p>
                  By confirming this booking, you agree to the barbershop's policies and 
                  understand that payment is due at the time of service.
                </p>
              </div>
              
              <Button
                onClick={onConfirm}
                disabled={isBooking}
                className="w-full h-12 text-lg font-medium"
                size="lg"
              >
                {isBooking ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Confirming Booking...
                  </>
                ) : (
                  <>
                    Confirm Booking
                    <DollarSign className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
              
              <div className="text-center text-xs text-gray-500">
                You'll receive a confirmation email within minutes
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};