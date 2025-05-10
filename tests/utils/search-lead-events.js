// Script to search for lead events related to a specific phone number
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Supabase connection
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check if environment variables are available
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Phone number to search for - using various formats
const phoneNumber = '5521998739574';
const phoneNumber8 = phoneNumber.substring(phoneNumber.length - 8); // Last 8 digits
const phoneNumber9 = phoneNumber.substring(phoneNumber.length - 9); // Last 9 digits
const phoneNumber11 = phoneNumber.substring(phoneNumber.length - 11); // Last 11 digits

async function searchLeadEvents() {
  console.log(`Searching for lead with phone: ${phoneNumber}`);
  
  try {
    // First find leads matching the phone number
    const { data: leads, error } = await supabase
      .from('leads')
      .select('id, name, first_name, email, phone, status')
      .or(`phone.ilike.%${phoneNumber}%,phone.ilike.%${phoneNumber8}%,phone.ilike.%${phoneNumber9}%,phone.ilike.%${phoneNumber11}%`);
    
    if (error) {
      console.error('Error searching for lead:', error);
      return;
    }
    
    console.log(`Found ${leads.length} leads matching the phone number`);
    
    // If we found leads, search for their events
    if (leads.length > 0) {
      for (const lead of leads) {
        console.log(`\nDetails for lead ${lead.id} (${lead.name || 'Unnamed'}):`);
        console.log(`  Email: ${lead.email || 'N/A'}`);
        console.log(`  Phone: ${lead.phone || 'N/A'}`);
        console.log(`  Status: ${lead.status || 'N/A'}`);
        
        // Get lead events
        const { data: events, error: eventsError } = await supabase
          .from('lead_events')
          .select('*')
          .eq('lead_id', lead.id)
          .order('created_at', { ascending: false });
        
        if (eventsError) {
          console.error(`Error fetching events for lead ${lead.id}:`, eventsError);
          continue;
        }
        
        console.log(`\nFound ${events.length} events for this lead:`);
        
        // Group events by type for better analysis
        const eventsByType = {};
        events.forEach(event => {
          const type = event.event_type || 'unknown';
          if (!eventsByType[type]) {
            eventsByType[type] = [];
          }
          eventsByType[type].push(event);
        });
        
        // Show summary by event type
        console.log('\nEvents by type:');
        for (const [type, typeEvents] of Object.entries(eventsByType)) {
          console.log(`  ${type}: ${typeEvents.length} events`);
        }
        
        // Show some WhatsApp message events if they exist
        const whatsappEvents = eventsByType['whatsapp_message'] || [];
        if (whatsappEvents.length > 0) {
          console.log('\nMost recent WhatsApp messages:');
          whatsappEvents.slice(0, 5).forEach(event => {
            const data = event.event_data || {};
            const direction = data.direction || 'unknown';
            const message = data.message || '(no content)';
            const timestamp = event.created_at;
            console.log(`  ${timestamp} [${direction}]: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`);
          });
        }
      }
    } else {
      console.log('No leads found with this phone number');
    }
  } catch (err) {
    console.error('Exception occurred:', err);
  }
}

// Execute the search
searchLeadEvents();