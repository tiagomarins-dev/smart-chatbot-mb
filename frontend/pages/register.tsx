import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../src/components/layout/Layout';
import RegisterForm from '../src/components/auth/RegisterForm';
import { useAuth } from '../src/contexts/AuthContext';

const RegisterPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  
  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  // Handle successful registration
  const handleRegisterSuccess = () => {
    router.push('/login');
  };

  return (
    <Layout title="Cadastro | Smart-ChatBox">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-4">
          <RegisterForm onSuccess={handleRegisterSuccess} />
          
          <div className="text-center mt-3">
            <p>
              Já tem uma conta?{' '}
              <Link href="/login">
                Entrar
              </Link>
            </p>
          </div>
          
          <div className="alert alert-info mt-3">
            <p className="mb-0">
              <strong>Observação:</strong> Este sistema usa o Supabase para autenticação. Seu e-mail e senha serão armazenados com segurança.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RegisterPage;