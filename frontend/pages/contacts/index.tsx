import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import Layout from '../../src/components/layout/Layout';
import ContactsList from '../../src/components/contacts/ContactsList';
import { useAuth } from '../../src/contexts/AuthContext';

const ContactsPage: NextPage = () => {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login?redirect=/contacts');
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
        <ContactsList />
      </div>
    </Layout>
  );
};

export default ContactsPage;