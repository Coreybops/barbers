import React, { useState } from 'react';
import { 
  CheckCircle, 
  Calendar, 
  MapPin, 
  Clock, 
  User, 
  Mail, 
  Phone,
  Share2,
  Download,
  Plus,
  MessageCircle,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatTime, formatCurrency, formatPhoneNumber } from '@/utils/format';

interface BookingSuccessProps {
  appointment: {
    appointmentId: string;
    appointment?: {
      id: string;
      date: string;
      startTime: string;
      endTime: string;
      barbershop: {
        name: string;
        address: string;
        city: string;
        state: string;
        phone: string;
      };
      service: {
        name: string;
        price: number;
        duration: number;
      };
      barber?: {
        user: {
          firstName: string;
          lastName: string;
        };
      };
      guestName: string;
      guestEmail: string;
      guestPhone: string;
    };
  };
  onNewBooking: () => void;
}

export const BookingSuccess: React.FC<BookingSuccessProps> = ({ 
  appointment, 
  onNewBooking 
}) => {
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  const appt = appointment.appointment;
  
  if (!appt) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md w-full text-center">
          <div className="text-red-500 mb-4">
            <CheckCircle className="h-16 w-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Booking Error
          </h2>
          <p className="text-gray-600 mb-4">
            There was an issue retrieving your booking details.
          </p>
          <Button onClick={onNewBooking}>
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  const handleShare = async (method: 'copy' | 'email' | 'sms') => {
    const appointmentDetails = `
Appointment Confirmed!
📍 ${appt.barbershop.name}
📅 ${formatDate(appt.date)} at ${formatTime(appt.startTime)}
✂️ ${appt.service.name}
👤 ${appt.barber ? `${appt.barber.user.firstName} ${appt.barber.user.lastName}` : 'Any Available Barber'}
📞 ${formatPhoneNumber(appt.barbershop.phone)}
    `.trim();

    if (method === 'copy') {
      try {
        await navigator.clipboard.writeText(appointmentDetails);
        setCopiedToClipboard(true);
        setTimeout(() => setCopiedToClipboard(false), 2000);
      } catch (err) {
        console.error('Failed to copy to clipboard');
      }
    } else if (method === 'email') {
      const subject = encodeURIComponent('Appointment Confirmation');
      const body = encodeURIComponent(appointmentDetails);
      window.open(`mailto:?subject=${subject}&body=${body}`);
    } else if (method === 'sms') {
      const body = encodeURIComponent(appointmentDetails);
      window.open(`sms:?body=${body}`);
    }
  };

  const addToCalendar = () => {
    const startDate = new Date(appt.startTime);
    const endDate = new Date(appt.endTime);
    
    const formatCalendarDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const title = encodeURIComponent(`${appt.service.name} - ${appt.barbershop.name}`);
    const details = encodeURIComponent(
      `Appointment with ${appt.barber ? `${appt.barber.user.firstName} ${appt.barber.user.lastName}` : 'Available Barber'}\n` +
      `Service: ${appt.service.name}\n` +
      `Location: ${appt.barbershop.address}, ${appt.barbershop.city}, ${appt.barbershop.state}\n` +
      `Phone: ${formatPhoneNumber(appt.barbershop.phone)}`
    );
    const location = encodeURIComponent(`${appt.barbershop.address}, ${appt.barbershop.city}, ${appt.barbershop.state}`);

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatCalendarDate(startDate)}/${formatCalendarDate(endDate)}&details=${details}&location=${location}`;
    
    window.open(googleCalendarUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="text-green-500 mb-4">
            <CheckCircle className="h-16 w-16 mx-auto" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Booking Confirmed!
          </h1>
          <p className="text-lg text-gray-600">
            Your appointment has been successfully booked
          </p>
          <Badge className="mt-2 bg-green-100 text-green-800">
            Confirmation ID: {appt.id.slice(-8).toUpperCase()}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Appointment Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Appointment Details
              </h2>
              
              <div className="space-y-4">
                {/* Date & Time */}
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="font-medium text-gray-900">
                      {formatDate(appt.date)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatTime(appt.startTime)} - {formatTime(appt.endTime)}
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900">
                      {appt.barbershop.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {appt.barbershop.address}
                    </div>
                    <div className="text-sm text-gray-600">
                      {appt.barbershop.city}, {appt.barbershop.state}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      📞 {formatPhoneNumber(appt.barbershop.phone)}
                    </div>
                  </div>
                </div>

                {/* Service */}
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="font-medium text-gray-900">
                      {appt.service.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {appt.service.duration} minutes • {formatCurrency(appt.service.price)}
                    </div>
                  </div>
                </div>

                {/* Barber */}
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="font-medium text-gray-900">
                      {appt.barber 
                        ? `${appt.barber.user.firstName} ${appt.barber.user.lastName}`
                        : 'Any Available Barber'
                      }
                    </div>
                    <div className="text-sm text-gray-600">
                      Your barber for this appointment
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Contact Information */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Your Information
              </h2>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-900">{appt.guestName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-900">{appt.guestEmail}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-900">{formatPhoneNumber(appt.guestPhone)}</span>
                </div>
              </div>
            </Card>

            {/* What's Next */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                What's Next?
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 text-blue-600 rounded-full p-1">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Email Confirmation</div>
                    <div className="text-sm text-gray-600">
                      Check your email for confirmation details and appointment instructions
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 text-blue-600 rounded-full p-1">
                    <MessageCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Reminder Notifications</div>
                    <div className="text-sm text-gray-600">
                      We'll send you reminders 24 hours and 2 hours before your appointment
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 text-blue-600 rounded-full p-1">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Arrive 10 Minutes Early</div>
                    <div className="text-sm text-gray-600">
                      Please arrive 10 minutes before your appointment time
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Actions */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>
              
              <div className="space-y-3">
                <Button 
                  onClick={addToCalendar}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  Add to Calendar
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => setShowShareOptions(!showShareOptions)}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  Share Details
                </Button>
                
                {showShareOptions && (
                  <div className="space-y-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleShare('copy')}
                      className="w-full justify-start text-sm"
                    >
                      {copiedToClipboard ? '✓ Copied!' : 'Copy to Clipboard'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleShare('email')}
                      className="w-full justify-start text-sm"
                    >
                      Share via Email
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleShare('sms')}
                      className="w-full justify-start text-sm"
                    >
                      Share via SMS
                    </Button>
                  </div>
                )}

                <Button 
                  variant="outline"
                  onClick={onNewBooking}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Book Another
                </Button>
              </div>
            </Card>

            {/* Rating Prompt */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                How was your experience?
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                After your appointment, we'd love to hear your feedback
              </p>
              <Button 
                variant="outline" 
                size="sm"
                className="w-full flex items-center justify-center gap-2"
                disabled
              >
                <Star className="h-4 w-4" />
                Rate After Appointment
              </Button>
            </Card>

            {/* Support */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Need Help?
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Need to reschedule or have questions about your appointment?
              </p>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full"
                  onClick={() => window.open(`tel:${appt.barbershop.phone}`)}
                >
                  Call Barbershop
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="w-full text-xs"
                >
                  Contact Support
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Cancellation Policy */}
        <Card className="mt-8 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Important Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
            <div>
              <div className="font-medium text-gray-700 mb-2">Cancellation Policy</div>
              <p>Free cancellation up to 24 hours before your appointment. Late cancellations may incur a fee.</p>
            </div>
            <div>
              <div className="font-medium text-gray-700 mb-2">Payment</div>
              <p>Payment is due at the time of service. The barbershop accepts cash, card, and mobile payments.</p>
            </div>
            <div>
              <div className="font-medium text-gray-700 mb-2">What to Bring</div>
              <p>Just bring yourself! No need to wash your hair beforehand - that's part of the service.</p>
            </div>
            <div>
              <div className="font-medium text-gray-700 mb-2">COVID-19 Safety</div>
              <p>The barbershop follows all local health guidelines. Masks may be required.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};