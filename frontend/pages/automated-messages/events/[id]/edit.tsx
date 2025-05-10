import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../../src/components/layout/Layout';
import EventTriggerForm from '../../../../src/components/automatedMessages/EventTriggerForm';
import { automatedMessagesApi } from '../../../../src/api/automatedMessages';
import { EventTrigger, EventTriggerFormData } from '../../../../src/interfaces';

const EditEventTriggerPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [eventData, setEventData] = useState<EventTriggerFormData | null>(null);
  const [projectId, setProjectId] = useState<string>('');
  const [eventId, setEventId] = useState<string>('');
  const [error, setError] = useState('');

  useEffect(() => {
    const { id, projectId } = router.query;
    
    if (id && typeof id === 'string' && projectId && typeof projectId === 'string') {
      setEventId(id);
      setProjectId(projectId);
      loadEventData(id);
    } else if (router.isReady) {
      setError('Parâmetros inválidos. Verifique o ID do evento e o ID do projeto.');
      setIsLoading(false);
    }
  }, [router.query, router.isReady]);

  const loadEventData = async (id: string) => {
    setIsLoading(true);
    try {
      // Note: We would need an endpoint to get a single event by ID
      // For now, we're fetching all events and finding the one we need
      const response = await automatedMessagesApi.getEventTriggers(projectId);
      
      if (response.success && response.data && response.data.events) {
        const event = response.data.events.find((e: EventTrigger) => e.id === id);
        
        if (event) {
          // Convert to form data format
          const formData: EventTriggerFormData = {
            name: event.name,
            event_type: event.event_type,
            description: event.description,
            active: event.active
          };
          
          setEventData(formData);
          setError('');
        } else {
          setError('Gatilho de evento não encontrado.');
        }
      } else {
        setError('Não foi possível carregar os dados do gatilho de evento.');
      }
    } catch (err) {
      console.error('Error loading event trigger data', err);
      setError('Erro ao carregar dados do gatilho de evento.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mt-4">
        <div className="mb-3">
          <button 
            className="btn btn-outline-secondary"
            onClick={() => router.push(`/automated-messages?projectId=${projectId}&tab=events`)}
          >
            <i className="fas fa-arrow-left me-2"></i>
            Voltar para Mensagens Automatizadas
          </button>
        </div>
        
        {isLoading ? (
          <div className="text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Carregando...</span>
            </div>
          </div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : eventData ? (
          <EventTriggerForm 
            initialData={eventData} 
            eventId={eventId} 
            projectId={projectId} 
            isEditMode={true} 
          />
        ) : (
          <div className="alert alert-warning">Nenhum dado encontrado para este gatilho de evento.</div>
        )}
      </div>
    </Layout>
  );
};

export default EditEventTriggerPage;