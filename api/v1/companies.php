<?php
/**
 * API para gerenciamento de empresas
 * 
 * Endpoints:
 * - GET /api/v1/companies - Lista todas as empresas
 * - GET /api/v1/companies?id={id} - Busca uma empresa específica
 * - POST /api/v1/companies - Cria uma nova empresa
 * - PUT /api/v1/companies/{id} - Atualiza uma empresa existente
 * - DELETE /api/v1/companies/{id} - Desativa uma empresa (soft delete)
 */

// Carregar dependências
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../models/Database.php';
require_once __DIR__ . '/../models/SupabaseClient.php';
require_once __DIR__ . '/../middleware/auth-rest.php'; // Usando a versão REST da autenticação

// Verificar autenticação
$authResult = authenticate();
if (!$authResult['authenticated']) {
    sendResponse(401, ['error' => 'Não autorizado']);
    exit;
}

// Obter o ID do usuário autenticado
$userId = $authResult['user_id'];

// Inicializar o cliente Supabase REST
$supabase = SupabaseClient::getInstance('service_role');

// Processar a requisição com base no método HTTP
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Listar empresas ou obter empresa específica
        handleGetCompanies($supabase, $userId);
        break;

    case 'POST':
        // Criar nova empresa
        handleCreateCompany($supabase, $userId);
        break;

    case 'PUT':
        // Atualizar empresa existente
        handleUpdateCompany($supabase, $userId);
        break;

    case 'DELETE':
        // Desativar empresa (soft delete)
        handleDeactivateCompany($supabase, $userId);
        break;

    default:
        sendResponse(405, ['error' => 'Método não permitido']);
        break;
}

/**
 * Lista empresas com base nos filtros fornecidos
 * 
 * @param object $supabase Cliente Supabase
 * @param string $userId ID do usuário autenticado
 */
function handleGetCompanies($supabase, $userId) {
    // Verificar se há um ID específico na requisição
    $companyId = isset($_GET['id']) ? $_GET['id'] : null;
    
    // Construir a query
    $query = [
        'table' => 'companies',
        'select' => '*',
        'filters' => [
            ['column' => 'user_id', 'operator' => 'eq', 'value' => $userId]
        ],
        'order' => ['created_at' => 'desc']
    ];
    
    // Adicionar filtro por ID, se fornecido
    if ($companyId) {
        $query['filters'][] = ['column' => 'id', 'operator' => 'eq', 'value' => $companyId];
    }
    
    // Executar a consulta
    $result = $supabase->from($query['table'])
        ->select($query['select']);
    
    // Aplicar filtros
    foreach ($query['filters'] as $filter) {
        $result = $result->filter($filter['column'], $filter['operator'], $filter['value']);
    }
    
    // Aplicar ordenação
    foreach ($query['order'] as $column => $direction) {
        $result = $result->order($column, ['ascending' => $direction === 'asc']);
    }
    
    // Executar a consulta
    $response = $result->execute();
    
    // Verificar se houve erro
    if ($response->getError()) {
        sendResponse(500, ['error' => 'Erro ao buscar empresas: ' . $response->getError()->getMessage()]);
        return;
    }
    
    // Retornar os resultados
    $companies = $response->getData();
    sendResponse(200, ['companies' => $companies]);
}

/**
 * Cria uma nova empresa
 * 
 * @param object $supabase Cliente Supabase
 * @param string $userId ID do usuário autenticado
 */
function handleCreateCompany($supabase, $userId) {
    // Obter dados da requisição
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validar dados
    if (!isset($data['name']) || empty(trim($data['name']))) {
        sendResponse(400, ['error' => 'Nome da empresa é obrigatório']);
        return;
    }
    
    // Criar empresa
    $company = [
        'user_id' => $userId,
        'name' => trim($data['name']),
        'is_active' => true
    ];
    
    // Inserir no banco de dados
    $response = $supabase->from('companies')
        ->insert($company)
        ->execute();
    
    // Verificar se houve erro
    if ($response->getError()) {
        sendResponse(500, ['error' => 'Erro ao criar empresa: ' . $response->getError()->getMessage()]);
        return;
    }
    
    // Retornar a empresa criada
    sendResponse(201, ['company' => $response->getData()[0]]);
}

/**
 * Atualiza uma empresa existente
 * 
 * @param object $supabase Cliente Supabase
 * @param string $userId ID do usuário autenticado
 */
function handleUpdateCompany($supabase, $userId) {
    // Obter ID da empresa da URL
    $requestUri = $_SERVER['REQUEST_URI'];
    $urlParts = explode('/', $requestUri);
    $companyId = end($urlParts);
    
    // Validar ID
    if (!$companyId || $companyId === 'companies') {
        sendResponse(400, ['error' => 'ID da empresa não fornecido']);
        return;
    }
    
    // Obter dados da requisição
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validar dados
    if (!isset($data['name']) || empty(trim($data['name']))) {
        sendResponse(400, ['error' => 'Nome da empresa é obrigatório']);
        return;
    }
    
    // Verificar se a empresa pertence ao usuário
    $checkResponse = $supabase->from('companies')
        ->select('id')
        ->filter('id', 'eq', $companyId)
        ->filter('user_id', 'eq', $userId)
        ->execute();
    
    if (count($checkResponse->getData()) === 0) {
        sendResponse(404, ['error' => 'Empresa não encontrada ou sem permissão']);
        return;
    }
    
    // Atualizar empresa
    $updates = [
        'name' => trim($data['name']),
        'updated_at' => date('c')
    ];
    
    // Se o status foi fornecido, atualizá-lo também
    if (isset($data['is_active'])) {
        $updates['is_active'] = (bool)$data['is_active'];
    }
    
    // Atualizar no banco de dados
    $response = $supabase->from('companies')
        ->update($updates)
        ->filter('id', 'eq', $companyId)
        ->execute();
    
    // Verificar se houve erro
    if ($response->getError()) {
        sendResponse(500, ['error' => 'Erro ao atualizar empresa: ' . $response->getError()->getMessage()]);
        return;
    }
    
    // Retornar a empresa atualizada
    sendResponse(200, ['company' => $response->getData()[0]]);
}

/**
 * Desativa uma empresa (soft delete)
 * 
 * @param object $supabase Cliente Supabase
 * @param string $userId ID do usuário autenticado
 */
function handleDeactivateCompany($supabase, $userId) {
    // Obter ID da empresa da URL
    $requestUri = $_SERVER['REQUEST_URI'];
    $urlParts = explode('/', $requestUri);
    $companyId = end($urlParts);
    
    // Validar ID
    if (!$companyId || $companyId === 'companies') {
        sendResponse(400, ['error' => 'ID da empresa não fornecido']);
        return;
    }
    
    // Verificar se a empresa pertence ao usuário
    $checkResponse = $supabase->from('companies')
        ->select('id')
        ->filter('id', 'eq', $companyId)
        ->filter('user_id', 'eq', $userId)
        ->execute();
    
    if (count($checkResponse->getData()) === 0) {
        sendResponse(404, ['error' => 'Empresa não encontrada ou sem permissão']);
        return;
    }
    
    // Desativar empresa (soft delete)
    $response = $supabase->from('companies')
        ->update([
            'is_active' => false,
            'updated_at' => date('c')
        ])
        ->filter('id', 'eq', $companyId)
        ->execute();
    
    // Verificar se houve erro
    if ($response->getError()) {
        sendResponse(500, ['error' => 'Erro ao desativar empresa: ' . $response->getError()->getMessage()]);
        return;
    }
    
    // Retornar sucesso
    sendResponse(200, ['success' => true, 'message' => 'Empresa desativada com sucesso']);
}