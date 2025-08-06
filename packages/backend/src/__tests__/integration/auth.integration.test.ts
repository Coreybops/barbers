import request from 'supertest';
import express from 'express';
import cors from 'cors';
import { UserRole } from '@prisma/client';
import authRoutes from '../../routes/auth';
import { prisma, createTestUser } from '../../test/helpers/testHelpers';
import bcrypt from 'bcryptjs';

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  return app;
};

describe('Authentication Integration Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('User Registration Flow', () => {
    it('should complete full registration flow', async () => {
      const userData = {
        email: 'integration@example.com',
        password: 'securePassword123',
        firstName: 'Integration',
        lastName: 'Test',
        phone: '555-0123',
        role: UserRole.CUSTOMER,
      };

      // Register user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body).toMatchObject({
        message: 'User created successfully',
        user: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
        },
      });

      expect(registerResponse.body).toHaveProperty('token');
      expect(registerResponse.body).toHaveProperty('refreshToken');

      // Verify user exists in database
      const dbUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      expect(dbUser).not.toBeNull();
      expect(dbUser!.email).toBe(userData.email);
      expect(dbUser!.firstName).toBe(userData.firstName);
      expect(dbUser!.role).toBe(userData.role);
      
      // Password should be hashed
      expect(dbUser!.password).not.toBe(userData.password);
      const isPasswordValid = await bcrypt.compare(userData.password, dbUser!.password);
      expect(isPasswordValid).toBe(true);
    });

    it('should prevent duplicate registrations', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'password123',
        firstName: 'First',
        lastName: 'User',
      };

      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Second registration with same email
      const duplicateResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(duplicateResponse.body).toHaveProperty('error', 'User already exists with this email');
    });

    it('should handle registration with different roles', async () => {
      const roles = [UserRole.CUSTOMER, UserRole.BARBER, UserRole.SHOP_OWNER];
      
      for (const role of roles) {
        const userData = {
          email: `${role.toLowerCase()}@example.com`,
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
          role,
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(201);

        expect(response.body.user.role).toBe(role);
      }
    });
  });

  describe('User Login Flow', () => {
    let testUser: any;
    const testPassword = 'testPassword123';

    beforeEach(async () => {
      testUser = await createTestUser({
        email: 'logintest@example.com',
        password: await bcrypt.hash(testPassword, 12),
        firstName: 'Login',
        lastName: 'Test',
      });
    });

    it('should complete successful login flow', async () => {
      const loginData = {
        email: testUser.email,
        password: testPassword,
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Login successful',
        user: {
          id: testUser.id,
          email: testUser.email,
          firstName: testUser.firstName,
          lastName: testUser.lastName,
          role: testUser.role,
        },
      });

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should handle login with invalid credentials', async () => {
      const invalidCredentials = [
        { email: 'nonexistent@example.com', password: 'password123' },
        { email: testUser.email, password: 'wrongpassword' },
        { email: 'invalid-email', password: 'password123' },
      ];

      for (const credentials of invalidCredentials) {
        const response = await request(app)
          .post('/api/auth/login')
          .send(credentials)
          .expect(401);

        expect(response.body).toHaveProperty('error', 'Invalid credentials');
      }
    });

    it('should prevent login for inactive users', async () => {
      // Create inactive user
      const inactiveUser = await createTestUser({
        email: 'inactive@example.com',
        password: await bcrypt.hash(testPassword, 12),
        isActive: false,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: inactiveUser.email,
          password: testPassword,
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Account is deactivated');
    });
  });

  describe('Token Refresh Flow', () => {
    let testUser: any;
    let validRefreshToken: string;

    beforeEach(async () => {
      const userData = {
        email: 'refreshtest@example.com',
        password: 'password123',
        firstName: 'Refresh',
        lastName: 'Test',
      };

      // Register and get tokens
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      testUser = registerResponse.body.user;
      validRefreshToken = registerResponse.body.refreshToken;
    });

    it('should handle token refresh with valid token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: validRefreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refreshToken');
      
      // New tokens should be different from original
      expect(response.body.refreshToken).not.toBe(validRefreshToken);
    });

    it('should reject invalid refresh tokens', async () => {
      const invalidTokens = [
        'invalid-token',
        '',
        null,
        undefined,
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid',
      ];

      for (const token of invalidTokens) {
        const response = await request(app)
          .post('/api/auth/refresh')
          .send({ refreshToken: token })
          .expect(401);

        expect(response.body).toHaveProperty('error', 'Invalid refresh token');
      }
    });

    it('should reject refresh token for inactive user', async () => {
      // Deactivate user
      await prisma.user.update({
        where: { id: testUser.id },
        data: { isActive: false },
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: validRefreshToken })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid refresh token');
    });
  });

  describe('Full Authentication Workflow', () => {
    it('should complete register -> login -> refresh workflow', async () => {
      const userData = {
        email: 'workflow@example.com',
        password: 'workflowPassword123',
        firstName: 'Workflow',
        lastName: 'Test',
      };

      // Step 1: Register
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body).toHaveProperty('token');
      expect(registerResponse.body).toHaveProperty('refreshToken');

      // Step 2: Login (simulate new session)
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('token');
      expect(loginResponse.body).toHaveProperty('refreshToken');

      // Step 3: Refresh token
      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: loginResponse.body.refreshToken })
        .expect(200);

      expect(refreshResponse.body).toHaveProperty('token');
      expect(refreshResponse.body).toHaveProperty('refreshToken');

      // All tokens should be valid JWT format
      const tokenPattern = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
      expect(registerResponse.body.token).toMatch(tokenPattern);
      expect(loginResponse.body.token).toMatch(tokenPattern);
      expect(refreshResponse.body.token).toMatch(tokenPattern);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed JSON in requests', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send('invalid json')
        .expect(400);

      // Express should handle malformed JSON
    });

    it('should handle missing required fields', async () => {
      const incompleteData = [
        { password: 'password123', firstName: 'Test', lastName: 'User' }, // missing email
        { email: 'test@example.com', firstName: 'Test', lastName: 'User' }, // missing password
        { email: 'test@example.com', password: 'password123', lastName: 'User' }, // missing firstName
        { email: 'test@example.com', password: 'password123', firstName: 'Test' }, // missing lastName
      ];

      for (const data of incompleteData) {
        await request(app)
          .post('/api/auth/register')
          .send(data)
          .expect(400);
      }
    });

    it('should handle email format validation', async () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test..test@example.com',
        'test@example',
      ];

      for (const email of invalidEmails) {
        const userData = {
          email,
          password: 'password123',
          firstName: 'Test',
          lastName: 'User',
        };

        await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(400);
      }
    });

    it('should handle concurrent registration attempts', async () => {
      const userData = {
        email: 'concurrent@example.com',
        password: 'password123',
        firstName: 'Concurrent',
        lastName: 'Test',
      };

      // Attempt multiple concurrent registrations
      const promises = Array(5).fill(null).map(() =>
        request(app)
          .post('/api/auth/register')
          .send(userData)
      );

      const responses = await Promise.allSettled(promises);
      
      // Only one should succeed (201), others should fail (400)
      const successfulResponses = responses.filter(r => 
        r.status === 'fulfilled' && r.value.status === 201
      );
      const failedResponses = responses.filter(r => 
        r.status === 'fulfilled' && r.value.status === 400
      );

      expect(successfulResponses).toHaveLength(1);
      expect(failedResponses).toHaveLength(4);
    });
  });
});