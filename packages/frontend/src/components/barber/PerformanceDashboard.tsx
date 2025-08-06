import React, { useState, useEffect } from 'react';
import { Barber, BarberPerformance } from '../../types';
import { barberApi } from '../../services/barberApi';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useToast } from '../../hooks/useToast';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Star, 
  Users,
  Clock,
  AlertTriangle,
  Download,
  RefreshCw,
  X,
  BarChart3,
  PieChart
} from 'lucide-react';

interface PerformanceDashboardProps {
  barber: Barber;
  onClose: () => void;
}

const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  barber,
  onClose
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [performance, setPerformance] = useState<BarberPerformance | null>(null);
  const [dateRange, setDateRange] = useState('30'); // days
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  useEffect(() => {
    fetchPerformance();
  }, [dateRange]);

  const fetchPerformance = async () => {
    try {
      setLoading(true);
      
      let startDate: string | undefined;
      let endDate: string | undefined;

      if (dateRange === 'custom') {
        startDate = customStartDate;
        endDate = customEndDate;
      } else {
        const days = parseInt(dateRange);
        const end = new Date();
        const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
        startDate = start.toISOString().split('T')[0];
        endDate = end.toISOString().split('T')[0];
      }

      const data = await barberApi.getPerformance(barber.id, startDate, endDate);
      setPerformance(data);
    } catch (error) {
      console.error('Error fetching performance:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch performance data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    if (!performance) return;

    const csvContent = [
      ['Metric', 'Value'],
      ['Total Appointments', performance.metrics.totalAppointments],
      ['Completed Appointments', performance.metrics.completedAppointments],
      ['Cancelled Appointments', performance.metrics.cancelledAppointments],
      ['Cancellation Rate (%)', performance.metrics.cancellationRate],
      ['Total Revenue ($)', performance.metrics.totalRevenue],
      ['Commission Earned ($)', performance.metrics.commissionEarned],
      ['Average Rating', performance.metrics.averageRating],
      ['Total Reviews', performance.metrics.totalReviews],
      [''],
      ['Recent Appointments'],
      ['Date', 'Status', 'Service', 'Revenue'],
      ...performance.appointments.map(apt => [
        new Date(apt.date).toLocaleDateString(),
        apt.status,
        apt.serviceName,
        apt.totalPrice
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${barber.user.firstName}_${barber.user.lastName}_performance_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'confirmed':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const completionRate = performance ? 
    (performance.metrics.completedAppointments / performance.metrics.totalAppointments * 100) : 0;

  if (loading && !performance) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Performance Dashboard
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Performance metrics for {barber.user.firstName} {barber.user.lastName}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchPerformance}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportData}
                disabled={!performance}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="ghost" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Date Range:</label>
            <Select
              value={dateRange}
              onValueChange={setDateRange}
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 3 months</option>
              <option value="365">Last year</option>
              <option value="custom">Custom range</option>
            </Select>
            
            {dateRange === 'custom' && (
              <>
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-40"
                />
                <span className="text-gray-500">to</span>
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-40"
                />
                <Button onClick={fetchPerformance} disabled={loading}>
                  Apply
                </Button>
              </>
            )}
          </div>
        </div>

        {performance && (
          <>
            {/* Metrics Grid */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Revenue */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(performance.metrics.totalRevenue)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Commission: {formatCurrency(performance.metrics.commissionEarned)}
                    </p>
                  </CardContent>
                </Card>

                {/* Total Appointments */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Appointments</CardTitle>
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {performance.metrics.totalAppointments}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {performance.metrics.completedAppointments} completed ({completionRate.toFixed(1)}%)
                    </p>
                  </CardContent>
                </Card>

                {/* Average Rating */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Rating</CardTitle>
                    <Star className="h-4 w-4 text-yellow-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold flex items-center">
                      {performance.metrics.averageRating.toFixed(1)}
                      <Star className="h-5 w-5 text-yellow-400 fill-current ml-1" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {performance.metrics.totalReviews} reviews
                    </p>
                  </CardContent>
                </Card>

                {/* Cancellation Rate */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Cancellation Rate</CardTitle>
                    <AlertTriangle className={`h-4 w-4 ${
                      performance.metrics.cancellationRate > 20 ? 'text-red-600' : 
                      performance.metrics.cancellationRate > 10 ? 'text-yellow-600' : 'text-green-600'
                    }`} />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${
                      performance.metrics.cancellationRate > 20 ? 'text-red-600' : 
                      performance.metrics.cancellationRate > 10 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {performance.metrics.cancellationRate.toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {performance.metrics.cancelledAppointments} cancelled
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Performance Insights */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Revenue Performance</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Average per appointment:</span>
                        <span className="font-medium">
                          {performance.metrics.totalAppointments > 0 
                            ? formatCurrency(performance.metrics.totalRevenue / performance.metrics.totalAppointments)
                            : '$0.00'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Commission rate:</span>
                        <span className="font-medium">{(barber.commissionRate * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">Appointment Stats</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Completion rate:</span>
                        <span className="font-medium">{completionRate.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Daily average:</span>
                        <span className="font-medium">
                          {(performance.metrics.totalAppointments / parseInt(dateRange === 'custom' ? '30' : dateRange)).toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Appointments */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Appointments</h3>
                <div className="bg-white border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Service
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Revenue
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {performance.appointments.map((appointment) => (
                          <tr key={appointment.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(appointment.date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {appointment.serviceName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                                {appointment.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatCurrency(appointment.totalPrice)}
                            </td>
                          </tr>
                        ))}
                        {performance.appointments.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                              No appointments found for the selected period
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PerformanceDashboard;