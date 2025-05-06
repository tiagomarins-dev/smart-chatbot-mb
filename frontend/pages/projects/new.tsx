import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../src/components/layout/Layout';
import { useAuth } from '../../src/contexts/AuthContext';
import projectsApi from '../../src/api/projects';
import companiesApi from '../../src/api/companies';
import { Company } from '../../src/interfaces';

const NewProjectPage: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    company_id: '',
    description: '',
    status: 'em_planejamento',
    start_date: '',
    end_date: '',
    is_active: true
  });
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/projects/new');
    }
  }, [isAuthenticated, isLoading, router]);

  // Fetch companies for dropdown
  useEffect(() => {
    const fetchCompanies = async () => {
      if (!isAuthenticated) return;
      
      try {
        setLoading(true);
        const response = await companiesApi.getCompanies();
        
        if (response.success && response.data?.companies) {
          setCompanies(response.data.companies);
        }
      } catch (err) {
        console.error('Error fetching companies:', err);
        setError('Falha ao carregar empresas');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, [isAuthenticated]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Handle checkbox inputs
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData({
        ...formData,
        [name]: checkbox.checked
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      setError('Nome do projeto é obrigatório');
      return;
    }
    
    if (!formData.company_id) {
      setError('Empresa é obrigatória');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      const projectData = {
        ...formData,
        user_id: user?.id || ''
      };
      
      const response = await projectsApi.createProject(projectData);
      
      if (response.success && response.data?.project) {
        setSuccess('Projeto criado com sucesso!');
        // Redirect to project detail page after short delay
        setTimeout(() => {
          router.push(`/projects/${response.data?.project.id}`);
        }, 1500);
      } else {
        setError(response.error || 'Falha ao criar projeto');
      }
    } catch (err) {
      console.error('Error creating project:', err);
      setError('Falha ao criar projeto');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || loading) {
    return (
      <Layout title="Novo Projeto | Smart-ChatBox">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Novo Projeto | Smart-ChatBox">
      <div className="container py-5">
        <div className="d-flex align-items-center mb-4">
          <Link href="/projects" className="text-decoration-none me-2">
            <i className="bi bi-arrow-left"></i>
          </Link>
          <h1 className="fw-bold m-0" style={{ color: '#7e57c2' }}>Novo Projeto</h1>
        </div>
        
        {error && <div className="alert alert-danger mb-4">{error}</div>}
        {success && <div className="alert alert-success mb-4">{success}</div>}
        
        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="name" className="form-label">Nome do Projeto*</label>
                  <input
                    type="text"
                    className="form-control"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="col-md-6 mb-3">
                  <label htmlFor="company_id" className="form-label">Empresa*</label>
                  <select
                    className="form-select"
                    id="company_id"
                    name="company_id"
                    value={formData.company_id}
                    onChange={handleChange}
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
                
                <div className="col-md-6 mb-3">
                  <label htmlFor="start_date" className="form-label">Data de Início</label>
                  <input
                    type="date"
                    className="form-control"
                    id="start_date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="col-md-6 mb-3">
                  <label htmlFor="end_date" className="form-label">Data de Término</label>
                  <input
                    type="date"
                    className="form-control"
                    id="end_date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="col-md-6 mb-3">
                  <label htmlFor="status" className="form-label">Status</label>
                  <select
                    className="form-select"
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="em_planejamento">Em Planejamento</option>
                    <option value="em_andamento">Em Andamento</option>
                    <option value="pausado">Pausado</option>
                    <option value="concluido">Concluído</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>
                
                <div className="col-md-6 mb-3">
                  <div className="form-check mt-4">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="is_active"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                    />
                    <label className="form-check-label" htmlFor="is_active">
                      Projeto Ativo
                    </label>
                  </div>
                </div>
                
                <div className="col-12 mb-3">
                  <label htmlFor="description" className="form-label">Descrição</label>
                  <textarea
                    className="form-control"
                    id="description"
                    name="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                  ></textarea>
                </div>
              </div>
              
              <div className="d-flex justify-content-end mt-4">
                <Link href="/projects" className="btn btn-outline-secondary me-2">
                  Cancelar
                </Link>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Criando...
                    </>
                  ) : (
                    'Criar Projeto'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NewProjectPage;