import { useAuthStore } from '@/store/authStore';
import { StatCard, MetricCard, SimpleBarChart, DonutChart, ActivityItem, ProgressBar } from '@/components/ui/chart';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Calendar, 
  Heart, 
  TrendingUp, 
  Clock, 
  MapPin,
  Star,
  Users,
  DollarSign,
  Scissors,
  CheckCircle,
  AlertCircle,
  User,
  Plus,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function DashboardPage() {
  const { user } = useAuthStore();

  // Mock data - in real app, this would come from API
  const upcomingAppointments = 3;
  const favoriteShops = 5;
  const totalVisits = 24;
  const monthlySpending = 180;

  const weeklyBookings = [
    { name: 'Mon', value: 2 },
    { name: 'Tue', value: 1 },
    { name: 'Wed', value: 3 },
    { name: 'Thu', value: 2 },
    { name: 'Fri', value: 4 },
    { name: 'Sat', value: 5 },
    { name: 'Sun', value: 1 },
  ];

  const serviceBreakdown = [
    { name: 'Haircut', value: 12, color: 'hsl(var(--primary))' },
    { name: 'Beard Trim', value: 8, color: 'hsl(var(--success))' },
    { name: 'Styling', value: 3, color: 'hsl(var(--warning))' },
    { name: 'Wash', value: 1, color: 'hsl(var(--info))' },
  ];

  const recentActivity = [
    {
      icon: <CheckCircle className="w-4 h-4" />,
      title: "Appointment Completed",
      description: "Haircut at Downtown Barber Shop",
      time: "2 hours ago",
      type: "success" as const
    },
    {
      icon: <Calendar className="w-4 h-4" />,
      title: "Appointment Booked",
      description: "Beard trim scheduled for tomorrow",
      time: "1 day ago",
      type: "default" as const
    },
    {
      icon: <Star className="w-4 h-4" />,
      title: "Review Left",
      description: "5-star review for Mike's Barber Shop",
      time: "2 days ago",
      type: "default" as const
    },
    {
      icon: <Heart className="w-4 h-4" />,
      title: "Shop Favorited",
      description: "Added Classic Cuts to favorites",
      time: "3 days ago",
      type: "default" as const
    },
  ];

  const loyaltyProgress = {
    current: 7,
    target: 10,
    reward: "Free haircut"
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Welcome back, {user?.firstName}!
            </h1>
            <p className="text-muted-foreground mt-2">
              Here's what's happening with your appointments and bookings.
            </p>
          </div>
          <Link to="/book">
            <Button size="lg" className="group">
              <Plus className="w-4 h-4 mr-2" />
              Book Appointment
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Upcoming Appointments"
          value={upcomingAppointments}
          description="Next appointment in 2 days"
          icon={<Calendar className="w-4 h-4" />}
          trend={{
            value: 15,
            label: "vs last month",
            isPositive: true
          }}
        />
        
        <StatCard
          title="Favorite Barbershops"
          value={favoriteShops}
          description="Quick access to preferred shops"
          icon={<Heart className="w-4 h-4" />}
        />
        
        <StatCard
          title="Total Visits"
          value={totalVisits}
          description="Lifetime completed appointments"
          icon={<Scissors className="w-4 h-4" />}
          trend={{
            value: 8,
            label: "vs last month",
            isPositive: true
          }}
        />
        
        <StatCard
          title="Monthly Spending"
          value={`$${monthlySpending}`}
          description="This month's total"
          icon={<DollarSign className="w-4 h-4" />}
          trend={{
            value: 5,
            label: "vs last month",
            isPositive: false
          }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Weekly Booking Trend */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">Weekly Booking Activity</h3>
              <p className="text-sm text-muted-foreground">Your booking pattern this week</p>
            </div>
            <TrendingUp className="w-5 h-5 text-muted-foreground" />
          </div>
          <SimpleBarChart data={weeklyBookings} />
        </Card>

        {/* Service Breakdown */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">Service Breakdown</h3>
              <p className="text-sm text-muted-foreground">Most booked services</p>
            </div>
            <Scissors className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex items-center justify-center mb-4">
            <DonutChart data={serviceBreakdown} size={140} />
          </div>
          <div className="space-y-2">
            {serviceBreakdown.map((service, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: service.color }}
                  />
                  <span>{service.name}</span>
                </div>
                <span className="font-medium">{service.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">Recent Activity</h3>
              <p className="text-sm text-muted-foreground">Your latest bookings and reviews</p>
            </div>
            <Clock className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="space-y-6">
            {recentActivity.map((activity, index) => (
              <ActivityItem
                key={index}
                icon={activity.icon}
                title={activity.title}
                description={activity.description}
                time={activity.time}
                type={activity.type}
              />
            ))}
          </div>
          <div className="mt-6 pt-4 border-t">
            <Link to="/appointments">
              <Button variant="outline" className="w-full">
                View All Activity
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </Card>

        {/* Loyalty Progress & Quick Actions */}
        <div className="space-y-6">
          {/* Loyalty Progress */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Loyalty Progress</h3>
                <p className="text-sm text-muted-foreground">Earn rewards with visits</p>
              </div>
              <Star className="w-5 h-5 text-warning" />
            </div>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  {loyaltyProgress.current}/{loyaltyProgress.target}
                </div>
                <p className="text-sm text-muted-foreground">visits to next reward</p>
              </div>
              <ProgressBar 
                value={loyaltyProgress.current} 
                max={loyaltyProgress.target} 
                color="primary"
                showValue={false}
              />
              <div className="text-center p-3 bg-primary/10 rounded-lg">
                <p className="text-sm font-medium text-primary">
                  Next Reward: {loyaltyProgress.reward}
                </p>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link to="/book">
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  Book New Appointment
                </Button>
              </Link>
              <Link to="/barbershops">
                <Button variant="outline" className="w-full justify-start">
                  <MapPin className="w-4 h-4 mr-2" />
                  Explore Barbershops
                </Button>
              </Link>
              <Link to="/my-bookings">
                <Button variant="outline" className="w-full justify-start">
                  <Clock className="w-4 h-4 mr-2" />
                  Manage Bookings
                </Button>
              </Link>
              <Link to="/profile">
                <Button variant="outline" className="w-full justify-start">
                  <User className="w-4 h-4 mr-2" />
                  Update Profile
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}