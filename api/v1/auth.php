<?php
/**
 * Endpoint de autenticação
 */

// Carregar dependências
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../utils/jwt.php';
require_once __DIR__ . '/../middleware/cors.php';
require_once __DIR__ . '/../middleware/rate_limit.php';
require_once __DIR__ . '/../models/Database.php';

// Tratar CORS
handleCors();

// Aplicar limite de taxa por IP
applyRateLimit();

// Obter o método da requisição
$method = $_SERVER['REQUEST_METHOD'];

// Processar com base no método
if ($method === 'GET') {
    // Verificar se é uma requisição para obter a API key do usuário
    // Essa funcionalidade requer autenticação via JWT
    $headers = getallheaders();
    $authorization = isset($headers['Authorization']) ? $headers['Authorization'] : '';
    
    if (empty($authorization) || !preg_match('/Bearer\s+(.*)$/i', $authorization, $matches)) {
        sendResponse(401, errorResponse(
            401,
            'Token JWT ausente ou inválido.',
            'AUTH_REQUIRED'
        ));
        exit;
    }
    
    $token = $matches[1];
    $config = require __DIR__ . '/../config/supabase.php';
    
    // Verificar token JWT
    try {
        $payload = verifyJwt($token, $config['jwt_secret']);
        
        if (!$payload) {
            sendResponse(401, errorResponse(
                401,
                'Token inválido ou expirado.',
                'INVALID_TOKEN'
            ));
            exit;
        }
        
        $userId = $payload->sub;
        
        // Buscar ou criar uma API key para este usuário
        try {
            // Verificar se o usuário já tem uma API key
            $apiKey = Database::queryOne(
                'SELECT * FROM api_keys WHERE user_id = ? AND is_active = true ORDER BY created_at DESC LIMIT 1',
                [$userId]
            );
            
            // Se não existir, criar uma nova
            if (!$apiKey) {
                // Gerar uma nova API key
                $keyValue = 'key_' . bin2hex(random_bytes(16));
                
                // Inserir no banco
                $apiKeyId = Database::insert('api_keys', [
                    'user_id' => $userId,
                    'key_value' => $keyValue,
                    'name' => 'API Key gerada automaticamente',
                    'is_active' => true,
                    'created_at' => date('Y-m-d H:i:s'),
                ]);
                
                // Adicionar escopos padrão - ajuste conforme necessário
                $scopesQuery = "SELECT id FROM api_scopes WHERE name IN ('companies.read', 'companies.write')";
                $scopeIds = Database::query($scopesQuery);
                
                foreach ($scopeIds as $scope) {
                    Database::insert('api_key_scopes', [
                        'api_key_id' => $apiKeyId,
                        'scope_id' => $scope['id'],
                    ]);
                }
                
                // Retornar a nova API key
                sendResponse(200, [
                    'api_key' => $keyValue,
                    'message' => 'Nova API key gerada com sucesso'
                ]);
            } else {
                // Retornar a API key existente
                sendResponse(200, [
                    'api_key' => $apiKey['key_value'],
                    'message' => 'API key existente recuperada'
                ]);
            }
        } catch (Exception $e) {
            error_log('Erro ao obter API key: ' . $e->getMessage());
            sendResponse(500, errorResponse(
                500,
                'Erro ao obter API key.',
                'API_KEY_ERROR'
            ));
        }
    } catch (Exception $e) {
        error_log('Erro ao verificar token JWT: ' . $e->getMessage());
        sendResponse(401, errorResponse(
            401,
            'Token inválido ou expirado.',
            'INVALID_TOKEN'
        ));
        exit;
    }
} elseif ($method === 'POST') {
    // Obter o tipo de ação de autenticação
    $action = $_GET['action'] ?? '';
    
    // Obter os dados enviados no corpo da requisição
    $requestData = json_decode(file_get_contents('php://input'), true);
    
    switch ($action) {
        case 'token':
            // Validar parâmetros obrigatórios
            if (!isset($requestData['key']) || !isset($requestData['secret'])) {
                sendResponse(400, errorResponse(
                    400, 
                    'Parâmetros inválidos. key e secret são obrigatórios.',
                    'INVALID_PARAMETERS'
                ));
            }
            
            // Obter as credenciais
            $key = $requestData['key'];
            $secret = $requestData['secret'];
            
            try {
                // Verificar credenciais no banco
                $apiKey = Database::queryOne(
                    'SELECT * FROM api_keys WHERE key_value = ? AND is_active = true',
                    [$key]
                );
                
                // Verificar se a chave API existe
                if (!$apiKey) {
                    sendResponse(401, errorResponse(
                        401,
                        'Credenciais inválidas. Chave API não encontrada ou inativa.',
                        'INVALID_CREDENTIALS'
                    ));
                }
                
                // Verificar o secret (em um ambiente real, o secret seria armazenado como um hash)
                if ($apiKey['secret_hash'] !== $secret) {
                    sendResponse(401, errorResponse(
                        401,
                        'Credenciais inválidas. Secret incorreto.',
                        'INVALID_CREDENTIALS'
                    ));
                }
                
                // Verificar se a chave não está expirada
                if ($apiKey['expires_at'] !== null && strtotime($apiKey['expires_at']) < time()) {
                    sendResponse(401, errorResponse(
                        401,
                        'Chave API expirada.',
                        'EXPIRED_KEY'
                    ));
                }
                
                // Obter os escopos da chave
                $scopes = Database::query(
                    'SELECT s.name 
                     FROM api_key_scopes ks
                     JOIN api_scopes s ON ks.scope_id = s.id
                     WHERE ks.api_key_id = ?',
                    [$apiKey['id']]
                );
                
                $scopeNames = array_map(function($scope) {
                    return $scope['name'];
                }, $scopes);
                
                // Gerar token JWT
                $config = require __DIR__ . '/../config/config.php';
                $supabaseConfig = require __DIR__ . '/../config/supabase.php';
                
                $payload = [
                    'sub' => $apiKey['user_id'],
                    'iss' => 'smart-chatbox-api',
                    'aud' => 'api-client',
                    'api_key_id' => $apiKey['id'],
                    'name' => $apiKey['name'],
                    'scopes' => $scopeNames,
                ];
                
                $token = generateJwt(
                    $payload, 
                    $supabaseConfig['jwt_secret'], 
                    $config['token_expiration'] ?? 3600
                );
                
                // Registrar token gerado
                $tokenId = Database::insert('api_tokens', [
                    'token_hash' => $token, // Em um ambiente real, armazenaria um hash
                    'api_key_id' => $apiKey['id'],
                    'user_id' => $apiKey['user_id'],
                    'expires_at' => date('Y-m-d H:i:s', time() + ($config['token_expiration'] ?? 3600)),
                ]);
                
                // Atualizar último uso da API key
                Database::execute(
                    'UPDATE api_keys SET last_used_at = NOW() WHERE id = ?',
                    [$apiKey['id']]
                );
                
                // Enviar resposta com o token
                sendResponse(200, [
                    'token' => $token,
                    'expires_in' => $config['token_expiration'] ?? 3600,
                    'token_type' => 'Bearer',
                    'scopes' => $scopeNames,
                ]);
            } catch (Exception $e) {
                sendResponse(500, errorResponse(
                    500,
                    'Erro ao processar a autenticação.',
                    'AUTH_ERROR'
                ));
            }
            break;
            
        case 'revoke':
            // Validar parâmetros obrigatórios
            if (!isset($requestData['token'])) {
                sendResponse(400, errorResponse(
                    400, 
                    'Parâmetro token é obrigatório.',
                    'INVALID_PARAMETERS'
                ));
            }
            
            $token = $requestData['token'];
            
            try {
                // Verificar se o token existe
                $tokenData = Database::queryOne(
                    'SELECT * FROM api_tokens WHERE token_hash = ? AND is_revoked = false',
                    [$token]
                );
                
                if (!$tokenData) {
                    sendResponse(404, errorResponse(
                        404,
                        'Token não encontrado ou já revogado.',
                        'TOKEN_NOT_FOUND'
                    ));
                }
                
                // Revogar o token
                Database::execute(
                    'UPDATE api_tokens SET is_revoked = true, revoked_at = NOW() WHERE id = ?',
                    [$tokenData['id']]
                );
                
                sendResponse(200, [
                    'message' => 'Token revogado com sucesso.',
                    'revoked_at' => date('Y-m-d H:i:s'),
                ]);
            } catch (Exception $e) {
                sendResponse(500, errorResponse(
                    500,
                    'Erro ao revogar token.',
                    'REVOKE_ERROR'
                ));
            }
            break;
            
        default:
            sendResponse(400, errorResponse(
                400,
                'Ação desconhecida. Ações válidas: token, revoke',
                'INVALID_ACTION'
            ));
            break;
    }
} else {
    // Método não permitido
    sendResponse(405, errorResponse(
        405,
        'Método não permitido. Use GET ou POST.',
        'METHOD_NOT_ALLOWED'
    ));
}