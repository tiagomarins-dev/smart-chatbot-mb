import { createClient, RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Environment variables for Supabase connection
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required Supabase environment variables for realtime service.');
  process.exit(1);
}

/**
 * Service for managing Supabase Realtime subscriptions
 */
export class RealtimeService {
  private static instance: RealtimeService;
  private client: SupabaseClient;
  private channels: Map<string, RealtimeChannel> = new Map();

  private constructor() {
    this.client = createClient(supabaseUrl, supabaseServiceKey);
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService();
    }
    return RealtimeService.instance;
  }

  /**
   * Create and get a channel for a specific table
   */
  public getChannel(table: string, event: 'INSERT' | 'UPDATE' | 'DELETE' | '*' = '*'): RealtimeChannel {
    const channelId = `${table}:${event}`;
    
    if (!this.channels.has(channelId)) {
      // Create a new channel
      const channel = this.client
        .channel(channelId)
        .on('postgres_changes', {
          event,
          schema: 'public',
          table
        }, (payload) => {
          console.log(`Realtime event on ${table}:`, payload);
        });
      
      this.channels.set(channelId, channel);
    }
    
    return this.channels.get(channelId)!;
  }

  /**
   * Subscribe to all database changes (companies, leads, contacts)
   */
  public subscribeToAll(): void {
    // Companies table
    this.getChannel('companies').subscribe();
    
    // Projects table
    this.getChannel('projects').subscribe();
    
    // Leads table
    this.getChannel('leads').subscribe();
    
    // Contacts table
    this.getChannel('contacts').subscribe();
    
    console.log('Subscribed to all realtime channels');
  }

  /**
   * Unsubscribe from a specific channel
   */
  public unsubscribe(table: string, event: 'INSERT' | 'UPDATE' | 'DELETE' | '*' = '*'): void {
    const channelId = `${table}:${event}`;
    
    if (this.channels.has(channelId)) {
      const channel = this.channels.get(channelId)!;
      this.client.removeChannel(channel);
      this.channels.delete(channelId);
      console.log(`Unsubscribed from ${channelId}`);
    }
  }

  /**
   * Unsubscribe from all channels
   */
  public unsubscribeAll(): void {
    for (const channel of this.channels.values()) {
      this.client.removeChannel(channel);
    }
    this.channels.clear();
    console.log('Unsubscribed from all realtime channels');
  }
}

export default RealtimeService;