import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../src/components/layout/Layout';
import { useAuth } from '../../src/contexts/AuthContext';
import companiesApi from '../../src/api/companies';
import { Company } from '../../src/interfaces';

const CompaniesPage: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/empresas');
    }
  }, [isAuthenticated, isLoading, router]);

  // Fetch companies data
  useEffect(() => {
    const fetchCompanies = async () => {
      if (!isAuthenticated) return;
      
      try {
        setLoading(true);
        const response = await companiesApi.getCompanies();
        
        if (response.success && response.data?.companies) {
          setCompanies(response.data.companies);
        } else {
          setError('Falha ao carregar empresas');
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

  // Filter companies by active status and search term
  const filteredCompanies = companies.filter(company => {
    const matchesActiveState = activeTab === 'active' ? company.is_active : !company.is_active;
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesActiveState && matchesSearch;
  });

  // Handle company deletion
  const handleDeleteCompany = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta empresa? Esta ação não pode ser desfeita.')) {
      try {
        setLoading(true);
        const response = await companiesApi.deleteCompany(id);
        
        if (response.success) {
          // Remove the company from the local state
          setCompanies(prevCompanies => prevCompanies.filter(company => company.id !== id));
        } else {
          setError('Falha ao excluir empresa');
        }
      } catch (err) {
        console.error('Error deleting company:', err);
        setError('Falha ao excluir empresa');
      } finally {
        setLoading(false);
      }
    }
  };

  if (isLoading || loading) {
    return (
      <Layout title="Empresas | Smart-ChatBox">
        <div className="text-center py-5">
          <div className="spinner-border" style={{ color: "#7e57c2" }} role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Empresas | Smart-ChatBox">
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1 className="fw-bold" style={{ color: '#7e57c2' }}>Empresas</h1>
          <Link href="/empresas/new" className="btn btn-primary">
            <i className="bi bi-plus-lg me-2"></i>
            Nova Empresa
          </Link>
        </div>
        
        {error && <div className="alert alert-danger mb-3">{error}</div>}
        
        {/* Search Bar */}
        <div className="card mb-3">
          <div className="card-body">
            <div className="row">
              <div className="col-md-8">
                <div className="input-group">
                  <span className="input-group-text" style={{ backgroundColor: 'transparent' }}>
                    <i className="bi bi-search" style={{ color: '#7e57c2' }}></i>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Buscar empresas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={() => setSearchTerm('')}
                    >
                      <i className="bi bi-x"></i>
                    </button>
                  )}
                </div>
              </div>
              <div className="col-md-4 mt-2 mt-md-0">
                <div className="nav nav-tabs">
                  <button 
                    className={`nav-link ${activeTab === 'active' ? 'active' : ''}`} 
                    style={{ 
                      color: activeTab === 'active' ? '#7e57c2' : 'inherit',
                      borderColor: activeTab === 'active' ? '#7e57c2' : 'transparent',
                      borderBottom: activeTab === 'active' ? '2px solid #7e57c2' : 'none'
                    }}
                    onClick={() => setActiveTab('active')}
                  >
                    Ativas
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
                    Inativas
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Company Cards */}
        <div className="row">
          {filteredCompanies.length > 0 ? (
            filteredCompanies.map(company => (
              <div key={company.id} className="col-md-4 col-sm-6 mb-3">
                <div className="card h-100" style={{ minHeight: "165px" }}>
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <h5 className="card-title fw-bold">{company.name}</h5>
                      <div className="p-2 rounded-circle" style={{ backgroundColor: "rgba(126, 87, 194, 0.1)" }}>
                        <i className="bi bi-building fs-5" style={{ color: "#7e57c2" }}></i>
                      </div>
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className={`badge ${company.is_active ? 'bg-success' : 'bg-secondary'}`}>
                        {company.is_active ? 'Ativa' : 'Inativa'}
                      </span>
                      <span className="text-muted small">
                        {company.created_at ? `Criada em ${new Date(company.created_at).toLocaleDateString()}` : ''}
                      </span>
                    </div>
                  </div>
                  <div className="card-footer bg-transparent border-top">
                    <div className="d-flex justify-content-between">
                      <Link href={`/empresas/${company.id}`} className="btn btn-sm btn-outline-primary">
                        <i className="bi bi-eye me-1"></i> Ver
                      </Link>
                      <div>
                        <Link href={`/empresas/${company.id}/edit`} className="btn btn-sm btn-outline-secondary me-2">
                          <i className="bi bi-pencil"></i>
                        </Link>
                        <button 
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDeleteCompany(company.id as string)}
                          disabled={loading}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-12">
              <div className="text-center py-5">
                <i className="bi bi-building text-muted display-1 mb-3"></i>
                <h5 className="fw-normal">Nenhuma empresa {activeTab === 'active' ? 'ativa' : 'inativa'} encontrada</h5>
                <p className="text-muted">
                  {searchTerm 
                    ? `Nenhuma empresa ${activeTab === 'active' ? 'ativa' : 'inativa'} encontrada para "${searchTerm}"`
                    : activeTab === 'active' 
                      ? 'Você não possui empresas ativas. Crie uma nova empresa clicando no botão "Nova Empresa"'
                      : 'Não há empresas inativas no momento'
                  }
                </p>
                {activeTab === 'active' && !searchTerm && (
                  <Link href="/empresas/new" className="btn btn-primary mt-3">
                    <i className="bi bi-plus-lg me-2"></i>
                    Criar Empresa
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default CompaniesPage;