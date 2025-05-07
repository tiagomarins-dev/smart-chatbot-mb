import { LeadEvent } from '../interfaces';
import { insertData } from '../utils/dbUtils';
import { getSupabaseAdmin } from '../services/supabaseService';

/**
 * Creates a new lead event record in the database
 */
export async function createLeadEvent(
  leadId: string,
  eventType: string,
  eventData: Record<string, any>,
  origin?: string
): Promise<LeadEvent | null> {
  try {
    const leadEvent: LeadEvent = {
      lead_id: leadId,
      event_type: eventType,
      event_data: eventData,
      origin
    };

    const result = await insertData('lead_events', leadEvent);
    return result as LeadEvent;
  } catch (error) {
    console.error('Error creating lead event:', error);
    return null;
  }
}

/**
 * Get all events for a specific lead
 */
export async function getLeadEvents(leadId: string): Promise<LeadEvent[]> {
  try {
    const supabase = getSupabaseAdmin();
    
    const { data, error } = await supabase
      .from('lead_events')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Supabase error getting lead events:', error);
      return [];
    }
    
    return data as LeadEvent[];
  } catch (error) {
    console.error('Error getting lead events:', error);
    return [];
  }
}

/**
 * Get events for a specific lead filtered by event type
 */
export async function getLeadEventsByType(leadId: string, eventType: string): Promise<LeadEvent[]> {
  try {
    const supabase = getSupabaseAdmin();
    
    const { data, error } = await supabase
      .from('lead_events')
      .select('*')
      .eq('lead_id', leadId)
      .eq('event_type', eventType)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Supabase error getting lead events by type:', error);
      return [];
    }
    
    return data as LeadEvent[];
  } catch (error) {
    console.error('Error getting lead events by type:', error);
    return [];
  }
}

/**
 * Get events for a specific lead filtered by origin
 */
export async function getLeadEventsByOrigin(leadId: string, origin: string): Promise<LeadEvent[]> {
  try {
    const supabase = getSupabaseAdmin();
    
    const { data, error } = await supabase
      .from('lead_events')
      .select('*')
      .eq('lead_id', leadId)
      .eq('origin', origin)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Supabase error getting lead events by origin:', error);
      return [];
    }
    
    return data as LeadEvent[];
  } catch (error) {
    console.error('Error getting lead events by origin:', error);
    return [];
  }
}

/**
 * Get summary of lead events counts by type
 */
export async function getLeadEventsSummary(leadId: string): Promise<Record<string, number>> {
  try {
    const supabase = getSupabaseAdmin();
    
    // Para este caso específico, ainda precisamos usar SQL bruto para fazer GROUP BY
    // já que o Supabase não suporta GROUP BY nativamente na API JavaScript
    const { data, error } = await supabase
      .rpc('get_lead_events_summary', { lead_id_param: leadId });
    
    if (error) {
      // Fallback usando uma abordagem diferente
      console.error('Supabase error getting lead events summary:', error);
      
      // Obter todos os eventos e fazer o agrupamento manualmente
      const { data: events, error: eventsError } = await supabase
        .from('lead_events')
        .select('event_type')
        .eq('lead_id', leadId);
        
      if (eventsError) {
        console.error('Error fetching events for summary:', eventsError);
        return {};
      }
      
      // Agrupar manualmente
      const summary: Record<string, number> = {};
      for (const event of events) {
        if (summary[event.event_type]) {
          summary[event.event_type]++;
        } else {
          summary[event.event_type] = 1;
        }
      }
      
      return summary;
    }
    
    // Converter o resultado para o formato esperado
    const summary: Record<string, number> = {};
    for (const row of data) {
      summary[row.event_type] = parseInt(row.count);
    }
    
    return summary;
  } catch (error) {
    console.error('Error getting lead events summary:', error);
    return {};
  }
}