<?php
/**
 * Endpoint de debug para autenticação
 * 
 * Este endpoint mostra informações detalhadas sobre a requisição de autenticação
 * e os dados disponíveis, sem expor informações sensíveis.
 */

require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../models/Database.php';
require_once __DIR__ . '/../models/SupabaseClient.php';

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
    // Coletar informações de depuração
    $debug = [];
    
    // Cabeçalhos da requisição (removendo valores sensíveis)
    $headers = getallheaders();
    $safeHeaders = [];
    
    foreach ($headers as $key => $value) {
        if (strtolower($key) === 'authorization') {
            $safeHeaders[$key] = 'Bearer [REDACTED]';
        } else if (strtolower($key) === 'x-api-key') {
            $safeHeaders[$key] = substr($value, 0, 8) . '...[REDACTED]';
        } else {
            $safeHeaders[$key] = $value;
        }
    }
    
    $debug['headers'] = $safeHeaders;
    
    // Verifica a configuração do Supabase
    $supabaseConfig = require __DIR__ . '/../config/supabase.php';
    $debug['supabase_config'] = [
        'url_exists' => !empty($supabaseConfig['url']),
        'key_exists' => !empty($supabaseConfig['key']),
        'service_role_key_exists' => !empty($supabaseConfig['service_role_key']),
        'jwt_secret_exists' => !empty($supabaseConfig['jwt_secret']),
    ];
    
    // Verificar se a API Key foi fornecida
    $apiKey = isset($headers['X-API-Key']) ? $headers['X-API-Key'] : null;
    $debug['api_key_provided'] = !empty($apiKey);
    
    if ($debug['api_key_provided']) {
        // Tentar verificar a existência da API Key no Supabase sem expor detalhes sensíveis
        $supabase = SupabaseClient::getInstance('service_role');
        
        try {
            // Consultar API keys no Supabase
            $response = $supabase
                ->from('api_keys')
                ->select('id, created_at')
                ->filter('key_value', 'eq', $apiKey)
                ->execute();
            
            if ($response->getError()) {
                $debug['api_key_check_error'] = $response->getError()->getMessage();
            } else {
                $keys = $response->getData();
                $debug['api_key_exists'] = !empty($keys) && count((array)$keys) > 0;
                if ($debug['api_key_exists']) {
                    $keyData = is_array($keys) ? $keys[0] : $keys;
                    $debug['api_key_info'] = [
                        'id_exists' => !empty($keyData->id),
                        'created_at' => $keyData->created_at ?? 'N/A'
                    ];
                } else {
                    $debug['api_key_info'] = 'API Key não encontrada no banco de dados';
                }
            }
        } catch (Exception $e) {
            $debug['api_key_check_error'] = $e->getMessage();
        }
    }
    
    // Verificar JWT se fornecido
    $authorization = isset($headers['Authorization']) ? $headers['Authorization'] : '';
    $debug['jwt_provided'] = !empty($authorization) && preg_match('/Bearer\s+(.*)$/i', $authorization);
    
    if ($debug['jwt_provided']) {
        preg_match('/Bearer\s+(.*)$/i', $authorization, $matches);
        $token = $matches[1];
        
        try {
            require_once __DIR__ . '/../utils/jwt.php';
            $payload = verifyJwt($token, $supabaseConfig['jwt_secret']);
            
            if ($payload) {
                $debug['jwt_valid'] = true;
                $debug['jwt_info'] = [
                    'subject_exists' => !empty($payload->sub),
                    'expiry_timestamp' => $payload->exp ?? 'N/A',
                    'expired' => !empty($payload->exp) && $payload->exp < time(),
                ];
            } else {
                $debug['jwt_valid'] = false;
            }
        } catch (Exception $e) {
            $debug['jwt_check_error'] = $e->getMessage();
        }
    }
    
    // Verificar conexão ao Supabase
    try {
        // Testar conexão via API REST consultando tabela existente (companies)
        $testResponse = $supabase
            ->from('companies')
            ->select('id')
            ->limit(1)
            ->execute();
        
        $debug['supabase_connection'] = !$testResponse->getError();
        if (!$debug['supabase_connection']) {
            $debug['supabase_connection_error'] = $testResponse->getError()->getMessage();
        }
    } catch (Exception $e) {
        $debug['supabase_connection'] = false;
        $debug['supabase_connection_error'] = $e->getMessage();
    }
    
    // Testar ambos os métodos de autenticação
    try {
        require_once __DIR__ . '/../middleware/auth.php';
        $authOriginalResult = authenticate();
        $debug['auth_original'] = [
            'authenticated' => $authOriginalResult['authenticated'],
            'method' => $authOriginalResult['authenticated'] ? $authOriginalResult['method'] : null,
            'error' => !$authOriginalResult['authenticated'] ? $authOriginalResult['error'] : null
        ];
    } catch (Exception $e) {
        $debug['auth_original_error'] = $e->getMessage();
    }
    
    try {
        require_once __DIR__ . '/../middleware/auth-rest.php';
        $authRestResult = authenticate();
        $debug['auth_rest'] = [
            'authenticated' => $authRestResult['authenticated'],
            'method' => $authRestResult['authenticated'] ? $authRestResult['method'] : null,
            'error' => !$authRestResult['authenticated'] ? $authRestResult['error'] : null
        ];
    } catch (Exception $e) {
        $debug['auth_rest_error'] = $e->getMessage();
    }
    
    // Testar configuração do servidor e permissões
    $debug['server_info'] = [
        'php_version' => PHP_VERSION,
        'extensions' => [
            'pdo' => extension_loaded('pdo'),
            'pdo_pgsql' => extension_loaded('pdo_pgsql'),
            'curl' => extension_loaded('curl'),
            'json' => extension_loaded('json')
        ],
        'directory_writable' => is_writable(__DIR__ . '/../logs')
    ];
    
    // Enviar resposta com as informações de depuração
    sendResponse(200, [
        'status' => 'success',
        'message' => 'Informações de depuração sobre autenticação',
        'debug' => $debug,
        '_debug' => [
            'memory_usage' => round(memory_get_usage() / 1024 / 1024, 2) . ' MB',
            'execution_time' => microtime(true) - $_SERVER['REQUEST_TIME_FLOAT']
        ]
    ]);
    
} catch (Exception $e) {
    // Registrar erro em log
    error_log('Erro no debug de autenticação: ' . $e->getMessage());
    
    // Enviar resposta de erro
    sendResponse(500, [
        'status' => 'error',
        'message' => 'Erro ao gerar informações de depuração',
        'error' => $e->getMessage(),
        '_debug' => [
            'memory_usage' => round(memory_get_usage() / 1024 / 1024, 2) . ' MB',
            'execution_time' => microtime(true) - $_SERVER['REQUEST_TIME_FLOAT']
        ]
    ]);
}