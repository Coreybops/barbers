import React, { useState } from 'react';
import { BarberSearchParams } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { 
  Search, 
  Filter, 
  X,
  Star
} from 'lucide-react';

interface BarberSearchFiltersProps {
  onSearch: (params: Partial<BarberSearchParams>) => void;
  loading: boolean;
}

const BarberSearchFilters: React.FC<BarberSearchFiltersProps> = ({
  onSearch,
  loading
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Partial<BarberSearchParams>>({
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearch = () => {
    onSearch({
      ...filters,
      search: searchTerm || undefined
    });
  };

  const handleFilterChange = (key: keyof BarberSearchParams, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Auto-search for some filters
    if (['sortBy', 'sortOrder', 'isAvailable'].includes(key)) {
      onSearch({
        ...newFilters,
        search: searchTerm || undefined
      });
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    onSearch({
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
  };

  const hasActiveFilters = searchTerm || filters.specialties?.length || 
    filters.isAvailable !== undefined || filters.minRating;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      {/* Main Search */}
      <div className="flex gap-4 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search barbers by name, specialty, or bio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch} disabled={loading}>
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {/* Quick Filters */}
      <div className="flex gap-2 mb-4">
        <Select
          value={filters.sortBy || 'createdAt'}
          onValueChange={(value) => handleFilterChange('sortBy', value)}
        >
          <option value="createdAt">Sort by Date</option>
          <option value="rating">Sort by Rating</option>
          <option value="firstName">Sort by Name</option>
          <option value="experience">Sort by Experience</option>
        </Select>

        <Select
          value={filters.sortOrder || 'desc'}
          onValueChange={(value) => handleFilterChange('sortOrder', value)}
        >
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </Select>

        <Select
          value={filters.isAvailable === undefined ? 'all' : filters.isAvailable ? 'available' : 'unavailable'}
          onValueChange={(value) => {
            const isAvailable = value === 'all' ? undefined : value === 'available';
            handleFilterChange('isAvailable', isAvailable);
          }}
        >
          <option value="all">All Barbers</option>
          <option value="available">Available Only</option>
          <option value="unavailable">Unavailable Only</option>
        </Select>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="border-t pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Specialties Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specialties
              </label>
              <Input
                type="text"
                placeholder="Enter specialties separated by commas"
                value={filters.specialties?.join(', ') || ''}
                onChange={(e) => {
                  const specialties = e.target.value
                    .split(',')
                    .map(s => s.trim())
                    .filter(s => s.length > 0);
                  handleFilterChange('specialties', specialties.length > 0 ? specialties : undefined);
                }}
              />
            </div>

            {/* Minimum Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Rating
              </label>
              <Select
                value={filters.minRating?.toString() || ''}
                onValueChange={(value) => {
                  handleFilterChange('minRating', value ? parseFloat(value) : undefined);
                }}
              >
                <option value="">Any Rating</option>
                <option value="4">4+ Stars</option>
                <option value="3">3+ Stars</option>
                <option value="2">2+ Stars</option>
                <option value="1">1+ Stars</option>
              </Select>
            </div>

            {/* Items per page */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Items per page
              </label>
              <Select
                value={filters.limit?.toString() || '10'}
                onValueChange={(value) => handleFilterChange('limit', parseInt(value))}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAdvanced(false)}>
              Hide Filters
            </Button>
            <Button onClick={handleSearch} disabled={loading}>
              Apply Filters
            </Button>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 flex flex-wrap gap-2">
          {searchTerm && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Search: "{searchTerm}"
            </span>
          )}
          {filters.specialties?.map((specialty, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
            >
              Specialty: {specialty}
            </span>
          ))}
          {filters.isAvailable !== undefined && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              {filters.isAvailable ? 'Available' : 'Unavailable'}
            </span>
          )}
          {filters.minRating && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              <Star className="h-3 w-3 mr-1" />
              {filters.minRating}+ Rating
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default BarberSearchFilters;