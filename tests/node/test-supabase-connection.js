// Script para testar conexão direta com o Supabase
// Executar com: node test-supabase-connection.js

const https = require('https');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

// Carregar variáveis de ambiente do arquivo .env
dotenv.config();

// Obter configurações do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Verificar se as variáveis necessárias estão definidas
if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('\x1b[31mERRO: Variáveis de ambiente do Supabase não estão definidas!\x1b[0m');
  console.log('Por favor, verifique se as seguintes variáveis estão no arquivo .env:');
  console.log('- SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  console.log('- SUPABASE_ANON_KEY');
  process.exit(1);
}

console.log('\x1b[34m=== TESTE DE CONEXÃO SUPABASE ===\x1b[0m');
console.log(`URL: ${supabaseUrl}`);
console.log(`Service Key: ${supabaseServiceKey.substring(0, 5)}...${supabaseServiceKey.substring(supabaseServiceKey.length - 5)}`);
console.log(`Anon Key: ${supabaseAnonKey.substring(0, 5)}...${supabaseAnonKey.substring(supabaseAnonKey.length - 5)}`);

// Primeiro, testar conectividade HTTP básica
console.log('\n\x1b[33m1. Testando conectividade HTTP básica...\x1b[0m');
const url = new URL(supabaseUrl);

const options = {
  hostname: url.hostname,
  port: url.port || 443,
  path: '/rest/v1/',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  console.log(`\x1b[32m✓ Conexão HTTP estabelecida (Status: ${res.statusCode})\x1b[0m`);
  
  // Agora testar o cliente Supabase
  testSupabaseClient();
});

req.on('error', (error) => {
  console.error(`\x1b[31m✗ Erro na conexão HTTP: ${error.message}\x1b[0m`);
  console.log('\nVerifique:');
  console.log('1. Sua conexão com a internet');
  console.log('2. Se há firewalls ou proxies bloqueando a conexão');
  console.log('3. Se o URL do Supabase está correto');
  
  // Tentar resolver o DNS para diagnosticar problemas de rede
  const dns = require('dns');
  dns.lookup(url.hostname, (err, address, family) => {
    if (err) {
      console.error(`\x1b[31m✗ Erro na resolução DNS: ${err.message}\x1b[0m`);
    } else {
      console.log(`\x1b[32m✓ Resolução DNS funcionando: ${url.hostname} -> ${address}\x1b[0m`);
      console.log('O problema parece estar na conexão HTTP, não na resolução DNS.');
    }
    
    // Mesmo com erro HTTP, tentar o cliente Supabase
    testSupabaseClient();
  });
});

req.end();

// Testar o cliente Supabase
function testSupabaseClient() {
  console.log('\n\x1b[33m2. Tentando conectar com o cliente Supabase...\x1b[0m');
  
  try {
    // Criar cliente com a chave de serviço
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Tentar uma operação simples para verificar a conexão
    supabaseAdmin.auth.getUser()
      .then(response => {
        if (response.error) {
          console.error(`\x1b[31m✗ Erro na API Supabase: ${response.error.message}\x1b[0m`);
        } else {
          console.log('\x1b[32m✓ Cliente Supabase estabeleceu conexão com sucesso!\x1b[0m');
        }
        
        // Testar login específico
        testLogin();
      })
      .catch(error => {
        console.error(`\x1b[31m✗ Erro ao usar o cliente Supabase: ${error.message}\x1b[0m`);
        testLogin();
      });
  } catch (error) {
    console.error(`\x1b[31m✗ Erro ao criar cliente Supabase: ${error.message}\x1b[0m`);
    testLogin();
  }
}

// Testar login com credenciais específicas
function testLogin() {
  console.log('\n\x1b[33m3. Testando login com credenciais específicas...\x1b[0m');
  
  const email = 'tiagof7@gmail.com';
  const password = '##Tfm#1983';
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log(`Tentando login com email: ${email}`);
    
    supabase.auth.signInWithPassword({
      email,
      password
    })
    .then(response => {
      if (response.error) {
        console.error(`\x1b[31m✗ Erro de login: ${response.error.message}\x1b[0m`);
        console.log('\nPossíveis causas:');
        console.log('1. Credenciais incorretas');
        console.log('2. Usuário não existe');
        console.log('3. Conta desativada ou não confirmada');
        console.log('4. Problemas na conexão com o Supabase');
      } else {
        console.log('\x1b[32m✓ Login bem-sucedido!\x1b[0m');
        
        if (response.data.user) {
          console.log(`ID do usuário: ${response.data.user.id}`);
          console.log(`Email: ${response.data.user.email}`);
          console.log(`Email confirmado: ${response.data.user.email_confirmed_at ? 'Sim' : 'Não'}`);
        }
        
        if (response.data.session) {
          console.log(`Token de acesso obtido: ${response.data.session.access_token.substring(0, 10)}...`);
          console.log(`Expira em: ${new Date(response.data.session.expires_at * 1000).toLocaleString()}`);
        }
      }
      
      // Realizar verificação final
      summarizeResults();
    })
    .catch(error => {
      console.error(`\x1b[31m✗ Erro durante o processo de login: ${error.message}\x1b[0m`);
      summarizeResults();
    });
  } catch (error) {
    console.error(`\x1b[31m✗ Erro ao criar cliente para login: ${error.message}\x1b[0m`);
    summarizeResults();
  }
}

// Resumir resultados e fornecer orientações
function summarizeResults() {
  console.log('\n\x1b[34m=== RESUMO DO DIAGNÓSTICO ===\x1b[0m');
  console.log('Se você está enfrentando problemas de conexão com o Supabase:');
  console.log('1. Verifique se as variáveis de ambiente estão configuradas corretamente');
  console.log('2. Confirme se o projeto Supabase está ativo e acessível');
  console.log('3. Teste a conectividade de rede para garantir que não há bloqueios');
  console.log('4. Verifique se as credenciais do usuário estão corretas');
  console.log('5. Confirme se o usuário existe no Authentication do Supabase');
  
  console.log('\nPara resolver problemas no backend:');
  console.log('1. Reinicie o serviço backend: docker-compose restart backend');
  console.log('2. Verifique os logs: docker-compose logs -f backend');
  console.log('3. Certifique-se que todas as variáveis de ambiente estão presentes no .env do backend');
  
  console.log('\n\x1b[34m=== FIM DO TESTE ===\x1b[0m');
}