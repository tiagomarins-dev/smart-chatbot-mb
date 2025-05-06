// Set up process.env variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.SUPABASE_URL = 'https://test-instance.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';

// Mock console methods to keep test output clean
global.console = {
  ...console,
  // Uncomment the following lines to suppress specific console methods during tests
  // log: jest.fn(),
  // error: jest.fn(),
  // warn: jest.fn(),
};