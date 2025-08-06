import request from 'supertest';
import express from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient, UserRole } from '@prisma/client';
import { register, login, refreshToken, getProfile, updateProfile } from '../../../controllers/authController';
import { createTestUser, generateTestToken, prisma } from '../../../test/helpers/testHelpers';
import { userFixtures } from '../../../test/fixtures/users';

// Create a minimal Express app for testing
const app = express();
app.use(express.json());

// Mock middleware for authenticated routes
const mockAuth = (req: any, res: any, next: any) => {
  req.user = { id: 'test-user-id', role: UserRole.CUSTOMER };
  next();
};

// Setup routes
app.post('/register', register);
app.post('/login', login);
app.post('/refresh', refreshToken);
app.get('/profile', mockAuth, getProfile);
app.put('/profile', mockAuth, updateProfile);

describe('AuthController', () => {
  describe('POST /register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        phone: '555-0199',
      };

      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'User created successfully');
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.firstName).toBe(userData.firstName);
      expect(response.body.user).not.toHaveProperty('password');

      // Verify user was created in database
      const user = await prisma.user.findUnique({
        where: { email: userData.email }
      });
      expect(user).not.toBeNull();
      expect(user!.email).toBe(userData.email);
    });

    it('should return 400 if user already exists', async () => {
      // Create a user first
      const existingUser = await createTestUser({
        email: 'existing@example.com',
      });

      const userData = {
        email: existingUser.email,
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      };

      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'User already exists with this email');
    });

    it('should hash the password before storing', async () => {
      const userData = {
        email: 'passwordtest@example.com',
        password: 'plaintext123',
        firstName: 'Test',
        lastName: 'User',
      };

      await request(app)
        .post('/register')
        .send(userData)
        .expect(201);

      const user = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      expect(user!.password).not.toBe(userData.password);
      expect(user!.password.length).toBeGreaterThan(50); // bcrypt hash length
      
      // Verify password can be verified
      const isValid = await bcrypt.compare(userData.password, user!.password);
      expect(isValid).toBe(true);
    });

    it('should set default role to CUSTOMER', async () => {
      const userData = {
        email: 'defaultrole@example.com',
        password: 'password123',
        firstName: 'Default',
        lastName: 'User',
      };

      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(201);

      expect(response.body.user.role).toBe(UserRole.CUSTOMER);
    });

    it('should allow custom role when specified', async () => {
      const userData = {
        email: 'customrole@example.com',
        password: 'password123',
        firstName: 'Custom',
        lastName: 'User',
        role: UserRole.BARBER,
      };

      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(201);

      expect(response.body.user.role).toBe(UserRole.BARBER);
    });
  });

  describe('POST /login', () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = await createTestUser({
        email: 'login@example.com',
        password: await bcrypt.hash('password123', 12),
      });
    });

    it('should login user with valid credentials', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: 'login@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should return 401 for invalid email', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    it('should return 401 for invalid password', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    it('should return 401 for inactive user', async () => {
      // Create inactive user
      const inactiveUser = await createTestUser({
        email: 'inactive@example.com',
        password: await bcrypt.hash('password123', 12),
        isActive: false,
      });

      const response = await request(app)
        .post('/login')
        .send({
          email: 'inactive@example.com',
          password: 'password123',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Account is deactivated');
    });

    it('should include user profile information in response', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: 'login@example.com',
          password: 'password123',
        })
        .expect(200);

      const { user } = response.body;
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('firstName');
      expect(user).toHaveProperty('lastName');
      expect(user).toHaveProperty('role');
      expect(user).toHaveProperty('emailVerified');
      expect(user).toHaveProperty('createdAt');
      expect(user).not.toHaveProperty('password');
    });
  });

  describe('POST /refresh', () => {
    it('should handle refresh token functionality', async () => {
      // This test would require proper JWT implementation
      // For now, we'll test the basic structure
      const response = await request(app)
        .post('/refresh')
        .send({
          refreshToken: 'invalid-token',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid refresh token');
    });
  });

  describe('GET /profile', () => {
    it('should return user profile for authenticated user', async () => {
      // Mock user in database for the test
      const testUser = await createTestUser({
        id: 'test-user-id',
        email: 'profile@example.com',
      });

      const response = await request(app)
        .get('/profile')
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should return 404 if user not found', async () => {
      // Don't create user in database
      const response = await request(app)
        .get('/profile')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'User not found');
    });
  });

  describe('PUT /profile', () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = await createTestUser({
        id: 'test-user-id',
        email: 'updateprofile@example.com',
        firstName: 'Original',
        lastName: 'Name',
      });
    });

    it('should update user profile successfully', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        phone: '555-0123',
      };

      const response = await request(app)
        .put('/profile')
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Profile updated successfully');
      expect(response.body.user.firstName).toBe(updateData.firstName);
      expect(response.body.user.phone).toBe(updateData.phone);

      // Verify update in database
      const updatedUser = await prisma.user.findUnique({
        where: { id: testUser.id }
      });
      expect(updatedUser!.firstName).toBe(updateData.firstName);
      expect(updatedUser!.phone).toBe(updateData.phone);
    });

    it('should update only provided fields', async () => {
      const updateData = {
        firstName: 'OnlyFirstName',
      };

      const response = await request(app)
        .put('/profile')
        .send(updateData)
        .expect(200);

      expect(response.body.user.firstName).toBe(updateData.firstName);
      expect(response.body.user.lastName).toBe(testUser.lastName); // Should remain unchanged
    });

    it('should not update email or role', async () => {
      const updateData = {
        email: 'newemail@example.com', // This should not be updated
        role: UserRole.ADMIN, // This should not be updated
        firstName: 'Updated',
      };

      const response = await request(app)
        .put('/profile')
        .send(updateData)
        .expect(200);

      expect(response.body.user.email).toBe(testUser.email); // Should remain unchanged
      expect(response.body.user.role).toBe(testUser.role); // Should remain unchanged
      expect(response.body.user.firstName).toBe(updateData.firstName);
    });
  });
});