import { rest } from 'msw';
import { UserRole, AppointmentStatus, PaymentStatus } from '@/types';

const BASE_URL = 'http://localhost:5000/api';

// Mock data
const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  phone: '555-0123',
  role: UserRole.CUSTOMER,
  avatar: null,
  emailVerified: true,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockBarber = {
  id: 'barber-1',
  userId: 'user-2',
  barbershopId: 'barbershop-1',
  bio: 'Experienced barber',
  specialties: ['haircut', 'beard'],
  experience: 5,
  rating: 4.8,
  reviewCount: 150,
  isAvailable: true,
  user: {
    id: 'user-2',
    firstName: 'John',
    lastName: 'Barber',
    avatar: null,
  },
};

const mockBarbershop = {
  id: 'barbershop-1',
  name: 'The Great Barbershop',
  description: 'A premium barbershop experience',
  address: '123 Main Street',
  city: 'San Francisco',
  state: 'CA',
  zipCode: '94101',
  phone: '415-555-0123',
  email: 'info@greatbarbershop.com',
  images: [],
  rating: 4.7,
  reviewCount: 200,
  isActive: true,
  barbers: [mockBarber],
  services: [
    {
      id: 'service-1',
      name: 'Haircut',
      description: 'Professional haircut',
      duration: 30,
      price: 25.00,
      category: 'Hair',
      isActive: true,
    },
    {
      id: 'service-2',
      name: 'Beard Trim',
      description: 'Professional beard trimming',
      duration: 15,
      price: 15.00,
      category: 'Beard',
      isActive: true,
    },
  ],
};

const mockAppointment = {
  id: 'appointment-1',
  customerId: 'user-1',
  barberId: 'barber-1',
  serviceId: 'service-1',
  barbershopId: 'barbershop-1',
  date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
  status: AppointmentStatus.PENDING,
  notes: 'Test appointment',
  totalPrice: 25.00,
  paymentStatus: PaymentStatus.PENDING,
  isGuestBooking: false,
  customer: mockUser,
  barber: mockBarber,
  service: mockBarbershop.services[0],
  barbershop: mockBarbershop,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const handlers = [
  // Auth endpoints
  rest.post(`${BASE_URL}/auth/register`, (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        message: 'User created successfully',
        user: mockUser,
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
      })
    );
  }),

  rest.post(`${BASE_URL}/auth/login`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        message: 'Login successful',
        user: mockUser,
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
      })
    );
  }),

  rest.post(`${BASE_URL}/auth/refresh`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        token: 'new-mock-jwt-token',
        refreshToken: 'new-mock-refresh-token',
      })
    );
  }),

  rest.get(`${BASE_URL}/auth/profile`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        user: mockUser,
      })
    );
  }),

  rest.put(`${BASE_URL}/auth/profile`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        message: 'Profile updated successfully',
        user: { ...mockUser, ...req.body },
      })
    );
  }),

  // Barbershops endpoints
  rest.get(`${BASE_URL}/barbershops`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        barbershops: [mockBarbershop],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          pages: 1,
        },
      })
    );
  }),

  rest.get(`${BASE_URL}/barbershops/:id`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(mockBarbershop)
    );
  }),

  // Appointments endpoints
  rest.get(`${BASE_URL}/appointments`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        appointments: [mockAppointment],
        pagination: {
          page: 1,
          limit: 50,
          total: 1,
          pages: 1,
        },
      })
    );
  }),

  rest.post(`${BASE_URL}/appointments`, (req, res, ctx) => {
    const newAppointment = {
      ...mockAppointment,
      id: 'new-appointment-' + Date.now(),
      ...req.body,
    };
    
    return res(
      ctx.status(201),
      ctx.json(newAppointment)
    );
  }),

  rest.put(`${BASE_URL}/appointments/:id`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        ...mockAppointment,
        ...req.body,
        updatedAt: new Date().toISOString(),
      })
    );
  }),

  rest.delete(`${BASE_URL}/appointments/:id`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        message: 'Appointment cancelled successfully',
        appointment: {
          ...mockAppointment,
          status: AppointmentStatus.CANCELLED,
        },
      })
    );
  }),

  rest.get(`${BASE_URL}/appointments/conflicts`, (req, res, ctx) => {
    const url = new URL(req.url);
    const barberId = url.searchParams.get('barberId');
    const start = url.searchParams.get('start');
    const end = url.searchParams.get('end');

    // Simple conflict detection logic for testing
    const hasConflict = barberId === 'barber-1' && start && end;
    
    return res(
      ctx.status(200),
      ctx.json({
        hasConflict,
        conflicts: hasConflict ? [mockAppointment] : [],
      })
    );
  }),

  // Barbers endpoints
  rest.get(`${BASE_URL}/barbers`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        barbers: [mockBarber],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          pages: 1,
        },
      })
    );
  }),

  // Calendar endpoints
  rest.get(`${BASE_URL}/calendar/availability`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        availability: [
          {
            date: new Date().toISOString().split('T')[0],
            slots: [
              { time: '09:00', available: true },
              { time: '09:30', available: true },
              { time: '10:00', available: false },
              { time: '10:30', available: true },
            ],
          },
        ],
      })
    );
  }),

  // Error handlers for testing error scenarios
  rest.post(`${BASE_URL}/auth/login-error`, (req, res, ctx) => {
    return res(
      ctx.status(401),
      ctx.json({
        error: 'Invalid credentials',
      })
    );
  }),

  rest.post(`${BASE_URL}/appointments-error`, (req, res, ctx) => {
    return res(
      ctx.status(409),
      ctx.json({
        error: 'Time slot is already booked',
      })
    );
  }),

  rest.get(`${BASE_URL}/barbershops/not-found`, (req, res, ctx) => {
    return res(
      ctx.status(404),
      ctx.json({
        error: 'Barbershop not found',
      })
    );
  }),
];

// Export mock data for use in tests
export { mockUser, mockBarber, mockBarbershop, mockAppointment };