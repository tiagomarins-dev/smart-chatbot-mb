// Teste de conexão com o Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Obter configurações do Supabase do .env
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Desativar verificação de SSL para testes
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Verificar se as variáveis de ambiente estão definidas
console.log('Verificando variáveis de ambiente:');
console.log('- SUPABASE_URL definido:', !!supabaseUrl);
console.log('- SUPABASE_SERVICE_ROLE_KEY definido:', !!supabaseServiceKey);
console.log('- SUPABASE_ANON_KEY definido:', !!supabaseAnonKey);
console.log('\n');

// Configurar cliente Supabase com chave de serviço (acesso admin)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Função de teste para verificar a conexão e funcionalidades básicas
async function testSupabaseConnection() {
  console.log('1. Teste de conexão básica com o Supabase...');
  
  try {
    // Teste 1: Verificar se podemos obter informações sobre o serviço
    console.log('Tentando acessar a API do Supabase...');
    const { data: healthData, error: healthError } = await supabase.from('profiles').select('*').limit(1);
    
    if (healthError) {
      console.error('❌ Erro ao acessar o Supabase:', healthError.message);
      console.error('Detalhes:', healthError);
    } else {
      console.log('✅ Conexão básica com Supabase estabelecida com sucesso!');
      console.log('Resposta:', healthData);
    }
    
    // Teste 2: Verificar autenticação do usuário 
    console.log('\n2. Teste de autenticação com credenciais de teste...');
    
    // Defina aqui credenciais de teste ou use um usuário existente
    const testEmail = 'teste@exemplo.com';
    const testPassword = 'senha_de_teste';
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (authError) {
      console.log('❌ Erro de autenticação (esperado se as credenciais não existirem):', authError.message);
    } else {
      console.log('✅ Autenticação bem-sucedida!');
      console.log('Dados do usuário:', authData);
    }
    
    // Teste 3: Verificar acesso às tabelas principais
    console.log('\n3. Teste de acesso às tabelas principais...');
    
    // Lista das tabelas principais para verificar
    const tablesToCheck = ['profiles', 'companies', 'projects', 'leads', 'lead_events'];
    
    for (const table of tablesToCheck) {
      const { data, error } = await supabase
        .from(table)
        .select('count(*)')
        .limit(1);
        
      if (error) {
        console.error(`❌ Erro ao acessar tabela ${table}:`, error.message);
      } else {
        console.log(`✅ Tabela ${table} acessível. Contagem:`, data);
      }
    }
    
    console.log('\nTestes concluídos!');
    
  } catch (error) {
    console.error('Erro crítico durante testes:', error);
  }
}

// Executar testes
console.log('Iniciando testes de conexão com Supabase...');
console.log(`URL: ${supabaseUrl}`);
console.log('---------------------------------------\n');

testSupabaseConnection()
  .catch(error => {
    console.error('Erro geral:', error);
  });