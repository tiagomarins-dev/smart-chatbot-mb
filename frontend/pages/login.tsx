import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../src/components/layout/Layout';
import LoginForm from '../src/components/auth/LoginForm';
import { useAuth } from '../src/contexts/AuthContext';

const LoginPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  
  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  // Handle successful login
  const handleLoginSuccess = () => {
    router.push('/dashboard');
  };

  return (
    <Layout title="Login | Smart-ChatBox">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-4">
          <LoginForm onSuccess={handleLoginSuccess} />
          
          <div className="alert alert-info mt-3">
            <p className="mb-0">
              <strong>Observação:</strong> Se você não tem uma conta, clique em "Cadastre-se" abaixo para criar uma.
            </p>
          </div>
          
          <div className="text-center mt-3">
            <p>
              Não tem uma conta?{' '}
              <Link href="/register">
                Cadastre-se
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LoginPage;