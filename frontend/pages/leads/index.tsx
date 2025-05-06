import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Layout from '../../src/components/layout/Layout';
import LeadsList from '../../src/components/leads/LeadsList';
import LeadsDashboard from '../../src/components/leads/LeadsDashboard';
import { useAuth } from '../../src/contexts/AuthContext';

const LeadsPage: NextPage = () => {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const [period, setPeriod] = useState(30);
  const [projectId, setProjectId] = useState<string | undefined>(undefined);

  // Get query parameters
  useEffect(() => {
    const { project_id, period: periodParam } = router.query;
    
    if (typeof project_id === 'string') {
      setProjectId(project_id);
    }
    
    if (typeof periodParam === 'string') {
      const parsedPeriod = parseInt(periodParam, 10);
      if (!isNaN(parsedPeriod)) {
        setPeriod(parsedPeriod);
      }
    }
  }, [router.query]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login?redirect=/leads');
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
        <LeadsDashboard projectId={projectId} period={period} />
        <LeadsList projectId={projectId} />
      </div>
    </Layout>
  );
};

export default LeadsPage;