import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { EventTrigger, MessageTemplateFormData } from '../../interfaces';
import { automatedMessagesApi } from '../../api/automatedMessages';

interface TemplateFormProps {
  initialData?: MessageTemplateFormData;
  templateId?: string;
  projectId: string;
  isEditMode: boolean;
}

const defaultFormData: MessageTemplateFormData = {
  name: '',
  description: '',
  content: '',
  min_lead_score: undefined,
  max_lead_score: undefined,
  min_sentiment: undefined,
  max_sentiment: undefined,
  max_sends_per_lead: 1,
  active: true,
  event_ids: []
};

const TemplateForm = ({ initialData = defaultFormData, templateId, projectId, isEditMode }: TemplateFormProps) => {
  const router = useRouter();
  const [formData, setFormData] = useState<MessageTemplateFormData>(initialData);
  const [events, setEvents] = useState<EventTrigger[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const response = await automatedMessagesApi.getEventTriggers(projectId);
        if (response.success && response.data) {
          setEvents(response.data.events || []);
        }
      } catch (err) {
        console.error('Error loading event triggers', err);
        setError('Erro ao carregar gatilhos de eventos');
      }
    };

    loadEvents();
  }, [projectId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData({
        ...formData,
        [name]: checkbox.checked
      });
    } else if (name === 'event_ids') {
      const select = e.target as HTMLSelectElement;
      const selectedOptions = Array.from(select.selectedOptions).map(option => option.value);
      setFormData({
        ...formData,
        event_ids: selectedOptions
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = value === '' ? undefined : Number(value);
    
    setFormData({
      ...formData,
      [name]: numValue
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      let response;
      
      if (isEditMode && templateId) {
        response = await automatedMessagesApi.updateTemplate(templateId, formData);
      } else {
        response = await automatedMessagesApi.createTemplate(projectId, formData);
      }
      
      if (response.success) {
        setSuccessMessage(isEditMode 
          ? 'Modelo de mensagem atualizado com sucesso!'
          : 'Modelo de mensagem criado com sucesso!'
        );
        
        // Redirect after a short delay
        setTimeout(() => {
          router.push(`/automated-messages?projectId=${projectId}`);
        }, 1500);
      } else {
        setError(response.message || 'Erro ao processar solicitação');
      }
    } catch (err) {
      console.error('Error saving template', err);
      setError('Erro ao salvar modelo de mensagem. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3>{isEditMode ? 'Editar Modelo de Mensagem' : 'Criar Novo Modelo de Mensagem'}</h3>
      </div>
      <div className="card-body">
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        
        {successMessage && (
          <div className="alert alert-success" role="alert">
            {successMessage}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="name" className="form-label">Nome do Modelo *</label>
            <input
              type="text"
              className="form-control"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="mb-3">
            <label htmlFor="description" className="form-label">Descrição</label>
            <textarea
              className="form-control"
              id="description"
              name="description"
              rows={2}
              value={formData.description}
              onChange={handleChange}
            />
          </div>
          
          <div className="mb-3">
            <label htmlFor="content" className="form-label">Conteúdo da Mensagem *</label>
            <textarea
              className="form-control"
              id="content"
              name="content"
              rows={5}
              value={formData.content}
              onChange={handleChange}
              required
            />
            <div className="form-text">
              Você pode usar variáveis como {'{nome}'}, {'{email}'}, etc. para personalização.
            </div>
          </div>
          
          <div className="row">
            <div className="col-md-6">
              <div className="mb-3">
                <label htmlFor="min_lead_score" className="form-label">Score Mínimo do Lead</label>
                <input
                  type="number"
                  className="form-control"
                  id="min_lead_score"
                  name="min_lead_score"
                  min="0"
                  max="100"
                  value={formData.min_lead_score === undefined ? '' : formData.min_lead_score}
                  onChange={handleNumberChange}
                />
              </div>
            </div>
            
            <div className="col-md-6">
              <div className="mb-3">
                <label htmlFor="max_lead_score" className="form-label">Score Máximo do Lead</label>
                <input
                  type="number"
                  className="form-control"
                  id="max_lead_score"
                  name="max_lead_score"
                  min="0"
                  max="100"
                  value={formData.max_lead_score === undefined ? '' : formData.max_lead_score}
                  onChange={handleNumberChange}
                />
              </div>
            </div>
          </div>
          
          <div className="row">
            <div className="col-md-6">
              <div className="mb-3">
                <label htmlFor="min_sentiment" className="form-label">Sentimento Mínimo</label>
                <input
                  type="number"
                  className="form-control"
                  id="min_sentiment"
                  name="min_sentiment"
                  min="-100"
                  max="100"
                  value={formData.min_sentiment === undefined ? '' : formData.min_sentiment}
                  onChange={handleNumberChange}
                />
              </div>
            </div>
            
            <div className="col-md-6">
              <div className="mb-3">
                <label htmlFor="max_sentiment" className="form-label">Sentimento Máximo</label>
                <input
                  type="number"
                  className="form-control"
                  id="max_sentiment"
                  name="max_sentiment"
                  min="-100"
                  max="100"
                  value={formData.max_sentiment === undefined ? '' : formData.max_sentiment}
                  onChange={handleNumberChange}
                />
              </div>
            </div>
          </div>
          
          <div className="mb-3">
            <label htmlFor="max_sends_per_lead" className="form-label">Máximo de Envios por Lead *</label>
            <input
              type="number"
              className="form-control"
              id="max_sends_per_lead"
              name="max_sends_per_lead"
              min="1"
              value={formData.max_sends_per_lead}
              onChange={handleNumberChange}
              required
            />
          </div>
          
          <div className="mb-3">
            <label htmlFor="event_ids" className="form-label">Gatilhos de Eventos</label>
            <select
              multiple
              className="form-select"
              id="event_ids"
              name="event_ids"
              value={formData.event_ids || []}
              onChange={handleChange}
            >
              {events.map(event => (
                <option key={event.id} value={event.id}>
                  {event.name} ({event.event_type})
                </option>
              ))}
            </select>
            <div className="form-text">
              Segure Ctrl (ou Cmd no Mac) para selecionar múltiplos eventos
            </div>
          </div>
          
          <div className="mb-3 form-check">
            <input
              type="checkbox"
              className="form-check-input"
              id="active"
              name="active"
              checked={formData.active}
              onChange={handleChange}
            />
            <label className="form-check-label" htmlFor="active">Ativo</label>
          </div>
          
          <div className="d-flex justify-content-between">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => router.push(`/automated-messages?projectId=${projectId}`)}
            >
              Cancelar
            </button>
            
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Salvando...
                </>
              ) : (
                isEditMode ? 'Atualizar' : 'Criar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TemplateForm;