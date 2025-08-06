export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: 'CUSTOMER' | 'BARBER' | 'SHOP_OWNER' | 'ADMIN';
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Barbershop {
  id: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email?: string;
  website?: string;
  images: string[];
  latitude?: number;
  longitude?: number;
  rating: number;
  reviewCount: number;
  isActive: boolean;
  businessHours?: Record<string, { open: string; close: string }>;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Barber {
  id: string;
  bio?: string;
  specialties: string[];
  experience?: number;
  avatar?: string;
  rating: number;
  reviewCount: number;
  isAvailable: boolean;
  
  // Enhanced management fields
  hireDate: string;
  commissionRate: number;
  hourlyRate?: number;
  certifications: string[];
  languages: string[];
  portfolio: string[];
  socialMedia?: Record<string, string>;
  isActive: boolean;
  
  // Performance metrics
  totalRevenue: number;
  totalAppointments: number;
  cancelationRate: number;
  
  userId: string;
  barbershopId: string;
  user: User;
  barbershop?: Barbershop;
  services?: Service[];
  schedules?: Schedule[];
  reviews?: Review[];
  _count?: {
    appointments: number;
    reviews: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  category?: string;
  isActive: boolean;
  barbershopId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  notes?: string;
  totalPrice: number;
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  customerId: string;
  barberId: string;
  serviceId: string;
  barbershopId: string;
  customer: User;
  barber: Barber;
  service: Service;
  barbershop: Barbershop;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  rating: number;
  comment?: string;
  customerId: string;
  barberId: string;
  barbershopId: string;
  appointmentId: string;
  customer: User;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
  refreshToken: string;
}

export interface ApiError {
  error: string;
  details?: any;
}

export interface Schedule {
  id: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  isActive: boolean;
  barberId: string;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklySchedule {
  dayOfWeek: number;
  dayName: string;
  isActive: boolean;
  startTime: string | null;
  endTime: string | null;
  scheduleId: string | null;
}

export interface BarberPerformance {
  period: {
    startDate: string;
    endDate: string;
  };
  metrics: {
    totalAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    cancellationRate: number;
    totalRevenue: number;
    commissionEarned: number;
    averageRating: number;
    totalReviews: number;
  };
  appointments: Array<{
    id: string;
    date: string;
    status: string;
    totalPrice: number;
    serviceName: string;
  }>;
}

export interface BarberSearchParams {
  search?: string;
  barbershopId?: string;
  specialties?: string[];
  isAvailable?: boolean;
  minRating?: number;
  sortBy?: 'createdAt' | 'rating' | 'firstName' | 'lastName' | 'experience';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface BarberSearchResponse {
  barbers: Barber[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CreateBarberData {
  userId: string;
  barbershopId: string;
  bio?: string;
  specialties?: string[];
  experience?: number;
  hireDate?: string;
  commissionRate?: number;
  hourlyRate?: number;
  certifications?: string[];
  languages?: string[];
  socialMedia?: Record<string, string>;
  avatar?: File;
  portfolio?: File[];
}

export interface UpdateBarberData {
  bio?: string;
  specialties?: string[];
  experience?: number;
  hireDate?: string;
  commissionRate?: number;
  hourlyRate?: number;
  certifications?: string[];
  languages?: string[];
  socialMedia?: Record<string, string>;
  isAvailable?: boolean;
  isActive?: boolean;
  avatar?: File;
  portfolio?: File[];
}

// Calendar-specific types
export type CalendarView = 'month' | 'week' | 'day';

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: 'appointment' | 'break' | 'blocked';
  status: AppointmentStatus;
  color?: string;
  appointment?: Appointment;
  barber?: Barber;
}

export interface CalendarTimeSlot {
  start: Date;
  end: Date;
  isAvailable: boolean;
  isBooked: boolean;
  appointments: CalendarEvent[];
  barberId?: string;
}

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  timeSlots: CalendarTimeSlot[];
  events: CalendarEvent[];
}

export interface CalendarWeek {
  weekStart: Date;
  weekEnd: Date;
  days: CalendarDay[];
}

export interface CalendarMonth {
  year: number;
  month: number;
  weeks: CalendarWeek[];
  allDays: CalendarDay[];
}

export interface CalendarFilters {
  barberId?: string;
  barberIds?: string[];
  status?: AppointmentStatus[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  serviceId?: string;
}

export interface CalendarSettings {
  view: CalendarView;
  currentDate: Date;
  workingHours: {
    start: string; // HH:mm format
    end: string; // HH:mm format
  };
  timeSlotDuration: number; // minutes
  showWeekends: boolean;
  timezone: string;
  filters: CalendarFilters;
}

export interface DragDropContext {
  draggedEvent: CalendarEvent | null;
  isDragging: boolean;
  dropTarget: {
    date: Date;
    timeSlot?: CalendarTimeSlot;
  } | null;
}

export interface AvailabilitySlot {
  start: Date;
  end: Date;
  barberId: string;
  isAvailable: boolean;
  reason?: string; // 'booked', 'break', 'holiday', 'custom'
}

export interface RecurringPattern {
  type: 'daily' | 'weekly' | 'monthly';
  interval: number; // every N days/weeks/months
  daysOfWeek?: number[]; // for weekly (0=Sunday, 1=Monday, etc.)
  endDate?: Date;
  occurrences?: number;
}

export interface CreateAppointmentRequest {
  barberId: string;
  customerId: string;
  serviceId: string;
  date: string; // ISO date
  startTime: string; // ISO datetime
  endTime: string; // ISO datetime
  notes?: string;
  recurring?: RecurringPattern;
}

export interface UpdateAppointmentRequest {
  id: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  status?: AppointmentStatus;
  notes?: string;
  barberId?: string;
  serviceId?: string;
}

export interface CalendarEventDrop {
  eventId: string;
  newStart: Date;
  newEnd: Date;
  oldStart: Date;
  oldEnd: Date;
  barberId?: string;
}

export interface TimeBlock {
  id: string;
  type: 'break' | 'lunch' | 'blocked' | 'holiday';
  title: string;
  start: Date;
  end: Date;
  barberId?: string; // null for shop-wide blocks
  isRecurring: boolean;
  recurringPattern?: RecurringPattern;
  color: string;
}

export interface CalendarExportOptions {
  format: 'ical' | 'google' | 'outlook';
  dateRange: {
    start: Date;
    end: Date;
  };
  includeCustomers: boolean;
  includeNotes: boolean;
  barberId?: string;
}

// Guest Booking Types
export interface GuestBookingData {
  barbershopId: string;
  serviceId: string;
  barberId?: string;
  date: string;
  startTime: string;
  endTime: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  notes?: string;
  specialRequests?: string;
  marketingOptIn: boolean;
}

export interface AvailabilitySlotDetails {
  barberId: string;
  barberName: string;
  startTime: string;
  endTime: string;
  displayTime: string;
}

export interface AvailabilityResponse {
  availableSlots: AvailabilitySlotDetails[];
  service: {
    name: string;
    duration: number;
    price: number;
  };
}

export interface BookingStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  active: boolean;
}

export interface WaitlistEntry {
  id: string;
  preferredDate: string;
  preferredStartTime: string;
  preferredEndTime: string;
  name?: string;
  email?: string;
  phone?: string;
  flexibleTiming: boolean;
  maxWaitDays: number;
  status: string;
  createdAt: string;
  expiresAt: string;
  barbershop: Barbershop;
  service: Service;
  barber: Barber;
}

export interface GuestUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  totalBookings: number;
  totalNoShows: number;
  totalCancellations: number;
  averageRating: number;
  isBlacklisted: boolean;
  blacklistReason?: string;
  allowMarketing: boolean;
  preferredContact: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingPreferences {
  id: string;
  preferredBarbers: string[];
  preferredServices: string[];
  preferredTimeSlots: string[];
  preferredDays: number[];
  enableReminders: boolean;
  reminderHours: number;
  allowWaitlist: boolean;
  maxTravelDistance?: number;
  userId: string;
}

export interface RecurringBooking {
  type: 'weekly' | 'biweekly' | 'monthly';
  interval: number;
  endDate?: string;
  occurrences?: number;
  dayOfWeek?: number;
  dayOfMonth?: number;
}

export interface BookingFilters {
  barbershopId?: string;
  serviceCategory?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  duration?: {
    min: number;
    max: number;
  };
  rating?: number;
  availability?: 'today' | 'tomorrow' | 'this-week' | 'next-week';
}

export interface BookingSearchResults {
  barbershops: Array<Barbershop & {
    distance?: number;
    nextAvailable?: string;
    popularServices: Service[];
  }>;
  totalResults: number;
  filters: BookingFilters;
}