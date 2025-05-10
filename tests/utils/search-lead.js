// Simple script to search for a lead by phone number
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

async function searchLeadByPhone() {
  console.log(`Searching for lead with phone: ${phoneNumber}`);
  
  try {
    // Search with full number and partial matches
    const { data: leads, error } = await supabase
      .from('leads')
      .select('id, name, first_name, email, phone, status, notes, created_at, updated_at')
      .or(`phone.ilike.%${phoneNumber}%,phone.ilike.%${phoneNumber8}%,phone.ilike.%${phoneNumber9}%,phone.ilike.%${phoneNumber11}%`);
    
    if (error) {
      console.error('Error searching for lead:', error);
      return;
    }
    
    console.log(`Found ${leads.length} leads:`);
    console.log(JSON.stringify(leads, null, 2));
    
    // If we found leads, search for their WhatsApp conversations
    if (leads.length > 0) {
      const leadIds = leads.map(lead => lead.id);
      
      for (const leadId of leadIds) {
        console.log(`\nSearching WhatsApp conversations for lead ${leadId}:`);
        
        const { data: conversations, error: convError } = await supabase
          .from('whatsapp_conversations')
          .select('*')
          .eq('lead_id', leadId)
          .order('message_timestamp', { ascending: false });
        
        if (convError) {
          console.error(`Error fetching conversations for lead ${leadId}:`, convError);
          continue;
        }
        
        console.log(`Found ${conversations.length} WhatsApp conversations`);
        if (conversations.length > 0) {
          console.log('Most recent conversations:');
          conversations.slice(0, 5).forEach(conv => {
            console.log(`${conv.message_timestamp} [${conv.direction}]: ${conv.content.substring(0, 100)}${conv.content.length > 100 ? '...' : ''}`);
          });
        }
      }
    }
  } catch (err) {
    console.error('Exception occurred:', err);
  }
}

// Execute the search
searchLeadByPhone();