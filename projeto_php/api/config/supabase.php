<?php
/**
 * Configuração do Supabase
 * 
 * Este arquivo contém as credenciais e configurações para conectar ao Supabase.
 */

// Log para depuração
error_log('Carregando configuração do Supabase...');

// Carrega variáveis de ambiente se existir um arquivo .env
if (file_exists(__DIR__ . '/../../.env')) {
    error_log('Arquivo .env encontrado, carregando variáveis...');
    $envFile = file_get_contents(__DIR__ . '/../../.env');
    $lines = explode("\n", $envFile);
    foreach ($lines as $line) {
        if (empty(trim($line)) || strpos(trim($line), '#') === 0) {
            continue;
        }
        
        // Verificar se a linha tem o formato correto
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value);
            putenv(sprintf('%s=%s', trim($key), trim($value)));
            
            // Log apenas para chaves do Supabase (sem mostrar valores completos por segurança)
            if (strpos($key, 'SUPABASE') !== false) {
                $valuePreview = substr(trim($value), 0, 10) . '...';
                error_log("Variável carregada: " . trim($key) . " = " . $valuePreview);
            }
        }
    }
} else {
    error_log('ALERTA: Arquivo .env não encontrado em ' . __DIR__ . '/../../.env');
}

// Verificar valores após carregamento
$supabase_url = getenv('SUPABASE_URL');
$anon_key = getenv('SUPABASE_ANON_KEY');
$service_role_key = getenv('SUPABASE_SERVICE_ROLE_KEY');
$jwt_secret = getenv('SUPABASE_JWT_SECRET');

error_log('SUPABASE_URL está definido: ' . ($supabase_url ? 'SIM' : 'NÃO'));
error_log('SUPABASE_ANON_KEY está definido: ' . ($anon_key ? 'SIM' : 'NÃO'));
error_log('SUPABASE_SERVICE_ROLE_KEY está definido: ' . ($service_role_key ? 'SIM' : 'NÃO'));
error_log('SUPABASE_JWT_SECRET está definido: ' . ($jwt_secret ? 'SIM' : 'NÃO'));

// Configurações do Supabase
$config = [
    'url' => $supabase_url ?: 'https://gciezqjeaehrtihqjihz.supabase.co',
    'key' => $anon_key ?: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjaWV6cWplYWVocnRpaHFqaWh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNTMxOTgsImV4cCI6MjA2MTkyOTE5OH0.YjnAinUQaOMZVgxbJsyJR6xIByjnnLiJIJYEgvOvcrM',
    'service_role_key' => $service_role_key ?: '',
    'jwt_secret' => $jwt_secret ?: '',
    'project_id' => 'gciezqjeaehrtihqjihz',
    'api_version' => 'v1',
];

// Log de valores configurados (versões truncadas por segurança)
error_log('Config URL: ' . substr($config['url'], 0, 20) . '...');
error_log('Config ANON KEY: ' . (empty($config['key']) ? 'VAZIO' : substr($config['key'], 0, 10) . '...'));
error_log('Config SERVICE KEY: ' . (empty($config['service_role_key']) ? 'VAZIO' : substr($config['service_role_key'], 0, 10) . '...'));
error_log('Config JWT SECRET: ' . (empty($config['jwt_secret']) ? 'VAZIO' : substr($config['jwt_secret'], 0, 10) . '...'));

return $config;