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
    return !!session;
  }

  // Configurar listener para mudanças de autenticação
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  }
}

// Exportar uma instância do serviço de autenticação
const authService = new AuthService();
export default authService;