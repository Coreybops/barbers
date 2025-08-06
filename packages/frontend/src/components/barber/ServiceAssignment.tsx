import React, { useState, useEffect } from 'react';
import { Barber, Service } from '../../types';
import { barberApi } from '../../services/barberApi';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useToast } from '../../hooks/useToast';
import { 
  Search, 
  Plus, 
  Minus, 
  DollarSign, 
  Clock,
  Tag,
  Check,
  X
} from 'lucide-react';

interface ServiceAssignmentProps {
  barber: Barber;
  onUpdate: (updatedBarber: Barber) => void;
  onClose: () => void;
}

const ServiceAssignment: React.FC<ServiceAssignmentProps> = ({
  barber,
  onUpdate,
  onClose
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [assignedServiceIds, setAssignedServiceIds] = useState<string[]>(
    barber.services?.map(s => s.id) || []
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    // Filter services based on search term
    const filtered = allServices.filter(service =>
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredServices(filtered);
  }, [allServices, searchTerm]);

  const fetchServices = async () => {
    try {
      // This would typically be an API call to get all services for the barbershop
      // For now, we'll simulate it with the barber's current services
      // In a real implementation, you'd fetch all available services from the barbershop
      const mockServices: Service[] = [
        {
          id: '1',
          name: 'Classic Haircut',
          description: 'Traditional men\'s haircut',
          duration: 30,
          price: 25.00,
          category: 'Haircuts',
          isActive: true,
          barbershopId: barber.barbershopId,
          createdAt: '',
          updatedAt: ''
        },
        {
          id: '2',
          name: 'Beard Trim',
          description: 'Professional beard trimming and shaping',
          duration: 20,
          price: 15.00,
          category: 'Beard Care',
          isActive: true,
          barbershopId: barber.barbershopId,
          createdAt: '',
          updatedAt: ''
        },
        {
          id: '3',
          name: 'Hot Towel Shave',
          description: 'Traditional hot towel straight razor shave',
          duration: 45,
          price: 35.00,
          category: 'Shaving',
          isActive: true,
          barbershopId: barber.barbershopId,
          createdAt: '',
          updatedAt: ''
        },
        {
          id: '4',
          name: 'Hair Wash & Style',
          description: 'Hair washing and styling service',
          duration: 25,
          price: 20.00,
          category: 'Styling',
          isActive: true,
          barbershopId: barber.barbershopId,
          createdAt: '',
          updatedAt: ''
        },
        {
          id: '5',
          name: 'Mustache Trim',
          description: 'Precision mustache trimming',
          duration: 15,
          price: 10.00,
          category: 'Beard Care',
          isActive: true,
          barbershopId: barber.barbershopId,
          createdAt: '',
          updatedAt: ''
        }
      ];
      
      setAllServices(mockServices);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch services',
        variant: 'destructive',
      });
    }
  };

  const toggleServiceAssignment = (serviceId: string) => {
    setAssignedServiceIds(prev => {
      if (prev.includes(serviceId)) {
        return prev.filter(id => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const updatedBarber = await barberApi.assignServices(barber.id, assignedServiceIds);
      onUpdate(updatedBarber);
      toast({
        title: 'Success',
        description: 'Services updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating services:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to update services',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const assignedServices = filteredServices.filter(s => assignedServiceIds.includes(s.id));
  const availableServices = filteredServices.filter(s => !assignedServiceIds.includes(s.id));
  const hasChanges = JSON.stringify(assignedServiceIds.sort()) !== 
                     JSON.stringify(barber.services?.map(s => s.id).sort() || []);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Service Assignment
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Manage services for {barber.user.firstName} {barber.user.lastName}
              </p>
            </div>
            <Button variant="ghost" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
          {/* Available Services */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Available Services ({availableServices.length})
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {availableServices.map((service) => (
                <div
                  key={service.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-gray-900">{service.name}</h4>
                        {service.category && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <Tag className="w-3 h-3 mr-1" />
                            {service.category}
                          </span>
                        )}
                      </div>
                      {service.description && (
                        <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <DollarSign className="w-3 h-3 mr-1" />
                          {formatCurrency(service.price)}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatDuration(service.duration)}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => toggleServiceAssignment(service.id)}
                      className="ml-4"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
              ))}
              {availableServices.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Tag className="mx-auto h-8 w-8 mb-2" />
                  <p>No available services found</p>
                </div>
              )}
            </div>
          </div>

          {/* Assigned Services */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Assigned Services ({assignedServices.length})
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {assignedServices.map((service) => (
                <div
                  key={service.id}
                  className="border border-green-200 bg-green-50 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <h4 className="font-medium text-gray-900">{service.name}</h4>
                        {service.category && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Tag className="w-3 h-3 mr-1" />
                            {service.category}
                          </span>
                        )}
                      </div>
                      {service.description && (
                        <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <DollarSign className="w-3 h-3 mr-1" />
                          {formatCurrency(service.price)}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatDuration(service.duration)}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => toggleServiceAssignment(service.id)}
                      className="ml-4"
                    >
                      <Minus className="w-3 h-3 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              {assignedServices.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Tag className="mx-auto h-8 w-8 mb-2" />
                  <p>No services assigned</p>
                  <p className="text-sm">Add services from the available list</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {assignedServices.length} service{assignedServices.length !== 1 ? 's' : ''} assigned
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={loading || !hasChanges}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceAssignment;