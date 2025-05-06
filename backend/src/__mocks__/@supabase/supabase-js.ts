// Mock for @supabase/supabase-js
export const createClient = jest.fn(() => {
  return {
    auth: {
      signInWithPassword: jest.fn().mockResolvedValue({
        data: {
          user: { id: 'test-user-id', email: 'test@example.com' },
          session: { access_token: 'mock-token' }
        },
        error: null
      }),
      signUp: jest.fn().mockResolvedValue({
        data: {
          user: { id: 'new-user-id', email: 'new@example.com' },
          session: { access_token: 'mock-token' }
        },
        error: null
      })
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      like: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      contains: jest.fn().mockReturnThis(),
      filter: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      count: jest.fn().mockReturnThis(),
      group: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({
        data: [],
        error: null
      }),
      then: jest.fn().mockResolvedValue({
        data: [],
        error: null
      })
    })
  };
});

export const SupabaseClient = jest.fn().mockImplementation(() => {
  return {};
});