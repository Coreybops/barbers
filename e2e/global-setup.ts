import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🔧 Setting up E2E test environment...');
  
  // Wait for services to be ready
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Check if backend is ready
    console.log('⏳ Waiting for backend to be ready...');
    await page.waitForResponse(
      (response) => response.url().includes('/health') && response.status() === 200,
      { timeout: 30000 }
    );
    console.log('✅ Backend is ready');
    
    // Check if frontend is ready
    console.log('⏳ Waiting for frontend to be ready...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    console.log('✅ Frontend is ready');
    
    // Set up test data if needed
    console.log('📊 Setting up test data...');
    
    // Create test user accounts via API
    try {
      await page.request.post('http://localhost:5000/api/auth/register', {
        data: {
          email: 'e2e-customer@test.com',
          password: 'TestPassword123',
          firstName: 'E2E',
          lastName: 'Customer',
          role: 'CUSTOMER',
        },
      });
      console.log('✅ Test customer created');
    } catch (error) {
      console.log('ℹ️ Test customer may already exist');
    }
    
    try {
      await page.request.post('http://localhost:5000/api/auth/register', {
        data: {
          email: 'e2e-owner@test.com',
          password: 'TestPassword123',
          firstName: 'E2E',
          lastName: 'Owner',
          role: 'SHOP_OWNER',
        },
      });
      console.log('✅ Test shop owner created');
    } catch (error) {
      console.log('ℹ️ Test shop owner may already exist');
    }
    
    try {
      await page.request.post('http://localhost:5000/api/auth/register', {
        data: {
          email: 'e2e-barber@test.com',
          password: 'TestPassword123',
          firstName: 'E2E',
          lastName: 'Barber',
          role: 'BARBER',
        },
      });
      console.log('✅ Test barber created');
    } catch (error) {
      console.log('ℹ️ Test barber may already exist');
    }
    
    console.log('✅ E2E test environment setup complete');
    
  } catch (error) {
    console.error('❌ Failed to set up E2E test environment:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;