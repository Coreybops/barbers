import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useBookingStore } from '../bookingStore';
import { bookingApi } from '@/services/bookingApi';

// Mock the bookingApi
vi.mock('@/services/bookingApi');

describe('BookingStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    useBookingStore.getState().resetBookingFlow();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('has correct initial state', () => {
    const state = useBookingStore.getState();
    
    expect(state.currentStep).toBe(1);
    expect(state.steps).toHaveLength(6);
    expect(state.selectedBarbershop).toBeNull();
    expect(state.selectedService).toBeNull();
    expect(state.selectedBarber).toBeNull();
    expect(state.selectedDate).toBeNull();
    expect(state.selectedTimeSlot).toBeNull();
    expect(state.guestInfo.name).toBe('');
    expect(state.guestInfo.email).toBe('');
    expect(state.guestInfo.phone).toBe('');
    expect(state.isLoading).toBe(false);
    expect(state.isBooking).toBe(false);
  });

  describe('step management', () => {
    it('sets current step correctly', () => {
      const { setCurrentStep } = useBookingStore.getState();
      
      setCurrentStep(3);
      
      const state = useBookingStore.getState();
      expect(state.currentStep).toBe(3);
      expect(state.steps[2].active).toBe(true);
      expect(state.steps[0].active).toBe(false);
      expect(state.steps[1].active).toBe(false);
    });

    it('advances to next step', () => {
      const { nextStep, updateStepStatus } = useBookingStore.getState();
      
      nextStep();
      
      const state = useBookingStore.getState();
      expect(state.currentStep).toBe(2);
      expect(state.steps[0].completed).toBe(true);
      expect(state.steps[1].active).toBe(true);
    });

    it('goes to previous step', () => {
      const { setCurrentStep, previousStep } = useBookingStore.getState();
      
      setCurrentStep(3);
      previousStep();
      
      const state = useBookingStore.getState();
      expect(state.currentStep).toBe(2);
      expect(state.steps[1].active).toBe(true);
    });

    it('does not go below step 1', () => {
      const { previousStep } = useBookingStore.getState();
      
      previousStep();
      
      const state = useBookingStore.getState();
      expect(state.currentStep).toBe(1);
    });

    it('does not go above maximum steps', () => {
      const { setCurrentStep, nextStep } = useBookingStore.getState();
      
      setCurrentStep(6);
      nextStep();
      
      const state = useBookingStore.getState();
      expect(state.currentStep).toBe(6);
    });

    it('updates step status', () => {
      const { updateStepStatus } = useBookingStore.getState();
      
      updateStepStatus(2, true);
      
      const state = useBookingStore.getState();
      expect(state.steps[1].completed).toBe(true);
    });
  });

  describe('selection actions', () => {
    const mockBarbershop = {
      id: 'barbershop-1',
      name: 'Test Barbershop',
      address: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
      phone: '555-0123',
    };

    const mockService = {
      id: 'service-1',
      name: 'Haircut',
      description: 'Professional haircut',
      duration: 30,
      price: 25.00,
      category: 'Hair',
    };

    const mockBarber = {
      id: 'barber-1',
      userId: 'user-1',
      barbershopId: 'barbershop-1',
      bio: 'Experienced barber',
      specialties: ['haircut'],
      rating: 4.8,
    };

    const mockTimeSlot = {
      startTime: '10:00',
      endTime: '10:30',
      available: true,
      barberId: 'barber-1',
    };

    it('sets barbershop and resets dependent selections', () => {
      const { setBarbershop, setService, setBarber } = useBookingStore.getState();
      
      // Set some dependent selections first
      setService(mockService);
      setBarber(mockBarber);
      
      setBarbershop(mockBarbershop);
      
      const state = useBookingStore.getState();
      expect(state.selectedBarbershop).toEqual(mockBarbershop);
      expect(state.selectedService).toBeNull();
      expect(state.selectedBarber).toBeNull();
      expect(state.selectedDate).toBeNull();
      expect(state.selectedTimeSlot).toBeNull();
    });

    it('sets service and resets dependent selections', () => {
      const { setBarbershop, setService, setBarber, setDate } = useBookingStore.getState();
      
      // Set up initial state
      setBarbershop(mockBarbershop);
      setBarber(mockBarber);
      setDate('2024-01-01');
      
      setService(mockService);
      
      const state = useBookingStore.getState();
      expect(state.selectedService).toEqual(mockService);
      expect(state.selectedBarbershop).toEqual(mockBarbershop); // Should remain
      expect(state.selectedBarber).toBeNull(); // Should reset
      expect(state.selectedDate).toBeNull(); // Should reset
    });

    it('sets barber and resets dependent selections', () => {
      const { setBarbershop, setService, setBarber, setDate, setTimeSlot } = useBookingStore.getState();
      
      // Set up initial state
      setBarbershop(mockBarbershop);
      setService(mockService);
      setDate('2024-01-01');
      setTimeSlot(mockTimeSlot);
      
      setBarber(mockBarber);
      
      const state = useBookingStore.getState();
      expect(state.selectedBarber).toEqual(mockBarber);
      expect(state.selectedBarbershop).toEqual(mockBarbershop); // Should remain
      expect(state.selectedService).toEqual(mockService); // Should remain
      expect(state.selectedDate).toBeNull(); // Should reset
      expect(state.selectedTimeSlot).toBeNull(); // Should reset
    });

    it('sets date and resets time slot', () => {
      const { setDate, setTimeSlot } = useBookingStore.getState();
      
      setTimeSlot(mockTimeSlot);
      setDate('2024-01-01');
      
      const state = useBookingStore.getState();
      expect(state.selectedDate).toBe('2024-01-01');
      expect(state.selectedTimeSlot).toBeNull();
    });

    it('sets time slot', () => {
      const { setTimeSlot } = useBookingStore.getState();
      
      setTimeSlot(mockTimeSlot);
      
      const state = useBookingStore.getState();
      expect(state.selectedTimeSlot).toEqual(mockTimeSlot);
    });

    it('allows setting barber to null', () => {
      const { setBarber } = useBookingStore.getState();
      
      setBarber(mockBarber);
      setBarber(null);
      
      const state = useBookingStore.getState();
      expect(state.selectedBarber).toBeNull();
    });
  });

  describe('guest info management', () => {
    it('updates guest info partially', () => {
      const { updateGuestInfo } = useBookingStore.getState();
      
      updateGuestInfo({ name: 'John Doe' });
      
      const state = useBookingStore.getState();
      expect(state.guestInfo.name).toBe('John Doe');
      expect(state.guestInfo.email).toBe(''); // Should remain unchanged
    });

    it('updates multiple guest info fields', () => {
      const { updateGuestInfo } = useBookingStore.getState();
      
      updateGuestInfo({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-0123',
        marketingOptIn: true,
      });
      
      const state = useBookingStore.getState();
      expect(state.guestInfo.name).toBe('John Doe');
      expect(state.guestInfo.email).toBe('john@example.com');
      expect(state.guestInfo.phone).toBe('555-0123');
      expect(state.guestInfo.marketingOptIn).toBe(true);
    });
  });

  describe('recurring booking', () => {
    const mockRecurring = {
      type: 'weekly' as const,
      interval: 1,
      occurrences: 4,
    };

    it('sets recurring booking', () => {
      const { setRecurringBooking } = useBookingStore.getState();
      
      setRecurringBooking(mockRecurring);
      
      const state = useBookingStore.getState();
      expect(state.recurringBooking).toEqual(mockRecurring);
    });

    it('clears recurring booking', () => {
      const { setRecurringBooking } = useBookingStore.getState();
      
      setRecurringBooking(mockRecurring);
      setRecurringBooking(null);
      
      const state = useBookingStore.getState();
      expect(state.recurringBooking).toBeNull();
    });
  });

  describe('API actions', () => {
    describe('searchBarbershops', () => {
      it('searches barbershops successfully', async () => {
        const mockResults = {
          barbershops: [{ id: 'barbershop-1', name: 'Test Barbershop' }],
          pagination: { page: 1, limit: 10, total: 1, pages: 1 },
        };

        (bookingApi.searchBarbershops as any).mockResolvedValue(mockResults);

        const { searchBarbershops } = useBookingStore.getState();
        
        await searchBarbershops('test query', 'test location');
        
        const state = useBookingStore.getState();
        expect(state.searchResults).toEqual(mockResults);
        expect(state.searchLoading).toBe(false);
        expect(bookingApi.searchBarbershops).toHaveBeenCalledWith('test query', 'test location', {});
      });

      it('handles search error', async () => {
        const error = new Error('Search failed');
        (bookingApi.searchBarbershops as any).mockRejectedValue(error);

        const { searchBarbershops } = useBookingStore.getState();
        
        await searchBarbershops();
        
        const state = useBookingStore.getState();
        expect(state.searchLoading).toBe(false);
        expect(state.searchResults).toBeNull();
      });

      it('sets loading state during search', async () => {
        let resolveSearch: (value: any) => void;
        const searchPromise = new Promise(resolve => {
          resolveSearch = resolve;
        });

        (bookingApi.searchBarbershops as any).mockReturnValue(searchPromise);

        const { searchBarbershops } = useBookingStore.getState();
        
        // Start search
        const searchCall = searchBarbershops();
        
        // Check loading state
        expect(useBookingStore.getState().searchLoading).toBe(true);
        
        // Resolve search
        resolveSearch!({ barbershops: [], pagination: {} });
        await searchCall;
        
        // Check final state
        expect(useBookingStore.getState().searchLoading).toBe(false);
      });
    });

    describe('loadAvailability', () => {
      it('loads availability successfully', async () => {
        const mockSlots = [
          { startTime: '09:00', endTime: '09:30', available: true },
          { startTime: '10:00', endTime: '10:30', available: true },
        ];

        (bookingApi.getAvailability as any).mockResolvedValue({
          availableSlots: mockSlots,
        });

        const { loadAvailability } = useBookingStore.getState();
        
        await loadAvailability('barbershop-1', 'service-1', '2024-01-01', 'barber-1');
        
        const state = useBookingStore.getState();
        expect(state.availableSlots).toEqual(mockSlots);
        expect(state.availabilityLoading).toBe(false);
      });

      it('handles availability error', async () => {
        const error = new Error('Availability failed');
        (bookingApi.getAvailability as any).mockRejectedValue(error);

        const { loadAvailability } = useBookingStore.getState();
        
        await loadAvailability('barbershop-1', 'service-1', '2024-01-01');
        
        const state = useBookingStore.getState();
        expect(state.availabilityLoading).toBe(false);
        expect(state.availableSlots).toEqual([]);
      });
    });

    describe('createBooking', () => {
      beforeEach(() => {
        // Set up complete booking state
        const { setBarbershop, setService, setBarber, setDate, setTimeSlot, updateGuestInfo } = useBookingStore.getState();
        
        setBarbershop({ id: 'barbershop-1', name: 'Test Barbershop' } as any);
        setService({ id: 'service-1', name: 'Haircut', price: 25.00 } as any);
        setBarber({ id: 'barber-1' } as any);
        setDate('2024-01-01');
        setTimeSlot({ startTime: '10:00', endTime: '10:30' } as any);
        updateGuestInfo({
          name: 'John Doe',
          email: 'john@example.com',
          phone: '555-0123',
        });
      });

      it('creates booking successfully', async () => {
        const mockResponse = {
          appointment: { id: 'appointment-1' },
        };

        (bookingApi.createGuestBooking as any).mockResolvedValue(mockResponse);

        const { createBooking } = useBookingStore.getState();
        
        const result = await createBooking();
        
        expect(result.success).toBe(true);
        expect(result.appointmentId).toBe('appointment-1');
        expect(useBookingStore.getState().isBooking).toBe(false);
      });

      it('handles missing required information', async () => {
        // Reset to incomplete state
        const { resetBookingFlow } = useBookingStore.getState();
        resetBookingFlow();

        const { createBooking } = useBookingStore.getState();
        
        const result = await createBooking();
        
        expect(result.success).toBe(false);
        expect(result.error).toBe('Missing required booking information');
      });

      it('handles booking error', async () => {
        const error = new Error('Booking failed');
        (bookingApi.createGuestBooking as any).mockRejectedValue(error);

        const { createBooking } = useBookingStore.getState();
        
        const result = await createBooking();
        
        expect(result.success).toBe(false);
        expect(result.error).toBe('Booking failed');
        expect(useBookingStore.getState().isBooking).toBe(false);
      });

      it('sets loading state during booking', async () => {
        let resolveBooking: (value: any) => void;
        const bookingPromise = new Promise(resolve => {
          resolveBooking = resolve;
        });

        (bookingApi.createGuestBooking as any).mockReturnValue(bookingPromise);

        const { createBooking } = useBookingStore.getState();
        
        // Start booking
        const bookingCall = createBooking();
        
        // Check loading state
        expect(useBookingStore.getState().isBooking).toBe(true);
        
        // Resolve booking
        resolveBooking!({ appointment: { id: 'appointment-1' } });
        await bookingCall;
        
        // Check final state
        expect(useBookingStore.getState().isBooking).toBe(false);
      });
    });

    describe('joinWaitlist', () => {
      it('joins waitlist successfully', async () => {
        const mockEntry = {
          id: 'waitlist-1',
          status: 'ACTIVE',
        };

        (bookingApi.joinWaitlist as any).mockResolvedValue(mockEntry);

        const { joinWaitlist } = useBookingStore.getState();
        
        await joinWaitlist({ someData: 'test' });
        
        const state = useBookingStore.getState();
        expect(state.waitlistEntries).toContain(mockEntry);
        expect(state.isLoading).toBe(false);
      });

      it('handles waitlist error', async () => {
        const error = new Error('Waitlist failed');
        (bookingApi.joinWaitlist as any).mockRejectedValue(error);

        const { joinWaitlist } = useBookingStore.getState();
        
        await expect(joinWaitlist({})).rejects.toThrow('Waitlist failed');
        expect(useBookingStore.getState().isLoading).toBe(false);
      });
    });
  });

  describe('filters', () => {
    it('updates filters', () => {
      const { updateFilters } = useBookingStore.getState();
      
      updateFilters({ location: 'New York', priceRange: [20, 50] });
      
      const state = useBookingStore.getState();
      expect(state.filters.location).toBe('New York');
      expect(state.filters.priceRange).toEqual([20, 50]);
    });

    it('merges filters', () => {
      const { updateFilters } = useBookingStore.getState();
      
      updateFilters({ location: 'New York' });
      updateFilters({ priceRange: [20, 50] });
      
      const state = useBookingStore.getState();
      expect(state.filters.location).toBe('New York');
      expect(state.filters.priceRange).toEqual([20, 50]);
    });

    it('clears filters', () => {
      const { updateFilters, clearFilters } = useBookingStore.getState();
      
      updateFilters({ location: 'New York', priceRange: [20, 50] });
      clearFilters();
      
      const state = useBookingStore.getState();
      expect(state.filters).toEqual({});
    });
  });

  describe('utility functions', () => {
    describe('canProceedToNextStep', () => {
      const { setBarbershop, setService, setBarber, setDate, setTimeSlot, updateGuestInfo, setCurrentStep } = useBookingStore.getState();

      it('validates step 1 - barbershop selection', () => {
        const { canProceedToNextStep } = useBookingStore.getState();
        
        expect(canProceedToNextStep()).toBe(false);
        
        setBarbershop({ id: 'barbershop-1' } as any);
        expect(canProceedToNextStep()).toBe(true);
      });

      it('validates step 2 - service selection', () => {
        const { canProceedToNextStep, setCurrentStep } = useBookingStore.getState();
        
        setCurrentStep(2);
        expect(canProceedToNextStep()).toBe(false);
        
        setService({ id: 'service-1' } as any);
        expect(canProceedToNextStep()).toBe(true);
      });

      it('validates step 3 - barber selection (optional)', () => {
        const { canProceedToNextStep, setCurrentStep } = useBookingStore.getState();
        
        setCurrentStep(3);
        expect(canProceedToNextStep()).toBe(true); // Should be true even without barber
      });

      it('validates step 4 - date and time selection', () => {
        const { canProceedToNextStep, setCurrentStep } = useBookingStore.getState();
        
        setCurrentStep(4);
        expect(canProceedToNextStep()).toBe(false);
        
        setDate('2024-01-01');
        expect(canProceedToNextStep()).toBe(false);
        
        setTimeSlot({ startTime: '10:00', endTime: '10:30' } as any);
        expect(canProceedToNextStep()).toBe(true);
      });

      it('validates step 5 - guest information', () => {
        const { canProceedToNextStep, setCurrentStep } = useBookingStore.getState();
        
        setCurrentStep(5);
        expect(canProceedToNextStep()).toBe(false);
        
        updateGuestInfo({ name: 'John Doe' });
        expect(canProceedToNextStep()).toBe(false);
        
        updateGuestInfo({ email: 'john@example.com' });
        expect(canProceedToNextStep()).toBe(false);
        
        updateGuestInfo({ phone: '555-0123' });
        expect(canProceedToNextStep()).toBe(true);
      });

      it('validates step 6 - confirmation', () => {
        const { canProceedToNextStep, setCurrentStep } = useBookingStore.getState();
        
        setCurrentStep(6);
        expect(canProceedToNextStep()).toBe(true);
      });
    });

    describe('getBookingSummary', () => {
      it('returns complete booking summary', () => {
        const { setBarbershop, setService, setBarber, setDate, setTimeSlot, updateGuestInfo, getBookingSummary } = useBookingStore.getState();
        
        const barbershop = { id: 'barbershop-1', name: 'Test Barbershop' };
        const service = { id: 'service-1', name: 'Haircut', price: 25.00 };
        const barber = { id: 'barber-1', name: 'John Barber' };
        const timeSlot = { startTime: '10:00', endTime: '10:30' };
        const guestInfo = { name: 'Jane Doe', email: 'jane@example.com', phone: '555-0123' };
        
        setBarbershop(barbershop as any);
        setService(service as any);
        setBarber(barber as any);
        setDate('2024-01-01');
        setTimeSlot(timeSlot as any);
        updateGuestInfo(guestInfo);
        
        const summary = getBookingSummary();
        
        expect(summary.barbershop).toEqual(barbershop);
        expect(summary.service).toEqual(service);
        expect(summary.barber).toEqual(barber);
        expect(summary.date).toBe('2024-01-01');
        expect(summary.timeSlot).toEqual(timeSlot);
        expect(summary.customer.name).toBe('Jane Doe');
        expect(summary.totalPrice).toBe(25.00);
      });

      it('handles missing service price', () => {
        const { setService, getBookingSummary } = useBookingStore.getState();
        
        setService({ id: 'service-1', name: 'Haircut' } as any); // No price
        
        const summary = getBookingSummary();
        expect(summary.totalPrice).toBe(0);
      });
    });

    describe('resetBookingFlow', () => {
      it('resets all booking state', () => {
        const { setBarbershop, setService, updateGuestInfo, setCurrentStep, resetBookingFlow } = useBookingStore.getState();
        
        // Set some state
        setBarbershop({ id: 'barbershop-1' } as any);
        setService({ id: 'service-1' } as any);
        updateGuestInfo({ name: 'John Doe' });
        setCurrentStep(3);
        
        resetBookingFlow();
        
        const state = useBookingStore.getState();
        expect(state.currentStep).toBe(1);
        expect(state.selectedBarbershop).toBeNull();
        expect(state.selectedService).toBeNull();
        expect(state.guestInfo.name).toBe('');
        expect(state.isLoading).toBe(false);
        expect(state.isBooking).toBe(false);
      });
    });
  });
});