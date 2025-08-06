import { test, expect } from './fixtures/auth-fixture';

test.describe('Booking Flow', () => {
  test.describe('Guest Booking Flow', () => {
    test('should complete full guest booking flow', async ({ page }) => {
      await page.goto('/');
      
      // Step 1: Search for barbershops
      await page.fill('[data-testid="search-input"]', 'San Francisco');
      await page.click('[data-testid="search-button"]');
      
      // Should show search results
      await expect(page.getByText(/barbershops in san francisco/i)).toBeVisible();
      await expect(page.locator('[data-testid="barbershop-card"]').first()).toBeVisible();
      
      // Step 2: Select a barbershop
      await page.click('[data-testid="barbershop-card"]');
      await page.waitForURL(/\/barbershops\/*/);
      
      // Should show barbershop details
      await expect(page.getByText(/services/i)).toBeVisible();
      await expect(page.getByText(/barbers/i)).toBeVisible();
      
      // Step 3: Start booking
      await page.click('[data-testid="book-appointment-btn"]');
      await page.waitForURL(/\/booking*/);
      
      // Should show booking wizard
      await expect(page.getByText(/step 1 of 6/i)).toBeVisible();
      await expect(page.getByText(/select service/i)).toBeVisible();
      
      // Step 4: Select service
      await page.click('[data-testid="service-card"]');
      await expect(page.getByText(/next/i)).toBeEnabled();
      await page.click('text=Next');
      
      // Step 5: Select barber (optional)
      await expect(page.getByText(/step 3 of 6/i)).toBeVisible();
      await page.click('[data-testid="barber-card"]');
      await page.click('text=Next');
      
      // Step 6: Select date and time
      await expect(page.getByText(/step 4 of 6/i)).toBeVisible();
      
      // Select tomorrow's date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.getDate().toString();
      
      await page.click(`[data-testid="date-${tomorrowStr}"]`);
      
      // Wait for time slots to load
      await expect(page.locator('[data-testid="time-slot"]').first()).toBeVisible();
      
      // Select first available time slot
      await page.click('[data-testid="time-slot"]');
      await page.click('text=Next');
      
      // Step 7: Enter customer details
      await expect(page.getByText(/step 5 of 6/i)).toBeVisible();
      
      await page.fill('[name="name"]', 'John Guest');
      await page.fill('[name="email"]', 'john.guest@example.com');
      await page.fill('[name="phone"]', '555-0123');
      await page.fill('[name="notes"]', 'First time visit');
      
      await page.click('text=Next');
      
      // Step 8: Review and confirm
      await expect(page.getByText(/step 6 of 6/i)).toBeVisible();
      await expect(page.getByText(/booking summary/i)).toBeVisible();
      
      // Should show booking details
      await expect(page.getByText('John Guest')).toBeVisible();
      await expect(page.getByText('john.guest@example.com')).toBeVisible();
      await expect(page.getByText('555-0123')).toBeVisible();
      
      // Confirm booking
      await page.click('[data-testid="confirm-booking-btn"]');
      
      // Step 9: Success page
      await expect(page.getByText(/booking confirmed/i)).toBeVisible();
      await expect(page.getByText(/confirmation number/i)).toBeVisible();
      
      // Should have options for next steps
      await expect(page.getByText(/add to calendar/i)).toBeVisible();
      await expect(page.getByText(/book another/i)).toBeVisible();
    });

    test('should handle booking conflicts', async ({ page }) => {
      await page.goto('/');
      
      // Navigate to booking flow
      await page.fill('[data-testid="search-input"]', 'San Francisco');
      await page.click('[data-testid="search-button"]');
      await page.click('[data-testid="barbershop-card"]');
      await page.click('[data-testid="book-appointment-btn"]');
      
      // Complete steps up to time selection
      await page.click('[data-testid="service-card"]');
      await page.click('text=Next');
      await page.click('[data-testid="barber-card"]');
      await page.click('text=Next');
      
      // Try to select an already booked time slot
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.getDate().toString();
      
      await page.click(`[data-testid="date-${tomorrowStr}"]`);
      
      // Look for unavailable time slot
      const unavailableSlot = page.locator('[data-testid="time-slot"][data-available="false"]');
      if (await unavailableSlot.count() > 0) {
        await unavailableSlot.first().click();
        
        // Should show conflict message
        await expect(page.getByText(/time slot not available/i)).toBeVisible();
      }
    });

    test('should validate customer information', async ({ page }) => {
      await page.goto('/');
      
      // Navigate to customer details step
      await page.fill('[data-testid="search-input"]', 'San Francisco');
      await page.click('[data-testid="search-button"]');
      await page.click('[data-testid="barbershop-card"]');
      await page.click('[data-testid="book-appointment-btn"]');
      
      // Quick navigation to customer details
      await page.click('[data-testid="service-card"]');
      await page.click('text=Next');
      await page.click('text=Next'); // Skip barber selection
      
      // Select date and time
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.getDate().toString();
      
      await page.click(`[data-testid="date-${tomorrowStr}"]`);
      await page.click('[data-testid="time-slot"]');
      await page.click('text=Next');
      
      // Try to proceed without filling required fields
      await page.click('text=Next');
      
      // Should show validation errors
      await expect(page.getByText(/name is required/i)).toBeVisible();
      await expect(page.getByText(/email is required/i)).toBeVisible();
      await expect(page.getByText(/phone is required/i)).toBeVisible();
      
      // Test invalid email format
      await page.fill('[name="name"]', 'John Doe');
      await page.fill('[name="email"]', 'invalid-email');
      await page.fill('[name="phone"]', '555-0123');
      
      await page.click('text=Next');
      
      // Should show email validation error
      await expect(page.getByText(/invalid email/i)).toBeVisible();
    });

    test('should handle booking for different services', async ({ page }) => {
      await page.goto('/');
      
      // Navigate to booking
      await page.fill('[data-testid="search-input"]', 'San Francisco');
      await page.click('[data-testid="search-button"]');
      await page.click('[data-testid="barbershop-card"]');
      await page.click('[data-testid="book-appointment-btn"]');
      
      // Test different service durations and prices
      const services = await page.locator('[data-testid="service-card"]').all();
      
      for (let i = 0; i < Math.min(services.length, 3); i++) {
        await services[i].click();
        
        // Should update duration and price
        const duration = await page.textContent('[data-testid="selected-duration"]');
        const price = await page.textContent('[data-testid="selected-price"]');
        
        expect(duration).toBeTruthy();
        expect(price).toBeTruthy();
        
        // Clear selection for next iteration
        if (i < services.length - 1) {
          await services[i].click(); // Deselect
        }
      }
    });
  });

  test.describe('Authenticated User Booking', () => {
    test('should use authenticated user info', async ({ page, authenticatedCustomer }) => {
      await page.goto('/');
      
      // Navigate to booking
      await page.fill('[data-testid="search-input"]', 'San Francisco');
      await page.click('[data-testid="search-button"]');
      await page.click('[data-testid="barbershop-card"]');
      await page.click('[data-testid="book-appointment-btn"]');
      
      // Complete steps up to customer details
      await page.click('[data-testid="service-card"]');
      await page.click('text=Next');
      await page.click('text=Next'); // Skip barber
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.getDate().toString();
      
      await page.click(`[data-testid="date-${tomorrowStr}"]`);
      await page.click('[data-testid="time-slot"]');
      await page.click('text=Next');
      
      // Customer details should be pre-filled
      await expect(page.locator('[name="name"]')).toHaveValue('E2E Customer');
      await expect(page.locator('[name="email"]')).toHaveValue('e2e-customer@test.com');
      
      // Should still be able to edit
      await page.fill('[name="notes"]', 'Authenticated user booking');
      await page.click('text=Next');
      
      // Proceed to confirmation
      await expect(page.getByText(/booking summary/i)).toBeVisible();
    });

    test('should show booking history', async ({ page, authenticatedCustomer }) => {
      await page.goto('/appointments');
      
      // Should show appointments page
      await expect(page.getByText(/my appointments/i)).toBeVisible();
      
      // Should show past and upcoming appointments
      await expect(page.getByText(/upcoming/i)).toBeVisible();
      await expect(page.getByText(/past/i)).toBeVisible();
    });

    test('should allow canceling appointments', async ({ page, authenticatedCustomer }) => {
      // First create an appointment
      await page.goto('/');
      await page.fill('[data-testid="search-input"]', 'San Francisco');
      await page.click('[data-testid="search-button"]');
      await page.click('[data-testid="barbershop-card"]');
      await page.click('[data-testid="book-appointment-btn"]');
      
      // Quick booking
      await page.click('[data-testid="service-card"]');
      await page.click('text=Next');
      await page.click('text=Next');
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.getDate().toString();
      
      await page.click(`[data-testid="date-${tomorrowStr}"]`);
      await page.click('[data-testid="time-slot"]');
      await page.click('text=Next');
      
      await page.fill('[name="notes"]', 'Test cancellation');
      await page.click('text=Next');
      await page.click('[data-testid="confirm-booking-btn"]');
      
      // Wait for success
      await expect(page.getByText(/booking confirmed/i)).toBeVisible();
      
      // Go to appointments
      await page.goto('/appointments');
      
      // Find and cancel the appointment
      await page.click('[data-testid="appointment-actions"]');
      await page.click('text=Cancel');
      
      // Confirm cancellation
      await page.click('[data-testid="confirm-cancel"]');
      
      // Should show cancellation success
      await expect(page.getByText(/appointment cancelled/i)).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/');
      
      // Mobile navigation should work
      await expect(page.locator('[data-testid="mobile-menu-btn"]')).toBeVisible();
      
      // Search should work on mobile
      await page.fill('[data-testid="search-input"]', 'San Francisco');
      await page.click('[data-testid="search-button"]');
      
      // Results should be displayed properly
      await expect(page.locator('[data-testid="barbershop-card"]')).toBeVisible();
      
      // Booking flow should work on mobile
      await page.click('[data-testid="barbershop-card"]');
      await page.click('[data-testid="book-appointment-btn"]');
      
      // Progress steps should be visible
      await expect(page.getByText(/step 1 of 6/i)).toBeVisible();
      
      // Navigation buttons should be accessible
      await expect(page.getByText(/next/i)).toBeVisible();
      await expect(page.getByText(/previous/i)).toBeVisible();
    });

    test('should work on tablet devices', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await page.goto('/');
      
      // Tablet layout should show properly
      await page.fill('[data-testid="search-input"]', 'San Francisco');
      await page.click('[data-testid="search-button"]');
      
      // Should show grid layout on tablet
      const cards = page.locator('[data-testid="barbershop-card"]');
      await expect(cards.first()).toBeVisible();
      
      // Booking flow should adapt to tablet size
      await page.click('[data-testid="barbershop-card"]');
      await page.click('[data-testid="book-appointment-btn"]');
      
      await expect(page.getByText(/step 1 of 6/i)).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate network failure
      await page.route('**/api/**', route => route.abort());
      
      await page.goto('/');
      
      // Try to search
      await page.fill('[data-testid="search-input"]', 'San Francisco');
      await page.click('[data-testid="search-button"]');
      
      // Should show error message
      await expect(page.getByText(/something went wrong/i)).toBeVisible();
      await expect(page.getByText(/try again/i)).toBeVisible();
    });

    test('should handle API errors during booking', async ({ page }) => {
      await page.goto('/');
      
      // Navigate to booking confirmation
      await page.fill('[data-testid="search-input"]', 'San Francisco');
      await page.click('[data-testid="search-button"]');
      await page.click('[data-testid="barbershop-card"]');
      await page.click('[data-testid="book-appointment-btn"]');
      
      // Complete booking steps
      await page.click('[data-testid="service-card"]');
      await page.click('text=Next');
      await page.click('text=Next');
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.getDate().toString();
      
      await page.click(`[data-testid="date-${tomorrowStr}"]`);
      await page.click('[data-testid="time-slot"]');
      await page.click('text=Next');
      
      await page.fill('[name="name"]', 'Test User');
      await page.fill('[name="email"]', 'test@example.com');
      await page.fill('[name="phone"]', '555-0123');
      await page.click('text=Next');
      
      // Simulate booking API failure
      await page.route('**/api/appointments', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Booking failed' }),
        });
      });
      
      // Try to confirm booking
      await page.click('[data-testid="confirm-booking-btn"]');
      
      // Should show error message
      await expect(page.getByText(/booking failed/i)).toBeVisible();
      await expect(page.getByText(/try again/i)).toBeVisible();
    });
  });
});