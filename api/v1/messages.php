<?php
/**
 * Endpoint de mensagens
 */

// Carregar dependências
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../middleware/cors.php';
require_once __DIR__ . '/../middleware/auth-rest.php';
require_once __DIR__ . '/../middleware/rate_limit.php';
require_once __DIR__ . '/../models/Database.php';

// Tratar CORS
handleCors();

// Obter o método da requisição
$method = $_SERVER['REQUEST_METHOD'];

// Autenticar requisição via API Key
$auth = authenticateApiKey(['messages:read', 'messages:write']);

// Aplicar limite de taxa com base na API Key
applyRateLimit('api_' . $auth['api_key_id'], $auth['rate_limit']);

// Obter ID da mensagem da URL, se fornecido
$messageId = isset($_GET['id']) ? $_GET['id'] : null;
$phone = isset($_GET['phone']) ? $_GET['phone'] : null;

// Processar com base no método
switch ($method) {
    case 'GET':
        try {
            // Se um ID específico foi fornecido
            if ($messageId) {
                // Buscar mensagem específica
                $message = Database::queryOne(
                    'SELECT * FROM api_messages 
                     WHERE id = ? AND user_id = ?',
                    [$messageId, $auth['user_id']]
                );
                
                if (!$message) {
                    sendResponse(404, errorResponse(
                        404,
                        'Mensagem não encontrada.',
                        'MESSAGE_NOT_FOUND'
                    ));
                }
                
                sendResponse(200, [
                    'data' => $message
                ]);
            } 
            // Se um número de telefone foi fornecido
            else if ($phone) {
                // Normalizar número de telefone
                $phone = preg_replace('/[^0-9]/', '', $phone);
                
                // Buscar mensagens para este número
                $messages = Database::query(
                    'SELECT * FROM api_messages 
                     WHERE phone_number = ? AND user_id = ?
                     ORDER BY created_at DESC
                     LIMIT 100',
                    [$phone, $auth['user_id']]
                );
                
                sendResponse(200, [
                    'data' => $messages,
                    'count' => count($messages)
                ]);
            } 
            // Retornar todas as mensagens (com paginação)
            else {
                // Parâmetros de paginação
                $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
                $limit = isset($_GET['limit']) ? min(100, max(1, intval($_GET['limit']))) : 20;
                $offset = ($page - 1) * $limit;
                
                // Buscar mensagens
                $messages = Database::query(
                    'SELECT * FROM api_messages 
                     WHERE user_id = ?
                     ORDER BY created_at DESC
                     LIMIT ? OFFSET ?',
                    [$auth['user_id'], $limit, $offset]
                );
                
                // Contar total de mensagens para paginação
                $total = Database::queryValue(
                    'SELECT COUNT(*) FROM api_messages WHERE user_id = ?',
                    [$auth['user_id']]
                );
                
                sendResponse(200, [
                    'data' => $messages,
                    'pagination' => [
                        'total' => $total,
                        'page' => $page,
                        'limit' => $limit,
                        'pages' => ceil($total / $limit)
                    ]
                ]);
            }
        } catch (Exception $e) {
            sendResponse(500, errorResponse(
                500,
                'Erro ao buscar mensagens.',
                'DATABASE_ERROR'
            ));
        }
        break;
        
    case 'POST':
        // Obter os dados enviados no corpo da requisição
        $requestData = json_decode(file_get_contents('php://input'), true);
        
        // Validar campos obrigatórios
        if (!isset($requestData['phone_number']) || !isset($requestData['message_content'])) {
            sendResponse(400, errorResponse(
                400,
                'Campos obrigatórios: phone_number, message_content',
                'MISSING_FIELDS'
            ));
        }
        
        // Normalizar número de telefone
        $phoneNumber = preg_replace('/[^0-9]/', '', $requestData['phone_number']);
        
        // Validar número de telefone
        if (strlen($phoneNumber) < 10) {
            sendResponse(400, errorResponse(
                400,
                'Número de telefone inválido. Formato esperado: 5511999999999',
                'INVALID_PHONE'
            ));
        }
        
        // Preparar dados para inserção
        $messageData = [
            'user_id' => $auth['user_id'],
            'phone_number' => $phoneNumber,
            'message_content' => $requestData['message_content'],
            'direction' => 'outbound',
            'status' => 'pending',
            'metadata' => isset($requestData['metadata']) ? json_encode($requestData['metadata']) : null,
        ];
        
        // Adicionar URL de mídia se fornecida
        if (isset($requestData['media_url'])) {
            $messageData['media_url'] = $requestData['media_url'];
        }
        
        try {
            // Inserir mensagem no banco
            $messageId = Database::insert('api_messages', $messageData);
            
            // Buscar a mensagem inserida
            $message = Database::queryOne(
                'SELECT * FROM api_messages WHERE id = ?',
                [$messageId]
            );
            
            // Enviar para o WhatsApp (em um sistema real, isso seria feito assincronamente)
            // Esta é uma simulação simples
            // Na implementação real, você enviaria para sua API WhatsApp
            try {
                // Configuração da API
                $config = require __DIR__ . '/../config/config.php';
                $isLocalhost = strpos($_SERVER['HTTP_HOST'], 'localhost') !== false || 
                               strpos($_SERVER['HTTP_HOST'], '127.0.0.1') !== false;
                $apiUrl = $isLocalhost ? 'http://localhost:3000/api' : 'http://node-api:3000/api';
                
                // Preparar dados para a API WhatsApp
                $whatsappData = [
                    'number' => $phoneNumber,
                    'message' => $requestData['message_content'],
                ];
                
                // Opções da requisição
                $options = [
                    'http' => [
                        'header' => "Content-type: application/json\r\n",
                        'method' => 'POST',
                        'content' => json_encode($whatsappData),
                        'timeout' => 10,
                    ],
                ];
                
                // Criar contexto e fazer a requisição
                $context = stream_context_create($options);
                $result = @file_get_contents($apiUrl . '/send', false, $context);
                
                if ($result !== false) {
                    $apiResult = json_decode($result, true);
                    
                    // Atualizar status da mensagem para "enviada"
                    Database::execute(
                        'UPDATE api_messages SET 
                         status = ?, whatsapp_message_id = ?, sent_at = NOW(), updated_at = NOW()
                         WHERE id = ?',
                        ['sent', $apiResult['id'] ?? null, $messageId]
                    );
                    
                    $message['status'] = 'sent';
                    $message['whatsapp_message_id'] = $apiResult['id'] ?? null;
                    $message['sent_at'] = date('Y-m-d H:i:s');
                } else {
                    // Falha ao enviar para o WhatsApp
                    Database::execute(
                        'UPDATE api_messages SET 
                         status = ?, updated_at = NOW()
                         WHERE id = ?',
                        ['failed', $messageId]
                    );
                    
                    $message['status'] = 'failed';
                }
            } catch (Exception $e) {
                // Registrar erro, mas não expor detalhes para o cliente
                error_log('Erro ao enviar para WhatsApp: ' . $e->getMessage());
                
                // Atualizar status da mensagem para "falha"
                Database::execute(
                    'UPDATE api_messages SET 
                     status = ?, updated_at = NOW()
                     WHERE id = ?',
                    ['failed', $messageId]
                );
                
                $message['status'] = 'failed';
            }
            
            // Retornar mensagem criada
            sendResponse(201, [
                'data' => $message,
                'message' => 'Mensagem criada com sucesso.'
            ]);
        } catch (Exception $e) {
            sendResponse(500, errorResponse(
                500,
                'Erro ao criar mensagem.',
                'DATABASE_ERROR'
            ));
        }
        break;
        
    case 'DELETE':
        // Verificar se um ID foi fornecido
        if (!$messageId) {
            sendResponse(400, errorResponse(
                400,
                'ID da mensagem é obrigatório para exclusão.',
                'MISSING_ID'
            ));
        }
        
        try {
            // Verificar se a mensagem existe e pertence ao usuário
            $message = Database::queryOne(
                'SELECT * FROM api_messages WHERE id = ? AND user_id = ?',
                [$messageId, $auth['user_id']]
            );
            
            if (!$message) {
                sendResponse(404, errorResponse(
                    404,
                    'Mensagem não encontrada ou não pertence ao usuário.',
                    'MESSAGE_NOT_FOUND'
                ));
            }
            
            // Excluir a mensagem
            $deleted = Database::execute(
                'DELETE FROM api_messages WHERE id = ?',
                [$messageId]
            );
            
            if ($deleted) {
                sendResponse(200, [
                    'message' => 'Mensagem excluída com sucesso.',
                    'id' => $messageId
                ]);
            } else {
                sendResponse(500, errorResponse(
                    500,
                    'Erro ao excluir mensagem.',
                    'DELETE_ERROR'
                ));
            }
        } catch (Exception $e) {
            sendResponse(500, errorResponse(
                500,
                'Erro ao processar exclusão da mensagem.',
                'DATABASE_ERROR'
            ));
        }
        break;
        
    default:
        // Método não permitido
        sendResponse(405, errorResponse(
            405,
            'Método não permitido. Use GET, POST ou DELETE.',
            'METHOD_NOT_ALLOWED'
        ));
        break;
}