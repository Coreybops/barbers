const globalTeardown = async (): Promise<void> => {
  console.log('🧹 Cleaning up test environment...');
  
  // Add any global cleanup logic here
  // For example, closing database connections, cleaning up test files, etc.
  
  console.log('✅ Test environment cleanup complete');
};

export default globalTeardown;