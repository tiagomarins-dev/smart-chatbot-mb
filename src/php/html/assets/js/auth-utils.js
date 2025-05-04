import authService from './auth.js';

// Funções utilitárias para autenticação
const AuthUtils = {
  // Redirecionar se não estiver autenticado
  async redirectIfNotAuthenticated(redirectUrl = '/login.php') {
    const isAuthenticated = await authService.isAuthenticated();
    if (!isAuthenticated) {
      window.location.href = redirectUrl;
      return false;
    }
    return true;
  },

  // Redirecionar se estiver autenticado
  async redirectIfAuthenticated(redirectUrl = '/index.php') {
    const isAuthenticated = await authService.isAuthenticated();
    if (isAuthenticated) {
      window.location.href = redirectUrl;
      return true;
    }
    return false;
  },

  // Atualizar interface baseado no estado de autenticação
  async updateUIBasedOnAuth() {
    const isAuthenticated = await authService.isAuthenticated();
    const user = await authService.getCurrentUser();
    
    // Elementos que devem ser mostrados apenas para usuários autenticados
    const authElements = document.querySelectorAll('.auth-required');
    // Elementos que devem ser mostrados apenas para usuários não autenticados
    const nonAuthElements = document.querySelectorAll('.non-auth-required');
    // Elementos que mostram informações do usuário
    const userInfoElements = document.querySelectorAll('.user-info');
    
    if (isAuthenticated && user) {
      // Mostrar elementos de usuário autenticado
      authElements.forEach(el => el.classList.remove('d-none'));
      nonAuthElements.forEach(el => el.classList.add('d-none'));
      
      // Atualizar informações do usuário
      userInfoElements.forEach(el => {
        const dataType = el.getAttribute('data-user-info');
        if (dataType && user[dataType]) {
          el.textContent = user[dataType];
        }
      });
      
      // Incluir nome do usuário no dropdown, se existir
      const userDropdownText = document.querySelector('.user-dropdown-text');
      if (userDropdownText && user.user_metadata && user.user_metadata.name) {
        userDropdownText.textContent = user.user_metadata.name;
      } else if (userDropdownText) {
        userDropdownText.textContent = user.email;
      }
    } else {
      // Mostrar elementos de usuário não autenticado
      authElements.forEach(el => el.classList.add('d-none'));
      nonAuthElements.forEach(el => el.classList.remove('d-none'));
      
      // Resetar elementos de informações do usuário
      userInfoElements.forEach(el => {
        el.textContent = '';
      });
    }
  },

  // Ouvinte para mudanças de estado de autenticação
  setupAuthListener() {
    return authService.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      this.updateUIBasedOnAuth();
    });
  },

  // Inicializar eventos de formulários de autenticação
  setupAuthForms() {
    // Formulário de login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const loginStatus = document.getElementById('login-status');
        
        try {
          loginStatus.innerHTML = '<div class="alert alert-info">Autenticando...</div>';
          await authService.login(email, password);
          loginStatus.innerHTML = '<div class="alert alert-success">Login realizado com sucesso!</div>';
          setTimeout(() => {
            window.location.href = '/index.php';
          }, 1000);
        } catch (error) {
          loginStatus.innerHTML = `<div class="alert alert-danger">Erro: ${error.message}</div>`;
        }
      });
    }
    
    // Formulário de registro
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const name = document.getElementById('register-name').value;
        const registerStatus = document.getElementById('register-status');
        
        try {
          registerStatus.innerHTML = '<div class="alert alert-info">Registrando...</div>';
          await authService.register(email, password, { name });
          registerStatus.innerHTML = '<div class="alert alert-success">Registro realizado com sucesso! Verifique seu e-mail para confirmar a conta.</div>';
        } catch (error) {
          registerStatus.innerHTML = `<div class="alert alert-danger">Erro: ${error.message}</div>`;
        }
      });
    }
    
    // Botão de logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
          await authService.logout();
          window.location.href = '/login.php';
        } catch (error) {
          console.error('Erro no logout:', error.message);
          alert(`Erro ao fazer logout: ${error.message}`);
        }
      });
    }
  }
};

export default AuthUtils;