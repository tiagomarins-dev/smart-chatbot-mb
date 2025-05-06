import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../src/components/layout/Layout';
import { useAuth } from '../../src/contexts/AuthContext';
import projectsApi from '../../src/api/projects';
import { Project } from '../../src/interfaces';

const ProjectDetailPage: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/login?redirect=/projetos/${id}`);
    }
  }, [isAuthenticated, isLoading, router, id]);

  // Fetch project
  useEffect(() => {
    const fetchProjectData = async () => {
      if (!isAuthenticated || !id) return;
      
      try {
        setLoading(true);
        
        // Fetch project details
        const projectResponse = await projectsApi.getProject(id as string);
        
        if (projectResponse.success && projectResponse.data?.project) {
          const currentProject = projectResponse.data.project;
          setProject(currentProject);
          
          // Increment view count
          try {
            // Only increment if it's not a refreshing session (to avoid inflating view counts)
            if (sessionStorage.getItem(`viewed_project_${id}`) !== 'true') {
              const updatedViewCount = (currentProject.views_count || 0) + 1;
              
              await projectsApi.updateProject(id as string, {
                views_count: updatedViewCount
              });
              
              // Mark as viewed in this session
              sessionStorage.setItem(`viewed_project_${id}`, 'true');
            }
          } catch (viewError) {
            console.error('Error updating view count:', viewError);
            // Non-critical error, don't show to user
          }
        } else {
          setError('Falha ao carregar dados do projeto');
        }
      } catch (err) {
        console.error('Error fetching project data:', err);
        setError('Falha ao carregar dados do projeto');
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [isAuthenticated, id]);

  // Toggle project status
  const handleToggleStatus = async () => {
    if (!project || !project.id) return;
    
    try {
      setLoading(true);
      
      const updatedProject = {
        ...project,
        is_active: !project.is_active
      };
      
      const response = await projectsApi.updateProject(project.id, updatedProject);
      
      if (response.success && response.data?.project) {
        setProject(response.data.project);
      } else {
        setError('Falha ao atualizar status do projeto');
      }
    } catch (err) {
      console.error('Error updating project status:', err);
      setError('Falha ao atualizar status do projeto');
    } finally {
      setLoading(false);
    }
  };

  // Handle project deletion
  const handleDeleteProject = async () => {
    if (!project || !project.id) return;
    
    if (window.confirm('Tem certeza que deseja excluir este projeto? Esta ação não pode ser desfeita.')) {
      try {
        setLoading(true);
        
        const response = await projectsApi.deleteProject(project.id);
        
        if (response.success) {
          // Redirect to company page if available, else to projects list
          if (project.company_id) {
            router.push(`/empresas/${project.company_id}`);
          } else {
            router.push('/projetos');
          }
        } else {
          setError('Falha ao excluir projeto');
        }
      } catch (err) {
        console.error('Error deleting project:', err);
        setError('Falha ao excluir projeto');
      } finally {
        setLoading(false);
      }
    }
  };

  if (isLoading || loading) {
    return (
      <Layout title="Detalhes do Projeto | Smart-ChatBox">
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
            <Link href="/projetos" className="btn btn-outline-primary">
              <i className="bi bi-arrow-left me-2"></i>
              Voltar para Projetos
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout title="Projeto não encontrado | Smart-ChatBox">
        <div className="container py-4">
          <div className="text-center py-5">
            <i className="bi bi-exclamation-triangle text-warning display-1 mb-4"></i>
            <h2 className="fw-bold">Projeto não encontrado</h2>
            <p className="text-muted">O projeto que você está procurando não existe ou foi removido.</p>
            <Link href="/projetos" className="btn btn-primary mt-3">
              <i className="bi bi-arrow-left me-2"></i>
              Voltar para Projetos
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`${project.name} | Smart-ChatBox`}>
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <div className="d-flex align-items-center mb-2">
              {project.company_id ? (
                <Link href={`/empresas/${project.company_id}`} className="text-decoration-none me-2">
                  <i className="bi bi-arrow-left"></i>
                </Link>
              ) : (
                <Link href="/projetos" className="text-decoration-none me-2">
                  <i className="bi bi-arrow-left"></i>
                </Link>
              )}
              <h1 className="fw-bold m-0" style={{ color: '#7e57c2' }}>{project.name}</h1>
            </div>
            <div className="d-flex gap-2">
              <span className={`badge bg-${getStatusColor(project.status)}`}>
                {getStatusDisplayName(project.status)}
              </span>
              <span className={`badge ${project.is_active ? 'bg-success' : 'bg-secondary'}`}>
                {project.is_active ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          </div>
          <div className="d-flex gap-2">
            <button
              className={`btn ${project.is_active ? 'btn-outline-secondary' : 'btn-outline-success'}`}
              onClick={handleToggleStatus}
              disabled={loading}
            >
              <i className={`bi ${project.is_active ? 'bi-x-circle' : 'bi-check-circle'} me-2`}></i>
              {project.is_active ? 'Desativar' : 'Ativar'}
            </button>
            <Link href={`/projetos/${project.id}/edit`} className="btn btn-outline-primary">
              <i className="bi bi-pencil me-2"></i>
              Editar
            </Link>
            <button 
              className="btn btn-outline-danger"
              onClick={handleDeleteProject}
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
                  Detalhes do Projeto
                </h5>
              </div>
              <div className="card-body">
                <div className="row mb-4">
                  <div className="col-md-6 mb-3">
                    <h6 className="text-muted fw-medium">ID do Projeto</h6>
                    <p className="fw-medium">{project.id}</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <h6 className="text-muted fw-medium">Status</h6>
                    <p className="fw-medium">
                      <span className={`badge bg-${getStatusColor(project.status)}`}>
                        {getStatusDisplayName(project.status)}
                      </span>
                      <span className={`badge ms-1 ${project.is_active ? 'bg-success' : 'bg-secondary'}`}>
                        {project.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </p>
                  </div>
                </div>
                
                <div className="row mb-4">
                  <div className="col-md-6 mb-3">
                    <h6 className="text-muted fw-medium">Data de Início</h6>
                    <p className="fw-medium">
                      {project.campaign_start_date
                        ? new Date(project.campaign_start_date).toLocaleDateString('pt-BR')
                        : 'Não definida'}
                    </p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <h6 className="text-muted fw-medium">Data de Término</h6>
                    <p className="fw-medium">
                      {project.campaign_end_date
                        ? new Date(project.campaign_end_date).toLocaleDateString('pt-BR')
                        : 'Não definida'}
                    </p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h6 className="text-muted fw-medium">Descrição</h6>
                  <p className="fw-medium">
                    {project.description || 'Nenhuma descrição fornecida.'}
                  </p>
                </div>
                
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <h6 className="text-muted fw-medium">Data de Criação</h6>
                    <p className="fw-medium">
                      {project.created_at
                        ? new Date(project.created_at).toLocaleDateString('pt-BR', {
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
                      {project.updated_at
                        ? new Date(project.updated_at).toLocaleDateString('pt-BR', {
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
            
            {/* Project Leads section could be added here */}
            <div className="card">
              <div className="card-header bg-transparent border-0 d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0 fw-bold">
                  <i className="bi bi-people me-2" style={{ color: "#7e57c2" }}></i>
                  Leads do Projeto
                </h5>
                <Link href={`/leads/new?project_id=${project.id}`} className="btn btn-sm btn-primary">
                  <i className="bi bi-plus-lg me-1"></i>
                  Novo Lead
                </Link>
              </div>
              <div className="card-body">
                <div className="text-center py-4">
                  <i className="bi bi-people text-muted fs-1 mb-3"></i>
                  <h6 className="fw-normal">Nenhum lead encontrado</h6>
                  <p className="text-muted">Este projeto ainda não possui leads.</p>
                  <Link href={`/leads/new?project_id=${project.id}`} className="btn btn-primary mt-2">
                    <i className="bi bi-plus-lg me-2"></i>
                    Adicionar Lead
                  </Link>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-lg-4">
            {/* Company Info */}
            {project.company_id && (
              <div className="card mb-3">
                <div className="card-header bg-transparent border-0">
                  <h5 className="card-title mb-0 fw-bold">
                    <i className="bi bi-building me-2" style={{ color: "#7e57c2" }}></i>
                    Empresa
                  </h5>
                </div>
                <div className="card-body">
                  <h6 className="fw-bold">{project.company_name || 'Empresa'}</h6>
                  <Link href={`/empresas/${project.company_id}`} className="btn btn-sm btn-outline-primary w-100 mt-2">
                    <i className="bi bi-building me-2"></i>
                    Ver Detalhes da Empresa
                  </Link>
                </div>
              </div>
            )}
            
            {/* Project Statistics */}
            <div className="card mb-3">
              <div className="card-header bg-transparent border-0">
                <h5 className="card-title mb-0 fw-bold">
                  <i className="bi bi-graph-up me-2" style={{ color: "#7e57c2" }}></i>
                  Estatísticas
                </h5>
              </div>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="text-muted">Total de Visualizações</span>
                  <span className="fw-bold">{project.views_count || 0}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="text-muted">Total de Leads</span>
                  <span className="fw-bold">0</span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted">Dias em Atividade</span>
                  <span className="fw-bold">
                    {project.campaign_start_date
                      ? calculateDaysActive(project.campaign_start_date)
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Quick Actions */}
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
                    href={`/leads/new?project_id=${project.id}`} 
                    className="list-group-item list-group-item-action d-flex justify-content-between align-items-center border-0"
                  >
                    <span>Adicionar novo lead</span>
                    <i className="bi bi-chevron-right"></i>
                  </Link>
                  <Link 
                    href={`/leads?project_id=${project.id}`} 
                    className="list-group-item list-group-item-action d-flex justify-content-between align-items-center border-0"
                  >
                    <span>Ver leads deste projeto</span>
                    <i className="bi bi-chevron-right"></i>
                  </Link>
                  <button 
                    className="list-group-item list-group-item-action d-flex justify-content-between align-items-center border-0"
                    onClick={handleToggleStatus}
                  >
                    <span>{project.is_active ? 'Desativar projeto' : 'Ativar projeto'}</span>
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

// Calculate days active
const calculateDaysActive = (startDate: string): number => {
  const start = new Date(startDate);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export default ProjectDetailPage;