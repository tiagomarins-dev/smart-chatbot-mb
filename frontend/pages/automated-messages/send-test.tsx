import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../src/components/layout/Layout';
import { automatedMessagesApi } from '../../src/api/automatedMessages';
import leadsApi from '../../src/api/leads';
import { Lead, MessageTemplate } from '../../src/interfaces';

const SendTestMessagePage = () => {
  const router = useRouter();
  const [projectId, setProjectId] = useState<string>('');
  const [leadId, setLeadId] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'template' | 'custom'>('template');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    const { projectId, leadId } = router.query;
    
    if (projectId && typeof projectId === 'string') {
      setProjectId(projectId);
      if (leadId && typeof leadId === 'string') {
        setLeadId(leadId);
      }
      loadData(projectId);
    } else {
      setError('É necessário selecionar um projeto para enviar mensagens de teste.');
    }
  }, [router.query]);

  const loadData = async (projectId: string) => {
    setIsLoading(true);
    setError('');
    
    try {
      // Load templates
      const templatesResponse = await automatedMessagesApi.getTemplates(projectId);
      if (templatesResponse.success && templatesResponse.data) {
        setTemplates(templatesResponse.data.templates || []);
      }
      
      // Load leads for this project
      const leadsResponse = await leadsApi.getLeads(projectId);
      if (leadsResponse.success && leadsResponse.data) {
        setLeads(leadsResponse.data.leads || []);
      }
    } catch (err) {
      console.error('Error loading data', err);
      setError('Erro ao carregar dados necessários. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setError('');
    setSuccess('');
    
    if (!leadId) {
      setError('Por favor, selecione um lead para enviar a mensagem.');
      setIsSending(false);
      return;
    }
    
    if (messageType === 'template' && !selectedTemplateId) {
      setError('Por favor, selecione um modelo de mensagem.');
      setIsSending(false);
      return;
    }
    
    if (messageType === 'custom' && !customMessage.trim()) {
      setError('Por favor, digite uma mensagem personalizada.');
      setIsSending(false);
      return;
    }
    
    try {
      // This would need an endpoint to send test messages
      const response = await automatedMessagesApi.sendTestMessage(
        leadId, 
        messageType === 'template' ? { templateId: selectedTemplateId } : { customMessage }
      );
      
      if (response.success) {
        setSuccess('Mensagem de teste enviada com sucesso!');
      } else {
        setError(response.message || 'Erro ao enviar mensagem de teste.');
      }
    } catch (err) {
      console.error('Error sending test message', err);
      setError('Erro ao enviar mensagem de teste. Verifique a conexão e tente novamente.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Layout>
      <div className="container mt-4">
        <div className="mb-3">
          <button 
            className="btn btn-outline-secondary"
            onClick={() => router.push(`/automated-messages?projectId=${projectId}`)}
          >
            <i className="fas fa-arrow-left me-2"></i>
            Voltar para Mensagens Automatizadas
          </button>
        </div>
        
        <div className="card">
          <div className="card-header">
            <h3>Enviar Mensagem de Teste</h3>
          </div>
          <div className="card-body">
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}
            
            {success && (
              <div className="alert alert-success" role="alert">
                {success}
              </div>
            )}
            
            {isLoading ? (
              <div className="text-center p-4">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Carregando...</span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="leadId" className="form-label">Selecione um Lead *</label>
                  <select
                    className="form-select"
                    id="leadId"
                    value={leadId}
                    onChange={(e) => setLeadId(e.target.value)}
                    required
                  >
                    <option value="">Selecione um lead</option>
                    {leads.map(lead => (
                      <option key={lead.id} value={lead.id}>
                        {lead.name} ({lead.email})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-3">
                  <label className="form-label d-block">Tipo de Mensagem *</label>
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="messageType"
                      id="templateType"
                      value="template"
                      checked={messageType === 'template'}
                      onChange={() => setMessageType('template')}
                    />
                    <label className="form-check-label" htmlFor="templateType">
                      Modelo Existente
                    </label>
                  </div>
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="messageType"
                      id="customType"
                      value="custom"
                      checked={messageType === 'custom'}
                      onChange={() => setMessageType('custom')}
                    />
                    <label className="form-check-label" htmlFor="customType">
                      Mensagem Personalizada
                    </label>
                  </div>
                </div>
                
                {messageType === 'template' ? (
                  <div className="mb-3">
                    <label htmlFor="templateId" className="form-label">Selecione um Modelo *</label>
                    <select
                      className="form-select"
                      id="templateId"
                      value={selectedTemplateId}
                      onChange={(e) => setSelectedTemplateId(e.target.value)}
                      required={messageType === 'template'}
                    >
                      <option value="">Selecione um modelo</option>
                      {templates.map(template => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                    
                    {selectedTemplateId && (
                      <div className="mt-3">
                        <label className="form-label">Prévia do Modelo:</label>
                        <div className="p-3 bg-light rounded">
                          <p style={{ whiteSpace: 'pre-wrap' }}>
                            {templates.find(t => t.id === selectedTemplateId)?.content || ''}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mb-3">
                    <label htmlFor="customMessage" className="form-label">Mensagem Personalizada *</label>
                    <textarea
                      className="form-control"
                      id="customMessage"
                      rows={5}
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      required={messageType === 'custom'}
                    />
                    <div className="form-text">
                      Você pode usar variáveis como {'{nome}'}, {'{email}'}, etc. para personalização.
                    </div>
                  </div>
                )}
                
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
                    disabled={isSending}
                  >
                    {isSending ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Enviando...
                      </>
                    ) : 'Enviar Mensagem de Teste'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

// This is a mock function as we don't have a real endpoint for this yet
automatedMessagesApi.sendTestMessage = async (leadId: string, messageData: any) => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    success: true,
    message: 'Mensagem enviada com sucesso',
    data: {
      id: 'test-message-' + Math.random().toString(36).substr(2, 9),
      leadId,
      content: messageData.templateId 
        ? 'Conteúdo do modelo selecionado' 
        : messageData.customMessage,
      sentAt: new Date().toISOString()
    }
  };
};

export default SendTestMessagePage;