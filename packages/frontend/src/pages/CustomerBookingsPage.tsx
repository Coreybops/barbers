import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Plus, 
  Filter,
  Search,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  Edit,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAuthStore } from '@/store/authStore';
import { Appointment } from '@/types';
import { formatDate, formatTime, formatCurrency, formatDateRelative } from '@/utils/format';

export const CustomerBookingsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past' | 'cancelled'>('upcoming');
  const [searchTerm, setSearchTerm] = useState('');

  const { user } = useAuthStore();

  useEffect(() => {
    const loadAppointments = async () => {
      // TODO: Implement API call to load user's appointments
      setLoading(false);
    };

    if (user) {
      loadAppointments();
    }
  }, [user, filter]);

  const filteredAppointments = appointments.filter(appointment => {
    const matchesFilter = () => {
      const now = new Date();
      const appointmentDate = new Date(appointment.startTime);
      
      switch (filter) {
        case 'upcoming':
          return appointmentDate >= now && appointment.status !== 'CANCELLED';
        case 'past':
          return appointmentDate < now && appointment.status === 'COMPLETED';
        case 'cancelled':
          return appointment.status === 'CANCELLED';
        default:
          return true;
      }
    };

    const matchesSearch = searchTerm === '' || 
      appointment.barbershop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${appointment.barber.user.firstName} ${appointment.barber.user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter() && matchesSearch;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'CANCELLED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'NO_SHOW':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800';
      case 'NO_SHOW': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canCancelAppointment = (appointment: Appointment) => {
    const appointmentTime = new Date(appointment.startTime);
    const now = new Date();
    const hoursUntil = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    return hoursUntil >= 24 && appointment.status === 'CONFIRMED';
  };

  const canRescheduleAppointment = (appointment: Appointment) => {
    const appointmentTime = new Date(appointment.startTime);
    const now = new Date();
    const hoursUntil = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    return hoursUntil >= 24 && appointment.status === 'CONFIRMED';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            My Appointments
          </h1>
          <p className="text-gray-600">
            Manage your upcoming and past appointments
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button 
              className="flex items-center gap-2"
              onClick={() => window.location.href = '/book'}
            >
              <Plus className="h-4 w-4" />
              Book New Appointment
            </Button>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search appointments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-6 mb-8 border-b">
          {[
            { key: 'upcoming', label: 'Upcoming', count: appointments.filter(a => new Date(a.startTime) >= new Date() && a.status !== 'CANCELLED').length },
            { key: 'past', label: 'Past', count: appointments.filter(a => new Date(a.startTime) < new Date() && a.status === 'COMPLETED').length },
            { key: 'cancelled', label: 'Cancelled', count: appointments.filter(a => a.status === 'CANCELLED').length },
            { key: 'all', label: 'All', count: appointments.length }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                filter === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Appointments List */}
        {filteredAppointments.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Calendar className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'upcoming' ? 'No Upcoming Appointments' : 
               filter === 'past' ? 'No Past Appointments' :
               filter === 'cancelled' ? 'No Cancelled Appointments' :
               'No Appointments Found'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm 
                ? 'No appointments match your search criteria.'
                : filter === 'upcoming' 
                  ? 'You don\'t have any upcoming appointments.'
                  : 'No appointments in this category.'
              }
            </p>
            {filter === 'upcoming' && !searchTerm && (
              <Button onClick={() => window.location.href = '/book'}>
                <Plus className="h-4 w-4 mr-2" />
                Book Your First Appointment
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((appointment) => (
              <Card key={appointment.id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Appointment Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(appointment.status)}
                        <Badge className={getStatusColor(appointment.status)}>
                          {appointment.status.toLowerCase().replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDateRelative(appointment.date)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Date & Time */}
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900">
                            {formatDate(appointment.date)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                          </div>
                        </div>
                      </div>

                      {/* Barbershop */}
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900">
                            {appointment.barbershop.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {appointment.barbershop.city}, {appointment.barbershop.state}
                          </div>
                        </div>
                      </div>

                      {/* Barber & Service */}
                      <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900">
                            {appointment.barber.user.firstName} {appointment.barber.user.lastName}
                          </div>
                          <div className="text-sm text-gray-600">
                            {appointment.service.name} • {formatCurrency(appointment.service.price)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {appointment.notes && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm font-medium text-gray-700 mb-1">Notes:</div>
                        <div className="text-sm text-gray-600">{appointment.notes}</div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    {appointment.status === 'COMPLETED' && !appointment.review && (
                      <Button size="sm" variant="outline" className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        Rate
                      </Button>
                    )}
                    
                    {canRescheduleAppointment(appointment) && (
                      <Button size="sm" variant="outline" className="flex items-center gap-1">
                        <Edit className="h-3 w-3" />
                        Reschedule
                      </Button>
                    )}
                    
                    {canCancelAppointment(appointment) && (
                      <Button size="sm" variant="outline" className="flex items-center gap-1 text-red-600 hover:text-red-700">
                        <Trash2 className="h-3 w-3" />
                        Cancel
                      </Button>
                    )}

                    <Button size="sm" variant="ghost">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Stats Summary */}
        {appointments.length > 0 && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="p-6 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-2">
                {appointments.length}
              </div>
              <div className="text-sm text-gray-600">Total Appointments</div>
            </Card>
            
            <Card className="p-6 text-center">
              <div className="text-2xl font-bold text-green-600 mb-2">
                {appointments.filter(a => a.status === 'COMPLETED').length}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </Card>
            
            <Card className="p-6 text-center">
              <div className="text-2xl font-bold text-orange-600 mb-2">
                {appointments.filter(a => new Date(a.startTime) >= new Date() && a.status !== 'CANCELLED').length}
              </div>
              <div className="text-sm text-gray-600">Upcoming</div>
            </Card>
            
            <Card className="p-6 text-center">
              <div className="text-2xl font-bold text-purple-600 mb-2">
                {appointments.reduce((sum, a) => sum + a.totalPrice, 0) > 0 
                  ? formatCurrency(appointments.reduce((sum, a) => sum + a.totalPrice, 0))
                  : '$0'
                }
              </div>
              <div className="text-sm text-gray-600">Total Spent</div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};