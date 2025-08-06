import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { ThemeProvider } from './contexts/theme-context';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { MobileNav, FloatingActionButton, MobilePageWrapper } from './components/ui/mobile-nav';
import { Toaster } from './components/ui/toaster';

// Pages
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { BarbershopsPage } from './pages/BarbershopsPage';
import { BarbershopDetailPage } from './pages/BarbershopDetailPage';
import { AppointmentsPage } from './pages/AppointmentsPage';
import { ProfilePage } from './pages/ProfilePage';
import { BookingPage } from './pages/BookingPage';
import { CustomerBookingsPage } from './pages/CustomerBookingsPage';
import BarberManagementPage from './pages/BarberManagementPage';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  const { initialize } = useAuthStore();

  // Initialize auth state on app start
  React.useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <ThemeProvider defaultTheme="system" storageKey="barberbooking-theme">
      <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
        <Navbar />
        <MobilePageWrapper>
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/barbershops" element={<BarbershopsPage />} />
              <Route path="/barbershops/:id" element={<BarbershopDetailPage />} />
              <Route path="/book" element={<BookingPage />} />
              
              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/appointments" element={<AppointmentsPage />} />
                <Route path="/my-bookings" element={<CustomerBookingsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/barber-management" element={<BarberManagementPage />} />
              </Route>
            </Routes>
          </main>
          <Footer />
        </MobilePageWrapper>
        <MobileNav />
        <FloatingActionButton />
        <Toaster />
      </div>
    </ThemeProvider>
  );
}

export default App;