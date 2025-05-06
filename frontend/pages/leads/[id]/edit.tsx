import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Layout from '../../../src/components/layout/Layout';
import LeadForm from '../../../src/components/leads/LeadForm';
import { useAuth } from '../../../src/contexts/AuthContext';
import { Lead } from '../../../src/interfaces';
import leadsApi from '../../../src/api/leads';
import Link from 'next/link';

const EditLeadPage: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { isAuthenticated, loading } = useAuth();
  const [lead, setLead] = useState<Lead | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        <div className="row">
          <div className="col-lg-8 offset-lg-2">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h1>Edit Lead</h1>
              <Link href={`/leads/${lead.id}`} className="btn btn-outline-secondary">
                Cancel
              </Link>
            </div>
            <LeadForm lead={lead} isEdit={true} />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EditLeadPage;