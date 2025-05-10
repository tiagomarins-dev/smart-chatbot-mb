import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Lead } from '../../interfaces';
import leadsApi from '../../api/leads';
import { useRealtime } from '../../contexts/RealtimeContext';

interface LeadsListProps {
  filters?: Record<string, any>;
}

const LeadsList: React.FC<LeadsListProps> = ({ filters = {} }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get realtime context
  const { isConnected, subscribeToLeads, unsubscribeFromLeads } = useRealtime();
  
  // Track if we have real-time updates enabled
  const [hasRealTimeUpdates, setHasRealTimeUpdates] = useState(false);

  // Initial data fetch
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLoading(true);
        const queryParams: Record<string, any> = {};
        
        // Add project_id filter if it exists
        if (filters.project_id) {
          queryParams.project_id = filters.project_id;
        }
        
        const response = await leadsApi.getLeads(queryParams);
        
        if (response.success && response.data?.leads) {
          setLeads(response.data.leads);
        } else {
          setError(response.error || 'Falha ao buscar leads');
        }
      } catch (err) {
        console.error('Error fetching leads:', err);
        setError('Ocorreu um erro ao buscar os leads');
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, [filters.project_id]);
  
  // Apply client-side filters
  useEffect(() => {
    let result = [...leads];
    
    // Filter by company_id - this requires checking the lead's projects
    if (filters.company_id) {
      result = result.filter(lead => {
        // This is a simplified approach - in a real app, you might need to check lead_project table
        // This assumes leads have a company_id field or that you've already joined the data
        return lead.company_id === filters.company_id;
      });
    }
    
    // Filter by search term (name, email, phone)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(lead => 
        (lead.name && lead.name.toLowerCase().includes(searchLower)) ||
        (lead.email && lead.email.toLowerCase().includes(searchLower)) ||
        (lead.phone && lead.phone.includes(filters.search))
      );
    }
    
    // Filter by UTM parameters
    if (filters.utm_source) {
      result = result.filter(lead => lead.utm_source === filters.utm_source);
    }
    
    if (filters.utm_medium) {
      result = result.filter(lead => lead.utm_medium === filters.utm_medium);
    }
    
    if (filters.utm_campaign) {
      result = result.filter(lead => lead.utm_campaign === filters.utm_campaign);
    }
    
    setFilteredLeads(result);
  }, [leads, filters]);
  
  // Set up real-time updates when connection is established
  useEffect(() => {
    if (isConnected && !hasRealTimeUpdates) {
      // Handler for lead events
      const handleLeadEvent = (data: any) => {
        // For project-specific lists, only process events for this project
        if (filters.project_id && data.new && data.new.project_id !== filters.project_id) {
          return;
        }
        
        if (data.new) {
          const newLead = data.new as Lead;
          
          // Handle INSERT
          if (data.event === 'INSERT') {
            setLeads(prev => {
              // Check if we already have this lead (to avoid duplicates)
              const exists = prev.some(l => l.id === newLead.id);
              if (exists) return prev;
              
              return [...prev, newLead];
            });
          }
          
          // Handle UPDATE
          else if (data.event === 'UPDATE') {
            setLeads(prev => prev.map(l => l.id === newLead.id ? newLead : l));
          }
        }
        // Handle DELETE
        else if (data.event === 'DELETE' && data.old) {
          const oldLead = data.old as Lead;
          if (filters.project_id && oldLead.project_id !== filters.project_id) {
            return;
          }
          setLeads(prev => prev.filter(l => l.id !== oldLead.id));
        }
      };
      
      // Subscribe to all lead events
      subscribeToLeads(handleLeadEvent);
      setHasRealTimeUpdates(true);
      
      // Cleanup when component unmounts
      return () => {
        unsubscribeFromLeads(handleLeadEvent);
      };
    }
  }, [isConnected, hasRealTimeUpdates, filters.project_id, subscribeToLeads, unsubscribeFromLeads]);

  const handleStatusUpdate = async (id: string, status: Lead['status']) => {
    try {
      const response = await leadsApi.updateLeadStatus(id, { status });
      
      if (response.success) {
        // With real-time updates, the state will be updated automatically
        // But we'll also update it directly for immediate feedback
        if (!hasRealTimeUpdates) {
          setLeads(leads.map(lead => 
            lead.id === id ? { ...lead, status } : lead
          ));
        }
      } else {
        setError(response.error || 'Failed to update lead status');
      }
    } catch (err) {
      console.error('Error updating lead status:', err);
      setError('An error occurred while updating the lead status');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" style={{ color: '#7e57c2' }}></div>
        <p className="mt-2 text-muted">Carregando leads...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert" style={{ 
        backgroundColor: 'rgba(239, 83, 80, 0.1)', 
        color: '#ef5350', 
        borderRadius: '12px',
        border: '1px solid rgba(239, 83, 80, 0.2)',
        padding: '1rem'
      }}>
        <i className="bi bi-exclamation-triangle me-2"></i>
        {error}
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="card" style={{ 
        borderRadius: '12px', 
        boxShadow: '0 6px 16px rgba(0, 0, 0, 0.07)',
        border: 'none',
        padding: '2rem'
      }}>
        <div className="text-center py-5">
          <div className="p-3 mb-4 rounded-circle mx-auto" style={{ backgroundColor: 'rgba(126, 87, 194, 0.1)', width: 'fit-content' }}>
            <i className="bi bi-people fs-1" style={{ color: '#7e57c2' }}></i>
          </div>
          <p className="mb-4">Nenhum lead encontrado</p>
          <Link href="/leads/new" className="btn" style={{ 
            backgroundColor: '#7e57c2',
            color: 'white',
            borderRadius: '8px',
            padding: '0.6rem 1.25rem',
            fontWeight: 500,
            border: 'none',
            boxShadow: '0 2px 8px rgba(126, 87, 194, 0.25)'
          }}>
            <i className="bi bi-plus-circle me-2"></i>
            Adicionar Lead
          </Link>
        </div>
      </div>
    );
  }
  
  // No leads found after filtering
  if (filteredLeads.length === 0) {
    return (
      <div className="alert" style={{ 
        backgroundColor: 'rgba(255, 183, 77, 0.1)', 
        color: '#ffb74d', 
        borderRadius: '12px',
        border: '1px solid rgba(255, 183, 77, 0.2)',
        padding: '1rem'
      }}>
        <i className="bi bi-funnel me-2"></i>
        Nenhum lead encontrado com os filtros aplicados. Tente ajustar seus critérios de busca.
      </div>
    );
  }
  
  // Sort leads by creation date (newest first)
  const sortedLeads = [...filteredLeads].sort((a, b) => {
    if (!a.created_at) return 1;
    if (!b.created_at) return -1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Helper function to get badge color based on status
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

  // Helper function to get sentiment badge color
  const getSentimentBadgeColor = (status?: string) => {
    switch (status) {
      case 'interessado': return 'bg-success';
      case 'compra futura': return 'bg-primary';
      case 'achou caro': return 'bg-warning';
      case 'quer desconto': return 'bg-warning';
      case 'parcelamento': return 'bg-info';
      case 'sem interesse': return 'bg-danger';
      case 'indeterminado': return 'bg-secondary';
      default: return 'bg-light text-muted';
    }
  };

  // Helper function to get sentiment display name
  const getSentimentDisplayName = (status?: string) => {
    switch (status) {
      case 'interessado': return 'Interessado';
      case 'compra futura': return 'Compra Futura';
      case 'achou caro': return 'Achou Caro';
      case 'quer desconto': return 'Quer Desconto';
      case 'parcelamento': return 'Parcelamento';
      case 'sem interesse': return 'Sem Interesse';
      case 'indeterminado': return 'Indeterminado';
      default: return 'Não analisado';
    }
  };

  return (
    <div className="card" style={{ 
      borderRadius: '12px', 
      boxShadow: '0 6px 16px rgba(0, 0, 0, 0.07)',
      border: 'none',
      animation: 'slideInUp 0.5s ease-out',
      animationDelay: '0.3s'
    }}>
      <div className="card-header" style={{ 
        backgroundColor: 'transparent',
        borderBottom: 'none',
        padding: '1rem 1.25rem',
        borderRadius: '12px'
      }}>
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <div className="p-2 rounded-circle me-3" style={{ backgroundColor: 'rgba(126, 87, 194, 0.1)' }}>
              <i className="bi bi-people fs-5" style={{ color: '#7e57c2' }}></i>
            </div>
            <h5 className="mb-0" style={{ color: '#7e57c2', fontWeight: 'bold' }}>
              Leads
              {isConnected && hasRealTimeUpdates && (
                <span className="badge ms-2" style={{ 
                  fontSize: '0.7em', 
                  backgroundColor: 'rgba(102, 187, 106, 0.1)', 
                  color: '#66bb6a',
                  padding: '0.35em 0.7em',
                  fontWeight: 500,
                  borderRadius: '6px'
                }}>
                  <i className="bi bi-lightning-fill me-1"></i>
                  Live
                </span>
              )}
            </h5>
          </div>
          <div className="d-flex align-items-center">
            <span className="text-muted me-3" style={{ fontSize: '0.9rem' }}>
              {filteredLeads.length} {filteredLeads.length === 1 ? 'lead' : 'leads'}
            </span>
            <Link href="/leads/new" className="btn" style={{ 
              backgroundColor: '#7e57c2',
              color: 'white',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              fontWeight: 500,
              border: 'none',
              boxShadow: '0 2px 8px rgba(126, 87, 194, 0.25)',
              fontSize: '0.9rem'
            }}>
              <i className="bi bi-plus-circle me-2"></i>
              Novo Lead
            </Link>
          </div>
        </div>
      </div>
      
      <div className="card-body" style={{ padding: '0' }}>
        <div className="table-responsive">
          <table className="table table-hover" style={{ 
            margin: '0',
            borderRadius: '0 0 12px 12px',
            overflow: 'hidden'
          }}>
            <thead style={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}>
              <tr>
                <th style={{ padding: '0.7rem 1.25rem', fontWeight: '600', color: '#616161' }}>Nome</th>
                <th style={{ padding: '0.7rem 1.25rem', fontWeight: '600', color: '#616161' }}>E-mail</th>
                <th style={{ padding: '0.7rem 1.25rem', fontWeight: '600', color: '#616161' }}>Telefone</th>
                <th style={{ padding: '0.7rem 1.25rem', fontWeight: '600', color: '#616161' }}>Status</th>
                <th style={{ padding: '0.7rem 1.25rem', fontWeight: '600', color: '#616161' }}>Sentimento</th>
                <th style={{ padding: '0.7rem 1.25rem', fontWeight: '600', color: '#616161' }}>Score</th>
                <th style={{ padding: '0.7rem 1.25rem', fontWeight: '600', color: '#616161' }}>Criado em</th>
                <th style={{ padding: '0.7rem 1.25rem', fontWeight: '600', color: '#616161', textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {sortedLeads.map((lead) => (
                <tr key={lead.id} style={{ 
                  transition: 'transform 0.2s ease, background-color 0.2s ease',
                  borderLeft: '3px solid transparent',
                  ':hover': {
                    transform: 'translateX(3px)',
                    borderLeft: '3px solid #7e57c2',
                    backgroundColor: 'rgba(126, 87, 194, 0.03)'
                  }
                }}>
                  <td style={{ padding: '0.9rem 1.25rem', verticalAlign: 'middle' }}>
                    <Link href={`/leads/${lead.id}`} style={{ 
                      color: '#673ab7', 
                      textDecoration: 'none',
                      fontWeight: '500'
                    }}>
                      {lead.name}
                    </Link>
                  </td>
                  <td style={{ padding: '0.9rem 1.25rem', verticalAlign: 'middle' }}>{lead.email}</td>
                  <td style={{ padding: '0.9rem 1.25rem', verticalAlign: 'middle' }}>{lead.phone}</td>
                  <td style={{ padding: '0.9rem 1.25rem', verticalAlign: 'middle' }}>
                    <div className="dropdown">
                      <span
                        className="badge dropdown-toggle"
                        role="button"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                        style={{
                          backgroundColor: getStatusBadgeColor(lead.status),
                          padding: '0.4em 0.7em',
                          fontWeight: 500,
                          borderRadius: '6px'
                        }}
                      >
                        {getStatusDisplayName(lead.status)}
                      </span>
                      <ul className="dropdown-menu" style={{
                        borderRadius: '8px',
                        boxShadow: '0 6px 16px rgba(0, 0, 0, 0.1)',
                        border: 'none',
                        padding: '0.5rem'
                      }}>
                        <li><button
                          className="dropdown-item"
                          onClick={() => lead.id && handleStatusUpdate(lead.id, 'novo')}
                          style={{ borderRadius: '6px', padding: '0.5rem 1rem' }}
                        >Novo</button></li>
                        <li><button
                          className="dropdown-item"
                          onClick={() => lead.id && handleStatusUpdate(lead.id, 'qualificado')}
                          style={{ borderRadius: '6px', padding: '0.5rem 1rem' }}
                        >Qualificado</button></li>
                        <li><button
                          className="dropdown-item"
                          onClick={() => lead.id && handleStatusUpdate(lead.id, 'contatado')}
                          style={{ borderRadius: '6px', padding: '0.5rem 1rem' }}
                        >Contatado</button></li>
                        <li><button
                          className="dropdown-item"
                          onClick={() => lead.id && handleStatusUpdate(lead.id, 'convertido')}
                          style={{ borderRadius: '6px', padding: '0.5rem 1rem' }}
                        >Convertido</button></li>
                        <li><hr className="dropdown-divider" /></li>
                        <li><button
                          className="dropdown-item text-danger"
                          onClick={() => lead.id && handleStatusUpdate(lead.id, 'desistiu')}
                          style={{ borderRadius: '6px', padding: '0.5rem 1rem' }}
                        >Desistiu</button></li>
                        <li><button
                          className="dropdown-item text-secondary"
                          onClick={() => lead.id && handleStatusUpdate(lead.id, 'inativo')}
                          style={{ borderRadius: '6px', padding: '0.5rem 1rem' }}
                        >Inativo</button></li>
                      </ul>
                    </div>
                  </td>
                  <td style={{ padding: '0.9rem 1.25rem', verticalAlign: 'middle' }}>
                    {lead.sentiment_status ? (
                      <span
                        className="badge"
                        style={{
                          backgroundColor: getSentimentBadgeColor(lead.sentiment_status),
                          padding: '0.4em 0.7em',
                          fontWeight: 500,
                          borderRadius: '6px',
                          cursor: 'default'
                        }}
                      >
                        {getSentimentDisplayName(lead.sentiment_status)}
                      </span>
                    ) : (
                      <span className="text-muted small">—</span>
                    )}
                  </td>
                  <td style={{ padding: '0.9rem 1.25rem', verticalAlign: 'middle' }}>
                    {lead.lead_score ? (
                      <div
                        className="progress"
                        style={{
                          height: '8px',
                          width: '100%',
                          maxWidth: '80px',
                          backgroundColor: '#e0e0e0'
                        }}
                      >
                        <div
                          className="progress-bar"
                          role="progressbar"
                          style={{
                            width: `${lead.lead_score}%`,
                            backgroundColor: lead.lead_score >= 80 ? '#4caf50' :
                                            lead.lead_score >= 60 ? '#2196f3' :
                                            lead.lead_score >= 40 ? '#ff9800' : '#f44336'
                          }}
                          aria-valuenow={lead.lead_score}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          data-bs-toggle="tooltip"
                          data-bs-placement="top"
                          title={`Score: ${lead.lead_score}/100`}
                        />
                      </div>
                    ) : (
                      <span className="text-muted small">—</span>
                    )}
                  </td>
                  <td style={{ padding: '0.9rem 1.25rem', verticalAlign: 'middle' }}>
                    {lead.created_at
                      ? new Date(lead.created_at).toLocaleDateString()
                      : 'N/A'}
                  </td>
                  <td style={{ padding: '0.9rem 1.25rem', verticalAlign: 'middle', textAlign: 'right' }}>
                    <Link
                      href={`/leads/${lead.id}/edit`}
                      className="btn btn-sm"
                      style={{ 
                        backgroundColor: 'rgba(126, 87, 194, 0.1)', 
                        color: '#7e57c2',
                        borderRadius: '6px',
                        padding: '0.4em 0.7em',
                        fontWeight: 500,
                        border: 'none'
                      }}
                    >
                      <i className="bi bi-pencil me-1"></i>
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LeadsList;