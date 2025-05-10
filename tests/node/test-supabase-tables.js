/**
 * Verificar tabelas do Supabase
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.test' });

// Configurações
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

// Inicializa o cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkTables() {
  console.log('='.repeat(80));
  console.log('VERIFICAÇÃO DE TABELAS NO SUPABASE');
  console.log('='.repeat(80));
  
  try {
    // Verificar se conseguimos acessar a tabela de leads como referência
    console.log('1. Verificando tabela leads...');
    const { data: leads, error: leadError } = await supabase
      .from('leads')
      .select('id, name, email, phone')
      .limit(3);
    
    if (leadError) {
      throw new Error(`Erro ao acessar tabela leads: ${leadError.message}`);
    }
    
    console.log(`Tabela leads OK: ${leads.length} registros encontrados`);
    if (leads.length > 0) {
      console.log('Exemplo de lead:', leads[0]);
    }
    
    // Verificar se a tabela whatsapp_conversations existe
    console.log('\n2. Verificando tabela whatsapp_conversations...');
    const { data: conversations, error: convError } = await supabase
      .from('whatsapp_conversations')
      .select('id')
      .limit(1);
    
    if (convError) {
      if (convError.code === '42P01') {
        console.error('Tabela whatsapp_conversations não existe!');
        console.log('Verifique se a migração 00019_whatsapp_conversations.sql foi executada.');
      } else {
        throw new Error(`Erro ao acessar tabela whatsapp_conversations: ${convError.message}`);
      }
    } else {
      console.log('Tabela whatsapp_conversations existe.');
      
      // Contar registros na tabela
      const { data: countData, error: countError } = await supabase
        .from('whatsapp_conversations')
        .select('*', { count: 'exact', head: true });
      
      const count = countData ? countData.length : 0;
      console.log(`Total de mensagens na tabela: ${count}`);
      
      // Listar migração relacionada ao WhatsApp
      console.log('\n3. Verificando migração do WhatsApp...');
      const { data: migrations, error: migrationError } = await supabase
        .from('supabase_migrations')
        .select('*')
        .ilike('name', '%whatsapp%');
      
      if (migrationError) {
        console.log('Não foi possível verificar a tabela de migrações:', migrationError.message);
      } else if (migrations && migrations.length > 0) {
        console.log('Migrações relacionadas ao WhatsApp:');
        migrations.forEach(migration => {
          console.log(`- ${migration.name}: ${migration.executed_at ? 'Executada' : 'Pendente'}`);
        });
      } else {
        console.log('Nenhuma migração relacionada ao WhatsApp encontrada na tabela de migrações.');
        console.log('Você precisa executar a migração 00019_whatsapp_conversations.sql');
      }
    }
  } catch (error) {
    console.error('Erro durante a verificação:', error.message);
  }
  
  console.log('\n' + '='.repeat(80));
}

// Executar verificação
checkTables().catch(console.error);