import { useEffect, useState } from 'react';
import { automatedMessagesApi } from '../../api/automatedMessages';
import { MessageLog } from '../../interfaces';

interface LeadAutomatedMessagesProps {
  leadId: string;
}

const LeadAutomatedMessages: React.FC<LeadAutomatedMessagesProps> = ({ leadId }) => {
  const [messages, setMessages] = useState<MessageLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadMessages = async () => {
      if (!leadId) return;
      
      setIsLoading(true);
      setError('');
      
      try {
        const response = await automatedMessagesApi.getLeadMessageHistory(leadId);
        
        if (response.success && response.data) {
          setMessages(response.data.messages || []);
        } else {
          setError('Não foi possível carregar o histórico de mensagens automáticas.');
        }
      } catch (err) {
        console.error('Error loading automated messages', err);
        setError('Erro ao carregar mensagens automáticas.');
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [leadId]);

  if (isLoading) {
    return (
      <div className="text-center p-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        {error}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="alert alert-info">
        Nenhuma mensagem automatizada enviada para este lead.
      </div>
    );
  }

  return (
    <div className="lead-automated-messages">
      <h4 className="mb-3">Mensagens Automatizadas</h4>
      
      <div className="list-group">
        {messages.map((message) => (
          <div key={message.id} className="list-group-item list-group-item-action">
            <div className="d-flex w-100 justify-content-between">
              <h5 className="mb-1">Mensagem Enviada</h5>
              <small className="text-muted">
                {new Date(message.sent_at).toLocaleString('pt-BR')}
              </small>
            </div>
            <p className="mb-1">{message.content}</p>
            <div className="d-flex justify-content-between align-items-center mt-2">
              <div>
                <span className={`badge ${message.was_read ? 'bg-success' : 'bg-secondary'} me-2`}>
                  {message.was_read ? 'Lida' : 'Não Lida'}
                </span>
                <span className={`badge ${message.had_response ? 'bg-primary' : 'bg-secondary'}`}>
                  {message.had_response ? 'Respondida' : 'Sem Resposta'}
                </span>
              </div>
              <small className="text-muted">
                {message.event_id ? 'Acionada por evento' : 'Mensagem programada'}
              </small>
            </div>
            
            {message.had_response && message.response_content && (
              <div className="mt-3 border-top pt-2">
                <small className="text-muted">Resposta:</small>
                <p className="mb-1 mt-1 ms-3 p-2 border-start border-primary ps-2">
                  {message.response_content}
                </p>
                {message.response_time && (
                  <small className="text-muted d-block text-end">
                    Respondido em: {new Date(message.response_time).toLocaleString('pt-BR')}
                  </small>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeadAutomatedMessages;