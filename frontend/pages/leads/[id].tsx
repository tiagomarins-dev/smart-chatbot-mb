import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Layout from '../../src/components/layout/Layout';
import { useAuth } from '../../src/contexts/AuthContext';
import { Lead, LeadEvent } from '../../src/interfaces';
import leadsApi from '../../src/api/leads';
import { useRealtime } from '../../src/contexts/RealtimeContext';
import Link from 'next/link';
import LeadEventTimeline from '../../src/components/leads/LeadEventTimeline';
import LeadWhatsAppChat from '../../src/components/leads/LeadWhatsAppChat';

const LeadDetailPage: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { isAuthenticated, loading } = useAuth();
  const [lead, setLead] = useState<Lead | null>(null);
  const [leadEvents, setLeadEvents] = useState<LeadEvent[]>([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventsError, setEventsError] = useState<string | null>(null);

  // Get realtime context
  const { isConnected, subscribeToLeads, unsubscribeFromLeads } = useRealtime();
  
  // Track if we have real-time updates enabled
  const [hasRealTimeUpdates, setHasRealTimeUpdates] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login?redirect=' + router.asPath);
    }
  }, [isAuthenticated, loading, router]);

  // Fetch lead data
  useEffect(() => {
    const fetchLead = async () => {
      if (!id || Array.isArray(id)) return;

      try {
        setFetchLoading(true);
        const response = await leadsApi.getLead(id);
        
        if (response.success && response.data?.lead) {
          setLead(response.data.lead);
        } else {
          setError(response.error || 'Falha ao buscar detalhes do lead');
        }
      } catch (err) {
        console.error('Error fetching lead:', err);
        setError('Ocorreu um erro ao buscar detalhes do lead');
      } finally {
        setFetchLoading(false);
      }
    };

    if (isAuthenticated && id) {
      fetchLead();
    }
  }, [id, isAuthenticated]);

  // Fetch lead events
  useEffect(() => {
    const fetchLeadEvents = async () => {
      if (!id || Array.isArray(id)) return;

      try {
        setEventsLoading(true);
        const response = await leadsApi.getLeadEvents(id);
        
        if (response.success && response.data?.events) {
          // Sort events by timestamp, newest first
          const sortedEvents = [...response.data.events].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          setLeadEvents(sortedEvents);
        } else {
          setEventsError(response.error || 'Falha ao buscar eventos do lead');
        }
      } catch (err) {
        console.error('Error fetching lead events:', err);
        setEventsError('Ocorreu um erro ao buscar eventos do lead');
      } finally {
        setEventsLoading(false);
      }
    };

    if (isAuthenticated && id) {
      fetchLeadEvents();
    }
  }, [id, isAuthenticated]);

  // Set up real-time updates
  useEffect(() => {
    if (isConnected && !hasRealTimeUpdates && lead?.id) {
      // Handler for lead events
      const handleLeadEvent = (data: any) => {
        if (!lead) return;
        
        if (data.event === 'UPDATE' && data.new?.id === lead.id) {
          setLead(data.new);
          
          // Refresh lead events when lead is updated
          if (lead.id && typeof lead.id === 'string') {
            leadsApi.getLeadEvents(lead.id).then(response => {
              if (response.success && response.data?.events) {
                const sortedEvents = [...response.data.events].sort(
                  (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
                setLeadEvents(sortedEvents);
              }
            });
          }
        } else if (data.event === 'DELETE' && data.old?.id === lead.id) {
          // Lead was deleted, redirect to leads list
          router.push('/leads');
        }
      };
      
      // Subscribe to lead events
      subscribeToLeads(handleLeadEvent);
      setHasRealTimeUpdates(true);
      
      // Cleanup when component unmounts
      return () => {
        unsubscribeFromLeads(handleLeadEvent);
      };
    }
  }, [isConnected, hasRealTimeUpdates, lead, router, subscribeToLeads, unsubscribeFromLeads]);

  // Helper function to get status badge color
  const getStatusBadgeColor = (status: Lead['status']) => {
    switch (status) {
      case 'novo': return 'bg-info';
      case 'qualificado': return 'bg-primary';
      case 'contatado': return 'bg-warning';
      case 'convertido': return 'bg-success';
      case 'desistiu': return 'bg-danger';
      case 'inativo': return 'bg-secondary';
      default: return 'bg-light';
    }
  };

  // Helper function to get status display name
  const getStatusDisplayName = (status: Lead['status']) => {
    switch (status) {
      case 'novo': return 'Novo';
      case 'qualificado': return 'Qualificado';
      case 'contatado': return 'Contatado';
      case 'convertido': return 'Convertido';
      case 'desistiu': return 'Desistiu';
      case 'inativo': return 'Inativo';
      default: return status;
    }
  };

  if (loading || !isAuthenticated || fetchLoading) {
    return (
      <Layout>
        <div className="container py-5">
          <div className="text-center">
            <div className="spinner-border" role="status" style={{ color: '#7e57c2' }}>
              <span className="visually-hidden">Carregando...</span>
            </div>
            <p className="mt-3 text-muted">Carregando informações do lead...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container py-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center py-5">
              <i className="bi bi-exclamation-circle text-danger fs-1 mb-3"></i>
              <h3 className="mb-3">Erro ao Carregar Lead</h3>
              <p className="text-muted mb-4">{error}</p>
              <Link href="/leads" className="btn btn-primary px-4 py-2">
                <i className="bi bi-arrow-left me-2"></i>
                Voltar para Leads
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!lead) {
    return (
      <Layout>
        <div className="container py-4">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center py-5">
              <i className="bi bi-search text-muted fs-1 mb-3"></i>
              <h3 className="mb-3">Lead Não Encontrado</h3>
              <p className="text-muted mb-4">O lead solicitado não foi encontrado ou pode ter sido excluído.</p>
              <Link href="/leads" className="btn btn-primary px-4 py-2">
                <i className="bi bi-arrow-left me-2"></i>
                Voltar para Leads
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-4">
        {/* Header section with lead name and actions */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
          <div className="mb-3 mb-md-0">
            <div className="d-flex align-items-center">
              <div className="p-2 rounded-circle me-3" style={{ backgroundColor: 'rgba(126, 87, 194, 0.1)' }}>
                <i className="bi bi-person-fill fs-3" style={{ color: '#7e57c2' }}></i>
              </div>
              <div>
                <h1 className="mb-0 fs-2 fw-bold">{lead.name}</h1>
                <p className="text-muted mb-0">
                  <span className={`badge ${getStatusBadgeColor(lead.status)} me-2`}>
                    {getStatusDisplayName(lead.status)}
                  </span>
                  {isConnected && hasRealTimeUpdates && (
                    <span className="badge bg-success">
                      <i className="bi bi-lightning-fill me-1"></i>
                      Atualizações em Tempo Real
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
          <div className="d-flex gap-2">
            <Link href="/leads" className="btn btn-light">
              <i className="bi bi-arrow-left me-2"></i>
              Voltar
            </Link>
            <Link href={`/leads/${lead.id}/edit`} className="btn btn-primary">
              <i className="bi bi-pencil me-2"></i>
              Editar Lead
            </Link>
          </div>
        </div>

        <div className="row mb-4">
          {/* Lead Information Card */}
          <div className="col-lg-4 mb-4 mb-lg-0">
            <div className="card h-100">
              <div className="card-header d-flex align-items-center">
                <i className="bi bi-info-circle me-2" style={{ color: '#7e57c2' }}></i>
                <h5 className="mb-0">Informações do Lead</h5>
              </div>
              <div className="card-body">
                <div>
                  <h6 className="fw-semibold mb-3" style={{ color: '#7e57c2' }}>Detalhes de Contato</h6>
                  <div className="mb-3">
                    <div className="mb-1 text-muted small">Nome Completo</div>
                    <div className="fw-medium">{lead.name}</div>
                  </div>
                  <div className="mb-3">
                    <div className="mb-1 text-muted small">Email</div>
                    <div className="fw-medium">
                      <a href={`mailto:${lead.email}`} className="text-decoration-none d-flex align-items-center">
                        <i className="bi bi-envelope me-2 text-muted"></i>
                        {lead.email}
                      </a>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="mb-1 text-muted small">Telefone</div>
                    <div className="fw-medium">
                      <a href={`tel:${lead.phone}`} className="text-decoration-none d-flex align-items-center">
                        <i className="bi bi-telephone me-2 text-muted"></i>
                        {lead.phone}
                      </a>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h6 className="fw-semibold mb-3" style={{ color: '#7e57c2' }}>Detalhes do Lead</h6>
                  <div className="mb-3">
                    <div className="mb-1 text-muted small">Status</div>
                    <div className="fw-medium">
                      <span className={`badge ${getStatusBadgeColor(lead.status)}`}>
                        {getStatusDisplayName(lead.status)}
                      </span>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="mb-1 text-muted small">Criado em</div>
                    <div className="fw-medium d-flex align-items-center">
                      <i className="bi bi-calendar2 me-2 text-muted"></i>
                      {lead.created_at
                        ? new Date(lead.created_at).toLocaleString('pt-BR')
                        : 'N/A'}
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="mb-1 text-muted small">Última Atualização</div>
                    <div className="fw-medium d-flex align-items-center">
                      <i className="bi bi-clock-history me-2 text-muted"></i>
                      {lead.updated_at
                        ? new Date(lead.updated_at).toLocaleString('pt-BR')
                        : 'N/A'}
                    </div>
                  </div>
                </div>
                
                {/* Notes section */}
                {lead.notes && (
                  <div className="mt-4">
                    <h6 className="fw-semibold mb-3" style={{ color: '#7e57c2' }}>Anotações</h6>
                    <div className="p-3 bg-light rounded-3">
                      <p className="card-text mb-0" style={{ whiteSpace: 'pre-wrap' }}>{lead.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* WhatsApp Chat Card */}
          <div className="col-lg-5 mb-4 mb-lg-0">
            <LeadWhatsAppChat lead={lead} isConnected={isConnected} />
          </div>

          {/* Quick Actions and Stats Card */}
          <div className="col-lg-3">
            <div className="card mb-4">
              <div className="card-header d-flex align-items-center">
                <i className="bi bi-lightning me-2" style={{ color: '#7e57c2' }}></i>
                <h5 className="mb-0">Ações Rápidas</h5>
              </div>
              <div className="card-body">
                <div className="d-grid gap-2">
                  <a href={`mailto:${lead.email}`} className="btn btn-outline-primary d-flex align-items-center justify-content-center">
                    <i className="bi bi-envelope me-2"></i>
                    Enviar Email
                  </a>
                  <a href={`tel:${lead.phone}`} className="btn btn-outline-success d-flex align-items-center justify-content-center">
                    <i className="bi bi-telephone me-2"></i>
                    Ligar para Lead
                  </a>
                  <a href="/whatsapp" className="btn btn-outline-success d-flex align-items-center justify-content-center">
                    <i className="bi bi-whatsapp me-2"></i>
                    Abrir WhatsApp
                  </a>
                </div>
              </div>
            </div>

            {/* Lead Stats Card */}
            <div className="card">
              <div className="card-header d-flex align-items-center">
                <i className="bi bi-graph-up me-2" style={{ color: '#7e57c2' }}></i>
                <h5 className="mb-0">Estatísticas</h5>
              </div>
              <div className="card-body">
                <div className="d-flex flex-column gap-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                      <div className="p-2 rounded-circle" style={{ backgroundColor: 'rgba(66, 165, 245, 0.1)' }}>
                        <i className="bi bi-eye" style={{ color: '#42a5f5' }}></i>
                      </div>
                      <span>Visualizações</span>
                    </div>
                    <span className="badge bg-info rounded-pill">
                      {leadEvents.filter(e => e.event_type === 'page_view').length}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                      <div className="p-2 rounded-circle" style={{ backgroundColor: 'rgba(102, 187, 106, 0.1)' }}>
                        <i className="bi bi-whatsapp" style={{ color: '#66bb6a' }}></i>
                      </div>
                      <span>WhatsApp</span>
                    </div>
                    <span className="badge bg-success rounded-pill">
                      {leadEvents.filter(e => e.event_type === 'whatsapp_message').length}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                      <div className="p-2 rounded-circle" style={{ backgroundColor: 'rgba(255, 183, 77, 0.1)' }}>
                        <i className="bi bi-envelope" style={{ color: '#ffb74d' }}></i>
                      </div>
                      <span>Emails</span>
                    </div>
                    <span className="badge bg-warning rounded-pill">
                      {leadEvents.filter(e => e.event_type.includes('email')).length}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                      <div className="p-2 rounded-circle" style={{ backgroundColor: 'rgba(239, 83, 80, 0.1)' }}>
                        <i className="bi bi-telephone" style={{ color: '#ef5350' }}></i>
                      </div>
                      <span>Chamadas</span>
                    </div>
                    <span className="badge bg-danger rounded-pill">
                      {leadEvents.filter(e => e.event_type === 'call').length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lead Events Timeline */}
        <div className="card">
          <div className="card-header d-flex align-items-center">
            <i className="bi bi-clock-history me-2" style={{ color: '#7e57c2' }}></i>
            <h5 className="mb-0">Linha do Tempo de Atividades</h5>
          </div>
          <div className="card-body p-0 p-md-3">
            {eventsError ? (
              <div className="alert alert-warning m-3">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {eventsError}
              </div>
            ) : (
              <LeadEventTimeline events={leadEvents} loading={eventsLoading} />
            )}
          </div>
          {!eventsLoading && leadEvents.length > 0 && (
            <div className="card-footer d-flex justify-content-center">
              <button className="btn btn-sm btn-light">
                <i className="bi bi-download me-2"></i>
                Exportar Dados de Atividade
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default LeadDetailPage;