// Configuração do cliente Supabase
import { createClient } from '@supabase/supabase-js';

// Constantes de configuração do Supabase
const SUPABASE_URL = 'https://gciezqjeaehrtihqjihz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjaWV6cWplYWVocnRpaHFqaWh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNTMxOTgsImV4cCI6MjA2MTkyOTE5OH0.YjnAinUQaOMZVgxbJsyJR6xIByjnnLiJIJYEgvOvcrM';

// Inicializar o cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Exportar o cliente para uso em outros arquivos
export default supabase;