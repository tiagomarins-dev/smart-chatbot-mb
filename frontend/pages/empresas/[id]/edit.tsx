import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../../src/components/layout/Layout';
import { useAuth } from '../../../src/contexts/AuthContext';
import companiesApi from '../../../src/api/companies';
import { Company } from '../../../src/interfaces';

const EditCompanyPage: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  
  const [formData, setFormData] = useState<Partial<Company>>({
    name: '',
    is_active: true
  });
  
  const [originalCompany, setOriginalCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/login?redirect=/empresas/${id}/edit`);
    }
  }, [isAuthenticated, isLoading, router, id]);

  // Fetch company data to edit
  useEffect(() => {
    const fetchCompany = async () => {
      if (!isAuthenticated || !id) return;
      
      try {
        setLoading(true);
        const response = await companiesApi.getCompany(id as string);
        
        if (response.success && response.data?.company) {
          const company = response.data.company;
          setOriginalCompany(company);
          setFormData({
            name: company.name,
            is_active: company.is_active
          });
        } else {
          setError('Falha ao carregar dados da empresa');
        }
      } catch (err) {
        console.error('Error fetching company:', err);
        setError('Falha ao carregar dados da empresa');
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, [isAuthenticated, id]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Detect if there are changes to save
  const hasChanges = (): boolean => {
    if (!originalCompany) return false;
    
    return (
      formData.name !== originalCompany.name ||
      formData.is_active !== originalCompany.is_active
    );
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name?.trim()) {
      setError('Nome da empresa é obrigatório');
      return;
    }
    
    if (!id || !originalCompany) {
      setError('ID da empresa não encontrado');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      
      const response = await companiesApi.updateCompany(id as string, formData);
      
      if (response.success && response.data?.company) {
        setSuccess('Empresa atualizada com sucesso!');
        setOriginalCompany(response.data.company);
        
        // Redirect back to company details after a short delay
        setTimeout(() => {
          router.push(`/empresas/${id}`);
        }, 1500);
      } else {
        setError(response.error || 'Falha ao atualizar empresa');
      }
    } catch (err) {
      console.error('Error updating company:', err);
      setError('Falha ao atualizar empresa');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || loading) {
    return (
      <Layout title="Editar Empresa | Smart-ChatBox">
        <div className="text-center py-5">
          <div className="spinner-border" style={{ color: "#7e57c2" }} role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (!originalCompany && !loading) {
    return (
      <Layout title="Empresa não encontrada | Smart-ChatBox">
        <div className="container py-4">
          <div className="text-center py-5">
            <i className="bi bi-exclamation-triangle text-warning display-1 mb-4"></i>
            <h2 className="fw-bold">Empresa não encontrada</h2>
            <p className="text-muted">A empresa que você está tentando editar não existe ou foi removida.</p>
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
    <Layout title="Editar Empresa | Smart-ChatBox">
      <div className="container py-4">
        <div className="d-flex align-items-center mb-3">
          <Link href={`/empresas/${id}`} className="text-decoration-none me-2">
            <i className="bi bi-arrow-left"></i>
          </Link>
          <h1 className="fw-bold m-0" style={{ color: '#7e57c2' }}>Editar Empresa</h1>
        </div>
        
        {error && <div className="alert alert-danger mb-3">{error}</div>}
        {success && <div className="alert alert-success mb-3">{success}</div>}
        
        <div className="row">
          <div className="col-lg-8">
            <div className="card">
              <div className="card-header bg-transparent border-0">
                <h5 className="card-title mb-0 fw-bold">
                  <i className="bi bi-building me-2" style={{ color: "#7e57c2" }}></i>
                  Informações da Empresa
                </h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="name" className="form-label">Nome da Empresa *</label>
                    <input
                      type="text"
                      className="form-control"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Digite o nome da empresa"
                      required
                    />
                  </div>
                  
                  <div className="mb-3 form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="is_active"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                    />
                    <label className="form-check-label" htmlFor="is_active">Empresa Ativa</label>
                    <div className="form-text">
                      Uma empresa ativa pode ter projetos associados e aparecer nas listagens principais.
                    </div>
                  </div>
                  
                  <div className="d-flex justify-content-end mt-4">
                    <Link href={`/empresas/${id}`} className="btn btn-outline-secondary me-2">
                      Cancelar
                    </Link>
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={saving || !hasChanges()}
                    >
                      {saving ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Salvando...
                        </>
                      ) : (
                        'Salvar Alterações'
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
                  Informações
                </h5>
              </div>
              <div className="card-body">
                <ul className="list-group list-group-flush">
                  <li className="list-group-item border-0 px-0">
                    <span className="text-muted">ID da Empresa:</span>
                    <br />
                    <span className="fw-medium">{originalCompany?.id}</span>
                  </li>
                  <li className="list-group-item border-0 px-0">
                    <span className="text-muted">Criado em:</span>
                    <br />
                    <span className="fw-medium">
                      {originalCompany?.created_at
                        ? new Date(originalCompany.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })
                        : 'N/A'}
                    </span>
                  </li>
                  <li className="list-group-item border-0 px-0">
                    <span className="text-muted">Última atualização:</span>
                    <br />
                    <span className="fw-medium">
                      {originalCompany?.updated_at
                        ? new Date(originalCompany.updated_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'N/A'}
                    </span>
                  </li>
                </ul>
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
                    href={`/empresas/${id}`}
                    className="list-group-item list-group-item-action d-flex justify-content-between align-items-center border-0"
                  >
                    <span>Ver detalhes da empresa</span>
                    <i className="bi bi-chevron-right"></i>
                  </Link>
                  <Link 
                    href={`/projetos/new?company_id=${id}`}
                    className="list-group-item list-group-item-action d-flex justify-content-between align-items-center border-0"
                  >
                    <span>Adicionar novo projeto</span>
                    <i className="bi bi-chevron-right"></i>
                  </Link>
                  <Link 
                    href="/empresas"
                    className="list-group-item list-group-item-action d-flex justify-content-between align-items-center border-0"
                  >
                    <span>Voltar para lista de empresas</span>
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

export default EditCompanyPage;