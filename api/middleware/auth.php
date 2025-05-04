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
        $dsn = sprintf(
            'pgsql:host=%s;port=%s;dbname=%s;user=%s;password=%s', 
            $dbConfig['host'], 
            $dbConfig['port'], 
            $dbConfig['database'], 
            $dbConfig['username'], 
            $dbConfig['password']
        );
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
        // Registrar erro em log, mas não expor detalhes sensíveis
        error_log('Erro ao autenticar API Key: ' . $e->getMessage());
        sendResponse(500, errorResponse(500, 'Erro interno de autenticação.', 'AUTH_ERROR'));
        exit;
    }
}