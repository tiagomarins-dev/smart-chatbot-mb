import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../../src/components/layout/Layout';
import { useAuth } from '../../../src/contexts/AuthContext';
import projectsApi from '../../../src/api/projects';
import companiesApi from '../../../src/api/companies';
import { Company, Project } from '../../../src/interfaces';

const EditProjectPage: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [originalProject, setOriginalProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingProject, setLoadingProject] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Project>>({
    name: '',
    description: '',
    status: 'em_planejamento',
    campaign_start_date: '',
    campaign_end_date: '',
    is_active: true,
    company_id: ''
  });
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/login?redirect=/projetos/${id}/edit`);
    }
  }, [isAuthenticated, isLoading, router, id]);
  
  // Fetch project data
  useEffect(() => {
    const fetchProjectData = async () => {
      if (!isAuthenticated || !id) return;
      
      try {
        setLoadingProject(true);
        const response = await projectsApi.getProject(id as string);
        
        if (response.success && response.data?.project) {
          const project = response.data.project;
          setOriginalProject(project);
          
          // Format dates for form inputs (YYYY-MM-DD)
          const formatDate = (dateString?: string) => {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
          };

          setFormData({
            name: project.name,
            description: project.description || '',
            status: project.status || 'em_planejamento',
            campaign_start_date: formatDate(project.campaign_start_date),
            campaign_end_date: formatDate(project.campaign_end_date),
            is_active: project.is_active,
            company_id: project.company_id
          });
        } else {
          setError('Falha ao carregar dados do projeto');
        }
      } catch (err) {
        console.error('Error fetching project:', err);
        setError('Falha ao carregar dados do projeto');
      } finally {
        setLoadingProject(false);
      }
    };
    
    fetchProjectData();
  }, [isAuthenticated, id]);
  
  // Fetch companies if needed
  useEffect(() => {
    const fetchCompanies = async () => {
      if (!isAuthenticated || !user) return;
      
      try {
        const response = await companiesApi.getCompanies();
        
        if (response.success && response.data?.companies) {
          // Only show active companies
          const activeCompanies = response.data.companies.filter(c => c.is_active);
          setCompanies(activeCompanies);
          
          // If project loaded, set selected company
          if (formData.company_id) {
            const company = activeCompanies.find(c => c.id === formData.company_id);
            if (company) {
              setSelectedCompany(company);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching companies:', err);
        // Don't set error here as it's not critical for editing
      } finally {
        setLoading(false);
      }
    };
    
    fetchCompanies();
  }, [isAuthenticated, user, formData.company_id]);
  
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
  
  // Check if any changes were made
  const hasChanges = (): boolean => {
    if (!originalProject) return false;
    
    return (
      formData.name !== originalProject.name ||
      formData.description !== originalProject.description ||
      formData.status !== originalProject.status ||
      formData.campaign_start_date !== (originalProject.campaign_start_date ? new Date(originalProject.campaign_start_date).toISOString().split('T')[0] : '') ||
      formData.campaign_end_date !== (originalProject.campaign_end_date ? new Date(originalProject.campaign_end_date).toISOString().split('T')[0] : '') ||
      formData.is_active !== originalProject.is_active ||
      formData.company_id !== originalProject.company_id
    );
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !id) return;
    
    // Check if any changes were made
    if (!hasChanges()) {
      router.back(); // No changes, just go back
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Renomeamos a variável formData dentro do handleSubmit para evitar conflito com o state formData
      const projectUpdateData = { ...formData };
      
      // Garantir que as datas estão no formato correto (ISO 8601 - YYYY-MM-DD)
      if (projectUpdateData.campaign_start_date) {
        // Garantir que é apenas a data sem hora (YYYY-MM-DD)
        projectUpdateData.campaign_start_date = projectUpdateData.campaign_start_date.split('T')[0];
      }
      
      if (projectUpdateData.campaign_end_date) {
        // Garantir que é apenas a data sem hora (YYYY-MM-DD)
        projectUpdateData.campaign_end_date = projectUpdateData.campaign_end_date.split('T')[0];
      }
      
      // Log para debug
      console.log('Dados do projeto a serem enviados:', projectUpdateData);
      console.log('Valores de datas a serem enviados:');
      console.log('campaign_start_date:', projectUpdateData.campaign_start_date, typeof projectUpdateData.campaign_start_date);
      console.log('campaign_end_date:', projectUpdateData.campaign_end_date, typeof projectUpdateData.campaign_end_date);
      
      try {
        // Usando um bloco try/catch aninhado para capturar especificamente erros da API
        const response = await projectsApi.updateProject(id as string, projectUpdateData);
        
        // Log para debug
        console.log('Resposta do servidor:', response);
        
        if (response.success && response.data?.project) {
          setSuccess(true);
          // Redirect back to project detail page
          setTimeout(() => {
            router.push(`/projetos/${id}`);
          }, 1500);
        } else {
          let errorMsg = 'Falha ao atualizar o projeto. Verifique os campos e tente novamente.';
          
          if (response.error) {
            // Formatando a mensagem de erro para ser mais informativa
            errorMsg = `Erro: ${response.error}`;
            if (response.statusCode) {
              errorMsg += ` (Código: ${response.statusCode})`;
            }
          }
          
          setError(errorMsg);
          console.error('Detalhes do erro na resposta:', response);
        }
      } catch (apiError) {
        // Captura erros durante a chamada da API
        console.error('Exceção na chamada da API:', apiError);
        setError('Erro na comunicação com o servidor: ' + (apiError instanceof Error ? apiError.message : String(apiError)));
      }
    } catch (err) {
      console.error('Error updating project:', err);
      let errorMessage = 'Falha ao atualizar o projeto. Verifique os campos e tente novamente.';
      
      // Tentar extrair mais detalhes do erro
      if (err instanceof Error) {
        errorMessage += ` Detalhes: ${err.message}`;
        console.error('Error stack:', err.stack);
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  if (isLoading || loadingProject) {
    return (
      <Layout title="Editando Projeto | Smart-ChatBox">
        <div className="text-center py-5">
          <div className="spinner-border" style={{ color: "#7e57c2" }} role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (error && !originalProject) {
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
  
  return (
    <Layout title="Editar Projeto | Smart-ChatBox">
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <div className="d-flex align-items-center mb-2">
              <Link href={`/projetos/${id}`} className="text-decoration-none me-2">
                <i className="bi bi-arrow-left"></i>
              </Link>
              <h1 className="fw-bold m-0" style={{ color: '#7e57c2' }}>Editar Projeto</h1>
            </div>
            <p className="text-muted">Atualize as informações do projeto</p>
          </div>
        </div>
        
        {success && (
          <div className="alert alert-success mb-4">
            Projeto atualizado com sucesso! Redirecionando...
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
                      disabled={loading}
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
                      href={`/projetos/${id}`} 
                      className="btn btn-outline-secondary"
                      aria-disabled={loading}
                    >
                      Cancelar
                    </Link>
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={loading || !hasChanges()}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Salvando...
                        </>
                      ) : (
                        <>Salvar Alterações</>
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
                  Dicas para Editar Projetos
                </h5>
              </div>
              <div className="card-body">
                <ul className="list-unstyled mb-0">
                  <li className="mb-3">
                    <div className="d-flex">
                      <i className="bi bi-check-circle-fill text-success me-2 mt-1"></i>
                      <div>
                        <strong>Mantenha o nome claro</strong>
                        <p className="text-muted small mb-0">O nome do projeto deve identificar facilmente seu propósito.</p>
                      </div>
                    </div>
                  </li>
                  <li className="mb-3">
                    <div className="d-flex">
                      <i className="bi bi-check-circle-fill text-success me-2 mt-1"></i>
                      <div>
                        <strong>Atualize o status</strong>
                        <p className="text-muted small mb-0">Mantenha o status do projeto atualizado conforme sua evolução.</p>
                      </div>
                    </div>
                  </li>
                  <li className="mb-3">
                    <div className="d-flex">
                      <i className="bi bi-check-circle-fill text-success me-2 mt-1"></i>
                      <div>
                        <strong>Revise as datas</strong>
                        <p className="text-muted small mb-0">Ajuste as datas do projeto conforme necessário para refletir cronogramas atuais.</p>
                      </div>
                    </div>
                  </li>
                  <li>
                    <div className="d-flex">
                      <i className="bi bi-check-circle-fill text-success me-2 mt-1"></i>
                      <div>
                        <strong>Descreva detalhes</strong>
                        <p className="text-muted small mb-0">Uma descrição completa ajuda a equipe a entender o escopo do projeto.</p>
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

export default EditProjectPage;