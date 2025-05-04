// Script para testar a configuração de autenticação
import supabase from './supabase.js';
import authService from './auth.js';
import AuthUtils from './auth-utils.js';

// Função para testar a conexão com o Supabase
async function testConnection() {
  try {
    // Verificar se as credenciais do Supabase estão configuradas
    if (!supabase.supabaseUrl || !supabase.supabaseKey) {
      console.error('❌ Credenciais do Supabase não configuradas!');
      return false;
    }
    
    // Tentar fazer uma chamada simples para testar a conexão
    const { data, error } = await supabase.from('profiles').select('count');
    
    if (error) {
      console.error('❌ Erro ao conectar com o Supabase:', error.message);
      return false;
    }
    
    console.log('✅ Conexão com o Supabase estabelecida com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro ao testar conexão:', error.message);
    return false;
  }
}

// Função para testar o fluxo de autenticação completo
async function testAuthentication() {
  try {
    // 1. Verificar a conexão
    const connectionOk = await testConnection();
    if (!connectionOk) {
      console.error('❌ Não foi possível testar a autenticação devido a problemas de conexão');
      return;
    }
    
    console.log('🔍 Testando serviços de autenticação...');
    
    // 2. Verificar o estado atual de autenticação
    const isAuthenticated = await authService.isAuthenticated();
    console.log(`👤 Estado atual de autenticação: ${isAuthenticated ? 'Autenticado' : 'Não autenticado'}`);
    
    if (isAuthenticated) {
      const user = await authService.getCurrentUser();
      console.log('✅ Usuário atual:', user);
    }
    
    // 3. Testar os utilitários de autenticação
    console.log('🔄 Utilitários de autenticação disponíveis:', Object.keys(AuthUtils));
    
    console.log('✅ Teste de autenticação concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao testar autenticação:', error.message);
  }
}

// Executar teste quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  console.log('🧪 Iniciando testes de autenticação...');
  testAuthentication();
});

// Exportar funções para uso em outros scripts
export {
  testConnection,
  testAuthentication
};