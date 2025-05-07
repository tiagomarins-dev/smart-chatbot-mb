import React from 'react';
import { LeadEvent } from '../../interfaces';

interface LeadEventTimelineProps {
  events: LeadEvent[];
  loading: boolean;
}

const LeadEventTimeline: React.FC<LeadEventTimelineProps> = ({ events, loading }) => {
  // Helper function to format timestamp
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('pt-BR');
  };

  // Function to format date for grouping
  const formatDateGroup = (date: Date) => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Check if date is today
    if (date.toDateString() === now.toDateString()) {
      return 'Hoje';
    }
    // Check if date is yesterday
    else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    }
    // Otherwise return formatted date
    else {
      return date.toLocaleDateString('pt-BR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  // Helper function to get icon and color based on event type
  const getEventIconAndColor = (eventType: string, origin?: string) => {
    // Default
    let icon = "bi-info-circle-fill";
    let color = "#616161"; // Secondary color
    let bgColor = "rgba(97, 97, 97, 0.1)";
    
    // Handle event types
    switch (eventType) {
      case 'whatsapp_message':
        icon = "bi-whatsapp";
        color = "#66bb6a"; // Success color
        bgColor = "rgba(102, 187, 106, 0.1)";
        break;
      case 'form_submit':
        icon = "bi-file-earmark-text";
        color = "#7e57c2"; // Primary color
        bgColor = "rgba(126, 87, 194, 0.1)";
        break;
      case 'page_view':
        icon = "bi-eye";
        color = "#42a5f5"; // Info color
        bgColor = "rgba(66, 165, 245, 0.1)";
        break;
      case 'email_sent':
        icon = "bi-envelope";
        color = "#ffb74d"; // Warning color
        bgColor = "rgba(255, 183, 77, 0.1)";
        break;
      case 'email_opened':
        icon = "bi-envelope-open";
        color = "#66bb6a"; // Success color
        bgColor = "rgba(102, 187, 106, 0.1)";
        break;
      case 'status_change':
        icon = "bi-arrow-right-circle";
        color = "#7e57c2"; // Primary color
        bgColor = "rgba(126, 87, 194, 0.1)";
        break;
      case 'call':
        icon = "bi-telephone";
        color = "#ef5350"; // Danger color
        bgColor = "rgba(239, 83, 80, 0.1)";
        break;
      default:
        // If no match on event type, check origin
        if (origin) {
          switch (origin.toLowerCase()) {
            case 'whatsapp':
              icon = "bi-whatsapp";
              color = "#66bb6a"; // Success color
              bgColor = "rgba(102, 187, 106, 0.1)";
              break;
            case 'website':
              icon = "bi-globe";
              color = "#42a5f5"; // Info color
              bgColor = "rgba(66, 165, 245, 0.1)";
              break;
            case 'email':
              icon = "bi-envelope";
              color = "#ffb74d"; // Warning color
              bgColor = "rgba(255, 183, 77, 0.1)";
              break;
            case 'phone':
              icon = "bi-telephone";
              color = "#ef5350"; // Danger color
              bgColor = "rgba(239, 83, 80, 0.1)";
              break;
            case 'api':
              icon = "bi-code-slash";
              color = "#616161"; // Secondary color
              bgColor = "rgba(97, 97, 97, 0.1)";
              break;
          }
        }
    }
    
    return { icon, color, bgColor };
  };

  // Helper function to get event title
  const getEventTitle = (event: LeadEvent) => {
    switch (event.event_type) {
      case 'whatsapp_message':
        return 'Mensagem WhatsApp';
      case 'form_submit':
        return 'Formulário Enviado';
      case 'page_view':
        return `Página Visualizada`;
      case 'email_sent':
        return 'Email Enviado';
      case 'email_opened':
        return 'Email Aberto';
      case 'status_change':
        return 'Status Alterado';
      case 'call':
        return 'Chamada Telefônica';
      default:
        // Format event type to be more readable (convert snake_case to Title Case)
        const translations: Record<string, string> = {
          'message_sent': 'Mensagem Enviada',
          'message_received': 'Mensagem Recebida',
          'contact_attempt': 'Tentativa de Contato',
          'note_added': 'Anotação Adicionada',
          'file_uploaded': 'Arquivo Enviado',
          'appointment_scheduled': 'Agendamento Marcado'
        };
        
        // Return translation if available, otherwise format
        return translations[event.event_type] || event.event_type
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
    }
  };

  // Helper function to get event description
  const getEventDescription = (event: LeadEvent) => {
    // Process based on event_type
    switch (event.event_type) {
      case 'whatsapp_message':
        return event.event_data.message || 'Mensagem trocada via WhatsApp';
      case 'form_submit':
        return event.event_data.message || `Formulário enviado ${event.event_data.form_name ? `(${event.event_data.form_name})` : ''}`;
      case 'page_view':
        return event.event_data.page_url || 'Lead visualizou uma página no site';
      case 'email_sent':
        return event.event_data.subject 
          ? `Email enviado: ${event.event_data.subject}` 
          : 'Email enviado para o lead';
      case 'email_opened':
        return event.event_data.subject 
          ? `Lead abriu email: ${event.event_data.subject}` 
          : 'Lead abriu um email';
      case 'status_change':
        // Tradução de status
        const translateStatus = (status: string): string => {
          const statusMap: Record<string, string> = {
            'novo': 'Novo',
            'qualificado': 'Qualificado',
            'contatado': 'Contatado',
            'convertido': 'Convertido',
            'desistiu': 'Desistiu',
            'inativo': 'Inativo'
          };
          return statusMap[status] || status;
        };
        
        if (event.event_data.old_status && event.event_data.new_status) {
          return `Status alterado de "${translateStatus(event.event_data.old_status)}" para "${translateStatus(event.event_data.new_status)}"`;
        }
        return 'Status do lead foi atualizado';
      case 'call':
        return event.event_data.duration 
          ? `Duração da chamada: ${event.event_data.duration} segundos` 
          : 'Chamada telefônica com o lead';
      default:
        // Return any available message or generic description
        return event.event_data.message || event.event_data.content || 'Evento de lead registrado';
    }
  };

  // Group events by date
  const groupEventsByDate = (eventsList: LeadEvent[]) => {
    const groups: {[key: string]: LeadEvent[]} = {};
    
    eventsList.forEach(event => {
      const date = new Date(event.created_at);
      const dateKey = formatDateGroup(date);
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      
      groups[dateKey].push(event);
    });
    
    return groups;
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status" style={{ color: '#7e57c2', width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Carregando...</span>
        </div>
        <p className="mt-3 text-muted">Carregando linha do tempo de atividades...</p>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-5">
        <div className="p-3 rounded-circle mx-auto mb-3" style={{ backgroundColor: 'rgba(126, 87, 194, 0.1)', width: 'fit-content' }}>
          <i className="bi bi-calendar-x fs-1" style={{ color: '#7e57c2' }}></i>
        </div>
        <h5 className="mb-2">Nenhuma Atividade Ainda</h5>
        <p className="text-muted mb-0">Não há eventos registrados para este lead.</p>
      </div>
    );
  }

  // Group events by date
  const eventGroups = groupEventsByDate(events);

  return (
    <div className="lead-timeline p-0 p-md-3">
      {Object.entries(eventGroups).map(([dateGroup, groupEvents]) => (
        <div key={dateGroup} className="timeline-group mb-4">
          <div className="timeline-date mb-3">
            <span className="badge" style={{ backgroundColor: 'rgba(126, 87, 194, 0.1)', color: '#7e57c2', fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
              {dateGroup}
            </span>
          </div>
          
          <div className="timeline-events">
            {groupEvents.map((event) => {
              const { icon, color, bgColor } = getEventIconAndColor(event.event_type, event.origin);
              const eventTime = new Date(event.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
              
              return (
                <div key={event.id} className="timeline-event mb-4 card border-0 shadow-sm">
                  <div className="card-body p-3">
                    <div className="d-flex">
                      <div className="timeline-icon me-3">
                        <div className="rounded-circle p-2" style={{ backgroundColor: bgColor, width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className={`bi ${icon}`} style={{ color: color, fontSize: '1.1rem' }}></i>
                        </div>
                      </div>
                      
                      <div className="timeline-content flex-grow-1">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <h6 className="mb-0 fw-semibold">{getEventTitle(event)}</h6>
                          <span className="text-muted small">{eventTime}</span>
                        </div>
                        
                        <p className="mb-2 text-muted">{getEventDescription(event)}</p>
                        
                        {event.origin && (
                          <div className="mt-2">
                            <span className="badge" style={{ backgroundColor: bgColor, color: color, fontWeight: 'normal' }}>
                              {event.origin}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default LeadEventTimeline;