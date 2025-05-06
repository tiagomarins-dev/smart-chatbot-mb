import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../src/components/layout/Layout';
import { useAuth } from '../../src/contexts/AuthContext';
import projectsApi from '../../src/api/projects';
import companiesApi from '../../src/api/companies';
import { Company, Project } from '../../src/interfaces';

const NewProjectPage: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const { company_id } = router.query;
  
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Project>>({
    name: '',
    description: '',
    status: 'em_planejamento',
    campaign_start_date: '',
    campaign_end_date: '',
    is_active: true,
    company_id: (company_id as string) || ''
  });
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/projetos/new');
    }
  }, [isAuthenticated, isLoading, router]);
  
  // Fetch companies if needed
  useEffect(() => {
    const fetchCompanies = async () => {
      if (!isAuthenticated || !user) return;
      
      try {
        setLoading(true);
        const response = await companiesApi.getCompanies();
        
        if (response.success && response.data?.companies) {
          // Only show active companies
          const activeCompanies = response.data.companies.filter(c => c.is_active);
          setCompanies(activeCompanies);
          
          // If a company_id was provided in the URL and exists in the fetched companies
          if (company_id) {
            const company = activeCompanies.find(c => c.id === company_id);
            if (company) {
              setSelectedCompany(company);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching companies:', err);
        setError('Falha ao carregar empresas');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCompanies();
  }, [isAuthenticated, user, company_id]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Log para debug quando as datas mudam
    if (name === 'campaign_start_date' || name === 'campaign_end_date') {
      console.log(`Campo ${name} alterado para:`, value);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const companyId = e.target.value;
    const company = companies.find(c => c.id === companyId) || null;
    
    setSelectedCompany(company);
    setFormData(prev => ({
      ...prev,
      company_id: companyId
    }));
  };
  
  const handleToggleStatus = () => {
    setFormData(prev => ({
      ...prev,
      is_active: !prev.is_active
    }));
  };
  
  const validateForm = (): boolean => {
    // Reset error
    setError(null);
    
    // Check required fields
    if (!formData.name?.trim()) {
      setError('Nome do projeto é obrigatório');
      return false;
    }
    
    if (!formData.company_id) {
      setError('Empresa é obrigatória');
      return false;
    }
    
    // Validate dates if provided
    if (formData.campaign_start_date && formData.campaign_end_date) {
      const startDate = new Date(formData.campaign_start_date);
      const endDate = new Date(formData.campaign_end_date);
      
      if (endDate < startDate) {
        setError('A data de término deve ser posterior à data de início');
        return false;
      }
    }
    
    return true;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Prepare the project data with the user ID
      const projectData = {
        ...formData,
        user_id: user?.id || ''
      } as Omit<Project, 'id' | 'created_at' | 'updated_at'>;
      
      // Log para debug
      console.log('Dados do projeto a serem enviados:', projectData);
      
      const response = await projectsApi.createProject(projectData);
      
      // Log para debug
      console.log('Resposta do servidor:', response);
      
      if (response.success && response.data?.project) {
        setSuccess(true);
        // Redirect to the project detail page
        setTimeout(() => {
          router.push(`/projetos/${response.data?.project.id}`);
        }, 1500);
      } else {
        setError(response.error || 'Falha ao criar o projeto');
        console.error('Erro ao criar projeto:', response.error);
      }
    } catch (err) {
      console.error('Error creating project:', err);
      setError('Falha ao criar o projeto');
    } finally {
      setLoading(false);
    }
  };
  
  if (isLoading) {
    return (
      <Layout title="Novo Projeto | Smart-ChatBox">
        <div className="text-center py-5">
          <div className="spinner-border" style={{ color: "#7e57c2" }} role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout title="Novo Projeto | Smart-ChatBox">
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <div className="d-flex align-items-center mb-2">
              <Link href={company_id ? `/empresas/${company_id}` : '/projetos'} className="text-decoration-none me-2">
                <i className="bi bi-arrow-left"></i>
              </Link>
              <h1 className="fw-bold m-0" style={{ color: '#7e57c2' }}>Novo Projeto</h1>
            </div>
            <p className="text-muted">Crie um novo projeto associado a uma empresa</p>
          </div>
        </div>
        
        {success && (
          <div className="alert alert-success mb-4">
            Projeto criado com sucesso! Redirecionando...
          </div>
        )}
        
        {error && (
          <div className="alert alert-danger mb-4">
            {error}
          </div>
        )}
        
        <div className="row">
          <div className="col-lg-8">
            <div className="card mb-4">
              <div className="card-header bg-transparent border-0">
                <h5 className="card-title mb-0 fw-bold">
                  <i className="bi bi-folder-plus me-2" style={{ color: "#7e57c2" }}></i>
                  Informações do Projeto
                </h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="company_id" className="form-label fw-medium">Empresa <span className="text-danger">*</span></label>
                    <select
                      id="company_id"
                      name="company_id"
                      className="form-select"
                      value={formData.company_id || ''}
                      onChange={handleCompanyChange}
                      disabled={!!company_id || loading}
                      required
                    >
                      <option value="">Selecione uma empresa</option>
                      {companies.map(company => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="name" className="form-label fw-medium">Nome do Projeto <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      className="form-control"
                      value={formData.name || ''}
                      onChange={handleInputChange}
                      placeholder="Digite o nome do projeto"
                      disabled={loading}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="description" className="form-label fw-medium">Descrição</label>
                    <textarea
                      id="description"
                      name="description"
                      className="form-control"
                      value={formData.description || ''}
                      onChange={handleInputChange}
                      placeholder="Descreva o objetivo e escopo do projeto"
                      rows={4}
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label htmlFor="status" className="form-label fw-medium">Status do Projeto</label>
                      <select
                        id="status"
                        name="status"
                        className="form-select"
                        value={formData.status || 'em_planejamento'}
                        onChange={handleInputChange}
                        disabled={loading}
                      >
                        <option value="em_planejamento">Em Planejamento</option>
                        <option value="em_andamento">Em Andamento</option>
                        <option value="pausado">Pausado</option>
                        <option value="concluido">Concluído</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-medium d-block">Estado do Projeto</label>
                      <div className="form-check form-switch mt-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="is_active"
                          checked={formData.is_active}
                          onChange={handleToggleStatus}
                          disabled={loading}
                        />
                        <label className="form-check-label" htmlFor="is_active">
                          {formData.is_active ? 'Ativo' : 'Inativo'}
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="row mb-4">
                    <div className="col-md-6">
                      <label htmlFor="campaign_start_date" className="form-label fw-medium">Data de Início</label>
                      <input
                        type="date"
                        id="campaign_start_date"
                        name="campaign_start_date"
                        className="form-control"
                        value={formData.campaign_start_date || ''}
                        onChange={handleInputChange}
                        disabled={loading}
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="campaign_end_date" className="form-label fw-medium">Data de Término</label>
                      <input
                        type="date"
                        id="campaign_end_date"
                        name="campaign_end_date"
                        className="form-control"
                        value={formData.campaign_end_date || ''}
                        onChange={handleInputChange}
                        disabled={loading}
                      />
                    </div>
                  </div>
                  
                  <div className="d-flex justify-content-end gap-2">
                    <Link 
                      href={company_id ? `/empresas/${company_id}` : '/projetos'} 
                      className="btn btn-outline-secondary"
                      aria-disabled={loading}
                    >
                      Cancelar
                    </Link>
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Salvando...
                        </>
                      ) : (
                        <>Criar Projeto</>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          
          <div className="col-lg-4">
            <div className="card mb-3">
              <div className="card-header bg-transparent border-0">
                <h5 className="card-title mb-0 fw-bold">
                  <i className="bi bi-info-circle me-2" style={{ color: "#7e57c2" }}></i>
                  Dicas para Criar Projetos
                </h5>
              </div>
              <div className="card-body">
                <ul className="list-unstyled mb-0">
                  <li className="mb-3">
                    <div className="d-flex">
                      <i className="bi bi-check-circle-fill text-success me-2 mt-1"></i>
                      <div>
                        <strong>Nome claro e objetivo</strong>
                        <p className="text-muted small mb-0">Escolha um nome que identifique facilmente o projeto.</p>
                      </div>
                    </div>
                  </li>
                  <li className="mb-3">
                    <div className="d-flex">
                      <i className="bi bi-check-circle-fill text-success me-2 mt-1"></i>
                      <div>
                        <strong>Descrição detalhada</strong>
                        <p className="text-muted small mb-0">Inclua objetivos, escopo e informações relevantes sobre o projeto.</p>
                      </div>
                    </div>
                  </li>
                  <li className="mb-3">
                    <div className="d-flex">
                      <i className="bi bi-check-circle-fill text-success me-2 mt-1"></i>
                      <div>
                        <strong>Defina datas realistas</strong>
                        <p className="text-muted small mb-0">Estabeleça prazos que sejam viáveis para a execução do projeto.</p>
                      </div>
                    </div>
                  </li>
                  <li>
                    <div className="d-flex">
                      <i className="bi bi-check-circle-fill text-success me-2 mt-1"></i>
                      <div>
                        <strong>Atualize o status</strong>
                        <p className="text-muted small mb-0">Mantenha o status do projeto sempre atualizado conforme sua evolução.</p>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
            
            {selectedCompany && (
              <div className="card">
                <div className="card-header bg-transparent border-0">
                  <h5 className="card-title mb-0 fw-bold">
                    <i className="bi bi-building me-2" style={{ color: "#7e57c2" }}></i>
                    Empresa Selecionada
                  </h5>
                </div>
                <div className="card-body">
                  <h6 className="fw-bold">{selectedCompany.name}</h6>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted">Status</span>
                    <span className={`badge ${selectedCompany.is_active ? 'bg-success' : 'bg-secondary'}`}>
                      {selectedCompany.is_active ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                  <hr className="my-3" />
                  <Link href={`/empresas/${selectedCompany.id}`} className="btn btn-sm btn-outline-primary w-100">
                    <i className="bi bi-eye me-2"></i>
                    Ver Detalhes da Empresa
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NewProjectPage;