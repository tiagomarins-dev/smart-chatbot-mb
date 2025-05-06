import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Contact } from '../../interfaces';
import { useRealtime } from '../../contexts/RealtimeContext';
import { useAuth } from '../../contexts/AuthContext';

// Import the API client if it exists
let contactsApi: any;
try {
  contactsApi = require('../../api/contacts').default;
} catch (error) {
  console.warn('ContactsApi not available, using mock data');
}

const ContactsList: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  
  // Get realtime context
  const { isConnected, subscribeToContacts, unsubscribeFromContacts } = useRealtime();
  
  // Track if we have real-time updates enabled
  const [hasRealTimeUpdates, setHasRealTimeUpdates] = useState(false);

  // Initial data fetch
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setLoading(true);
        if (contactsApi) {
          const response = await contactsApi.getContacts();
          
          if (response.success && response.data?.data) {
            setContacts(response.data.data);
          } else {
            setError(response.error || 'Failed to fetch contacts');
          }
        } else {
          // Mock data for development
          setTimeout(() => {
            setContacts([
              {
                id: '1',
                user_id: user?.id || '',
                phone_number: '+1234567890',
                name: 'John Doe',
                first_name: 'John',
                last_name: 'Doe',
                email: 'john@example.com',
                created_at: new Date().toISOString()
              },
              {
                id: '2',
                user_id: user?.id || '',
                phone_number: '+0987654321',
                name: 'Jane Smith',
                first_name: 'Jane',
                last_name: 'Smith',
                email: 'jane@example.com',
                created_at: new Date().toISOString()
              }
            ]);
          }, 1000);
        }
      } catch (err) {
        console.error('Error fetching contacts:', err);
        setError('An error occurred while fetching contacts');
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, [user]);
  
  // Set up real-time updates when connection is established
  useEffect(() => {
    if (isConnected && !hasRealTimeUpdates) {
      // Handler for contact events
      const handleContactEvent = (data: any) => {
        if (data.new) {
          const newContact = data.new as Contact;
          
          // Handle INSERT
          if (data.event === 'INSERT') {
            setContacts(prev => {
              // Check if we already have this contact (to avoid duplicates)
              const exists = prev.some(c => c.id === newContact.id);
              if (exists) return prev;
              
              return [...prev, newContact];
            });
          }
          
          // Handle UPDATE
          else if (data.event === 'UPDATE') {
            setContacts(prev => prev.map(c => c.id === newContact.id ? newContact : c));
          }
        }
        // Handle DELETE
        else if (data.event === 'DELETE' && data.old) {
          const oldContact = data.old as Contact;
          setContacts(prev => prev.filter(c => c.id !== oldContact.id));
        }
      };
      
      // Subscribe to all contact events
      subscribeToContacts(handleContactEvent);
      setHasRealTimeUpdates(true);
      
      // Cleanup when component unmounts
      return () => {
        unsubscribeFromContacts(handleContactEvent);
      };
    }
  }, [isConnected, hasRealTimeUpdates, subscribeToContacts, unsubscribeFromContacts]);

  const handleBlockContact = async (id: string) => {
    if (!window.confirm('Are you sure you want to block this contact?')) {
      return;
    }

    try {
      if (contactsApi) {
        const response = await contactsApi.blockContact(id);
        
        if (response.success) {
          // With real-time updates, the state will be updated automatically
          // But we'll also update it directly for immediate feedback
          if (!hasRealTimeUpdates) {
            setContacts(contacts.map(contact => 
              contact.id === id ? { ...contact, is_blocked: true } : contact
            ));
          }
        } else {
          setError(response.error || 'Failed to block contact');
        }
      } else {
        // Mock update for development
        setContacts(contacts.map(contact => 
          contact.id === id ? { ...contact, is_blocked: true } : contact
        ));
      }
    } catch (err) {
      console.error('Error blocking contact:', err);
      setError('An error occurred while blocking the contact');
    }
  };

  if (loading) {
    return <div className="text-center py-5"><div className="spinner-border"></div></div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  if (contacts.length === 0) {
    return (
      <div className="text-center py-5">
        <p className="mb-4">No contacts found</p>
        <Link href="/contacts/new" className="btn btn-primary">
          Add New Contact
        </Link>
      </div>
    );
  }
  
  // Sort contacts by last message time or creation date (newest first)
  const sortedContacts = [...contacts].sort((a, b) => {
    const dateA = a.last_message_at || a.created_at;
    const dateB = b.last_message_at || b.created_at;
    
    if (!dateA) return 1;
    if (!dateB) return -1;
    
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          Contacts
          {isConnected && hasRealTimeUpdates && (
            <span className="badge bg-success ms-2" style={{ fontSize: '0.5em', verticalAlign: 'middle' }}>
              <i className="bi bi-lightning-fill me-1"></i>
              Live
            </span>
          )}
        </h2>
        <Link href="/contacts/new" className="btn btn-primary">
          Add Contact
        </Link>
      </div>
      
      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Last Contact</th>
              <th>Status</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedContacts.map((contact) => (
              <tr key={contact.id}>
                <td>
                  <Link href={`/contacts/${contact.id}`}>
                    {contact.name || `${contact.first_name || ''} ${contact.last_name || ''}`}
                  </Link>
                </td>
                <td>{contact.phone_number}</td>
                <td>{contact.email || 'N/A'}</td>
                <td>
                  {contact.last_message_at
                    ? new Date(contact.last_message_at).toLocaleDateString()
                    : 'Never'}
                </td>
                <td>
                  {contact.is_blocked ? (
                    <span className="badge bg-danger">Blocked</span>
                  ) : (
                    <span className="badge bg-success">Active</span>
                  )}
                </td>
                <td className="text-end">
                  <div className="btn-group">
                    <Link
                      href={`/contacts/${contact.id}/edit`}
                      className="btn btn-sm btn-outline-primary"
                    >
                      Edit
                    </Link>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => contact.id && handleBlockContact(contact.id)}
                      disabled={contact.is_blocked}
                    >
                      {contact.is_blocked ? 'Blocked' : 'Block'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ContactsList;