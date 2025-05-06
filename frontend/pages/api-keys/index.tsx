import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../src/components/layout/Layout';
import { useAuth } from '../../src/contexts/AuthContext';
import Link from 'next/link';
import apiKeysApi, { ApiKey as ApiKeyType } from '../../src/api/apiKeys';

const ApiKeysPage: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  
  const [apiKeys, setApiKeys] = useState<ApiKeyType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyData, setNewKeyData] = useState<{key: string, secret: string} | null>(null);
  
  // Redirecionar para login se não estiver autenticado
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/api-keys');
    }
  }, [isAuthenticated, isLoading, router]);
  
  // Carregar API keys
  useEffect(() => {
    if (isAuthenticated) {
      fetchApiKeys();
    }
  }, [isAuthenticated]);
  
  // Função para buscar API keys
  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      const response = await apiKeysApi.getApiKeys();
      
      if (response.success && response.data) {
        setApiKeys(response.data.api_keys.map(key => ({
          ...key,
          key_value: key.key_value // Ajustando nome da propriedade
        })));
      } else {
        setError(response.error || 'Falha ao carregar as chaves de API');
      }
    } catch (err) {
      console.error('Erro ao buscar API keys:', err);
      setError('Não foi possível carregar suas chaves de API');
    } finally {
      setLoading(false);
    }
  };
  
  // Função para gerar uma nova API key
  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newKeyName.trim()) {
      setError('O nome da chave API é obrigatório');
      return;
    }
    
    try {
      setLoading(true);
      const response = await apiKeysApi.createApiKey(newKeyName);
      
      if (response.success && response.data) {
        setNewKeyData({
          key: response.data.api_key.key_value,
          secret: response.data.secret
        });
        setShowNewKeyModal(false);
        
        // Adicionar a nova chave à lista
        setApiKeys(prev => [
          {
            ...response.data.api_key,
            key_value: response.data.api_key.key_value
          },
          ...prev
        ]);
        
        setNewKeyName('');
      } else {
        setError(response.error || 'Falha ao gerar nova API key');
      }
    } catch (err) {
      console.error('Erro ao gerar API key:', err);
      setError('Falha ao gerar nova API key');
    } finally {
      setLoading(false);
    }
  };
  
  // Função para revogar uma API key
  const handleRevokeKey = async (keyId: string) => {
    if (!confirm('Tem certeza que deseja revogar esta API key? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await apiKeysApi.revokeApiKey(keyId);
      
      if (response.success) {
        // Atualizar o estado local para refletir a revogação
        setApiKeys(apiKeys.map(key => 
          key.id === keyId ? {...key, is_active: false} : key
        ));
        
        // Mostrar mensagem de sucesso temporária
        setError(null);
        // Opcional: mostrar mensagem de sucesso
      } else {
        setError(response.error || 'Falha ao revogar API key');
      }
    } catch (err) {
      console.error('Erro ao revogar API key:', err);
      setError('Falha ao revogar API key');
    } finally {
      setLoading(false);
    }
  };
  
  // Função para copiar chave para a área de transferência
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copiado para a área de transferência!');
    }).catch(err => {
      console.error('Erro ao copiar:', err);
      alert('Falha ao copiar para a área de transferência');
    });
  };
  
  // Função para formatar data
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  if (isLoading) {
    return (
      <Layout title="API Keys | Smart-ChatBox">
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout title="API Keys | Smart-ChatBox">
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="fw-bold" style={{ color: '#7e57c2' }}>Chaves de API</h1>
            <p className="text-muted">Gerencie suas chaves de acesso à API</p>
          </div>
          
          <button 
            className="btn btn-primary" 
            onClick={() => setShowNewKeyModal(true)}
            disabled={loading}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Nova API Key
          </button>
        </div>
        
        {error && (
          <div className="alert alert-danger mb-4">
            {error}
            <button 
              type="button" 
              className="btn-close float-end"
              onClick={() => setError(null)}
              aria-label="Fechar"
            ></button>
          </div>
        )}
        
        {/* Card de informação sobre API */}
        <div className="card mb-4 border-0 bg-light">
          <div className="card-body">
            <h5 className="fw-bold mb-3">
              <i className="bi bi-info-circle me-2" style={{color: '#7e57c2'}}></i>
              Sobre as Chaves de API
            </h5>
            <p className="mb-1">As chaves de API permitem que você:</p>
            <ul className="mb-3">
              <li>Acesse os endpoints da API de forma autenticada</li>
              <li>Integre seus sistemas com nossa plataforma</li>
              <li>Automatize tarefas e processos</li>
            </ul>
            <div className="d-flex gap-2">
              <Link href="/api-docs" className="btn btn-sm btn-outline-primary">
                <i className="bi bi-file-earmark-text me-1"></i>
                Documentação da API
              </Link>
              <Link href="/api-docs" className="btn btn-sm btn-outline-secondary">
                <i className="bi bi-code-slash me-1"></i>
                Exemplos de Código
              </Link>
            </div>
          </div>
        </div>
        
        {/* Tabela de API Keys */}
        <div className="card shadow-sm border-0">
          <div className="card-header bg-white">
            <h5 className="card-title mb-0">Suas Chaves de API</h5>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th scope="col">Nome</th>
                    <th scope="col">Chave</th>
                    <th scope="col">Criada em</th>
                    <th scope="col">Último uso</th>
                    <th scope="col">Expira em</th>
                    <th scope="col">Status</th>
                    <th scope="col">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {apiKeys.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-4">
                        <p className="mb-1">Nenhuma API key encontrada</p>
                        <button 
                          className="btn btn-sm btn-primary"
                          onClick={() => setShowNewKeyModal(true)}
                        >
                          Criar sua primeira API key
                        </button>
                      </td>
                    </tr>
                  ) : (
                    apiKeys.map(key => (
                      <tr key={key.id}>
                        <td>{key.name}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <code className="me-2">{key.key_value.substring(0, 10)}...</code>
                            <button 
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => copyToClipboard(key.key_value)}
                              title="Copiar chave"
                            >
                              <i className="bi bi-clipboard"></i>
                            </button>
                          </div>
                        </td>
                        <td>{formatDate(key.created_at)}</td>
                        <td>{key.last_used_at ? formatDate(key.last_used_at) : 'Nunca usada'}</td>
                        <td>{key.expires_at ? formatDate(key.expires_at) : 'Não expira'}</td>
                        <td>
                          <span className={`badge ${key.is_active ? 'bg-success' : 'bg-danger'}`}>
                            {key.is_active ? 'Ativa' : 'Revogada'}
                          </span>
                        </td>
                        <td>
                          {key.is_active ? (
                            <button 
                              className="btn btn-sm btn-outline-danger" 
                              onClick={() => handleRevokeKey(key.id)}
                              disabled={loading}
                            >
                              <i className="bi bi-x-circle me-1"></i>
                              Revogar
                            </button>
                          ) : (
                            <span className="text-muted">Revogada</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal para criar nova API key */}
      {showNewKeyModal && (
        <div className="modal d-block" tabIndex={-1} style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Nova Chave de API</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowNewKeyModal(false)}
                  disabled={loading}
                ></button>
              </div>
              <form onSubmit={handleGenerateKey}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="keyName" className="form-label">Nome da Chave <span className="text-danger">*</span></label>
                    <input 
                      type="text" 
                      className="form-control" 
                      id="keyName"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="Ex: Integração Website"
                      required
                      autoFocus
                    />
                    <div className="form-text">Um nome descritivo para identificar esta chave.</div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary" 
                    onClick={() => setShowNewKeyModal(false)}
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Gerando...
                      </>
                    ) : (
                      'Gerar API Key'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de nova chave gerada */}
      {newKeyData && (
        <div className="modal d-block" tabIndex={-1} style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">API Key Gerada</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setNewKeyData(null)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-warning mb-3">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  <strong>Atenção!</strong> Salve estas informações agora. A chave secreta não será exibida novamente.
                </div>
                
                <div className="mb-3">
                  <label className="form-label fw-bold">API Key</label>
                  <div className="input-group">
                    <input 
                      type="text" 
                      className="form-control font-monospace"
                      value={newKeyData.key}
                      readOnly
                    />
                    <button 
                      className="btn btn-outline-secondary" 
                      type="button"
                      onClick={() => copyToClipboard(newKeyData.key)}
                    >
                      <i className="bi bi-clipboard"></i>
                    </button>
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="form-label fw-bold">API Secret</label>
                  <div className="input-group">
                    <input 
                      type="text" 
                      className="form-control font-monospace"
                      value={newKeyData.secret}
                      readOnly
                    />
                    <button 
                      className="btn btn-outline-secondary" 
                      type="button"
                      onClick={() => copyToClipboard(newKeyData.secret)}
                    >
                      <i className="bi bi-clipboard"></i>
                    </button>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-success" 
                  onClick={() => setNewKeyData(null)}
                >
                  Entendi, salvei as informações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ApiKeysPage;