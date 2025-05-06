import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../src/components/layout/Layout';
import { useAuth } from '../../src/contexts/AuthContext';
import projectsApi from '../../src/api/projects';
import { Project } from '../../src/interfaces';

const ProjectsPage: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/projects');
    }
  }, [isAuthenticated, isLoading, router]);

  // Fetch projects data
  useEffect(() => {
    const fetchProjects = async () => {
      if (!isAuthenticated) return;
      
      try {
        setLoading(true);
        const response = await projectsApi.getProjects();
        
        if (response.success && response.data?.projects) {
          setProjects(response.data.projects);
        } else {
          setError('Falha ao carregar projetos');
        }
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError('Falha ao carregar projetos');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [isAuthenticated]);

  if (isLoading || loading) {
    return (
      <Layout title="Projetos | Smart-ChatBox">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Projetos | Smart-ChatBox">
      <div className="container py-5">
        <div className="d-flex justify-content-between align-items-center mb-5">
          <h1 className="fw-bold" style={{ color: '#7e57c2' }}>Projetos</h1>
          <Link href="/projects/new" className="btn btn-primary">
            <i className="bi bi-plus-lg me-2"></i>
            Novo Projeto
          </Link>
        </div>
        
        {error && <div className="alert alert-danger mb-4">{error}</div>}
        
        <div className="card">
          <div className="card-body">
            {projects.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>NOME</th>
                      <th>EMPRESA</th>
                      <th>DATA DE INÍCIO</th>
                      <th>DATA DE TÉRMINO</th>
                      <th>STATUS</th>
                      <th>AÇÕES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((project) => (
                      <tr key={project.id}>
                        <td>
                          <Link href={`/projects/${project.id}`} className="text-decoration-none fw-medium">
                            {project.name}
                          </Link>
                        </td>
                        <td>{project.company_name || 'N/A'}</td>
                        <td>
                          {project.start_date
                            ? new Date(project.start_date).toLocaleDateString()
                            : 'N/A'}
                        </td>
                        <td>
                          {project.end_date
                            ? new Date(project.end_date).toLocaleDateString()
                            : 'N/A'}
                        </td>
                        <td>
                          <span className={`badge bg-${getStatusColor(project.status)}`}>
                            {getStatusDisplayName(project.status)}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <Link href={`/projects/${project.id}`} className="btn btn-sm btn-outline-primary">
                              <i className="bi bi-eye"></i>
                            </Link>
                            <Link href={`/projects/${project.id}/edit`} className="btn btn-sm btn-outline-secondary">
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
              <div className="text-center py-5">
                <i className="bi bi-folder text-muted fs-1 mb-3"></i>
                <h5 className="fw-normal">Nenhum projeto encontrado</h5>
                <p className="text-muted">Crie seu primeiro projeto clicando no botão "Novo Projeto"</p>
                <Link href="/projects/new" className="btn btn-primary mt-3">
                  <i className="bi bi-plus-lg me-2"></i>
                  Criar Projeto
                </Link>
              </div>
            )}
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

export default ProjectsPage;