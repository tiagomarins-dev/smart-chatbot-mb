import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';

const Navigation: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      <div className="container">
        <Link href="/" className="navbar-brand" style={{ color: '#7e57c2', fontWeight: 'bold' }}>
          Smart-ChatBox
        </Link>
        
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Alternar navegação"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            {isAuthenticated && (
              <>
                <li className="nav-item">
                  <Link 
                    href="/dashboard" 
                    className={`nav-link ${router.pathname === '/dashboard' ? 'active' : ''}`}
                  >
                    Painel
                  </Link>
                </li>
                <li className="nav-item">
                  <Link 
                    href="/empresas" 
                    className={`nav-link ${router.pathname.startsWith('/empresas') ? 'active' : ''}`}
                  >
                    Empresas
                  </Link>
                </li>
                <li className="nav-item">
                  <Link 
                    href="/leads" 
                    className={`nav-link ${router.pathname.startsWith('/leads') ? 'active' : ''}`}
                  >
                    Leads
                  </Link>
                </li>
                <li className="nav-item">
                  <Link 
                    href="/contacts" 
                    className={`nav-link ${router.pathname.startsWith('/contacts') ? 'active' : ''}`}
                  >
                    Contatos
                  </Link>
                </li>
              </>
            )}
          </ul>
          
          <ul className="navbar-nav">
            {isAuthenticated ? (
              <>
                <li className="nav-item dropdown">
                  <a
                    className="nav-link dropdown-toggle"
                    href="#"
                    id="navbarDropdown"
                    role="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    {user?.email}
                  </a>
                  <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
                    <li>
                      <Link href="/profile" className="dropdown-item">
                        Perfil
                      </Link>
                    </li>
                    <li>
                      <hr className="dropdown-divider" />
                    </li>
                    <li>
                      <button className="dropdown-item" onClick={handleLogout}>
                        Sair
                      </button>
                    </li>
                  </ul>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link 
                    href="/login" 
                    className={`nav-link ${router.pathname === '/login' ? 'active' : ''}`}
                  >
                    Entrar
                  </Link>
                </li>
                <li className="nav-item">
                  <Link 
                    href="/register" 
                    className={`nav-link ${router.pathname === '/register' ? 'active' : ''}`}
                  >
                    Cadastrar
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;