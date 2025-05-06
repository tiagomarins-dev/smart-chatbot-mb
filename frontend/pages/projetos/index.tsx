import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../src/components/layout/Layout';
import { useAuth } from '../../src/contexts/AuthContext';
import projectsApi from '../../src/api/projects';
import { Project } from '../../src/interfaces';

const ProjectsPage: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/projetos');
    }
  }, [isAuthenticated, isLoading, router]);
  
  // Fetch projects
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
  
  // Filter projects based on search term and active tab
  useEffect(() => {
    if (!projects.length) {
      setFilteredProjects([]);
      return;
    }
    
    let filtered = [...projects];
    
    // Filter by active state
    filtered = filtered.filter(project => 
      activeTab === 'active' ? project.is_active : !project.is_active
    );
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(project => 
        project.name.toLowerCase().includes(term) || 
        project.company_name?.toLowerCase().includes(term) ||
        project.description?.toLowerCase().includes(term)
      );
    }
    
    setFilteredProjects(filtered);
  }, [projects, searchTerm, activeTab]);
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  if (isLoading || loading) {
    return (
      <Layout title="Projetos | Smart-ChatBox">
        <div className="text-center py-5">
          <div className="spinner-border" style={{ color: "#7e57c2" }} role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout title="Projetos | Smart-ChatBox">
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="fw-bold mb-1" style={{ color: '#7e57c2' }}>Projetos</h1>
            <p className="text-muted">Gerencie os projetos da sua empresa</p>
          </div>
          <Link href="/projetos/new" className="btn btn-primary">
            <i className="bi bi-plus-lg me-2"></i>
            Novo Projeto
          </Link>
        </div>
        
        {error && (
          <div className="alert alert-danger mb-4">
            {error}
          </div>
        )}
        
        <div className="card mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <div className="input-group">
                  <span className="input-group-text bg-transparent">
                    <i className="bi bi-search"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0"
                    placeholder="Buscar projetos..."
                    value={searchTerm}
                    onChange={handleSearch}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="nav nav-tabs" style={{ border: 'none' }}>
                  <button 
                    className={`nav-link ${activeTab === 'active' ? 'active' : ''}`} 
                    style={{ 
                      color: activeTab === 'active' ? '#7e57c2' : 'inherit',
                      borderColor: activeTab === 'active' ? '#7e57c2' : 'transparent',
                      borderBottom: activeTab === 'active' ? '2px solid #7e57c2' : 'none'
                    }}
                    onClick={() => setActiveTab('active')}
                  >
                    Ativos
                  </button>
                  <button 
                    className={`nav-link ${activeTab === 'inactive' ? 'active' : ''}`}
                    style={{ 
                      color: activeTab === 'inactive' ? '#7e57c2' : 'inherit',
                      borderColor: activeTab === 'inactive' ? '#7e57c2' : 'transparent',
                      borderBottom: activeTab === 'inactive' ? '2px solid #7e57c2' : 'none'
                    }}
                    onClick={() => setActiveTab('inactive')}
                  >
                    Inativos
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {!filteredProjects.length ? (
          <div className="card">
            <div className="card-body text-center py-5">
              <i className="bi bi-folder text-muted fs-1 mb-3"></i>
              <h5 className="fw-bold">Nenhum projeto encontrado</h5>
              <p className="text-muted">
                {searchTerm 
                  ? `Não há projetos correspondentes à pesquisa "${searchTerm}".` 
                  : activeTab === 'active' 
                    ? 'Não há projetos ativos. Crie um novo projeto para começar.' 
                    : 'Não há projetos inativos no momento.'}
              </p>
              <Link href="/projetos/new" className="btn btn-primary mt-2">
                <i className="bi bi-plus-lg me-2"></i>
                Criar Projeto
              </Link>
            </div>
          </div>
        ) : (
          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
            {filteredProjects.map(project => (
              <div key={project.id} className="col">
                <div className="card h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h5 className="card-title mb-0 fw-bold">
                        <Link href={`/projetos/${project.id}`} className="text-decoration-none stretched-link">
                          {project.name}
                        </Link>
                      </h5>
                      <span className={`badge bg-${getStatusColor(project.status)}`}>
                        {getStatusDisplayName(project.status)}
                      </span>
                    </div>
                    
                    {project.company_name && (
                      <div className="mb-2">
                        <span className="badge bg-light text-dark">
                          <i className="bi bi-building me-1"></i>
                          {project.company_name}
                        </span>
                      </div>
                    )}
                    
                    <p className="card-text text-muted small mb-3">
                      {project.description 
                        ? (project.description.length > 100 
                            ? `${project.description.substring(0, 100)}...` 
                            : project.description)
                        : 'Sem descrição'}
                    </p>
                    
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted">
                        {project.campaign_start_date 
                          ? new Date(project.campaign_start_date).toLocaleDateString('pt-BR')
                          : 'Sem data de início'}
                      </small>
                      
                      <div className="d-flex gap-2">
                        <Link href={`/projetos/${project.id}`} className="btn btn-sm btn-outline-primary">
                          <i className="bi bi-eye"></i>
                        </Link>
                        <Link href={`/projetos/${project.id}/edit`} className="btn btn-sm btn-outline-secondary">
                          <i className="bi bi-pencil"></i>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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

export default ProjectsPage;