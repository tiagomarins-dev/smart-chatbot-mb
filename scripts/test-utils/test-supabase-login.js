// Teste específico de login com o Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Obter configurações do Supabase do .env
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Desativar verificação de SSL para testes
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Verificar se as variáveis de ambiente estão definidas
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Erro: Variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY são necessárias');
  process.exit(1);
}

// Criar cliente Supabase usando a chave anônima (como um cliente normal faria)
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false
  }
});

// Função para testar o login de usuários
async function testUserLogin() {
  // Verificar se as credenciais foram fornecidas como argumentos
  const email = process.argv[2] || process.env.SUPABASE_TEST_EMAIL;
  const password = process.argv[3] || process.env.SUPABASE_TEST_PASSWORD;

  if (!email || !password) {
    // Se não foram fornecidas, solicitar via linha de comando
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    readline.question('Digite o email para teste: ', (inputEmail) => {
      readline.question('Digite a senha: ', async (inputPassword) => {
        await performLogin(inputEmail, inputPassword);
        readline.close();
      });
    });
  } else {
    // Se as credenciais já foram fornecidas, usar diretamente
    await performLogin(email, password);
  }
}

// Função que realiza o login propriamente dito
async function performLogin(email, password) {
  try {
    console.log(`\nTentando login para: ${email}`);
    console.log('---------------------------------------');
    
    // Configurações adicionais para debugging
    console.log('Configurações:');
    console.log(`- URL do Supabase: ${supabaseUrl}`);
    console.log(`- Usando key anônima: ${supabaseAnonKey.substring(0, 10)}...`);
    console.log(`- Node TLS Reject: ${process.env.NODE_TLS_REJECT_UNAUTHORIZED || 'não definido'}`);
    console.log('\n');
    
    // Tentar login
    console.time('Tempo de login');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    console.timeEnd('Tempo de login');
    
    if (error) {
      console.error('❌ Erro de login:', error.message);
      console.error('Detalhes do erro:', error);
      
      // Verificar tipo específico de erro
      if (error.message.includes('Invalid login credentials')) {
        console.log('\nℹ️ As credenciais parecem estar incorretas. Verifique o email e senha.');
      } else if (error.message.includes('network')) {
        console.log('\nℹ️ Parece haver um problema de rede ao conectar com o Supabase.');
        console.log('Tente verificar sua conexão de rede e possíveis bloqueios de firewall/proxy.');
      }
    } else {
      console.log('✅ Login bem-sucedido!');
      console.log('\nDados do usuário:');
      console.log('- ID:', data.user.id);
      console.log('- Email:', data.user.email);
      console.log('- Último login:', new Date(data.user.last_sign_in_at).toLocaleString());
      console.log('\nToken de sessão obtido:', !!data.session?.access_token);
      
      // Testar uma operação com o token do usuário
      console.log('\nTentando acessar o perfil do usuário com o token...');
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
        
      if (profileError) {
        console.error('❌ Erro ao acessar perfil:', profileError.message);
      } else {
        console.log('✅ Perfil acessado com sucesso:');
        console.log(profileData);
      }
    }
  } catch (e) {
    console.error('Erro crítico durante o teste de login:', e);
  }
}

// Testar também a conexão básica
async function testBasicConnection() {
  console.log('Verificando conexão básica com o Supabase...');
  
  try {
    // Tentativa de ping simples para verificar a conectividade
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    
    if (error) {
      console.error('❌ Erro na conexão básica:', error.message);
      return false;
    } else {
      console.log('✅ Conexão básica OK!');
      return true;
    }
  } catch (e) {
    console.error('Erro durante a verificação de conexão:', e);
    return false;
  }
}

// Executar os testes
console.log('=== Teste de Login Supabase ===\n');

// Primeiro verificar a conexão básica
testBasicConnection().then(connected => {
  if (connected) {
    // Se a conexão básica funcionar, testar o login
    testUserLogin();
  } else {
    console.log('\n❌ A conexão básica falhou. Verifique:');
    console.log('1. Sua conexão com a internet');
    console.log('2. A URL do Supabase está correta');
    console.log('3. A chave anônima do Supabase está correta');
    console.log('4. Não há bloqueios de firewall/proxy');
    console.log('\nSe estiver usando proxy corporativo, considere definir NODE_TLS_REJECT_UNAUTHORIZED=0 temporariamente para diagnóstico.');
  }
});