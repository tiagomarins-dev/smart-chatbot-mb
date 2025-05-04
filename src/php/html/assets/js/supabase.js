// Configuração do cliente Supabase
import { createClient } from '@supabase/supabase-js';

// Constantes de configuração do Supabase (substituir por suas credenciais)
const SUPABASE_URL = 'https://sua-url-supabase.supabase.co';
const SUPABASE_ANON_KEY = 'sua-chave-anonima-supabase';

// Inicializar o cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Exportar o cliente para uso em outros arquivos
export default supabase;