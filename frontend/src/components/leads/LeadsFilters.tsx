import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import companiesApi from '../../api/companies';
import projectsApi from '../../api/projects';
import leadsApi from '../../api/leads';
import { Company, Project, Lead } from '../../interfaces';

interface LeadsFiltersProps {
  onFilterChange: (filters: Record<string, any>) => void;
  currentFilters: Record<string, any>;
}

const LeadsFilters: React.FC<LeadsFiltersProps> = ({ onFilterChange, currentFilters }) => {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [utmSources, setUtmSources] = useState<{source: string, count: number}[]>([]);
  const [utmMediums, setUtmMediums] = useState<{medium: string, count: number}[]>([]);
  const [utmCampaigns, setUtmCampaigns] = useState<{campaign: string, count: number}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(currentFilters.search || '');
  
  // States for expanded/collapsed sections
  const [isProjectsExpanded, setIsProjectsExpanded] = useState(true);
  const [isUtmExpanded, setIsUtmExpanded] = useState(true);
  const [isGeneralExpanded, setIsGeneralExpanded] = useState(true);
  const [isScoreExpanded, setIsScoreExpanded] = useState(true);
  const [isSortExpanded, setIsSortExpanded] = useState(true);

  // Load companies and projects
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch companies
        const companiesResponse = await companiesApi.getCompanies();
        if (companiesResponse.success && companiesResponse.data?.companies) {
          setCompanies(companiesResponse.data.companies.filter(c => c.is_active));
        }

        // Fetch projects
        const projectsResponse = await projectsApi.getProjects();
        if (projectsResponse.success && projectsResponse.data?.projects) {
          setProjects(projectsResponse.data.projects.filter(p => p.is_active));
        }

        // Fetch UTM data
        const leadsResponse = await leadsApi.getLeads();
        if (leadsResponse.success && leadsResponse.data?.leads) {
          // Process UTM sources
          const sources = new Map<string, number>();
          const mediums = new Map<string, number>();
          const campaigns = new Map<string, number>();

          leadsResponse.data.leads.forEach((lead: Lead) => {
            if (lead.utm_source) {
              const count = sources.get(lead.utm_source) || 0;
              sources.set(lead.utm_source, count + 1);
            }
            
            if (lead.utm_medium) {
              const count = mediums.get(lead.utm_medium) || 0;
              mediums.set(lead.utm_medium, count + 1);
            }
            
            if (lead.utm_campaign) {
              const count = campaigns.get(lead.utm_campaign) || 0;
              campaigns.set(lead.utm_campaign, count + 1);
            }
          });

          setUtmSources(Array.from(sources.entries()).map(([source, count]) => ({ source, count })));
          setUtmMediums(Array.from(mediums.entries()).map(([medium, count]) => ({ medium, count })));
          setUtmCampaigns(Array.from(campaigns.entries()).map(([campaign, count]) => ({ campaign, count })));
        }
      } catch (error) {
        console.error('Error fetching filter data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter projects when company is selected
  useEffect(() => {
    if (currentFilters.company_id) {
      setFilteredProjects(projects.filter(p => p.company_id === currentFilters.company_id));
    } else {
      setFilteredProjects(projects);
    }
  }, [currentFilters.company_id, projects]);

  // Update URL with filters
  const updateFilters = (newFilters: Record<string, any>) => {
    const filters = { ...currentFilters, ...newFilters };
    
    // Remove empty filters
    Object.keys(filters).forEach(key => {
      if (filters[key] === '' || filters[key] === undefined || filters[key] === null) {
        delete filters[key];
      }
    });
    
    onFilterChange(filters);
    
    // Update URL query parameters
    const query = { ...router.query, ...filters };
    router.push({ pathname: router.pathname, query }, undefined, { shallow: true });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchTerm });
  };

  const clearFilters = () => {
    setSearchTerm('');
    onFilterChange({});
    router.push({ pathname: router.pathname }, undefined, { shallow: true });
  };

  return (
    <div className="card mb-4" style={{ 
      borderRadius: '12px', 
      boxShadow: '0 6px 16px rgba(0, 0, 0, 0.07)',
      border: 'none'
    }}>
      <div className="card-header" style={{
        backgroundColor: 'transparent',
        borderBottom: 'none',
        padding: '1rem 1.25rem',
        borderRadius: '12px'
      }}>
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0" style={{ color: '#7e57c2', fontWeight: 'bold' }}>
            <i className="bi bi-funnel me-2"></i>
            Filtros
          </h5>
          <button 
            className="btn btn-sm" 
            style={{ 
              backgroundColor: 'rgba(97, 97, 97, 0.1)', 
              color: '#616161',
              borderRadius: '8px',
              padding: '0.3rem 0.75rem',
              fontWeight: 500,
              border: 'none',
              fontSize: '0.8rem'
            }}
            onClick={clearFilters}
          >
            Limpar filtros
          </button>
        </div>
      </div>
      
      <div className="card-body" style={{ padding: '0.5rem 1.25rem 1.25rem' }}>
        <div className="row">
          {/* Search filter */}
          <div className="col-12 mb-3">
            <div 
              className="d-flex justify-content-between align-items-center py-2 mb-2"
              style={{ cursor: 'pointer' }}
              onClick={() => setIsGeneralExpanded(!isGeneralExpanded)}
            >
              <strong style={{ color: '#673ab7' }}>Busca Geral</strong>
              <button className="btn btn-sm p-0" style={{ color: '#673ab7' }}>
                <i className={`bi ${isGeneralExpanded ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
              </button>
            </div>
            
            {isGeneralExpanded && (
              <form onSubmit={handleSearch} className="mb-3">
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Buscar por nome, email ou telefone"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ 
                      borderRadius: '8px 0 0 8px', 
                      padding: '0.6rem 1rem',
                      borderColor: 'rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <button 
                    className="btn" 
                    type="submit"
                    style={{ 
                      backgroundColor: '#7e57c2', 
                      color: 'white',
                      borderRadius: '0 8px 8px 0',
                      padding: '0.6rem 1rem',
                      border: 'none'
                    }}
                  >
                    <i className="bi bi-search"></i>
                  </button>
                </div>
              </form>
            )}
          </div>
          
          {/* Company and Project filters */}
          <div className="col-12 mb-3">
            <div 
              className="d-flex justify-content-between align-items-center py-2 mb-2"
              style={{ cursor: 'pointer' }}
              onClick={() => setIsProjectsExpanded(!isProjectsExpanded)}
            >
              <strong style={{ color: '#673ab7' }}>Empresas e Projetos</strong>
              <button className="btn btn-sm p-0" style={{ color: '#673ab7' }}>
                <i className={`bi ${isProjectsExpanded ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
              </button>
            </div>
            
            {isProjectsExpanded && (
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="company_id" className="form-label">Empresa</label>
                  <select
                    className="form-select"
                    id="company_id"
                    value={currentFilters.company_id || ''}
                    onChange={(e) => updateFilters({ company_id: e.target.value })}
                    style={{ 
                      borderRadius: '8px', 
                      padding: '0.6rem 1rem',
                      borderColor: 'rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <option value="">Todas as empresas</option>
                    {companies.map(company => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="col-md-6 mb-3">
                  <label htmlFor="project_id" className="form-label">Projeto</label>
                  <select
                    className="form-select"
                    id="project_id"
                    value={currentFilters.project_id || ''}
                    onChange={(e) => updateFilters({ project_id: e.target.value })}
                    style={{ 
                      borderRadius: '8px', 
                      padding: '0.6rem 1rem',
                      borderColor: 'rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <option value="">Todos os projetos</option>
                    {filteredProjects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
          
          {/* UTM Filters */}
          <div className="col-12">
            <div 
              className="d-flex justify-content-between align-items-center py-2 mb-2"
              style={{ cursor: 'pointer' }}
              onClick={() => setIsUtmExpanded(!isUtmExpanded)}
            >
              <strong style={{ color: '#673ab7' }}>Rastreamento UTM</strong>
              <button className="btn btn-sm p-0" style={{ color: '#673ab7' }}>
                <i className={`bi ${isUtmExpanded ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
              </button>
            </div>
            
            {isUtmExpanded && (
              <div className="row">
                <div className="col-md-4 mb-3">
                  <label htmlFor="utm_source" className="form-label">Origem</label>
                  <select
                    className="form-select"
                    id="utm_source"
                    value={currentFilters.utm_source || ''}
                    onChange={(e) => updateFilters({ utm_source: e.target.value })}
                    style={{ 
                      borderRadius: '8px', 
                      padding: '0.6rem 1rem',
                      borderColor: 'rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <option value="">Todas as origens</option>
                    {utmSources.map(({ source, count }) => (
                      <option key={source} value={source}>
                        {source} ({count})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="col-md-4 mb-3">
                  <label htmlFor="utm_medium" className="form-label">Meio</label>
                  <select
                    className="form-select"
                    id="utm_medium"
                    value={currentFilters.utm_medium || ''}
                    onChange={(e) => updateFilters({ utm_medium: e.target.value })}
                    style={{ 
                      borderRadius: '8px', 
                      padding: '0.6rem 1rem',
                      borderColor: 'rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <option value="">Todos os meios</option>
                    {utmMediums.map(({ medium, count }) => (
                      <option key={medium} value={medium}>
                        {medium} ({count})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="col-md-4 mb-3">
                  <label htmlFor="utm_campaign" className="form-label">Campanha</label>
                  <select
                    className="form-select"
                    id="utm_campaign"
                    value={currentFilters.utm_campaign || ''}
                    onChange={(e) => updateFilters({ utm_campaign: e.target.value })}
                    style={{ 
                      borderRadius: '8px', 
                      padding: '0.6rem 1rem',
                      borderColor: 'rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <option value="">Todas as campanhas</option>
                    {utmCampaigns.map(({ campaign, count }) => (
                      <option key={campaign} value={campaign}>
                        {campaign} ({count})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Lead Score Filter */}
          <div className="col-12 mb-3">
            <div 
              className="d-flex justify-content-between align-items-center py-2 mb-2"
              style={{ cursor: 'pointer' }}
              onClick={() => setIsScoreExpanded(!isScoreExpanded)}
            >
              <strong style={{ color: '#673ab7' }}>Pontuação do Lead</strong>
              <button className="btn btn-sm p-0" style={{ color: '#673ab7' }}>
                <i className={`bi ${isScoreExpanded ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
              </button>
            </div>
            
            {isScoreExpanded && (
              <div className="row">
                <div className="col-12 mb-3">
                  <label htmlFor="score_filter" className="form-label">Filtrar por pontuação</label>
                  <select
                    className="form-select"
                    id="score_filter"
                    value={currentFilters.score_filter || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        // Remove filters
                        const newFilters = { ...currentFilters };
                        delete newFilters.min_score;
                        delete newFilters.max_score;
                        delete newFilters.score_filter;
                        updateFilters(newFilters);
                      } else if (value === '100') {
                        updateFilters({ min_score: '100', max_score: '100', score_filter: value });
                      } else {
                        // Set min_score based on selection
                        updateFilters({ min_score: value, score_filter: value });
                      }
                    }}
                    style={{ 
                      borderRadius: '8px', 
                      padding: '0.6rem 1rem',
                      borderColor: 'rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <option value="">Todas as pontuações</option>
                    <option value="50">Acima de 50</option>
                    <option value="60">Acima de 60</option>
                    <option value="70">Acima de 70</option>
                    <option value="80">Acima de 80</option>
                    <option value="90">Acima de 90</option>
                    <option value="100">Apenas 100</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Sort Options */}
          <div className="col-12 mb-3">
            <div 
              className="d-flex justify-content-between align-items-center py-2 mb-2"
              style={{ cursor: 'pointer' }}
              onClick={() => setIsSortExpanded(!isSortExpanded)}
            >
              <strong style={{ color: '#673ab7' }}>Ordenação</strong>
              <button className="btn btn-sm p-0" style={{ color: '#673ab7' }}>
                <i className={`bi ${isSortExpanded ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
              </button>
            </div>
            
            {isSortExpanded && (
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="order_by" className="form-label">Ordenar por</label>
                  <select
                    className="form-select"
                    id="order_by"
                    value={currentFilters.order_by || 'created_at'}
                    onChange={(e) => updateFilters({ order_by: e.target.value })}
                    style={{ 
                      borderRadius: '8px', 
                      padding: '0.6rem 1rem',
                      borderColor: 'rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <option value="created_at">Data de Criação</option>
                    <option value="updated_at">Última Atualização</option>
                    <option value="lead_score">Pontuação</option>
                    <option value="name">Nome</option>
                    <option value="email">Email</option>
                  </select>
                </div>
                
                <div className="col-md-6 mb-3">
                  <label htmlFor="order_direction" className="form-label">Direção</label>
                  <select
                    className="form-select"
                    id="order_direction"
                    value={currentFilters.order_direction || 'desc'}
                    onChange={(e) => updateFilters({ order_direction: e.target.value })}
                    style={{ 
                      borderRadius: '8px', 
                      padding: '0.6rem 1rem',
                      borderColor: 'rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <option value="desc">Decrescente</option>
                    <option value="asc">Crescente</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Active filters display */}
        {Object.keys(currentFilters).length > 0 && (
          <div className="mt-3 p-2" style={{ 
            backgroundColor: 'rgba(126, 87, 194, 0.05)', 
            borderRadius: '8px'
          }}>
            <div className="d-flex gap-2 flex-wrap">
              {Object.entries(currentFilters).map(([key, value]) => {
                // Skip min_score and max_score if score_filter is set
                if ((key === 'min_score' || key === 'max_score') && currentFilters.score_filter) {
                  return null;
                }
                
                const label = 
                  key === 'search' ? `Busca: ${value}` :
                  key === 'company_id' ? `Empresa: ${companies.find(c => c.id === value)?.name || value}` :
                  key === 'project_id' ? `Projeto: ${projects.find(p => p.id === value)?.name || value}` :
                  key === 'utm_source' ? `Origem: ${value}` :
                  key === 'utm_medium' ? `Meio: ${value}` :
                  key === 'utm_campaign' ? `Campanha: ${value}` :
                  key === 'score_filter' ? (value === '100' ? 'Pontuação: Apenas 100' : `Pontuação: Acima de ${value}`) :
                  key === 'order_by' ? `Ordenar: ${
                    value === 'created_at' ? 'Data Criação' :
                    value === 'updated_at' ? 'Última Atualização' :
                    value === 'lead_score' ? 'Pontuação' :
                    value === 'name' ? 'Nome' :
                    value === 'email' ? 'Email' : value
                  }` :
                  key === 'order_direction' ? `Direção: ${value === 'asc' ? 'Crescente' : 'Decrescente'}` :
                  `${key}: ${value}`;
                
                return value && label ? (
                  <div 
                    key={key} 
                    className="badge d-flex align-items-center gap-1"
                    style={{ 
                      backgroundColor: 'rgba(126, 87, 194, 0.1)', 
                      color: '#7e57c2',
                      padding: '0.5em 0.7em',
                      fontWeight: 500,
                      borderRadius: '6px'
                    }}
                  >
                    {label}
                    <button 
                      className="btn btn-sm p-0 ps-1" 
                      style={{ fontSize: '0.8em', color: '#7e57c2' }}
                      onClick={() => {
                        const newFilters = { ...currentFilters };
                        delete newFilters[key];
                        // If removing score_filter, also remove min/max scores
                        if (key === 'score_filter') {
                          delete newFilters.min_score;
                          delete newFilters.max_score;
                        }
                        updateFilters(newFilters);
                      }}
                    >
                      <i className="bi bi-x-circle"></i>
                    </button>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadsFilters;