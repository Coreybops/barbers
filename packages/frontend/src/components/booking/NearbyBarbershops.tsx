import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { BarbershopCard } from './BarbershopCard';
import { bookingApi } from '@/services/bookingApi';
import { Barbershop } from '@/types';

interface NearbyBarbershopsProps {
  onSelectBarbershop: (barbershop: Barbershop) => void;
}

export const NearbyBarbershops: React.FC<NearbyBarbershopsProps> = ({ 
  onSelectBarbershop 
}) => {
  const [barbershops, setBarbershops] = useState<Barbershop[]>([]);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        
        try {
          const response = await bookingApi.searchNearby(latitude, longitude, 25);
          setBarbershops(response.barbershops || []);
        } catch (error) {
          console.error('Error fetching nearby barbershops:', error);
          setLocationError('Failed to load nearby barbershops');
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        setLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location access denied. Please enable location services.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information is unavailable.');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out.');
            break;
          default:
            setLocationError('An unknown error occurred.');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  // Load some featured barbershops if no location
  useEffect(() => {
    if (!location && !locationError) {
      const loadFeatured = async () => {
        try {
          setLoading(true);
          const response = await bookingApi.searchBarbershops('', '', {});
          setBarbershops(response.barbershops?.slice(0, 6) || []);
        } catch (error) {
          console.error('Error loading featured barbershops:', error);
        } finally {
          setLoading(false);
        }
      };
      loadFeatured();
    }
  }, [location, locationError]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <LoadingSpinner size="lg" />
        <p className="text-gray-600 mt-4">
          {location ? 'Finding nearby barbershops...' : 'Loading barbershops...'}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            {location ? 'Nearby Barbershops' : 'Featured Barbershops'}
          </h2>
          <p className="text-gray-600">
            {location 
              ? 'Barbershops within 25 miles of your location' 
              : 'Discover popular barbershops in your area'
            }
          </p>
        </div>
        
        {!location && !locationError && (
          <Button 
            onClick={requestLocation}
            className="flex items-center gap-2"
          >
            <Navigation className="h-4 w-4" />
            Find Nearby
          </Button>
        )}
      </div>

      {/* Location Error */}
      {locationError && (
        <Card className="p-6 mb-8 border-amber-200 bg-amber-50">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-amber-600" />
            <div>
              <div className="font-medium text-amber-800">Location Not Available</div>
              <div className="text-sm text-amber-700">{locationError}</div>
            </div>
            <Button 
              size="sm" 
              variant="outline"
              onClick={requestLocation}
              className="ml-auto"
            >
              Try Again
            </Button>
          </div>
        </Card>
      )}

      {/* Barbershops Grid */}
      {barbershops.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {barbershops.map((barbershop) => (
            <BarbershopCard
              key={barbershop.id}
              barbershop={barbershop}
              onSelect={onSelectBarbershop}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <MapPin className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Barbershops Found
          </h3>
          <p className="text-gray-600 mb-4">
            {location 
              ? 'No barbershops found in your area. Try expanding your search.'
              : 'Unable to load barbershops at this time.'
            }
          </p>
          <Button 
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
        </div>
      )}

      {/* Quick Stats */}
      {barbershops.length > 0 && (
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{barbershops.length}</div>
            <div className="text-sm text-blue-700">Barbershops</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {Math.round(barbershops.reduce((sum, shop) => sum + shop.rating, 0) / barbershops.length * 10) / 10}
            </div>
            <div className="text-sm text-green-700">Avg Rating</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {barbershops.reduce((sum, shop) => sum + shop.reviewCount, 0)}
            </div>
            <div className="text-sm text-purple-700">Total Reviews</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {location ? 'GPS' : 'Featured'}
            </div>
            <div className="text-sm text-orange-700">
              {location ? 'Location Based' : 'Curated List'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};