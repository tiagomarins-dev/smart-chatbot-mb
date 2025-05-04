<?php
/**
 * Endpoint para verificar a configuração do ambiente
 * 
 * Este script verifica a configuração do ambiente, garantindo que as
 * variáveis de ambiente necessárias estão definidas e acessíveis.
 */

require_once __DIR__ . '/../utils/response.php';

// Configurar CORS
if (function_exists('configureCors')) {
    configureCors();
} else {
    // Configuração manual de CORS se a função não existir
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key');
    
    // Tratar solicitações OPTIONS (preflight)
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        header('HTTP/1.1 204 No Content');
        exit;
    }
}

// Verificar se método é GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(405, ['error' => 'Método não permitido']);
    exit;
}

try {
    // Verificar configuração do ambiente
    $config = [];
    
    // Verificar se o arquivo .env existe
    $envPath = __DIR__ . '/../../.env';
    $config['env_file_exists'] = file_exists($envPath);
    
    if ($config['env_file_exists']) {
        $config['env_file_path'] = $envPath;
        $config['env_file_readable'] = is_readable($envPath);
        
        if ($config['env_file_readable']) {
            // Ler o conteúdo do arquivo .env (sem expor valores sensíveis)
            $envContent = file_get_contents($envPath);
            $envLines = explode("\n", $envContent);
            $envVars = [];
            
            foreach ($envLines as $line) {
                $line = trim($line);
                if (empty($line) || strpos($line, '#') === 0) {
                    continue;
                }
                
                list($key, $value) = explode('=', $line, 2);
                $key = trim($key);
                
                // Mascarar valores sensíveis
                if (strpos($key, 'KEY') !== false || strpos($key, 'SECRET') !== false || strpos($key, 'PASSWORD') !== false) {
                    $envVars[$key] = strlen($value) > 10 ? 
                        substr($value, 0, 5) . '...' . substr($value, -5) : 
                        '[valor muito curto]';
                } else {
                    $envVars[$key] = $value;
                }
            }
            
            $config['env_variables'] = $envVars;
        }
    }
    
    // Verificar variáveis de ambiente no PHP
    $requiredVars = [
        'SUPABASE_URL',
        'SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
        'SUPABASE_JWT_SECRET'
    ];
    
    $phpEnvVars = [];
    foreach ($requiredVars as $var) {
        $value = getenv($var);
        $phpEnvVars[$var] = [
            'defined' => !empty($value),
            'length' => !empty($value) ? strlen($value) : 0
        ];
    }
    
    $config['php_env_variables'] = $phpEnvVars;
    
    // Verificar configuração do Supabase
    if (file_exists(__DIR__ . '/../config/supabase.php')) {
        $supabaseConfig = require __DIR__ . '/../config/supabase.php';
        $config['supabase_config'] = [
            'url' => $supabaseConfig['url'],
            'key_defined' => !empty($supabaseConfig['key']),
            'service_role_key_defined' => !empty($supabaseConfig['service_role_key']),
            'jwt_secret_defined' => !empty($supabaseConfig['jwt_secret']),
            'project_id' => $supabaseConfig['project_id']
        ];
    } else {
        $config['supabase_config'] = 'Arquivo de configuração do Supabase não encontrado';
    }
    
    // Verificar configuração do banco de dados
    if (file_exists(__DIR__ . '/../config/database.php')) {
        $dbConfig = require __DIR__ . '/../config/database.php';
        $config['database_config'] = [
            'driver' => $dbConfig['driver'],
            'host' => $dbConfig['host'],
            'port' => $dbConfig['port'],
            'database' => $dbConfig['database'],
            'username' => $dbConfig['username'],
            'password_defined' => !empty($dbConfig['password']),
            'password_length' => !empty($dbConfig['password']) ? strlen($dbConfig['password']) : 0,
            'options' => array_keys($dbConfig['options'])
        ];
    } else {
        $config['database_config'] = 'Arquivo de configuração do banco de dados não encontrado';
    }
    
    // Verificar extensões PHP
    $config['php_extensions'] = [
        'pdo' => extension_loaded('pdo'),
        'pdo_pgsql' => extension_loaded('pdo_pgsql'),
        'curl' => extension_loaded('curl'),
        'json' => extension_loaded('json')
    ];
    
    // Verificar permissões de diretórios
    $config['directories'] = [
        'logs' => [
            'exists' => is_dir(__DIR__ . '/../logs'),
            'writable' => is_dir(__DIR__ . '/../logs') && is_writable(__DIR__ . '/../logs')
        ],
        'data' => [
            'exists' => is_dir(__DIR__ . '/../data'),
            'writable' => is_dir(__DIR__ . '/../data') && is_writable(__DIR__ . '/../data')
        ]
    ];
    
    // Verificar configuração do Docker
    $config['docker'] = [
        'inside_container' => file_exists('/.dockerenv') || (
            file_exists('/proc/1/cgroup') && 
            strpos(file_get_contents('/proc/1/cgroup'), 'docker') !== false
        )
    ];
    
    // Verificar PHP info
    $config['php_info'] = [
        'version' => PHP_VERSION,
        'sapi' => php_sapi_name(),
        'os' => PHP_OS,
        'memory_limit' => ini_get('memory_limit'),
        'max_execution_time' => ini_get('max_execution_time')
    ];
    
    // Verificar informações do servidor
    $config['server'] = [
        'host' => $_SERVER['HTTP_HOST'] ?? 'desconhecido',
        'software' => $_SERVER['SERVER_SOFTWARE'] ?? 'desconhecido',
        'protocol' => $_SERVER['SERVER_PROTOCOL'] ?? 'desconhecido',
        'request_time' => $_SERVER['REQUEST_TIME'] ?? 'desconhecido'
    ];
    
    // Determinar o status geral de cada categoria
    $statusCategories = [
        'env_file' => $config['env_file_exists'] && $config['env_file_readable'],
        'php_env_variables' => count(array_filter($phpEnvVars, function($var) { return $var['defined']; })) === count($requiredVars),
        'supabase_config' => is_array($config['supabase_config']) && $config['supabase_config']['service_role_key_defined'] && $config['supabase_config']['jwt_secret_defined'],
        'database_config' => is_array($config['database_config']) && $config['database_config']['password_defined'],
        'php_extensions' => !in_array(false, $config['php_extensions']),
        'directories' => $config['directories']['logs']['writable']
    ];
    
    $overallStatus = !in_array(false, $statusCategories) ? 'success' : 'warning';
    if (count(array_filter($statusCategories)) < 3) {
        $overallStatus = 'error';
    }
    
    // Enviar resposta com a configuração verificada
    sendResponse(200, [
        'status' => $overallStatus,
        'message' => 'Verificação de configuração concluída',
        'config' => $config,
        'status_categories' => $statusCategories,
        '_debug' => [
            'memory_usage' => round(memory_get_usage() / 1024 / 1024, 2) . ' MB',
            'execution_time' => microtime(true) - $_SERVER['REQUEST_TIME_FLOAT']
        ]
    ]);
    
} catch (Exception $e) {
    // Registrar erro em log
    error_log('Erro ao verificar configuração: ' . $e->getMessage());
    
    // Enviar resposta de erro
    sendResponse(500, [
        'status' => 'error',
        'message' => 'Erro ao verificar configuração',
        'error' => $e->getMessage(),
        '_debug' => [
            'memory_usage' => round(memory_get_usage() / 1024 / 1024, 2) . ' MB',
            'execution_time' => microtime(true) - $_SERVER['REQUEST_TIME_FLOAT']
        ]
    ]);
}