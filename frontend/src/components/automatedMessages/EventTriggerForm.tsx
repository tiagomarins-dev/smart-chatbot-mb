import { useState } from 'react';
import { useRouter } from 'next/router';
import { EventTriggerFormData } from '../../interfaces';
import { automatedMessagesApi } from '../../api/automatedMessages';

interface EventTriggerFormProps {
  initialData?: EventTriggerFormData;
  eventId?: string;
  projectId: string;
  isEditMode: boolean;
}

const defaultFormData: EventTriggerFormData = {
  name: '',
  event_type: '',
  description: '',
  active: true
};

// Common event types
const commonEventTypes = [
  { value: 'visualizou_produto', label: 'Visualizou Produto' },
  { value: 'adicionou_ao_carrinho', label: 'Adicionou ao Carrinho' },
  { value: 'carrinho_abandonado', label: 'Carrinho Abandonado' },
  { value: 'preencheu_formulario', label: 'Preencheu Formulário' },
  { value: 'acessou_pagina', label: 'Acessou Página' },
  { value: 'iniciou_chat', label: 'Iniciou Chat' },
  { value: 'solicitou_contato', label: 'Solicitou Contato' },
  { value: 'visualizou_propriedade', label: 'Visualizou Propriedade' },
  { value: 'whatsapp_mensagem', label: 'Mensagem de WhatsApp' },
  { value: 'sem_resposta', label: 'Sem Resposta' },
  { value: 'inativo', label: 'Lead Inativo' }
];

const EventTriggerForm = ({ initialData = defaultFormData, eventId, projectId, isEditMode }: EventTriggerFormProps) => {
  const router = useRouter();
  const [formData, setFormData] = useState<EventTriggerFormData>(initialData);
  const [customEventType, setCustomEventType] = useState(
    !commonEventTypes.some(et => et.value === initialData.event_type) && initialData.event_type ? initialData.event_type : ''
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData({
        ...formData,
        [name]: checkbox.checked
      });
    } else if (name === 'event_type' && value === 'custom') {
      // Don't update formData.event_type yet, will be updated when custom type is entered
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleCustomEventTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomEventType(value);
    setFormData({
      ...formData,
      event_type: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    // Use custom event type if selected
    const dataToSubmit = {
      ...formData,
      event_type: formData.event_type === 'custom' ? customEventType : formData.event_type
    };

    try {
      let response;
      
      if (isEditMode && eventId) {
        response = await automatedMessagesApi.updateEventTrigger(eventId, dataToSubmit);
      } else {
        response = await automatedMessagesApi.createEventTrigger(projectId, dataToSubmit);
      }
      
      if (response.success) {
        setSuccessMessage(isEditMode 
          ? 'Gatilho de evento atualizado com sucesso!'
          : 'Gatilho de evento criado com sucesso!'
        );
        
        // Redirect after a short delay
        setTimeout(() => {
          router.push(`/automated-messages?projectId=${projectId}&tab=events`);
        }, 1500);
      } else {
        setError(response.message || 'Erro ao processar solicitação');
      }
    } catch (err) {
      console.error('Error saving event trigger', err);
      setError('Erro ao salvar gatilho de evento. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3>{isEditMode ? 'Editar Gatilho de Evento' : 'Criar Novo Gatilho de Evento'}</h3>
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
            <label htmlFor="name" className="form-label">Nome do Gatilho *</label>
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
            <label htmlFor="event_type" className="form-label">Tipo de Evento *</label>
            <select
              className="form-select"
              id="event_type"
              name="event_type"
              value={commonEventTypes.some(et => et.value === formData.event_type) ? formData.event_type : 'custom'}
              onChange={handleChange}
              required
            >
              <option value="">Selecione um tipo de evento</option>
              {commonEventTypes.map(eventType => (
                <option key={eventType.value} value={eventType.value}>
                  {eventType.label}
                </option>
              ))}
              <option value="custom">Personalizado</option>
            </select>
          </div>
          
          {(!commonEventTypes.some(et => et.value === formData.event_type) || formData.event_type === 'custom') && (
            <div className="mb-3">
              <label htmlFor="custom_event_type" className="form-label">Tipo de Evento Personalizado *</label>
              <input
                type="text"
                className="form-control"
                id="custom_event_type"
                name="custom_event_type"
                value={customEventType}
                onChange={handleCustomEventTypeChange}
                placeholder="Ex: solicitou_orcamento"
                required
              />
              <div className="form-text">
                Use apenas letras minúsculas, números e underscores (_).
              </div>
            </div>
          )}
          
          <div className="mb-3">
            <label htmlFor="description" className="form-label">Descrição</label>
            <textarea
              className="form-control"
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
            />
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
              onClick={() => router.push(`/automated-messages?projectId=${projectId}&tab=events`)}
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

export default EventTriggerForm;