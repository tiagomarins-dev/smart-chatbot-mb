<?php
/**
 * API para gerenciamento de projetos
 * 
 * Endpoints:
 * - GET /api/v1/projects - Lista todos os projetos
 * - GET /api/v1/projects?id={id} - Busca um projeto específico
 * - GET /api/v1/projects?company_id={company_id} - Lista projetos de uma empresa
 * - POST /api/v1/projects - Cria um novo projeto
 * - PUT /api/v1/projects/{id} - Atualiza um projeto existente
 * - DELETE /api/v1/projects/{id} - Desativa um projeto (soft delete)
 */

// Carregar dependências
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../models/Database.php';
require_once __DIR__ . '/../middleware/auth.php';

// Verificar autenticação
$authResult = authenticate();
if (!$authResult['authenticated']) {
    sendResponse(401, ['error' => 'Não autorizado']);
    exit;
}

// Obter o ID do usuário autenticado
$userId = $authResult['user_id'];

// Inicializar o banco de dados
$db = new Database();
$supabase = $db->getSupabaseClient();

// Processar a requisição com base no método HTTP
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Listar projetos ou obter projeto específico
        handleGetProjects($supabase, $userId);
        break;

    case 'POST':
        // Criar novo projeto
        handleCreateProject($supabase, $userId);
        break;

    case 'PUT':
        // Atualizar projeto existente
        handleUpdateProject($supabase, $userId);
        break;

    case 'DELETE':
        // Desativar projeto (soft delete)
        handleDeactivateProject($supabase, $userId);
        break;

    default:
        sendResponse(405, ['error' => 'Método não permitido']);
        break;
}

/**
 * Lista projetos com base nos filtros fornecidos
 * 
 * @param object $supabase Cliente Supabase
 * @param string $userId ID do usuário autenticado
 */
function handleGetProjects($supabase, $userId) {
    // Verificar se há um ID específico na requisição
    $projectId = isset($_GET['id']) ? $_GET['id'] : null;
    $companyId = isset($_GET['company_id']) ? $_GET['company_id'] : null;
    
    // Validar que um company_id foi fornecido
    if (!$companyId && !$projectId) {
        sendResponse(400, ['error' => 'Você deve especificar um ID de empresa para listar os projetos']);
        return;
    }
    
    // Verificar se a empresa pertence ao usuário (se company_id foi fornecido)
    if ($companyId) {
        $checkCompanyResponse = $supabase->from('companies')
            ->select('id')
            ->filter('id', 'eq', $companyId)
            ->filter('user_id', 'eq', $userId)
            ->execute();
        
        if (count($checkCompanyResponse->getData()) === 0) {
            sendResponse(404, ['error' => 'Empresa não encontrada ou sem permissão']);
            return;
        }
    }
    
    // Construir a query
    $query = [
        'table' => 'projects',
        'select' => '*',
        'filters' => [
            ['column' => 'user_id', 'operator' => 'eq', 'value' => $userId]
        ],
        'order' => ['created_at' => 'desc']
    ];
    
    // Adicionar filtro por ID, se fornecido
    if ($projectId) {
        $query['filters'][] = ['column' => 'id', 'operator' => 'eq', 'value' => $projectId];
    }
    
    // Adicionar filtro por company_id, se fornecido
    if ($companyId) {
        $query['filters'][] = ['column' => 'company_id', 'operator' => 'eq', 'value' => $companyId];
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
        sendResponse(500, ['error' => 'Erro ao buscar projetos: ' . $response->getError()->getMessage()]);
        return;
    }
    
    // Retornar os resultados
    $projects = $response->getData();
    sendResponse(200, ['projects' => $projects]);
}

/**
 * Cria um novo projeto
 * 
 * @param object $supabase Cliente Supabase
 * @param string $userId ID do usuário autenticado
 */
function handleCreateProject($supabase, $userId) {
    // Obter dados da requisição
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validar dados
    if (!isset($data['name']) || empty(trim($data['name']))) {
        sendResponse(400, ['error' => 'Nome do projeto é obrigatório']);
        return;
    }
    
    if (!isset($data['company_id']) || empty($data['company_id'])) {
        sendResponse(400, ['error' => 'ID da empresa é obrigatório']);
        return;
    }
    
    // Verificar se a empresa existe e pertence ao usuário
    $checkCompanyResponse = $supabase->from('companies')
        ->select('id, name')
        ->filter('id', 'eq', $data['company_id'])
        ->filter('user_id', 'eq', $userId)
        ->execute();
    
    if (count($checkCompanyResponse->getData()) === 0) {
        sendResponse(404, ['error' => 'Empresa não encontrada ou sem permissão']);
        return;
    }
    
    // Verificar se a empresa está ativa
    $companyData = $checkCompanyResponse->getData()[0];
    if (isset($companyData['is_active']) && $companyData['is_active'] === false) {
        sendResponse(400, ['error' => 'Não é possível criar projetos para uma empresa inativa']);
        return;
    }
    
    // Validar datas de campanha
    $campaignStartDate = isset($data['campaign_start_date']) ? $data['campaign_start_date'] : null;
    $campaignEndDate = isset($data['campaign_end_date']) ? $data['campaign_end_date'] : null;
    
    if ($campaignStartDate && $campaignEndDate) {
        $startDate = strtotime($campaignStartDate);
        $endDate = strtotime($campaignEndDate);
        
        if (!$startDate || !$endDate) {
            sendResponse(400, ['error' => 'Formato de data inválido. Use o formato YYYY-MM-DD']);
            return;
        }
        
        if ($endDate < $startDate) {
            sendResponse(400, ['error' => 'A data final da campanha não pode ser anterior à data inicial']);
            return;
        }
    } else if ($campaignStartDate && !is_null($campaignStartDate)) {
        $startDate = strtotime($campaignStartDate);
        
        if (!$startDate) {
            sendResponse(400, ['error' => 'Formato de data de início inválido. Use o formato YYYY-MM-DD']);
            return;
        }
    } else if ($campaignEndDate && !is_null($campaignEndDate)) {
        $endDate = strtotime($campaignEndDate);
        
        if (!$endDate) {
            sendResponse(400, ['error' => 'Formato de data de término inválido. Use o formato YYYY-MM-DD']);
            return;
        }
    }
    
    // Criar projeto
    $project = [
        'user_id' => $userId,
        'company_id' => $data['company_id'],
        'name' => trim($data['name']),
        'description' => isset($data['description']) ? trim($data['description']) : null,
        'is_active' => true,
        'campaign_start_date' => $campaignStartDate,
        'campaign_end_date' => $campaignEndDate
    ];
    
    // Inserir no banco de dados
    $response = $supabase->from('projects')
        ->insert($project)
        ->execute();
    
    // Verificar se houve erro
    if ($response->getError()) {
        sendResponse(500, ['error' => 'Erro ao criar projeto: ' . $response->getError()->getMessage()]);
        return;
    }
    
    // Obter projeto criado
    $createdProject = $response->getData()[0];
    
    // Obter o nome da empresa para o retorno
    $companyName = $companyData['name'] ?? 'Desconhecida';
    
    // Preparar dados formatados para a resposta
    $projectResponse = [
        'project' => $createdProject,
        'message' => 'Projeto criado com sucesso',
        'details' => [
            'name' => $createdProject['name'],
            'company' => $companyName,
            'created_at' => date('d/m/Y H:i:s', strtotime($createdProject['created_at']))
        ]
    ];
    
    // Adicionar informações sobre a campanha, se definidas
    if ($createdProject['campaign_start_date'] || $createdProject['campaign_end_date']) {
        $projectResponse['details']['campaign'] = [];
        
        if ($createdProject['campaign_start_date']) {
            $projectResponse['details']['campaign']['start'] = date('d/m/Y', strtotime($createdProject['campaign_start_date']));
        }
        
        if ($createdProject['campaign_end_date']) {
            $projectResponse['details']['campaign']['end'] = date('d/m/Y', strtotime($createdProject['campaign_end_date']));
        }
    }
    
    // Retornar o projeto criado com mensagem de sucesso
    sendResponse(201, $projectResponse);
}

/**
 * Atualiza um projeto existente
 * 
 * @param object $supabase Cliente Supabase
 * @param string $userId ID do usuário autenticado
 */
function handleUpdateProject($supabase, $userId) {
    // Obter ID do projeto da URL
    $requestUri = $_SERVER['REQUEST_URI'];
    $urlParts = explode('/', $requestUri);
    $projectId = end($urlParts);
    
    // Validar ID
    if (!$projectId || $projectId === 'projects') {
        sendResponse(400, ['error' => 'ID do projeto não fornecido']);
        return;
    }
    
    // Obter dados da requisição
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validar dados
    if (!isset($data['name']) || empty(trim($data['name']))) {
        sendResponse(400, ['error' => 'Nome do projeto é obrigatório']);
        return;
    }
    
    // Verificar se o projeto pertence ao usuário
    $checkResponse = $supabase->from('projects')
        ->select('id, company_id')
        ->filter('id', 'eq', $projectId)
        ->filter('user_id', 'eq', $userId)
        ->execute();
    
    if (count($checkResponse->getData()) === 0) {
        sendResponse(404, ['error' => 'Projeto não encontrado ou sem permissão']);
        return;
    }
    
    // Se está mudando a empresa, verificar se a nova empresa pertence ao usuário
    if (isset($data['company_id']) && $data['company_id'] !== $checkResponse->getData()[0]['company_id']) {
        $checkCompanyResponse = $supabase->from('companies')
            ->select('id, name, is_active')
            ->filter('id', 'eq', $data['company_id'])
            ->filter('user_id', 'eq', $userId)
            ->execute();
        
        if (count($checkCompanyResponse->getData()) === 0) {
            sendResponse(404, ['error' => 'Empresa não encontrada ou sem permissão']);
            return;
        }
        
        // Verificar se a nova empresa está ativa
        $companyData = $checkCompanyResponse->getData()[0];
        if (isset($companyData['is_active']) && $companyData['is_active'] === false) {
            sendResponse(400, ['error' => 'Não é possível vincular projetos a uma empresa inativa']);
            return;
        }
    }
    
    // Validar datas de campanha
    $campaignStartDate = isset($data['campaign_start_date']) ? $data['campaign_start_date'] : null;
    $campaignEndDate = isset($data['campaign_end_date']) ? $data['campaign_end_date'] : null;
    
    // Obter valores atuais para compararmos com os novos valores
    $currentProjectResponse = $supabase->from('projects')
        ->select('campaign_start_date, campaign_end_date')
        ->filter('id', 'eq', $projectId)
        ->execute();
    
    if ($currentProjectResponse->getError()) {
        sendResponse(500, ['error' => 'Erro ao buscar projeto atual: ' . $currentProjectResponse->getError()->getMessage()]);
        return;
    }
    
    $currentProject = $currentProjectResponse->getData()[0];
    
    // Se apenas uma das datas foi fornecida, usar a outra do banco atual
    if (isset($data['campaign_start_date']) && !isset($data['campaign_end_date'])) {
        $campaignEndDate = $currentProject['campaign_end_date'];
    } else if (!isset($data['campaign_start_date']) && isset($data['campaign_end_date'])) {
        $campaignStartDate = $currentProject['campaign_start_date'];
    }
    
    // Validar as datas se ambas estiverem definidas
    if ($campaignStartDate && $campaignEndDate) {
        $startDate = strtotime($campaignStartDate);
        $endDate = strtotime($campaignEndDate);
        
        if (!$startDate || !$endDate) {
            sendResponse(400, ['error' => 'Formato de data inválido. Use o formato YYYY-MM-DD']);
            return;
        }
        
        if ($endDate < $startDate) {
            sendResponse(400, ['error' => 'A data final da campanha não pode ser anterior à data inicial']);
            return;
        }
    } else if ($campaignStartDate && !is_null($campaignStartDate)) {
        $startDate = strtotime($campaignStartDate);
        
        if (!$startDate) {
            sendResponse(400, ['error' => 'Formato de data de início inválido. Use o formato YYYY-MM-DD']);
            return;
        }
    } else if ($campaignEndDate && !is_null($campaignEndDate)) {
        $endDate = strtotime($campaignEndDate);
        
        if (!$endDate) {
            sendResponse(400, ['error' => 'Formato de data de término inválido. Use o formato YYYY-MM-DD']);
            return;
        }
    }
    
    // Atualizar projeto
    $updates = [
        'name' => trim($data['name']),
        'updated_at' => date('c')
    ];
    
    // Se a descrição foi fornecida, atualizá-la
    if (isset($data['description'])) {
        $updates['description'] = trim($data['description']);
    }
    
    // Se a empresa foi fornecida, atualizá-la
    if (isset($data['company_id'])) {
        $updates['company_id'] = $data['company_id'];
    }
    
    // Se o status foi fornecido, atualizá-lo
    if (isset($data['is_active'])) {
        $updates['is_active'] = (bool)$data['is_active'];
    }
    
    // Atualizar as datas da campanha
    if (isset($data['campaign_start_date'])) {
        $updates['campaign_start_date'] = $campaignStartDate;
    }
    
    if (isset($data['campaign_end_date'])) {
        $updates['campaign_end_date'] = $campaignEndDate;
    }
    
    // Atualizar no banco de dados
    $response = $supabase->from('projects')
        ->update($updates)
        ->filter('id', 'eq', $projectId)
        ->execute();
    
    // Verificar se houve erro
    if ($response->getError()) {
        sendResponse(500, ['error' => 'Erro ao atualizar projeto: ' . $response->getError()->getMessage()]);
        return;
    }
    
    // Obter projeto atualizado
    $updatedProject = $response->getData()[0];
    
    // Buscar informações adicionais
    $companyResponse = $supabase->from('companies')
        ->select('name')
        ->filter('id', 'eq', $updatedProject['company_id'])
        ->execute();
    
    $companyName = 'Desconhecida';
    if (!$companyResponse->getError() && count($companyResponse->getData()) > 0) {
        $companyName = $companyResponse->getData()[0]['name'];
    }
    
    // Preparar dados formatados para a resposta
    $projectResponse = [
        'project' => $updatedProject,
        'message' => 'Projeto atualizado com sucesso',
        'details' => [
            'name' => $updatedProject['name'],
            'company' => $companyName,
            'updated_at' => date('d/m/Y H:i:s', strtotime($updatedProject['updated_at'])),
            'status' => $updatedProject['is_active'] ? 'Ativo' : 'Inativo'
        ]
    ];
    
    // Adicionar informações sobre a campanha, se definidas
    if ($updatedProject['campaign_start_date'] || $updatedProject['campaign_end_date']) {
        $projectResponse['details']['campaign'] = [];
        
        if ($updatedProject['campaign_start_date']) {
            $projectResponse['details']['campaign']['start'] = date('d/m/Y', strtotime($updatedProject['campaign_start_date']));
        }
        
        if ($updatedProject['campaign_end_date']) {
            $projectResponse['details']['campaign']['end'] = date('d/m/Y', strtotime($updatedProject['campaign_end_date']));
        }
    }
    
    // Retornar o projeto atualizado com mensagem de sucesso
    sendResponse(200, $projectResponse);
}

/**
 * Desativa um projeto (soft delete)
 * 
 * @param object $supabase Cliente Supabase
 * @param string $userId ID do usuário autenticado
 */
function handleDeactivateProject($supabase, $userId) {
    // Obter ID do projeto da URL
    $requestUri = $_SERVER['REQUEST_URI'];
    $urlParts = explode('/', $requestUri);
    $projectId = end($urlParts);
    
    // Validar ID
    if (!$projectId || $projectId === 'projects') {
        sendResponse(400, ['error' => 'ID do projeto não fornecido']);
        return;
    }
    
    // Verificar se o projeto pertence ao usuário
    $checkResponse = $supabase->from('projects')
        ->select('id')
        ->filter('id', 'eq', $projectId)
        ->filter('user_id', 'eq', $userId)
        ->execute();
    
    if (count($checkResponse->getData()) === 0) {
        sendResponse(404, ['error' => 'Projeto não encontrado ou sem permissão']);
        return;
    }
    
    // Desativar projeto (soft delete)
    $response = $supabase->from('projects')
        ->update([
            'is_active' => false,
            'updated_at' => date('c')
        ])
        ->filter('id', 'eq', $projectId)
        ->execute();
    
    // Verificar se houve erro
    if ($response->getError()) {
        sendResponse(500, ['error' => 'Erro ao desativar projeto: ' . $response->getError()->getMessage()]);
        return;
    }
    
    // Buscar informações do projeto para melhorar a resposta
    $projectInfoResponse = $supabase->from('projects')
        ->select('name, company_id')
        ->filter('id', 'eq', $projectId)
        ->execute();
    
    $projectName = 'Projeto';
    $companyName = 'Desconhecida';
    
    if (!$projectInfoResponse->getError() && count($projectInfoResponse->getData()) > 0) {
        $projectInfo = $projectInfoResponse->getData()[0];
        $projectName = $projectInfo['name'];
        
        // Buscar o nome da empresa
        $companyResponse = $supabase->from('companies')
            ->select('name')
            ->filter('id', 'eq', $projectInfo['company_id'])
            ->execute();
        
        if (!$companyResponse->getError() && count($companyResponse->getData()) > 0) {
            $companyName = $companyResponse->getData()[0]['name'];
        }
    }
    
    // Retornar sucesso com detalhes
    sendResponse(200, [
        'success' => true, 
        'message' => 'Projeto desativado com sucesso',
        'details' => [
            'project_id' => $projectId,
            'project_name' => $projectName,
            'company' => $companyName,
            'deactivated_at' => date('d/m/Y H:i:s')
        ]
    ]);
}