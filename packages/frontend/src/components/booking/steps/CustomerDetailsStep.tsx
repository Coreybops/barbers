import React, { useState } from 'react';
import { User, Mail, Phone, MessageSquare, Repeat, Calendar, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useBookingStore } from '@/store/bookingStore';
import { formatPhoneNumber } from '@/utils/format';
import { RecurringBooking } from '@/types';

export const CustomerDetailsStep: React.FC = () => {
  const [showRecurring, setShowRecurring] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const {
    guestInfo,
    recurringBooking,
    selectedService,
    updateGuestInfo,
    setRecurringBooking
  } = useBookingStore();

  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'name':
        if (!value.trim()) {
          newErrors.name = 'Name is required';
        } else if (value.trim().length < 2) {
          newErrors.name = 'Name must be at least 2 characters';
        } else {
          delete newErrors.name;
        }
        break;
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value.trim()) {
          newErrors.email = 'Email is required';
        } else if (!emailRegex.test(value)) {
          newErrors.email = 'Please enter a valid email address';
        } else {
          delete newErrors.email;
        }
        break;
      case 'phone':
        const phoneRegex = /^\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/;
        if (!value.trim()) {
          newErrors.phone = 'Phone number is required';
        } else if (!phoneRegex.test(value.replace(/\D/g, ''))) {
          newErrors.phone = 'Please enter a valid phone number';
        } else {
          delete newErrors.phone;
        }
        break;
    }

    setErrors(newErrors);
  };

  const handleInputChange = (name: string, value: string) => {
    updateGuestInfo({ [name]: value });
    validateField(name, value);
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    handleInputChange('phone', formatted);
  };

  const handleRecurringToggle = () => {
    setShowRecurring(!showRecurring);
    if (!showRecurring) {
      // Set default recurring booking
      setRecurringBooking({
        type: 'weekly',
        interval: 1,
        occurrences: 4
      });
    } else {
      setRecurringBooking(null);
    }
  };

  const handleRecurringChange = (field: keyof RecurringBooking, value: any) => {
    if (recurringBooking) {
      setRecurringBooking({
        ...recurringBooking,
        [field]: value
      });
    }
  };

  const getRecurringDescription = () => {
    if (!recurringBooking) return '';
    
    const { type, interval, occurrences, endDate } = recurringBooking;
    let description = `Every ${interval > 1 ? interval : ''} ${type === 'weekly' ? 'week' : type === 'biweekly' ? '2 weeks' : 'month'}${interval > 1 && type !== 'biweekly' ? 's' : ''}`;
    
    if (occurrences) {
      description += ` for ${occurrences} appointments`;
    } else if (endDate) {
      description += ` until ${new Date(endDate).toLocaleDateString()}`;
    }
    
    return description;
  };

  const isFormValid = () => {
    return guestInfo.name && 
           guestInfo.email && 
           guestInfo.phone && 
           Object.keys(errors).length === 0;
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Your Information
        </h2>
        <p className="text-gray-600">
          Please provide your contact details to complete the booking
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Contact Information */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Enter your full name"
                value={guestInfo.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`pl-10 ${errors.name ? 'border-red-500' : ''}`}
                onBlur={() => validateField('name', guestInfo.name)}
              />
            </div>
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="email"
                placeholder="Enter your email address"
                value={guestInfo.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                onBlur={() => validateField('email', guestInfo.email)}
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
            <p className="text-gray-500 text-sm mt-1">
              We'll send your booking confirmation here
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number *
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="tel"
                placeholder="(555) 123-4567"
                value={guestInfo.phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className={`pl-10 ${errors.phone ? 'border-red-500' : ''}`}
                onBlur={() => validateField('phone', guestInfo.phone)}
              />
            </div>
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
            )}
            <p className="text-gray-500 text-sm mt-1">
              For appointment reminders and updates
            </p>
          </div>

          {/* Marketing Opt-in */}
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="marketing"
              checked={guestInfo.marketingOptIn}
              onChange={(e) => updateGuestInfo({ marketingOptIn: e.target.checked })}
              className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="marketing" className="text-sm text-gray-600">
              I'd like to receive special offers, promotions, and updates via email
            </label>
          </div>
        </div>

        {/* Additional Options */}
        <div className="space-y-6">
          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
              <textarea
                placeholder="Any specific requests or notes for your barber..."
                value={guestInfo.notes}
                onChange={(e) => updateGuestInfo({ notes: e.target.value })}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={3}
              />
            </div>
          </div>

          {/* Special Requests */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Special Requests (Optional)
            </label>
            <div className="relative">
              <AlertCircle className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
              <textarea
                placeholder="Any special accommodations needed..."
                value={guestInfo.specialRequests}
                onChange={(e) => updateGuestInfo({ specialRequests: e.target.value })}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={3}
              />
            </div>
          </div>

          {/* Recurring Booking Option */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Repeat className="h-5 w-5 text-gray-600" />
                <span className="font-medium text-gray-900">Recurring Appointment</span>
              </div>
              <Button
                variant={showRecurring ? "default" : "outline"}
                size="sm"
                onClick={handleRecurringToggle}
              >
                {showRecurring ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Enabled
                  </>
                ) : (
                  'Enable'
                )}
              </Button>
            </div>
            
            <p className="text-sm text-gray-600 mb-3">
              Save time by scheduling regular appointments
            </p>

            {showRecurring && recurringBooking && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Frequency
                    </label>
                    <select
                      value={recurringBooking.type}
                      onChange={(e) => handleRecurringChange('type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Bi-weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Interval
                    </label>
                    <select
                      value={recurringBooking.interval}
                      onChange={(e) => handleRecurringChange('interval', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value={1}>Every 1</option>
                      <option value={2}>Every 2</option>
                      <option value={3}>Every 3</option>
                      <option value={4}>Every 4</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Appointments
                  </label>
                  <select
                    value={recurringBooking.occurrences || ''}
                    onChange={(e) => handleRecurringChange('occurrences', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">Ongoing (cancel anytime)</option>
                    <option value={2}>2 appointments</option>
                    <option value={3}>3 appointments</option>
                    <option value={4}>4 appointments</option>
                    <option value={6}>6 appointments</option>
                    <option value={8}>8 appointments</option>
                    <option value={12}>12 appointments</option>
                  </select>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-700 mb-1">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium text-sm">Schedule Preview</span>
                  </div>
                  <p className="text-sm text-blue-800">
                    {getRecurringDescription()}
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Form Validation Status */}
      {!isFormValid() && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-700">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium text-sm">Complete Required Fields</span>
          </div>
          <div className="text-sm text-yellow-600 mt-1">
            Please fill in all required fields marked with * to continue
          </div>
        </div>
      )}

      {/* Privacy Notice */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-600">
          <div className="font-medium mb-1">Privacy & Security</div>
          <p className="text-xs leading-relaxed">
            Your information is securely stored and only used for appointment management and communication. 
            We never share your personal data with third parties. You can update or delete your information at any time.
          </p>
        </div>
      </div>
    </div>
  );
};