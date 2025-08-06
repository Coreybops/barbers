import request from 'supertest';
import express from 'express';
import { UserRole, AppointmentStatus } from '@prisma/client';
import appointmentRoutes from '../../../routes/appointments';
import { 
  createTestUser, 
  createTestBarbershop, 
  createTestBarber, 
  createTestService, 
  createTestAppointment,
  prisma 
} from '../../../test/helpers/testHelpers';
import { appointmentFixtures } from '../../../test/fixtures/appointments';

// Create Express app for testing
const app = express();
app.use(express.json());

// Mock authentication middleware
const mockAuthMiddleware = (user: any) => (req: any, res: any, next: any) => {
  req.user = user;
  next();
};

describe('Appointments Controller', () => {
  let customer: any;
  let barber: any;
  let shopOwner: any;
  let barbershop: any;
  let barberProfile: any;
  let service: any;

  beforeEach(async () => {
    // Create test users
    customer = await createTestUser({
      email: 'customer@test.com',
      role: UserRole.CUSTOMER,
    });

    shopOwner = await createTestUser({
      email: 'owner@test.com',
      role: UserRole.SHOP_OWNER,
    });

    barber = await createTestUser({
      email: 'barber@test.com',
      role: UserRole.BARBER,
    });

    // Create barbershop
    barbershop = await createTestBarbershop(shopOwner.id);

    // Create barber profile
    barberProfile = await createTestBarber(barber.id, barbershop.id);

    // Create service
    service = await createTestService(barbershop.id);

    // Setup routes with auth middleware
    app.use('/api/appointments', mockAuthMiddleware(customer), appointmentRoutes);
  });

  describe('GET /api/appointments', () => {
    it('should return appointments for customer', async () => {
      // Create test appointment
      const appointment = await createTestAppointment(
        customer.id,
        barberProfile.id,
        service.id,
        barbershop.id
      );

      const response = await request(app)
        .get('/api/appointments')
        .expect(200);

      expect(response.body).toHaveProperty('appointments');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.appointments).toHaveLength(1);
      expect(response.body.appointments[0].id).toBe(appointment.id);
    });

    it('should filter appointments by date range', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      // Create appointments on different dates
      await createTestAppointment(
        customer.id,
        barberProfile.id,
        service.id,
        barbershop.id,
        { startTime: tomorrow, endTime: new Date(tomorrow.getTime() + 30 * 60000) }
      );

      await createTestAppointment(
        customer.id,
        barberProfile.id,
        service.id,
        barbershop.id,
        { startTime: nextWeek, endTime: new Date(nextWeek.getTime() + 30 * 60000) }
      );

      const response = await request(app)
        .get('/api/appointments')
        .query({
          start: tomorrow.toISOString(),
          end: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        })
        .expect(200);

      expect(response.body.appointments).toHaveLength(1);
    });

    it('should filter appointments by barber', async () => {
      // Create another barber
      const anotherBarber = await createTestUser({
        email: 'barber2@test.com',
        role: UserRole.BARBER,
      });
      const anotherBarberProfile = await createTestBarber(anotherBarber.id, barbershop.id);

      // Create appointments with different barbers
      await createTestAppointment(customer.id, barberProfile.id, service.id, barbershop.id);
      await createTestAppointment(customer.id, anotherBarberProfile.id, service.id, barbershop.id);

      const response = await request(app)
        .get('/api/appointments')
        .query({ barberId: barberProfile.id })
        .expect(200);

      expect(response.body.appointments).toHaveLength(1);
      expect(response.body.appointments[0].barberId).toBe(barberProfile.id);
    });

    it('should filter appointments by status', async () => {
      await createTestAppointment(
        customer.id,
        barberProfile.id,
        service.id,
        barbershop.id,
        { status: AppointmentStatus.PENDING }
      );

      await createTestAppointment(
        customer.id,
        barberProfile.id,
        service.id,
        barbershop.id,
        { status: AppointmentStatus.CONFIRMED }
      );

      const response = await request(app)
        .get('/api/appointments')
        .query({ status: 'PENDING' })
        .expect(200);

      expect(response.body.appointments).toHaveLength(1);
      expect(response.body.appointments[0].status).toBe(AppointmentStatus.PENDING);
    });

    it('should support pagination', async () => {
      // Create multiple appointments
      for (let i = 0; i < 5; i++) {
        await createTestAppointment(
          customer.id,
          barberProfile.id,
          service.id,
          barbershop.id
        );
      }

      const response = await request(app)
        .get('/api/appointments')
        .query({ page: '1', limit: '3' })
        .expect(200);

      expect(response.body.appointments).toHaveLength(3);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 3,
        total: 5,
        pages: 2,
      });
    });
  });

  describe('POST /api/appointments', () => {
    it('should create appointment successfully', async () => {
      const appointmentData = appointmentFixtures.validAppointment(
        customer.id,
        barberProfile.id,
        service.id
      );

      const response = await request(app)
        .post('/api/appointments')
        .send(appointmentData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.customerId).toBe(customer.id);
      expect(response.body.barberId).toBe(barberProfile.id);
      expect(response.body.serviceId).toBe(service.id);
      expect(response.body.status).toBe(AppointmentStatus.PENDING);
    });

    it('should return 409 for conflicting appointments', async () => {
      const appointmentData = appointmentFixtures.validAppointment(
        customer.id,
        barberProfile.id,
        service.id
      );

      // Create first appointment
      await request(app)
        .post('/api/appointments')
        .send(appointmentData)
        .expect(201);

      // Try to create conflicting appointment
      const conflictingData = appointmentFixtures.conflictingAppointment(
        customer.id,
        barberProfile.id,
        service.id
      );

      const response = await request(app)
        .post('/api/appointments')
        .send(conflictingData)
        .expect(409);

      expect(response.body).toHaveProperty('error', 'Time slot is already booked');
    });

    it('should return 404 for non-existent service', async () => {
      const appointmentData = appointmentFixtures.validAppointment(
        customer.id,
        barberProfile.id,
        'non-existent-service-id'
      );

      const response = await request(app)
        .post('/api/appointments')
        .send(appointmentData)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Service not found');
    });

    it('should return 404 for non-existent barber', async () => {
      const appointmentData = appointmentFixtures.validAppointment(
        customer.id,
        'non-existent-barber-id',
        service.id
      );

      const response = await request(app)
        .post('/api/appointments')
        .send(appointmentData)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Barber not found');
    });

    it('should set correct price from service', async () => {
      const appointmentData = appointmentFixtures.validAppointment(
        customer.id,
        barberProfile.id,
        service.id
      );

      const response = await request(app)
        .post('/api/appointments')
        .send(appointmentData)
        .expect(201);

      expect(response.body.totalPrice).toBe(service.price);
    });
  });

  describe('PUT /api/appointments/:id', () => {
    let appointment: any;

    beforeEach(async () => {
      appointment = await createTestAppointment(
        customer.id,
        barberProfile.id,
        service.id,
        barbershop.id
      );
    });

    it('should update appointment successfully', async () => {
      const updateData = {
        notes: 'Updated notes',
        status: AppointmentStatus.CONFIRMED,
      };

      const response = await request(app)
        .put(`/api/appointments/${appointment.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.notes).toBe(updateData.notes);
      expect(response.body.status).toBe(updateData.status);
    });

    it('should return 404 for non-existent appointment', async () => {
      const response = await request(app)
        .put('/api/appointments/non-existent-id')
        .send({ notes: 'Updated' })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Appointment not found');
    });

    it('should return 403 for unauthorized user', async () => {
      // Create appointment for different customer
      const otherCustomer = await createTestUser({
        email: 'other@test.com',
        role: UserRole.CUSTOMER,
      });

      const otherAppointment = await createTestAppointment(
        otherCustomer.id,
        barberProfile.id,
        service.id,
        barbershop.id
      );

      const response = await request(app)
        .put(`/api/appointments/${otherAppointment.id}`)
        .send({ notes: 'Unauthorized update' })
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Not authorized');
    });

    it('should update price when service changes', async () => {
      const newService = await createTestService(barbershop.id, {
        name: 'Premium Service',
        price: 50.00,
      });

      const response = await request(app)
        .put(`/api/appointments/${appointment.id}`)
        .send({ serviceId: newService.id })
        .expect(200);

      expect(response.body.serviceId).toBe(newService.id);
      expect(response.body.totalPrice).toBe(newService.price);
    });
  });

  describe('PATCH /api/appointments/:id/move', () => {
    let appointment: any;

    beforeEach(async () => {
      appointment = await createTestAppointment(
        customer.id,
        barberProfile.id,
        service.id,
        barbershop.id
      );
    });

    it('should move appointment to new time', async () => {
      const newStartTime = new Date();
      newStartTime.setDate(newStartTime.getDate() + 2);
      newStartTime.setHours(14, 0, 0, 0);
      
      const newEndTime = new Date(newStartTime);
      newEndTime.setMinutes(newEndTime.getMinutes() + 30);

      const response = await request(app)
        .patch(`/api/appointments/${appointment.id}/move`)
        .send({
          startTime: newStartTime.toISOString(),
          endTime: newEndTime.toISOString(),
        })
        .expect(200);

      expect(new Date(response.body.startTime)).toEqual(newStartTime);
      expect(new Date(response.body.endTime)).toEqual(newEndTime);
    });

    it('should return 409 for conflicting time slot', async () => {
      // Create another appointment
      const conflictingAppointment = await createTestAppointment(
        customer.id,
        barberProfile.id,
        service.id,
        barbershop.id
      );

      // Try to move first appointment to conflict with second
      const response = await request(app)
        .patch(`/api/appointments/${appointment.id}/move`)
        .send({
          startTime: conflictingAppointment.startTime.toISOString(),
          endTime: conflictingAppointment.endTime.toISOString(),
        })
        .expect(409);

      expect(response.body).toHaveProperty('error', 'Time slot is already booked');
    });
  });

  describe('DELETE /api/appointments/:id', () => {
    let appointment: any;

    beforeEach(async () => {
      appointment = await createTestAppointment(
        customer.id,
        barberProfile.id,
        service.id,
        barbershop.id
      );
    });

    it('should cancel appointment successfully', async () => {
      const response = await request(app)
        .delete(`/api/appointments/${appointment.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Appointment cancelled successfully');
      expect(response.body.appointment.status).toBe(AppointmentStatus.CANCELLED);

      // Verify in database
      const cancelledAppointment = await prisma.appointment.findUnique({
        where: { id: appointment.id }
      });
      expect(cancelledAppointment!.status).toBe(AppointmentStatus.CANCELLED);
    });

    it('should return 404 for non-existent appointment', async () => {
      const response = await request(app)
        .delete('/api/appointments/non-existent-id')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Appointment not found');
    });

    it('should return 403 for unauthorized user', async () => {
      const otherCustomer = await createTestUser({
        email: 'other2@test.com',
        role: UserRole.CUSTOMER,
      });

      const otherAppointment = await createTestAppointment(
        otherCustomer.id,
        barberProfile.id,
        service.id,
        barbershop.id
      );

      const response = await request(app)
        .delete(`/api/appointments/${otherAppointment.id}`)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Not authorized');
    });
  });

  describe('GET /api/appointments/conflicts', () => {
    let existingAppointment: any;

    beforeEach(async () => {
      existingAppointment = await createTestAppointment(
        customer.id,
        barberProfile.id,
        service.id,
        barbershop.id
      );
    });

    it('should detect conflicts', async () => {
      const conflictStart = new Date(existingAppointment.startTime);
      conflictStart.setMinutes(conflictStart.getMinutes() + 15);
      
      const conflictEnd = new Date(conflictStart);
      conflictEnd.setMinutes(conflictEnd.getMinutes() + 30);

      const response = await request(app)
        .get('/api/appointments/conflicts')
        .query({
          barberId: barberProfile.id,
          start: conflictStart.toISOString(),
          end: conflictEnd.toISOString(),
        })
        .expect(200);

      expect(response.body.hasConflict).toBe(true);
      expect(response.body.conflicts).toHaveLength(1);
    });

    it('should not detect conflicts for non-overlapping times', async () => {
      const nonConflictStart = new Date(existingAppointment.endTime);
      nonConflictStart.setMinutes(nonConflictStart.getMinutes() + 10);
      
      const nonConflictEnd = new Date(nonConflictStart);
      nonConflictEnd.setMinutes(nonConflictEnd.getMinutes() + 30);

      const response = await request(app)
        .get('/api/appointments/conflicts')
        .query({
          barberId: barberProfile.id,
          start: nonConflictStart.toISOString(),
          end: nonConflictEnd.toISOString(),
        })
        .expect(200);

      expect(response.body.hasConflict).toBe(false);
      expect(response.body.conflicts).toHaveLength(0);
    });

    it('should exclude specific appointment from conflict check', async () => {
      const response = await request(app)
        .get('/api/appointments/conflicts')
        .query({
          barberId: barberProfile.id,
          start: existingAppointment.startTime.toISOString(),
          end: existingAppointment.endTime.toISOString(),
          exclude: existingAppointment.id,
        })
        .expect(200);

      expect(response.body.hasConflict).toBe(false);
    });

    it('should return 400 for missing required parameters', async () => {
      const response = await request(app)
        .get('/api/appointments/conflicts')
        .query({
          barberId: barberProfile.id,
          // Missing start and end
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'barberId, start, and end are required');
    });
  });
});