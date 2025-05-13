import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { whatsappApi } from '../../src/api/whatsapp';
import Layout from '../../src/components/layout/Layout';

const WhatsAppDiagnostico = () => {
  const router = useRouter();
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    fetchStatus();
    // Atualizar a cada 10 segundos
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      // Adicionar resultado ao log de testes
      addTestResult('Iniciando verificação de status...');

      // Testar conexão direta com o servidor WhatsApp
      await testDirectConnection();

      // Buscar status via API padrão
      const response = await whatsappApi.getStatus();
      setStatus(response);
      
      if (response.success) {
        addTestResult('Status obtido com sucesso', response.data);
      } else {
        addTestResult('Erro ao obter status', response.error);
      }
      
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Erro ao buscar status:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      addTestResult('Exceção ao buscar status', err);
    } finally {
      setLoading(false);
    }
  };

  const testDirectConnection = async () => {
    try {
      addTestResult('Testando conexão direta ao servidor WhatsApp...');
      const response = await fetch('http://localhost:9029/api/whatsapp/status');
      const text = await response.text();
      
      addTestResult('Resposta direta do servidor WhatsApp', {
        status: response.status,
        ok: response.ok,
        text: text
      });
      
      return true;
    } catch (err) {
      addTestResult('Erro na conexão direta com o servidor WhatsApp', err);
      return false;
    }
  };

  const addTestResult = (message: string, data?: any) => {
    setTestResults(prev => [
      {
        time: new Date().toLocaleTimeString(),
        message,
        data: data || null
      },
      ...prev.slice(0, 9)  // Manter apenas os últimos 10 resultados
    ]);
  };

  const renderStatus = () => {
    if (loading && !status) {
      return <div className="alert alert-info">Carregando status do WhatsApp...</div>;
    }

    if (error) {
      return <div className="alert alert-danger">Erro: {error}</div>;
    }

    if (!status) {
      return <div className="alert alert-warning">Nenhuma informação de status disponível</div>;
    }

    const statusData = status.data || {};
    
    return (
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">Status da Conexão WhatsApp</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <div className="mb-3">
                <strong>Status:</strong>{' '}
                <span className={`badge ${statusData.status === 'connected' ? 'bg-success' : 'bg-warning'}`}>
                  {statusData.status || 'Desconhecido'}
                </span>
              </div>
              <div className="mb-3">
                <strong>Número de telefone:</strong>{' '}
                {statusData.phoneNumber ? statusData.phoneNumber : 'Não disponível'}
              </div>
              <div className="mb-3">
                <strong>Autenticado:</strong>{' '}
                {statusData.authenticated ? 'Sim' : 'Não'}
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-3">
                <strong>Última atualização:</strong>{' '}
                {lastUpdate ? lastUpdate.toLocaleString() : 'Nunca'}
              </div>
              <div className="mb-3">
                <strong>Status da requisição:</strong>{' '}
                <span className={`badge ${status.success ? 'bg-success' : 'bg-danger'}`}>
                  {status.success ? 'Sucesso' : 'Falha'}
                </span>
              </div>
              {!status.success && (
                <div className="mb-3">
                  <strong>Erro:</strong> {status.error}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="card-footer">
          <button 
            className="btn btn-primary me-2" 
            onClick={fetchStatus} 
            disabled={loading}
          >
            {loading ? 'Atualizando...' : 'Atualizar Status'}
          </button>
          <button 
            className="btn btn-secondary me-2" 
            onClick={() => router.push('/whatsapp')}
          >
            Ir para WhatsApp
          </button>
        </div>
      </div>
    );
  };

  const renderTestResults = () => {
    if (testResults.length === 0) {
      return <div className="alert alert-info">Nenhum teste realizado ainda</div>;
    }

    return (
      <div className="card">
        <div className="card-header">
          <h5 className="mb-0">Log de Diagnóstico</h5>
        </div>
        <div className="card-body p-0">
          <div className="list-group list-group-flush">
            {testResults.map((result, index) => (
              <div key={index} className="list-group-item">
                <div className="d-flex justify-content-between">
                  <span className="text-muted">{result.time}</span>
                  <span className="badge bg-info">{index + 1}</span>
                </div>
                <p className="mb-1">{result.message}</p>
                {result.data && (
                  <pre className="bg-light p-2 mt-2 rounded">
                    {typeof result.data === 'object' 
                      ? JSON.stringify(result.data, null, 2) 
                      : result.data.toString()}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="container-fluid my-4">
        <div className="row">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2>Diagnóstico de Conexão WhatsApp</h2>
            </div>
            
            <div className="mb-4">
              <div className="alert alert-primary">
                <strong>Informações úteis:</strong>
                <ul className="mb-0">
                  <li>O servidor WhatsApp deve estar rodando na porta 9029</li>
                  <li>O endpoint de status é: http://localhost:9029/api/whatsapp/status</li>
                  <li>A conexão é feita diretamente do backend para a porta 9029</li>
                </ul>
              </div>
            </div>
            
            {renderStatus()}
            
            <hr className="my-4" />
            
            <h4 className="mb-3">Resultados dos Testes</h4>
            {renderTestResults()}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default WhatsAppDiagnostico;