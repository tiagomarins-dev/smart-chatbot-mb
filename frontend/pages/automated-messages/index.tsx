import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../src/components/layout/Layout';
import { automatedMessagesApi } from '../../src/api/automatedMessages';
import { MessageTemplate, EventTrigger } from '../../src/interfaces';
import Link from 'next/link';

const AutomatedMessagesPage = () => {
  const router = useRouter();
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [events, setEvents] = useState<EventTrigger[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('templates');
  const [currentProjectId, setCurrentProjectId] = useState<string>('');

  useEffect(() => {
    // Get query params
    const { projectId } = router.query;
    
    if (projectId && typeof projectId === 'string') {
      setCurrentProjectId(projectId);
      loadData(projectId);
    } else {
      setError('Selecione um projeto para gerenciar mensagens automatizadas');
      setIsLoading(false);
    }
  }, [router.query]);

  const loadData = async (projectId: string) => {
    setIsLoading(true);
    setError('');
    
    try {
      const [templatesResponse, eventsResponse] = await Promise.all([
        automatedMessagesApi.getTemplates(projectId),
        automatedMessagesApi.getEventTriggers(projectId)
      ]);
      
      if (templatesResponse.success && templatesResponse.data) {
        setTemplates(templatesResponse.data.templates || []);
      }
      
      if (eventsResponse.success && eventsResponse.data) {
        setEvents(eventsResponse.data.events || []);
      }
    } catch (err) {
      console.error('Error loading automated messages data', err);
      setError('Erro ao carregar dados de mensagens automatizadas. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (confirm('Tem certeza que deseja excluir este modelo de mensagem?')) {
      try {
        const response = await automatedMessagesApi.deleteTemplate(templateId);
        if (response.success) {
          setTemplates(templates.filter(template => template.id !== templateId));
        } else {
          alert('Erro ao excluir modelo: ' + (response.message || 'Tente novamente'));
        }
      } catch (err) {
        console.error('Error deleting template', err);
        alert('Erro ao excluir modelo. Tente novamente.');
      }
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (confirm('Tem certeza que deseja excluir este gatilho de evento?')) {
      try {
        const response = await automatedMessagesApi.deleteEventTrigger(eventId);
        if (response.success) {
          setEvents(events.filter(event => event.id !== eventId));
        } else {
          alert('Erro ao excluir evento: ' + (response.message || 'Tente novamente'));
        }
      } catch (err) {
        console.error('Error deleting event', err);
        alert('Erro ao excluir evento. Tente novamente.');
      }
    }
  };

  const renderTemplatesTab = () => (
    <div className="table-responsive">
      <div className="d-flex justify-content-between mb-3">
        <h3>Modelos de Mensagens</h3>
        <button
          className="btn btn-primary"
          onClick={() => router.push(`/automated-messages/templates/new?projectId=${currentProjectId}`)}
        >
          Criar Novo Modelo
        </button>
      </div>
      
      {templates.length === 0 ? (
        <div className="alert alert-info">
          Nenhum modelo de mensagem encontrado para este projeto. Crie um novo modelo para começar.
        </div>
      ) : (
        <table className="table table-hover table-bordered">
          <thead className="table-light">
            <tr>
              <th>Nome</th>
              <th>Descrição</th>
              <th>Score Mínimo</th>
              <th>Score Máximo</th>
              <th>Sentimento Min</th>
              <th>Sentimento Max</th>
              <th>Envios Máximos</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {templates.map(template => (
              <tr key={template.id}>
                <td>{template.name}</td>
                <td>{template.description}</td>
                <td>{template.min_lead_score || '-'}</td>
                <td>{template.max_lead_score || '-'}</td>
                <td>{template.min_sentiment || '-'}</td>
                <td>{template.max_sentiment || '-'}</td>
                <td>{template.max_sends_per_lead}</td>
                <td>
                  <span className={`badge ${template.active ? 'bg-success' : 'bg-danger'}`}>
                    {template.active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td>
                  <div className="btn-group">
                    <Link href={`/automated-messages/templates/${template.id}?projectId=${currentProjectId}`}>
                      <button className="btn btn-sm btn-info" title="Ver detalhes">
                        <i className="fas fa-eye"></i>
                      </button>
                    </Link>
                    <Link href={`/automated-messages/templates/${template.id}/edit?projectId=${currentProjectId}`}>
                      <button className="btn btn-sm btn-warning" title="Editar">
                        <i className="fas fa-edit"></i>
                      </button>
                    </Link>
                    <button
                      className="btn btn-sm btn-danger"
                      title="Excluir"
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  const renderEventsTab = () => (
    <div className="table-responsive">
      <div className="d-flex justify-content-between mb-3">
        <h3>Gatilhos de Eventos</h3>
        <button
          className="btn btn-primary"
          onClick={() => router.push(`/automated-messages/events/new?projectId=${currentProjectId}`)}
        >
          Criar Novo Gatilho
        </button>
      </div>
      
      {events.length === 0 ? (
        <div className="alert alert-info">
          Nenhum gatilho de evento encontrado para este projeto. Crie um novo gatilho para começar.
        </div>
      ) : (
        <table className="table table-hover table-bordered">
          <thead className="table-light">
            <tr>
              <th>Nome</th>
              <th>Tipo de Evento</th>
              <th>Descrição</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {events.map(event => (
              <tr key={event.id}>
                <td>{event.name}</td>
                <td>{event.event_type}</td>
                <td>{event.description}</td>
                <td>
                  <span className={`badge ${event.active ? 'bg-success' : 'bg-danger'}`}>
                    {event.active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td>
                  <div className="btn-group">
                    <Link href={`/automated-messages/events/${event.id}/edit?projectId=${currentProjectId}`}>
                      <button className="btn btn-sm btn-warning" title="Editar">
                        <i className="fas fa-edit"></i>
                      </button>
                    </Link>
                    <button
                      className="btn btn-sm btn-danger"
                      title="Excluir"
                      onClick={() => handleDeleteEvent(event.id)}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <Layout>
        <div className="container mt-4">
          <div className="text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Carregando...</span>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mt-4">
        <div className="card">
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center">
              <h2>Gerenciamento de Mensagens Automatizadas</h2>
              <button
                className="btn btn-success"
                onClick={() => router.push(`/automated-messages/send-test?projectId=${currentProjectId}`)}
                disabled={!currentProjectId}
              >
                <i className="bi bi-send me-2"></i>
                Enviar Mensagem de Teste
              </button>
            </div>
            {error && <div className="alert alert-danger mt-3">{error}</div>}
          </div>
          <div className="card-body">
            <ul className="nav nav-tabs mb-4">
              <li className="nav-item">
                <a
                  className={`nav-link ${activeTab === 'templates' ? 'active' : ''}`}
                  href="#"
                  onClick={() => setActiveTab('templates')}
                >
                  Modelos de Mensagens
                </a>
              </li>
              <li className="nav-item">
                <a
                  className={`nav-link ${activeTab === 'events' ? 'active' : ''}`}
                  href="#"
                  onClick={() => setActiveTab('events')}
                >
                  Gatilhos de Eventos
                </a>
              </li>
            </ul>

            {activeTab === 'templates' ? renderTemplatesTab() : renderEventsTab()}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AutomatedMessagesPage;