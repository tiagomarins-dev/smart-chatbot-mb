import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Company } from '../../interfaces';
import companiesApi from '../../api/companies';
import { useRealtime } from '../../contexts/RealtimeContext';

const CompanyList: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get realtime context
  const { isConnected, subscribeToCompanies, unsubscribeFromCompanies } = useRealtime();
  
  // Track if we have real-time updates enabled
  const [hasRealTimeUpdates, setHasRealTimeUpdates] = useState(false);

  // Initial data fetch
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        const response = await companiesApi.getCompanies();
        
        if (response.success && response.data?.companies) {
          setCompanies(response.data.companies);
        } else {
          setError(response.error || 'Failed to fetch companies');
        }
      } catch (err) {
        console.error('Error fetching companies:', err);
        setError('An error occurred while fetching companies');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);
  
  // Set up real-time updates when connection is established
  useEffect(() => {
    if (isConnected && !hasRealTimeUpdates) {
      // Handler for company events
      const handleCompanyEvent = (data: any) => {
        if (data.new) {
          const newCompany = data.new as Company;
          
          // Handle INSERT
          if (data.event === 'INSERT') {
            setCompanies(prev => {
              // Check if we already have this company (to avoid duplicates)
              const exists = prev.some(c => c.id === newCompany.id);
              if (exists) return prev;
              
              return [...prev, newCompany];
            });
          }
          
          // Handle UPDATE
          else if (data.event === 'UPDATE') {
            setCompanies(prev => prev.map(c => c.id === newCompany.id ? newCompany : c));
          }
        }
        // Handle DELETE
        else if (data.event === 'DELETE' && data.old) {
          const oldCompany = data.old as Company;
          setCompanies(prev => prev.filter(c => c.id !== oldCompany.id));
        }
      };
      
      // Subscribe to all company events
      subscribeToCompanies(handleCompanyEvent);
      setHasRealTimeUpdates(true);
      
      // Cleanup when component unmounts
      return () => {
        unsubscribeFromCompanies(handleCompanyEvent);
      };
    }
  }, [isConnected, hasRealTimeUpdates, subscribeToCompanies, unsubscribeFromCompanies]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this company?')) {
      return;
    }

    try {
      const response = await companiesApi.deleteCompany(id);
      
      if (response.success) {
        // With real-time updates, the state will be updated automatically
        // But we'll also update it directly for immediate feedback
        if (!hasRealTimeUpdates) {
          setCompanies(companies.filter(company => company.id !== id));
        }
      } else {
        setError(response.error || 'Failed to delete company');
      }
    } catch (err) {
      console.error('Error deleting company:', err);
      setError('An error occurred while deleting the company');
    }
  };

  if (loading) {
    return <div className="text-center py-5"><div className="spinner-border"></div></div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  if (companies.length === 0) {
    return (
      <div className="text-center py-5">
        <p className="mb-4">No companies found</p>
        <Link href="/companies/new" className="btn btn-primary">
          Create New Company
        </Link>
      </div>
    );
  }
  
  // Sort companies by creation date (newest first)
  const sortedCompanies = [...companies].sort((a, b) => {
    if (!a.created_at) return 1;
    if (!b.created_at) return -1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          Companies
          {isConnected && hasRealTimeUpdates && (
            <span className="badge bg-success ms-2" style={{ fontSize: '0.5em', verticalAlign: 'middle' }}>
              <i className="bi bi-lightning-fill me-1"></i>
              Live
            </span>
          )}
        </h2>
        <Link href="/companies/new" className="btn btn-primary">
          Add Company
        </Link>
      </div>
      
      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Created</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedCompanies.map((company) => (
              <tr key={company.id}>
                <td>
                  <Link href={`/companies/${company.id}`}>
                    {company.name}
                  </Link>
                </td>
                <td>
                  {company.is_active ? (
                    <span className="badge bg-success">Active</span>
                  ) : (
                    <span className="badge bg-secondary">Inactive</span>
                  )}
                </td>
                <td>
                  {company.created_at
                    ? new Date(company.created_at).toLocaleDateString()
                    : 'N/A'}
                </td>
                <td className="text-end">
                  <div className="btn-group">
                    <Link
                      href={`/companies/${company.id}/edit`}
                      className="btn btn-sm btn-outline-primary"
                    >
                      Edit
                    </Link>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => company.id && handleDelete(company.id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CompanyList;