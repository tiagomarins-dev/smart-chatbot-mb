import AuthUtils from './auth-utils.js';
import authService from './auth.js';
import supabase from './supabase.js';

/**
 * Anima um valor numérico de um elemento de texto de start até end em duration ms
 * @param {HTMLElement} element - Elemento cujo texto será animado
 * @param {number} start - Valor inicial
 * @param {number} end - Valor final
 * @param {number} duration - Duração da animação em milissegundos
 */
function animateValue(element, start, end, duration) {
  const range = end - start;
  const startTime = performance.now();
  function step(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const value = Math.floor(start + range * progress);
    element.textContent = value;
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      element.textContent = end;
    }
  }
  requestAnimationFrame(step);
}

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
    // Anima contador de 0 (ou valor atual) até o total
    const current = parseInt(el.textContent, 10) || 0;
    animateValue(el, current, count, 1000);
  } catch (err) {
    console.error('Erro ao carregar total de empresas:', err);
  }
}
/**
 * Carrega o total de projetos via API e atualiza o card no dashboard
 */
async function loadProjectsCount() {
  const el = document.getElementById('project-count');
  if (!el) return;
    try {
      // Usar Supabase JS para contar projetos autenticados
      const { count, error } = await supabase
        .from('projects')
        .select('id', { count: 'exact', head: true });
      if (error) throw error;
      const total = count || 0;
      // Animação do contador
      const current = parseInt(el.textContent, 10) || 0;
      animateValue(el, current, total, 1000);
    } catch (err) {
      console.error('Erro ao carregar total de projetos via Supabase:', err);
    }
}
/**
 * Carrega o total de leads via Supabase e atualiza o card no dashboard
 */
async function loadLeadsCount() {
  const el = document.getElementById('leads-count');
  if (!el) return;
  try {
    const { count, error } = await supabase
      .from('leads')
      .select('id', { head: true, count: 'exact' });
    if (error) throw error;
    const total = count || 0;
    const current = parseInt(el.textContent, 10) || 0;
    animateValue(el, current, total, 1000);
  } catch (err) {
    console.error('Erro ao carregar total de leads:', err);
  }
}

// Função para inicializar a aplicação
async function initApp() {
  // Atualizar interface com base no estado de autenticação
  await AuthUtils.updateUIBasedOnAuth();
  // Carregar totais no dashboard
  await loadCompaniesCount();
  await loadProjectsCount();
  await loadLeadsCount();
  
  // Configurar ouvinte para mudanças de autenticação
  const authListener = AuthUtils.setupAuthListener();
  // Atualizar total de empresas quando estado de autenticação mudar
  supabase.auth.onAuthStateChange((_event, _session) => {
    loadCompaniesCount();
    loadProjectsCount();
    loadLeadsCount();
  });
  
  // Configurar formulários de autenticação
  AuthUtils.setupAuthForms();
  
  // Outras inicializações da aplicação aqui
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', initApp);