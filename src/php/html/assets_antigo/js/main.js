import AuthUtils from './auth-utils.js';

// Função para inicializar a aplicação
async function initApp() {
  // Atualizar interface com base no estado de autenticação
  await AuthUtils.updateUIBasedOnAuth();
  
  // Configurar ouvinte para mudanças de autenticação
  const authListener = AuthUtils.setupAuthListener();
  
  // Configurar formulários de autenticação
  AuthUtils.setupAuthForms();
  
  // Outras inicializações da aplicação aqui
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', initApp);