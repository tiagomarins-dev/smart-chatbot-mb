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
      router.push(`/login?redirect=/projects/${id}`);
    }
  }, [isAuthenticated, isLoading, router, id]);

  // Fetch project data
  useEffect(() => {
    const fetchProject = async () => {
      if (!isAuthenticated || !id) return;
      
      try {
        setLoading(true);
        const response = await projectsApi.getProject(id as string);
        
        if (response.success && response.data?.project) {
          setProject(response.data.project);
        } else {
          setError('Falha ao carregar dados do projeto');
        }
      } catch (err) {
        console.error('Error fetching project:', err);
        setError('Falha ao carregar dados do projeto');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [isAuthenticated, id]);

  if (isLoading || loading) {
    return (
      <Layout title="Detalhes do Projeto | Smart-ChatBox">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Detalhes do Projeto | Smart-ChatBox">
        <div className="container py-5">
          <div className="alert alert-danger">{error}</div>
          <div className="text-center mt-4">
            <Link href="/projects" className="btn btn-outline-primary">
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
        <div className="container py-5">
          <div className="text-center py-5">
            <i className="bi bi-exclamation-triangle text-warning display-1 mb-4"></i>
            <h2 className="fw-bold">Projeto não encontrado</h2>
            <p className="text-muted">O projeto que você está procurando não existe ou foi removido.</p>
            <Link href="/projects" className="btn btn-primary mt-3">
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
      <div className="container py-5">
        <div className="d-flex justify-content-between align-items-center mb-5">
          <div>
            <div className="d-flex align-items-center mb-2">
              <Link href="/projects" className="text-decoration-none me-2">
                <i className="bi bi-arrow-left"></i>
              </Link>
              <h1 className="fw-bold m-0" style={{ color: '#7e57c2' }}>{project.name}</h1>
            </div>
            <div className="d-flex align-items-center">
              <span className={`badge bg-${getStatusColor(project.status)} me-3`}>
                {getStatusDisplayName(project.status)}
              </span>
              {project.company_name && (
                <span className="text-muted">
                  <i className="bi bi-building me-1"></i>
                  {project.company_name}
                </span>
              )}
            </div>
          </div>
          <div className="d-flex gap-2">
            <Link href={`/projects/${project.id}/edit`} className="btn btn-outline-primary">
              <i className="bi bi-pencil me-2"></i>
              Editar
            </Link>
            <button 
              className="btn btn-outline-danger"
              onClick={() => {
                if (confirm('Tem certeza que deseja excluir este projeto? Esta ação não pode ser desfeita.')) {
                  // Handle delete logic here
                  projectsApi.deleteProject(project.id as string)
                    .then(response => {
                      if (response.success) {
                        router.push('/projects');
                      } else {
                        setError('Falha ao excluir projeto');
                      }
                    });
                }
              }}
            >
              <i className="bi bi-trash me-2"></i>
              Excluir
            </button>
          </div>
        </div>
        
        <div className="row">
          <div className="col-lg-8">
            <div className="card mb-4">
              <div className="card-header bg-transparent border-0">
                <h5 className="card-title mb-0 fw-bold">
                  <i className="bi bi-info-circle me-2 text-primary"></i>
                  Detalhes do Projeto
                </h5>
              </div>
              <div className="card-body">
                <div className="row mb-4">
                  <div className="col-md-6 mb-3">
                    <h6 className="text-muted fw-medium">Data de Início</h6>
                    <p className="fw-medium">
                      {project.start_date
                        ? new Date(project.start_date).toLocaleDateString()
                        : 'Não definida'}
                    </p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <h6 className="text-muted fw-medium">Data de Término</h6>
                    <p className="fw-medium">
                      {project.end_date
                        ? new Date(project.end_date).toLocaleDateString()
                        : 'Não definida'}
                    </p>
                  </div>
                </div>
                
                <h6 className="text-muted fw-medium">Descrição</h6>
                <p>{project.description || 'Nenhuma descrição disponível'}</p>
              </div>
            </div>
          </div>
          
          <div className="col-lg-4">
            <div className="card mb-4">
              <div className="card-header bg-transparent border-0">
                <h5 className="card-title mb-0 fw-bold">
                  <i className="bi bi-activity me-2 text-primary"></i>
                  Estatísticas
                </h5>
              </div>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="text-muted">Visualizações</span>
                  <span className="fw-bold">{project.views_count || 0}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="text-muted">Cadastrado em</span>
                  <span className="fw-bold">
                    {project.created_at
                      ? new Date(project.created_at).toLocaleDateString()
                      : 'N/A'}
                  </span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted">Atualizado em</span>
                  <span className="fw-bold">
                    {project.updated_at
                      ? new Date(project.updated_at).toLocaleDateString()
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="card">
              <div className="card-header bg-transparent border-0">
                <h5 className="card-title mb-0 fw-bold">
                  <i className="bi bi-link-45deg me-2 text-primary"></i>
                  Links Rápidos
                </h5>
              </div>
              <div className="card-body">
                <div className="list-group list-group-flush">
                  <Link 
                    href="/leads/new?project_id={project.id}" 
                    className="list-group-item list-group-item-action d-flex justify-content-between align-items-center border-0"
                  >
                    <span>Adicionar lead a este projeto</span>
                    <i className="bi bi-chevron-right"></i>
                  </Link>
                  <Link 
                    href={`/projects/${project.id}/leads`} 
                    className="list-group-item list-group-item-action d-flex justify-content-between align-items-center border-0"
                  >
                    <span>Ver leads deste projeto</span>
                    <i className="bi bi-chevron-right"></i>
                  </Link>
                  <Link 
                    href={`/companies/${project.company_id}`} 
                    className="list-group-item list-group-item-action d-flex justify-content-between align-items-center border-0"
                  >
                    <span>Ver empresa relacionada</span>
                    <i className="bi bi-chevron-right"></i>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

// Helper function to get the appropriate color for project status
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

// Helper function to get status display name
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

export default ProjectDetailPage;