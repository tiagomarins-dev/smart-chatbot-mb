import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Layout from '../../src/components/layout/Layout';
import { useAuth } from '../../src/contexts/AuthContext';
import { Lead } from '../../src/interfaces';
import leadsApi from '../../src/api/leads';
import { useRealtime } from '../../src/contexts/RealtimeContext';
import Link from 'next/link';

const LeadDetailPage: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { isAuthenticated, loading } = useAuth();
  const [lead, setLead] = useState<Lead | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get realtime context
  const { isConnected, subscribeToLeads, unsubscribeFromLeads } = useRealtime();
  
  // Track if we have real-time updates enabled
  const [hasRealTimeUpdates, setHasRealTimeUpdates] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login?redirect=' + router.asPath);
    }
  }, [isAuthenticated, loading, router]);

  // Fetch lead data
  useEffect(() => {
    const fetchLead = async () => {
      if (!id || Array.isArray(id)) return;

      try {
        setFetchLoading(true);
        const response = await leadsApi.getLead(id);
        
        if (response.success && response.data?.lead) {
          setLead(response.data.lead);
        } else {
          setError(response.error || 'Failed to fetch lead details');
        }
      } catch (err) {
        console.error('Error fetching lead:', err);
        setError('An error occurred while fetching lead details');
      } finally {
        setFetchLoading(false);
      }
    };

    if (isAuthenticated && id) {
      fetchLead();
    }
  }, [id, isAuthenticated]);

  // Set up real-time updates
  useEffect(() => {
    if (isConnected && !hasRealTimeUpdates && lead?.id) {
      // Handler for lead events
      const handleLeadEvent = (data: any) => {
        if (!lead) return;
        
        if (data.event === 'UPDATE' && data.new?.id === lead.id) {
          setLead(data.new);
        } else if (data.event === 'DELETE' && data.old?.id === lead.id) {
          // Lead was deleted, redirect to leads list
          router.push('/leads');
        }
      };
      
      // Subscribe to lead events
      subscribeToLeads(handleLeadEvent);
      setHasRealTimeUpdates(true);
      
      // Cleanup when component unmounts
      return () => {
        unsubscribeFromLeads(handleLeadEvent);
      };
    }
  }, [isConnected, hasRealTimeUpdates, lead, router, subscribeToLeads, unsubscribeFromLeads]);

  // Helper function to get status badge color
  const getStatusBadgeColor = (status: Lead['status']) => {
    switch (status) {
      case 'novo': return 'bg-info';
      case 'qualificado': return 'bg-primary';
      case 'contatado': return 'bg-warning';
      case 'convertido': return 'bg-success';
      case 'desistiu': return 'bg-danger';
      case 'inativo': return 'bg-secondary';
      default: return 'bg-light';
    }
  };

  // Helper function to get status display name
  const getStatusDisplayName = (status: Lead['status']) => {
    switch (status) {
      case 'novo': return 'New';
      case 'qualificado': return 'Qualified';
      case 'contatado': return 'Contacted';
      case 'convertido': return 'Converted';
      case 'desistiu': return 'Gave Up';
      case 'inativo': return 'Inactive';
      default: return status;
    }
  };

  if (loading || !isAuthenticated || fetchLoading) {
    return (
      <Layout>
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container py-4">
          <div className="alert alert-danger">{error}</div>
          <Link href="/leads" className="btn btn-primary">
            Back to Leads
          </Link>
        </div>
      </Layout>
    );
  }

  if (!lead) {
    return (
      <Layout>
        <div className="container py-4">
          <div className="alert alert-warning">Lead not found</div>
          <Link href="/leads" className="btn btn-primary">
            Back to Leads
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>
            Lead Details
            {isConnected && hasRealTimeUpdates && (
              <span className="badge bg-success ms-2" style={{ fontSize: '0.5em', verticalAlign: 'middle' }}>
                <i className="bi bi-lightning-fill me-1"></i>
                Live
              </span>
            )}
          </h1>
          <div className="d-flex gap-2">
            <Link href="/leads" className="btn btn-secondary">
              Back to Leads
            </Link>
            <Link href={`/leads/${lead.id}/edit`} className="btn btn-primary">
              Edit Lead
            </Link>
          </div>
        </div>

        <div className="card mb-4">
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">{lead.name}</h5>
              <span className={`badge ${getStatusBadgeColor(lead.status)}`}>
                {getStatusDisplayName(lead.status)}
              </span>
            </div>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <h6 className="text-muted">Contact Information</h6>
                <table className="table table-borderless">
                  <tbody>
                    <tr>
                      <th scope="row" style={{ width: '150px' }}>First Name</th>
                      <td>{lead.first_name}</td>
                    </tr>
                    <tr>
                      <th scope="row">Email</th>
                      <td>
                        <a href={`mailto:${lead.email}`}>{lead.email}</a>
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">Phone</th>
                      <td>
                        <a href={`tel:${lead.phone}`}>{lead.phone}</a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="col-md-6">
                <h6 className="text-muted">Lead Information</h6>
                <table className="table table-borderless">
                  <tbody>
                    <tr>
                      <th scope="row" style={{ width: '150px' }}>Created</th>
                      <td>
                        {lead.created_at
                          ? new Date(lead.created_at).toLocaleString()
                          : 'N/A'}
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">Last Updated</th>
                      <td>
                        {lead.updated_at
                          ? new Date(lead.updated_at).toLocaleString()
                          : 'N/A'}
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">User ID</th>
                      <td>{lead.user_id}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {lead.notes && (
              <div className="mt-4">
                <h6 className="text-muted">Notes</h6>
                <div className="card">
                  <div className="card-body bg-light">
                    <p className="card-text" style={{ whiteSpace: 'pre-wrap' }}>{lead.notes}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LeadDetailPage;