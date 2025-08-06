import React, { useState, useEffect } from 'react';
import { Search, Clock, DollarSign, Check, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useBookingStore } from '@/store/bookingStore';
import { Service } from '@/types';
import { formatCurrency, formatDuration } from '@/utils/format';
import { bookingApi } from '@/services/bookingApi';

export const ServiceStep: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { selectedBarbershop, selectedService, setService } = useBookingStore();

  useEffect(() => {
    const loadServices = async () => {
      if (!selectedBarbershop) return;
      
      try {
        setLoading(true);
        const response = await bookingApi.getBarbershopServices(selectedBarbershop.id);
        setServices(response.services || []);
        setFilteredServices(response.services || []);
      } catch (error) {
        console.error('Error loading services:', error);
        setServices([]);
        setFilteredServices([]);
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, [selectedBarbershop]);

  useEffect(() => {
    let filtered = services;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(service => service.category === selectedCategory);
    }

    setFilteredServices(filtered);
  }, [services, searchTerm, selectedCategory]);

  const handleServiceSelect = (service: Service) => {
    setService(service);
  };

  const getUniqueCategories = () => {
    const categories = services
      .map(service => service.category)
      .filter(Boolean)
      .filter((category, index, array) => array.indexOf(category) === index);
    return ['all', ...categories];
  };

  const formatCategoryName = (category: string) => {
    if (category === 'all') return 'All Services';
    return category.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Loading services...</span>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <Clock className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Services Available
        </h3>
        <p className="text-gray-600">
          This barbershop hasn't added any services yet.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Choose Your Service
        </h2>
        <p className="text-gray-600">
          Select the service you'd like to book at {selectedBarbershop?.name}
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="text"
            placeholder="Search services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="sm:w-48">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {getUniqueCategories().map(category => (
              <option key={category} value={category}>
                {formatCategoryName(category)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredServices.map((service) => {
          const isSelected = selectedService?.id === service.id;
          
          return (
            <Card
              key={service.id}
              className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                isSelected 
                  ? 'border-blue-500 bg-blue-50 shadow-md' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleServiceSelect(service)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Service Header */}
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className={`font-semibold ${
                      isSelected ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {service.name}
                    </h3>
                    {isSelected && (
                      <div className="bg-blue-500 text-white rounded-full p-1">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </div>

                  {/* Service Description */}
                  {service.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {service.description}
                    </p>
                  )}

                  {/* Service Details */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Clock className="h-4 w-4" />
                      {formatDuration(service.duration)}
                    </div>
                    <div className="flex items-center gap-1 font-semibold text-gray-900">
                      <DollarSign className="h-4 w-4" />
                      {formatCurrency(service.price)}
                    </div>
                  </div>

                  {/* Category Badge */}
                  {service.category && (
                    <div className="mt-3">
                      <Badge variant="secondary" className="text-xs">
                        {formatCategoryName(service.category)}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* No Results */}
      {filteredServices.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Services Found
          </h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your search or category filter
          </p>
          <Button 
            variant="outline" 
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}

      {/* Popular Services Hint */}
      {searchTerm === '' && selectedCategory === 'all' && services.length > 3 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2 text-blue-700 mb-2">
            <Star className="h-4 w-4 fill-current" />
            <span className="font-medium text-sm">Popular Services</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {services
              .sort((a, b) => b.price - a.price) // Simple popularity sort by price
              .slice(0, 3)
              .map(service => (
                <Badge 
                  key={service.id}
                  variant="outline"
                  className="text-blue-700 border-blue-300 cursor-pointer hover:bg-blue-100"
                  onClick={() => handleServiceSelect(service)}
                >
                  {service.name} - {formatCurrency(service.price)}
                </Badge>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};