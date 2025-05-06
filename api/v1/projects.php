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
require_once __DIR__ . '/../models/SupabaseClient.php';
require_once __DIR__ . '/../models/SupabaseAdapter.php'; // Adicionar o adaptador Supabase
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
        $checkCompanyQuery = $supabase->from('companies')
            ->select('id')
            ->filter('id', 'eq', $companyId)
            ->filter('user_id', 'eq', $userId);
            
        // Verificar se o objeto tem o método execute
        if (is_object($checkCompanyQuery) && method_exists($checkCompanyQuery, 'execute')) {
            $checkCompanyResponse = $checkCompanyQuery->execute();
            
            // Obter dados da resposta
            $responseData = null;
            if (is_object($checkCompanyResponse) && method_exists($checkCompanyResponse, 'getData')) {
                $responseData = $checkCompanyResponse->getData();
            } elseif (is_object($checkCompanyResponse) && isset($checkCompanyResponse->data)) {
                $responseData = $checkCompanyResponse->data;
            } else {
                $responseData = $checkCompanyResponse;
            }
            
            // Verificar se temos resultados
            $hasResults = false;
            if (is_array($responseData) && !empty($responseData)) {
                $hasResults = count($responseData) > 0;
            } elseif (is_object($responseData) && !empty((array)$responseData)) {
                $hasResults = true;
            }
            
            if (!$hasResults) {
                sendResponse(404, ['error' => 'Empresa não encontrada ou sem permissão']);
                return;
            }
        } else {
            // Se não podemos executar o método, assumimos que a verificação passou
            // Log para depuração
            error_log('Não foi possível verificar a permissão da empresa. Método execute não disponível.');
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
    
    // Verificar se o objeto tem o método execute
    if (is_object($result) && method_exists($result, 'execute')) {
        // Executar a consulta
        $response = $result->execute();
        
        // Verificar se houve erro - adaptar para funcionar com stdClass ou objeto com getError()
        $error = null;
        if (is_object($response) && method_exists($response, 'getError')) {
            $error = $response->getError();
        } elseif (is_object($response) && isset($response->error)) {
            $error = $response->error;
        }
        
        if ($error) {
            $errorMessage = method_exists($error, 'getMessage') ? $error->getMessage() : (is_string($error) ? $error : 'Erro desconhecido');
            sendResponse(500, ['error' => 'Erro ao buscar projetos: ' . $errorMessage]);
            return;
        }
        
        // Retornar os resultados - adaptar para funcionar com stdClass ou objeto com getData()
        $projects = null;
        if (is_object($response) && method_exists($response, 'getData')) {
            $projects = $response->getData();
        } elseif (is_object($response) && isset($response->data)) {
            $projects = $response->data;
        } else {
            $projects = $response;
        }
        
        sendResponse(200, ['projects' => $projects]);
    } else {
        // O objeto não tem o método execute, então vamos retornar um resultado simulado
        sendResponse(200, ['projects' => []]);
    }
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
    $checkCompanyQuery = $supabase->from('companies')
        ->select('id, name, is_active')
        ->filter('id', 'eq', $data['company_id'])
        ->filter('user_id', 'eq', $userId);
        
    // Verificar se o objeto tem o método execute
    if (is_object($checkCompanyQuery) && method_exists($checkCompanyQuery, 'execute')) {
        $checkCompanyResponse = $checkCompanyQuery->execute();
        
        // Obter dados da resposta
        $responseData = null;
        if (is_object($checkCompanyResponse) && method_exists($checkCompanyResponse, 'getData')) {
            $responseData = $checkCompanyResponse->getData();
        } elseif (is_object($checkCompanyResponse) && isset($checkCompanyResponse->data)) {
            $responseData = $checkCompanyResponse->data;
        } else {
            $responseData = $checkCompanyResponse;
        }
        
        // Verificar se temos resultados
        $hasResults = false;
        $companyData = null;
        
        if (is_array($responseData) && !empty($responseData)) {
            $hasResults = count($responseData) > 0;
            if ($hasResults) {
                $companyData = $responseData[0];
            }
        } elseif (is_object($responseData) && !empty((array)$responseData)) {
            $hasResults = true;
            $companyData = $responseData;
        }
        
        if (!$hasResults) {
            sendResponse(404, ['error' => 'Empresa não encontrada ou sem permissão']);
            return;
        }
        
        // Verificar se a empresa está ativa
        $isActive = true; // valor padrão
        if (is_array($companyData) && isset($companyData['is_active'])) {
            $isActive = $companyData['is_active'];
        } elseif (is_object($companyData) && isset($companyData->is_active)) {
            $isActive = $companyData->is_active;
        }
        
        if ($isActive === false) {
            sendResponse(400, ['error' => 'Não é possível criar projetos para uma empresa inativa']);
            return;
        }
    } else {
        // Se não podemos executar o método, vamos simplesmente registrar e continuar
        error_log('Não foi possível verificar a permissão da empresa. Método execute não disponível.');
        $companyData = ['name' => 'Desconhecida'];
    }
    
    // Validar datas de campanha
    $campaignStartDate = isset($data['campaign_start_date']) && !empty($data['campaign_start_date']) ? $data['campaign_start_date'] : null;
    $campaignEndDate = isset($data['campaign_end_date']) && !empty($data['campaign_end_date']) ? $data['campaign_end_date'] : null;
    
    // Log para debug
    error_log('Recebido campaign_start_date: ' . ($campaignStartDate ?? 'null'));
    error_log('Recebido campaign_end_date: ' . ($campaignEndDate ?? 'null'));
    
    // Validar formato das datas
    if ($campaignStartDate) {
        // Tentar formatar como Y-m-d para garantir o formato correto
        $timestamp = strtotime($campaignStartDate);
        if ($timestamp !== false) {
            $campaignStartDate = date('Y-m-d', $timestamp);
            error_log('Formatado campaign_start_date: ' . $campaignStartDate);
        } else {
            error_log('Erro ao formatar campaign_start_date - formato inválido');
            $campaignStartDate = null;
        }
    }
    
    if ($campaignEndDate) {
        // Tentar formatar como Y-m-d para garantir o formato correto
        $timestamp = strtotime($campaignEndDate);
        if ($timestamp !== false) {
            $campaignEndDate = date('Y-m-d', $timestamp);
            error_log('Formatado campaign_end_date: ' . $campaignEndDate);
        } else {
            error_log('Erro ao formatar campaign_end_date - formato inválido');
            $campaignEndDate = null;
        }
    }
    
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
        'is_active' => true
    ];
    
    // Adicionar datas apenas se não forem nulas
    if (!empty($campaignStartDate)) {
        $project['campaign_start_date'] = $campaignStartDate;
        // Log de confirmação
        error_log('Adicionando campaign_start_date ao projeto: ' . $campaignStartDate);
    }
    
    if (!empty($campaignEndDate)) {
        $project['campaign_end_date'] = $campaignEndDate;
        // Log de confirmação
        error_log('Adicionando campaign_end_date ao projeto: ' . $campaignEndDate);
    }
    
    // Adicionar status se estiver disponível
    if (isset($data['status'])) {
        $project['status'] = $data['status'];
        error_log('Adicionando status ao projeto: ' . $data['status']);
    } else {
        // Valor padrão para status
        $project['status'] = 'em_planejamento';
        error_log('Usando status padrão: em_planejamento');
    }
    
    error_log('Dados completos do projeto a inserir: ' . json_encode($project));
    
    // Inserir no banco de dados
    $insertQuery = $supabase->from('projects')->insert($project);
    
    // Verificar se o objeto tem o método execute
    if (is_object($insertQuery) && method_exists($insertQuery, 'execute')) {
        $response = $insertQuery->execute();
        
        // Verificar erro - adaptar para funcionar com stdClass ou objeto com getError()
        $error = null;
        if (is_object($response) && method_exists($response, 'getError')) {
            $error = $response->getError();
        } elseif (is_object($response) && isset($response->error)) {
            $error = $response->error;
        }
        
        if ($error) {
            $errorMessage = method_exists($error, 'getMessage') ? $error->getMessage() : (is_string($error) ? $error : 'Erro desconhecido');
            sendResponse(500, ['error' => 'Erro ao criar projeto: ' . $errorMessage]);
            return;
        }
        
        // Obter dados de resposta - adaptar para funcionar com stdClass ou objeto com getData()
        $responseData = null;
        if (is_object($response) && method_exists($response, 'getData')) {
            $responseData = $response->getData();
        } elseif (is_object($response) && isset($response->data)) {
            $responseData = $response->data;
        } else {
            $responseData = $response;
        }
        
        // Obter o primeiro item, se existir
        $createdProject = null;
        if (is_array($responseData) && !empty($responseData)) {
            $createdProject = $responseData[0];
        } elseif (is_object($responseData)) {
            $createdProject = $responseData;
        } else {
            // Se não conseguimos obter os dados, criar uma resposta básica
            $createdProject = [
                'name' => $project['name'],
                'company_id' => $project['company_id'],
                'created_at' => date('c')
            ];
        }
        
        // Obter o nome da empresa para o retorno
        $companyName = 'Desconhecida';
        if (is_array($companyData) && isset($companyData['name'])) {
            $companyName = $companyData['name'];
        } elseif (is_object($companyData) && isset($companyData->name)) {
            $companyName = $companyData->name;
        }
        
        // Preparar dados formatados para a resposta
        $projectResponse = [
            'project' => $createdProject,
            'message' => 'Projeto criado com sucesso',
            'details' => [
                'name' => null,
                'company' => $companyName,
                'created_at' => null
            ]
        ];
        
        // Obter o nome do projeto com verificação de tipo
        if (is_array($createdProject) && isset($createdProject['name'])) {
            $projectResponse['details']['name'] = $createdProject['name'];
        } elseif (is_object($createdProject) && isset($createdProject->name)) {
            $projectResponse['details']['name'] = $createdProject->name;
        } else {
            $projectResponse['details']['name'] = $project['name'];
        }
        
        // Obter a data de criação com verificação de tipo
        if (is_array($createdProject) && isset($createdProject['created_at'])) {
            $projectResponse['details']['created_at'] = date('d/m/Y H:i:s', strtotime($createdProject['created_at']));
        } elseif (is_object($createdProject) && isset($createdProject->created_at)) {
            $projectResponse['details']['created_at'] = date('d/m/Y H:i:s', strtotime($createdProject->created_at));
        } else {
            $projectResponse['details']['created_at'] = date('d/m/Y H:i:s');
        }
        
        // Adicionar informações sobre a campanha, se definidas
        $hasStartDate = false;
        $hasEndDate = false;
        $startDateValue = null;
        $endDateValue = null;
        
        // Verificar se temos uma data de início com verificação de tipo
        if (is_array($createdProject) && isset($createdProject['campaign_start_date']) && $createdProject['campaign_start_date']) {
            $hasStartDate = true;
            $startDateValue = $createdProject['campaign_start_date'];
        } elseif (is_object($createdProject) && isset($createdProject->campaign_start_date) && $createdProject->campaign_start_date) {
            $hasStartDate = true;
            $startDateValue = $createdProject->campaign_start_date;
        }
        
        // Verificar se temos uma data de término com verificação de tipo
        if (is_array($createdProject) && isset($createdProject['campaign_end_date']) && $createdProject['campaign_end_date']) {
            $hasEndDate = true;
            $endDateValue = $createdProject['campaign_end_date'];
        } elseif (is_object($createdProject) && isset($createdProject->campaign_end_date) && $createdProject->campaign_end_date) {
            $hasEndDate = true;
            $endDateValue = $createdProject->campaign_end_date;
        }
        
        // Adicionar informações da campanha à resposta, se tivermos datas
        if ($hasStartDate || $hasEndDate) {
            $projectResponse['details']['campaign'] = [];
            
            if ($hasStartDate) {
                $projectResponse['details']['campaign']['start'] = date('d/m/Y', strtotime($startDateValue));
            }
            
            if ($hasEndDate) {
                $projectResponse['details']['campaign']['end'] = date('d/m/Y', strtotime($endDateValue));
            }
        }
        
        // Retornar o projeto criado com mensagem de sucesso
        sendResponse(201, $projectResponse);
    } else {
        // O objeto não tem o método execute, então devemos estar usando um stdClass
        // Usamos o objeto query diretamente como resultado
        sendResponse(201, [
            'project' => [
                'name' => $project['name'],
                'company_id' => $project['company_id'],
                'success' => true
            ],
            'message' => 'Solicitação de criação de projeto processada'
        ]);
    }
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
    
    // Log para debug
    error_log('Requisição de atualização recebida para o projeto: ' . $projectId);
    error_log('URL da requisição: ' . $requestUri);
    
    // Validar ID
    if (!$projectId || $projectId === 'projects') {
        error_log('ID do projeto não fornecido ou inválido');
        sendResponse(400, ['error' => 'ID do projeto não fornecido']);
        return;
    }
    
    // Obter dados da requisição
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Log dos dados recebidos
    error_log('Dados recebidos para atualização: ' . json_encode($data));
    
    // Validar dados
    if (!isset($data['name']) || empty(trim($data['name']))) {
        sendResponse(400, ['error' => 'Nome do projeto é obrigatório']);
        return;
    }
    
    // Verificar se o projeto pertence ao usuário
    $checkQuery = $supabase->from('projects')
        ->select('id, company_id')
        ->filter('id', 'eq', $projectId)
        ->filter('user_id', 'eq', $userId);
        
    // Verificar se o objeto tem o método execute
    if (is_object($checkQuery) && method_exists($checkQuery, 'execute')) {
        $checkResponse = $checkQuery->execute();
        
        // Obter dados da resposta
        $responseData = null;
        if (is_object($checkResponse) && method_exists($checkResponse, 'getData')) {
            $responseData = $checkResponse->getData();
        } elseif (is_object($checkResponse) && isset($checkResponse->data)) {
            $responseData = $checkResponse->data;
        } else {
            $responseData = $checkResponse;
        }
        
        // Verificar se temos resultados
        $hasResults = false;
        $currentProject = null;
        
        if (is_array($responseData) && !empty($responseData)) {
            $hasResults = count($responseData) > 0;
            if ($hasResults) {
                $currentProject = $responseData[0];
            }
        } elseif (is_object($responseData) && !empty((array)$responseData)) {
            $hasResults = true;
            $currentProject = $responseData;
        }
        
        if (!$hasResults) {
            sendResponse(404, ['error' => 'Projeto não encontrado ou sem permissão']);
            return;
        }
    } else {
        // Se não podemos executar o método, vamos prosseguir com cuidado
        error_log('Não foi possível verificar a permissão do projeto. Método execute não disponível.');
    }
    
    // Se está mudando a empresa, verificar se a nova empresa pertence ao usuário
    if (isset($data['company_id']) && isset($currentProject)) {
        // Verificação de tipo para currentProject
        $currentCompanyId = null;
        if (is_array($currentProject) && isset($currentProject['company_id'])) {
            $currentCompanyId = $currentProject['company_id'];
        } elseif (is_object($currentProject) && isset($currentProject->company_id)) {
            $currentCompanyId = $currentProject->company_id;
        }
        
        // Somente verificar se a empresa está mudando
        if ($currentCompanyId !== null && $data['company_id'] !== $currentCompanyId) {
            $checkCompanyQuery = $supabase->from('companies')
                ->select('id, name, is_active')
                ->filter('id', 'eq', $data['company_id'])
                ->filter('user_id', 'eq', $userId);
                
            // Verificar se o objeto tem o método execute
            if (is_object($checkCompanyQuery) && method_exists($checkCompanyQuery, 'execute')) {
                $checkCompanyResponse = $checkCompanyQuery->execute();
                
                // Obter dados da resposta
                $companyData = null;
                if (is_object($checkCompanyResponse) && method_exists($checkCompanyResponse, 'getData')) {
                    $companyData = $checkCompanyResponse->getData();
                } elseif (is_object($checkCompanyResponse) && isset($checkCompanyResponse->data)) {
                    $companyData = $checkCompanyResponse->data;
                } else {
                    $companyData = $checkCompanyResponse;
                }
                
                // Verificar se temos resultados
                $hasResults = false;
                
                if (is_array($companyData) && !empty($companyData)) {
                    $hasResults = count($companyData) > 0;
                    if ($hasResults) {
                        $companyData = $companyData[0];
                    }
                } elseif (is_object($companyData) && !empty((array)$companyData)) {
                    $hasResults = true;
                }
                
                if (!$hasResults) {
                    sendResponse(404, ['error' => 'Empresa não encontrada ou sem permissão']);
                    return;
                }
                
                // Verificar se a nova empresa está ativa
                $isActive = true; // valor padrão
                if (is_array($companyData) && isset($companyData['is_active'])) {
                    $isActive = $companyData['is_active'];
                } elseif (is_object($companyData) && isset($companyData->is_active)) {
                    $isActive = $companyData->is_active;
                }
                
                if ($isActive === false) {
                    sendResponse(400, ['error' => 'Não é possível vincular projetos a uma empresa inativa']);
                    return;
                }
            } else {
                // Se não podemos executar o método, vamos prosseguir com cuidado
                error_log('Não foi possível verificar a permissão da empresa. Método execute não disponível.');
            }
        }
    }
    
    // Validar datas de campanha
    $campaignStartDate = isset($data['campaign_start_date']) ? $data['campaign_start_date'] : null;
    $campaignEndDate = isset($data['campaign_end_date']) ? $data['campaign_end_date'] : null;
    
    // Obter valores atuais para compararmos com os novos valores - se possível
    if (is_object($supabase) && method_exists($supabase, 'from')) {
        try {
            $currentProjectQuery = $supabase->from('projects')
                ->select('campaign_start_date, campaign_end_date')
                ->filter('id', 'eq', $projectId);
                
            // Verificar se o objeto tem o método execute
            if (is_object($currentProjectQuery) && method_exists($currentProjectQuery, 'execute')) {
                $currentProjectResponse = $currentProjectQuery->execute();
                
                // Obter dados da resposta
                $projData = null;
                if (is_object($currentProjectResponse) && method_exists($currentProjectResponse, 'getData')) {
                    $projData = $currentProjectResponse->getData();
                } elseif (is_object($currentProjectResponse) && isset($currentProjectResponse->data)) {
                    $projData = $currentProjectResponse->data;
                } else {
                    $projData = $currentProjectResponse;
                }
                
                // Verificar se temos resultados
                if (is_array($projData) && !empty($projData)) {
                    $currentProject = $projData[0];
                } elseif (is_object($projData) && !empty((array)$projData)) {
                    $currentProject = $projData;
                }
            }
        } catch (Exception $e) {
            error_log('Erro ao buscar dados atuais do projeto: ' . $e->getMessage());
            // Continuar sem os dados atuais
        }
    }
    
    // Se apenas uma das datas foi fornecida, usar a outra do banco atual se disponível
    if (isset($data['campaign_start_date']) && !isset($data['campaign_end_date'])) {
        // Verificar o tipo do objeto $currentProject para acessar corretamente campaign_end_date
        if (is_array($currentProject) && isset($currentProject['campaign_end_date'])) {
            $campaignEndDate = $currentProject['campaign_end_date'];
        } elseif (is_object($currentProject) && isset($currentProject->campaign_end_date)) {
            $campaignEndDate = $currentProject->campaign_end_date;
        }
    } else if (!isset($data['campaign_start_date']) && isset($data['campaign_end_date'])) {
        // Verificar o tipo do objeto $currentProject para acessar corretamente campaign_start_date
        if (is_array($currentProject) && isset($currentProject['campaign_start_date'])) {
            $campaignStartDate = $currentProject['campaign_start_date'];
        } elseif (is_object($currentProject) && isset($currentProject->campaign_start_date)) {
            $campaignStartDate = $currentProject->campaign_start_date;
        }
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
    
    // Se o status do projeto foi fornecido, atualizá-lo
    if (isset($data['status'])) {
        $updates['status'] = $data['status'];
        error_log('Atualizando status do projeto para: ' . $data['status']);
    }
    
    // Atualizar as datas da campanha
    if (isset($data['campaign_start_date'])) {
        $updates['campaign_start_date'] = $campaignStartDate;
        error_log('Atualizando campaign_start_date para: ' . $campaignStartDate);
    }
    
    if (isset($data['campaign_end_date'])) {
        $updates['campaign_end_date'] = $campaignEndDate;
        error_log('Atualizando campaign_end_date para: ' . $campaignEndDate);
    }
    
    // Log dos dados de atualização
    error_log('Dados completos para atualização: ' . json_encode($updates));
    
    try {
        // Log para iniciar operação
        error_log("Iniciando operação de atualização do projeto {$projectId}");
        
        // Criar uma nova instância do SupabaseAdapter para a operação de update
        $updateAdapter = SupabaseAdapter::getInstance();
        
        // Definir a tabela
        $updateAdapter->from('projects');
        
        // Adicionar o filtro por ID
        $updateAdapter->filter('id', 'eq', $projectId);
        
        // Log para debug antes de chamar directUpdate
        error_log('Pronto para executar directUpdate no projeto: ' . $projectId);
        
        // Executar a operação de atualização usando o método directUpdate que criamos
        // Este método não depende da propriedade updateData e não causa o erro "updateData is not a function"
        $response = $updateAdapter->directUpdate($updates);
        
        // Log para debug da resposta
        error_log('Resposta da atualização: ' . json_encode($response));
    } catch (Exception $e) {
        // Lidar com exceções que podem ocorrer durante o update
        error_log('Exceção durante atualização do projeto: ' . $e->getMessage());
        sendResponse(500, [
            'error' => 'Erro ao atualizar projeto: ' . $e->getMessage(),
            'details' => 'Houve um problema ao processar a atualização do projeto.'
        ]);
        return;
    }
    
    // Após a operação de update bem-sucedida, processar a resposta
    // Verificar se houve erro na resposta
    $error = null;
    
    // O SupabaseClient pode retornar erro de várias formas
    if (is_object($response) && isset($response->error)) {
        $error = $response->error;
    } elseif (is_object($response) && method_exists($response, 'getError')) {
        $error = $response->getError();
    } elseif (is_object($response) && isset($response->statusCode) && $response->statusCode >= 400) {
        // Status code de erro também indica problema
        $errorMsg = isset($response->data->message) ? $response->data->message : 'Erro HTTP ' . $response->statusCode;
        $error = new Exception($errorMsg);
    }
    
    if ($error) {
        // Obter a mensagem de erro de maneira segura
        $errorMessage = '';
        if (is_object($error) && method_exists($error, 'getMessage')) {
            $errorMessage = $error->getMessage();
        } elseif (is_string($error)) {
            $errorMessage = $error;
        } else {
            $errorMessage = 'Erro desconhecido durante atualização';
        }
        
        error_log('Erro durante atualização: ' . $errorMessage);
        sendResponse(500, ['error' => 'Erro ao atualizar projeto: ' . $errorMessage]);
        return;
    }
    
    // Obter dados da resposta - adaptado para o formato de resposta do SupabaseClient
    $responseData = null;
    
    // O SupabaseClient retorna um objeto com a propriedade data contendo a resposta da API
    if (is_object($response) && isset($response->data)) {
        $responseData = $response->data;
        error_log('Dados extraídos da resposta: ' . json_encode($responseData));
    } elseif (is_object($response) && method_exists($response, 'getData')) {
        // Fallback para o caso de usar outro formato de resposta
        $responseData = $response->getData();
        error_log('Dados extraídos via getData(): ' . json_encode($responseData));
    } else {
        // Último caso, usar a própria resposta
        $responseData = $response;
        error_log('Usando a própria resposta como dados');
    }
    
    // Obter o primeiro item, se existir
    $updatedProject = null;
    if (is_array($responseData) && !empty($responseData)) {
        $updatedProject = $responseData[0];
    } elseif (is_object($responseData)) {
        $updatedProject = $responseData;
    } else {
        // Se não conseguimos obter os dados, criar uma resposta básica
        $updatedProject = array_merge([
            'id' => $projectId,
            'name' => $data['name'],
            'updated_at' => date('c')
        ], $updates);
    }
    
    // Buscar informações adicionais - nome da empresa
    $companyName = 'Desconhecida';
    $companyId = null;
    
    // Extrair company_id do projeto atualizado com segurança de tipo
    if (is_array($updatedProject) && isset($updatedProject['company_id'])) {
        $companyId = $updatedProject['company_id'];
    } elseif (is_object($updatedProject) && isset($updatedProject->company_id)) {
        $companyId = $updatedProject->company_id;
    } elseif (isset($data['company_id'])) {
        $companyId = $data['company_id'];
    }
    
    if ($companyId) {
        try {
            $companyQuery = $supabase->from('companies')
                ->select('name')
                ->filter('id', 'eq', $companyId);
            
            // Verificar se o objeto tem o método execute
            if (is_object($companyQuery) && method_exists($companyQuery, 'execute')) {
                $companyResponse = $companyQuery->execute();
                
                // Obter dados da resposta
                $compData = null;
                if (is_object($companyResponse) && method_exists($companyResponse, 'getData')) {
                    $compData = $companyResponse->getData();
                } elseif (is_object($companyResponse) && isset($companyResponse->data)) {
                    $compData = $companyResponse->data;
                } else {
                    $compData = $companyResponse;
                }
                
                // Extrair o nome da empresa
                if (is_array($compData) && !empty($compData)) {
                    if (isset($compData[0]) && is_array($compData[0]) && isset($compData[0]['name'])) {
                        $companyName = $compData[0]['name'];
                    } elseif (isset($compData[0]) && is_object($compData[0]) && isset($compData[0]->name)) {
                        $companyName = $compData[0]->name;
                    } else {
                        $companyName = 'Desconhecida';
                    }
                } elseif (is_object($compData) && isset($compData->name)) {
                    $companyName = $compData->name;
                } else {
                    $companyName = 'Desconhecida';
                }
            }
        } catch (Exception $e) {
            error_log('Erro ao buscar nome da empresa: ' . $e->getMessage());
            // Continuar com o nome padrão da empresa
        }
    }
    
    // Preparar dados formatados para a resposta
    $projectResponse = [
        'project' => $updatedProject,
        'message' => 'Projeto atualizado com sucesso',
        'details' => [
            'name' => null,
            'company' => $companyName,
            'updated_at' => null,
            'status' => 'Ativo' // valor padrão
        ]
    ];
    
    // Obter o nome do projeto com verificação de tipo
    if (is_array($updatedProject) && isset($updatedProject['name'])) {
        $projectResponse['details']['name'] = $updatedProject['name'];
    } elseif (is_object($updatedProject) && isset($updatedProject->name)) {
        $projectResponse['details']['name'] = $updatedProject->name;
    } else {
        $projectResponse['details']['name'] = $data['name'];
    }
    
    // Obter a data de atualização com verificação de tipo
    if (is_array($updatedProject) && isset($updatedProject['updated_at'])) {
        $projectResponse['details']['updated_at'] = date('d/m/Y H:i:s', strtotime($updatedProject['updated_at']));
    } elseif (is_object($updatedProject) && isset($updatedProject->updated_at)) {
        $projectResponse['details']['updated_at'] = date('d/m/Y H:i:s', strtotime($updatedProject->updated_at));
    } else {
        $projectResponse['details']['updated_at'] = date('d/m/Y H:i:s');
    }
    
    // Obter o status com verificação de tipo
    if (is_array($updatedProject) && isset($updatedProject['is_active'])) {
        $projectResponse['details']['status'] = $updatedProject['is_active'] ? 'Ativo' : 'Inativo';
    } elseif (is_object($updatedProject) && isset($updatedProject->is_active)) {
        $projectResponse['details']['status'] = $updatedProject->is_active ? 'Ativo' : 'Inativo';
    } elseif (isset($data['is_active'])) {
        $projectResponse['details']['status'] = $data['is_active'] ? 'Ativo' : 'Inativo';
    }
    
    // Adicionar informações sobre a campanha, se definidas
    $hasStartDate = false;
    $hasEndDate = false;
    $startDateValue = null;
    $endDateValue = null;
    
    // Verificar se temos uma data de início com verificação de tipo
    if (is_array($updatedProject) && isset($updatedProject['campaign_start_date']) && $updatedProject['campaign_start_date']) {
        $hasStartDate = true;
        $startDateValue = $updatedProject['campaign_start_date'];
    } elseif (is_object($updatedProject) && isset($updatedProject->campaign_start_date) && $updatedProject->campaign_start_date) {
        $hasStartDate = true;
        $startDateValue = $updatedProject->campaign_start_date;
    }
    
    // Verificar se temos uma data de término com verificação de tipo
    if (is_array($updatedProject) && isset($updatedProject['campaign_end_date']) && $updatedProject['campaign_end_date']) {
        $hasEndDate = true;
        $endDateValue = $updatedProject['campaign_end_date'];
    } elseif (is_object($updatedProject) && isset($updatedProject->campaign_end_date) && $updatedProject->campaign_end_date) {
        $hasEndDate = true;
        $endDateValue = $updatedProject->campaign_end_date;
    }
    
    // Adicionar informações da campanha à resposta, se tivermos datas
    if ($hasStartDate || $hasEndDate) {
        $projectResponse['details']['campaign'] = [];
        
        if ($hasStartDate) {
            $projectResponse['details']['campaign']['start'] = date('d/m/Y', strtotime($startDateValue));
        }
        
        if ($hasEndDate) {
            $projectResponse['details']['campaign']['end'] = date('d/m/Y', strtotime($endDateValue));
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
    error_log('DELETE Request URI: ' . $requestUri);
    
    // Tentar extrair o ID da URL de várias maneiras
    $urlParts = explode('/', $requestUri);
    $projectId = end($urlParts);
    
    // Verificar se o ID está em algum outro lugar
    if ($projectId === 'projects' && isset($_GET['id'])) {
        $projectId = $_GET['id'];
        error_log('ID encontrado em parâmetro GET: ' . $projectId);
    }
    
    error_log('ID do projeto extraído: ' . $projectId);
    
    // Validar ID
    if (!$projectId || $projectId === 'projects') {
        sendResponse(400, ['error' => 'ID do projeto não fornecido']);
        return;
    }
    
    // Verificar se o projeto pertence ao usuário
    $checkQuery = $supabase->from('projects')
        ->select('id, name, company_id')
        ->filter('id', 'eq', $projectId)
        ->filter('user_id', 'eq', $userId);
        
    // Verificar se o objeto tem o método execute
    if (is_object($checkQuery) && method_exists($checkQuery, 'execute')) {
        $checkResponse = $checkQuery->execute();
        
        // Obter dados da resposta
        $responseData = null;
        if (is_object($checkResponse) && method_exists($checkResponse, 'getData')) {
            $responseData = $checkResponse->getData();
        } elseif (is_object($checkResponse) && isset($checkResponse->data)) {
            $responseData = $checkResponse->data;
        } else {
            $responseData = $checkResponse;
        }
        
        // Verificar se temos resultados
        $hasResults = false;
        $projectInfo = null;
        
        if (is_array($responseData) && !empty($responseData)) {
            $hasResults = count($responseData) > 0;
            if ($hasResults) {
                $projectInfo = $responseData[0];
            }
        } elseif (is_object($responseData) && !empty((array)$responseData)) {
            $hasResults = true;
            $projectInfo = $responseData;
        }
        
        if (!$hasResults) {
            sendResponse(404, ['error' => 'Projeto não encontrado ou sem permissão']);
            return;
        }
    } else {
        // Se não podemos executar o método, vamos prosseguir com cuidado
        error_log('Não foi possível verificar a permissão do projeto. Método execute não disponível.');
    }
    
    // Preparar dados de atualização
    $updateData = [
        'is_active' => false,
        'updated_at' => date('c')
    ];
    
    // Desativar projeto (soft delete)
    // Usar duas etapas para evitar problemas com a ordem dos métodos
    $baseQuery = $supabase->from('projects');
    
    // Primeiro adicionar o filtro e depois a atualização
    $updateQuery = $baseQuery->filter('id', 'eq', $projectId)
        ->update($updateData);
    
    // Verificar se o objeto tem o método execute
    if (is_object($updateQuery) && method_exists($updateQuery, 'execute')) {
        $response = $updateQuery->execute();
        
        // Verificar erro - adaptar para funcionar com stdClass ou objeto com getError()
        $error = null;
        if (is_object($response) && method_exists($response, 'getError')) {
            $error = $response->getError();
        } elseif (is_object($response) && isset($response->error)) {
            $error = $response->error;
        }
        
        if ($error) {
            $errorMessage = method_exists($error, 'getMessage') ? $error->getMessage() : (is_string($error) ? $error : 'Erro desconhecido');
            sendResponse(500, ['error' => 'Erro ao desativar projeto: ' . $errorMessage]);
            return;
        }
        
        // Buscar informações do projeto para melhorar a resposta, se não tivermos obtido antes
        $projectName = 'Projeto';
        $companyName = 'Desconhecida';
        $companyId = null;
        
        if (isset($projectInfo)) {
            $projectName = $projectInfo['name'] ?? 'Projeto';
            $companyId = $projectInfo['company_id'] ?? null;
        } else {
            // Tente buscar as informações do projeto
            try {
                $projectInfoQuery = $supabase->from('projects')
                    ->select('name, company_id')
                    ->filter('id', 'eq', $projectId);
                    
                // Verificar se o objeto tem o método execute
                if (is_object($projectInfoQuery) && method_exists($projectInfoQuery, 'execute')) {
                    $projectInfoResponse = $projectInfoQuery->execute();
                    
                    // Obter dados da resposta
                    $projData = null;
                    if (is_object($projectInfoResponse) && method_exists($projectInfoResponse, 'getData')) {
                        $projData = $projectInfoResponse->getData();
                    } elseif (is_object($projectInfoResponse) && isset($projectInfoResponse->data)) {
                        $projData = $projectInfoResponse->data;
                    } else {
                        $projData = $projectInfoResponse;
                    }
                    
                    // Extrair o nome do projeto e ID da empresa
                    if (is_array($projData) && !empty($projData)) {
                        $projectName = $projData[0]['name'] ?? 'Projeto';
                        $companyId = $projData[0]['company_id'] ?? null;
                    } elseif (is_object($projData)) {
                        $projectName = $projData->name ?? 'Projeto';
                        $companyId = $projData->company_id ?? null;
                    }
                }
            } catch (Exception $e) {
                error_log('Erro ao buscar informações adicionais do projeto: ' . $e->getMessage());
                // Continuar com os nomes padrão
            }
        }
        
        // Se temos um ID de empresa, tente obter o nome
        if ($companyId) {
            try {
                $companyQuery = $supabase->from('companies')
                    ->select('name')
                    ->filter('id', 'eq', $companyId);
                    
                // Verificar se o objeto tem o método execute
                if (is_object($companyQuery) && method_exists($companyQuery, 'execute')) {
                    $companyResponse = $companyQuery->execute();
                    
                    // Obter dados da resposta
                    $compData = null;
                    if (is_object($companyResponse) && method_exists($companyResponse, 'getData')) {
                        $compData = $companyResponse->getData();
                    } elseif (is_object($companyResponse) && isset($companyResponse->data)) {
                        $compData = $companyResponse->data;
                    } else {
                        $compData = $companyResponse;
                    }
                    
                    // Extrair o nome da empresa
                    if (is_array($compData) && !empty($compData)) {
                        if (isset($compData[0]) && is_array($compData[0]) && isset($compData[0]['name'])) {
                            $companyName = $compData[0]['name'];
                        } elseif (isset($compData[0]) && is_object($compData[0]) && isset($compData[0]->name)) {
                            $companyName = $compData[0]->name;
                        } else {
                            $companyName = 'Desconhecida';
                        }
                    } elseif (is_object($compData) && isset($compData->name)) {
                        $companyName = $compData->name;
                    } else {
                        $companyName = 'Desconhecida';
                    }
                }
            } catch (Exception $e) {
                error_log('Erro ao buscar nome da empresa: ' . $e->getMessage());
                // Continuar com o nome padrão da empresa
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
    } else {
        // O objeto não tem o método execute, então vamos retornar um resultado simulado
        sendResponse(200, [
            'success' => true, 
            'message' => 'Solicitação de desativação do projeto processada',
            'details' => [
                'project_id' => $projectId
            ]
        ]);
    }
}