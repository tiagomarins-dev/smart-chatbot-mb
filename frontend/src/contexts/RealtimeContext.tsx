import React, { createContext, useContext, useEffect, useState } from 'react';
import WebSocketService, { WebSocketEventHandler } from '../services/websocketService';
import { useAuth } from './AuthContext';
import { Company, Lead, Contact, LeadStats } from '../interfaces';

// Context value interface
interface RealtimeContextValue {
  isConnected: boolean;
  // Subscribe to real-time updates for different resources
  subscribeToCompanies: (handler: WebSocketEventHandler) => void;
  subscribeToLeads: (handler: WebSocketEventHandler) => void;
  subscribeToContacts: (handler: WebSocketEventHandler) => void;
  // Unsubscribe handlers
  unsubscribeFromCompanies: (handler: WebSocketEventHandler) => void;
  unsubscribeFromLeads: (handler: WebSocketEventHandler) => void;
  unsubscribeFromContacts: (handler: WebSocketEventHandler) => void;
  // Cached data (latest state)
  companies: Company[];
  leads: Lead[];
  contacts: Contact[];
  // Stats
  leadStats: LeadStats | null;
  // Update stats
  updateLeadStats: (stats: LeadStats) => void;
}

// Create context
const RealtimeContext = createContext<RealtimeContextValue>({
  isConnected: false,
  subscribeToCompanies: () => {},
  subscribeToLeads: () => {},
  subscribeToContacts: () => {},
  unsubscribeFromCompanies: () => {},
  unsubscribeFromLeads: () => {},
  unsubscribeFromContacts: () => {},
  companies: [],
  leads: [],
  contacts: [],
  leadStats: null,
  updateLeadStats: () => {},
});

// Channel names for different resources
const COMPANIES_CHANNEL = 'companies:*';
const LEADS_CHANNEL = 'leads:*';
const CONTACTS_CHANNEL = 'contacts:*';

// Provider component
export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  
  // State for cached data
  const [companies, setCompanies] = useState<Company[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [leadStats, setLeadStats] = useState<LeadStats | null>(null);
  
  // Get WebSocket service instance
  const websocketService = WebSocketService.getInstance();
  
  // Connect to WebSocket and authenticate when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      // Connect to WebSocket
      const connectWebSocket = async () => {
        try {
          const connected = await websocketService.connect();
          setIsConnected(connected);
          
          if (connected) {
            // Get token from localStorage
            const token = localStorage.getItem('auth_token');
            if (token) {
              websocketService.authenticate(token);
            }
          }
        } catch (error) {
          console.error('Error connecting to WebSocket:', error);
          setIsConnected(false);
        }
      };
      
      connectWebSocket();
      
      // Clean up on unmount
      return () => {
        websocketService.disconnect();
        setIsConnected(false);
      };
    }
  }, [isAuthenticated, user]);
  
  // Companies handlers
  const handleCompanyInsert = (company: Company) => {
    setCompanies(prevCompanies => {
      // Make sure we don't duplicate
      const exists = prevCompanies.some(c => c.id === company.id);
      if (exists) return prevCompanies;
      
      // Add new company
      return [...prevCompanies, company];
    });
  };
  
  const handleCompanyUpdate = (company: Company) => {
    setCompanies(prevCompanies => 
      prevCompanies.map(c => c.id === company.id ? company : c)
    );
  };
  
  const handleCompanyDelete = (company: Company) => {
    setCompanies(prevCompanies => 
      prevCompanies.filter(c => c.id !== company.id)
    );
  };
  
  // Leads handlers
  const handleLeadInsert = (lead: Lead) => {
    setLeads(prevLeads => {
      // Make sure we don't duplicate
      const exists = prevLeads.some(l => l.id === lead.id);
      if (exists) return prevLeads;
      
      // Add new lead
      return [...prevLeads, lead];
    });
    
    // Update stats if we have them
    if (leadStats) {
      setLeadStats({
        ...leadStats,
        total_leads: leadStats.total_leads + 1,
        new_leads_period: leadStats.new_leads_period + 1,
        // Update status count
        leads_by_status: {
          ...leadStats.leads_by_status,
          [lead.status]: (leadStats.leads_by_status[lead.status] || 0) + 1
        }
      });
    }
  };
  
  const handleLeadUpdate = (lead: Lead) => {
    setLeads(prevLeads => {
      // Find the lead we're updating
      const oldLead = prevLeads.find(l => l.id === lead.id);
      
      // Update the lead
      const updatedLeads = prevLeads.map(l => l.id === lead.id ? lead : l);
      
      // Update stats if status changed
      if (oldLead && oldLead.status !== lead.status && leadStats) {
        // Decrement the old status count
        const oldStatusCount = leadStats.leads_by_status[oldLead.status] || 0;
        // Increment the new status count
        const newStatusCount = leadStats.leads_by_status[lead.status] || 0;
        
        setLeadStats({
          ...leadStats,
          leads_by_status: {
            ...leadStats.leads_by_status,
            [oldLead.status]: Math.max(0, oldStatusCount - 1),
            [lead.status]: newStatusCount + 1
          }
        });
      }
      
      return updatedLeads;
    });
  };
  
  const handleLeadDelete = (lead: Lead) => {
    setLeads(prevLeads => {
      // Find the lead we're deleting
      const oldLead = prevLeads.find(l => l.id === lead.id);
      
      // Remove the lead
      const updatedLeads = prevLeads.filter(l => l.id !== lead.id);
      
      // Update stats
      if (oldLead && leadStats) {
        // Decrement the status count
        const statusCount = leadStats.leads_by_status[oldLead.status] || 0;
        
        setLeadStats({
          ...leadStats,
          total_leads: Math.max(0, leadStats.total_leads - 1),
          new_leads_period: Math.max(0, leadStats.new_leads_period - 1),
          leads_by_status: {
            ...leadStats.leads_by_status,
            [oldLead.status]: Math.max(0, statusCount - 1)
          }
        });
      }
      
      return updatedLeads;
    });
  };
  
  // Contacts handlers
  const handleContactInsert = (contact: Contact) => {
    setContacts(prevContacts => {
      // Make sure we don't duplicate
      const exists = prevContacts.some(c => c.id === contact.id);
      if (exists) return prevContacts;
      
      // Add new contact
      return [...prevContacts, contact];
    });
  };
  
  const handleContactUpdate = (contact: Contact) => {
    setContacts(prevContacts => 
      prevContacts.map(c => c.id === contact.id ? contact : c)
    );
  };
  
  const handleContactDelete = (contact: Contact) => {
    setContacts(prevContacts => 
      prevContacts.filter(c => c.id !== contact.id)
    );
  };
  
  // Subscribe to resource updates
  const subscribeToCompanies = (handler: WebSocketEventHandler) => {
    websocketService.subscribe(COMPANIES_CHANNEL, handler);
  };
  
  const subscribeToLeads = (handler: WebSocketEventHandler) => {
    websocketService.subscribe(LEADS_CHANNEL, handler);
  };
  
  const subscribeToContacts = (handler: WebSocketEventHandler) => {
    websocketService.subscribe(CONTACTS_CHANNEL, handler);
  };
  
  // Unsubscribe from resource updates
  const unsubscribeFromCompanies = (handler: WebSocketEventHandler) => {
    websocketService.unsubscribe(COMPANIES_CHANNEL, handler);
  };
  
  const unsubscribeFromLeads = (handler: WebSocketEventHandler) => {
    websocketService.unsubscribe(LEADS_CHANNEL, handler);
  };
  
  const unsubscribeFromContacts = (handler: WebSocketEventHandler) => {
    websocketService.unsubscribe(CONTACTS_CHANNEL, handler);
  };
  
  // Update lead stats
  const updateLeadStats = (stats: LeadStats) => {
    setLeadStats(stats);
  };
  
  // Set up default subscriptions for internal cache updates
  useEffect(() => {
    if (isConnected) {
      // Subscribe to companies updates
      subscribeToCompanies((data) => {
        if (data.event === 'INSERT') {
          handleCompanyInsert(data.new);
        } else if (data.event === 'UPDATE') {
          handleCompanyUpdate(data.new);
        } else if (data.event === 'DELETE') {
          handleCompanyDelete(data.old);
        }
      });
      
      // Subscribe to leads updates
      subscribeToLeads((data) => {
        if (data.event === 'INSERT') {
          handleLeadInsert(data.new);
        } else if (data.event === 'UPDATE') {
          handleLeadUpdate(data.new);
        } else if (data.event === 'DELETE') {
          handleLeadDelete(data.old);
        }
      });
      
      // Subscribe to contacts updates
      subscribeToContacts((data) => {
        if (data.event === 'INSERT') {
          handleContactInsert(data.new);
        } else if (data.event === 'UPDATE') {
          handleContactUpdate(data.new);
        } else if (data.event === 'DELETE') {
          handleContactDelete(data.old);
        }
      });
      
      // Clean up subscriptions on unmount
      return () => {
        websocketService.unsubscribe(COMPANIES_CHANNEL);
        websocketService.unsubscribe(LEADS_CHANNEL);
        websocketService.unsubscribe(CONTACTS_CHANNEL);
      };
    }
  }, [isConnected]);
  
  // Context value
  const value: RealtimeContextValue = {
    isConnected,
    subscribeToCompanies,
    subscribeToLeads,
    subscribeToContacts,
    unsubscribeFromCompanies,
    unsubscribeFromLeads,
    unsubscribeFromContacts,
    companies,
    leads,
    contacts,
    leadStats,
    updateLeadStats,
  };
  
  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
};

// Hook for consuming the context
export const useRealtime = () => useContext(RealtimeContext);

export default RealtimeContext;