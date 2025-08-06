import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { barberApi } from '../services/barberApi';
import { Barber, BarberSearchParams } from '../types';
import { Button } from '../components/ui/button';
import { useToast } from '../hooks/useToast';
import BarberList from '../components/barber/BarberList';
import BarberForm from '../components/barber/BarberForm';
import BarberSearchFilters from '../components/barber/BarberSearchFilters';
import ServiceAssignment from '../components/barber/ServiceAssignment';
import ScheduleManagement from '../components/barber/ScheduleManagement';
import PerformanceDashboard from '../components/barber/PerformanceDashboard';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '../components/ui/dialog';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '../components/ui/card';
import { 
  Users, 
  UserPlus, 
  Star, 
  DollarSign 
} from 'lucide-react';

const BarberManagementPage: React.FC = () => {
  const { user } = useAuthStore();
  const { toast } = useToast();
  
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  
  const [searchParams, setSearchParams] = useState<BarberSearchParams>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);
  const [showServiceAssignment, setShowServiceAssignment] = useState(false);
  const [showScheduleManagement, setShowScheduleManagement] = useState(false);
  const [showPerformanceDashboard, setShowPerformanceDashboard] = useState(false);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);

  // Stats
  const [stats, setStats] = useState({
    totalBarbers: 0,
    activeBarbers: 0,
    averageRating: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    fetchBarbers();
  }, [searchParams]);

  const fetchBarbers = async () => {
    try {
      setLoading(true);
      const response = await barberApi.searchBarbers(searchParams);
      setBarbers(response.barbers);
      setPagination(response.pagination);
      
      // Calculate stats
      const activeBarbers = response.barbers.filter(b => b.isActive);
      const totalRating = response.barbers.reduce((sum, b) => sum + b.rating, 0);
      const totalRevenue = response.barbers.reduce((sum, b) => sum + b.totalRevenue, 0);
      
      setStats({
        totalBarbers: response.barbers.length,
        activeBarbers: activeBarbers.length,
        averageRating: response.barbers.length > 0 ? totalRating / response.barbers.length : 0,
        totalRevenue
      });
    } catch (error) {
      console.error('Error fetching barbers:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch barbers',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (newParams: Partial<BarberSearchParams>) => {
    setSearchParams(prev => ({
      ...prev,
      ...newParams,
      page: 1 // Reset to first page when searching
    }));
  };

  const handlePageChange = (page: number) => {
    setSearchParams(prev => ({ ...prev, page }));
  };

  const handleAddBarber = () => {
    setEditingBarber(null);
    setShowAddForm(true);
  };

  const handleEditBarber = (barber: Barber) => {
    setEditingBarber(barber);
    setShowAddForm(true);
  };

  const handleFormSuccess = () => {
    setShowAddForm(false);
    setEditingBarber(null);
    fetchBarbers();
    toast({
      title: 'Success',
      description: editingBarber ? 'Barber updated successfully' : 'Barber created successfully',
    });
  };

  const handleFormCancel = () => {
    setShowAddForm(false);
    setEditingBarber(null);
  };

  const handleDeactivateBarber = async (barberId: string) => {
    try {
      await barberApi.deactivateBarber(barberId);
      fetchBarbers();
      toast({
        title: 'Success',
        description: 'Barber deactivated successfully',
      });
    } catch (error) {
      console.error('Error deactivating barber:', error);
      toast({
        title: 'Error',
        description: 'Failed to deactivate barber',
        variant: 'destructive',
      });
    }
  };

  const handleManageServices = (barber: Barber) => {
    setSelectedBarber(barber);
    setShowServiceAssignment(true);
  };

  const handleManageSchedule = (barber: Barber) => {
    setSelectedBarber(barber);
    setShowScheduleManagement(true);
  };

  const handleViewPerformance = (barber: Barber) => {
    setSelectedBarber(barber);
    setShowPerformanceDashboard(true);
  };

  const handleServiceAssignmentUpdate = (updatedBarber: Barber) => {
    setBarbers(prev => prev.map(b => b.id === updatedBarber.id ? updatedBarber : b));
    setShowServiceAssignment(false);
    setSelectedBarber(null);
  };

  const closeModals = () => {
    setShowServiceAssignment(false);
    setShowScheduleManagement(false);
    setShowPerformanceDashboard(false);
    setSelectedBarber(null);
  };

  if (!user || (user.role !== 'SHOP_OWNER' && user.role !== 'ADMIN')) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access barber management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Barber Management</h1>
          <p className="text-gray-600 mt-2">Manage your barbershop's staff and their information</p>
        </div>
        <Button onClick={handleAddBarber} className="flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          Add New Barber
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Barbers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBarbers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeBarbers} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Barbers</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeBarbers}</div>
            <p className="text-xs text-muted-foreground">
              Currently available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.averageRating.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              Out of 5.0
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="mb-6">
        <BarberSearchFilters
          onSearch={handleSearch}
          loading={loading}
        />
      </div>

      {/* Barber List */}
      <div className="bg-white rounded-lg shadow">
        <BarberList
          barbers={barbers}
          loading={loading}
          pagination={pagination}
          onPageChange={handlePageChange}
          onEdit={handleEditBarber}
          onDeactivate={handleDeactivateBarber}
          onManageServices={handleManageServices}
          onManageSchedule={handleManageSchedule}
          onViewPerformance={handleViewPerformance}
        />
      </div>

      {/* Add/Edit Barber Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBarber ? 'Edit Barber' : 'Add New Barber'}
            </DialogTitle>
          </DialogHeader>
          <BarberForm
            barber={editingBarber}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </DialogContent>
      </Dialog>

      {/* Service Assignment Dialog */}
      <Dialog open={showServiceAssignment} onOpenChange={setShowServiceAssignment}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          {selectedBarber && (
            <ServiceAssignment
              barber={selectedBarber}
              onUpdate={handleServiceAssignmentUpdate}
              onClose={closeModals}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Schedule Management Dialog */}
      <Dialog open={showScheduleManagement} onOpenChange={setShowScheduleManagement}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          {selectedBarber && (
            <ScheduleManagement
              barber={selectedBarber}
              onClose={closeModals}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Performance Dashboard Dialog */}
      <Dialog open={showPerformanceDashboard} onOpenChange={setShowPerformanceDashboard}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          {selectedBarber && (
            <PerformanceDashboard
              barber={selectedBarber}
              onClose={closeModals}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BarberManagementPage;