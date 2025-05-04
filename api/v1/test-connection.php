<?php
/**
 * Endpoint para testar a conexão com o Supabase
 */

require_once __DIR__ . '/../middleware/cors.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../models/Database.php';

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

// Comentando a importação do adaptador, já que não está disponível sem o Composer
// require_once __DIR__ . '/../models/SupabaseAdapter.php';

try {
    // Tentar obter configuração do Supabase
    $supabaseConfig = Database::getSupabaseClient();
    
    // Verificar se todas as variáveis estão configuradas corretamente
    if (empty($supabaseConfig['url'])) {
        throw new Exception('SUPABASE_URL não está configurada');
    }
    
    if (empty($supabaseConfig['key'])) {
        throw new Exception('SUPABASE_ANON_KEY não está configurada');
    }
    
    if (empty($supabaseConfig['service_role_key'])) {
        throw new Exception('SUPABASE_SERVICE_ROLE_KEY não está configurada');
    }
    
    if (empty($supabaseConfig['jwt_secret'])) {
        throw new Exception('SUPABASE_JWT_SECRET não está configurada');
    }
    
    // SDK e adaptador não estão disponíveis sem o Composer
    $sdkAvailable = false;
    $adapterAvailable = false;
    
    // Mascarar valores sensíveis para exibição segura
    $maskedServiceRoleKey = substr($supabaseConfig['service_role_key'], 0, 15) . '...' . substr($supabaseConfig['service_role_key'], -10);
    $maskedJwtSecret = substr($supabaseConfig['jwt_secret'], 0, 15) . '...' . substr($supabaseConfig['jwt_secret'], -10);
    
    // Verificar conexão com o banco de dados
    $dbConnected = false;
    $dbInfo = [];
    
    // Pular tentativa de conexão direta ao banco de dados
    // Conexão direta ao banco do Supabase normalmente não é possível de locais externos
    // a menos que haja configuração específica de rede
    $dbConnected = false;
    $dbInfo = [
        'note' => 'Acesso direto ao banco de dados do Supabase não está disponível. ' .
                  'Use a API REST do Supabase ou seu adaptador em vez de conexão direta.'
    ];
    
    // Enviar resposta com todas as informações
    sendResponse(200, [
        'status' => 'success',
        'message' => 'Configuração do Supabase está completa',
        'config' => [
            'url' => $supabaseConfig['url'],
            'project_id' => $supabaseConfig['project_id'],
            'host' => parse_url($supabaseConfig['url'], PHP_URL_HOST),
            'service_role_key' => $maskedServiceRoleKey,
            'jwt_secret' => $maskedJwtSecret
        ],
        'connection' => [
            'db_connected' => $dbConnected,
            'db_info' => $dbInfo
        ],
        'sdk' => [
            'supabase_sdk_available' => $sdkAvailable,
            'supabase_adapter_available' => $adapterAvailable,
            'connection_methods' => [
                'pdo' => 'Conecta diretamente ao banco usando PDO',
                'sdk' => 'Usa a biblioteca oficial do Supabase para PHP',
                'adapter' => 'Usa um adaptador customizado que imita o SDK'
            ],
            'recommended' => 'Integração via API REST'
        ],
        'environment' => [
            'php_version' => PHP_VERSION,
            'extensions' => [
                'pdo' => extension_loaded('pdo'),
                'pdo_pgsql' => extension_loaded('pdo_pgsql'),
                'curl' => extension_loaded('curl'),
                'json' => extension_loaded('json')
            ]
        ]
    ]);
    
} catch (Exception $e) {
    // Registrar erro em log
    error_log('Erro ao testar conexão com Supabase: ' . $e->getMessage());
    
    // Enviar resposta de erro
    sendResponse(500, [
        'status' => 'error',
        'message' => 'Erro ao conectar com Supabase',
        'error' => $e->getMessage()
    ]);
}