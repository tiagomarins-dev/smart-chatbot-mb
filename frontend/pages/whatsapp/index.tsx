import { NextPage } from 'next';
import { useState, useEffect, useRef } from 'react';
import Layout from '../../src/components/layout/Layout';
import { useAuth } from '../../src/contexts/AuthContext';
import { useRouter } from 'next/router';
import whatsappApi from '../../src/api/whatsapp';

const WhatsAppPage: NextPage = () => {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  
  // Estado da página
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [authenticated, setAuthenticated] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [recipient, setRecipient] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    console.log("Auth status:", { loading, isAuthenticated });
    fetchStatus();
    
    // Configurar atualizações periódicas de status e mensagens
    const statusInterval = setInterval(() => {
      if (isAuthenticated && !loading) {
        console.log("Periodic status update");
        fetchStatus();
      }
    }, 10000); // Atualizar a cada 10 segundos
    
    const messagesInterval = setInterval(() => {
      if (isAuthenticated && authenticated) {
        console.log("Periodic messages update");
        fetchMessages();
      }
    }, 5000); // Atualizar mensagens a cada 5 segundos
    
    // Limpar intervalos ao desmontar
    return () => {
      clearInterval(statusInterval);
      clearInterval(messagesInterval);
    };
  }, [isAuthenticated, loading, router, authenticated]);

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
  
  // Buscar status do WhatsApp
  const fetchStatus = async () => {
    try {
      setIsLoading(true);
      const result = await whatsappApi.getStatus();
      console.log("Status API result:", result);
      
      if (result.success && result.data) {
        setStatus(result.data.status as any);
        setAuthenticated(result.data.authenticated || false);
        setLastUpdated(new Date());
        setStatusMessage(null);
        
        // Atualizar o número de telefone diretamente da resposta de status
        if (result.data.phoneNumber) {
          console.log("Setting phone number from status:", result.data.phoneNumber);
          setPhoneNumber(result.data.phoneNumber);
        }
        
        if (result.data.authenticated) {
          // Buscar mensagens se estiver autenticado
          fetchMessages();
        }
        
        if (result.data.status === 'connecting' && !result.data.authenticated) {
          // Se estiver conectando e não autenticado, buscar QR code
          fetchQRCode();
        }
      }
    } catch (err) {
      console.error("Error fetching status:", err);
      setError('Erro ao buscar status do WhatsApp');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Buscar QR code
  const fetchQRCode = async () => {
    try {
      const result = await whatsappApi.getQRCode();
      if (result.success && result.data?.qrcode) {
        setQrCode(result.data.qrcode);
      }
    } catch (err) {
      console.error("Error fetching QR code:", err);
    }
  };
  
  // Buscar número de telefone
  const fetchPhone = async () => {
    try {
      const result = await whatsappApi.getPhone();
      if (result.success && result.data?.phoneNumber) {
        setPhoneNumber(result.data.phoneNumber);
      }
    } catch (err) {
      console.error("Error fetching phone:", err);
    }
  };
  
  // Conectar ao WhatsApp
  const handleConnect = async () => {
    try {
      setIsLoading(true);
      setStatusMessage('Iniciando conexão...');
      const result = await whatsappApi.connect();
      if (result.success) {
        setStatus('connecting');
        setStatusMessage('Conexão iniciada. Aguardando QR code...');
        setTimeout(fetchStatus, 1000);
      } else {
        setError(result.error || 'Erro ao conectar WhatsApp');
      }
    } catch (err) {
      console.error("Connect error:", err);
      setError('Erro ao conectar WhatsApp');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Desconectar do WhatsApp
  const handleDisconnect = async () => {
    try {
      setIsLoading(true);
      setStatusMessage('Desconectando...');
      const result = await whatsappApi.disconnect();
      if (result.success) {
        setStatus('disconnected');
        setAuthenticated(false);
        setQrCode(null);
        setPhoneNumber(null);
        setStatusMessage('Desconectado com sucesso');
        setTimeout(() => setStatusMessage(null), 3000);
      } else {
        setError(result.error || 'Erro ao desconectar WhatsApp');
      }
    } catch (err) {
      console.error("Disconnect error:", err);
      setError('Erro ao desconectar WhatsApp');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Autenticação simulada
  const handleMockAuth = async () => {
    try {
      setIsLoading(true);
      setStatusMessage('Autenticando...');
      const result = await whatsappApi.mockAuthenticate();
      if (result.success) {
        setStatus('connected');
        setAuthenticated(true);
        setQrCode(null);
        setStatusMessage('Autenticado com sucesso (simulação)');
        fetchStatus();
      } else {
        setError(result.error || 'Erro na autenticação simulada');
      }
    } catch (err) {
      console.error("Mock auth error:", err);
      setError('Erro na autenticação simulada');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Enviar mensagem
  const handleSendMessage = async () => {
    if (!recipient || !message) {
      setError('Informe o número e a mensagem');
      return;
    }
    
    try {
      setIsLoading(true);
      setStatusMessage('Enviando mensagem...');
      const result = await whatsappApi.sendMessage(recipient, message);
      if (result.success) {
        setStatusMessage('Mensagem enviada com sucesso');
        setMessage('');
        fetchMessages();
      } else {
        setError(result.error || 'Erro ao enviar mensagem');
      }
    } catch (err) {
      console.error("Send message error:", err);
      setError('Erro ao enviar mensagem');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Buscar mensagens
  const fetchMessages = async () => {
    try {
      console.log("Fetching WhatsApp messages...");
      const result = await whatsappApi.getMessages();
      console.log("Messages result:", result);
      
      if (result.success && result.data) {
        // Processar os dados de mensagens
        let formattedMessages = [];
        
        // A resposta pode vir em diferentes formatos dependendo da API
        if (Array.isArray(result.data)) {
          // Formato de array simples
          formattedMessages = result.data;
        } else if (result.data.messages && typeof result.data.messages === 'object') {
          // Formato de objeto mensagens agrupado por número
          const messagesObj = result.data.messages;
          for (const [phoneNumber, msgs] of Object.entries(messagesObj)) {
            if (Array.isArray(msgs)) {
              formattedMessages = [...formattedMessages, ...msgs];
            }
          }
        }
        
        // Ordenar mensagens por timestamp (mais recente primeiro)
        formattedMessages.sort((a, b) => {
          const timeA = new Date(a.timestamp || 0).getTime();
          const timeB = new Date(b.timestamp || 0).getTime();
          return timeB - timeA;
        });
        
        console.log("Formatted messages:", formattedMessages);
        setMessages(formattedMessages);
        
        // Fazer scroll para a mensagem mais recente quando mensagens são atualizadas
        setTimeout(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
          }
        }, 100);
        
        // Tocar som de notificação se recebemos novas mensagens
        if (formattedMessages.length > messages.length) {
          // Verificar se alguma mensagem é nova (comparando horários)
          const currentNewestTime = messages.length > 0 
            ? new Date(messages[0]?.timestamp || 0).getTime() 
            : 0;
            
          const hasNewMessages = formattedMessages.some(msg => 
            !msg.fromMe && new Date(msg.timestamp || 0).getTime() > currentNewestTime
          );
          
          if (hasNewMessages) {
            console.log("New messages detected!");
            setHasNewMessages(true);
            
            // Depois de 3 segundos, remover o indicador de novas mensagens
            setTimeout(() => {
              setHasNewMessages(false);
            }, 3000);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };
  
  // Obter QR em texto plano
  const fetchQRPlain = async () => {
    try {
      const result = await whatsappApi.getQRCodePlain();
      if (result.success && result.data) {
        alert('QR Code em texto plano: ' + result.data);
      } else {
        setError(result.error || 'QR Code não disponível em texto plano');
      }
    } catch (err) {
      console.error("Error fetching QR plain:", err);
      setError('Erro ao obter QR em texto plano');
    }
  };
  
  // Limpar mensagens
  const handleClearMessages = async () => {
    try {
      setIsLoading(true);
      const result = await whatsappApi.clearMessages();
      if (result.success) {
        setStatusMessage('Mensagens limpas com sucesso');
        fetchMessages();
      } else {
        setError(result.error || 'Erro ao limpar mensagens');
      }
    } catch (err) {
      console.error("Clear messages error:", err);
      setError('Erro ao limpar mensagens');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Obter a cor de status para exibir
  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'bg-success';
      case 'connecting':
        return 'bg-warning';
      default:
        return 'bg-secondary';
    }
  };
  
  // Formatar número de telefone para exibição
  const formatPhoneNumber = (phone: string | null) => {
    if (!phone) return '';
    
    // Formato brasileiro: +55 (21) 98786-8395
    if (phone.startsWith('55') && phone.length >= 12) {
      const ddd = phone.substring(2, 4);
      const firstPart = phone.substring(4, 9);
      const secondPart = phone.substring(9);
      return `+55 (${ddd}) ${firstPart}-${secondPart}`;
    }
    
    // Outros formatos - exibir com espaços para legibilidade
    return phone.replace(/(\d{2})(\d{2})(\d{5})(\d+)/, '+$1 ($2) $3-$4');
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
                    <div>
                      <h2 className="mb-0" style={{ color: '#7e57c2' }}>WhatsApp</h2>
                      {phoneNumber && (
                        <div className="text-muted small">
                          <i className="bi bi-phone me-1"></i>
                          {formatPhoneNumber(phoneNumber)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="d-flex flex-column align-items-end">
                    <span className={`badge ${getStatusColor()} px-3 py-2`}>
                      {status === 'connected' ? 'Conectado' : 
                       status === 'connecting' ? 'Conectando' : 
                       'Desconectado'}
                    </span>
                    {status === 'connected' && phoneNumber && (
                      <span className="small text-success mt-1">
                        <i className="bi bi-check-circle-fill me-1"></i>
                        Pronto para enviar mensagens
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="card-body p-4">
                {error && (
                  <div className="alert alert-danger mb-3">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error}
                    <button 
                      type="button" 
                      className="btn-close float-end" 
                      onClick={() => setError(null)}
                    />
                  </div>
                )}
                
                {statusMessage && (
                  <div className="alert alert-info mb-3">
                    <i className="bi bi-info-circle-fill me-2"></i>
                    {statusMessage}
                    <button 
                      type="button" 
                      className="btn-close float-end" 
                      onClick={() => setStatusMessage(null)}
                    />
                  </div>
                )}
                
                <div className="row mb-4">
                  <div className="col-md-6">
                    <div className="card mb-3" style={{ 
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
                            <span className="ms-2">
                              {status === 'connected' ? 'Conectado' : 
                               status === 'connecting' ? 'Conectando' : 
                               'Desconectado'}
                            </span>
                          </div>
                          
                          {lastUpdated && (
                            <div className="text-muted small">
                              Última atualização: {formatDateTime(lastUpdated)}
                            </div>
                          )}
                          
                          <div className="mt-2">
                            <i className="bi bi-phone me-2"></i>
                            Número conectado: <span className="fw-bold text-success">{phoneNumber ? formatPhoneNumber(phoneNumber) : 'Nenhum telefone conectado'}</span>
                            {phoneNumber && (
                              <small className="d-block text-muted mt-1">
                                As mensagens serão enviadas a partir deste número
                              </small>
                            )}
                          </div>
                        </div>
                        
                        <div className="d-grid gap-2">
                          {status === 'disconnected' ? (
                            <button 
                              className="btn btn-primary" 
                              onClick={handleConnect}
                              disabled={isLoading}
                            >
                              {isLoading ? 
                                <><span className="spinner-border spinner-border-sm me-2" /> Conectando...</> : 
                                <><i className="bi bi-box-arrow-in-right me-2"></i> Conectar</>
                              }
                            </button>
                          ) : (
                            <button 
                              className="btn btn-danger" 
                              onClick={handleDisconnect}
                              disabled={isLoading}
                            >
                              {isLoading ? 
                                <><span className="spinner-border spinner-border-sm me-2" /> Desconectando...</> : 
                                <><i className="bi bi-box-arrow-left me-2"></i> Desconectar</>
                              }
                            </button>
                          )}
                          
                          <div className="d-flex gap-2 mt-2">
                            <button 
                              className="btn btn-info flex-grow-1" 
                              onClick={fetchStatus}
                              disabled={isLoading}
                            >
                              <i className="bi bi-arrow-repeat me-2"></i> Atualizar Status
                            </button>
                            
                            <button 
                              className="btn btn-warning flex-grow-1" 
                              onClick={handleMockAuth}
                              disabled={isLoading || authenticated}
                            >
                              <i className="bi bi-patch-check me-2"></i> Auth Simulada
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {status === 'connecting' && qrCode && (
                      <div className="card mb-3" style={{ 
                        borderRadius: '12px', 
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', 
                        border: 'none' 
                      }}>
                        <div className="card-header bg-transparent border-0 pt-3 pb-1">
                          <h5 className="mb-0" style={{ color: '#7e57c2' }}>QR Code</h5>
                        </div>
                        <div className="card-body text-center">
                          <div className="alert alert-warning mb-3">
                            <i className="bi bi-qr-code me-2"></i>
                            Escaneie este QR Code com seu WhatsApp
                          </div>
                          
                          <div className="border p-2 d-inline-block mb-3">
                            <img 
                              src={qrCode} 
                              alt="QR Code" 
                              style={{ maxWidth: '200px' }} 
                            />
                          </div>
                          
                          <div>
                            <button 
                              className="btn btn-sm btn-outline-secondary" 
                              onClick={fetchQRPlain}
                            >
                              <i className="bi bi-clipboard me-2"></i>
                              Ver QR em Texto
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="col-md-6">
                    <div className="card" style={{ 
                      borderRadius: '12px', 
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', 
                      border: 'none' 
                    }}>
                      <div className="card-header bg-transparent border-0 pt-3 pb-1">
                        <h5 className="mb-0" style={{ color: '#7e57c2' }}>Enviar Mensagem</h5>
                      </div>
                      <div className="card-body">
                        <div className="form-group mb-3">
                          <label htmlFor="recipient" className="form-label">Número do Destinatário</label>
                          <div className="input-group">
                            <input 
                              type="text" 
                              className="form-control" 
                              id="recipient" 
                              placeholder="Ex: 5511999999999" 
                              value={recipient}
                              onChange={(e) => setRecipient(e.target.value)}
                              disabled={!authenticated}
                            />
                            <button 
                              className="btn btn-outline-primary" 
                              type="button"
                              onClick={() => {
                                if (phoneNumber) {
                                  setRecipient(phoneNumber);
                                }
                              }}
                              disabled={!authenticated || !phoneNumber}
                              title="Usar o mesmo número conectado (para testes)"
                            >
                              <i className="bi bi-phone-fill"></i> Usar este celular
                            </button>
                          </div>
                          <small className="form-text text-muted">
                            Formato: códígo do país + DDD + número (ex: 5521987868395)
                          </small>
                        </div>
                        
                        <div className="form-group mb-3">
                          <label htmlFor="message" className="form-label">Mensagem</label>
                          <textarea 
                            className="form-control" 
                            id="message" 
                            rows={3} 
                            placeholder="Digite sua mensagem aqui" 
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            disabled={!authenticated}
                          />
                        </div>
                        
                        <div className="d-grid">
                          <button 
                            className="btn btn-success" 
                            onClick={handleSendMessage}
                            disabled={isLoading || !authenticated || !recipient || !message}
                          >
                            {isLoading ? 
                              <><span className="spinner-border spinner-border-sm me-2" /> Enviando...</> : 
                              <><i className="bi bi-send me-2"></i> Enviar Mensagem</>
                            }
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="card" style={{ 
                  borderRadius: '12px', 
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', 
                  border: 'none' 
                }}>
                  <div className="card-header bg-transparent border-0 pt-3 pb-1 d-flex justify-content-between align-items-center">
                    <h5 className="mb-0" style={{ color: '#7e57c2' }}>Histórico de Mensagens</h5>
                    <div>
                      <button 
                        className="btn btn-sm btn-outline-secondary me-2" 
                        onClick={fetchMessages}
                        disabled={isLoading}
                      >
                        <i className="bi bi-arrow-repeat me-1"></i> Atualizar
                      </button>
                      <button 
                        className="btn btn-sm btn-outline-danger" 
                        onClick={handleClearMessages}
                        disabled={isLoading}
                      >
                        <i className="bi bi-trash me-1"></i> Limpar
                      </button>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="d-flex justify-content-between mb-3">
                      <div>
                        <span className="badge bg-primary me-2">{messages.length} mensagens</span>
                        {hasNewMessages && (
                          <span className="badge bg-success animate__animated animate__pulse animate__infinite">
                            <i className="bi bi-bell me-1"></i> Novas mensagens
                          </span>
                        )}
                        {messages.length > 0 && 
                          <small className="text-muted ms-2">Última atualização: {formatDateTime(new Date())}</small>
                        }
                      </div>
                      <div>
                        <div className="form-check form-switch d-inline-block me-3">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            id="autoUpdate"
                            checked={true}
                            readOnly
                          />
                          <label className="form-check-label" htmlFor="autoUpdate">
                            Atualização automática
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    {messages.length > 0 ? (
                      <div 
                        ref={messagesContainerRef}
                        className={`messages-container ${hasNewMessages ? 'border border-success' : ''}`}
                        style={{
                          maxHeight: '400px',
                          overflowY: 'auto',
                          padding: '10px',
                          transition: 'border-color 0.5s ease',
                          borderRadius: '8px'
                        }}
                      >
                        {messages.map(msg => {
                          const isOutgoing = msg.fromMe;
                          const fromPhone = msg.from?.replace('@c.us', '');
                          const toPhone = msg.to?.replace('@c.us', '');
                          
                          return (
                            <div 
                              key={msg.id} 
                              className={`message-bubble mb-3 ${isOutgoing ? 'text-end' : ''}`}
                            >
                              <div 
                                className={`d-inline-block p-3 rounded-3 ${
                                  isOutgoing ? 'bg-primary text-white' : 'bg-light'
                                }`}
                                style={{
                                  maxWidth: '80%',
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                }}
                              >
                                <div className="message-header mb-1">
                                  <small className={isOutgoing ? 'text-white-50' : 'text-muted'}>
                                    {isOutgoing ? 
                                      <>Enviado para: {formatPhoneNumber(toPhone)}</> : 
                                      <>Recebido de: {formatPhoneNumber(fromPhone)}</>
                                    }
                                  </small>
                                </div>
                                <div className="message-body">
                                  {msg.body}
                                </div>
                                <div className="message-footer mt-1">
                                  <small className={isOutgoing ? 'text-white-50' : 'text-muted'}>
                                    {new Date(msg.timestamp).toLocaleString('pt-BR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </small>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="alert alert-info">
                        <i className="bi bi-info-circle me-2"></i>
                        Nenhuma mensagem encontrada
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default WhatsAppPage;