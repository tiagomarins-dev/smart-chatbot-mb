import React, { useEffect, useState } from 'react';
import { useRealtime } from '../../contexts/RealtimeContext';
import { Company, Lead, Contact } from '../../interfaces';

interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  entityType: 'connection' | 'company' | 'lead' | 'contact';
  timestamp: Date;
}

const RealtimeNotifications: React.FC = () => {
  const { isConnected, subscribeToCompanies, subscribeToLeads, subscribeToContacts } = useRealtime();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const maxNotifications = 10;

  // Add a notification
  const addNotification = (
    message: string, 
    type: 'info' | 'success' | 'warning' | 'danger' = 'info',
    entityType: 'connection' | 'company' | 'lead' | 'contact' = 'connection'
  ) => {
    setNotifications(prev => {
      const newNotifications = [
        {
          id: Math.random().toString(36).substring(2, 11),
          message,
          type,
          entityType,
          timestamp: new Date()
        },
        ...prev
      ];
      
      // Keep only the latest notifications
      return newNotifications.slice(0, maxNotifications);
    });
  };

  // Remove a notification
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Format relative time
  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);
    
    if (diffSeconds < 60) {
      return `${diffSeconds} segundos atrás`;
    }
    
    const diffMinutes = Math.round(diffSeconds / 60);
    if (diffMinutes < 60) {
      return `${diffMinutes} minuto${diffMinutes !== 1 ? 's' : ''} atrás`;
    }
    
    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) {
      return `${diffHours} hora${diffHours !== 1 ? 's' : ''} atrás`;
    }
    
    return date.toLocaleString();
  };

  // Subscribe to real-time updates
  useEffect(() => {
    if (!isConnected) return;
    
    // Add notification for connection
    addNotification('Conexão em tempo real estabelecida', 'success', 'connection');
    
    // Handle company updates
    const handleCompanyUpdate = (data: any) => {
      const company = data.new || data.old;
      
      let message = '';
      let type: 'info' | 'success' | 'warning' | 'danger' = 'info';
      
      switch (data.event) {
        case 'INSERT':
          message = `Nova empresa adicionada: ${company.name}`;
          type = 'success';
          break;
        case 'UPDATE':
          message = `Empresa atualizada: ${company.name}`;
          type = 'info';
          break;
        case 'DELETE':
          message = `Empresa removida: ${company.name}`;
          type = 'warning';
          break;
      }
      
      addNotification(message, type, 'company');
    };
    
    // Handle lead updates
    const handleLeadUpdate = (data: any) => {
      const lead = data.new || data.old;
      
      let message = '';
      let type: 'info' | 'success' | 'warning' | 'danger' = 'info';
      
      switch (data.event) {
        case 'INSERT':
          message = `Novo lead capturado: ${lead.name}`;
          type = 'success';
          break;
        case 'UPDATE':
          message = `Lead atualizado: ${lead.name}`;
          type = 'info';
          break;
        case 'DELETE':
          message = `Lead removido: ${lead.name}`;
          type = 'warning';
          break;
      }
      
      addNotification(message, type, 'lead');
    };
    
    // Handle contact updates
    const handleContactUpdate = (data: any) => {
      const contact = data.new || data.old;
      
      let message = '';
      let type: 'info' | 'success' | 'warning' | 'danger' = 'info';
      
      switch (data.event) {
        case 'INSERT':
          message = `Novo contato adicionado: ${contact.name || contact.phone_number}`;
          type = 'success';
          break;
        case 'UPDATE':
          message = `Contato atualizado: ${contact.name || contact.phone_number}`;
          type = 'info';
          break;
        case 'DELETE':
          message = `Contato removido: ${contact.name || contact.phone_number}`;
          type = 'warning';
          break;
      }
      
      addNotification(message, type, 'contact');
    };
    
    // Subscribe to updates
    subscribeToCompanies(handleCompanyUpdate);
    subscribeToLeads(handleLeadUpdate);
    subscribeToContacts(handleContactUpdate);
    
    // Clean up
    return () => {
      // No need to unsubscribe, the context will handle it
    };
  }, [isConnected]);

  // Auto-hide notifications after 5 seconds
  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        // Remove the oldest notification
        setNotifications(prev => prev.slice(0, prev.length - 1));
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [notifications]);

  // Badge count for notification icon
  const notificationCount = notifications.length;
  
  // Function to get entity icon
  const getEntityIcon = (entityType: 'connection' | 'company' | 'lead' | 'contact') => {
    switch (entityType) {
      case 'connection':
        return 'bi-lightning-fill';
      case 'company':
        return 'bi-building';
      case 'lead':
        return 'bi-person-plus-fill';
      case 'contact':
        return 'bi-person-lines-fill';
      default:
        return 'bi-bell-fill';
    }
  };
  
  // Function to get entity notification class
  const getEntityClass = (entityType: 'connection' | 'company' | 'lead' | 'contact') => {
    switch (entityType) {
      case 'lead':
        return 'notification-leads';
      case 'company':
        return 'notification-companies';
      case 'contact':
        return 'notification-contacts';
      default:
        return '';
    }
  };

  return (
    <>
      {/* Notification icon */}
      <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 1050 }}>
        <button 
          className="btn btn-outline-primary position-relative" 
          onClick={() => setShowNotifications(!showNotifications)}
        >
          <i className="bi bi-bell"></i>
          {notificationCount > 0 && (
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
              {notificationCount}
              <span className="visually-hidden">notificações não lidas</span>
            </span>
          )}
        </button>
      </div>
      
      {/* Notification drawer */}
      {showNotifications && (
        <div 
          className="position-fixed top-0 end-0 p-3 shadow" 
          style={{ 
            zIndex: 1040, 
            width: '350px', 
            maxWidth: '100%',
            maxHeight: '80vh',
            overflow: 'auto',
            marginTop: '50px',
            borderRadius: '0.5rem',
          }}
        >
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Notificações</h5>
            <button 
              className="btn-close" 
              onClick={() => setShowNotifications(false)}
              aria-label="Close"
            ></button>
          </div>
          
          {notifications.length === 0 ? (
            <p className="text-muted">Nenhuma notificação</p>
          ) : (
            <div className="d-flex flex-column gap-3">
              {notifications.map(notification => (
                <div 
                  key={notification.id}
                  className="card border-0 shadow-sm"
                >
                  <div className="card-body p-3">
                    <div className="d-flex">
                      <div className={`notification-icon ${getEntityClass(notification.entityType)}`}>
                        <i className={`bi ${getEntityIcon(notification.entityType)}`}></i>
                      </div>
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-start">
                          <p className="mb-1 fw-medium">{notification.message}</p>
                          <button 
                            className="btn-close btn-sm" 
                            onClick={() => removeNotification(notification.id)}
                            aria-label="Close"
                            style={{ fontSize: '0.65rem' }}
                          ></button>
                        </div>
                        <small className="text-muted">{formatRelativeTime(notification.timestamp)}</small>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Floating toast for new notifications */}
      {notifications.length > 0 && !showNotifications && (
        <div className="toast-container">
          <div 
            className="toast show shadow-sm" 
            role="alert" 
            aria-live="assertive" 
            aria-atomic="true"
          >
            <div className="toast-header">
              <div className={`notification-icon ${getEntityClass(notifications[0].entityType)} me-2`} style={{ width: 24, height: 24 }}>
                <i className={`bi ${getEntityIcon(notifications[0].entityType)}`} style={{ fontSize: '0.8rem' }}></i>
              </div>
              <strong className="me-auto">Notificação</strong>
              <small>{formatRelativeTime(notifications[0].timestamp)}</small>
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => removeNotification(notifications[0].id)}
                aria-label="Close"
              ></button>
            </div>
            <div className="toast-body">
              {notifications[0].message}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RealtimeNotifications;