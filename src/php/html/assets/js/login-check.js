import authService from './auth.js';

// Função que verifica se o usuário já está autenticado e redireciona se necessário
async function checkAuthAndRedirect() {
  try {
    // Verificar se o usuário já está autenticado
    const isAuthenticated = await authService.isAuthenticated();
    
    // Obter a URL atual
    const currentPath = window.location.pathname;
    
    // Lista de páginas que requerem redirecionamento se já estiver autenticado
    const authRedirectPages = ['/login.php', '/register.php'];
    
    if (isAuthenticated) {
      // Se o usuário estiver na página de login ou registro, redirecionar para a home
      if (authRedirectPages.some(page => currentPath.endsWith(page))) {
        window.location.href = 'index.php';
        return;
      }
    } else {
      // Se o usuário não estiver autenticado e estiver em uma página protegida, redirecionar para login
      // Atualmente, a única página protegida é a de integrações
      if (currentPath.endsWith('/integracoes.php')) {
        window.location.href = 'login.php';
        return;
      }
    }
  } catch (error) {
    console.error('Erro ao verificar autenticação:', error);
  }
}

// Exportar a função para uso em outras partes da aplicação
export { checkAuthAndRedirect };

// Executar a verificação quando este script for importado
checkAuthAndRedirect();