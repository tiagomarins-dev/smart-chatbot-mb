import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../src/components/layout/Layout';
import { useAuth } from '../../src/contexts/AuthContext';
import companiesApi from '../../src/api/companies';

const NewCompanyPage: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: '',
    is_active: true
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/empresas/new');
    }
  }, [isAuthenticated, isLoading, router]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Nome da empresa é obrigatório');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Prepare the company data with the user ID
      const companyData = {
        ...formData,
        user_id: user?.id || ''
      };
      
      const response = await companiesApi.createCompany(companyData);
      
      if (response.success && response.data?.company) {
        setSuccess('Empresa criada com sucesso!');
        
        // Redirect to the company details page after a short delay
        setTimeout(() => {
          router.push(`/empresas/${response.data?.company.id}`);
        }, 1500);
      } else {
        setError(response.error || 'Falha ao criar empresa');
      }
    } catch (err) {
      console.error('Error creating company:', err);
      setError('Falha ao criar empresa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Nova Empresa | Smart-ChatBox">
      <div className="container py-4">
        <div className="d-flex align-items-center mb-3">
          <Link href="/empresas" className="text-decoration-none me-2">
            <i className="bi bi-arrow-left"></i>
          </Link>
          <h1 className="fw-bold m-0" style={{ color: '#7e57c2' }}>Nova Empresa</h1>
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
                    <div className="form-text">O nome da empresa será usado para identificá-la no sistema.</div>
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
                    <Link href="/empresas" className="btn btn-outline-secondary me-2">
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
                          Criando...
                        </>
                      ) : (
                        'Criar Empresa'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          
          <div className="col-lg-4">
            <div className="card">
              <div className="card-header bg-transparent border-0">
                <h5 className="card-title mb-0 fw-bold">
                  <i className="bi bi-info-circle me-2" style={{ color: "#7e57c2" }}></i>
                  Dicas
                </h5>
              </div>
              <div className="card-body">
                <ul className="list-unstyled">
                  <li className="mb-3">
                    <div className="d-flex">
                      <div className="me-2">
                        <i className="bi bi-check-circle-fill text-success"></i>
                      </div>
                      <div>
                        <strong>Nome da empresa</strong>
                        <p className="text-muted mb-0 small">
                          Use o nome oficial da empresa para facilitar a identificação.
                        </p>
                      </div>
                    </div>
                  </li>
                  <li className="mb-3">
                    <div className="d-flex">
                      <div className="me-2">
                        <i className="bi bi-check-circle-fill text-success"></i>
                      </div>
                      <div>
                        <strong>Status da empresa</strong>
                        <p className="text-muted mb-0 small">
                          Empresas inativas não aparecerão na lista principal, mas ainda poderão ser acessadas na aba "Inativas".
                        </p>
                      </div>
                    </div>
                  </li>
                  <li>
                    <div className="d-flex">
                      <div className="me-2">
                        <i className="bi bi-info-circle-fill text-primary"></i>
                      </div>
                      <div>
                        <strong>Próximos passos</strong>
                        <p className="text-muted mb-0 small">
                          Após criar a empresa, você poderá adicionar projetos a ela.
                        </p>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NewCompanyPage;