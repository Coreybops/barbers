import axios from 'axios';
import { 
  GuestBookingData, 
  AvailabilityResponse, 
  BookingSearchResults, 
  BookingFilters,
  WaitlistEntry,
  RecurringBooking
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const bookingApi = {
  // Search barbershops
  async searchBarbershops(
    query?: string, 
    location?: string, 
    filters?: BookingFilters
  ): Promise<BookingSearchResults> {
    const params = new URLSearchParams();
    
    if (query) params.append('q', query);
    if (location) params.append('location', location);
    if (filters?.serviceCategory) params.append('category', filters.serviceCategory);
    if (filters?.priceRange) {
      params.append('minPrice', filters.priceRange.min.toString());
      params.append('maxPrice', filters.priceRange.max.toString());
    }
    if (filters?.rating) params.append('minRating', filters.rating.toString());
    
    const response = await api.get(`/barbershops/search?${params.toString()}`);
    return response.data;
  },

  // Get availability
  async getAvailability(
    barbershopId: string, 
    serviceId: string, 
    date: string, 
    barberId?: string
  ): Promise<AvailabilityResponse> {
    const params = new URLSearchParams({
      barbershopId,
      serviceId,
      date,
    });
    
    if (barberId) params.append('barberId', barberId);
    
    const response = await api.get(`/guest-booking/availability?${params.toString()}`);
    return response.data;
  },

  // Get real-time availability
  async getRealTimeAvailability(
    barbershopId: string,
    serviceId?: string,
    barberId?: string,
    startDate?: string,
    endDate?: string,
    duration?: number
  ) {
    const params = new URLSearchParams({ barbershopId });
    
    if (serviceId) params.append('serviceId', serviceId);
    if (barberId) params.append('barberId', barberId);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (duration) params.append('duration', duration.toString());
    
    const response = await api.get(`/availability/real-time?${params.toString()}`);
    return response.data;
  },

  // Get next available slot
  async getNextAvailable(
    barbershopId: string,
    serviceId: string,
    barberId?: string,
    fromDate?: string,
    maxDays?: number
  ) {
    const params = new URLSearchParams({
      barbershopId,
      serviceId,
    });
    
    if (barberId) params.append('barberId', barberId);
    if (fromDate) params.append('fromDate', fromDate);
    if (maxDays) params.append('maxDays', maxDays.toString());
    
    const response = await api.get(`/availability/next-available?${params.toString()}`);
    return response.data;
  },

  // Create guest booking
  async createGuestBooking(
    bookingData: GuestBookingData, 
    recurring?: RecurringBooking | null
  ) {
    const payload = {
      ...bookingData,
      ...(recurring && { recurring })
    };
    
    const response = await api.post('/guest-booking/book', payload);
    return response.data;
  },

  // Join waitlist
  async joinWaitlist(waitlistData: {
    barbershopId: string;
    serviceId: string;
    barberId?: string;
    preferredDate: string;
    preferredStartTime: string;
    preferredEndTime: string;
    name: string;
    email: string;
    phone?: string;
    flexibleTiming: boolean;
    maxWaitDays: number;
  }): Promise<WaitlistEntry> {
    const response = await api.post('/guest-booking/waitlist', waitlistData);
    return response.data.waitlistEntry;
  },

  // Get appointment details
  async getAppointment(appointmentId: string) {
    const response = await api.get(`/guest-booking/appointment/${appointmentId}`);
    return response.data;
  },

  // Cancel appointment
  async cancelAppointment(appointmentId: string, email: string) {
    const response = await api.put(`/guest-booking/appointment/${appointmentId}/cancel`, {
      email
    });
    return response.data;
  },

  // Reschedule appointment
  async rescheduleAppointment(
    appointmentId: string, 
    newDate: string, 
    newStartTime: string, 
    newEndTime: string,
    email: string
  ) {
    const response = await api.put(`/guest-booking/appointment/${appointmentId}/reschedule`, {
      date: newDate,
      startTime: newStartTime,
      endTime: newEndTime,
      email
    });
    return response.data;
  },

  // Get barbershop services
  async getBarbershopServices(barbershopId: string) {
    const response = await api.get(`/barbershops/${barbershopId}/services`);
    return response.data;
  },

  // Get barbershop barbers
  async getBarbershopBarbers(barbershopId: string, serviceId?: string) {
    const params = serviceId ? `?serviceId=${serviceId}` : '';
    const response = await api.get(`/barbershops/${barbershopId}/barbers${params}`);
    return response.data;
  },

  // Bulk availability check
  async checkBulkAvailability(payload: {
    barbershopId: string;
    serviceIds?: string[];
    barberIds?: string[];
    dateRange: {
      start: string;
      end: string;
    };
    timePreferences?: {
      preferredTimes?: string[];
      avoidTimes?: string[];
      flexibleDuration?: boolean;
    };
  }) {
    const response = await api.post('/availability/bulk-check', payload);
    return response.data;
  },

  // Search nearby barbershops
  async searchNearby(
    latitude: number, 
    longitude: number, 
    radius: number = 10, 
    filters?: BookingFilters
  ) {
    const params = new URLSearchParams({
      lat: latitude.toString(),
      lng: longitude.toString(),
      radius: radius.toString(),
    });
    
    if (filters?.serviceCategory) params.append('category', filters.serviceCategory);
    if (filters?.rating) params.append('minRating', filters.rating.toString());
    
    const response = await api.get(`/barbershops/nearby?${params.toString()}`);
    return response.data;
  },

  // Get popular time slots for a barbershop
  async getPopularTimeSlots(barbershopId: string, serviceId?: string) {
    const params = serviceId ? `?serviceId=${serviceId}` : '';
    const response = await api.get(`/barbershops/${barbershopId}/popular-times${params}`);
    return response.data;
  },

  // Get booking insights
  async getBookingInsights(barbershopId: string, period: 'week' | 'month' | 'quarter') {
    const response = await api.get(`/barbershops/${barbershopId}/insights?period=${period}`);
    return response.data;
  },

  // Send booking reminder
  async sendBookingReminder(appointmentId: string, type: 'email' | 'sms') {
    const response = await api.post(`/guest-booking/appointment/${appointmentId}/reminder`, {
      type
    });
    return response.data;
  },

  // Validate booking slot before booking
  async validateBookingSlot(
    barbershopId: string,
    serviceId: string,
    barberId: string,
    date: string,
    startTime: string,
    endTime: string
  ) {
    const response = await api.post('/guest-booking/validate-slot', {
      barbershopId,
      serviceId,
      barberId,
      date,
      startTime,
      endTime
    });
    return response.data;
  },

  // Get cancellation policy
  async getCancellationPolicy(barbershopId: string) {
    const response = await api.get(`/barbershops/${barbershopId}/cancellation-policy`);
    return response.data;
  },

  // Get service categories
  async getServiceCategories() {
    const response = await api.get('/services/categories');
    return response.data;
  },

  // Rate appointment
  async rateAppointment(
    appointmentId: string,
    rating: number,
    comment?: string,
    email?: string
  ) {
    const response = await api.post(`/guest-booking/appointment/${appointmentId}/rate`, {
      rating,
      comment,
      email
    });
    return response.data;
  }
};

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 409) {
      // Handle booking conflicts
      throw new Error('This time slot is no longer available. Please choose another time.');
    } else if (error.response?.status === 429) {
      // Handle rate limiting
      throw new Error('Too many requests. Please wait a moment and try again.');
    } else if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    } else {
      throw new Error('An unexpected error occurred. Please try again.');
    }
  }
);