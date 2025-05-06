<?php
/**
 * API Keys Endpoints
 * 
 * Gerencia as chaves de API para acesso autenticado
 */

require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../models/Database.php';

// Verificar autenticação e obter usuário
$auth = authenticate();
if (!$auth['authenticated']) {
    sendErrorResponse($auth['error'], 401);
    exit;
}

$userId = $auth['user_id'];
$db = new Database();

// Rotas para os endpoints de Chaves API
$method = $_SERVER['REQUEST_METHOD'];
$endpoint = isset($_GET['endpoint']) ? $_GET['endpoint'] : '';

if ($method === 'GET' && empty($endpoint)) {
    // Listar todas as chaves API do usuário
    handleGetApiKeys($userId, $db);
} elseif ($method === 'POST' && empty($endpoint)) {
    // Criar uma nova chave API
    handleCreateApiKey($userId, $db);
} elseif ($method === 'PUT' && $endpoint === 'revoke') {
    // Revogar uma chave API
    handleRevokeApiKey($userId, $db);
} elseif ($method === 'PUT') {
    // Atualizar uma chave API
    handleUpdateApiKey($userId, $db);
} elseif ($method === 'DELETE') {
    // Excluir uma chave API
    handleDeleteApiKey($userId, $db);
} else {
    sendErrorResponse('Método não permitido', 405);
}

/**
 * Lista todas as chaves API do usuário
 */
function handleGetApiKeys($userId, $db) {
    try {
        $query = "
            SELECT 
                id, user_id, name, key_value, permissions, rate_limit, 
                is_active, created_at, updated_at, expires_at, last_used_at
            FROM api_keys 
            WHERE user_id = :user_id
            ORDER BY created_at DESC
        ";
        
        $apiKeys = $db->query($query, ['user_id' => $userId]);
        
        // Garantir que as permissões são sempre um array
        foreach ($apiKeys as &$key) {
            if (isset($key['permissions'])) {
                $key['permissions'] = json_decode($key['permissions'], true) ?: [];
            } else {
                $key['permissions'] = [];
            }
            
            // Não retornar o hash do segredo
            unset($key['secret_hash']);
        }
        
        sendSuccessResponse(['api_keys' => $apiKeys]);
    } catch (Exception $e) {
        sendErrorResponse('Erro ao buscar chaves API: ' . $e->getMessage(), 500);
    }
}

/**
 * Cria uma nova chave API
 */
function handleCreateApiKey($userId, $db) {
    // Obter e validar dados
    $requestData = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($requestData['name']) || empty(trim($requestData['name']))) {
        sendErrorResponse('O nome da chave API é obrigatório', 400);
        return;
    }
    
    try {
        // Gerar chave e segredo
        $keyValue = 'api_' . bin2hex(random_bytes(16));
        $secret = 'secret_' . bin2hex(random_bytes(32));
        
        // Hash do segredo (em produção, usar algo mais seguro como password_hash)
        $secretHash = hash('sha256', $secret);
        
        // Preparar permissões como JSON
        $permissions = isset($requestData['permissions']) ? $requestData['permissions'] : [];
        $permissionsJson = json_encode($permissions);
        
        // Configurar expiração se fornecida
        $expiresAt = isset($requestData['expires_at']) ? $requestData['expires_at'] : null;
        
        // Configurar limite de taxa se fornecido
        $rateLimit = isset($requestData['rate_limit']) ? intval($requestData['rate_limit']) : 100;
        
        // Inserir no banco de dados
        $query = "
            INSERT INTO api_keys (
                user_id, name, key_value, secret_hash, permissions, 
                rate_limit, is_active, expires_at, created_at, updated_at
            )
            VALUES (
                :user_id, :name, :key_value, :secret_hash, :permissions,
                :rate_limit, TRUE, :expires_at, NOW(), NOW()
            )
            RETURNING 
                id, user_id, name, key_value, permissions, rate_limit, 
                is_active, created_at, updated_at, expires_at
        ";
        
        $params = [
            'user_id' => $userId,
            'name' => $requestData['name'],
            'key_value' => $keyValue,
            'secret_hash' => $secretHash,
            'permissions' => $permissionsJson,
            'rate_limit' => $rateLimit,
            'expires_at' => $expiresAt
        ];
        
        $result = $db->query($query, $params);
        
        if (!$result || count($result) === 0) {
            throw new Exception('Falha ao criar chave API');
        }
        
        $apiKey = $result[0];
        
        // Garantir que as permissões são um array
        if (isset($apiKey['permissions'])) {
            $apiKey['permissions'] = json_decode($apiKey['permissions'], true) ?: [];
        } else {
            $apiKey['permissions'] = [];
        }
        
        // Montar resposta com a chave e segredo (o segredo nunca mais será mostrado)
        $response = [
            'api_key' => $apiKey,
            'secret' => $secret,
            'warning' => 'O segredo (secret) não será exibido novamente. Salve-o em um local seguro.'
        ];
        
        sendSuccessResponse($response, 201);
    } catch (Exception $e) {
        sendErrorResponse('Erro ao criar chave API: ' . $e->getMessage(), 500);
    }
}

/**
 * Atualiza uma chave API existente
 */
function handleUpdateApiKey($userId, $db) {
    // Obter ID da chave da URL
    $id = isset($_GET['id']) ? $_GET['id'] : null;
    
    if (!$id) {
        sendErrorResponse('ID da chave API é obrigatório', 400);
        return;
    }
    
    // Verificar se a chave pertence ao usuário
    $apiKey = getApiKeyById($id, $userId, $db);
    if (!$apiKey) {
        sendErrorResponse('Chave API não encontrada', 404);
        return;
    }
    
    // Obter dados da atualização
    $requestData = json_decode(file_get_contents('php://input'), true);
    if (!$requestData) {
        sendErrorResponse('Dados de atualização inválidos', 400);
        return;
    }
    
    try {
        // Construir conjunto de campos a atualizar
        $updateFields = [];
        $params = ['id' => $id, 'user_id' => $userId];
        
        if (isset($requestData['name'])) {
            $updateFields[] = "name = :name";
            $params['name'] = $requestData['name'];
        }
        
        if (isset($requestData['permissions'])) {
            $updateFields[] = "permissions = :permissions";
            $params['permissions'] = json_encode($requestData['permissions']);
        }
        
        if (isset($requestData['rate_limit'])) {
            $updateFields[] = "rate_limit = :rate_limit";
            $params['rate_limit'] = intval($requestData['rate_limit']);
        }
        
        if (isset($requestData['expires_at'])) {
            $updateFields[] = "expires_at = :expires_at";
            $params['expires_at'] = $requestData['expires_at'];
        }
        
        if (isset($requestData['is_active'])) {
            $updateFields[] = "is_active = :is_active";
            $params['is_active'] = $requestData['is_active'] ? true : false;
        }
        
        // Se não há campos para atualizar
        if (empty($updateFields)) {
            sendErrorResponse('Nenhum dado para atualizar', 400);
            return;
        }
        
        // Adicionar atualização de updated_at
        $updateFields[] = "updated_at = NOW()";
        
        // Construir e executar a query
        $updateFieldsStr = implode(', ', $updateFields);
        $query = "
            UPDATE api_keys
            SET $updateFieldsStr
            WHERE id = :id AND user_id = :user_id
            RETURNING 
                id, user_id, name, key_value, permissions, rate_limit, 
                is_active, created_at, updated_at, expires_at, last_used_at
        ";
        
        $result = $db->query($query, $params);
        
        if (!$result || count($result) === 0) {
            throw new Exception('Falha ao atualizar chave API');
        }
        
        $updatedApiKey = $result[0];
        
        // Garantir que as permissões são um array
        if (isset($updatedApiKey['permissions'])) {
            $updatedApiKey['permissions'] = json_decode($updatedApiKey['permissions'], true) ?: [];
        } else {
            $updatedApiKey['permissions'] = [];
        }
        
        sendSuccessResponse(['api_key' => $updatedApiKey]);
    } catch (Exception $e) {
        sendErrorResponse('Erro ao atualizar chave API: ' . $e->getMessage(), 500);
    }
}

/**
 * Revoga (desativa) uma chave API
 */
function handleRevokeApiKey($userId, $db) {
    // Obter ID da chave da URL
    $id = isset($_GET['id']) ? $_GET['id'] : null;
    
    if (!$id) {
        sendErrorResponse('ID da chave API é obrigatório', 400);
        return;
    }
    
    // Verificar se a chave pertence ao usuário
    $apiKey = getApiKeyById($id, $userId, $db);
    if (!$apiKey) {
        sendErrorResponse('Chave API não encontrada', 404);
        return;
    }
    
    try {
        // Desativar a chave
        $query = "
            UPDATE api_keys
            SET is_active = FALSE, updated_at = NOW()
            WHERE id = :id AND user_id = :user_id
        ";
        
        $result = $db->execute($query, ['id' => $id, 'user_id' => $userId]);
        
        if (!$result) {
            throw new Exception('Falha ao revogar chave API');
        }
        
        sendSuccessResponse(['message' => 'API key revogada com sucesso']);
    } catch (Exception $e) {
        sendErrorResponse('Erro ao revogar chave API: ' . $e->getMessage(), 500);
    }
}

/**
 * Exclui permanentemente uma chave API
 */
function handleDeleteApiKey($userId, $db) {
    // Obter ID da chave da URL
    $id = isset($_GET['id']) ? $_GET['id'] : null;
    
    if (!$id) {
        sendErrorResponse('ID da chave API é obrigatório', 400);
        return;
    }
    
    // Verificar se a chave pertence ao usuário
    $apiKey = getApiKeyById($id, $userId, $db);
    if (!$apiKey) {
        sendErrorResponse('Chave API não encontrada', 404);
        return;
    }
    
    try {
        // Excluir a chave
        $query = "
            DELETE FROM api_keys
            WHERE id = :id AND user_id = :user_id
        ";
        
        $result = $db->execute($query, ['id' => $id, 'user_id' => $userId]);
        
        if (!$result) {
            throw new Exception('Falha ao excluir chave API');
        }
        
        sendSuccessResponse(['message' => 'API key excluída com sucesso']);
    } catch (Exception $e) {
        sendErrorResponse('Erro ao excluir chave API: ' . $e->getMessage(), 500);
    }
}

/**
 * Obtém uma chave API pelo ID e usuário
 */
function getApiKeyById($id, $userId, $db) {
    try {
        $query = "
            SELECT 
                id, user_id, name, key_value, permissions, rate_limit, 
                is_active, created_at, updated_at, expires_at, last_used_at
            FROM api_keys 
            WHERE id = :id AND user_id = :user_id
        ";
        
        $result = $db->query($query, ['id' => $id, 'user_id' => $userId]);
        
        if (!$result || count($result) === 0) {
            return null;
        }
        
        return $result[0];
    } catch (Exception $e) {
        return null;
    }
}