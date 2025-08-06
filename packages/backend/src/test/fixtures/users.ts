import { UserRole } from '@prisma/client';

export const userFixtures = {
  customer: {
    email: 'customer@example.com',
    firstName: 'John',
    lastName: 'Customer',
    phone: '555-0101',
    role: UserRole.CUSTOMER,
  },
  barber: {
    email: 'barber@example.com',
    firstName: 'Jane',
    lastName: 'Barber',
    phone: '555-0102',
    role: UserRole.BARBER,
  },
  shopOwner: {
    email: 'owner@example.com',
    firstName: 'Bob',
    lastName: 'Owner',
    phone: '555-0103',
    role: UserRole.SHOP_OWNER,
  },
  admin: {
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    phone: '555-0104',
    role: UserRole.ADMIN,
  },
};

export const invalidUserData = [
  {
    // Missing email
    firstName: 'John',
    lastName: 'Doe',
    password: 'password123',
  },
  {
    // Invalid email format
    email: 'invalid-email',
    firstName: 'John',
    lastName: 'Doe',
    password: 'password123',
  },
  {
    // Password too short
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    password: '123',
  },
  {
    // Missing first name
    email: 'test@example.com',
    lastName: 'Doe',
    password: 'password123',
  },
];