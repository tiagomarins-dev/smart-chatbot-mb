import React, { useState } from 'react';
import authApi from '../../api/auth';

interface RegisterFormProps {
  onSuccess?: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validações básicas
    if (!name || !email || !password) {
      setError('Todos os campos são obrigatórios');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.register(email, password, name);
      
      if (response.success) {
        setSuccess('Cadastro realizado com sucesso! Você já pode fazer login.');
        
        // Limpar o formulário
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        
        // Callback de sucesso após 2 segundos
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 2000);
        }
      } else {
        setError(response.error || 'Falha ao realizar o cadastro');
      }
    } catch (err) {
      console.error('Erro no registro:', err);
      setError('Ocorreu um erro. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-body">
        <h5 className="card-title mb-4">Criar Conta</h5>
        
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="name" className="form-label">Nome completo</label>
            <input
              type="text"
              className="form-control"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          
          <div className="mb-3">
            <label htmlFor="email" className="form-label">E-mail</label>
            <input
              type="email"
              className="form-control"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          
          <div className="mb-3">
            <label htmlFor="password" className="form-label">Senha</label>
            <input
              type="password"
              className="form-control"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
              minLength={6}
            />
            <div className="form-text">A senha deve ter pelo menos 6 caracteres</div>
          </div>
          
          <div className="mb-3">
            <label htmlFor="confirmPassword" className="form-label">Confirmar Senha</label>
            <input
              type="password"
              className="form-control"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary w-100" 
            disabled={isLoading}
          >
            {isLoading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;