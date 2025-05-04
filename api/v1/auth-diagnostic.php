<?php
/**
 * Diagnóstico completo de autenticação
 * 
 * Este endpoint realiza testes detalhados nas duas implementações de autenticação (direta e REST)
 * e fornece informações completas sobre cada etapa do processo.
 */

require_once __DIR__ . '/../utils/response.php';

// Configurar CORS
if (function_exists('configureCors')) {
    configureCors();
} else {
    // Configuração manual de CORS
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key');
    
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        header('HTTP/1.1 204 No Content');
        exit;
    }
}

// Verificar método
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(405, ['error' => 'Método não permitido']);
    exit;
}

// Iniciar coleta de diagnóstico
$diagnostic = [
    'timestamp' => date('Y-m-d H:i:s'),
    'server_info' => [
        'php_version' => PHP_VERSION,
        'os' => PHP_OS,
        'webserver' => $_SERVER['SERVER_SOFTWARE'] ?? 'desconhecido',
        'docker' => file_exists('/.dockerenv') ? 'sim' : 'não'
    ],
    'headers' => [],
    'environment' => [],
    'config_files' => [],
    'auth_tests' => [
        'direct_db' => [],
        'rest_api' => []
    ]
];

// Coletar informações de cabeçalhos
$headers = getallheaders();
$safeHeaders = [];

foreach ($headers as $key => $value) {
    // Mascarar valores sensíveis
    if (preg_match('/api[-_]?key|auth|token|secret|password/i', $key)) {
        $safeHeaders[$key] = substr($value, 0, 5) . '...' . substr($value, -5);
    } else {
        $safeHeaders[$key] = $value;
    }
}

$diagnostic['headers'] = $safeHeaders;

// Verificar variáveis de ambiente
$envVars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_JWT_SECRET'
];

foreach ($envVars as $var) {
    $value = getenv($var);
    $diagnostic['environment'][$var] = [
        'defined' => !empty($value),
        'length' => !empty($value) ? strlen($value) : 0,
        'first_chars' => !empty($value) ? substr($value, 0, 5) . '...' : '',
        'source' => getenv($var) !== false ? 'environment' : 'not set'
    ];
}

// Verificar arquivos de configuração
$configFiles = [
    'supabase.php' => __DIR__ . '/../config/supabase.php',
    'database.php' => __DIR__ . '/../config/database.php'
];

foreach ($configFiles as $name => $path) {
    if (file_exists($path)) {
        $diagnostic['config_files'][$name] = [
            'exists' => true,
            'path' => $path,
            'readable' => is_readable($path),
            'size' => filesize($path),
            'modified' => date('Y-m-d H:i:s', filemtime($path))
        ];
        
        // Carregar e verificar conteúdo
        if ($name === 'supabase.php') {
            $supabaseConfig = require $path;
            $diagnostic['config_files'][$name]['values'] = [
                'url' => $supabaseConfig['url'],
                'service_role_key_defined' => !empty($supabaseConfig['service_role_key']),
                'service_role_key_length' => !empty($supabaseConfig['service_role_key']) ? strlen($supabaseConfig['service_role_key']) : 0,
                'jwt_secret_defined' => !empty($supabaseConfig['jwt_secret']),
                'project_id' => $supabaseConfig['project_id'],
            ];
        } elseif ($name === 'database.php') {
            $dbConfig = require $path;
            $diagnostic['config_files'][$name]['values'] = [
                'driver' => $dbConfig['driver'],
                'host' => $dbConfig['host'],
                'port' => $dbConfig['port'],
                'database' => $dbConfig['database'],
                'username' => $dbConfig['username'],
                'password_defined' => !empty($dbConfig['password']),
                'password_length' => !empty($dbConfig['password']) ? strlen($dbConfig['password']) : 0,
            ];
        }
    } else {
        $diagnostic['config_files'][$name] = [
            'exists' => false,
            'path' => $path
        ];
    }
}

// Testar conexão direta ao banco de dados (simulação de auth.php)
try {
    $diagnostic['auth_tests']['direct_db']['test_started'] = true;
    
    // Carregar configurações
    $dbConfig = require __DIR__ . '/../config/database.php';
    
    // Montar string de conexão para diagnóstico (sem senha)
    $safeDsn = sprintf(
        'pgsql:host=%s;port=%s;dbname=%s;user=%s', 
        $dbConfig['host'], 
        $dbConfig['port'], 
        $dbConfig['database'], 
        $dbConfig['username']
    );
    
    $diagnostic['auth_tests']['direct_db']['connection_string'] = $safeDsn;
    
    // Testar se PDO está disponível
    $diagnostic['auth_tests']['direct_db']['pdo_available'] = class_exists('PDO');
    $diagnostic['auth_tests']['direct_db']['pdo_pgsql_available'] = extension_loaded('pdo_pgsql');
    
    if (!$diagnostic['auth_tests']['direct_db']['pdo_available'] || 
        !$diagnostic['auth_tests']['direct_db']['pdo_pgsql_available']) {
        throw new Exception("PDO ou driver pdo_pgsql não disponível");
    }
    
    // Tentar conexão com timeout reduzido
    $timeoutOptions = [
        PDO::ATTR_TIMEOUT => 5, // 5 segundos
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ];
    
    $dsn = sprintf(
        'pgsql:host=%s;port=%s;dbname=%s;connect_timeout=5', 
        $dbConfig['host'], 
        $dbConfig['port'], 
        $dbConfig['database']
    );
    
    $diagnostic['auth_tests']['direct_db']['connection_attempt'] = 'iniciada';
    $startTime = microtime(true);
    
    try {
        $pdo = new PDO($dsn, $dbConfig['username'], $dbConfig['password'], $timeoutOptions);
        $diagnostic['auth_tests']['direct_db']['connection_successful'] = true;
        $diagnostic['auth_tests']['direct_db']['connection_time'] = round(microtime(true) - $startTime, 2) . 's';
        
        // Testar consulta simples
        $stmt = $pdo->query('SELECT current_database() as db, current_user as user');
        $dbInfo = $stmt->fetch(PDO::FETCH_ASSOC);
        $diagnostic['auth_tests']['direct_db']['database_info'] = $dbInfo;
        
        $diagnostic['auth_tests']['direct_db']['conclusion'] = 'Conexão direta ao banco de dados bem-sucedida';
    } catch (PDOException $e) {
        $diagnostic['auth_tests']['direct_db']['connection_successful'] = false;
        $diagnostic['auth_tests']['direct_db']['connection_time'] = round(microtime(true) - $startTime, 2) . 's';
        $diagnostic['auth_tests']['direct_db']['error_code'] = $e->getCode();
        $diagnostic['auth_tests']['direct_db']['error_message'] = $e->getMessage();
        
        // Analisar erro
        if ($e->getCode() == '08006') {
            $diagnostic['auth_tests']['direct_db']['conclusion'] = 'Timeout na conexão - provavelmente o banco está bloqueando conexões externas';
        } else if ($e->getCode() == '28P01') {
            $diagnostic['auth_tests']['direct_db']['conclusion'] = 'Erro de autenticação - credenciais incorretas';
        } else {
            $diagnostic['auth_tests']['direct_db']['conclusion'] = 'Erro de conexão - verifique as configurações e firewall';
        }
    }
} catch (Exception $e) {
    $diagnostic['auth_tests']['direct_db']['test_error'] = $e->getMessage();
}

// Testar conexão via REST API
try {
    $diagnostic['auth_tests']['rest_api']['test_started'] = true;
    
    // Verificar se SupabaseClient está disponível
    require_once __DIR__ . '/../models/SupabaseClient.php';
    $diagnostic['auth_tests']['rest_api']['supabase_client_available'] = class_exists('SupabaseClient');
    
    if (!$diagnostic['auth_tests']['rest_api']['supabase_client_available']) {
        throw new Exception("Classe SupabaseClient não encontrada");
    }
    
    // Obter configuração do Supabase
    $supabaseConfig = require __DIR__ . '/../config/supabase.php';
    $diagnostic['auth_tests']['rest_api']['supabase_url'] = $supabaseConfig['url'];
    $diagnostic['auth_tests']['rest_api']['service_role_key_defined'] = !empty($supabaseConfig['service_role_key']);
    
    if (!$diagnostic['auth_tests']['rest_api']['service_role_key_defined']) {
        throw new Exception("Chave de serviço do Supabase não definida");
    }
    
    // Testar API REST do Supabase
    $startTime = microtime(true);
    $diagnostic['auth_tests']['rest_api']['connection_attempt'] = 'iniciada';
    
    try {
        // Criar cliente Supabase
        $supabase = new SupabaseClient(
            $supabaseConfig['url'],
            $supabaseConfig['service_role_key']
        );
        
        // Testar acesso a tabela do sistema para verificar autenticação
        $response = $supabase
            ->from('_schema.tables')
            ->select('table_name')
            ->execute();
        
        $diagnostic['auth_tests']['rest_api']['connection_time'] = round(microtime(true) - $startTime, 2) . 's';
        
        if ($response->getError()) {
            $diagnostic['auth_tests']['rest_api']['api_successful'] = false;
            $diagnostic['auth_tests']['rest_api']['error_message'] = $response->getError()->getMessage();
            $diagnostic['auth_tests']['rest_api']['conclusion'] = 'Erro ao acessar API REST do Supabase';
        } else {
            $diagnostic['auth_tests']['rest_api']['api_successful'] = true;
            $data = $response->getData();
            $diagnostic['auth_tests']['rest_api']['tables_count'] = count((array)$data);
            $diagnostic['auth_tests']['rest_api']['conclusion'] = 'Conexão via API REST bem-sucedida';
        }
    } catch (Exception $e) {
        $diagnostic['auth_tests']['rest_api']['api_successful'] = false;
        $diagnostic['auth_tests']['rest_api']['connection_time'] = round(microtime(true) - $startTime, 2) . 's';
        $diagnostic['auth_tests']['rest_api']['error_message'] = $e->getMessage();
        $diagnostic['auth_tests']['rest_api']['conclusion'] = 'Erro ao usar API REST do Supabase';
    }
} catch (Exception $e) {
    $diagnostic['auth_tests']['rest_api']['test_error'] = $e->getMessage();
}

// Recomendação baseada nos testes
if (isset($diagnostic['auth_tests']['direct_db']['connection_successful']) && 
    $diagnostic['auth_tests']['direct_db']['connection_successful']) {
    $diagnostic['recommendation'] = 'Ambos os métodos de autenticação são viáveis, mas recomenda-se usar a API REST para maior segurança e confiabilidade.';
} else if (isset($diagnostic['auth_tests']['rest_api']['api_successful']) && 
    $diagnostic['auth_tests']['rest_api']['api_successful']) {
    $diagnostic['recommendation'] = 'Use a autenticação via API REST (auth-rest.php), pois a conexão direta ao banco de dados está falhando.';
} else {
    $diagnostic['recommendation'] = 'Ambos os métodos estão falhando. Verifique suas credenciais do Supabase e configuração de rede.';
}

// Incluir tempo total de diagnóstico
$diagnostic['execution_time'] = round(microtime(true) - $_SERVER['REQUEST_TIME_FLOAT'], 2) . 's';

// Enviar resposta
sendResponse(200, [
    'status' => 'success',
    'message' => 'Diagnóstico de autenticação concluído',
    'diagnostic' => $diagnostic
]);