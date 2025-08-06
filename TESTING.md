# Testing Guide

This document provides a comprehensive overview of the testing strategy and setup for the Barber Booking SaaS platform.

## Overview

Our testing strategy follows the testing pyramid approach:

- **Unit Tests**: Fast, isolated tests for individual components and functions
- **Integration Tests**: Tests for API endpoints, database operations, and component interactions
- **End-to-End Tests**: Full user journey tests using Playwright

## Test Structure

```
barber-booking-saas/
├── packages/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── __tests__/
│   │   │   │   ├── unit/
│   │   │   │   │   └── controllers/
│   │   │   │   └── integration/
│   │   │   └── test/
│   │   │       ├── fixtures/
│   │   │       ├── helpers/
│   │   │       ├── setup.ts
│   │   │       ├── globalSetup.ts
│   │   │       └── globalTeardown.ts
│   │   └── jest.config.js
│   └── frontend/
│       ├── src/
│       │   ├── components/
│       │   │   └── **/__tests__/
│       │   ├── store/
│       │   │   └── __tests__/
│       │   └── test/
│       │       ├── mocks/
│       │       ├── utils/
│       │       └── setup.ts
│       └── vitest.config.ts
├── e2e/
│   ├── fixtures/
│   ├── *.spec.ts
│   ├── global-setup.ts
│   └── global-teardown.ts
└── playwright.config.ts
```

## Backend Testing

### Technologies Used

- **Jest**: Testing framework
- **Supertest**: HTTP assertion library
- **Prisma**: Database testing with test database
- **bcryptjs**: Password hashing for test users

### Running Backend Tests

```bash
# Run all backend tests
npm run test --workspace=backend

# Run unit tests only
npm run test:unit --workspace=backend

# Run integration tests only
npm run test:integration --workspace=backend

# Run tests with coverage
npm run test:coverage --workspace=backend

# Run tests in watch mode
npm run test:watch --workspace=backend
```

### Test Database Setup

The backend tests use a separate test database to avoid interfering with development data:

1. Set `TEST_DATABASE_URL` environment variable
2. Tests automatically run migrations before starting
3. Database is cleared between test runs

### Writing Backend Tests

#### Unit Tests

```typescript
// Example: Testing a controller
import request from 'supertest';
import { createTestUser, prisma } from '../../../test/helpers/testHelpers';

describe('AuthController', () => {
  it('should register a new user', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
    };

    const response = await request(app)
      .post('/register')
      .send(userData)
      .expect(201);

    expect(response.body.user.email).toBe(userData.email);
  });
});
```

#### Integration Tests

```typescript
// Example: Testing complete auth flow
describe('Authentication Integration', () => {
  it('should complete full registration and login flow', async () => {
    // Register
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(201);

    // Login
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: userData.email, password: userData.password })
      .expect(200);

    expect(loginResponse.body.token).toBeDefined();
  });
});
```

## Frontend Testing

### Technologies Used

- **Vitest**: Fast testing framework
- **React Testing Library**: React component testing
- **MSW (Mock Service Worker)**: API mocking
- **jsdom**: DOM environment for tests
- **User Event**: Realistic user interaction simulation

### Running Frontend Tests

```bash
# Run all frontend tests
npm run test --workspace=frontend

# Run tests once
npm run test:run --workspace=frontend

# Run tests with coverage
npm run test:coverage --workspace=frontend

# Run tests in watch mode
npm run test:watch --workspace=frontend

# Run tests with UI
npm run test:ui --workspace=frontend
```

### Writing Frontend Tests

#### Component Tests

```typescript
// Example: Testing a Button component
import { render, screen, fireEvent } from '@/test/utils/test-utils';
import { Button } from '../button';

describe('Button Component', () => {
  it('renders and handles clicks', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole('button', { name: 'Click me' });
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalled();
  });
});
```

#### Store Tests

```typescript
// Example: Testing Zustand store
import { useAuthStore } from '../authStore';

describe('AuthStore', () => {
  it('handles login correctly', async () => {
    const { login } = useAuthStore.getState();
    
    await login('test@example.com', 'password123');
    
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
  });
});
```

### API Mocking

We use MSW to mock API calls in frontend tests:

```typescript
// Mock handlers are defined in src/test/mocks/handlers.ts
rest.post('/api/auth/login', (req, res, ctx) => {
  return res(
    ctx.status(200),
    ctx.json({
      user: mockUser,
      token: 'mock-token',
    })
  );
});
```

## End-to-End Testing

### Technologies Used

- **Playwright**: Cross-browser E2E testing
- **Multiple browsers**: Chrome, Firefox, Safari, Mobile browsers

### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headed mode (see browser)
npm run test:e2e:headed

# Run specific test file
npx playwright test auth.spec.ts

# Run tests on specific browser
npx playwright test --project=firefox
```

### Writing E2E Tests

```typescript
// Example: Testing booking flow
import { test, expect } from '@playwright/test';

test('should complete booking flow', async ({ page }) => {
  await page.goto('/');
  
  // Search for barbershops
  await page.fill('[data-testid="search-input"]', 'San Francisco');
  await page.click('[data-testid="search-button"]');
  
  // Select barbershop
  await page.click('[data-testid="barbershop-card"]');
  
  // Complete booking...
  
  // Verify success
  await expect(page.getByText(/booking confirmed/i)).toBeVisible();
});
```

### E2E Test Setup

- Tests run against local development servers
- Test database is automatically set up
- Test users are created during global setup

## Continuous Integration

### GitHub Actions Workflow

Our CI pipeline runs:

1. **Linting**: ESLint and Prettier checks
2. **Unit Tests**: Backend and frontend unit tests
3. **Integration Tests**: Backend integration tests
4. **Build**: Both backend and frontend builds
5. **E2E Tests**: Full end-to-end test suite

### Running CI Locally

```bash
# Run all tests like CI
npm run test:ci

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration
```

## Test Coverage

We maintain minimum coverage thresholds:

- **Lines**: 70%
- **Functions**: 70%
- **Branches**: 70%
- **Statements**: 70%

### Viewing Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open packages/backend/coverage/index.html
open packages/frontend/coverage/index.html
```

## Best Practices

### General

- Write descriptive test names
- Test behavior, not implementation
- Keep tests independent and deterministic
- Use data-testid attributes for E2E tests
- Mock external dependencies

### Backend Tests

- Use test database for integration tests
- Clean database between tests
- Test error scenarios
- Validate input/output thoroughly
- Test authentication and authorization

### Frontend Tests

- Use React Testing Library queries
- Test user interactions, not implementation details
- Mock API calls with MSW
- Test loading states and error handling
- Ensure accessibility compliance

### E2E Tests

- Test critical user journeys
- Use page object model for complex flows
- Handle async operations properly
- Test across different browsers and devices
- Keep tests focused and fast

## Debugging Tests

### Backend

```bash
# Run tests with debugging
npm run test --workspace=backend -- --detectOpenHandles --forceExit

# Run single test file
npm run test --workspace=backend -- src/__tests__/unit/controllers/authController.test.ts
```

### Frontend

```bash
# Run tests with debugging
npm run test --workspace=frontend -- --reporter=verbose

# Run single test file
npm run test --workspace=frontend -- src/components/ui/__tests__/button.test.tsx
```

### E2E

```bash
# Run with debugging
npx playwright test --debug

# Run with trace
npx playwright test --trace on

# Show test report
npx playwright show-report
```

## Common Issues and Solutions

### Backend Tests

**Database connection issues**:
- Ensure TEST_DATABASE_URL is set
- Check database is running
- Verify migrations are up to date

**Test timeouts**:
- Increase test timeout in Jest config
- Check for async operations not being awaited

### Frontend Tests

**Component not found**:
- Use proper queries (getByRole, getByText, etc.)
- Wait for async operations with waitFor
- Check if component is conditionally rendered

**MSW not working**:
- Ensure server is started in test setup
- Check mock handlers are properly defined
- Verify request URLs match exactly

### E2E Tests

**Element not found**:
- Use data-testid attributes
- Wait for elements with proper timeout
- Check if element is in viewport

**Flaky tests**:
- Add proper waits for async operations
- Use page.waitForLoadState()
- Avoid hard-coded timeouts

## Contributing

When adding new features:

1. Write unit tests for new functions/components
2. Add integration tests for new API endpoints
3. Update E2E tests for new user flows
4. Ensure all tests pass before submitting PR
5. Maintain or improve code coverage

For more specific testing questions, refer to the documentation of the respective testing frameworks:

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Vitest Documentation](https://vitest.dev/guide/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro)
- [Playwright Documentation](https://playwright.dev/docs/intro)