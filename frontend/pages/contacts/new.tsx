import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import Layout from '../../src/components/layout/Layout';
import ContactForm from '../../src/components/contacts/ContactForm';
import { useAuth } from '../../src/contexts/AuthContext';

const NewContactPage: NextPage = () => {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login?redirect=/contacts/new');
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
            <h1 className="mb-4">Add New Contact</h1>
            <ContactForm />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NewContactPage;