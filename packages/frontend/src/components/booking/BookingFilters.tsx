import React, { useState } from 'react';
import { X, Filter, DollarSign, Clock, Star, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookingFilters as BookingFiltersType } from '@/types';

interface BookingFiltersProps {
  filters: BookingFiltersType;
  onUpdateFilters: (filters: Partial<BookingFiltersType>) => void;
  onApply: () => void;
  onClear: () => void;
  onClose: () => void;
}

export const BookingFilters: React.FC<BookingFiltersProps> = ({
  filters,
  onUpdateFilters,
  onApply,
  onClear,
  onClose
}) => {
  const [localFilters, setLocalFilters] = useState<BookingFiltersType>(filters);

  const handleFilterChange = (key: keyof BookingFiltersType, value: any) => {
    const updatedFilters = { ...localFilters, [key]: value };
    setLocalFilters(updatedFilters);
  };

  const handleApply = () => {
    onUpdateFilters(localFilters);
    onApply();
  };

  const handleClear = () => {
    setLocalFilters({});
    onClear();
  };

  const categories = [
    'Haircut',
    'Beard Trim',
    'Shave',
    'Styling',
    'Hair Wash',
    'Color',
    'Treatment'
  ];

  return (
    <div className="bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900">Filters</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Service Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Service Category
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {categories.map((category) => (
                  <label key={category} className="flex items-center">
                    <input
                      type="radio"
                      name="category"
                      value={category.toLowerCase()}
                      checked={localFilters.serviceCategory === category.toLowerCase()}
                      onChange={(e) => 
                        handleFilterChange('serviceCategory', e.target.checked ? e.target.value : undefined)
                      }
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">{category}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <DollarSign className="inline h-4 w-4 mr-1" />
                Price Range
              </label>
              <div className="space-y-3">
                <div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    step="10"
                    value={localFilters.priceRange?.min || 0}
                    onChange={(e) => 
                      handleFilterChange('priceRange', {
                        ...localFilters.priceRange,
                        min: parseInt(e.target.value)
                      })
                    }
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>${localFilters.priceRange?.min || 0}</span>
                    <span>Min</span>
                  </div>
                </div>
                <div>
                  <input
                    type="range"
                    min="20"
                    max="300"
                    step="10"
                    value={localFilters.priceRange?.max || 300}
                    onChange={(e) => 
                      handleFilterChange('priceRange', {
                        ...localFilters.priceRange,
                        max: parseInt(e.target.value)
                      })
                    }
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>${localFilters.priceRange?.max || 300}</span>
                    <span>Max</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Clock className="inline h-4 w-4 mr-1" />
                Duration
              </label>
              <div className="space-y-2">
                {[
                  { label: 'Quick (Under 30 min)', min: 0, max: 30 },
                  { label: 'Standard (30-60 min)', min: 30, max: 60 },
                  { label: 'Extended (60+ min)', min: 60, max: 180 }
                ].map((option) => (
                  <label key={option.label} className="flex items-center">
                    <input
                      type="radio"
                      name="duration"
                      checked={
                        localFilters.duration?.min === option.min && 
                        localFilters.duration?.max === option.max
                      }
                      onChange={(e) => 
                        handleFilterChange('duration', e.target.checked ? {
                          min: option.min,
                          max: option.max
                        } : undefined)
                      }
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Rating & Availability */}
            <div className="space-y-6">
              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Star className="inline h-4 w-4 mr-1" />
                  Minimum Rating
                </label>
                <div className="space-y-2">
                  {[4.5, 4.0, 3.5, 3.0].map((rating) => (
                    <label key={rating} className="flex items-center">
                      <input
                        type="radio"
                        name="rating"
                        value={rating}
                        checked={localFilters.rating === rating}
                        onChange={(e) => 
                          handleFilterChange('rating', e.target.checked ? rating : undefined)
                        }
                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-600">
                        {rating}+ stars
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Availability */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Availability
                </label>
                <div className="space-y-2">
                  {[
                    { label: 'Today', value: 'today' },
                    { label: 'Tomorrow', value: 'tomorrow' },
                    { label: 'This Week', value: 'this-week' },
                    { label: 'Next Week', value: 'next-week' }
                  ].map((option) => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="radio"
                        name="availability"
                        value={option.value}
                        checked={localFilters.availability === option.value}
                        onChange={(e) => 
                          handleFilterChange('availability', e.target.checked ? e.target.value as any : undefined)
                        }
                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-600">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t">
            <div className="flex items-center gap-2">
              {Object.keys(localFilters).filter(key => localFilters[key as keyof BookingFiltersType] !== undefined).length > 0 && (
                <Badge variant="secondary">
                  {Object.keys(localFilters).filter(key => localFilters[key as keyof BookingFiltersType] !== undefined).length} filters applied
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={handleClear}>
                Clear All
              </Button>
              <Button onClick={handleApply}>
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};