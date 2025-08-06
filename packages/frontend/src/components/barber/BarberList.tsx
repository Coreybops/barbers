import React from 'react';
import { Barber } from '../../types';
import { Button } from '../ui/button';
import { 
  Edit, 
  Trash2, 
  Star, 
  MapPin, 
  Phone, 
  Mail,
  Calendar,
  DollarSign,
  User,
  Clock,
  Settings,
  BarChart3,
  MoreHorizontal
} from 'lucide-react';

interface BarberListProps {
  barbers: Barber[];
  loading: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  onPageChange: (page: number) => void;
  onEdit: (barber: Barber) => void;
  onDeactivate: (barberId: string) => void;
  onManageServices?: (barber: Barber) => void;
  onManageSchedule?: (barber: Barber) => void;
  onViewPerformance?: (barber: Barber) => void;
}

const BarberList: React.FC<BarberListProps> = ({
  barbers,
  loading,
  pagination,
  onPageChange,
  onEdit,
  onDeactivate,
  onManageServices,
  onManageSchedule,
  onViewPerformance
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (barbers.length === 0) {
    return (
      <div className="text-center py-16">
        <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No barbers found</h3>
        <p className="text-gray-500">Get started by adding your first barber.</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div>
      {/* Table Header */}
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
        <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
          <div className="col-span-2">Barber</div>
          <div className="col-span-2">Contact</div>
          <div className="col-span-2">Specialties</div>
          <div className="col-span-1">Rating</div>
          <div className="col-span-1">Revenue</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-3">Actions</div>
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-gray-200">
        {barbers.map((barber) => (
          <div key={barber.id} className="px-6 py-4 hover:bg-gray-50">
            <div className="grid grid-cols-12 gap-4 items-center">
              {/* Barber Info */}
              <div className="col-span-2 flex items-center">
                <div className="flex-shrink-0 h-12 w-12">
                  {barber.avatar ? (
                    <img
                      className="h-12 w-12 rounded-full object-cover"
                      src={barber.avatar.startsWith('http') ? barber.avatar : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${barber.avatar}`}
                      alt={`${barber.user.firstName} ${barber.user.lastName}`}
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                      <User className="h-6 w-6 text-gray-600" />
                    </div>
                  )}
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-900">
                    {barber.user.firstName} {barber.user.lastName}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    Hired {formatDate(barber.hireDate)}
                  </div>
                  {barber.experience && (
                    <div className="text-xs text-gray-400 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {barber.experience} years exp.
                    </div>
                  )}
                </div>
              </div>

              {/* Contact */}
              <div className="col-span-2">
                <div className="text-sm text-gray-900 flex items-center mb-1">
                  <Mail className="h-3 w-3 mr-1 text-gray-400" />
                  {barber.user.email}
                </div>
                {barber.user.phone && (
                  <div className="text-sm text-gray-500 flex items-center">
                    <Phone className="h-3 w-3 mr-1 text-gray-400" />
                    {barber.user.phone}
                  </div>
                )}
              </div>

              {/* Specialties */}
              <div className="col-span-2">
                <div className="flex flex-wrap gap-1">
                  {barber.specialties.slice(0, 3).map((specialty, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {specialty}
                    </span>
                  ))}
                  {barber.specialties.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{barber.specialties.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Rating */}
              <div className="col-span-1">
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="ml-1 text-sm text-gray-900">
                    {barber.rating.toFixed(1)}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  ({barber.reviewCount} reviews)
                </div>
              </div>

              {/* Revenue */}
              <div className="col-span-1">
                <div className="text-sm font-medium text-gray-900 flex items-center">
                  <DollarSign className="h-3 w-3 mr-1" />
                  {formatCurrency(barber.totalRevenue)}
                </div>
                <div className="text-xs text-gray-500">
                  {barber.commissionRate * 100}% commission
                </div>
              </div>

              {/* Status */}
              <div className="col-span-1">
                <div className="flex flex-col gap-1">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      barber.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {barber.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      barber.isAvailable
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {barber.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="col-span-3 flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(barber)}
                  className="flex items-center gap-1"
                >
                  <Edit className="h-3 w-3" />
                  Edit
                </Button>
                
                {onManageServices && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onManageServices(barber)}
                    className="flex items-center gap-1"
                    title="Manage Services"
                  >
                    <Settings className="h-3 w-3" />
                    Services
                  </Button>
                )}
                
                {onManageSchedule && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onManageSchedule(barber)}
                    className="flex items-center gap-1"
                    title="Manage Schedule"
                  >
                    <Calendar className="h-3 w-3" />
                    Schedule
                  </Button>
                )}
                
                {onViewPerformance && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewPerformance(barber)}
                    className="flex items-center gap-1"
                    title="View Performance"
                  >
                    <BarChart3 className="h-3 w-3" />
                    Performance
                  </Button>
                )}
                
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to deactivate this barber?')) {
                      onDeactivate(barber.id);
                    }
                  }}
                  className="flex items-center gap-1"
                  disabled={!barber.isActive}
                  title="Deactivate Barber"
                >
                  <Trash2 className="h-3 w-3" />
                  Deactivate
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <Button
              variant="outline"
              onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => onPageChange(Math.min(pagination.pages, pagination.page + 1))}
              disabled={pagination.page === pagination.pages}
            >
              Next
            </Button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">
                  {(pagination.page - 1) * pagination.limit + 1}
                </span>{' '}
                to{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                of <span className="font-medium">{pagination.total}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <Button
                  variant="outline"
                  className="rounded-l-md"
                  onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  const page = Math.max(1, Math.min(pagination.pages - 4, pagination.page - 2)) + i;
                  return (
                    <Button
                      key={page}
                      variant={pagination.page === page ? "default" : "outline"}
                      className="rounded-none"
                      onClick={() => onPageChange(page)}
                    >
                      {page}
                    </Button>
                  );
                })}
                
                <Button
                  variant="outline"
                  className="rounded-r-md"
                  onClick={() => onPageChange(Math.min(pagination.pages, pagination.page + 1))}
                  disabled={pagination.page === pagination.pages}
                >
                  Next
                </Button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BarberList;