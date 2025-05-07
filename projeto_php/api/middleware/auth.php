<?php
/**
 * Middleware de autenticação
 * 
 * Responsável por verificar a autenticação das requisições
 */

require_once __DIR__ . '/../utils/jwt.php';
require_once __DIR__ . '/../utils/response.php';

/**
 * Verifica se a requisição está autenticada via header Authorization Bearer
 * 
 * @param bool $required Define se a autenticação é obrigatória
 * @return array|bool Dados do usuário autenticado ou false
 */
function authenticateJwt($required = true) {
    // Obter o token do cabeçalho Authorization
    $headers = getallheaders();
    $authorization = isset($headers['Authorization']) ? $headers['Authorization'] : '';
    
    // Verificar o formato do cabeçalho
    if (empty($authorization) || !preg_match('/Bearer\s+(.*)$/i', $authorization, $matches)) {
        if ($required) {
            sendResponse(401, errorResponse(401, 'Não autorizado. Token JWT ausente ou inválido.', 'AUTH_REQUIRED'));
            exit;
        }
        return false;
    }
    
    $token = $matches[1];
    $config = require __DIR__ . '/../config/supabase.php';
    
    // Verificar token JWT usando o segredo do Supabase
    $payload = verifyJwt($token, $config['jwt_secret']);
    
    if (!$payload) {
        if ($required) {
            sendResponse(401, errorResponse(401, 'Token inválido ou expirado.', 'INVALID_TOKEN'));
            exit;
        }
        return false;
    }
    
    // O token é válido, retornar dados do usuário
    return [
        'user_id' => $payload->sub,
        'email' => $payload->email ?? null,
        'role' => $payload->role ?? 'authenticated',
        'exp' => $payload->exp,
    ];
}

/**
 * Verifica se a requisição está autenticada via API Key
 * 
 * @param string|array $requiredScope Escopo(s) necessário(s) para acessar o recurso
 * @return array|bool Dados da API key autenticada ou false
 */
function authenticateApiKey($requiredScope = null) {
    // Obter a chave de API do cabeçalho
    $headers = getallheaders();
    $apiKey = isset($headers['X-API-Key']) ? $headers['X-API-Key'] : '';
    
    if (empty($apiKey)) {
        sendResponse(401, errorResponse(401, 'API Key ausente.', 'API_KEY_MISSING'));
        exit;
    }
    
    // Conectar ao PostgreSQL
    $config = require __DIR__ . '/../config/supabase.php';
    $dbConfig = require __DIR__ . '/../config/database.php';
    
    try {
        // DEBUG: Registrar informações de conexão
        $connectionInfo = [
            'host' => $dbConfig['host'],
            'port' => $dbConfig['port'],
            'database' => $dbConfig['database'],
            'username' => $dbConfig['username'],
            'password_length' => strlen($dbConfig['password']),
            'password_start' => substr($dbConfig['password'], 0, 5) . '...',
        ];
        error_log('DEBUG - Tentando conectar ao PostgreSQL: ' . json_encode($connectionInfo));
        
        // DEBUG: Verificar variáveis de ambiente
        error_log('DEBUG - Variáveis de ambiente: SUPABASE_SERVICE_ROLE_KEY=' . 
            (getenv('SUPABASE_SERVICE_ROLE_KEY') ? 'definida' : 'não definida') . 
            ', SUPABASE_JWT_SECRET=' . 
            (getenv('SUPABASE_JWT_SECRET') ? 'definida' : 'não definida'));
        
        // DEBUG: Verificar configuração do Supabase
        error_log('DEBUG - Configuração do Supabase: service_role_key=' . 
            (!empty($config['service_role_key']) ? 'definida' : 'não definida') . 
            ', jwt_secret=' . 
            (!empty($config['jwt_secret']) ? 'definida' : 'não definida'));
        
        $dsn = sprintf(
            'pgsql:host=%s;port=%s;dbname=%s;user=%s;password=%s', 
            $dbConfig['host'], 
            $dbConfig['port'], 
            $dbConfig['database'], 
            $dbConfig['username'], 
            $dbConfig['password']
        );
        
        // DEBUG: Registrar DSN (sem a senha)
        $safeDsn = sprintf(
            'pgsql:host=%s;port=%s;dbname=%s;user=%s', 
            $dbConfig['host'], 
            $dbConfig['port'], 
            $dbConfig['database'], 
            $dbConfig['username']
        );
        error_log('DEBUG - String de conexão DSN: ' . $safeDsn);
        $pdo = new PDO($dsn);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        // Consultar informações da chave API
        $stmt = $pdo->prepare('
            SELECT ak.*, u.email
            FROM api_keys ak
            JOIN auth.users u ON ak.user_id = u.id
            WHERE ak.key_value = :key_value
              AND ak.is_active = true
              AND (ak.expires_at IS NULL OR ak.expires_at > NOW())
        ');
        $stmt->execute(['key_value' => $apiKey]);
        $apiKeyData = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$apiKeyData) {
            sendResponse(401, errorResponse(401, 'API Key inválida ou expirada.', 'INVALID_API_KEY'));
            exit;
        }
        
        // Verificar se a chave tem o escopo necessário
        if ($requiredScope) {
            $scopes = is_array($requiredScope) ? $requiredScope : [$requiredScope];
            
            $placeholders = implode(',', array_fill(0, count($scopes), '?'));
            $stmt = $pdo->prepare("
                SELECT COUNT(*) as scope_count
                FROM api_key_scopes aks
                JOIN api_scopes s ON aks.scope_id = s.id
                WHERE aks.api_key_id = ?
                  AND s.name IN ($placeholders)
            ");
            
            $params = array_merge([$apiKeyData['id']], $scopes);
            $stmt->execute($params);
            $scopeCount = $stmt->fetchColumn();
            
            if ($scopeCount < count($scopes)) {
                sendResponse(403, errorResponse(403, 'Escopo insuficiente para acessar este recurso.', 'INSUFFICIENT_SCOPE', [
                    'required_scope' => $requiredScope
                ]));
                exit;
            }
        }
        
        // Verificar limites de taxa
        $stmt = $pdo->prepare('SELECT * FROM check_api_rate_limit(:api_key_id)');
        $stmt->execute(['api_key_id' => $apiKeyData['id']]);
        $withinRateLimit = $stmt->fetchColumn();
        
        if (!$withinRateLimit) {
            sendResponse(429, errorResponse(429, 'Limite de requisições excedido. Tente novamente mais tarde.', 'RATE_LIMIT_EXCEEDED'));
            exit;
        }
        
        // Registrar o uso da API
        $stmt = $pdo->prepare('
            INSERT INTO api_usage_logs 
            (api_key_id, endpoint, method, status_code, response_time_ms, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            $apiKeyData['id'],
            $_SERVER['REQUEST_URI'],
            $_SERVER['REQUEST_METHOD'],
            200, // Código inicial, pode ser atualizado posteriormente
            0, // Tempo inicial, será atualizado após a conclusão da requisição
            $_SERVER['REMOTE_ADDR'] ?? null,
            $_SERVER['HTTP_USER_AGENT'] ?? null,
        ]);
        $logId = $pdo->lastInsertId();
        
        // Atualizar timestamp de último uso
        $stmt = $pdo->prepare('UPDATE api_keys SET last_used_at = NOW() WHERE id = ?');
        $stmt->execute([$apiKeyData['id']]);
        
        // Retornar informações da chave API
        return [
            'api_key_id' => $apiKeyData['id'],
            'user_id' => $apiKeyData['user_id'],
            'email' => $apiKeyData['email'],
            'name' => $apiKeyData['name'],
            'permissions' => json_decode($apiKeyData['permissions']),
            'rate_limit' => $apiKeyData['rate_limit'],
            'log_id' => $logId,
        ];
    } catch (PDOException $e) {
        // Registrar erro em log com informações detalhadas para debug
        error_log('DEBUG - Erro ao autenticar API Key: ' . $e->getMessage());
        error_log('DEBUG - Código de erro PDO: ' . $e->getCode());
        error_log('DEBUG - Pilha de chamadas: ' . $e->getTraceAsString());
        
        // Verificar tipo específico de erro
        $errorCode = $e->getCode();
        if ($errorCode == '08006') {
            error_log('DEBUG - Erro de timeout na conexão. Verifique se o host é acessível e se as credenciais estão corretas.');
            sendResponse(500, errorResponse(500, 'Timeout na conexão com o banco de dados. Tente novamente mais tarde.', 'DB_TIMEOUT'));
        } else if ($errorCode == '28P01') {
            error_log('DEBUG - Erro de autenticação no banco. A senha (SUPABASE_SERVICE_ROLE_KEY) pode estar incorreta.');
            sendResponse(500, errorResponse(500, 'Erro de autenticação no banco de dados.', 'DB_AUTH_ERROR'));
        } else if (strpos($e->getMessage(), 'password') !== false) {
            error_log('DEBUG - Problema com a senha do banco de dados.');
            sendResponse(500, errorResponse(500, 'Erro de autenticação no banco de dados.', 'DB_PASSWORD_ERROR'));
        } else {
            // Resposta genérica para outros erros
            sendResponse(500, errorResponse(500, 'Erro interno de autenticação.', 'AUTH_ERROR'));
        }
        exit;
    }
}

/**
 * Função principal de autenticação
 * Tenta autenticar usando JWT ou API Key
 * 
 * @return array Dados do usuário autenticado
 */
function authenticate() {
    // Verificar cabeçalhos para determinar o método de autenticação
    $headers = getallheaders();
    
    // Tentar autenticar via API Key através do cabeçalho X-API-Key
    if (isset($headers['X-API-Key'])) {
        $apiAuthResult = authenticateApiKey();
        
        if ($apiAuthResult) {
            return [
                'authenticated' => true,
                'method' => 'api_key',
                'user_id' => $apiAuthResult['user_id'],
                'email' => $apiAuthResult['email'],
                'api_key_id' => $apiAuthResult['api_key_id'],
                'log_id' => $apiAuthResult['log_id']
            ];
        }
    }
    
    // Verificar se há um Bearer token
    $authorization = isset($headers['Authorization']) ? $headers['Authorization'] : '';
    
    if (!empty($authorization) && preg_match('/Bearer\s+(.*)$/i', $authorization, $matches)) {
        $token = $matches[1];
        
        // Verificar se é uma API Key (começa com 'api_')
        if (strpos($token, 'api_') === 0) {
            // É uma API Key no formato Bearer
            try {
                // Consultar a chave API diretamente no banco
                require_once __DIR__ . '/../models/Database.php';
                $db = new Database();
                
                $query = "
                    SELECT ak.*, u.email
                    FROM api_keys ak
                    JOIN auth.users u ON ak.user_id = u.id
                    WHERE ak.key_value = :key_value
                      AND ak.is_active = TRUE
                      AND (ak.expires_at IS NULL OR ak.expires_at > NOW())
                ";
                
                $apiKeyData = $db->queryOne($query, ['key_value' => $token]);
                
                if ($apiKeyData) {
                    // Atualizar o último uso
                    $db->execute(
                        "UPDATE api_keys SET last_used_at = NOW() WHERE id = :id",
                        ['id' => $apiKeyData['id']]
                    );
                    
                    return [
                        'authenticated' => true,
                        'method' => 'api_key_bearer',
                        'user_id' => $apiKeyData['user_id'],
                        'email' => $apiKeyData['email'],
                        'api_key_id' => $apiKeyData['id']
                    ];
                }
            } catch (Exception $e) {
                error_log('Erro ao verificar API Key via Bearer: ' . $e->getMessage());
            }
        }
        
        // Se não for uma API Key ou falhar, tentar como JWT
        $jwtAuthResult = authenticateJwt(false);
        if ($jwtAuthResult) {
            return [
                'authenticated' => true,
                'method' => 'jwt',
                'user_id' => $jwtAuthResult['user_id'],
                'email' => $jwtAuthResult['email'],
                'role' => $jwtAuthResult['role'],
                'exp' => $jwtAuthResult['exp']
            ];
        }
    }
    
    // Verificar API key no parâmetro de consulta
    if (isset($_GET['api_key'])) {
        try {
            // Consultar a chave API diretamente no banco
            require_once __DIR__ . '/../models/Database.php';
            $db = new Database();
            
            $query = "
                SELECT ak.*, u.email
                FROM api_keys ak
                JOIN auth.users u ON ak.user_id = u.id
                WHERE ak.key_value = :key_value
                  AND ak.is_active = TRUE
                  AND (ak.expires_at IS NULL OR ak.expires_at > NOW())
            ";
            
            $apiKeyData = $db->queryOne($query, ['key_value' => $_GET['api_key']]);
            
            if ($apiKeyData) {
                // Atualizar o último uso
                $db->execute(
                    "UPDATE api_keys SET last_used_at = NOW() WHERE id = :id",
                    ['id' => $apiKeyData['id']]
                );
                
                return [
                    'authenticated' => true,
                    'method' => 'api_key_query',
                    'user_id' => $apiKeyData['user_id'],
                    'email' => $apiKeyData['email'],
                    'api_key_id' => $apiKeyData['id']
                ];
            }
        } catch (Exception $e) {
            error_log('Erro ao verificar API Key via query: ' . $e->getMessage());
        }
    }
    
    // Tentar autenticar via JWT como último recurso
    $jwtAuthResult = authenticateJwt(false);
    if ($jwtAuthResult) {
        return [
            'authenticated' => true,
            'method' => 'jwt',
            'user_id' => $jwtAuthResult['user_id'],
            'email' => $jwtAuthResult['email'],
            'role' => $jwtAuthResult['role'],
            'exp' => $jwtAuthResult['exp']
        ];
    }
    
    // Nenhum método de autenticação válido
    return [
        'authenticated' => false,
        'error' => 'Autenticação necessária'
    ];
}