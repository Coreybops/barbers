import request from 'supertest';
import express from 'express';
import cors from 'cors';
import { UserRole, AppointmentStatus } from '@prisma/client';
import authRoutes from '../../routes/auth';
import appointmentRoutes from '../../routes/appointments';
import barbershopRoutes from '../../routes/barbershops';
import barberRoutes from '../../routes/barbers';
import { authenticate } from '../../middleware/auth';
import { 
  prisma, 
  createTestUser, 
  createTestBarbershop, 
  createTestBarber, 
  createTestService 
} from '../../test/helpers/testHelpers';

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/appointments', authenticate, appointmentRoutes);
  app.use('/api/barbershops', barbershopRoutes);
  app.use('/api/barbers', authenticate, barberRoutes);
  return app;
};

describe('Booking Flow Integration Tests', () => {
  let app: express.Application;
  let customer: any;
  let shopOwner: any;
  let barber: any;
  let barbershop: any;
  let barberProfile: any;
  let service: any;
  let customerToken: string;
  let shopOwnerToken: string;
  let barberToken: string;

  beforeEach(async () => {
    app = createTestApp();

    // Create test users
    customer = await createTestUser({
      email: 'customer@booking.com',
      role: UserRole.CUSTOMER,
    });

    shopOwner = await createTestUser({
      email: 'owner@booking.com',
      role: UserRole.SHOP_OWNER,
    });

    barber = await createTestUser({
      email: 'barber@booking.com',
      role: UserRole.BARBER,
    });

    // Login to get tokens
    const customerLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: customer.email,
        password: 'password123', // Default from createTestUser
      });
    customerToken = customerLogin.body.token;

    const shopOwnerLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: shopOwner.email,
        password: 'password123',
      });
    shopOwnerToken = shopOwnerLogin.body.token;

    const barberLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: barber.email,
        password: 'password123',
      });
    barberToken = barberLogin.body.token;

    // Create barbershop and related entities
    barbershop = await createTestBarbershop(shopOwner.id);
    barberProfile = await createTestBarber(barber.id, barbershop.id);
    service = await createTestService(barbershop.id);
  });

  describe('Complete Booking Flow', () => {
    it('should complete end-to-end booking flow', async () => {
      // Step 1: Customer searches for barbershops
      const searchResponse = await request(app)
        .get('/api/barbershops')
        .query({ city: barbershop.city })
        .expect(200);

      expect(searchResponse.body.barbershops).toHaveLength(1);
      expect(searchResponse.body.barbershops[0].id).toBe(barbershop.id);

      // Step 2: Customer views barbershop details and services
      const barbershopResponse = await request(app)
        .get(`/api/barbershops/${barbershop.id}`)
        .expect(200);

      expect(barbershopResponse.body.id).toBe(barbershop.id);
      expect(barbershopResponse.body.services).toHaveLength(1);
      expect(barbershopResponse.body.barbers).toHaveLength(1);

      // Step 3: Customer creates appointment
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      
      const endTime = new Date(tomorrow);
      endTime.setMinutes(endTime.getMinutes() + 30);

      const appointmentData = {
        customerId: customer.id,
        barberId: barberProfile.id,
        serviceId: service.id,
        date: tomorrow.toISOString(),
        startTime: tomorrow.toISOString(),
        endTime: endTime.toISOString(),
        notes: 'Integration test booking',
      };

      const appointmentResponse = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(appointmentData)
        .expect(201);

      expect(appointmentResponse.body.id).toBeDefined();
      expect(appointmentResponse.body.status).toBe(AppointmentStatus.PENDING);
      expect(appointmentResponse.body.totalPrice).toBe(service.price);

      // Step 4: Customer views their appointments
      const customerAppointmentsResponse = await request(app)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(customerAppointmentsResponse.body.appointments).toHaveLength(1);
      expect(customerAppointmentsResponse.body.appointments[0].id).toBe(appointmentResponse.body.id);

      // Step 5: Barber views their appointments
      const barberAppointmentsResponse = await request(app)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${barberToken}`)
        .expect(200);

      expect(barberAppointmentsResponse.body.appointments).toHaveLength(1);
      expect(barberAppointmentsResponse.body.appointments[0].id).toBe(appointmentResponse.body.id);

      // Step 6: Barber confirms appointment
      const confirmResponse = await request(app)
        .put(`/api/appointments/${appointmentResponse.body.id}`)
        .set('Authorization', `Bearer ${barberToken}`)
        .send({ status: AppointmentStatus.CONFIRMED })
        .expect(200);

      expect(confirmResponse.body.status).toBe(AppointmentStatus.CONFIRMED);

      // Step 7: Shop owner views all appointments
      const ownerAppointmentsResponse = await request(app)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${shopOwnerToken}`)
        .expect(200);

      expect(ownerAppointmentsResponse.body.appointments).toHaveLength(1);
      expect(ownerAppointmentsResponse.body.appointments[0].status).toBe(AppointmentStatus.CONFIRMED);
    });

    it('should handle appointment conflicts correctly', async () => {
      const startTime = new Date();
      startTime.setDate(startTime.getDate() + 1);
      startTime.setHours(14, 0, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + 30);

      const appointmentData = {
        customerId: customer.id,
        barberId: barberProfile.id,
        serviceId: service.id,
        date: startTime.toISOString(),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        notes: 'First appointment',
      };

      // Create first appointment
      const firstAppointment = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(appointmentData)
        .expect(201);

      // Try to create conflicting appointment
      const conflictingStart = new Date(startTime);
      conflictingStart.setMinutes(conflictingStart.getMinutes() + 15);
      
      const conflictingEnd = new Date(conflictingStart);
      conflictingEnd.setMinutes(conflictingEnd.getMinutes() + 30);

      const conflictingData = {
        ...appointmentData,
        startTime: conflictingStart.toISOString(),
        endTime: conflictingEnd.toISOString(),
        notes: 'Conflicting appointment',
      };

      const conflictResponse = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(conflictingData)
        .expect(409);

      expect(conflictResponse.body).toHaveProperty('error', 'Time slot is already booked');
    });

    it('should allow appointment rescheduling', async () => {
      // Create initial appointment
      const startTime = new Date();
      startTime.setDate(startTime.getDate() + 1);
      startTime.setHours(11, 0, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + 30);

      const appointmentData = {
        customerId: customer.id,
        barberId: barberProfile.id,
        serviceId: service.id,
        date: startTime.toISOString(),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        notes: 'Original appointment',
      };

      const appointment = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(appointmentData)
        .expect(201);

      // Reschedule to different time
      const newStartTime = new Date(startTime);
      newStartTime.setHours(15, 0, 0, 0);
      
      const newEndTime = new Date(newStartTime);
      newEndTime.setMinutes(newEndTime.getMinutes() + 30);

      const rescheduleResponse = await request(app)
        .put(`/api/appointments/${appointment.body.id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          startTime: newStartTime.toISOString(),
          endTime: newEndTime.toISOString(),
        })
        .expect(200);

      expect(new Date(rescheduleResponse.body.startTime)).toEqual(newStartTime);
      expect(new Date(rescheduleResponse.body.endTime)).toEqual(newEndTime);
    });

    it('should handle appointment cancellation', async () => {
      // Create appointment
      const startTime = new Date();
      startTime.setDate(startTime.getDate() + 2);
      startTime.setHours(12, 0, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + 30);

      const appointmentData = {
        customerId: customer.id,
        barberId: barberProfile.id,
        serviceId: service.id,
        date: startTime.toISOString(),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        notes: 'To be cancelled',
      };

      const appointment = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(appointmentData)
        .expect(201);

      // Cancel appointment
      const cancelResponse = await request(app)
        .delete(`/api/appointments/${appointment.body.id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(cancelResponse.body.appointment.status).toBe(AppointmentStatus.CANCELLED);

      // Verify cancellation in customer's appointments
      const appointmentsResponse = await request(app)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      const cancelledAppointment = appointmentsResponse.body.appointments.find(
        (apt: any) => apt.id === appointment.body.id
      );
      expect(cancelledAppointment.status).toBe(AppointmentStatus.CANCELLED);
    });
  });

  describe('Multi-User Booking Scenarios', () => {
    it('should handle multiple customers booking with same barber', async () => {
      // Create second customer
      const customer2 = await createTestUser({
        email: 'customer2@booking.com',
        role: UserRole.CUSTOMER,
      });

      const customer2Login = await request(app)
        .post('/api/auth/login')
        .send({
          email: customer2.email,
          password: 'password123',
        });
      const customer2Token = customer2Login.body.token;

      // Both customers book appointments at different times
      const baseTime = new Date();
      baseTime.setDate(baseTime.getDate() + 1);
      baseTime.setHours(9, 0, 0, 0);

      const appointments = [];

      // Customer 1 books 9:00-9:30
      const apt1Data = {
        customerId: customer.id,
        barberId: barberProfile.id,
        serviceId: service.id,
        date: baseTime.toISOString(),
        startTime: baseTime.toISOString(),
        endTime: new Date(baseTime.getTime() + 30 * 60000).toISOString(),
        notes: 'Customer 1 appointment',
      };

      const apt1 = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(apt1Data)
        .expect(201);

      appointments.push(apt1.body);

      // Customer 2 books 9:30-10:00
      const apt2StartTime = new Date(baseTime.getTime() + 30 * 60000);
      const apt2Data = {
        customerId: customer2.id,
        barberId: barberProfile.id,
        serviceId: service.id,
        date: apt2StartTime.toISOString(),
        startTime: apt2StartTime.toISOString(),
        endTime: new Date(apt2StartTime.getTime() + 30 * 60000).toISOString(),
        notes: 'Customer 2 appointment',
      };

      const apt2 = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${customer2Token}`)
        .send(apt2Data)
        .expect(201);

      appointments.push(apt2.body);

      // Barber should see both appointments
      const barberAppointments = await request(app)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${barberToken}`)
        .expect(200);

      expect(barberAppointments.body.appointments).toHaveLength(2);
      
      const appointmentIds = barberAppointments.body.appointments.map((apt: any) => apt.id);
      expect(appointmentIds).toContain(apt1.body.id);
      expect(appointmentIds).toContain(apt2.body.id);
    });

    it('should handle bookings across multiple barbers', async () => {
      // Create second barber
      const barber2 = await createTestUser({
        email: 'barber2@booking.com',
        role: UserRole.BARBER,
      });

      const barber2Profile = await createTestBarber(barber2.id, barbershop.id);

      const barber2Login = await request(app)
        .post('/api/auth/login')
        .send({
          email: barber2.email,
          password: 'password123',
        });
      const barber2Token = barber2Login.body.token;

      // Create appointments with both barbers at same time
      const appointmentTime = new Date();
      appointmentTime.setDate(appointmentTime.getDate() + 1);
      appointmentTime.setHours(13, 0, 0, 0);

      const endTime = new Date(appointmentTime);
      endTime.setMinutes(endTime.getMinutes() + 30);

      // Appointment with barber 1
      const apt1Data = {
        customerId: customer.id,
        barberId: barberProfile.id,
        serviceId: service.id,
        date: appointmentTime.toISOString(),
        startTime: appointmentTime.toISOString(),
        endTime: endTime.toISOString(),
        notes: 'With barber 1',
      };

      const apt1 = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(apt1Data)
        .expect(201);

      // Appointment with barber 2 (same time should be allowed)
      const apt2Data = {
        ...apt1Data,
        barberId: barber2Profile.id,
        notes: 'With barber 2',
      };

      const apt2 = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(apt2Data)
        .expect(201);

      // Each barber should see only their appointment
      const barber1Appointments = await request(app)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${barberToken}`)
        .expect(200);

      const barber2Appointments = await request(app)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${barber2Token}`)
        .expect(200);

      expect(barber1Appointments.body.appointments).toHaveLength(1);
      expect(barber1Appointments.body.appointments[0].id).toBe(apt1.body.id);

      expect(barber2Appointments.body.appointments).toHaveLength(1);
      expect(barber2Appointments.body.appointments[0].id).toBe(apt2.body.id);

      // Shop owner should see both appointments
      const ownerAppointments = await request(app)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${shopOwnerToken}`)
        .expect(200);

      expect(ownerAppointments.body.appointments).toHaveLength(2);
    });
  });

  describe('Permission and Authorization Tests', () => {
    it('should enforce proper permissions for appointment operations', async () => {
      // Create appointment as customer
      const startTime = new Date();
      startTime.setDate(startTime.getDate() + 1);
      startTime.setHours(16, 0, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + 30);

      const appointmentData = {
        customerId: customer.id,
        barberId: barberProfile.id,
        serviceId: service.id,
        date: startTime.toISOString(),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        notes: 'Permission test',
      };

      const appointment = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(appointmentData)
        .expect(201);

      // Customer should be able to update their own appointment
      await request(app)
        .put(`/api/appointments/${appointment.body.id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ notes: 'Updated by customer' })
        .expect(200);

      // Barber should be able to update the appointment
      await request(app)
        .put(`/api/appointments/${appointment.body.id}`)
        .set('Authorization', `Bearer ${barberToken}`)
        .send({ status: AppointmentStatus.CONFIRMED })
        .expect(200);

      // Shop owner should be able to update the appointment
      await request(app)
        .put(`/api/appointments/${appointment.body.id}`)
        .set('Authorization', `Bearer ${shopOwnerToken}`)
        .send({ notes: 'Updated by owner' })
        .expect(200);

      // Create unauthorized user
      const unauthorizedUser = await createTestUser({
        email: 'unauthorized@booking.com',
        role: UserRole.CUSTOMER,
      });

      const unauthorizedLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: unauthorizedUser.email,
          password: 'password123',
        });
      const unauthorizedToken = unauthorizedLogin.body.token;

      // Unauthorized user should not be able to update
      await request(app)
        .put(`/api/appointments/${appointment.body.id}`)
        .set('Authorization', `Bearer ${unauthorizedToken}`)
        .send({ notes: 'Unauthorized update' })
        .expect(403);

      // Unauthorized user should not be able to cancel
      await request(app)
        .delete(`/api/appointments/${appointment.body.id}`)
        .set('Authorization', `Bearer ${unauthorizedToken}`)
        .expect(403);
    });

    it('should require authentication for all appointment operations', async () => {
      const appointmentData = {
        customerId: customer.id,
        barberId: barberProfile.id,
        serviceId: service.id,
        date: new Date().toISOString(),
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
      };

      // No token provided
      await request(app)
        .post('/api/appointments')
        .send(appointmentData)
        .expect(401);

      await request(app)
        .get('/api/appointments')
        .expect(401);

      // Invalid token
      await request(app)
        .post('/api/appointments')
        .set('Authorization', 'Bearer invalid-token')
        .send(appointmentData)
        .expect(401);

      await request(app)
        .get('/api/appointments')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});