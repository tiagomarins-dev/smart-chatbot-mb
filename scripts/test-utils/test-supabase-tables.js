// Teste de acesso às tabelas do Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Obter configurações do Supabase do .env
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Verificar se as variáveis de ambiente estão definidas
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Erro: Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias');
  process.exit(1);
}

// Definir NODE_TLS_REJECT_UNAUTHORIZED temporariamente para diagnóstico
// Essa configuração ignora erros de certificado SSL/TLS durante o teste
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Criar cliente Supabase com a chave de serviço para acesso total
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Lista de tabelas esperadas no sistema
const expectedTables = [
  'profiles',
  'companies',
  'projects',
  'leads',
  'lead_events',
  'lead_project',
  'api_keys',
  'whatsapp_conversations',
  'automated_message_templates',
  'automated_message_log'
];

// Função para verificar as tabelas
async function checkTables() {
  console.log('Verificando tabelas no Supabase...');
  console.log('---------------------------------------');
  
  const results = {
    accessible: [],
    notAccessible: [],
    counts: {}
  };
  
  // Verificar primeiro se conseguimos estabelecer conexão
  try {
    console.log('Testando conexão básica...');
    const { error } = await supabase.from('profiles').select('*').limit(1);
    
    if (error) {
      console.error('❌ Erro na conexão básica:', error.message);
      console.error('Detalhes:', error);
      return false;
    }
    
    console.log('✅ Conexão básica estabelecida!\n');
    
    // Verificar cada tabela esperada
    for (const tableName of expectedTables) {
      try {
        console.log(`Verificando tabela: ${tableName}...`);
        
        // Primeira parte: Verificar se a tabela existe
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        // Segunda parte: Se a tabela existir, fazer a contagem
        if (!error) {
          const { count, countError } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });

          if (!countError && count !== undefined) {
            results.counts[tableName] = count;
          }
        }
        
        if (error) {
          console.error(`❌ Não foi possível acessar a tabela "${tableName}": ${error.message}`);
          results.notAccessible.push({
            table: tableName,
            error: error.message
          });
        } else {
          console.log(`✅ Tabela "${tableName}" acessível!`);

          // Pegar a contagem de registros que foi definida na consulta anterior
          const count = results.counts[tableName] || 0;
          results.accessible.push(tableName);

          console.log(`   Registros encontrados: ${count}`);
          
          // Se a tabela tiver registros, mostrar um exemplo
          if (count > 0) {
            const { data: sampleData, error: sampleError } = await supabase
              .from(tableName)
              .select('*')
              .limit(1);
              
            if (!sampleError && sampleData.length > 0) {
              console.log(`   Exemplo de dados: ${JSON.stringify(sampleData[0], null, 2).substring(0, 150)}...`);
            }
          }
        }
        
        console.log(''); // linha em branco para separar resultados
        
      } catch (error) {
        console.error(`❌ Erro ao verificar tabela "${tableName}":`, error);
        results.notAccessible.push({
          table: tableName,
          error: error.message
        });
      }
    }
    
    // Exibir resumo
    console.log('\n=== RESUMO DA VERIFICAÇÃO ===');
    console.log(`Total de tabelas verificadas: ${expectedTables.length}`);
    console.log(`Tabelas acessíveis: ${results.accessible.length}`);
    console.log(`Tabelas com problemas: ${results.notAccessible.length}`);
    
    if (results.notAccessible.length > 0) {
      console.log('\nTabelas com problemas:');
      results.notAccessible.forEach(item => {
        console.log(`- ${item.table}: ${item.error}`);
      });
    }
    
    if (results.accessible.length > 0) {
      console.log('\nContagem de registros:');
      Object.entries(results.counts).forEach(([table, count]) => {
        console.log(`- ${table}: ${count} registros`);
      });
    }
    
    return results;
  } catch (error) {
    console.error('Erro crítico durante a verificação:', error);
    return false;
  }
}

// Executar a verificação
console.log('=== Verificação de Tabelas do Supabase ===');
console.log(`URL: ${supabaseUrl}`);
console.log(`NODE_TLS_REJECT_UNAUTHORIZED: ${process.env.NODE_TLS_REJECT_UNAUTHORIZED || 'não definido'}`);
console.log('=========================================\n');

checkTables().then(results => {
  if (!results) {
    console.log('\n❌ A verificação falhou devido a problemas de conexão.');
    console.log('Verifique suas credenciais e conexão com o Supabase.');
  } else {
    console.log('\nVerificação concluída!');
  }
});