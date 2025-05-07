import { NextPage } from 'next';
import { useState, useEffect } from 'react';
import Layout from '../../src/components/layout/Layout';
import { useAuth } from '../../src/contexts/AuthContext';
import { useRouter } from 'next/router';
import whatsappApi from '../../src/api/whatsapp';

const WhatsAppPage: NextPage = () => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // Estado da página
  const [status, setStatus] = useState<'disconnected' | 'initializing' | 'qr_received' | 'authenticated' | 'connected' | 'error'>('disconnected');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Para fins de teste, vamos desativar temporariamente o redirecionamento
  useEffect(() => {
    console.log("Auth status:", { loading, isAuthenticated });
  }, [isAuthenticated, loading, router]);

  // Buscar QR code diretamente da API
  const fetchQRCodeDirectly = async () => {
    try {
      console.log("Fetching QR code directly...");
      const response = await fetch('http://localhost:9032/api/whatsapp/qrcode');
      const data = await response.json();
      console.log("Direct QR code response:", data);
      
      if (data.success && data.data && data.data.qrcode) {
        console.log("Direct QR code received");
        setQrCode(data.data.qrcode);
      } else {
        console.error("Direct QR code fetch failed:", data);
        setQrCode(null);
      }
    } catch (err) {
      console.error("Exception in fetchQRCodeDirectly:", err);
      setQrCode(null);
    }
  };

  // Buscar status do WhatsApp
  const fetchStatus = async () => {
    try {
      console.log("Fetching WhatsApp status...");
      const response = await fetch('http://localhost:9032/api/whatsapp/status');
      const data = await response.json();
      console.log("WhatsApp status response:", data);
      
      if (data.success && data.data) {
        console.log("Setting status to:", data.data.status);
        setStatus(data.data.status);
        setLastUpdated(new Date());
        setError(null);
        
        // Se estiver no estado de QR code, buscar o QR code
        if (data.data.status === 'qr_received') {
          console.log("QR received, fetching QR code directly...");
          fetchQRCodeDirectly();
        } else {
          console.log("Not in QR state, clearing QR code");
          setQrCode(null);
        }
      } else {
        console.error("Error in WhatsApp status response:", data);
        setError('Erro ao buscar status do WhatsApp');
      }
    } catch (err) {
      console.error("Exception in fetchStatus:", err);
      setError('Erro ao buscar status do WhatsApp');
    }
  };

  // Conectar ao WhatsApp
  const handleConnect = async () => {
    setIsLoading(true);
    try {
      console.log("Connecting to WhatsApp...");
      const response = await fetch('http://localhost:9032/api/whatsapp/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log("Connect response:", data);
      
      if (data.success) {
        setStatus('initializing');
        // Aguardar um momento e então atualizar o status
        setTimeout(fetchStatus, 2000);
      } else {
        setError(data.error || 'Erro ao conectar ao WhatsApp');
      }
    } catch (err) {
      console.error("Connect error:", err);
      setError('Erro ao conectar ao WhatsApp');
    } finally {
      setIsLoading(false);
    }
  };

  // Desconectar do WhatsApp
  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      console.log("Disconnecting from WhatsApp...");
      const response = await fetch('http://localhost:9032/api/whatsapp/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log("Disconnect response:", data);
      
      if (data.success) {
        setStatus('disconnected');
        setQrCode(null);
        setPhoneNumber(null);
      } else {
        setError(data.error || 'Erro ao desconectar do WhatsApp');
      }
    } catch (err) {
      console.error("Disconnect error:", err);
      setError('Erro ao desconectar do WhatsApp');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Atualizar status periodicamente
  useEffect(() => {
    const fetchInitialStatus = async () => {
      await fetchStatus();
    };
    
    fetchInitialStatus();
    
    // Verificar status a cada 5 segundos
    const statusInterval = setInterval(fetchStatus, 5000);
    
    return () => {
      clearInterval(statusInterval);
    };
  }, []);

  // Função de formatação de data
  const formatDateTime = (date: Date) => {
    return date.toLocaleString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };
  
  // Obter a cor de status para exibir
  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'bg-success';
      case 'authenticated':
        return 'bg-info';
      case 'qr_received':
        return 'bg-warning';
      case 'initializing':
        return 'bg-primary';
      case 'error':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  };
  
  // Obter texto formatado do status
  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Conectado';
      case 'authenticated':
        return 'Autenticado';
      case 'qr_received':
        return 'QR Code Recebido';
      case 'initializing':
        return 'Inicializando';
      case 'error':
        return 'Erro';
      default:
        return 'Desconectado';
    }
  };

  return (
    <Layout>
      <div className="container py-4">
        <div className="row">
          <div className="col-lg-10 offset-lg-1">
            {/* Cabeçalho e Informações */}
            <div className="card mb-4" style={{ 
              borderRadius: '12px', 
              boxShadow: '0 6px 16px rgba(0, 0, 0, 0.07)', 
              border: 'none', 
              animation: 'slideInUp 0.5s ease-out' 
            }}>
              <div className="card-header bg-transparent border-0 pt-4 pb-2 px-4">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <div className="bg-light rounded-circle p-3 me-3">
                      <i className="bi bi-whatsapp fs-3 text-success"></i>
                    </div>
                    <h2 className="mb-0" style={{ color: '#7e57c2' }}>WhatsApp</h2>
                  </div>
                  <div>
                    <span className={`badge ${getStatusColor()} px-3 py-2`}>
                      {getStatusText()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="card-body p-4">
                {error && (
                  <div className="alert alert-danger mb-4">{error}</div>
                )}
                
                <div className="row">
                  <div className="col-md-6 mb-4">
                    <div className="card" style={{ 
                      borderRadius: '12px', 
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', 
                      border: 'none' 
                    }}>
                      <div className="card-header bg-transparent border-0 pt-3 pb-1">
                        <h5 className="mb-0" style={{ color: '#7e57c2' }}>Status da Conexão</h5>
                      </div>
                      <div className="card-body">
                        <div className="mb-3">
                          <div className="d-flex align-items-center mb-1">
                            <div className={`rounded-circle ${getStatusColor()}`} style={{ width: '12px', height: '12px', marginRight: '8px' }}></div>
                            <span className="fw-bold">Status:</span>
                            <span className="ms-2">{getStatusText()}</span>
                          </div>
                          
                          {lastUpdated && (
                            <div className="text-muted small">
                              Última atualização: {formatDateTime(lastUpdated)}
                            </div>
                          )}
                        </div>
                          
                        {status === 'connected' && (
                          <div className="alert alert-success">
                            <i className="bi bi-check-circle-fill me-2"></i>
                            Conexão com WhatsApp estabelecida
                          </div>
                        )}
                            
                        {status === 'disconnected' && (
                          <div className="alert alert-secondary">
                            <i className="bi bi-power me-2"></i>
                            WhatsApp desconectado
                          </div>
                        )}
                            
                        {status === 'initializing' && (
                          <div className="alert alert-primary">
                            <div className="d-flex align-items-center">
                              <div className="spinner-border spinner-border-sm me-2" role="status">
                                <span className="visually-hidden">Carregando...</span>
                              </div>
                              Inicializando conexão com WhatsApp...
                            </div>
                          </div>
                        )}
                            
                        {status === 'error' && (
                          <div className="alert alert-danger">
                            <i className="bi bi-exclamation-triangle-fill me-2"></i>
                            Erro na conexão com WhatsApp
                          </div>
                        )}
                      </div>
                      <div className="card-footer bg-transparent border-top-0 d-flex justify-content-between">
                        {status === 'disconnected' || status === 'error' ? (
                          <button 
                            className="btn btn-primary px-4" 
                            onClick={handleConnect}
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Conectando...
                              </>
                            ) : (
                              <>
                                <i className="bi bi-power me-2"></i>
                                Conectar WhatsApp
                              </>
                            )}
                          </button>
                        ) : (
                          <button 
                            className="btn btn-danger px-4" 
                            onClick={handleDisconnect}
                            disabled={isLoading || status === 'disconnected'}
                          >
                            {isLoading ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Desconectando...
                              </>
                            ) : (
                              <>
                                <i className="bi bi-box-arrow-right me-2"></i>
                                Desconectar
                              </>
                            )}
                          </button>
                        )}
                        
                        <div>
                          <button 
                            className="btn btn-success me-2" 
                            onClick={() => {
                              console.log("Manually checking connected status...");
                              setIsLoading(true);
                              fetch('http://localhost:9032/api/whatsapp/status')
                                .then(res => res.json())
                                .then(data => {
                                  console.log("Manual status check response:", data);
                                  if (data.success && data.data) {
                                    setStatus(data.data.status);
                                    setLastUpdated(new Date());
                                  }
                                  setIsLoading(false);
                                })
                                .catch(err => {
                                  console.error("Manual status check error:", err);
                                  setIsLoading(false);
                                });
                            }}
                            disabled={isLoading}
                          >
                            <i className="bi bi-check-circle me-2"></i>
                            Verificar Conexão
                          </button>
                          
                          <button 
                            className="btn btn-outline-primary" 
                            onClick={fetchStatus}
                            disabled={isLoading}
                          >
                            <i className="bi bi-arrow-clockwise me-2"></i>
                            Atualizar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                    
                  <div className="col-md-6 mb-4">
                    {status === 'qr_received' && qrCode ? (
                      <div className="card h-100" style={{ 
                        borderRadius: '12px', 
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', 
                        border: 'none' 
                      }}>
                        <div className="card-header bg-transparent border-0 pt-3 pb-1">
                          <h5 className="mb-0" style={{ color: '#7e57c2' }}>QR Code</h5>
                        </div>
                        <div className="card-body d-flex flex-column align-items-center justify-content-center p-4">
                          <div className="alert alert-warning mb-3 w-100">
                            <i className="bi bi-qr-code me-2"></i>
                            Escaneie este QR Code com seu WhatsApp para conectar
                          </div>
                            
                          <div className="p-2 bg-white rounded border mb-3" style={{ maxWidth: '250px' }}>
                            <img 
                              src={qrCode} 
                              alt="WhatsApp QR Code" 
                              className="img-fluid" 
                              style={{ maxWidth: '100%' }}
                            />
                          </div>
                            
                          <small className="text-muted">
                            Abra o WhatsApp no seu telefone &gt; Menu &gt; WhatsApp Web &gt; Escaneie o QR Code
                          </small>
                        </div>
                      </div>
                    ) : status === 'connected' ? (
                      <div className="card h-100" style={{ 
                        borderRadius: '12px', 
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', 
                        border: 'none' 
                      }}>
                        <div className="card-header bg-transparent border-0 pt-3 pb-1">
                          <h5 className="mb-0" style={{ color: '#7e57c2' }}>Informações da Sessão</h5>
                        </div>
                        <div className="card-body">
                          <div className="alert alert-success">
                            <i className="bi bi-phone-fill me-2"></i>
                            Seu WhatsApp está conectado e pronto para uso
                          </div>
                            
                          <div className="card mb-3 bg-light">
                            <div className="card-body">
                              <h6 className="mb-2">Detalhes da Conexão:</h6>
                              <div className="d-flex align-items-center mb-2">
                                <div className="bg-success rounded-circle p-1 me-2" style={{ width: '10px', height: '10px' }}></div>
                                <span>Status: Ativo</span>
                              </div>
                                
                              {/* Se houver número de telefone disponível */}
                              {phoneNumber && (
                                <div className="mb-2">
                                  <i className="bi bi-telephone-fill me-2 text-primary"></i>
                                  Número: {phoneNumber}
                                </div>
                              )}
                                
                              <div>
                                <i className="bi bi-calendar-check me-2 text-primary"></i>
                                Conectado desde: {lastUpdated ? formatDateTime(lastUpdated) : 'Desconhecido'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="card h-100" style={{ 
                        borderRadius: '12px', 
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', 
                        border: 'none' 
                      }}>
                        <div className="card-header bg-transparent border-0 pt-3 pb-1">
                          <h5 className="mb-0" style={{ color: '#7e57c2' }}>Instruções</h5>
                        </div>
                        <div className="card-body">
                          <div className="alert alert-info mb-3">
                            <i className="bi bi-info-circle-fill me-2"></i>
                            Para começar, clique no botão "Conectar WhatsApp"
                          </div>
                            
                          <h6 className="text-primary mb-3">Como funciona:</h6>
                          <ol className="ps-3">
                            <li className="mb-2">Clique em "Conectar WhatsApp" para iniciar</li>
                            <li className="mb-2">Um QR Code será exibido nesta tela</li>
                            <li className="mb-2">Abra o WhatsApp no seu telefone</li>
                            <li className="mb-2">Vá em Menu &gt; WhatsApp Web</li>
                            <li className="mb-2">Escaneie o QR Code com seu telefone</li>
                            <li>Pronto! Sua conta estará conectada</li>
                          </ol>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {status === 'connected' && (
                  <div className="card mt-2" style={{ 
                    borderRadius: '12px', 
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', 
                    border: 'none' 
                  }}>
                    <div className="card-header bg-transparent border-0 pt-3 pb-1">
                      <h5 className="mb-0" style={{ color: '#7e57c2' }}>Envio de Mensagens</h5>
                    </div>
                    <div className="card-body">
                      <div className="alert alert-success">
                        <i className="bi bi-check-circle me-2"></i>
                        Sua integração com WhatsApp está ativa e você pode enviar mensagens normalmente!
                      </div>
                      
                      <p>
                        Para começar a enviar mensagens, você pode usar o módulo de WhatsApp.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default WhatsAppPage;