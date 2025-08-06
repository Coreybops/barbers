import { test as base } from '@playwright/test';

type TestFixtures = {
  authenticatedCustomer: void;
  authenticatedOwner: void;
  authenticatedBarber: void;
};

export const test = base.extend<TestFixtures>({
  authenticatedCustomer: async ({ page }, use) => {
    // Login as customer
    await page.goto('/login');
    await page.fill('[name="email"]', 'e2e-customer@test.com');
    await page.fill('[name="password"]', 'TestPassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    await use();
  },

  authenticatedOwner: async ({ page }, use) => {
    // Login as shop owner
    await page.goto('/login');
    await page.fill('[name="email"]', 'e2e-owner@test.com');
    await page.fill('[name="password"]', 'TestPassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    await use();
  },

  authenticatedBarber: async ({ page }, use) => {
    // Login as barber
    await page.goto('/login');
    await page.fill('[name="email"]', 'e2e-barber@test.com');
    await page.fill('[name="password"]', 'TestPassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    await use();
  },
});

export { expect } from '@playwright/test';