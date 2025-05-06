import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../src/components/layout/Layout';
import { useAuth } from '../../src/contexts/AuthContext';
import companiesApi from '../../src/api/companies';
import projectsApi from '../../src/api/projects';
import { Company, Project } from '../../src/interfaces';

const CompanyDetailPage: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  
  const [company, setCompany] = useState<Company | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/login?redirect=/empresas/${id}`);
    }
  }, [isAuthenticated, isLoading, router, id]);

  // Fetch company and its projects
  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!isAuthenticated || !id) return;
      
      try {
        setLoading(true);
        
        // Fetch company details
        const companyResponse = await companiesApi.getCompany(id as string);
        
        if (companyResponse.success && companyResponse.data?.company) {
          setCompany(companyResponse.data.company);
          
          // Fetch company projects
          const projectsResponse = await projectsApi.getProjects({ company_id: id });
          
          if (projectsResponse.success && projectsResponse.data?.projects) {
            setProjects(projectsResponse.data.projects);
          }
        } else {
          setError('Falha ao carregar dados da empresa');
        }
      } catch (err) {
        console.error('Error fetching company data:', err);
        setError('Falha ao carregar dados da empresa');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyData();
  }, [isAuthenticated, id]);

  // Toggle company status
  const handleToggleStatus = async () => {
    if (!company || !company.id) return;
    
    try {
      setLoading(true);
      
      const updatedCompany = {
        ...company,
        is_active: !company.is_active
      };
      
      const response = await companiesApi.updateCompany(company.id, updatedCompany);
      
      if (response.success && response.data?.company) {
        setCompany(response.data.company);
      } else {
        setError('Falha ao atualizar status da empresa');
      }
    } catch (err) {
      console.error('Error updating company status:', err);
      setError('Falha ao atualizar status da empresa');
    } finally {
      setLoading(false);
    }
  };

  // Handle company deletion
  const handleDeleteCompany = async () => {
    if (!company || !company.id) return;
    
    if (window.confirm('Tem certeza que deseja excluir esta empresa? Esta ação não pode ser desfeita.')) {
      try {
        setLoading(true);
        
        const response = await companiesApi.deleteCompany(company.id);
        
        if (response.success) {
          router.push('/empresas');
        } else {
          setError('Falha ao excluir empresa');
        }
      } catch (err) {
        console.error('Error deleting company:', err);
        setError('Falha ao excluir empresa');
      } finally {
        setLoading(false);
      }
    }
  };

  if (isLoading || loading) {
    return (
      <Layout title="Detalhes da Empresa | Smart-ChatBox">
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
      <Layout title="Erro | Smart-ChatBox">
        <div className="container py-4">
          <div className="alert alert-danger">{error}</div>
          <div className="text-center mt-4">
            <Link href="/empresas" className="btn btn-outline-primary">
              <i className="bi bi-arrow-left me-2"></i>
              Voltar para Empresas
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  if (!company) {
    return (
      <Layout title="Empresa não encontrada | Smart-ChatBox">
        <div className="container py-4">
          <div className="text-center py-5">
            <i className="bi bi-exclamation-triangle text-warning display-1 mb-4"></i>
            <h2 className="fw-bold">Empresa não encontrada</h2>
            <p className="text-muted">A empresa que você está procurando não existe ou foi removida.</p>
            <Link href="/empresas" className="btn btn-primary mt-3">
              <i className="bi bi-arrow-left me-2"></i>
              Voltar para Empresas
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`${company.name} | Smart-ChatBox`}>
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <div className="d-flex align-items-center mb-2">
              <Link href="/empresas" className="text-decoration-none me-2">
                <i className="bi bi-arrow-left"></i>
              </Link>
              <h1 className="fw-bold m-0" style={{ color: '#7e57c2' }}>{company.name}</h1>
            </div>
            <span className={`badge ${company.is_active ? 'bg-success' : 'bg-secondary'}`}>
              {company.is_active ? 'Ativa' : 'Inativa'}
            </span>
          </div>
          <div className="d-flex gap-2">
            <button
              className={`btn ${company.is_active ? 'btn-outline-secondary' : 'btn-outline-success'}`}
              onClick={handleToggleStatus}
              disabled={loading}
            >
              <i className={`bi ${company.is_active ? 'bi-x-circle' : 'bi-check-circle'} me-2`}></i>
              {company.is_active ? 'Desativar' : 'Ativar'}
            </button>
            <Link href={`/empresas/${company.id}/edit`} className="btn btn-outline-primary">
              <i className="bi bi-pencil me-2"></i>
              Editar
            </Link>
            <button 
              className="btn btn-outline-danger"
              onClick={handleDeleteCompany}
              disabled={loading}
            >
              <i className="bi bi-trash me-2"></i>
              Excluir
            </button>
          </div>
        </div>
        
        <div className="row">
          <div className="col-lg-8">
            <div className="card mb-3">
              <div className="card-header bg-transparent border-0">
                <h5 className="card-title mb-0 fw-bold">
                  <i className="bi bi-info-circle me-2" style={{ color: "#7e57c2" }}></i>
                  Detalhes da Empresa
                </h5>
              </div>
              <div className="card-body">
                <div className="row mb-4">
                  <div className="col-md-6 mb-3">
                    <h6 className="text-muted fw-medium">ID da Empresa</h6>
                    <p className="fw-medium">{company.id}</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <h6 className="text-muted fw-medium">Status</h6>
                    <p className="fw-medium">
                      <span className={`badge ${company.is_active ? 'bg-success' : 'bg-secondary'}`}>
                        {company.is_active ? 'Ativa' : 'Inativa'}
                      </span>
                    </p>
                  </div>
                </div>
                
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <h6 className="text-muted fw-medium">Data de Criação</h6>
                    <p className="fw-medium">
                      {company.created_at
                        ? new Date(company.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <h6 className="text-muted fw-medium">Última Atualização</h6>
                    <p className="fw-medium">
                      {company.updated_at
                        ? new Date(company.updated_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Company Projects */}
            <div className="card">
              <div className="card-header bg-transparent border-0 d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0 fw-bold">
                  <i className="bi bi-folder me-2" style={{ color: "#7e57c2" }}></i>
                  Projetos da Empresa
                </h5>
                <Link href={`/projetos/new?company_id=${company.id}`} className="btn btn-sm btn-primary">
                  <i className="bi bi-plus-lg me-1"></i>
                  Novo Projeto
                </Link>
              </div>
              <div className="card-body">
                {projects.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover mobile-card-table">
                      <thead>
                        <tr>
                          <th>NOME</th>
                          <th>STATUS</th>
                          <th>DATA DE INÍCIO</th>
                          <th>DATA DE TÉRMINO</th>
                          <th>AÇÕES</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projects.map(project => (
                          <tr key={project.id}>
                            <td data-label="Nome">
                              <Link href={`/projetos/${project.id}`} className="text-decoration-none fw-medium">
                                {project.name}
                              </Link>
                            </td>
                            <td data-label="Status">
                              <span className={`badge bg-${getStatusColor(project.status)}`}>
                                {getStatusDisplayName(project.status)}
                              </span>
                            </td>
                            <td data-label="Data de Início">
                              {project.start_date
                                ? new Date(project.start_date).toLocaleDateString()
                                : 'N/A'}
                            </td>
                            <td data-label="Data de Término">
                              {project.end_date
                                ? new Date(project.end_date).toLocaleDateString()
                                : 'N/A'}
                            </td>
                            <td data-label="Ações">
                              <div className="d-flex gap-2">
                                <Link href={`/projetos/${project.id}`} className="btn btn-sm btn-outline-primary">
                                  <i className="bi bi-eye"></i>
                                </Link>
                                <Link href={`/projetos/${project.id}/edit`} className="btn btn-sm btn-outline-secondary">
                                  <i className="bi bi-pencil"></i>
                                </Link>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <i className="bi bi-folder text-muted fs-1 mb-3"></i>
                    <h6 className="fw-normal">Nenhum projeto encontrado</h6>
                    <p className="text-muted">Esta empresa ainda não possui projetos.</p>
                    <Link href={`/projetos/new?company_id=${company.id}`} className="btn btn-primary mt-2">
                      <i className="bi bi-plus-lg me-2"></i>
                      Criar Projeto
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="col-lg-4">
            <div className="card mb-3">
              <div className="card-header bg-transparent border-0">
                <h5 className="card-title mb-0 fw-bold">
                  <i className="bi bi-activity me-2" style={{ color: "#7e57c2" }}></i>
                  Estatísticas
                </h5>
              </div>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="text-muted">Total de Projetos</span>
                  <span className="fw-bold">{projects.length}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="text-muted">Projetos Ativos</span>
                  <span className="fw-bold">{projects.filter(p => p.is_active).length}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted">Cadastrado em</span>
                  <span className="fw-bold">
                    {company.created_at
                      ? new Date(company.created_at).toLocaleDateString()
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="card">
              <div className="card-header bg-transparent border-0">
                <h5 className="card-title mb-0 fw-bold">
                  <i className="bi bi-link-45deg me-2" style={{ color: "#7e57c2" }}></i>
                  Ações Rápidas
                </h5>
              </div>
              <div className="card-body">
                <div className="list-group list-group-flush">
                  <Link 
                    href={`/projetos/new?company_id=${company.id}`} 
                    className="list-group-item list-group-item-action d-flex justify-content-between align-items-center border-0"
                  >
                    <span>Adicionar novo projeto</span>
                    <i className="bi bi-chevron-right"></i>
                  </Link>
                  <Link 
                    href={`/leads?company_id=${company.id}`} 
                    className="list-group-item list-group-item-action d-flex justify-content-between align-items-center border-0"
                  >
                    <span>Ver leads desta empresa</span>
                    <i className="bi bi-chevron-right"></i>
                  </Link>
                  <button 
                    className="list-group-item list-group-item-action d-flex justify-content-between align-items-center border-0"
                    onClick={handleToggleStatus}
                  >
                    <span>{company.is_active ? 'Desativar empresa' : 'Ativar empresa'}</span>
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

// Helper functions for project status
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'em_planejamento':
      return 'info';
    case 'em_andamento':
      return 'primary';
    case 'pausado':
      return 'warning';
    case 'concluido':
      return 'success';
    case 'cancelado':
      return 'danger';
    default:
      return 'secondary';
  }
};

const getStatusDisplayName = (status: string): string => {
  switch (status) {
    case 'em_planejamento': return 'Em Planejamento';
    case 'em_andamento': return 'Em Andamento';
    case 'pausado': return 'Pausado';
    case 'concluido': return 'Concluído';
    case 'cancelado': return 'Cancelado';
    default: return status;
  }
};

export default CompanyDetailPage;