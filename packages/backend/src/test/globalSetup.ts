import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

const globalSetup = async (): Promise<void> => {
  console.log('🔧 Setting up test environment...');
  
  // Set test environment
  process.env.NODE_ENV = 'test';
  
  // Ensure test database exists and run migrations
  try {
    console.log('📦 Running database migrations...');
    execSync('npx prisma migrate deploy', { 
      cwd: process.cwd(),
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
      }
    });
    
    console.log('✅ Test environment setup complete');
  } catch (error) {
    console.error('❌ Failed to setup test environment:', error);
    process.exit(1);
  }
};

export default globalSetup;