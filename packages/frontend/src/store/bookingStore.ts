import { create } from 'zustand';
import { 
  Barbershop, 
  Service, 
  Barber, 
  BookingStep, 
  GuestBookingData, 
  AvailabilitySlotDetails,
  WaitlistEntry,
  BookingFilters,
  BookingSearchResults,
  RecurringBooking
} from '@/types';
import { bookingApi } from '@/services/bookingApi';

interface BookingState {
  // Current booking flow state
  currentStep: number;
  steps: BookingStep[];
  
  // Selected booking details
  selectedBarbershop: Barbershop | null;
  selectedService: Service | null;
  selectedBarber: Barber | null;
  selectedDate: string | null;
  selectedTimeSlot: AvailabilitySlotDetails | null;
  
  // Guest information
  guestInfo: {
    name: string;
    email: string;
    phone: string;
    notes: string;
    specialRequests: string;
    marketingOptIn: boolean;
  };
  
  // Recurring booking
  recurringBooking: RecurringBooking | null;
  
  // Available time slots
  availableSlots: AvailabilitySlotDetails[];
  availabilityLoading: boolean;
  
  // Search and filters
  searchResults: BookingSearchResults | null;
  searchLoading: boolean;
  filters: BookingFilters;
  
  // Waitlist
  waitlistEntries: WaitlistEntry[];
  
  // Loading states
  isLoading: boolean;
  isBooking: boolean;
  
  // Actions
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  updateStepStatus: (stepId: number, completed: boolean) => void;
  
  // Selection actions
  setBarbershop: (barbershop: Barbershop) => void;
  setService: (service: Service) => void;
  setBarber: (barber: Barber | null) => void;
  setDate: (date: string) => void;
  setTimeSlot: (slot: AvailabilitySlotDetails) => void;
  
  // Guest info actions
  updateGuestInfo: (info: Partial<typeof guestInfo>) => void;
  
  // Recurring booking actions
  setRecurringBooking: (recurring: RecurringBooking | null) => void;
  
  // API actions
  searchBarbershops: (query?: string, location?: string) => Promise<void>;
  updateFilters: (filters: Partial<BookingFilters>) => void;
  clearFilters: () => void;
  loadAvailability: (barbershopId: string, serviceId: string, date: string, barberId?: string) => Promise<void>;
  createBooking: () => Promise<{ success: boolean; appointmentId?: string; error?: string }>;
  joinWaitlist: (waitlistData: any) => Promise<void>;
  
  // Utility actions
  resetBookingFlow: () => void;
  canProceedToNextStep: () => boolean;
  getBookingSummary: () => any;
}

const initialSteps: BookingStep[] = [
  { id: 1, title: 'Choose Location', description: 'Select barbershop', completed: false, active: true },
  { id: 2, title: 'Select Service', description: 'Choose your service', completed: false, active: false },
  { id: 3, title: 'Pick Barber', description: 'Choose your barber (optional)', completed: false, active: false },
  { id: 4, title: 'Select Time', description: 'Pick date and time', completed: false, active: false },
  { id: 5, title: 'Your Details', description: 'Enter your information', completed: false, active: false },
  { id: 6, title: 'Confirm', description: 'Review and confirm booking', completed: false, active: false }
];

const initialGuestInfo = {
  name: '',
  email: '',
  phone: '',
  notes: '',
  specialRequests: '',
  marketingOptIn: false
};

export const useBookingStore = create<BookingState>((set, get) => ({
  // Initial state
  currentStep: 1,
  steps: initialSteps,
  selectedBarbershop: null,
  selectedService: null,
  selectedBarber: null,
  selectedDate: null,
  selectedTimeSlot: null,
  guestInfo: initialGuestInfo,
  recurringBooking: null,
  availableSlots: [],
  availabilityLoading: false,
  searchResults: null,
  searchLoading: false,
  filters: {},
  waitlistEntries: [],
  isLoading: false,
  isBooking: false,

  // Step management
  setCurrentStep: (step: number) => {
    set((state) => ({
      currentStep: step,
      steps: state.steps.map(s => ({
        ...s,
        active: s.id === step
      }))
    }));
  },

  nextStep: () => {
    const { currentStep, steps } = get();
    if (currentStep < steps.length) {
      get().updateStepStatus(currentStep, true);
      get().setCurrentStep(currentStep + 1);
    }
  },

  previousStep: () => {
    const { currentStep } = get();
    if (currentStep > 1) {
      get().setCurrentStep(currentStep - 1);
    }
  },

  updateStepStatus: (stepId: number, completed: boolean) => {
    set((state) => ({
      steps: state.steps.map(step => 
        step.id === stepId ? { ...step, completed } : step
      )
    }));
  },

  // Selection actions
  setBarbershop: (barbershop: Barbershop) => {
    set({ 
      selectedBarbershop: barbershop,
      selectedService: null,
      selectedBarber: null,
      selectedDate: null,
      selectedTimeSlot: null,
      availableSlots: []
    });
  },

  setService: (service: Service) => {
    set({ 
      selectedService: service,
      selectedBarber: null,
      selectedDate: null,
      selectedTimeSlot: null,
      availableSlots: []
    });
  },

  setBarber: (barber: Barber | null) => {
    set({ 
      selectedBarber: barber,
      selectedDate: null,
      selectedTimeSlot: null,
      availableSlots: []
    });
  },

  setDate: (date: string) => {
    set({ 
      selectedDate: date,
      selectedTimeSlot: null,
      availableSlots: []
    });
  },

  setTimeSlot: (slot: AvailabilitySlotDetails) => {
    set({ selectedTimeSlot: slot });
  },

  // Guest info actions
  updateGuestInfo: (info) => {
    set((state) => ({
      guestInfo: { ...state.guestInfo, ...info }
    }));
  },

  // Recurring booking actions
  setRecurringBooking: (recurring: RecurringBooking | null) => {
    set({ recurringBooking: recurring });
  },

  // API actions
  searchBarbershops: async (query?: string, location?: string) => {
    set({ searchLoading: true });
    try {
      const results = await bookingApi.searchBarbershops(query, location, get().filters);
      set({ searchResults: results, searchLoading: false });
    } catch (error) {
      console.error('Error searching barbershops:', error);
      set({ searchLoading: false });
    }
  },

  updateFilters: (newFilters: Partial<BookingFilters>) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters }
    }));
  },

  clearFilters: () => {
    set({ filters: {} });
  },

  loadAvailability: async (barbershopId: string, serviceId: string, date: string, barberId?: string) => {
    set({ availabilityLoading: true });
    try {
      const response = await bookingApi.getAvailability(barbershopId, serviceId, date, barberId);
      set({ 
        availableSlots: response.availableSlots, 
        availabilityLoading: false 
      });
    } catch (error) {
      console.error('Error loading availability:', error);
      set({ availabilityLoading: false, availableSlots: [] });
    }
  },

  createBooking: async () => {
    const state = get();
    const { 
      selectedBarbershop, 
      selectedService, 
      selectedBarber, 
      selectedDate, 
      selectedTimeSlot, 
      guestInfo,
      recurringBooking 
    } = state;

    if (!selectedBarbershop || !selectedService || !selectedDate || !selectedTimeSlot) {
      return { success: false, error: 'Missing required booking information' };
    }

    set({ isBooking: true });
    
    try {
      const bookingData: GuestBookingData = {
        barbershopId: selectedBarbershop.id,
        serviceId: selectedService.id,
        barberId: selectedBarber?.id,
        date: selectedDate,
        startTime: selectedTimeSlot.startTime,
        endTime: selectedTimeSlot.endTime,
        guestName: guestInfo.name,
        guestEmail: guestInfo.email,
        guestPhone: guestInfo.phone,
        notes: guestInfo.notes,
        specialRequests: guestInfo.specialRequests,
        marketingOptIn: guestInfo.marketingOptIn
      };

      const response = await bookingApi.createGuestBooking(bookingData, recurringBooking);
      set({ isBooking: false });
      
      return { success: true, appointmentId: response.appointment.id };
    } catch (error: any) {
      set({ isBooking: false });
      return { success: false, error: error.message || 'Failed to create booking' };
    }
  },

  joinWaitlist: async (waitlistData: any) => {
    set({ isLoading: true });
    try {
      const entry = await bookingApi.joinWaitlist(waitlistData);
      set((state) => ({
        waitlistEntries: [...state.waitlistEntries, entry],
        isLoading: false
      }));
    } catch (error) {
      console.error('Error joining waitlist:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  // Utility actions
  resetBookingFlow: () => {
    set({
      currentStep: 1,
      steps: initialSteps,
      selectedBarbershop: null,
      selectedService: null,
      selectedBarber: null,
      selectedDate: null,
      selectedTimeSlot: null,
      guestInfo: initialGuestInfo,
      recurringBooking: null,
      availableSlots: [],
      searchResults: null,
      filters: {},
      isLoading: false,
      isBooking: false
    });
  },

  canProceedToNextStep: () => {
    const { currentStep, selectedBarbershop, selectedService, selectedDate, selectedTimeSlot, guestInfo } = get();
    
    switch (currentStep) {
      case 1: return !!selectedBarbershop;
      case 2: return !!selectedService;
      case 3: return true; // Barber selection is optional
      case 4: return !!selectedDate && !!selectedTimeSlot;
      case 5: return !!(guestInfo.name && guestInfo.email && guestInfo.phone);
      case 6: return true;
      default: return false;
    }
  },

  getBookingSummary: () => {
    const { 
      selectedBarbershop, 
      selectedService, 
      selectedBarber, 
      selectedDate, 
      selectedTimeSlot, 
      guestInfo,
      recurringBooking 
    } = get();
    
    return {
      barbershop: selectedBarbershop,
      service: selectedService,
      barber: selectedBarber,
      date: selectedDate,
      timeSlot: selectedTimeSlot,
      customer: guestInfo,
      recurring: recurringBooking,
      totalPrice: selectedService?.price || 0
    };
  }
}));