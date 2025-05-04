<?php
/**
 * Configuração do Supabase
 * 
 * Este arquivo contém as credenciais e configurações para conectar ao Supabase.
 */

// Carrega variáveis de ambiente se existir um arquivo .env
if (file_exists(__DIR__ . '/../../.env')) {
    $envFile = file_get_contents(__DIR__ . '/../../.env');
    $lines = explode("\n", $envFile);
    foreach ($lines as $line) {
        if (empty(trim($line)) || strpos(trim($line), '#') === 0) {
            continue;
        }
        list($key, $value) = explode('=', $line, 2);
        $_ENV[trim($key)] = trim($value);
        putenv(sprintf('%s=%s', trim($key), trim($value)));
    }
}

// Configurações do Supabase
return [
    'url' => getenv('SUPABASE_URL') ?: 'https://gciezqjeaehrtihqjihz.supabase.co',
    'key' => getenv('SUPABASE_ANON_KEY') ?: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjaWV6cWplYWVocnRpaHFqaWh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNTMxOTgsImV4cCI6MjA2MTkyOTE5OH0.YjnAinUQaOMZVgxbJsyJR6xIByjnnLiJIJYEgvOvcrM',
    'service_role_key' => getenv('SUPABASE_SERVICE_ROLE_KEY') ?: '',
    'jwt_secret' => getenv('SUPABASE_JWT_SECRET') ?: '',
    'project_id' => 'gciezqjeaehrtihqjihz',
    'api_version' => 'v1',
];