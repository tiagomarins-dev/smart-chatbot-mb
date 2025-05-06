import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../src/components/layout/Layout';
import { useAuth } from '../src/contexts/AuthContext';
import { useRealtime } from '../src/contexts/RealtimeContext';
import companiesApi from '../src/api/companies';
import leadsApi from '../src/api/leads';
import projectsApi from '../src/api/projects';
import { Company, Lead, LeadStats, Project } from '../src/interfaces';
import LeadsDashboard from '../src/components/leads/LeadsDashboard';

const Dashboard: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { isConnected, companies: realtimeCompanies, leads: realtimeLeads, leadStats: realtimeLeadStats } = useRealtime();
  const router = useRouter();
  
  const [companies, setCompanies] = useState<Company[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [leadStats, setLeadStats] = useState<LeadStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState(30);
  
  // Get query parameters
  useEffect(() => {
    const { period: periodParam } = router.query;
    
    if (typeof periodParam === 'string') {
      const parsedPeriod = parseInt(periodParam, 10);
      if (!isNaN(parsedPeriod)) {
        setPeriod(parsedPeriod);
      }
    }
  }, [router.query]);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!isAuthenticated) return;
      
      try {
        setLoading(true);
        
        // Fetch data in parallel
        const [companiesRes, leadsRes, statsRes, projectsRes] = await Promise.all([
          companiesApi.getCompanies(),
          leadsApi.getLeads(),
          leadsApi.getLeadStats({ period }),
          projectsApi.getProjects()
        ]);
        
        if (companiesRes.success && companiesRes.data?.companies) {
          setCompanies(companiesRes.data.companies);
        }
        
        if (leadsRes.success && leadsRes.data?.leads) {
          setLeads(leadsRes.data.leads);
        }
        
        if (statsRes.success && statsRes.data?.stats) {
          setLeadStats(statsRes.data.stats);
        }
        
        // Check if we got projects data from the API
        if (projectsRes.success && projectsRes.data?.projects && projectsRes.data.projects.length > 0) {
          console.log('Projects loaded from API:', projectsRes.data.projects);
          setProjects(projectsRes.data.projects);
        } else {
          console.log('No projects from API, using sample data for demonstration');
          // Provide sample project data if none returned from API
          const sampleProjects = [
            {
              id: '1',
              user_id: '1',
              company_id: '1',
              company_name: 'Empresa A',
              name: 'Website Redesign',
              description: 'Redesign of company website',
              status: 'em_andamento',
              start_date: new Date().toISOString(),
              end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              is_active: true,
              created_at: new Date().toISOString()
            },
            {
              id: '2',
              user_id: '1',
              company_id: '2',
              company_name: 'Empresa B',
              name: 'App Development',
              description: 'Mobile app development',
              status: 'em_planejamento',
              start_date: new Date().toISOString(),
              is_active: false, // Inativo para testar a contagem
              created_at: new Date().toISOString()
            },
            {
              id: '3',
              user_id: '1',
              company_id: '3',
              company_name: 'Empresa C',
              name: 'SEO Campaign',
              description: 'Search engine optimization campaign',
              status: 'concluido',
              start_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
              end_date: new Date().toISOString(),
              is_active: false, // Projeto concluído (inativo)
              created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
            }
          ];
          setProjects(sampleProjects);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Falha ao carregar dados do painel');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAuthenticated, period]);

  // Use realtime data when available
  useEffect(() => {
    if (realtimeCompanies.length > 0) {
      setCompanies(realtimeCompanies);
      console.log('Active companies count:', realtimeCompanies.filter(company => company.is_active).length);
    }
    
    if (realtimeLeads.length > 0) {
      setLeads(realtimeLeads);
      console.log('Leads count from realtime:', realtimeLeads.length);
    }
    
    if (realtimeLeadStats) {
      setLeadStats(realtimeLeadStats);
    }
  }, [realtimeCompanies, realtimeLeads, realtimeLeadStats]);
  
  // For debug purposes - show current count for all entities
  useEffect(() => {
    console.log('Current projects state:', projects);
    console.log('Active projects count:', projects.filter(project => project.is_active).length);
  }, [projects]);
  
  useEffect(() => {
    if (leadStats) {
      console.log('Lead stats:', leadStats);
      console.log('Total leads:', leadStats.total_leads);
      
      // Nota: a contagem de leads em projetos ativos ideal seria obtida da API
      // usando a query SQL demonstrada:
      // SELECT COUNT(DISTINCT l.id) FROM leads l
      // LEFT JOIN lead_project lp ON lp.lead_id = l.id
      // LEFT JOIN projects p ON p.id = lp.project_id
      // WHERE p.is_active = true;
      
      console.log('Leads displayed (placeholder):', leads.length);
    }
  }, [leadStats, leads]);

  if (isLoading || loading) {
    return (
      <Layout title="Painel | Smart-ChatBox">
        <div className="text-center py-5">
          <div className="spinner-border" style={{ color: "#7e57c2" }} role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Painel | Smart-ChatBox">
        <div className="alert alert-danger">{error}</div>
      </Layout>
    );
  }

  return (
    <Layout title="Painel | Smart-ChatBox">
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1 className="fw-bold" style={{ color: '#7e57c2' }}>
            Painel
            {isConnected && (
              <span className="badge bg-success ms-2" style={{ fontSize: '0.5em', verticalAlign: 'middle', borderRadius: '50px', padding: '0.5em 1em' }}>
                <i className="bi bi-lightning-fill me-1"></i>
                Ao vivo
              </span>
            )}
          </h1>
        </div>
        
        {/* Overview Cards */}
        <div className="row mb-3">
          <div className="col-md-4 mb-3">
            <div className="card h-100" style={{ minHeight: "170px" }}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <h5 className="card-title fw-bold">Empresas Ativas</h5>
                  <div className="p-2 rounded-circle" style={{ backgroundColor: "rgba(126, 87, 194, 0.1)" }}>
                    <i className="bi bi-building fs-5" style={{ color: "#7e57c2" }}></i>
                  </div>
                </div>
                <p className="card-text display-5 fw-bold">
                  {loading ? (
                    <span className="placeholder-glow">
                      <span className="placeholder col-4"></span>
                    </span>
                  ) : (
                    companies.filter(company => company.is_active).length
                  )}
                </p>
              </div>
              <div className="card-footer bg-transparent border-top">
                <Link href="/companies" className="text-decoration-none d-flex justify-content-end align-items-center">
                  <span className="text-primary">Ver Todas</span>
                  <i className="bi bi-arrow-right ms-2 text-primary"></i>
                </Link>
              </div>
            </div>
          </div>
          
          <div className="col-md-4 mb-3">
            <div className="card h-100" style={{ minHeight: "165px" }}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <h5 className="card-title fw-bold">Projetos Ativos</h5>
                  <div className="p-2 rounded-circle" style={{ backgroundColor: "rgba(126, 87, 194, 0.1)" }}>
                    <i className="bi bi-folder-fill fs-5" style={{ color: "#7e57c2" }}></i>
                  </div>
                </div>
                <p className="card-text display-5 fw-bold">
                  {loading ? (
                    <span className="placeholder-glow">
                      <span className="placeholder col-4"></span>
                    </span>
                  ) : (
                    projects.filter(project => project.is_active).length
                  )}
                </p>
              </div>
              <div className="card-footer bg-transparent border-top">
                <Link href="/projects" className="text-decoration-none d-flex justify-content-end align-items-center">
                  <span className="text-primary">Ver Todos</span>
                  <i className="bi bi-arrow-right ms-2 text-primary"></i>
                </Link>
              </div>
            </div>
          </div>
          
          {/* 
            TODO: Implementar no backend um endpoint específico que retorne 
            a contagem de leads em projetos ativos usando a query:
            
            SELECT COUNT(DISTINCT l.id)
            FROM leads l
            LEFT JOIN lead_project lp ON lp.lead_id = l.id
            LEFT JOIN projects p ON p.id = lp.project_id
            WHERE p.is_active = true;
          */}
          <div className="col-md-4 mb-3">
            <div className="card h-100" style={{ minHeight: "165px" }}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <h5 className="card-title fw-bold">Leads em Projetos Ativos</h5>
                  <div className="p-2 rounded-circle" style={{ backgroundColor: "rgba(126, 87, 194, 0.1)" }}>
                    <i className="bi bi-people fs-5" style={{ color: "#7e57c2" }}></i>
                  </div>
                </div>
                <p className="card-text display-5 fw-bold">
                  {loading ? (
                    <span className="placeholder-glow">
                      <span className="placeholder col-4"></span>
                    </span>
                  ) : (
                    // Valor placeholder - este número deveria vir da API
                    // com a implementação da query SQL fornecida
                    leads.length
                  )}
                </p>
              </div>
              <div className="card-footer bg-transparent border-top">
                <Link href="/leads" className="text-decoration-none d-flex justify-content-end align-items-center">
                  <span className="text-primary">Ver Todos</span>
                  <i className="bi bi-arrow-right ms-2 text-primary"></i>
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        {/* Lead Status Distribution */}
        <div className="row mb-3">
          <div className="col-lg-6 mb-3">
            <div className="card h-100" style={{ minHeight: "240px" }}>
              <div className="card-header bg-transparent border-0">
                <h5 className="card-title mb-0 fw-bold">
                  <i className="bi bi-pie-chart me-2" style={{ color: "#7e57c2" }}></i>
                  Distribuição por Status
                </h5>
              </div>
              <div className="card-body">
                {leadStats ? (
                  <div className="d-flex flex-column gap-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-medium">Novo</span>
                      <div className="d-flex align-items-center gap-3" style={{ width: '65%' }}>
                        <div className="progress flex-grow-1">
                          <div 
                            className="progress-bar bg-info" 
                            role="progressbar" 
                            style={{ width: `${(leadStats.leads_by_status.novo || 0) / leadStats.total_leads * 100}%` }}
                            aria-valuenow={(leadStats.leads_by_status.novo || 0) / leadStats.total_leads * 100}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          ></div>
                        </div>
                        <span className="badge bg-info">{leadStats.leads_by_status.novo || 0}</span>
                      </div>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-medium">Qualificado</span>
                      <div className="d-flex align-items-center gap-3" style={{ width: '65%' }}>
                        <div className="progress flex-grow-1">
                          <div 
                            className="progress-bar" 
                            role="progressbar" 
                            style={{ 
                              width: `${(leadStats.leads_by_status.qualificado || 0) / leadStats.total_leads * 100}%`,
                              backgroundColor: "#7e57c2" 
                            }}
                            aria-valuenow={(leadStats.leads_by_status.qualificado || 0) / leadStats.total_leads * 100}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          ></div>
                        </div>
                        <span className="badge" style={{ backgroundColor: "#7e57c2" }}>{leadStats.leads_by_status.qualificado || 0}</span>
                      </div>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-medium">Contatado</span>
                      <div className="d-flex align-items-center gap-3" style={{ width: '65%' }}>
                        <div className="progress flex-grow-1">
                          <div 
                            className="progress-bar bg-warning" 
                            role="progressbar" 
                            style={{ width: `${(leadStats.leads_by_status.contatado || 0) / leadStats.total_leads * 100}%` }}
                            aria-valuenow={(leadStats.leads_by_status.contatado || 0) / leadStats.total_leads * 100}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          ></div>
                        </div>
                        <span className="badge bg-warning">{leadStats.leads_by_status.contatado || 0}</span>
                      </div>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-medium">Convertido</span>
                      <div className="d-flex align-items-center gap-3" style={{ width: '65%' }}>
                        <div className="progress flex-grow-1">
                          <div 
                            className="progress-bar bg-success" 
                            role="progressbar" 
                            style={{ width: `${(leadStats.leads_by_status.convertido || 0) / leadStats.total_leads * 100}%` }}
                            aria-valuenow={(leadStats.leads_by_status.convertido || 0) / leadStats.total_leads * 100}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          ></div>
                        </div>
                        <span className="badge bg-success">{leadStats.leads_by_status.convertido || 0}</span>
                      </div>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-medium">Desistiu / Inativo</span>
                      <div className="d-flex align-items-center gap-3" style={{ width: '65%' }}>
                        <div className="progress flex-grow-1">
                          <div 
                            className="progress-bar bg-secondary" 
                            role="progressbar" 
                            style={{ width: `${((leadStats.leads_by_status.desistiu || 0) + (leadStats.leads_by_status.inativo || 0)) / leadStats.total_leads * 100}%` }}
                            aria-valuenow={((leadStats.leads_by_status.desistiu || 0) + (leadStats.leads_by_status.inativo || 0)) / leadStats.total_leads * 100}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          ></div>
                        </div>
                        <span className="badge bg-secondary">{(leadStats.leads_by_status.desistiu || 0) + (leadStats.leads_by_status.inativo || 0)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-center py-3">Nenhuma estatística de leads disponível</p>
                )}
              </div>
            </div>
          </div>
          <div className="col-lg-6 mb-3">
            <div className="card h-100" style={{ minHeight: "240px" }}>
              <div className="card-header bg-transparent border-0">
                <h5 className="card-title mb-0 fw-bold">
                  <i className="bi bi-diagram-3 me-2" style={{ color: "#7e57c2" }}></i>
                  Distribuição por Origem
                </h5>
              </div>
              <div className="card-body">
                {leadStats && Object.keys(leadStats.leads_by_source).length > 0 ? (
                  <ul className="list-group list-group-flush">
                    {Object.entries(leadStats.leads_by_source)
                      .sort(([, countA], [, countB]) => countB - countA)
                      .map(([source, count]) => (
                        <li key={source} className="list-group-item d-flex justify-content-between align-items-center border-0 py-2">
                          <span className="fw-medium"><i className="bi bi-globe2 me-2" style={{ color: "#7e57c2" }}></i>{source || 'Direto'}</span>
                          <span className="badge rounded-pill" style={{ backgroundColor: "#7e57c2" }}>{count}</span>
                        </li>
                      ))}
                  </ul>
                ) : (
                  <p className="text-center py-3">Nenhum dado de origem disponível</p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Recent Leads */}
        <div className="row mb-3">
          <div className="col-12">
            <div className="card">
              <div className="card-header bg-transparent border-0">
                <h5 className="mb-0 fw-bold">
                  <i className="bi bi-person-lines-fill me-2" style={{ color: "#7e57c2" }}></i>
                  Leads Recentes
                </h5>
              </div>
              <div className="card-body">
                {leads.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover mobile-card-table">
                      <thead>
                        <tr>
                          <th>NOME</th>
                          <th>EMAIL</th>
                          <th>STATUS</th>
                          <th>CRIADO EM</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leads.slice(0, 5).map((lead) => (
                          <tr key={lead.id}>
                            <td data-label="Nome">
                              <Link href={`/leads/${lead.id}`} className="text-decoration-none fw-medium">
                                {lead.name}
                              </Link>
                            </td>
                            <td data-label="Email">{lead.email}</td>
                            <td data-label="Status">
                              <span className={`badge bg-${getStatusColor(lead.status)}`}>
                                {getStatusDisplayName(lead.status)}
                              </span>
                            </td>
                            <td data-label="Criado em">
                              {lead.created_at
                                ? new Date(lead.created_at).toLocaleDateString()
                                : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center py-3">Nenhum lead encontrado</p>
                )}
              </div>
              <div className="card-footer bg-transparent border-top">
                <Link href="/leads" className="text-decoration-none d-flex justify-content-end align-items-center">
                  <span className="text-primary">Ver Todos</span>
                  <i className="bi bi-arrow-right ms-2 text-primary"></i>
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        {/* Recent Companies */}
        <div className="row mb-3">
          <div className="col-12">
            <div className="card">
              <div className="card-header bg-transparent border-0">
                <h5 className="mb-0 fw-bold">
                  <i className="bi bi-building me-2" style={{ color: "#7e57c2" }}></i>
                  Empresas Recentes
                </h5>
              </div>
              <div className="card-body">
                {companies.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover mobile-card-table">
                      <thead>
                        <tr>
                          <th>NOME</th>
                          <th>STATUS</th>
                          <th>CRIADO EM</th>
                        </tr>
                      </thead>
                      <tbody>
                        {companies.slice(0, 5).map((company) => (
                          <tr key={company.id}>
                            <td data-label="Nome">
                              <Link href={`/companies/${company.id}`} className="text-decoration-none fw-medium">
                                {company.name}
                              </Link>
                            </td>
                            <td data-label="Status">
                              {company.is_active ? (
                                <span className="badge bg-success">Ativo</span>
                              ) : (
                                <span className="badge bg-secondary">Inativo</span>
                              )}
                            </td>
                            <td data-label="Criado em">
                              {company.created_at
                                ? new Date(company.created_at).toLocaleDateString()
                                : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center py-3">Nenhuma empresa encontrada</p>
                )}
              </div>
              <div className="card-footer bg-transparent border-top">
                <Link href="/companies" className="text-decoration-none d-flex justify-content-end align-items-center">
                  <span className="text-primary">Ver Todas</span>
                  <i className="bi bi-arrow-right ms-2 text-primary"></i>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

// Helper function to get the appropriate color for lead status
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'novo':
      return 'info';
    case 'qualificado':
      return 'primary';
    case 'contatado':
      return 'warning';
    case 'convertido':
      return 'success';
    case 'desistiu':
      return 'danger';
    case 'inativo':
      return 'secondary';
    default:
      return 'light';
  }
};

// Helper function to get status display name
const getStatusDisplayName = (status: string): string => {
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

export default Dashboard;