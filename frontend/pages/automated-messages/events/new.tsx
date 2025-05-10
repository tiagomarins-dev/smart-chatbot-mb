import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../../src/components/layout/Layout';
import EventTriggerForm from '../../../src/components/automatedMessages/EventTriggerForm';

const NewEventTriggerPage = () => {
  const router = useRouter();
  const [projectId, setProjectId] = useState<string>('');
  const [error, setError] = useState('');

  useEffect(() => {
    const { projectId } = router.query;
    
    if (projectId && typeof projectId === 'string') {
      setProjectId(projectId);
      setError('');
    } else {
      setError('É necessário selecionar um projeto para criar um gatilho de evento.');
    }
  }, [router.query]);

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
        
        {error ? (
          <div className="alert alert-danger">{error}</div>
        ) : (
          <EventTriggerForm projectId={projectId} isEditMode={false} />
        )}
      </div>
    </Layout>
  );
};

export default NewEventTriggerPage;