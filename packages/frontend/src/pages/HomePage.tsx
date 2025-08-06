import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Search, Calendar, Star, Shield, Users, Clock, MapPin, CheckCircle, ArrowRight, Play, Quote } from 'lucide-react';

export function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-brand/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center animate-fade-in">
            <div className="mb-8">
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20">
                <Star className="w-4 h-4 mr-2" />
                Trusted by 10,000+ customers
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-gradient">
              Book Your Perfect
              <br />
              Barber Experience
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Connect with skilled barbers, book instantly, and enjoy premium grooming services. 
              Your style, your schedule, your way.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link to="/barbershops">
                <Button size="xl" variant="gradient" className="w-full sm:w-auto group">
                  <Search className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Explore Barbershops
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button size="xl" variant="outline" className="w-full sm:w-auto group">
                <Play className="w-5 h-5 mr-2" />
                Watch Demo
              </Button>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto pt-12 border-t border-border/50">
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground mb-2">500+</div>
                <div className="text-sm text-muted-foreground">Partner Barbershops</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground mb-2">50K+</div>
                <div className="text-sm text-muted-foreground">Happy Customers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground mb-2">4.9</div>
                <div className="text-sm text-muted-foreground">Average Rating</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground mb-2">24/7</div>
                <div className="text-sm text-muted-foreground">Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-32 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Why Choose BarberBooking?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to find, book, and enjoy the perfect barbershop experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="group relative p-8 rounded-2xl bg-card border border-border hover:shadow-soft transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <Search className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Discover Local Talent</h3>
              <p className="text-muted-foreground">
                Find top-rated barbershops and skilled barbers in your area with detailed profiles, 
                portfolios, and authentic customer reviews.
              </p>
            </div>

            <div className="group relative p-8 rounded-2xl bg-card border border-border hover:shadow-soft transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-success/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-success/20 transition-colors">
                <Calendar className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Instant Booking</h3>
              <p className="text-muted-foreground">
                Book appointments in real-time with our smart scheduling system. 
                Choose your preferred time, barber, and services effortlessly.
              </p>
            </div>

            <div className="group relative p-8 rounded-2xl bg-card border border-border hover:shadow-soft transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-info/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-info/20 transition-colors">
                <Clock className="w-8 h-8 text-info" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Save Time</h3>
              <p className="text-muted-foreground">
                Skip the wait. Get reminders, reschedule easily, and manage all your 
                appointments from one convenient dashboard.
              </p>
            </div>

            <div className="group relative p-8 rounded-2xl bg-card border border-border hover:shadow-soft transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-warning/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-warning/20 transition-colors">
                <Shield className="w-8 h-8 text-warning" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Secure & Trusted</h3>
              <p className="text-muted-foreground">
                Your data is protected with enterprise-grade security. Book with confidence 
                knowing your privacy is our priority.
              </p>
            </div>

            <div className="group relative p-8 rounded-2xl bg-card border border-border hover:shadow-soft transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-brand/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand/20 transition-colors">
                <Users className="w-8 h-8 text-brand" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Community Driven</h3>
              <p className="text-muted-foreground">
                Join a community of style enthusiasts. Share reviews, discover trends, 
                and connect with fellow customers.
              </p>
            </div>

            <div className="group relative p-8 rounded-2xl bg-card border border-border hover:shadow-soft transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-destructive/20 transition-colors">
                <MapPin className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Location Smart</h3>
              <p className="text-muted-foreground">
                Find barbershops near you with GPS integration, get directions, 
                and explore nearby options with ease.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 lg:py-32 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              What Our Customers Say
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join thousands of satisfied customers who love our platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative p-8 rounded-2xl bg-card border border-border">
              <Quote className="w-8 h-8 text-primary mb-4" />
              <p className="text-muted-foreground mb-6">
                "BarberBooking made finding a great barber so easy. I can book appointments 
                on the go and never have to wait anymore. Highly recommend!"
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mr-4">
                  <span className="text-primary-foreground font-semibold">JD</span>
                </div>
                <div>
                  <div className="font-semibold">John Davis</div>
                  <div className="text-sm text-muted-foreground">Regular Customer</div>
                </div>
              </div>
            </div>

            <div className="relative p-8 rounded-2xl bg-card border border-border">
              <Quote className="w-8 h-8 text-primary mb-4" />
              <p className="text-muted-foreground mb-6">
                "As a barbershop owner, this platform has transformed my business. 
                Better scheduling, happier customers, and increased bookings!"
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-success rounded-full flex items-center justify-center mr-4">
                  <span className="text-success-foreground font-semibold">MS</span>
                </div>
                <div>
                  <div className="font-semibold">Maria Santos</div>
                  <div className="text-sm text-muted-foreground">Barbershop Owner</div>
                </div>
              </div>
            </div>

            <div className="relative p-8 rounded-2xl bg-card border border-border">
              <Quote className="w-8 h-8 text-primary mb-4" />
              <p className="text-muted-foreground mb-6">
                "The app is intuitive and the booking process is seamless. 
                I've discovered some amazing barbers I never would have found otherwise."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-info rounded-full flex items-center justify-center mr-4">
                  <span className="text-info-foreground font-semibold">AK</span>
                </div>
                <div>
                  <div className="font-semibold">Alex Kim</div>
                  <div className="text-sm text-muted-foreground">New User</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 lg:py-32 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Start for free, upgrade when you're ready. No hidden fees, no surprises.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Customer Plan */}
            <div className="relative p-8 rounded-2xl bg-card border border-border">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">Customer</h3>
                <div className="text-4xl font-bold mb-4">Free</div>
                <p className="text-muted-foreground mb-8">Perfect for booking appointments</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-success mr-3" />
                  <span>Unlimited bookings</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-success mr-3" />
                  <span>Real-time availability</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-success mr-3" />
                  <span>Booking reminders</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-success mr-3" />
                  <span>Customer reviews</span>
                </li>
              </ul>
              <Link to="/register" className="block">
                <Button className="w-full" variant="outline">Get Started Free</Button>
              </Link>
            </div>

            {/* Barber Plan */}
            <div className="relative p-8 rounded-2xl bg-primary text-primary-foreground scale-105 shadow-hard">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-brand text-brand-foreground px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">Barber</h3>
                <div className="text-4xl font-bold mb-4">$29<span className="text-lg">/month</span></div>
                <p className="text-primary-foreground/80 mb-8">For individual barbers</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-primary-foreground mr-3" />
                  <span>Professional profile</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-primary-foreground mr-3" />
                  <span>Online booking system</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-primary-foreground mr-3" />
                  <span>Calendar management</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-primary-foreground mr-3" />
                  <span>Customer insights</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-primary-foreground mr-3" />
                  <span>Payment processing</span>
                </li>
              </ul>
              <Button className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                Start Free Trial
              </Button>
            </div>

            {/* Business Plan */}
            <div className="relative p-8 rounded-2xl bg-card border border-border">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">Business</h3>
                <div className="text-4xl font-bold mb-4">$99<span className="text-lg">/month</span></div>
                <p className="text-muted-foreground mb-8">For barbershops & salons</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-success mr-3" />
                  <span>Multiple barber management</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-success mr-3" />
                  <span>Advanced analytics</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-success mr-3" />
                  <span>Marketing tools</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-success mr-3" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-success mr-3" />
                  <span>Custom branding</span>
                </li>
              </ul>
              <Button className="w-full" variant="outline">Contact Sales</Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Ready to Transform Your Grooming Experience?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers and barbers who trust BarberBooking 
            for all their appointment needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button size="xl" variant="gradient" className="w-full sm:w-auto group">
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/barbershops">
              <Button size="xl" variant="outline" className="w-full sm:w-auto">
                Browse Barbershops
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}