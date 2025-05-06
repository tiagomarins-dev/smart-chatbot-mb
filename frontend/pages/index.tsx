import React from 'react';
import Link from 'next/link';
import Layout from '../src/components/layout/Layout';
import { useAuth } from '../src/contexts/AuthContext';

const Home: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  return (
    <Layout title="Home | Smart-ChatBox">
      <div className="text-center py-5">
        <h1 className="display-4">Bem-vindo ao Smart-ChatBox</h1>
        <p className="lead">Um poderoso sistema de gestão de relacionamento com clientes</p>
        
        {isLoading ? (
          <div className="spinner-border mt-4" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
        ) : isAuthenticated ? (
          <div className="mt-4">
            <h2 className="h4">Olá, {user?.email}</h2>
            <div className="mt-3">
              <Link href="/dashboard" className="btn btn-primary btn-lg">
                Ir para o Dashboard
              </Link>
            </div>
            <div className="row mt-5">
              <div className="col-md-4">
                <div className="card mb-3">
                  <div className="card-body">
                    <h5 className="card-title">Empresas</h5>
                    <p className="card-text">Gerencie seus clientes empresariais e parceiros</p>
                    <Link href="/companies" className="btn btn-outline-primary">
                      Ver Empresas
                    </Link>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card mb-3">
                  <div className="card-body">
                    <h5 className="card-title">Leads</h5>
                    <p className="card-text">Acompanhe e converta clientes potenciais</p>
                    <Link href="/leads" className="btn btn-outline-primary">
                      Ver Leads
                    </Link>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card mb-3">
                  <div className="card-body">
                    <h5 className="card-title">Contatos</h5>
                    <p className="card-text">Gerencie seu banco de contatos</p>
                    <Link href="/contacts" className="btn btn-outline-primary">
                      Ver Contatos
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <p>Por favor, faça login ou cadastre-se para acessar o sistema CRM</p>
            <div className="mt-3">
              <Link href="/login" className="btn btn-primary me-2">
                Entrar
              </Link>
              <Link href="/register" className="btn btn-outline-primary">
                Cadastrar
              </Link>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Home;