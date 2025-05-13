import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Lead, Project, Company } from '../../interfaces';
import leadsApi from '../../api/leads';
import companiesApi from '../../api/companies';
import projectsApi from '../../api/projects';

interface LeadFormProps {
  lead?: Lead;
  isEdit?: boolean;
  projectId?: string;
}

const LeadForm: React.FC<LeadFormProps> = ({ lead, isEdit = false, projectId }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  // State for companies and filtered projects
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [companyProjects, setCompanyProjects] = useState<Project[]>([]);
  
  // State for lead details (projects/UTMs) when in edit mode
  const [leadProjects, setLeadProjects] = useState<any[]>([]);
  const [leadCompanyName, setLeadCompanyName] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState<{
    name: string;
    first_name: string;
    email: string;
    phone: string;
    status: string;
    notes: string;
    project_id: string;
    company_id: string;
    utm_source: string;
    utm_medium: string;
    utm_campaign: string;
    utm_term: string;
    utm_content: string;
  }>({
    name: lead?.name || '',
    first_name: lead?.first_name || '',
    email: lead?.email || '',
    phone: lead?.phone || '',
    status: lead?.status || 'novo',
    notes: lead?.notes || '',
    project_id: projectId || '',
    company_id: '',
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    utm_term: '',
    utm_content: '',
  });

  // Fetch available companies and projects when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch companies
        const companiesResponse = await companiesApi.getCompanies();
        if (companiesResponse.success && companiesResponse.data?.companies) {
          const activeCompanies = companiesResponse.data.companies.filter(c => c.is_active);
          setCompanies(activeCompanies);
        }

        // Fetch all projects
        const projectsResponse = await projectsApi.getProjects();
        if (projectsResponse.success && projectsResponse.data?.projects) {
          setProjects(projectsResponse.data.projects.filter(p => p.is_active));
          
          // If a project ID was provided through props, find and set the company ID
          if (projectId) {
            const projectWithId = projectsResponse.data.projects.find(p => p.id === projectId);
            if (projectWithId?.company_id) {
              setSelectedCompanyId(projectWithId.company_id);
              setFormData(prev => ({
                ...prev,
                company_id: projectWithId.company_id
              }));
            }
          }
          
          // If in edit mode and we have a lead, fetch its project details
          if (isEdit && lead?.id) {
            const leadDetailsResponse = await leadsApi.getLead(lead.id);
            if (leadDetailsResponse.success && leadDetailsResponse.data) {
              // Set project details
              if (leadDetailsResponse.data.projects && leadDetailsResponse.data.projects.length > 0) {
                setLeadProjects(leadDetailsResponse.data.projects);
                
                // Try to find company name for the project
                const projectDetail = leadDetailsResponse.data.projects[0];
                if (projectDetail && projectDetail.project_id) {
                  const matchingProject = projectsResponse.data.projects.find(
                    p => p.id === projectDetail.project_id
                  );
                  
                  if (matchingProject && matchingProject.company_id) {
                    const matchingCompany = companies.find(
                      c => c.id === matchingProject.company_id
                    );
                    
                    if (matchingCompany) {
                      setLeadCompanyName(matchingCompany.name);
                    }
                  }
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Não foi possível carregar os dados. Por favor, tente novamente mais tarde.');
      }
    };

    fetchData();
  }, [projectId, isEdit, lead?.id]);
  
  // Filter projects when company is selected
  useEffect(() => {
    if (selectedCompanyId) {
      const filteredProjects = projects.filter(project => project.company_id === selectedCompanyId);
      setCompanyProjects(filteredProjects);
      
      // If projectId isn't set from props and there are filtered projects, auto-select the first one
      if (!projectId && filteredProjects.length > 0 && !formData.project_id) {
        setFormData(prev => ({
          ...prev,
          project_id: filteredProjects[0].id
        }));
      }
    } else {
      setCompanyProjects([]);
    }
  }, [selectedCompanyId, projects, projectId, formData.project_id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Handle company selection separately to update available projects
    if (name === 'company_id') {
      setSelectedCompanyId(value);
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isEdit && lead?.id) {
        // Update existing lead
        // Use the new full update method instead of just updating status
        const response = await leadsApi.updateLead(lead.id, {
          name: formData.name,
          first_name: formData.first_name,
          email: formData.email,
          phone: formData.phone,
          status: formData.status as any,
          notes: formData.notes
        });

        if (response.success) {
          setSuccess('Lead atualizado com sucesso');
          // Redirect after a short delay
          setTimeout(() => {
            router.push(`/leads/${lead.id}`);
          }, 1500);
        } else {
          setError(response.error || 'Falha ao atualizar o lead');
        }
      } else {
        // Create new lead
        const response = await leadsApi.captureLead({
          name: formData.name,
          first_name: formData.first_name,
          email: formData.email,
          phone: formData.phone,
          project_id: formData.project_id,
          notes: formData.notes,
          utm_source: formData.utm_source,
          utm_medium: formData.utm_medium,
          utm_campaign: formData.utm_campaign,
          utm_term: formData.utm_term,
          utm_content: formData.utm_content
        });

        if (response.success) {
          setSuccess('Lead criado com sucesso');
          // Reset the form if not redirecting
          setFormData({
            name: '',
            first_name: '',
            email: '',
            phone: '',
            status: 'novo',
            notes: '',
            project_id: projectId || '',
            company_id: formData.company_id, // Keep the selected company
            utm_source: '',
            utm_medium: '',
            utm_campaign: '',
            utm_term: '',
            utm_content: '',
          });
          // Redirect after a short delay
          setTimeout(() => {
            router.push('/leads');
          }, 1500);
        } else {
          setError(response.error || 'Falha ao criar o lead');
        }
      }
    } catch (err) {
      console.error('Error submitting lead:', err);
      setError('Ocorreu um erro inesperado. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ animation: 'slideInUp 0.5s ease-out', borderRadius: '12px', boxShadow: '0 6px 16px rgba(0, 0, 0, 0.07)', border: 'none', padding: '4px', marginBottom: '20px' }}>
      <div className="card-header" style={{ backgroundColor: 'transparent', borderBottom: 'none', padding: '0.9rem 1rem 0.3rem', borderRadius: '12px' }}>
        <h5 className="card-title" style={{ color: '#7e57c2', fontWeight: 'bold' }}>{isEdit ? 'Editar Lead' : 'Criar Novo Lead'}</h5>
      </div>
      <div className="card-body" style={{ padding: '1rem' }}>
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success" style={{ backgroundColor: 'rgba(102, 187, 106, 0.1)', color: '#66bb6a', border: '1px solid rgba(102, 187, 106, 0.2)' }}>{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="card mb-4" style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', border: 'none' }}>
            <div className="card-header" style={{ backgroundColor: 'transparent', borderBottom: 'none', padding: '0.9rem 1rem 0.3rem', borderRadius: '12px' }}>
              <div className="d-flex align-items-center">
                <div className="p-2 rounded-circle me-3" style={{ backgroundColor: 'rgba(126, 87, 194, 0.1)' }}>
                  <i className="bi bi-person fs-5" style={{ color: '#7e57c2' }}></i>
                </div>
                <h6 className="mb-0" style={{ color: '#7e57c2', fontWeight: 'bold' }}>Informações do Lead</h6>
              </div>
            </div>
            <div className="card-body" style={{ padding: '1rem' }}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="name" className="form-label">Nome Completo</label>
                  <input
                    type="text"
                    className="form-control"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    style={{ 
                      borderRadius: '8px', 
                      padding: '0.6rem 1rem',
                      borderColor: 'rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <label htmlFor="first_name" className="form-label">Primeiro Nome</label>
                  <input
                    type="text"
                    className="form-control"
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                    style={{ 
                      borderRadius: '8px', 
                      padding: '0.6rem 1rem',
                      borderColor: 'rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </div>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="email" className="form-label">E-mail</label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    style={{ 
                      borderRadius: '8px', 
                      padding: '0.6rem 1rem',
                      borderColor: 'rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <label htmlFor="phone" className="form-label">Telefone</label>
                  <input
                    type="tel"
                    className="form-control"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    style={{ 
                      borderRadius: '8px', 
                      padding: '0.6rem 1rem',
                      borderColor: 'rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {isEdit && (
            <>
              <div className="card mb-4" style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', border: 'none' }}>
                <div className="card-header" style={{ backgroundColor: 'transparent', borderBottom: 'none', padding: '0.9rem 1rem 0.3rem', borderRadius: '12px' }}>
                  <div className="d-flex align-items-center">
                    <div className="p-2 rounded-circle me-3" style={{ backgroundColor: 'rgba(126, 87, 194, 0.1)' }}>
                      <i className="bi bi-check2-circle fs-5" style={{ color: '#7e57c2' }}></i>
                    </div>
                    <h6 className="mb-0" style={{ color: '#7e57c2', fontWeight: 'bold' }}>Status do Lead</h6>
                  </div>
                </div>
                <div className="card-body" style={{ padding: '1rem' }}>
                  <div className="mb-3">
                    <label htmlFor="status" className="form-label">Status</label>
                    <select
                      className="form-select"
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      required
                      style={{ 
                        borderRadius: '8px', 
                        padding: '0.6rem 1rem',
                        borderColor: 'rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      <option value="novo">Novo</option>
                      <option value="qualificado">Qualificado</option>
                      <option value="contatado">Contatado</option>
                      <option value="convertido">Convertido</option>
                      <option value="desistiu">Desistiu</option>
                      <option value="inativo">Inativo</option>
                    </select>
                  </div>
                  
                  <div className="alert alert-info" style={{ backgroundColor: 'rgba(66, 165, 245, 0.1)', color: '#42a5f5', border: '1px solid rgba(66, 165, 245, 0.2)', borderRadius: '8px' }}>
                    <small>
                      <i className="bi bi-info-circle me-2"></i>
                      Alterar o status do lead permite acompanhar sua progressão no funil de vendas.
                    </small>
                  </div>
                </div>
              </div>
              
              {/* Project Information */}
              {leadProjects && leadProjects.length > 0 && (
                <div className="card mb-4" style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', border: 'none' }}>
                  <div className="card-header" style={{ backgroundColor: 'transparent', borderBottom: 'none', padding: '0.9rem 1rem 0.3rem', borderRadius: '12px' }}>
                    <div className="d-flex align-items-center">
                      <div className="p-2 rounded-circle me-3" style={{ backgroundColor: 'rgba(126, 87, 194, 0.1)' }}>
                        <i className="bi bi-building fs-5" style={{ color: '#7e57c2' }}></i>
                      </div>
                      <h6 className="mb-0" style={{ color: '#7e57c2', fontWeight: 'bold' }}>Informações do Projeto</h6>
                    </div>
                  </div>
                  <div className="card-body" style={{ padding: '1rem' }}>
                    {leadCompanyName && (
                      <div className="d-flex align-items-center mb-3">
                        <span className="badge rounded-pill" style={{ backgroundColor: 'rgba(126, 87, 194, 0.1)', color: '#7e57c2', padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}>
                          <i className="bi bi-building me-1"></i>
                          Empresa: {leadCompanyName}
                        </span>
                      </div>
                    )}
                    
                    {leadProjects.map((project, index) => (
                      <div key={index} className="card mb-2" style={{ borderRadius: '8px', boxShadow: 'none', border: '1px solid rgba(0, 0, 0, 0.05)' }}>
                        <div className="card-body p-3">
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h6 className="mb-1">{project.project_name || project.project_id}</h6>
                              <p className="mb-0 text-muted" style={{ fontSize: '0.85rem' }}>
                                <i className="bi bi-calendar3 me-1"></i>
                                {project.captured_at 
                                  ? new Date(project.captured_at).toLocaleDateString('pt-BR') 
                                  : 'Data não disponível'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* UTM Parameters if available */}
                    {leadProjects[0] && (leadProjects[0].utm_source || leadProjects[0].utm_medium || leadProjects[0].utm_campaign) && (
                      <div className="mt-3">
                        <h6 className="mb-2" style={{ color: '#7e57c2' }}>Dados de Origem (UTM)</h6>
                        <div className="card" style={{ backgroundColor: 'rgba(126, 87, 194, 0.03)', borderRadius: '8px', border: 'none' }}>
                          <div className="card-body p-3">
                            <div className="row g-2">
                              {leadProjects[0].utm_source && (
                                <div className="col-md-6">
                                  <small className="text-muted d-block">Origem:</small>
                                  <span className="badge rounded-pill" style={{ backgroundColor: 'rgba(66, 165, 245, 0.1)', color: '#42a5f5', padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}>
                                    {leadProjects[0].utm_source}
                                  </span>
                                </div>
                              )}
                              
                              {leadProjects[0].utm_medium && (
                                <div className="col-md-6">
                                  <small className="text-muted d-block">Meio:</small>
                                  <span className="badge rounded-pill" style={{ backgroundColor: 'rgba(102, 187, 106, 0.1)', color: '#66bb6a', padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}>
                                    {leadProjects[0].utm_medium}
                                  </span>
                                </div>
                              )}
                              
                              {leadProjects[0].utm_campaign && (
                                <div className="col-md-6">
                                  <small className="text-muted d-block">Campanha:</small>
                                  <span className="badge rounded-pill" style={{ backgroundColor: 'rgba(255, 183, 77, 0.1)', color: '#ffb74d', padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}>
                                    {leadProjects[0].utm_campaign}
                                  </span>
                                </div>
                              )}
                              
                              {leadProjects[0].utm_term && (
                                <div className="col-md-6">
                                  <small className="text-muted d-block">Termo:</small>
                                  <span className="badge rounded-pill" style={{ backgroundColor: 'rgba(239, 83, 80, 0.1)', color: '#ef5350', padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}>
                                    {leadProjects[0].utm_term}
                                  </span>
                                </div>
                              )}
                              
                              {leadProjects[0].utm_content && (
                                <div className="col-12">
                                  <small className="text-muted d-block">Conteúdo:</small>
                                  <span className="badge rounded-pill" style={{ backgroundColor: 'rgba(97, 97, 97, 0.1)', color: '#616161', padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}>
                                    {leadProjects[0].utm_content}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {!isEdit && (
            <>
              <div className="card mb-4" style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', border: 'none' }}>
                <div className="card-header" style={{ backgroundColor: 'transparent', borderBottom: 'none', padding: '0.9rem 1rem 0.3rem', borderRadius: '12px' }}>
                  <div className="d-flex align-items-center">
                    <div className="p-2 rounded-circle me-3" style={{ backgroundColor: 'rgba(126, 87, 194, 0.1)' }}>
                      <i className="bi bi-building fs-5" style={{ color: '#7e57c2' }}></i>
                    </div>
                    <h6 className="mb-0" style={{ color: '#7e57c2', fontWeight: 'bold' }}>Informações do Projeto</h6>
                  </div>
                </div>
                <div className="card-body" style={{ padding: '1rem' }}>
                  <div className="mb-3">
                    <label htmlFor="company_id" className="form-label">Empresa</label>
                    <select
                      className="form-select"
                      id="company_id"
                      name="company_id"
                      value={formData.company_id}
                      onChange={handleChange}
                      required
                      disabled={!!projectId}
                      style={{ 
                        borderRadius: '8px', 
                        padding: '0.6rem 1rem',
                        borderColor: 'rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      <option value="">Selecione uma empresa</option>
                      {companies.map(company => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-0">
                    <label htmlFor="project_id" className="form-label">Projeto</label>
                    <select
                      className="form-select"
                      id="project_id"
                      name="project_id"
                      value={formData.project_id}
                      onChange={handleChange}
                      required
                      disabled={!!projectId || !selectedCompanyId}
                      style={{ 
                        borderRadius: '8px', 
                        padding: '0.6rem 1rem',
                        borderColor: 'rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      <option value="">Selecione um projeto</option>
                      {companyProjects.map(project => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                    {!selectedCompanyId && !projectId && (
                      <div className="form-text text-muted mt-2" style={{ fontSize: '0.85rem' }}>Por favor, selecione uma empresa primeiro</div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="card mb-4" style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', border: 'none' }}>
            <div className="card-header" style={{ backgroundColor: 'transparent', borderBottom: 'none', padding: '0.9rem 1rem 0.3rem', borderRadius: '12px' }}>
              <div className="d-flex align-items-center">
                <div className="p-2 rounded-circle me-3" style={{ backgroundColor: 'rgba(126, 87, 194, 0.1)' }}>
                  <i className="bi bi-journals fs-5" style={{ color: '#7e57c2' }}></i>
                </div>
                <h6 className="mb-0" style={{ color: '#7e57c2', fontWeight: 'bold' }}>Informações Adicionais</h6>
              </div>
            </div>
            <div className="card-body" style={{ padding: '1rem' }}>
              <div className="mb-0">
                <label htmlFor="notes" className="form-label">Observações</label>
                <textarea
                  className="form-control"
                  id="notes"
                  name="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={handleChange}
                  style={{ 
                    borderRadius: '8px', 
                    padding: '0.6rem 1rem',
                    borderColor: 'rgba(0, 0, 0, 0.1)'
                  }}
                ></textarea>
              </div>
            </div>
          </div>
          
          {!isEdit && (
            <>
              <h5 className="mb-3 mt-4" style={{ color: '#7e57c2', fontWeight: 'bold' }}>Rastreamento UTM (Opcional)</h5>
              <div className="card mb-3" style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', border: 'none', backgroundColor: 'rgba(126, 87, 194, 0.03)' }}>
                <div className="card-body" style={{ padding: '1.25rem' }}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label htmlFor="utm_source" className="form-label">Origem</label>
                      <input
                        type="text"
                        className="form-control"
                        id="utm_source"
                        name="utm_source"
                        placeholder="ex: google, facebook"
                        value={formData.utm_source}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="utm_medium" className="form-label">Meio</label>
                      <input
                        type="text"
                        className="form-control"
                        id="utm_medium"
                        name="utm_medium"
                        placeholder="ex: cpc, email, social"
                        value={formData.utm_medium}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="utm_campaign" className="form-label">Campanha</label>
                      <input
                        type="text"
                        className="form-control"
                        id="utm_campaign"
                        name="utm_campaign"
                        placeholder="ex: promocao_verao"
                        value={formData.utm_campaign}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="utm_term" className="form-label">Termo</label>
                      <input
                        type="text"
                        className="form-control"
                        id="utm_term"
                        name="utm_term"
                        placeholder="ex: tenis+corrida"
                        value={formData.utm_term}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-12">
                      <label htmlFor="utm_content" className="form-label">Conteúdo</label>
                      <input
                        type="text"
                        className="form-control"
                        id="utm_content"
                        name="utm_content"
                        placeholder="ex: link_logo, link_texto"
                        value={formData.utm_content}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="d-flex justify-content-between">
            <button
              type="button"
              className="btn"
              style={{ 
                backgroundColor: 'rgba(97, 97, 97, 0.1)', 
                color: '#616161',
                borderRadius: '8px',
                padding: '0.5rem 1.25rem',
                fontWeight: 500,
                border: 'none',
                transition: 'all 0.2s ease'
              }}
              onClick={() => router.back()}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn"
              style={{ 
                backgroundColor: loading ? '#673ab7' : '#7e57c2', 
                color: 'white',
                borderRadius: '8px',
                padding: '0.5rem 1.25rem',
                fontWeight: 500,
                border: 'none',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(126, 87, 194, 0.25)'
              }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Salvando...
                </>
              ) : (
                isEdit ? 'Atualizar Lead' : 'Criar Lead'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeadForm;