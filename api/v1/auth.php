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
if ($method === 'POST') {
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
        'Método não permitido. Use POST.',
        'METHOD_NOT_ALLOWED'
    ));
}