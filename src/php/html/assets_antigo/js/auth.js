import supabase from './supabase.js';

// Classe para gerenciar a autenticação
class AuthService {
  // Método para login com email/senha
  async login(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      // Atualizar o estado de autenticação no sessionStorage
      sessionStorage.setItem('isAuthenticated', 'true');
      
      // Tentar obter API key do usuário
      try {
        // Usar o token para obter a API key através de uma chamada adicional
        // Este código assume que existe um endpoint para isso - atualize conforme necessário
        const userApiKeyResponse = await fetch('/api/v1/auth', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${data.session.access_token}`
          }
        });
        
        if (userApiKeyResponse.ok) {
          const apiKeyData = await userApiKeyResponse.json();
          if (apiKeyData && apiKeyData.api_key) {
            console.log('API Key obtida com sucesso');
            // Armazenar API key no localStorage
            localStorage.setItem('api_key', apiKeyData.api_key);
          }
        }
      } catch (apiKeyError) {
        console.warn('Erro ao obter API key durante login:', apiKeyError);
        // Não interromper o fluxo de login por falha na obtenção da API key
      }
      
      return { user: data.user, session: data.session };
    } catch (error) {
      console.error('Erro no login:', error.message);
      throw error;
    }
  }

  // Método para registro de usuário
  async register(email, password, userData = {}) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData, // Dados adicionais do usuário (nome, etc.)
        },
      });
      
      if (error) throw error;
      return { user: data.user, session: data.session };
    } catch (error) {
      console.error('Erro no registro:', error.message);
      throw error;
    }
  }

  // Método para logout
  async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Limpar o estado de autenticação no sessionStorage
      sessionStorage.removeItem('isAuthenticated');
      
      // Limpar a API key no localStorage
      try {
        localStorage.removeItem('api_key');
        console.log('API Key removida durante logout');
      } catch (e) {
        console.warn('Erro ao remover API key durante logout:', e);
      }
      
      return true;
    } catch (error) {
      console.error('Erro no logout:', error.message);
      throw error;
    }
  }

  // Método para obter o usuário atual
  async getCurrentUser() {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data.user;
    } catch (error) {
      console.error('Erro ao obter usuário atual:', error.message);
      return null;
    }
  }

  // Método para obter a sessão atual
  async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session;
    } catch (error) {
      console.error('Erro ao obter sessão:', error.message);
      return null;
    }
  }

  // Verificar se o usuário está autenticado
  async isAuthenticated() {
    const session = await this.getSession();
    const isAuth = !!session;
    // Atualizar o estado de autenticação no sessionStorage
    sessionStorage.setItem('isAuthenticated', isAuth.toString());
    return isAuth;
  }

  // Configurar listener para mudanças de autenticação
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
      // Atualizar o estado de autenticação no sessionStorage com base no evento
      if (event === 'SIGNED_IN') {
        sessionStorage.setItem('isAuthenticated', 'true');
      } else if (event === 'SIGNED_OUT') {
        sessionStorage.setItem('isAuthenticated', 'false');
      }
      callback(event, session);
    });
  }
}

// Exportar uma instância do serviço de autenticação
const authService = new AuthService();
export default authService;