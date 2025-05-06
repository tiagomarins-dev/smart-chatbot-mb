import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import Layout from '../../src/components/layout/Layout';
import LeadForm from '../../src/components/leads/LeadForm';
import { useAuth } from '../../src/contexts/AuthContext';

const NewLeadPage: NextPage = () => {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const { project_id } = router.query;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login?redirect=/leads/new');
    }
  }, [isAuthenticated, loading, router]);

  if (loading || !isAuthenticated) {
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

  return (
    <Layout>
      <div className="container py-4">
        <div className="row">
          <div className="col-lg-8 offset-lg-2">
            <h1 className="mb-4">Add New Lead</h1>
            <LeadForm projectId={project_id as string} />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NewLeadPage;