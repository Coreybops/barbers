import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useBookingStore } from '@/store/bookingStore';
import { BarbershopStep } from './steps/BarbershopStep';
import { ServiceStep } from './steps/ServiceStep';
import { BarberStep } from './steps/BarberStep';
import { DateTimeStep } from './steps/DateTimeStep';
import { CustomerDetailsStep } from './steps/CustomerDetailsStep';
import { ConfirmationStep } from './steps/ConfirmationStep';
import { BookingSuccess } from './BookingSuccess';

export const BookingWizard: React.FC = () => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [bookingResult, setBookingResult] = useState<any>(null);

  const {
    currentStep,
    steps,
    selectedBarbershop,
    previousStep,
    nextStep,
    canProceedToNextStep,
    resetBookingFlow,
    createBooking,
    isBooking
  } = useBookingStore();

  const handleNext = () => {
    if (canProceedToNextStep()) {
      nextStep();
    }
  };

  const handlePrevious = () => {
    previousStep();
  };

  const handleBack = () => {
    resetBookingFlow();
  };

  const handleConfirmBooking = async () => {
    const result = await createBooking();
    setBookingResult(result);
    
    if (result.success) {
      setShowSuccess(true);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <BarbershopStep />;
      case 2:
        return <ServiceStep />;
      case 3:
        return <BarberStep />;
      case 4:
        return <DateTimeStep />;
      case 5:
        return <CustomerDetailsStep />;
      case 6:
        return <ConfirmationStep onConfirm={handleConfirmBooking} />;
      default:
        return <div>Step not found</div>;
    }
  };

  if (showSuccess) {
    return (
      <BookingSuccess 
        appointment={bookingResult}
        onNewBooking={() => {
          setShowSuccess(false);
          setBookingResult(null);
          resetBookingFlow();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Search
              </Button>
              
              {selectedBarbershop && (
                <div className="flex items-center space-x-3">
                  <div className="text-sm text-gray-600">Booking at</div>
                  <div className="font-medium text-gray-900">
                    {selectedBarbershop.name}
                  </div>
                </div>
              )}
            </div>

            <div className="text-sm text-gray-500">
              Step {currentStep} of {steps.length}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium
                    ${step.completed 
                      ? 'bg-green-100 border-green-500 text-green-700' 
                      : step.active 
                        ? 'bg-blue-100 border-blue-500 text-blue-700'
                        : 'bg-gray-100 border-gray-300 text-gray-500'
                    }
                  `}>
                    {step.completed ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <div className="ml-3 hidden sm:block">
                    <div className={`text-sm font-medium ${
                      step.active ? 'text-blue-700' : 
                      step.completed ? 'text-green-700' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </div>
                    <div className="text-xs text-gray-500">
                      {step.description}
                    </div>
                  </div>
                </div>
                
                {index < steps.length - 1 && (
                  <div className={`
                    hidden sm:block w-12 h-0.5 mx-4
                    ${step.completed ? 'bg-green-500' : 'bg-gray-300'}
                  `} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Current Step Content */}
        <Card className="p-6 mb-8">
          {renderStep()}
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="flex items-center gap-4">
            {bookingResult?.error && (
              <div className="text-red-600 text-sm">
                {bookingResult.error}
              </div>
            )}
            
            {currentStep === steps.length ? (
              <Button
                onClick={handleConfirmBooking}
                disabled={isBooking}
                className="flex items-center gap-2 min-w-[120px]"
              >
                {isBooking ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Booking...
                  </>
                ) : (
                  <>
                    Confirm Booking
                    <Check className="h-4 w-4" />
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!canProceedToNextStep()}
                className="flex items-center gap-2"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};