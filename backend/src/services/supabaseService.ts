import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Environment variables for Supabase connection
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Validate required environment variables
if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('Missing required Supabase environment variables.');
  process.exit(1);
}

// Singleton pattern to manage Supabase client instances
class SupabaseService {
  private static instance: SupabaseService;
  private clients: Record<string, SupabaseClient> = {};

  private constructor() {
    // Initialize clients with different role keys
    this.clients = {
      service_role: createClient(supabaseUrl, supabaseServiceKey),
      anon: createClient(supabaseUrl, supabaseAnonKey),
    };
  }

  // Get singleton instance
  public static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }

  // Get a client with specified role
  public getClient(role: 'service_role' | 'anon' = 'service_role'): SupabaseClient {
    return this.clients[role];
  }
}

// Helper function to get the service role client (most common use case)
export const getSupabaseAdmin = (): SupabaseClient => {
  return SupabaseService.getInstance().getClient('service_role');
};

// Helper function to get the anonymous client
export const getSupabaseClient = (): SupabaseClient => {
  return SupabaseService.getInstance().getClient('anon');
};

export default SupabaseService;