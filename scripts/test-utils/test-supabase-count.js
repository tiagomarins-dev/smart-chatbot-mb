// Teste de contagem de registros nas tabelas do Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Obter configurações do Supabase do .env
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Desativar verificação de SSL para testes
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Verificar se as variáveis de ambiente estão definidas
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Erro: Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias');
  process.exit(1);
}

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Lista de tabelas a serem verificadas
const tablesToCheck = [
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

// Função para contar registros em uma tabela
async function countRecords(tableName) {
  console.log(`Verificando tabela: ${tableName}...`);
  
  try {
    // Primeiro verificar se a tabela existe
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error) {
      console.error(`  ❌ Tabela "${tableName}" não acessível: ${error.message}`);
      return { table: tableName, exists: false, error: error.message };
    }
    
    // Se a tabela existir, fazer a contagem
    console.log(`  ✅ Tabela "${tableName}" acessível`);
    
    try {
      // Fazer a consulta de contagem
      const { count, error: countError } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error(`  ⚠️ Erro ao contar registros: ${countError.message}`);
        return { table: tableName, exists: true, count: 'erro' };
      }
      
      console.log(`  📊 Total de registros: ${count}`);
      
      // Se tiver registros, mostrar um exemplo
      if (count > 0) {
        const { data: sample } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
          
        if (sample && sample.length > 0) {
          console.log(`  📝 Exemplo: ${JSON.stringify(sample[0]).substring(0, 100)}...`);
        }
      }
      
      return { table: tableName, exists: true, count };
    } catch (countError) {
      console.error(`  ⚠️ Exceção ao contar registros: ${countError}`);
      return { table: tableName, exists: true, count: 'exceção' };
    }
  } catch (error) {
    console.error(`  ❌ Erro ao acessar tabela: ${error}`);
    return { table: tableName, exists: false, error: String(error) };
  }
}

// Função principal para verificar todas as tabelas
async function checkAllTables() {
  console.log('Iniciando verificação de tabelas no Supabase...');
  console.log('================================================\n');
  
  const results = [];
  
  for (const table of tablesToCheck) {
    const result = await countRecords(table);
    results.push(result);
    console.log(''); // Linha em branco para separar resultados
  }
  
  // Exibir resumo
  console.log('\n=== RESUMO DA VERIFICAÇÃO ===');
  console.log(`Total de tabelas verificadas: ${results.length}`);
  
  const accessible = results.filter(r => r.exists);
  console.log(`Tabelas acessíveis: ${accessible.length}`);
  
  const withRecords = accessible.filter(r => typeof r.count === 'number' && r.count > 0);
  console.log(`Tabelas com registros: ${withRecords.length}`);
  
  console.log('\nContagem por tabela:');
  accessible.forEach(result => {
    console.log(`- ${result.table}: ${result.count} registros`);
  });
  
  const inaccessible = results.filter(r => !r.exists);
  if (inaccessible.length > 0) {
    console.log('\nTabelas não acessíveis:');
    inaccessible.forEach(result => {
      console.log(`- ${result.table}: ${result.error}`);
    });
  }
}

// Executar verificação
checkAllTables()
  .catch(error => {
    console.error('Erro durante a verificação:', error);
  });