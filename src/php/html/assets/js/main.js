import AuthUtils from './auth-utils.js';
import authService from './auth.js';
import supabase from './supabase.js';

/**
 * Carrega o total de empresas via API e atualiza o card no dashboard
 */
async function loadCompaniesCount() {
  const el = document.getElementById('company-count');
  if (!el) return;
  try {
    const session = await authService.getSession();
    if (!session) return;
    const headers = {};
    const apiKey = localStorage.getItem('api_key');
    if (apiKey) {
      headers['X-API-Key'] = apiKey;
    } else {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    // API endpoint para listar empresas (mesma origem)
    const url = '/api/v1/companies';
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const count = Array.isArray(data.companies) ? data.companies.length : (data.count || 0);
    el.textContent = count;
  } catch (err) {
    console.error('Erro ao carregar total de empresas:', err);
  }
}

// Função para inicializar a aplicação
async function initApp() {
  // Atualizar interface com base no estado de autenticação
  await AuthUtils.updateUIBasedOnAuth();
  // Carregar total de empresas no dashboard
  await loadCompaniesCount();
  
  // Configurar ouvinte para mudanças de autenticação
  const authListener = AuthUtils.setupAuthListener();
  // Atualizar total de empresas quando estado de autenticação mudar
  supabase.auth.onAuthStateChange((_event, _session) => {
    loadCompaniesCount();
  });
  
  // Configurar formulários de autenticação
  AuthUtils.setupAuthForms();
  
  // Outras inicializações da aplicação aqui
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', initApp);