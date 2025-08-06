import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, MapPin, Filter, Clock, Star, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useBookingStore } from '@/store/bookingStore';
import { BookingWizard } from '@/components/booking/BookingWizard';
import { BookingFilters } from '@/components/booking/BookingFilters';
import { BarbershopCard } from '@/components/booking/BarbershopCard';
import { PopularServices } from '@/components/booking/PopularServices';
import { NearbyBarbershops } from '@/components/booking/NearbyBarbershops';

export const BookingPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [showFilters, setShowFilters] = useState(false);

  const {
    searchResults,
    searchLoading,
    filters,
    selectedBarbershop,
    searchBarbershops,
    updateFilters,
    clearFilters,
    setBarbershop,
    resetBookingFlow
  } = useBookingStore();

  // Initialize search on page load
  useEffect(() => {
    const query = searchParams.get('q');
    const loc = searchParams.get('location');
    const barbershopId = searchParams.get('barbershop');
    
    if (query || loc || barbershopId) {
      searchBarbershops(query || undefined, loc || undefined);
    } else {
      // Load popular/nearby barbershops
      searchBarbershops();
    }
  }, [searchParams, searchBarbershops]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Update URL params
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (location) params.set('location', location);
    setSearchParams(params);
    
    await searchBarbershops(searchQuery, location);
  };

  const handleSelectBarbershop = (barbershop: any) => {
    setBarbershop(barbershop);
  };

  const handleClearFilters = () => {
    clearFilters();
    searchBarbershops(searchQuery, location);
  };

  const handleApplyFilters = () => {
    searchBarbershops(searchQuery, location);
    setShowFilters(false);
  };

  // Show booking wizard if barbershop is selected
  if (selectedBarbershop) {
    return <BookingWizard />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Search */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Book Your Perfect Haircut
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Find and book appointments at the best barbershops near you. 
              Choose from thousands of experienced barbers.
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Search barbershops, services, or barbers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
              <div className="md:w-64 relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
              <Button type="submit" size="lg" className="h-12 px-8">
                Search
              </Button>
            </div>
          </form>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            <Button 
              variant="outline" 
              onClick={() => {/* Handle find nearby */}}
              className="flex items-center gap-2"
            >
              <MapPin className="h-4 w-4" />
              Find Nearby
            </Button>
            <Button 
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {Object.keys(filters).length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {Object.keys(filters).length}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <BookingFilters
          filters={filters}
          onUpdateFilters={updateFilters}
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
          onClose={() => setShowFilters(false)}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Popular Services - Show when no search query */}
        {!searchQuery && !searchResults && (
          <PopularServices onServiceClick={(service) => {
            setSearchQuery(service.name);
            searchBarbershops(service.name, location);
          }} />
        )}

        {/* Search Results */}
        {searchLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : searchResults ? (
          <div>
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  {searchQuery ? `Results for "${searchQuery}"` : 'Available Barbershops'}
                </h2>
                <p className="text-gray-600 mt-1">
                  {searchResults.totalResults} barbershops found
                  {location && ` in ${location}`}
                </p>
              </div>
              
              {/* Sort Options */}
              <div className="flex items-center gap-4">
                <select className="border border-gray-300 rounded-md px-3 py-2 text-sm">
                  <option value="recommended">Recommended</option>
                  <option value="rating">Highest Rated</option>
                  <option value="distance">Nearest</option>
                  <option value="price">Price: Low to High</option>
                  <option value="availability">Most Available</option>
                </select>
              </div>
            </div>

            {/* Active Filters */}
            {Object.keys(filters).length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {filters.serviceCategory && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Category: {filters.serviceCategory}
                    <button onClick={() => updateFilters({ serviceCategory: undefined })}>
                      ×
                    </button>
                  </Badge>
                )}
                {filters.priceRange && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    ${filters.priceRange.min} - ${filters.priceRange.max}
                    <button onClick={() => updateFilters({ priceRange: undefined })}>
                      ×
                    </button>
                  </Badge>
                )}
                {filters.rating && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {filters.rating}+ stars
                    <button onClick={() => updateFilters({ rating: undefined })}>
                      ×
                    </button>
                  </Badge>
                )}
                <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                  Clear all
                </Button>
              </div>
            )}

            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.barbershops.map((barbershop) => (
                <BarbershopCard
                  key={barbershop.id}
                  barbershop={barbershop}
                  onSelect={handleSelectBarbershop}
                />
              ))}
            </div>

            {/* No Results */}
            {searchResults.barbershops.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Search className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No barbershops found
                </h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search criteria or location
                </p>
                <Button variant="outline" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* Show nearby/popular when no search */
          <NearbyBarbershops onSelectBarbershop={handleSelectBarbershop} />
        )}
      </div>
    </div>
  );
};