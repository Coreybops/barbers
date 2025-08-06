import { AppointmentStatus, PaymentStatus } from '@prisma/client';

export const appointmentFixtures = {
  validAppointment: (customerId: string, barberId: string, serviceId: string) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    
    const endTime = new Date(tomorrow);
    endTime.setMinutes(endTime.getMinutes() + 30);

    return {
      customerId,
      barberId,
      serviceId,
      date: tomorrow.toISOString(),
      startTime: tomorrow.toISOString(),
      endTime: endTime.toISOString(),
      notes: 'Regular haircut appointment',
    };
  },
  
  conflictingAppointment: (customerId: string, barberId: string, serviceId: string) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 15, 0, 0); // Overlaps with validAppointment
    
    const endTime = new Date(tomorrow);
    endTime.setMinutes(endTime.getMinutes() + 30);

    return {
      customerId,
      barberId,
      serviceId,
      date: tomorrow.toISOString(),
      startTime: tomorrow.toISOString(),
      endTime: endTime.toISOString(),
      notes: 'Conflicting appointment',
    };
  },

  recurringAppointment: (customerId: string, barberId: string, serviceId: string) => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(14, 0, 0, 0);
    
    const endTime = new Date(nextWeek);
    endTime.setMinutes(endTime.getMinutes() + 45);

    return {
      customerId,
      barberId,
      serviceId,
      date: nextWeek.toISOString(),
      startTime: nextWeek.toISOString(),
      endTime: endTime.toISOString(),
      notes: 'Weekly recurring appointment',
      recurring: {
        type: 'weekly' as const,
        interval: 1,
        occurrences: 4,
      },
    };
  },

  pastAppointment: (customerId: string, barberId: string, serviceId: string) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(15, 0, 0, 0);
    
    const endTime = new Date(yesterday);
    endTime.setMinutes(endTime.getMinutes() + 60);

    return {
      customerId,
      barberId,
      serviceId,
      date: yesterday,
      startTime: yesterday,
      endTime: endTime,
      status: AppointmentStatus.COMPLETED,
      paymentStatus: PaymentStatus.COMPLETED,
      totalPrice: 35.00,
      notes: 'Completed appointment',
    };
  },

  guestAppointment: (barberId: string, serviceId: string) => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(11, 0, 0, 0);
    
    const endTime = new Date(nextWeek);
    endTime.setMinutes(endTime.getMinutes() + 30);

    return {
      barberId,
      serviceId,
      date: nextWeek.toISOString(),
      startTime: nextWeek.toISOString(),
      endTime: endTime.toISOString(),
      isGuestBooking: true,
      guestName: 'John Guest',
      guestEmail: 'guest@example.com',
      guestPhone: '555-0199',
      notes: 'Guest booking appointment',
    };
  },

  invalidAppointmentData: [
    {
      // Missing barberId
      customerId: 'customer-id',
      serviceId: 'service-id',
      date: new Date().toISOString(),
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
    },
    {
      // Past date
      customerId: 'customer-id',
      barberId: 'barber-id',
      serviceId: 'service-id',
      date: '2020-01-01T10:00:00.000Z',
      startTime: '2020-01-01T10:00:00.000Z',
      endTime: '2020-01-01T10:30:00.000Z',
    },
    {
      // End time before start time
      customerId: 'customer-id',
      barberId: 'barber-id',
      serviceId: 'service-id',
      date: new Date().toISOString(),
      startTime: '2024-12-25T11:00:00.000Z',
      endTime: '2024-12-25T10:30:00.000Z',
    },
  ],
};