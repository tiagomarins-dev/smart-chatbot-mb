import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../../src/components/layout/Layout';
import { automatedMessagesApi } from '../../../../src/api/automatedMessages';
import { MessageTemplate } from '../../../../src/interfaces';
import Link from 'next/link';

const ViewTemplateMessagePage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [template, setTemplate] = useState<MessageTemplate | null>(null);
  const [projectId, setProjectId] = useState<string>('');
  const [error, setError] = useState('');

  useEffect(() => {
    const { id, projectId } = router.query;
    
    if (id && typeof id === 'string' && projectId && typeof projectId === 'string') {
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
        setTemplate(response.data.template);
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

  const getSentimentRange = () => {
    if (template) {
      if (template.min_sentiment !== undefined && template.max_sentiment !== undefined) {
        return `${template.min_sentiment} a ${template.max_sentiment}`;
      } else if (template.min_sentiment !== undefined) {
        return `Acima de ${template.min_sentiment}`;
      } else if (template.max_sentiment !== undefined) {
        return `Abaixo de ${template.max_sentiment}`;
      }
    }
    return 'Qualquer valor';
  };

  const getScoreRange = () => {
    if (template) {
      if (template.min_lead_score !== undefined && template.max_lead_score !== undefined) {
        return `${template.min_lead_score} a ${template.max_lead_score}`;
      } else if (template.min_lead_score !== undefined) {
        return `Acima de ${template.min_lead_score}`;
      } else if (template.max_lead_score !== undefined) {
        return `Abaixo de ${template.max_lead_score}`;
      }
    }
    return 'Qualquer valor';
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
        ) : template ? (
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h3>Detalhes do Modelo de Mensagem</h3>
              <div>
                <Link href={`/automated-messages/templates/${template.id}/edit?projectId=${projectId}`}>
                  <button className="btn btn-primary me-2">
                    <i className="fas fa-edit me-1"></i>
                    Editar
                  </button>
                </Link>
              </div>
            </div>
            <div className="card-body">
              <div className="row mb-4">
                <div className="col-md-6">
                  <h4 className="mb-3">{template.name}</h4>
                  <p className="text-muted">{template.description}</p>
                  
                  <div className="mb-3">
                    <span className={`badge ${template.active ? 'bg-success' : 'bg-danger'} me-2`}>
                      {template.active ? 'Ativo' : 'Inativo'}
                    </span>
                    <span className="text-muted">
                      Criado em: {new Date(template.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="card bg-light">
                    <div className="card-body">
                      <h5 className="card-title">Critérios de Aplicação</h5>
                      <ul className="list-group list-group-flush">
                        <li className="list-group-item bg-transparent">
                          <strong>Score do Lead:</strong> {getScoreRange()}
                        </li>
                        <li className="list-group-item bg-transparent">
                          <strong>Sentimento:</strong> {getSentimentRange()}
                        </li>
                        <li className="list-group-item bg-transparent">
                          <strong>Máximo de Envios por Lead:</strong> {template.max_sends_per_lead}
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0">Conteúdo da Mensagem</h5>
                </div>
                <div className="card-body">
                  <pre className="message-content p-3 bg-light rounded" style={{ whiteSpace: 'pre-wrap' }}>
                    {template.content}
                  </pre>
                </div>
              </div>
              
              <div className="card mb-4">
                <div className="card-header">
                  <h5 className="mb-0">Gatilhos Associados</h5>
                </div>
                <div className="card-body">
                  <p className="text-muted">
                    Este recurso exibiria os gatilhos associados a este modelo.
                    Implementação pendente - requer endpoint adicional.
                  </p>
                </div>
              </div>
              
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">Histórico de Envios</h5>
                </div>
                <div className="card-body">
                  <p className="text-muted">
                    Este recurso exibiria um histórico de quando este modelo foi enviado a leads.
                    Implementação pendente - requer endpoint adicional.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="alert alert-warning">Nenhum dado encontrado para este modelo de mensagem.</div>
        )}
      </div>
    </Layout>
  );
};

export default ViewTemplateMessagePage;