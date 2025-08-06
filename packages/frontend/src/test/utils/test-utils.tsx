import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Create a test query client
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

// Mock user data for testing
export const mockUserData = {
  id: 'test-user-1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  phone: '555-0123',
  role: 'CUSTOMER' as const,
  avatar: null,
  emailVerified: true,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Mock barbershop data
export const mockBarbershopData = {
  id: 'test-barbershop-1',
  name: 'Test Barbershop',
  description: 'A test barbershop',
  address: '123 Test St',
  city: 'Test City',
  state: 'TS',
  zipCode: '12345',
  phone: '555-0123',
  email: 'test@barbershop.com',
  images: [],
  rating: 4.5,
  reviewCount: 100,
  isActive: true,
  barbers: [],
  services: [],
};

// Mock appointment data
export const mockAppointmentData = {
  id: 'test-appointment-1',
  customerId: 'test-user-1',
  barberId: 'test-barber-1',
  serviceId: 'test-service-1',
  barbershopId: 'test-barbershop-1',
  date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
  status: 'PENDING' as const,
  notes: 'Test appointment',
  totalPrice: 25.00,
  paymentStatus: 'PENDING' as const,
  isGuestBooking: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Helper to mock localStorage
export const mockLocalStorage = () => {
  const storage: { [key: string]: string } = {};
  
  return {
    getItem: (key: string) => storage[key] || null,
    setItem: (key: string, value: string) => {
      storage[key] = value;
    },
    removeItem: (key: string) => {
      delete storage[key];
    },
    clear: () => {
      Object.keys(storage).forEach(key => delete storage[key]);
    },
  };
};

// Helper to wait for async operations
export const waitFor = (fn: () => void, timeout = 1000) =>
  new Promise<void>((resolve, reject) => {
    const startTime = Date.now();
    const check = () => {
      try {
        fn();
        resolve();
      } catch (error) {
        if (Date.now() - startTime >= timeout) {
          reject(error);
        } else {
          setTimeout(check, 50);
        }
      }
    };
    check();
  });

// Helper for creating form events
export const createFormEvent = (data: Record<string, any>) => ({
  preventDefault: vi.fn(),
  target: {
    elements: Object.entries(data).reduce((acc, [key, value]) => ({
      ...acc,
      [key]: { value },
    }), {}),
  },
});

// Helper for mocking form submission
export const mockFormSubmit = (onSubmit: (data: any) => void, data: any) => {
  const handleSubmit = (e: any) => {
    e.preventDefault();
    onSubmit(data);
  };
  return handleSubmit;
};

// Helper to create mock router props
export const createMockRouterProps = (overrides = {}) => ({
  navigate: vi.fn(),
  location: {
    pathname: '/',
    search: '',
    hash: '',
    state: null,
    key: 'default',
  },
  params: {},
  ...overrides,
});

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render };