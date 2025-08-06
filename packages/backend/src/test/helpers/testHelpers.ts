import request from 'supertest';
import express from 'express';
import { PrismaClient, User, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateToken } from '../../utils/jwt';

const prisma = new PrismaClient();

// Test user factory
export const createTestUser = async (overrides: Partial<User> = {}) => {
  const defaultUser = {
    email: `test-${Date.now()}@example.com`,
    password: await bcrypt.hash('password123', 12),
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.CUSTOMER,
    ...overrides,
  };

  return prisma.user.create({
    data: defaultUser,
  });
};

// Test barbershop factory
export const createTestBarbershop = async (ownerId: string, overrides: any = {}) => {
  const defaultBarbershop = {
    name: `Test Barbershop ${Date.now()}`,
    description: 'A test barbershop',
    address: '123 Test St',
    city: 'Test City',
    state: 'TS',
    zipCode: '12345',
    phone: '555-0123',
    ownerId,
    ...overrides,
  };

  return prisma.barbershop.create({
    data: defaultBarbershop,
  });
};

// Test barber factory
export const createTestBarber = async (userId: string, barbershopId: string, overrides: any = {}) => {
  const defaultBarber = {
    userId,
    barbershopId,
    bio: 'Test barber bio',
    specialties: ['haircut', 'beard'],
    experience: 5,
    ...overrides,
  };

  return prisma.barber.create({
    data: defaultBarber,
  });
};

// Test service factory
export const createTestService = async (barbershopId: string, overrides: any = {}) => {
  const defaultService = {
    name: `Test Service ${Date.now()}`,
    description: 'A test service',
    duration: 30,
    price: 25.00,
    barbershopId,
    ...overrides,
  };

  return prisma.service.create({
    data: defaultService,
  });
};

// Test appointment factory
export const createTestAppointment = async (
  customerId: string,
  barberId: string,
  serviceId: string,
  barbershopId: string,
  overrides: any = {}
) => {
  const startTime = new Date();
  startTime.setHours(startTime.getHours() + 1);
  const endTime = new Date(startTime);
  endTime.setMinutes(endTime.getMinutes() + 30);

  const defaultAppointment = {
    customerId,
    barberId,
    serviceId,
    barbershopId,
    date: startTime,
    startTime,
    endTime,
    totalPrice: 25.00,
    ...overrides,
  };

  return prisma.appointment.create({
    data: defaultAppointment,
  });
};

// Auth token helper
export const generateTestToken = (user: User) => {
  return generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });
};

// API testing helper
export const makeAuthenticatedRequest = (app: express.Application, token: string) => {
  return request(app).set('Authorization', `Bearer ${token}`);
};

// Mock data generators
export const mockUserData = (overrides: any = {}) => ({
  email: `user-${Date.now()}@example.com`,
  password: 'password123',
  firstName: 'John',
  lastName: 'Doe',
  phone: '555-0123',
  role: UserRole.CUSTOMER,
  ...overrides,
});

export const mockBarbershopData = (overrides: any = {}) => ({
  name: `Test Barbershop ${Date.now()}`,
  description: 'A great barbershop',
  address: '123 Main St',
  city: 'Anytown',
  state: 'CA',
  zipCode: '12345',
  phone: '555-0123',
  email: 'shop@example.com',
  ...overrides,
});

export const mockAppointmentData = (overrides: any = {}) => {
  const startTime = new Date();
  startTime.setDate(startTime.getDate() + 1);
  startTime.setHours(10, 0, 0, 0);
  
  const endTime = new Date(startTime);
  endTime.setMinutes(endTime.getMinutes() + 30);

  return {
    date: startTime.toISOString(),
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    notes: 'Test appointment',
    ...overrides,
  };
};

// Database cleanup helper
export const cleanupDatabase = async () => {
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== '_prisma_migrations')
    .map((name) => `"public"."${name}"`)
    .join(', ');

  if (tables) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
  }
};

export { prisma };