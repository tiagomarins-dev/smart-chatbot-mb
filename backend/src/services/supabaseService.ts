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
    // Inicializar clientes com diferentes chaves de função
    // Configurações avançadas para resolver problemas de conexão e SSL
    const options = {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false
      },
      global: {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        fetch: (url: RequestInfo | URL, init?: RequestInit) => {
          // Debug da requisição
          console.log(`Supabase fetch: ${typeof url === 'string' ? url : url.toString()}`);

          // Configurar fetch com opções adicionais de segurança
          return fetch(url, {
            ...init,
            redirect: 'follow',
            // Aceitar certificados SSL auto-assinados em desenvolvimento
            // @ts-ignore
            agent: process.env.NODE_ENV !== 'production' ?
              new (require('https').Agent)({ rejectUnauthorized: false }) :
              undefined
          }).then(response => {
            // Interceptar a resposta para logging
            if (!response.ok) {
              console.error(`Supabase API error: ${response.status} ${response.statusText}`);
            }
            return response;
          }).catch(error => {
            console.error('Supabase fetch error:', error);
            throw error;
          });
        }
      }
    };

    console.log('Inicializando Supabase com URL:', supabaseUrl);

    this.clients = {
      service_role: createClient(supabaseUrl, supabaseServiceKey, options),
      anon: createClient(supabaseUrl, supabaseAnonKey, options),
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