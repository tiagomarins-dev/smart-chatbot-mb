import React, { useState, useEffect, useRef } from 'react';
import whatsappApi from '../../api/whatsapp';
import { Lead } from '../../interfaces';

interface LeadWhatsAppChatProps {
  lead: Lead;
  isConnected: boolean;
}

interface WhatsAppMessage {
  id: string;
  body: string;
  from: string;
  to: string;
  fromMe: boolean;
  timestamp: string;
}

const LeadWhatsAppChat: React.FC<LeadWhatsAppChatProps> = ({ lead, isConnected }) => {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Get WhatsApp status
  useEffect(() => {
    const fetchWhatsAppStatus = async () => {
      try {
        const result = await whatsappApi.getStatus();
        if (result.success && result.data) {
          setPhoneNumber(result.data.phoneNumber);
        }
      } catch (err) {
        console.error("Error fetching WhatsApp status:", err);
      }
    };
    
    if (isConnected) {
      fetchWhatsAppStatus();
    }
  }, [isConnected]);
  
  // Clean phone numbers for comparison
  const cleanPhoneNumber = (phone: string) => {
    if (!phone) return '';
    // Remove @c.us suffix and all non-digit characters
    let cleaned = phone.replace('@c.us', '').replace(/\D/g, '');
    
    // For Brazilian numbers, consider removing country code if present
    if (cleaned.startsWith('55') && cleaned.length > 10) {
      console.log('Phone has Brazilian format with country code:', cleaned);
    }
    
    return cleaned;
  };
  
  // Format phone number for display
  const formatPhoneNumber = (phone: string | null) => {
    if (!phone) return '';
    
    // Formato brasileiro: +55 (21) 98786-8395
    if (phone.startsWith('55') && phone.length >= 12) {
      const ddd = phone.substring(2, 4);
      const firstPart = phone.substring(4, 9);
      const secondPart = phone.substring(9);
      return `+55 (${ddd}) ${firstPart}-${secondPart}`;
    }
    
    // Outros formatos - exibir com espaços para legibilidade
    return phone.replace(/(\d{2})(\d{2})(\d{5})(\d+)/, '+$1 ($2) $3-$4');
  };
  
  // Check if a number belongs to the current lead
  const isLeadPhone = (phone: string) => {
    if (!lead.phone) return false;
    if (!phone) return false;
    
    console.log(`Comparing phones: Lead=${lead.phone}, Message=${phone}`);
    
    const cleanLeadPhone = cleanPhoneNumber(lead.phone);
    const cleanPhoneToCheck = cleanPhoneNumber(phone.replace('@c.us', ''));
    
    console.log(`Clean phones: Lead=${cleanLeadPhone}, Message=${cleanPhoneToCheck}`);
    
    // Check if numbers match with various formats:
    // 1. Exact match
    // 2. Lead phone ends with message phone (lead has country code, message doesn't)
    // 3. Message phone ends with lead phone (message has country code, lead doesn't)
    // 4. Match by last 8 or 9 digits (mobile numbers in Brazil)
    const isMatch = 
      cleanLeadPhone === cleanPhoneToCheck ||
      cleanLeadPhone.endsWith(cleanPhoneToCheck) ||
      cleanPhoneToCheck.endsWith(cleanLeadPhone) ||
      (cleanLeadPhone.length >= 8 && cleanPhoneToCheck.endsWith(cleanLeadPhone.slice(-8))) ||
      (cleanLeadPhone.length >= 9 && cleanPhoneToCheck.endsWith(cleanLeadPhone.slice(-9))) ||
      (cleanPhoneToCheck.length >= 8 && cleanLeadPhone.endsWith(cleanPhoneToCheck.slice(-8))) ||
      (cleanPhoneToCheck.length >= 9 && cleanLeadPhone.endsWith(cleanPhoneToCheck.slice(-9)));
    
    console.log(`Phone match result: ${isMatch}`);
    return isMatch;
  };
  
  // Fetch messages for this lead
  const fetchMessages = async () => {
    try {
      setLoading(true);
      console.log(`Fetching WhatsApp messages for lead ${lead.id} (${lead.name})...`);
      
      // Add debugging to show current lead phone
      console.log(`Lead phone from state: ${lead.phone}`);
      
      // Try to get messages specifically for this contact
      const cleanedPhone = cleanPhoneNumber(lead.phone);
      console.log(`Fetching messages for phone: ${cleanedPhone}`);
      
      // First try to get messages directly from this contact
      if (cleanedPhone) {
        try {
          console.log(`Attempting to get messages specifically for number: ${cleanedPhone}`);
          const contactMessagesResult = await whatsappApi.getContactMessages(cleanedPhone);
          console.log('Contact messages API response:', contactMessagesResult);
          
          if (contactMessagesResult.success && contactMessagesResult.data) {
            let contactMessages = [];
            
            // Handle different response formats
            if (Array.isArray(contactMessagesResult.data)) {
              contactMessages = contactMessagesResult.data;
            } else if (contactMessagesResult.data.messages && Array.isArray(contactMessagesResult.data.messages)) {
              contactMessages = contactMessagesResult.data.messages;
            } else if (typeof contactMessagesResult.data === 'object') {
              // Try to extract messages from response
              const possibleMessages = Object.values(contactMessagesResult.data).find(val => Array.isArray(val));
              if (possibleMessages) {
                contactMessages = possibleMessages;
              }
            }
            
            console.log(`Found ${contactMessages.length} direct messages for contact`);
            
            if (contactMessages.length > 0) {
              // Sort messages by timestamp (newest first)
              contactMessages.sort((a, b) => {
                const timeA = new Date(a.timestamp || 0).getTime();
                const timeB = new Date(b.timestamp || 0).getTime();
                return timeB - timeA;
              });
              
              setMessages(contactMessages);
              setLastUpdated(new Date());
              setLoading(false);
              return;
            }
          }
          console.log('No specific messages found for this contact, using alternative method');
        } catch (err) {
          console.error('Error fetching contact-specific messages:', err);
          // Continue with fallback method
        }
      }
      
      // Fallback: Get all messages and filter by this lead's phone number
      console.log('Falling back to fetching and filtering all messages');
      const allMessagesResult = await whatsappApi.getMessages();
      
      if (allMessagesResult.success && allMessagesResult.data) {
        // Log API response
        console.log("WhatsApp API response:", allMessagesResult.data);
        console.log("Response structure:", Object.keys(allMessagesResult.data));
        
        let leadMessages: WhatsAppMessage[] = [];
        
        // Handle different response formats
        if (Array.isArray(allMessagesResult.data)) {
          console.log("Processing array response format...");
          // Filter messages to only show this lead's messages
          leadMessages = allMessagesResult.data.filter(msg => {
            const matchFrom = isLeadPhone(msg.from);
            const matchTo = isLeadPhone(msg.to);
            console.log(`Message ${msg.id}: from=${msg.from}, to=${msg.to}, matches=${matchFrom || matchTo}`);
            
            return matchFrom || matchTo;
          });
        } else if (allMessagesResult.data.messages && typeof allMessagesResult.data.messages === 'object') {
          console.log("Processing grouped messages format...");
          // Handle grouped messages format
          const messagesObj = allMessagesResult.data.messages;
          console.log("Available phone numbers:", Object.keys(messagesObj));
          
          // Only get messages from the lead's phone number
          for (const [phoneNumber, msgs] of Object.entries(messagesObj)) {
            console.log(`Checking phone number: ${phoneNumber}`);
            const isMatch = isLeadPhone(phoneNumber);
            console.log(`Match result for ${phoneNumber}: ${isMatch}`);
            
            if (isMatch && Array.isArray(msgs)) {
              console.log(`Adding ${msgs.length} messages from ${phoneNumber}`);
              leadMessages = [...leadMessages, ...msgs];
            }
          }
        }
        
        console.log(`Found ${leadMessages.length} messages for this lead`);
        
        // Sort messages by timestamp (newest first)
        leadMessages.sort((a, b) => {
          const timeA = new Date(a.timestamp || 0).getTime();
          const timeB = new Date(b.timestamp || 0).getTime();
          return timeB - timeA;
        });
        
        // Check for new messages
        if (lastUpdated && leadMessages.length > messages.length) {
          console.log("Detected potentially new messages");
          const currentNewestTime = messages.length > 0 
            ? new Date(messages[0]?.timestamp || 0).getTime() 
            : 0;
            
          const hasNew = leadMessages.some(msg => 
            !msg.fromMe && new Date(msg.timestamp || 0).getTime() > currentNewestTime
          );
          
          if (hasNew) {
            console.log("New incoming messages detected!");
            setHasNewMessages(true);
            setTimeout(() => setHasNewMessages(false), 3000);
          }
        }
        
        setMessages(leadMessages);
        setLastUpdated(new Date());
      } else {
        console.error("API response error:", allMessagesResult.error);
      }
    } catch (err) {
      console.error("Error fetching messages for lead:", err);
      setError("Não foi possível carregar as mensagens do WhatsApp");
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch messages initially and set up polling
  useEffect(() => {
    if (isConnected && lead.phone) {
      console.log('Setting up WhatsApp message polling for lead:', lead.id, 'with phone:', lead.phone);
      fetchMessages();
      
      // Set up polling for messages
      const interval = setInterval(() => {
        console.log('Polling for WhatsApp messages...');
        fetchMessages();
      }, 5000); // Poll every 5 seconds for more responsive updates
      
      return () => {
        console.log('Clearing WhatsApp message polling interval');
        clearInterval(interval);
      };
    }
  }, [isConnected, lead.phone]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);
  
  // Send message to lead
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !lead.phone || !isConnected) return;
    
    try {
      setSending(true);
      setError(null);
      
      // Send message via API
      const result = await whatsappApi.sendMessage(
        cleanPhoneNumber(lead.phone),
        newMessage,
        lead.id
      );
      
      if (result.success) {
        setNewMessage('');
        fetchMessages(); // Refresh messages
      } else {
        setError(result.error || "Falha ao enviar mensagem");
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Erro ao enviar mensagem");
    } finally {
      setSending(false);
    }
  };
  
  // If phone number or WhatsApp connection is missing
  if (!isConnected) {
    return (
      <div className="card border-0 shadow-sm h-100">
        <div className="card-header d-flex align-items-center" style={{ backgroundColor: 'white' }}>
          <i className="bi bi-whatsapp me-2 text-success"></i>
          <h5 className="mb-0">Chat WhatsApp</h5>
        </div>
        <div className="card-body d-flex flex-column justify-content-center align-items-center py-5">
          <div className="p-3 rounded-circle bg-light mb-3">
            <i className="bi bi-wifi-off fs-2 text-muted"></i>
          </div>
          <h5 className="mb-2">WhatsApp não conectado</h5>
          <p className="text-muted text-center mb-3">
            É necessário conectar ao WhatsApp para visualizar e enviar mensagens.
          </p>
          <a href="/whatsapp" className="btn btn-outline-success">
            <i className="bi bi-whatsapp me-2"></i>
            Conectar WhatsApp
          </a>
        </div>
      </div>
    );
  }
  
  if (!lead.phone) {
    return (
      <div className="card border-0 shadow-sm h-100">
        <div className="card-header d-flex align-items-center" style={{ backgroundColor: 'white' }}>
          <i className="bi bi-whatsapp me-2 text-success"></i>
          <h5 className="mb-0">Chat WhatsApp</h5>
        </div>
        <div className="card-body d-flex flex-column justify-content-center align-items-center py-5">
          <div className="p-3 rounded-circle bg-light mb-3">
            <i className="bi bi-telephone-x fs-2 text-muted"></i>
          </div>
          <h5 className="mb-2">Telefone não cadastrado</h5>
          <p className="text-muted text-center mb-3">
            Este lead não possui um número de telefone cadastrado para envio de mensagens.
          </p>
          <a href={`/leads/${lead.id}/edit`} className="btn btn-outline-primary">
            <i className="bi bi-pencil me-2"></i>
            Editar Lead
          </a>
        </div>
      </div>
    );
  }
  
  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-header d-flex align-items-center" style={{ backgroundColor: 'white' }}>
        <i className="bi bi-whatsapp me-2 text-success"></i>
        <div>
          <h5 className="mb-0">Chat WhatsApp</h5>
          {phoneNumber && (
            <small className="text-muted">
              De: {formatPhoneNumber(phoneNumber)} | Para: {formatPhoneNumber(lead.phone)}
            </small>
          )}
        </div>
        {hasNewMessages && (
          <span className="badge bg-success ms-auto animate__animated animate__pulse animate__infinite">
            Nova mensagem!
          </span>
        )}
      </div>
      
      <div 
        ref={messagesContainerRef}
        className={`card-body p-2 overflow-auto ${hasNewMessages ? 'border border-success' : ''}`} 
        style={{ 
          height: '350px', 
          backgroundColor: '#f5f5f5',
          transition: 'border-color 0.5s ease' 
        }}
      >
        {loading && messages.length === 0 ? (
          <div className="d-flex justify-content-center align-items-center h-100">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Carregando...</span>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="d-flex flex-column justify-content-center align-items-center h-100 text-center p-3">
            <div className="p-3 rounded-circle bg-light mb-3">
              <i className="bi bi-chat-left-text fs-2 text-muted"></i>
            </div>
            <h5 className="mb-2">Nenhuma mensagem</h5>
            <p className="text-muted">
              Não há conversas com este lead ainda. Envie uma mensagem para iniciar.
            </p>
          </div>
        ) : (
          <div className="messages-container">
            {/* Reverse messages array to show oldest first */}
            {[...messages].reverse().map(msg => {
              const isOutgoing = msg.fromMe;
              
              return (
                <div 
                  key={msg.id} 
                  className={`message-bubble mb-3 ${isOutgoing ? 'text-end' : ''}`}
                >
                  <div 
                    className={`d-inline-block p-3 rounded-3 ${
                      isOutgoing ? 'bg-success text-white' : 'bg-white text-dark'
                    }`}
                    style={{
                      maxWidth: '80%',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}
                  >
                    <div className="message-body">
                      {msg.body}
                    </div>
                    <div className="message-footer mt-1">
                      <small className={isOutgoing ? 'text-white-50' : 'text-muted'}>
                        {new Date(msg.timestamp).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </small>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <div className="card-footer" style={{ backgroundColor: 'white' }}>
        {error && (
          <div className="alert alert-danger py-2 mb-2">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSendMessage} className="d-flex">
          <input
            type="text"
            className="form-control me-2"
            placeholder="Digite uma mensagem..."
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            disabled={sending}
          />
          <button 
            type="submit" 
            className="btn btn-success"
            disabled={!newMessage.trim() || sending}
          >
            {sending ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            ) : (
              <i className="bi bi-send"></i>
            )}
          </button>
        </form>
        
        {lastUpdated && (
          <div className="text-center mt-2">
            <small className="text-muted">
              Última atualização: {lastUpdated.toLocaleString('pt-BR')}
            </small>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadWhatsAppChat;