import React, { useState } from 'react';
import { Filter, X, Search, Users, Scissors, Clock } from 'lucide-react';
import { useCalendarStore } from '../../store/calendarStore';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Checkbox } from '../ui/checkbox';

// Mock data - replace with actual API calls
const mockBarbers = [
  { id: '1', name: 'John Smith', avatar: null },
  { id: '2', name: 'Mike Johnson', avatar: null },
  { id: '3', name: 'Sarah Wilson', avatar: null }
];

const mockServices = [
  { id: '1', name: 'Haircut', category: 'Hair' },
  { id: '2', name: 'Beard Trim', category: 'Beard' },
  { id: '3', name: 'Hair Wash', category: 'Hair' }
];

const appointmentStatuses = [
  'PENDING',
  'CONFIRMED', 
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW'
];

export function CalendarFilters() {
  const { settings, setFilters } = useCalendarStore();
  const { filters } = settings;
  
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleBarberFilter = (barberId: string) => {
    const currentBarberIds = filters.barberIds || [];
    const newBarberIds = currentBarberIds.includes(barberId)
      ? currentBarberIds.filter(id => id !== barberId)
      : [...currentBarberIds, barberId];
    
    setFilters({ 
      barberIds: newBarberIds.length > 0 ? newBarberIds : undefined,
      barberId: newBarberIds.length === 1 ? newBarberIds[0] : undefined
    });
  };

  const handleStatusFilter = (status: string) => {
    const currentStatuses = filters.status || [];
    const newStatuses = currentStatuses.includes(status as any)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status as any];
    
    setFilters({ 
      status: newStatuses.length > 0 ? newStatuses : undefined 
    });
  };

  const handleServiceFilter = (serviceId: string) => {
    setFilters({ 
      serviceId: filters.serviceId === serviceId ? undefined : serviceId 
    });
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
  };

  const activeFilterCount = [
    filters.barberIds?.length || 0,
    filters.status?.length || 0,
    filters.serviceId ? 1 : 0
  ].reduce((a, b) => a + b, 0);

  const filteredBarbers = mockBarbers.filter(barber =>
    barber.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="px-4 py-3 border-b border-gray-200 bg-white">
      <div className="flex items-center justify-between">
        {/* Filter Toggle */}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          
          <PopoverContent className="w-80 p-0" align="start">
            <div className="p-4 space-y-4">
              {/* Search */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search appointments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Barber Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  Barbers
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {filteredBarbers.map((barber) => (
                    <div key={barber.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`barber-${barber.id}`}
                        checked={filters.barberIds?.includes(barber.id) || false}
                        onCheckedChange={() => handleBarberFilter(barber.id)}
                      />
                      <label
                        htmlFor={`barber-${barber.id}`}
                        className="text-sm text-gray-700 cursor-pointer flex-1"
                      >
                        {barber.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Service Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <Scissors className="h-4 w-4 mr-1" />
                  Service
                </label>
                <Select 
                  value={filters.serviceId || ''} 
                  onValueChange={(value) => handleServiceFilter(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All services" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All services</SelectItem>
                    {mockServices.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {appointmentStatuses.map((status) => (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${status}`}
                        checked={filters.status?.includes(status as any) || false}
                        onCheckedChange={() => handleStatusFilter(status)}
                      />
                      <label
                        htmlFor={`status-${status}`}
                        className="text-xs text-gray-700 cursor-pointer"
                      >
                        {status.replace('_', ' ')}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {activeFilterCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="w-full"
                >
                  Clear All Filters
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Active Filter Badges */}
        <div className="flex items-center space-x-2 flex-1 ml-4">
          {filters.barberIds?.map((barberId) => {
            const barber = mockBarbers.find(b => b.id === barberId);
            return barber ? (
              <Badge key={barberId} variant="secondary" className="flex items-center space-x-1">
                <span>{barber.name}</span>
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleBarberFilter(barberId)}
                />
              </Badge>
            ) : null;
          })}
          
          {filters.serviceId && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <span>
                {mockServices.find(s => s.id === filters.serviceId)?.name || 'Service'}
              </span>
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleServiceFilter(filters.serviceId!)}
              />
            </Badge>
          )}
          
          {filters.status?.map((status) => (
            <Badge key={status} variant="secondary" className="flex items-center space-x-1">
              <span>{status.replace('_', ' ')}</span>
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleStatusFilter(status)}
              />
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CalendarFilters;