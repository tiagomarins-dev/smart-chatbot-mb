import authService from './auth.js';

// Adicionando um estilo para ocultar o corpo da página até a verificação de autenticação
const styleElement = document.createElement('style');
styleElement.textContent = `
  body { 
    visibility: hidden; 
    opacity: 0; 
    transition: opacity 0.2s;
  }
  body.auth-ready {
    visibility: visible;
    opacity: 1;
  }
`;
document.head.appendChild(styleElement);

// Função que verifica se o usuário já está autenticado e redireciona se necessário
async function checkAuthAndRedirect() {
  try {
    // Verificar se o usuário já está autenticado usando sessionStorage
    // para evitar requisições repetidas
    let isAuthenticated = false;
    const cachedAuth = sessionStorage.getItem('isAuthenticated');
    
    if (cachedAuth !== null) {
      isAuthenticated = cachedAuth === 'true';
    } else {
      // Se não estiver em cache, verificar via API
      isAuthenticated = await authService.isAuthenticated();
      // Armazenar resultado em sessionStorage
      sessionStorage.setItem('isAuthenticated', isAuthenticated);
    }
    
    // Obter a URL atual
    const currentPath = window.location.pathname;
    
    // Lista de páginas que requerem redirecionamento se já estiver autenticado
    const authRedirectPages = ['/login.php', '/register.php'];
    
    if (isAuthenticated) {
      // Se o usuário estiver na página de login ou registro, redirecionar para a home
      if (authRedirectPages.some(page => currentPath.endsWith(page))) {
        window.location.replace('index.php');
        return;
      }
    } else {
      // Se o usuário não estiver autenticado e estiver em uma página protegida, redirecionar para login
      // Atualmente, a única página protegida é a de integrações
      if (currentPath.endsWith('/integracoes.php')) {
        window.location.replace('login.php');
        return;
      }
    }
    
    // Se chegou aqui, mostrar a página
    document.body.classList.add('auth-ready');
  } catch (error) {
    console.error('Erro ao verificar autenticação:', error);
    // Mesmo em caso de erro, mostrar a página
    document.body.classList.add('auth-ready');
  }
}

// Adicionar evento para limpar o cache de autenticação quando o usuário fizer logout
document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      sessionStorage.removeItem('isAuthenticated');
    });
  }
});

// Executar a verificação o mais cedo possível
checkAuthAndRedirect();

// Exportar a função para uso em outras partes da aplicação
export { checkAuthAndRedirect };