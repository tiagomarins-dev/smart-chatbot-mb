<?php
/**
 * Endpoint de contatos
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
$auth = authenticateApiKey(['contacts:read', 'contacts:write']);

// Aplicar limite de taxa com base na API Key
applyRateLimit('api_' . $auth['api_key_id'], $auth['rate_limit']);

// Obter ID do contato da URL, se fornecido
$contactId = isset($_GET['id']) ? $_GET['id'] : null;
$phone = isset($_GET['phone']) ? $_GET['phone'] : null;

// Processar com base no método
switch ($method) {
    case 'GET':
        try {
            // Se um ID específico foi fornecido
            if ($contactId) {
                // Buscar contato específico
                $contact = Database::queryOne(
                    'SELECT * FROM contacts 
                     WHERE id = ? AND user_id = ?',
                    [$contactId, $auth['user_id']]
                );
                
                if (!$contact) {
                    sendResponse(404, errorResponse(
                        404,
                        'Contato não encontrado.',
                        'CONTACT_NOT_FOUND'
                    ));
                }
                
                sendResponse(200, [
                    'data' => $contact
                ]);
            } 
            // Se um número de telefone foi fornecido
            else if ($phone) {
                // Normalizar número de telefone
                $phone = preg_replace('/[^0-9]/', '', $phone);
                
                // Buscar contato pelo número
                $contact = Database::queryOne(
                    'SELECT * FROM contacts 
                     WHERE phone_number = ? AND user_id = ?',
                    [$phone, $auth['user_id']]
                );
                
                if (!$contact) {
                    sendResponse(404, errorResponse(
                        404,
                        'Contato não encontrado.',
                        'CONTACT_NOT_FOUND'
                    ));
                }
                
                sendResponse(200, [
                    'data' => $contact
                ]);
            } 
            // Retornar todos os contatos (com paginação e filtros)
            else {
                // Parâmetros de paginação
                $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
                $limit = isset($_GET['limit']) ? min(100, max(1, intval($_GET['limit']))) : 20;
                $offset = ($page - 1) * $limit;
                
                // Parâmetros de filtro
                $tag = isset($_GET['tag']) ? $_GET['tag'] : null;
                $search = isset($_GET['search']) ? $_GET['search'] : null;
                
                // Construir query com filtros
                $query = 'SELECT * FROM contacts WHERE user_id = ?';
                $params = [$auth['user_id']];
                
                // Filtrar por tag
                if ($tag) {
                    $query .= ' AND ? = ANY(tags)';
                    $params[] = $tag;
                }
                
                // Filtrar por termo de busca
                if ($search) {
                    $query .= ' AND (
                        name ILIKE ? OR 
                        first_name ILIKE ? OR 
                        last_name ILIKE ? OR 
                        phone_number ILIKE ? OR
                        email ILIKE ?
                    )';
                    $searchTerm = '%' . $search . '%';
                    $params = array_merge($params, [
                        $searchTerm, $searchTerm, $searchTerm, $searchTerm, $searchTerm
                    ]);
                }
                
                // Ordenação
                $query .= ' ORDER BY last_message_at DESC NULLS LAST, name ASC';
                
                // Paginação
                $query .= ' LIMIT ? OFFSET ?';
                $params[] = $limit;
                $params[] = $offset;
                
                // Buscar contatos
                $contacts = Database::query($query, $params);
                
                // Contar total de contatos para paginação
                $countQuery = 'SELECT COUNT(*) FROM contacts WHERE user_id = ?';
                $countParams = [$auth['user_id']];
                
                // Adicionar filtros na contagem
                if ($tag) {
                    $countQuery .= ' AND ? = ANY(tags)';
                    $countParams[] = $tag;
                }
                
                if ($search) {
                    $countQuery .= ' AND (
                        name ILIKE ? OR 
                        first_name ILIKE ? OR 
                        last_name ILIKE ? OR 
                        phone_number ILIKE ? OR
                        email ILIKE ?
                    )';
                    $searchTerm = '%' . $search . '%';
                    $countParams = array_merge($countParams, [
                        $searchTerm, $searchTerm, $searchTerm, $searchTerm, $searchTerm
                    ]);
                }
                
                $total = Database::queryValue($countQuery, $countParams);
                
                sendResponse(200, [
                    'data' => $contacts,
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
                'Erro ao buscar contatos.',
                'DATABASE_ERROR'
            ));
        }
        break;
        
    case 'POST':
        // Obter os dados enviados no corpo da requisição
        $requestData = json_decode(file_get_contents('php://input'), true);
        
        // Validar campos obrigatórios
        if (!isset($requestData['phone_number'])) {
            sendResponse(400, errorResponse(
                400,
                'Campo obrigatório: phone_number',
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
        
        try {
            // Verificar se o contato já existe
            $existingContact = Database::queryOne(
                'SELECT * FROM contacts 
                 WHERE phone_number = ? AND user_id = ?',
                [$phoneNumber, $auth['user_id']]
            );
            
            if ($existingContact) {
                sendResponse(409, errorResponse(
                    409,
                    'Contato já existe para este número de telefone.',
                    'CONTACT_EXISTS',
                    ['id' => $existingContact['id']]
                ));
            }
            
            // Preparar dados para inserção
            $contactData = [
                'user_id' => $auth['user_id'],
                'phone_number' => $phoneNumber,
                'name' => $requestData['name'] ?? null,
                'first_name' => $requestData['first_name'] ?? null,
                'last_name' => $requestData['last_name'] ?? null,
                'email' => $requestData['email'] ?? null,
                'profile_image_url' => $requestData['profile_image_url'] ?? null,
                'is_blocked' => $requestData['is_blocked'] ?? false,
            ];
            
            // Adicionar tags se fornecidas
            if (isset($requestData['tags']) && is_array($requestData['tags'])) {
                $contactData['tags'] = '{' . implode(',', $requestData['tags']) . '}';  // Formato de array no PostgreSQL
            }
            
            // Adicionar campos personalizados se fornecidos
            if (isset($requestData['custom_fields']) && is_array($requestData['custom_fields'])) {
                $contactData['custom_fields'] = json_encode($requestData['custom_fields']);
            }
            
            // Inserir contato no banco
            $contactId = Database::insert('contacts', $contactData);
            
            // Buscar o contato inserido
            $contact = Database::queryOne(
                'SELECT * FROM contacts WHERE id = ?',
                [$contactId]
            );
            
            // Retornar contato criado
            sendResponse(201, [
                'data' => $contact,
                'message' => 'Contato criado com sucesso.'
            ]);
        } catch (Exception $e) {
            sendResponse(500, errorResponse(
                500,
                'Erro ao criar contato.',
                'DATABASE_ERROR'
            ));
        }
        break;
        
    case 'PUT':
        // Verificar se um ID foi fornecido
        if (!$contactId && !$phone) {
            sendResponse(400, errorResponse(
                400,
                'ID do contato ou número de telefone é obrigatório para atualização.',
                'MISSING_IDENTIFIER'
            ));
        }
        
        // Obter os dados enviados no corpo da requisição
        $requestData = json_decode(file_get_contents('php://input'), true);
        
        try {
            // Verificar se o contato existe e pertence ao usuário
            $contact = null;
            
            if ($contactId) {
                $contact = Database::queryOne(
                    'SELECT * FROM contacts WHERE id = ? AND user_id = ?',
                    [$contactId, $auth['user_id']]
                );
            } else if ($phone) {
                // Normalizar número de telefone
                $phoneNumber = preg_replace('/[^0-9]/', '', $phone);
                
                $contact = Database::queryOne(
                    'SELECT * FROM contacts WHERE phone_number = ? AND user_id = ?',
                    [$phoneNumber, $auth['user_id']]
                );
            }
            
            if (!$contact) {
                sendResponse(404, errorResponse(
                    404,
                    'Contato não encontrado ou não pertence ao usuário.',
                    'CONTACT_NOT_FOUND'
                ));
            }
            
            // Preparar dados para atualização
            $updateData = [];
            
            // Campos que podem ser atualizados
            $updatableFields = [
                'name', 'first_name', 'last_name', 'email', 
                'profile_image_url', 'is_blocked'
            ];
            
            foreach ($updatableFields as $field) {
                if (isset($requestData[$field])) {
                    $updateData[$field] = $requestData[$field];
                }
            }
            
            // Atualizar tags se fornecidas
            if (isset($requestData['tags']) && is_array($requestData['tags'])) {
                $updateData['tags'] = '{' . implode(',', $requestData['tags']) . '}';  // Formato de array no PostgreSQL
            }
            
            // Atualizar campos personalizados
            if (isset($requestData['custom_fields'])) {
                if (is_array($requestData['custom_fields'])) {
                    $updateData['custom_fields'] = json_encode($requestData['custom_fields']);
                } else {
                    sendResponse(400, errorResponse(
                        400,
                        'custom_fields deve ser um objeto.',
                        'INVALID_FORMAT'
                    ));
                }
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
            
            // Atualizar contato
            $updated = Database::update(
                'contacts',
                $updateData,
                'id = ?',
                [$contact['id']]
            );
            
            if ($updated) {
                // Buscar o contato atualizado
                $contact = Database::queryOne(
                    'SELECT * FROM contacts WHERE id = ?',
                    [$contact['id']]
                );
                
                sendResponse(200, [
                    'data' => $contact,
                    'message' => 'Contato atualizado com sucesso.'
                ]);
            } else {
                sendResponse(500, errorResponse(
                    500,
                    'Erro ao atualizar contato.',
                    'UPDATE_ERROR'
                ));
            }
        } catch (Exception $e) {
            sendResponse(500, errorResponse(
                500,
                'Erro ao processar atualização do contato.',
                'DATABASE_ERROR'
            ));
        }
        break;
        
    case 'DELETE':
        // Verificar se um ID foi fornecido
        if (!$contactId && !$phone) {
            sendResponse(400, errorResponse(
                400,
                'ID do contato ou número de telefone é obrigatório para exclusão.',
                'MISSING_IDENTIFIER'
            ));
        }
        
        try {
            // Verificar se o contato existe e pertence ao usuário
            $contact = null;
            
            if ($contactId) {
                $contact = Database::queryOne(
                    'SELECT * FROM contacts WHERE id = ? AND user_id = ?',
                    [$contactId, $auth['user_id']]
                );
            } else if ($phone) {
                // Normalizar número de telefone
                $phoneNumber = preg_replace('/[^0-9]/', '', $phone);
                
                $contact = Database::queryOne(
                    'SELECT * FROM contacts WHERE phone_number = ? AND user_id = ?',
                    [$phoneNumber, $auth['user_id']]
                );
            }
            
            if (!$contact) {
                sendResponse(404, errorResponse(
                    404,
                    'Contato não encontrado ou não pertence ao usuário.',
                    'CONTACT_NOT_FOUND'
                ));
            }
            
            // Excluir o contato
            $deleted = Database::execute(
                'DELETE FROM contacts WHERE id = ?',
                [$contact['id']]
            );
            
            if ($deleted) {
                sendResponse(200, [
                    'message' => 'Contato excluído com sucesso.',
                    'id' => $contact['id']
                ]);
            } else {
                sendResponse(500, errorResponse(
                    500,
                    'Erro ao excluir contato.',
                    'DELETE_ERROR'
                ));
            }
        } catch (Exception $e) {
            sendResponse(500, errorResponse(
                500,
                'Erro ao processar exclusão do contato.',
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