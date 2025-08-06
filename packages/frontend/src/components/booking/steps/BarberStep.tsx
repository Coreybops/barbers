import React, { useState, useEffect } from 'react';
import { Star, User, Scissors, Languages, Award, Check, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useBookingStore } from '@/store/bookingStore';
import { Barber } from '@/types';
import { formatRating } from '@/utils/format';
import { bookingApi } from '@/services/bookingApi';

export const BarberStep: React.FC = () => {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);

  const { 
    selectedBarbershop, 
    selectedService, 
    selectedBarber, 
    setBarber 
  } = useBookingStore();

  useEffect(() => {
    const loadBarbers = async () => {
      if (!selectedBarbershop || !selectedService) return;
      
      try {
        setLoading(true);
        const response = await bookingApi.getBarbershopBarbers(
          selectedBarbershop.id, 
          selectedService.id
        );
        setBarbers(response.barbers || []);
      } catch (error) {
        console.error('Error loading barbers:', error);
        setBarbers([]);
      } finally {
        setLoading(false);
      }
    };

    loadBarbers();
  }, [selectedBarbershop, selectedService]);

  const handleBarberSelect = (barber: Barber | null) => {
    setBarber(barber);
  };

  const handleAnyBarber = () => {
    setBarber(null); // null means "any available barber"
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Loading barbers...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Choose Your Barber
        </h2>
        <p className="text-gray-600">
          Select a specific barber or let us assign the next available one for your {selectedService?.name} service
        </p>
      </div>

      {/* Any Available Option */}
      <Card
        className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-md mb-4 ${
          selectedBarber === null 
            ? 'border-blue-500 bg-blue-50 shadow-md' 
            : 'border-gray-200 hover:border-gray-300'
        }`}
        onClick={handleAnyBarber}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
              <Shuffle className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className={`font-semibold ${
                selectedBarber === null ? 'text-blue-900' : 'text-gray-900'
              }`}>
                Any Available Barber
              </h3>
              <p className="text-sm text-gray-600">
                Get the next available barber for faster booking
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  Recommended
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Faster Availability
                </Badge>
              </div>
            </div>
          </div>
          {selectedBarber === null && (
            <div className="bg-blue-500 text-white rounded-full p-2">
              <Check className="h-4 w-4" />
            </div>
          )}
        </div>
      </Card>

      {/* Available Barbers */}
      {barbers.length > 0 && (
        <>
          <div className="text-sm font-medium text-gray-700 mb-4">
            Or choose a specific barber:
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {barbers.map((barber) => {
              const isSelected = selectedBarber?.id === barber.id;
              
              return (
                <Card
                  key={barber.id}
                  className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50 shadow-md' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleBarberSelect(barber)}
                >
                  <div className="flex items-start space-x-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {barber.avatar || barber.user?.avatar ? (
                        <img
                          src={barber.avatar || barber.user?.avatar}
                          alt={`${barber.user?.firstName} ${barber.user?.lastName}`}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-2">
                        <h3 className={`font-semibold truncate ${
                          isSelected ? 'text-blue-900' : 'text-gray-900'
                        }`}>
                          {barber.user?.firstName} {barber.user?.lastName}
                        </h3>
                        {isSelected && (
                          <div className="bg-blue-500 text-white rounded-full p-1">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </div>

                      {/* Rating */}
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">
                          {formatRating(barber.rating)}
                        </span>
                        <span className="text-sm text-gray-600">
                          ({barber.reviewCount} reviews)
                        </span>
                      </div>

                      {/* Bio */}
                      {barber.bio && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {barber.bio}
                        </p>
                      )}

                      {/* Experience */}
                      {barber.experience && (
                        <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                          <Scissors className="h-4 w-4" />
                          {barber.experience} years experience
                        </div>
                      )}

                      {/* Languages */}
                      {barber.languages && barber.languages.length > 0 && (
                        <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                          <Languages className="h-4 w-4" />
                          {barber.languages.slice(0, 2).join(', ')}
                          {barber.languages.length > 2 && ` +${barber.languages.length - 2} more`}
                        </div>
                      )}

                      {/* Specialties */}
                      {barber.specialties && barber.specialties.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {barber.specialties.slice(0, 3).map((specialty, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                          {barber.specialties.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{barber.specialties.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Certifications */}
                      {barber.certifications && barber.certifications.length > 0 && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Award className="h-4 w-4" />
                          <span className="truncate">{barber.certifications[0]}</span>
                          {barber.certifications.length > 1 && (
                            <span>+{barber.certifications.length - 1}</span>
                          )}
                        </div>
                      )}

                      {/* Availability Status */}
                      <div className="mt-3">
                        <Badge 
                          variant={barber.isAvailable ? "default" : "secondary"}
                          className={`text-xs ${
                            barber.isAvailable ? "bg-green-500" : ""
                          }`}
                        >
                          {barber.isAvailable ? "Available" : "Busy"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* No Barbers Available */}
      {barbers.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-4">
            <User className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Barbers Available
          </h3>
          <p className="text-gray-600 mb-4">
            No barbers are currently available for the {selectedService?.name} service.
          </p>
          <p className="text-sm text-gray-500">
            You can continue with "Any Available Barber" and we'll check for availability in the next step.
          </p>
        </div>
      )}

      {/* Tip */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="text-sm">
          <span className="font-medium text-gray-700">💡 Tip:</span>
          <span className="text-gray-600 ml-1">
            Choosing "Any Available Barber" often provides more time slot options and faster booking.
          </span>
        </div>
      </div>
    </div>
  );
};