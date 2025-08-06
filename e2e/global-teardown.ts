import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up E2E test environment...');
  
  // Clean up test data if needed
  // In a real scenario, you might want to clean up test databases, files, etc.
  
  console.log('✅ E2E test environment cleanup complete');
}

export default globalTeardown;