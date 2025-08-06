import React from 'react';
import { MapPin, Star, Clock, Phone, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Barbershop } from '@/types';
import { formatDistance, formatCurrency } from '@/utils/format';

interface BarbershopCardProps {
  barbershop: Barbershop & {
    distance?: number;
    nextAvailable?: string;
    popularServices?: Array<{
      id: string;
      name: string;
      price: number;
      duration: number;
    }>;
  };
  onSelect: (barbershop: any) => void;
}

export const BarbershopCard: React.FC<BarbershopCardProps> = ({
  barbershop,
  onSelect
}) => {
  const handleSelect = () => {
    onSelect(barbershop);
  };

  const getBusinessStatus = () => {
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.toTimeString().slice(0, 5);
    
    if (barbershop.businessHours) {
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const today = dayNames[currentDay];
      const todayHours = barbershop.businessHours[today];
      
      if (todayHours && todayHours.open && todayHours.close) {
        const isOpen = currentTime >= todayHours.open && currentTime <= todayHours.close;
        return {
          isOpen,
          message: isOpen 
            ? `Open until ${formatTime(todayHours.close)}` 
            : `Closed • Opens ${formatTime(todayHours.open)}`
        };
      }
    }
    
    return { isOpen: false, message: 'Hours not available' };
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const businessStatus = getBusinessStatus();

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer group">
      <div onClick={handleSelect} className="p-0">
        {/* Image */}
        <div className="relative h-48 bg-gray-200 rounded-t-lg overflow-hidden">
          {barbershop.images && barbershop.images.length > 0 ? (
            <img
              src={barbershop.images[0]}
              alt={barbershop.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <div className="text-gray-400 text-center">
                <div className="text-2xl mb-2">✂️</div>
                <div className="text-sm">No Image</div>
              </div>
            </div>
          )}
          
          {/* Status Badge */}
          <div className="absolute top-3 left-3">
            <Badge 
              variant={businessStatus.isOpen ? "default" : "secondary"}
              className={businessStatus.isOpen ? "bg-green-500" : ""}
            >
              {businessStatus.isOpen ? "Open" : "Closed"}
            </Badge>
          </div>

          {/* Distance Badge */}
          {barbershop.distance && (
            <div className="absolute top-3 right-3">
              <Badge variant="secondary" className="bg-white/90 text-gray-700">
                {formatDistance(barbershop.distance)}
              </Badge>
            </div>
          )}
        </div>

        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                {barbershop.name}
              </h3>
              <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                <MapPin className="h-4 w-4" />
                {barbershop.address}, {barbershop.city}
              </div>
            </div>
            
            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
          </div>

          {/* Rating and Reviews */}
          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium text-sm">
                {barbershop.rating.toFixed(1)}
              </span>
              <span className="text-sm text-gray-600">
                ({barbershop.reviewCount} reviews)
              </span>
            </div>
          </div>

          {/* Business Hours Status */}
          <div className="flex items-center gap-1 text-sm mb-3">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className={businessStatus.isOpen ? "text-green-600" : "text-red-600"}>
              {businessStatus.message}
            </span>
          </div>

          {/* Next Available */}
          {barbershop.nextAvailable && (
            <div className="flex items-center gap-1 text-sm text-blue-600 mb-3">
              <Calendar className="h-4 w-4" />
              Next available: {barbershop.nextAvailable}
            </div>
          )}

          {/* Popular Services */}
          {barbershop.popularServices && barbershop.popularServices.length > 0 && (
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-700 mb-2">Popular Services</div>
              <div className="space-y-1">
                {barbershop.popularServices.slice(0, 2).map((service) => (
                  <div key={service.id} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">{service.name}</span>
                    <span className="font-medium">{formatCurrency(service.price)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact Info */}
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
            <div className="flex items-center gap-1">
              <Phone className="h-4 w-4" />
              {barbershop.phone}
            </div>
          </div>

          {/* Action Button */}
          <Button 
            className="w-full group-hover:bg-blue-600 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              handleSelect();
            }}
          >
            Book Appointment
          </Button>
        </div>
      </div>
    </Card>
  );
};