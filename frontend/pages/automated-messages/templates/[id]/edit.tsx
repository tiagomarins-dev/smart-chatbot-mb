import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../../src/components/layout/Layout';
import TemplateForm from '../../../../src/components/automatedMessages/TemplateForm';
import { automatedMessagesApi } from '../../../../src/api/automatedMessages';
import { MessageTemplate, MessageTemplateFormData } from '../../../../src/interfaces';

const EditTemplateMessagePage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [templateData, setTemplateData] = useState<MessageTemplateFormData | null>(null);
  const [projectId, setProjectId] = useState<string>('');
  const [templateId, setTemplateId] = useState<string>('');
  const [error, setError] = useState('');

  useEffect(() => {
    const { id, projectId } = router.query;
    
    if (id && typeof id === 'string' && projectId && typeof projectId === 'string') {
      setTemplateId(id);
      setProjectId(projectId);
      loadTemplateData(id);
    } else if (router.isReady) {
      setError('Parâmetros inválidos. Verifique o ID do modelo e o ID do projeto.');
      setIsLoading(false);
    }
  }, [router.query, router.isReady]);

  const loadTemplateData = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await automatedMessagesApi.getTemplate(id);
      
      if (response.success && response.data && response.data.template) {
        const template = response.data.template as MessageTemplate;
        
        // Convert to form data format
        const formData: MessageTemplateFormData = {
          name: template.name,
          description: template.description,
          content: template.content,
          min_lead_score: template.min_lead_score,
          max_lead_score: template.max_lead_score,
          min_sentiment: template.min_sentiment,
          max_sentiment: template.max_sentiment,
          max_sends_per_lead: template.max_sends_per_lead,
          active: template.active,
          // We would need another API call to get the associated events
          event_ids: []
        };
        
        setTemplateData(formData);
        setError('');
      } else {
        setError('Não foi possível carregar os dados do modelo de mensagem.');
      }
    } catch (err) {
      console.error('Error loading template data', err);
      setError('Erro ao carregar dados do modelo de mensagem.');
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
            onClick={() => router.push(`/automated-messages?projectId=${projectId}`)}
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
        ) : templateData ? (
          <TemplateForm 
            initialData={templateData} 
            templateId={templateId} 
            projectId={projectId} 
            isEditMode={true} 
          />
        ) : (
          <div className="alert alert-warning">Nenhum dado encontrado para este modelo de mensagem.</div>
        )}
      </div>
    </Layout>
  );
};

export default EditTemplateMessagePage;