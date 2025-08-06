import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login and register options on homepage', async ({ page }) => {
    await expect(page.getByRole('link', { name: /login/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /register/i })).toBeVisible();
  });

  test.describe('User Registration', () => {
    test('should register a new customer successfully', async ({ page }) => {
      await page.goto('/register');
      
      // Fill registration form
      await page.fill('[name="firstName"]', 'Test');
      await page.fill('[name="lastName"]', 'User');
      await page.fill('[name="email"]', `test-${Date.now()}@example.com`);
      await page.fill('[name="password"]', 'TestPassword123');
      await page.fill('[name="phone"]', '555-0123');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Should redirect to dashboard after successful registration
      await page.waitForURL('/dashboard');
      await expect(page.getByText('Welcome')).toBeVisible();
    });

    test('should show validation errors for invalid data', async ({ page }) => {
      await page.goto('/register');
      
      // Submit empty form
      await page.click('button[type="submit"]');
      
      // Should show validation errors
      await expect(page.getByText(/first name is required/i)).toBeVisible();
      await expect(page.getByText(/email is required/i)).toBeVisible();
      await expect(page.getByText(/password is required/i)).toBeVisible();
    });

    test('should show error for duplicate email', async ({ page }) => {
      await page.goto('/register');
      
      // Try to register with existing email
      await page.fill('[name="firstName"]', 'Test');
      await page.fill('[name="lastName"]', 'User');
      await page.fill('[name="email"]', 'e2e-customer@test.com'); // Existing email
      await page.fill('[name="password"]', 'TestPassword123');
      
      await page.click('button[type="submit"]');
      
      // Should show error message
      await expect(page.getByText(/user already exists/i)).toBeVisible();
    });

    test('should validate password requirements', async ({ page }) => {
      await page.goto('/register');
      
      await page.fill('[name="firstName"]', 'Test');
      await page.fill('[name="lastName"]', 'User'); 
      await page.fill('[name="email"]', `test-${Date.now()}@example.com`);
      await page.fill('[name="password"]', '123'); // Too short
      
      await page.click('button[type="submit"]');
      
      // Should show password validation error
      await expect(page.getByText(/password must be at least/i)).toBeVisible();
    });

    test('should validate email format', async ({ page }) => {
      await page.goto('/register');
      
      await page.fill('[name="firstName"]', 'Test');
      await page.fill('[name="lastName"]', 'User');
      await page.fill('[name="email"]', 'invalid-email'); // Invalid format
      await page.fill('[name="password"]', 'TestPassword123');
      
      await page.click('button[type="submit"]');
      
      // Should show email validation error
      await expect(page.getByText(/invalid email/i)).toBeVisible();
    });

    test('should allow selecting different user roles', async ({ page }) => {
      await page.goto('/register');
      
      // Should have role selection
      await expect(page.getByRole('combobox', { name: /role/i })).toBeVisible();
      
      // Select barber role
      await page.click('[name="role"]');
      await page.click('text=Barber');
      
      // Fill rest of form
      await page.fill('[name="firstName"]', 'Test');
      await page.fill('[name="lastName"]', 'Barber');
      await page.fill('[name="email"]', `barber-${Date.now()}@example.com`);
      await page.fill('[name="password"]', 'TestPassword123');
      
      await page.click('button[type="submit"]');
      
      await page.waitForURL('/dashboard');
      // Barber dashboard should have different content
      await expect(page.getByText(/barber dashboard/i)).toBeVisible();
    });
  });

  test.describe('User Login', () => {
    test('should login with valid credentials', async ({ page }) => {
      await page.goto('/login');
      
      await page.fill('[name="email"]', 'e2e-customer@test.com');
      await page.fill('[name="password"]', 'TestPassword123');
      
      await page.click('button[type="submit"]');
      
      // Should redirect to dashboard
      await page.waitForURL('/dashboard');
      await expect(page.getByText('E2E Customer')).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login');
      
      await page.fill('[name="email"]', 'e2e-customer@test.com');
      await page.fill('[name="password"]', 'WrongPassword');
      
      await page.click('button[type="submit"]');
      
      // Should show error message
      await expect(page.getByText(/invalid credentials/i)).toBeVisible();
    });

    test('should show error for non-existent user', async ({ page }) => {
      await page.goto('/login');
      
      await page.fill('[name="email"]', 'nonexistent@example.com');
      await page.fill('[name="password"]', 'TestPassword123');
      
      await page.click('button[type="submit"]');
      
      // Should show error message
      await expect(page.getByText(/invalid credentials/i)).toBeVisible();
    });

    test('should show validation errors for empty form', async ({ page }) => {
      await page.goto('/login');
      
      await page.click('button[type="submit"]');
      
      // Should show validation errors
      await expect(page.getByText(/email is required/i)).toBeVisible();
      await expect(page.getByText(/password is required/i)).toBeVisible();
    });

    test('should remember login state after page refresh', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.fill('[name="email"]', 'e2e-customer@test.com');
      await page.fill('[name="password"]', 'TestPassword123');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');
      
      // Refresh page
      await page.reload();
      
      // Should still be logged in
      await expect(page.getByText('E2E Customer')).toBeVisible();
      await expect(page).toHaveURL('/dashboard');
    });

    test('should redirect to login for protected routes', async ({ page }) => {
      // Try to access protected route without login
      await page.goto('/appointments');
      
      // Should redirect to login
      await page.waitForURL('/login');
      await expect(page.getByText(/please log in/i)).toBeVisible();
    });
  });

  test.describe('User Logout', () => {
    test('should logout successfully', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.fill('[name="email"]', 'e2e-customer@test.com');
      await page.fill('[name="password"]', 'TestPassword123');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');
      
      // Logout
      await page.click('[data-testid="user-menu"]');
      await page.click('text=Logout');
      
      // Should redirect to homepage
      await page.waitForURL('/');
      await expect(page.getByRole('link', { name: /login/i })).toBeVisible();
    });

    test('should clear user data on logout', async ({ page }) => {
      // Login and navigate to profile
      await page.goto('/login');
      await page.fill('[name="email"]', 'e2e-customer@test.com');
      await page.fill('[name="password"]', 'TestPassword123');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');
      
      // Logout
      await page.click('[data-testid="user-menu"]');
      await page.click('text=Logout');
      await page.waitForURL('/');
      
      // Try to access protected route
      await page.goto('/dashboard');
      
      // Should redirect to login
      await page.waitForURL('/login');
    });
  });

  test.describe('Password Reset', () => {
    test('should request password reset', async ({ page }) => {
      await page.goto('/login');
      
      // Click forgot password link
      await page.click('text=Forgot password?');
      await page.waitForURL('/forgot-password');
      
      // Enter email
      await page.fill('[name="email"]', 'e2e-customer@test.com');
      await page.click('button[type="submit"]');
      
      // Should show success message
      await expect(page.getByText(/password reset email sent/i)).toBeVisible();
    });

    test('should validate email for password reset', async ({ page }) => {
      await page.goto('/forgot-password');
      
      // Submit empty form
      await page.click('button[type="submit"]');
      
      // Should show validation error
      await expect(page.getByText(/email is required/i)).toBeVisible();
      
      // Submit invalid email
      await page.fill('[name="email"]', 'invalid-email');
      await page.click('button[type="submit"]');
      
      // Should show validation error
      await expect(page.getByText(/invalid email/i)).toBeVisible();
    });
  });

  test.describe('Session Management', () => {
    test('should handle token refresh', async ({ page }) => {
      // Login
      await page.goto('/login');
      await page.fill('[name="email"]', 'e2e-customer@test.com');
      await page.fill('[name="password"]', 'TestPassword123');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');
      
      // Wait for some time to potentially trigger token refresh
      await page.waitForTimeout(2000);
      
      // Make an API call that would require valid token
      await page.goto('/appointments');
      
      // Should still work without requiring re-login
      await expect(page.getByText(/appointments/i)).toBeVisible();
    });

    test('should handle expired session', async ({ page, context }) => {
      // Login
      await page.goto('/login');
      await page.fill('[name="email"]', 'e2e-customer@test.com');
      await page.fill('[name="password"]', 'TestPassword123');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');
      
      // Clear local storage to simulate expired session
      await context.clearCookies();
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      
      // Try to access protected route
      await page.goto('/appointments');
      
      // Should redirect to login
      await page.waitForURL('/login');
    });
  });

  test.describe('Accessibility', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/login');
      
      // Should be able to navigate using Tab
      await page.keyboard.press('Tab');
      await expect(page.locator('[name="email"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('[name="password"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('button[type="submit"]')).toBeFocused();
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto('/login');
      
      // Form should have proper labels
      await expect(page.locator('label[for="email"]')).toBeVisible();
      await expect(page.locator('label[for="password"]')).toBeVisible();
      
      // Form should have proper ARIA attributes
      await expect(page.locator('[name="email"]')).toHaveAttribute('aria-required', 'true');
      await expect(page.locator('[name="password"]')).toHaveAttribute('aria-required', 'true');
    });
  });
});