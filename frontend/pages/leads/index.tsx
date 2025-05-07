import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Layout from '../../src/components/layout/Layout';
import LeadsList from '../../src/components/leads/LeadsList';
import LeadsDashboard from '../../src/components/leads/LeadsDashboard';
import LeadsFilters from '../../src/components/leads/LeadsFilters';
import { useAuth } from '../../src/contexts/AuthContext';

const LeadsPage: NextPage = () => {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [period, setPeriod] = useState(30);
  const [filters, setFilters] = useState<Record<string, any>>({});

  // Get query parameters
  useEffect(() => {
    const { project_id, period: periodParam, ...otherParams } = router.query;
    
    // Build filters from URL parameters
    const queryFilters: Record<string, any> = {};
    
    if (typeof project_id === 'string') {
      queryFilters.project_id = project_id;
    }
    
    // Add other query params to filters
    Object.entries(otherParams).forEach(([key, value]) => {
      if (typeof value === 'string') {
        queryFilters[key] = value;
      }
    });
    
    setFilters(queryFilters);
    
    if (typeof periodParam === 'string') {
      const parsedPeriod = parseInt(periodParam, 10);
      if (!isNaN(parsedPeriod)) {
        setPeriod(parsedPeriod);
      }
    }
  }, [router.query]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/leads');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleFilterChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
  };

  if (isLoading || !isAuthenticated) {
    return (
      <Layout>
        <div className="text-center py-5">
          <div className="spinner-border" style={{ color: '#7e57c2' }}>
            <span className="visually-hidden">Carregando...</span>
          </div>
          <p className="mt-3 text-muted">Carregando...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-4">
        <div className="row mb-4">
          <div className="col-12 mb-4">
            <div className="d-flex align-items-center">
              <div className="p-3 rounded-circle me-3" style={{ backgroundColor: 'rgba(126, 87, 194, 0.1)' }}>
                <i className="bi bi-people fs-2" style={{ color: '#7e57c2' }}></i>
              </div>
              <div>
                <h1 className="mb-0" style={{ color: '#7e57c2', fontWeight: 'bold' }}>Leads</h1>
                <p className="text-muted mb-0">Gerencie e acompanhe seus leads</p>
              </div>
            </div>
          </div>
          <div className="col-12">
            <LeadsFilters 
              onFilterChange={handleFilterChange} 
              currentFilters={filters} 
            />
          </div>
        </div>
        
        <LeadsDashboard 
          projectId={filters.project_id} 
          period={period} 
        />
        
        <LeadsList filters={filters} />
      </div>
    </Layout>
  );
};

export default LeadsPage;