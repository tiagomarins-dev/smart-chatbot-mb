<?php
/**
 * Endpoint de webhooks
 */

// Carregar dependências
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../middleware/cors.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../middleware/rate_limit.php';
require_once __DIR__ . '/../models/Database.php';

// Tratar CORS
handleCors();

// Obter o método da requisição
$method = $_SERVER['REQUEST_METHOD'];

// Autenticar requisição via API Key
$auth = authenticateApiKey(['webhooks:manage']);

// Aplicar limite de taxa com base na API Key
applyRateLimit('api_' . $auth['api_key_id'], $auth['rate_limit']);

// Obter ID do webhook da URL, se fornecido
$webhookId = isset($_GET['id']) ? $_GET['id'] : null;

// Processar com base no método
switch ($method) {
    case 'GET':
        try {
            // Se um ID específico foi fornecido
            if ($webhookId) {
                // Buscar webhook específico
                $webhook = Database::queryOne(
                    'SELECT * FROM webhooks 
                     WHERE id = ? AND user_id = ?',
                    [$webhookId, $auth['user_id']]
                );
                
                if (!$webhook) {
                    sendResponse(404, errorResponse(
                        404,
                        'Webhook não encontrado.',
                        'WEBHOOK_NOT_FOUND'
                    ));
                }
                
                sendResponse(200, [
                    'data' => $webhook
                ]);
            } 
            // Retornar todos os webhooks
            else {
                // Buscar webhooks
                $webhooks = Database::query(
                    'SELECT * FROM webhooks 
                     WHERE user_id = ?
                     ORDER BY created_at DESC',
                    [$auth['user_id']]
                );
                
                sendResponse(200, [
                    'data' => $webhooks,
                    'count' => count($webhooks)
                ]);
            }
        } catch (Exception $e) {
            sendResponse(500, errorResponse(
                500,
                'Erro ao buscar webhooks.',
                'DATABASE_ERROR'
            ));
        }
        break;
        
    case 'POST':
        // Obter os dados enviados no corpo da requisição
        $requestData = json_decode(file_get_contents('php://input'), true);
        
        // Validar campos obrigatórios
        if (!isset($requestData['name']) || !isset($requestData['url']) || !isset($requestData['events'])) {
            sendResponse(400, errorResponse(
                400,
                'Campos obrigatórios: name, url, events',
                'MISSING_FIELDS'
            ));
        }
        
        // Validar URL
        if (!filter_var($requestData['url'], FILTER_VALIDATE_URL)) {
            sendResponse(400, errorResponse(
                400,
                'URL inválida.',
                'INVALID_URL'
            ));
        }
        
        // Validar eventos
        $validEvents = ['message.sent', 'message.received', 'message.delivered', 'message.read', 'message.failed', 'status.changed'];
        $events = is_array($requestData['events']) ? $requestData['events'] : [$requestData['events']];
        
        foreach ($events as $event) {
            if (!in_array($event, $validEvents)) {
                sendResponse(400, errorResponse(
                    400,
                    'Evento inválido: ' . $event . '. Eventos válidos: ' . implode(', ', $validEvents),
                    'INVALID_EVENT'
                ));
            }
        }
        
        // Gerar token secreto para segurança (opcional)
        $secretToken = null;
        if (isset($requestData['generate_secret']) && $requestData['generate_secret']) {
            $secretToken = bin2hex(random_bytes(16));
        } else if (isset($requestData['secret_token'])) {
            $secretToken = $requestData['secret_token'];
        }
        
        // Preparar dados para inserção
        $webhookData = [
            'user_id' => $auth['user_id'],
            'name' => $requestData['name'],
            'url' => $requestData['url'],
            'events' => '{' . implode(',', $events) . '}',  // Formato de array no PostgreSQL
            'is_active' => $requestData['is_active'] ?? true,
            'secret_token' => $secretToken,
        ];
        
        try {
            // Inserir webhook no banco
            $webhookId = Database::insert('webhooks', $webhookData);
            
            // Buscar o webhook inserido
            $webhook = Database::queryOne(
                'SELECT * FROM webhooks WHERE id = ?',
                [$webhookId]
            );
            
            // Retornar webhook criado
            sendResponse(201, [
                'data' => $webhook,
                'message' => 'Webhook criado com sucesso.'
            ]);
        } catch (Exception $e) {
            sendResponse(500, errorResponse(
                500,
                'Erro ao criar webhook.',
                'DATABASE_ERROR'
            ));
        }
        break;
        
    case 'PUT':
        // Verificar se um ID foi fornecido
        if (!$webhookId) {
            sendResponse(400, errorResponse(
                400,
                'ID do webhook é obrigatório para atualização.',
                'MISSING_ID'
            ));
        }
        
        // Obter os dados enviados no corpo da requisição
        $requestData = json_decode(file_get_contents('php://input'), true);
        
        try {
            // Verificar se o webhook existe e pertence ao usuário
            $webhook = Database::queryOne(
                'SELECT * FROM webhooks WHERE id = ? AND user_id = ?',
                [$webhookId, $auth['user_id']]
            );
            
            if (!$webhook) {
                sendResponse(404, errorResponse(
                    404,
                    'Webhook não encontrado ou não pertence ao usuário.',
                    'WEBHOOK_NOT_FOUND'
                ));
            }
            
            // Preparar dados para atualização
            $updateData = [];
            
            // Atualizar nome se fornecido
            if (isset($requestData['name'])) {
                $updateData['name'] = $requestData['name'];
            }
            
            // Atualizar URL se fornecida
            if (isset($requestData['url'])) {
                if (!filter_var($requestData['url'], FILTER_VALIDATE_URL)) {
                    sendResponse(400, errorResponse(
                        400,
                        'URL inválida.',
                        'INVALID_URL'
                    ));
                }
                $updateData['url'] = $requestData['url'];
            }
            
            // Atualizar eventos se fornecidos
            if (isset($requestData['events'])) {
                $validEvents = ['message.sent', 'message.received', 'message.delivered', 'message.read', 'message.failed', 'status.changed'];
                $events = is_array($requestData['events']) ? $requestData['events'] : [$requestData['events']];
                
                foreach ($events as $event) {
                    if (!in_array($event, $validEvents)) {
                        sendResponse(400, errorResponse(
                            400,
                            'Evento inválido: ' . $event . '. Eventos válidos: ' . implode(', ', $validEvents),
                            'INVALID_EVENT'
                        ));
                    }
                }
                
                $updateData['events'] = '{' . implode(',', $events) . '}';  // Formato de array no PostgreSQL
            }
            
            // Atualizar status ativo/inativo
            if (isset($requestData['is_active'])) {
                $updateData['is_active'] = (bool)$requestData['is_active'];
            }
            
            // Atualizar token secreto
            if (isset($requestData['secret_token'])) {
                $updateData['secret_token'] = $requestData['secret_token'];
            } else if (isset($requestData['generate_secret']) && $requestData['generate_secret']) {
                $updateData['secret_token'] = bin2hex(random_bytes(16));
            }
            
            // Adicionar timestamp de atualização
            $updateData['updated_at'] = date('Y-m-d H:i:s');
            
            // Verificar se há dados para atualizar
            if (empty($updateData)) {
                sendResponse(400, errorResponse(
                    400,
                    'Nenhum dado para atualizar.',
                    'NO_DATA'
                ));
            }
            
            // Atualizar webhook
            $updated = Database::update(
                'webhooks',
                $updateData,
                'id = ?',
                [$webhookId]
            );
            
            if ($updated) {
                // Buscar o webhook atualizado
                $webhook = Database::queryOne(
                    'SELECT * FROM webhooks WHERE id = ?',
                    [$webhookId]
                );
                
                sendResponse(200, [
                    'data' => $webhook,
                    'message' => 'Webhook atualizado com sucesso.'
                ]);
            } else {
                sendResponse(500, errorResponse(
                    500,
                    'Erro ao atualizar webhook.',
                    'UPDATE_ERROR'
                ));
            }
        } catch (Exception $e) {
            sendResponse(500, errorResponse(
                500,
                'Erro ao processar atualização do webhook.',
                'DATABASE_ERROR'
            ));
        }
        break;
        
    case 'DELETE':
        // Verificar se um ID foi fornecido
        if (!$webhookId) {
            sendResponse(400, errorResponse(
                400,
                'ID do webhook é obrigatório para exclusão.',
                'MISSING_ID'
            ));
        }
        
        try {
            // Verificar se o webhook existe e pertence ao usuário
            $webhook = Database::queryOne(
                'SELECT * FROM webhooks WHERE id = ? AND user_id = ?',
                [$webhookId, $auth['user_id']]
            );
            
            if (!$webhook) {
                sendResponse(404, errorResponse(
                    404,
                    'Webhook não encontrado ou não pertence ao usuário.',
                    'WEBHOOK_NOT_FOUND'
                ));
            }
            
            // Excluir o webhook
            $deleted = Database::execute(
                'DELETE FROM webhooks WHERE id = ?',
                [$webhookId]
            );
            
            if ($deleted) {
                sendResponse(200, [
                    'message' => 'Webhook excluído com sucesso.',
                    'id' => $webhookId
                ]);
            } else {
                sendResponse(500, errorResponse(
                    500,
                    'Erro ao excluir webhook.',
                    'DELETE_ERROR'
                ));
            }
        } catch (Exception $e) {
            sendResponse(500, errorResponse(
                500,
                'Erro ao processar exclusão do webhook.',
                'DATABASE_ERROR'
            ));
        }
        break;
        
    default:
        // Método não permitido
        sendResponse(405, errorResponse(
            405,
            'Método não permitido. Use GET, POST, PUT ou DELETE.',
            'METHOD_NOT_ALLOWED'
        ));
        break;
}