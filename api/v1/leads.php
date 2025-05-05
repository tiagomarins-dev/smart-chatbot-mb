<?php
/**
 * API para gerenciamento de leads
 * 
 * Endpoints:
 * - GET /api/v1/leads - Lista todos os leads
 * - GET /api/v1/leads?id={id} - Busca um lead específico
 * - GET /api/v1/leads?project_id={project_id} - Lista leads de um projeto
 * - GET /api/v1/leads?email={email} - Busca um lead pelo email
 * - POST /api/v1/leads - Captura um novo lead
 */

// Carregar dependências
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../models/Database.php';
require_once __DIR__ . '/../models/SupabaseClient.php';
require_once __DIR__ . '/../middleware/auth-rest.php'; // Usando a versão REST da autenticação

/**
 * Função recursiva para buscar um ID em qualquer estrutura de objeto
 * Procura propriedades chamadas 'id' ou que terminam com '_id' em todos os níveis
 * 
 * @param mixed $obj Objeto ou array a ser inspecionado
 * @param int $depth Profundidade atual da recursão (para evitar loops infinitos)
 * @return string|null ID encontrado ou null se não encontrar
 */
function findIdInObject($obj, $depth = 0) {
    // Evitar recursão infinita
    if ($depth > 10) {
        return null;
    }
    
    // Caso base: nulo ou primitivo
    if ($obj === null || is_scalar($obj)) {
        // Se for string que parece UUID, retornar
        if (is_string($obj) && preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $obj)) {
            return $obj;
        }
        return null;
    }
    
    // Caso objeto
    if (is_object($obj)) {
        // Verificar propriedades comuns para ID
        if (isset($obj->id)) {
            return $obj->id;
        }
        
        // Verificar outras propriedades que podem conter IDs
        foreach ((array)$obj as $key => $value) {
            // Verificar se o nome da propriedade parece ser um ID
            if ($key === 'id' || $key === 'ID' || 
                strpos($key, '_id') !== false || 
                strpos($key, 'ID') !== false || 
                strpos($key, 'Id') !== false) {
                
                if ($value !== null && (is_string($value) || is_numeric($value))) {
                    return $value;
                }
            }
            
            // Recursão: verificar objetos e arrays aninhados
            $foundId = findIdInObject($value, $depth + 1);
            if ($foundId) {
                return $foundId;
            }
        }
    }
    
    // Caso array
    if (is_array($obj)) {
        // Verifica se é um array associativo com chave 'id'
        if (isset($obj['id'])) {
            return $obj['id'];
        }
        
        // Verificar primeiro elemento (comum para retornos de inserção)
        if (!empty($obj) && isset($obj[0])) {
            // Se for objeto/array, verificar propriedade id
            if (is_object($obj[0]) && isset($obj[0]->id)) {
                return $obj[0]->id;
            } elseif (is_array($obj[0]) && isset($obj[0]['id'])) {
                return $obj[0]['id'];
            } elseif (is_string($obj[0]) && preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $obj[0])) {
                // String que parece UUID
                return $obj[0];
            }
        }
        
        // Recursão para todos os elementos do array
        foreach ($obj as $key => $value) {
            // Recursão: verificar objetos e arrays aninhados
            $foundId = findIdInObject($value, $depth + 1);
            if ($foundId) {
                return $foundId;
            }
        }
    }
    
    return null;
}

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

// Verificar se é uma rota especial
$requestURI = $_SERVER['REQUEST_URI'];
$statsEndpoint = strpos($requestURI, '/api/v1/leads/stats') !== false;
$statusEndpoint = preg_match('/\/api\/v1\/leads\/(\w+)\/status/', $requestURI, $matches);

if ($statsEndpoint && $method === 'GET') {
    // Obter estatísticas de leads
    handleLeadStats($supabase, $userId);
} elseif ($statusEndpoint && $method === 'PUT') {
    // Atualizar status de um lead
    handleUpdateLeadStatus($supabase, $userId, $matches[1]);
} else {
    switch ($method) {
        case 'GET':
            // Listar leads ou obter lead específico
            handleGetLeads($supabase, $userId);
            break;

        case 'POST':
            // Capturar novo lead
            handleCaptureLead($supabase, $userId);
            break;

        default:
            sendResponse(405, ['error' => 'Método não permitido']);
            break;
    }
}

/**
 * Lista leads com base nos filtros fornecidos
 * 
 * @param object $supabase Cliente Supabase
 * @param string $userId ID do usuário autenticado
 */
function handleGetLeads($supabase, $userId) {
    // Verificar se há filtros na requisição
    $leadId = isset($_GET['id']) ? $_GET['id'] : null;
    $projectId = isset($_GET['project_id']) ? $_GET['project_id'] : null;
    $email = isset($_GET['email']) ? $_GET['email'] : null;
    
    // Consulta principal para a tabela leads
    $query = $supabase->from('leads')
        ->select('id, name, first_name, email, phone, status, notes, created_at, updated_at');
        
    // Filtrar por usuário para garantir segurança
    $query = $query->filter('user_id', 'eq', $userId);
    
    // Aplicar filtros específicos
    if ($leadId) {
        $query = $query->filter('id', 'eq', $leadId);
    }
    
    if ($email) {
        $query = $query->filter('email', 'eq', $email);
    }
    
    // Verificar se o objeto tem o método execute
    if (is_object($query) && method_exists($query, 'execute')) {
        $response = $query->execute();
        
        // Verificar se houve erro - adaptar para funcionar com stdClass ou objeto com getError()
        $error = null;
        if (is_object($response) && method_exists($response, 'getError')) {
            $error = $response->getError();
        } elseif (is_object($response) && isset($response->error)) {
            $error = $response->error;
        }
        
        if ($error) {
            $errorMessage = method_exists($error, 'getMessage') ? $error->getMessage() : (is_string($error) ? $error : 'Erro desconhecido');
            sendResponse(500, ['error' => 'Erro ao buscar leads: ' . $errorMessage]);
            return;
        }
        
        // Retornar os resultados - adaptar para funcionar com stdClass ou objeto com getData()
        $leads = null;
        if (is_object($response) && method_exists($response, 'getData')) {
            $leads = $response->getData();
        } elseif (is_object($response) && isset($response->data)) {
            $leads = $response->data;
        } else {
            $leads = $response;
        }
        
        // Se filtrado por projeto, consultar a tabela lead_project
        if ($projectId) {
            // Consultar lead_project para obter IDs de leads associados ao projeto
            $leadProjectQuery = $supabase->from('lead_project')
                ->select('lead_id')
                ->filter('project_id', 'eq', $projectId);
                
            // Verificar se o objeto tem o método execute
            if (is_object($leadProjectQuery) && method_exists($leadProjectQuery, 'execute')) {
                $leadProjectResponse = $leadProjectQuery->execute();
                
                // Obter dados da resposta
                $leadProjectData = null;
                if (is_object($leadProjectResponse) && method_exists($leadProjectResponse, 'getData')) {
                    $leadProjectData = $leadProjectResponse->getData();
                } elseif (is_object($leadProjectResponse) && isset($leadProjectResponse->data)) {
                    $leadProjectData = $leadProjectResponse->data;
                } else {
                    $leadProjectData = $leadProjectResponse;
                }
                
                // Extrair IDs de lead da resposta
                $leadIds = [];
                if (is_array($leadProjectData)) {
                    foreach ($leadProjectData as $item) {
                        if (is_array($item) && isset($item['lead_id'])) {
                            $leadIds[] = $item['lead_id'];
                        } elseif (is_object($item) && isset($item->lead_id)) {
                            $leadIds[] = $item->lead_id;
                        }
                    }
                }
                
                // Filtrar os leads pelos IDs encontrados
                if (is_array($leads)) {
                    $leads = array_filter($leads, function($lead) use ($leadIds) {
                        $leadId = null;
                        if (is_array($lead) && isset($lead['id'])) {
                            $leadId = $lead['id'];
                        } elseif (is_object($lead) && isset($lead->id)) {
                            $leadId = $lead->id;
                        }
                        return in_array($leadId, $leadIds);
                    });
                    
                    // Reindexar array após o filtro
                    $leads = array_values($leads);
                }
            }
        }
        
        sendResponse(200, ['leads' => $leads]);
    } else {
        // O objeto não tem o método execute, então vamos retornar um resultado simulado
        sendResponse(200, ['leads' => [], 'warning' => 'Método de execução não disponível.']);
    }
}

/**
 * Captura um novo lead
 * 
 * @param object $supabase Cliente Supabase
 * @param string $userId ID do usuário autenticado
 */
function handleCaptureLead($supabase, $userId) {
    // Obter dados da requisição
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validar dados obrigatórios
    if (!isset($data['name']) || empty(trim($data['name']))) {
        sendResponse(400, ['error' => 'Nome do lead é obrigatório']);
        return;
    }
    
    if (!isset($data['email']) || empty(trim($data['email']))) {
        sendResponse(400, ['error' => 'Email do lead é obrigatório']);
        return;
    }
    
    if (!isset($data['phone']) || empty(trim($data['phone']))) {
        sendResponse(400, ['error' => 'Telefone do lead é obrigatório']);
        return;
    }
    
    if (!isset($data['project_id']) || empty($data['project_id'])) {
        sendResponse(400, ['error' => 'ID do projeto é obrigatório']);
        return;
    }
    
    // Formatar o número de telefone (remover caracteres não numéricos)
    $phone = preg_replace('/[^0-9]/', '', $data['phone']);
    
    // Caso não tenha sido fornecido o first_name, extrair da primeira string do name
    $firstName = isset($data['first_name']) && !empty(trim($data['first_name'])) 
        ? trim($data['first_name']) 
        : explode(' ', trim($data['name']))[0];
    
    // Verificar se o projeto existe e pertence ao usuário
    $checkProjectQuery = $supabase->from('projects')
        ->select('id, name')
        ->filter('id', 'eq', $data['project_id'])
        ->filter('user_id', 'eq', $userId);
        
    // Verificar se o objeto tem o método execute
    if (is_object($checkProjectQuery) && method_exists($checkProjectQuery, 'execute')) {
        $checkProjectResponse = $checkProjectQuery->execute();
    } else {
        // Quando o checkProjectQuery é direto (sem método execute), ele já é a resposta da operação
        $checkProjectResponse = $checkProjectQuery;
    }
    
    // Para debug
    error_log('Tipo da resposta de verificação de projeto: ' . gettype($checkProjectResponse));
    if (is_object($checkProjectResponse)) {
        error_log('Classe da resposta: ' . get_class($checkProjectResponse));
        error_log('Propriedades disponíveis: ' . implode(', ', array_keys((array)$checkProjectResponse)));
    }
    
    // Inicializar variáveis de resultado
    $hasResults = false;
    $projectName = 'Desconhecido';
    
    // Variante 1: Objeto com método getData()
    if (is_object($checkProjectResponse) && method_exists($checkProjectResponse, 'getData')) {
        $projectData = $checkProjectResponse->getData();
        if (is_array($projectData) && !empty($projectData)) {
            $hasResults = true;
            if (isset($projectData[0]['name'])) {
                $projectName = $projectData[0]['name'];
            } elseif (isset($projectData[0]) && is_object($projectData[0]) && isset($projectData[0]->name)) {
                $projectName = $projectData[0]->name;
            }
        }
    }
    // Variante 2: Objeto com propriedade data
    elseif (is_object($checkProjectResponse) && isset($checkProjectResponse->data)) {
        $projectData = $checkProjectResponse->data;
        if (is_array($projectData) && !empty($projectData)) {
            $hasResults = true;
            if (isset($projectData[0])) {
                if (is_object($projectData[0]) && isset($projectData[0]->name)) {
                    $projectName = $projectData[0]->name;
                } elseif (is_array($projectData[0]) && isset($projectData[0]['name'])) {
                    $projectName = $projectData[0]['name'];
                }
            }
        } elseif (is_object($projectData) && isset($projectData->name)) {
            $hasResults = true;
            $projectName = $projectData->name;
        }
    }
    // Variante 3: Resposta é diretamente um array
    elseif (is_array($checkProjectResponse) && !empty($checkProjectResponse)) {
        $hasResults = true;
        if (isset($checkProjectResponse[0])) {
            if (is_array($checkProjectResponse[0]) && isset($checkProjectResponse[0]['name'])) {
                $projectName = $checkProjectResponse[0]['name'];
            } elseif (is_object($checkProjectResponse[0]) && isset($checkProjectResponse[0]->name)) {
                $projectName = $checkProjectResponse[0]->name;
            }
        }
    }
    // Variante 4: Objeto contendo diretamente a propriedade name
    elseif (is_object($checkProjectResponse) && isset($checkProjectResponse->name)) {
        $hasResults = true;
        $projectName = $checkProjectResponse->name;
    }
    
    if (!$hasResults) {
        error_log('Nenhum resultado encontrado para o projeto ID: ' . $data['project_id'] . ' e usuário ID: ' . $userId);
        error_log('Resposta completa: ' . json_encode($checkProjectResponse));
        sendResponse(404, ['error' => 'Projeto não encontrado ou sem permissão']);
        return;
    }
    
    // Verificar se o lead já existe com o mesmo email
    $checkLeadQuery = $supabase->from('leads')
        ->select('id')
        ->filter('email', 'eq', trim($data['email']))
        ->filter('user_id', 'eq', $userId);
        
    // IDs para controle de transação
    $leadId = null;
    $existingLead = false;
    
    // Verificar se o objeto tem o método execute
    if (is_object($checkLeadQuery) && method_exists($checkLeadQuery, 'execute')) {
        $checkLeadResponse = $checkLeadQuery->execute();
    } else {
        // Quando o checkLeadQuery é direto (sem método execute), ele já é a resposta da operação
        $checkLeadResponse = $checkLeadQuery;
        
        // Para debug
        error_log('Tipo da resposta direta de check lead: ' . gettype($checkLeadResponse));
        if (is_object($checkLeadResponse)) {
            error_log('Classe da resposta direta: ' . get_class($checkLeadResponse));
            error_log('Propriedades disponíveis: ' . implode(', ', array_keys((array)$checkLeadResponse)));
        }
    }
    
    // Obter dados da resposta
    $leadData = null;
    if (is_object($checkLeadResponse) && method_exists($checkLeadResponse, 'getData')) {
        $leadData = $checkLeadResponse->getData();
    } elseif (is_object($checkLeadResponse) && isset($checkLeadResponse->data)) {
        $leadData = $checkLeadResponse->data;
    } else {
        $leadData = $checkLeadResponse;
    }
    
    // Verificar se o lead já existe usando uma abordagem mais segura para tipos
    if (is_array($leadData) && !empty($leadData)) {
        if (isset($leadData[0])) {
            if (is_array($leadData[0]) && isset($leadData[0]['id'])) {
                $leadId = $leadData[0]['id'];
                $existingLead = true;
            } elseif (is_object($leadData[0]) && isset($leadData[0]->id)) {
                $leadId = $leadData[0]->id;
                $existingLead = true;
            }
        }
    } elseif (is_object($leadData)) {
        // Caso seja um objeto stdClass
        if (isset($leadData->id)) {
            $leadId = $leadData->id;
            $existingLead = true;
        } elseif (isset($leadData->data)) {
            // Objeto com propriedade data
            $dataProperty = $leadData->data;
            if (is_array($dataProperty) && !empty($dataProperty)) {
                if (isset($dataProperty[0])) {
                    if (is_object($dataProperty[0]) && isset($dataProperty[0]->id)) {
                        $leadId = $dataProperty[0]->id;
                        $existingLead = true;
                    } elseif (is_array($dataProperty[0]) && isset($dataProperty[0]['id'])) {
                        $leadId = $dataProperty[0]['id'];
                        $existingLead = true;
                    }
                }
            } elseif (is_object($dataProperty) && isset($dataProperty->id)) {
                $leadId = $dataProperty->id;
                $existingLead = true;
            }
        }
    } elseif (is_object($checkLeadResponse) && isset($checkLeadResponse->data)) {
        // Trabalhar diretamente com a resposta
        $checkData = $checkLeadResponse->data;
        if (is_array($checkData) && !empty($checkData)) {
            if (isset($checkData[0])) {
                if (is_object($checkData[0]) && isset($checkData[0]->id)) {
                    $leadId = $checkData[0]->id;
                    $existingLead = true;
                } elseif (is_array($checkData[0]) && isset($checkData[0]['id'])) {
                    $leadId = $checkData[0]['id'];
                    $existingLead = true;
                }
            }
        } elseif (is_object($checkData) && isset($checkData->id)) {
            $leadId = $checkData->id;
            $existingLead = true;
        }
    }
    
    // Se o lead não existe, criar um novo
    if (!$existingLead) {
        $lead = [
            'user_id' => $userId,
            'name' => trim($data['name']),
            'first_name' => $firstName,
            'email' => trim($data['email']),
            'phone' => $phone,
            'status' => 'novo',
            'notes' => isset($data['notes']) ? trim($data['notes']) : null
            // created_at e updated_at serão adicionados automaticamente pelo Supabase
        ];
        
        // Inserir lead no banco de dados
        $insertQuery = $supabase->from('leads')->insert($lead);
        
        // Verificar se o objeto tem o método execute
        if (is_object($insertQuery) && method_exists($insertQuery, 'execute')) {
            $response = $insertQuery->execute();
        } else {
            // Quando o insertQuery é direto (sem método execute), ele já é a resposta da operação
            $response = $insertQuery;
            
            // Para debug
            error_log('Tipo da resposta direta de insert: ' . gettype($response));
            if (is_object($response)) {
                error_log('Classe da resposta direta: ' . get_class($response));
                $responseProps = (array)$response;
                error_log('Propriedades disponíveis: ' . json_encode(array_keys($responseProps)));
                error_log('Conteúdo da resposta: ' . json_encode($response));
                
                // Verificação adicional para formato específico da resposta
                if (isset($response->error)) {
                    error_log('Erro encontrado na resposta: ' . json_encode($response->error));
                }
            } elseif (is_array($response)) {
                error_log('Conteúdo do array de resposta: ' . json_encode($response));
            } elseif (is_string($response)) {
                error_log('Conteúdo da string de resposta: ' . $response);
                // Tentar decodificar JSON
                $jsonData = json_decode($response, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    error_log('String decodificada como JSON: ' . json_encode($jsonData));
                }
            }
        }
        
        // Verificar erro - adaptar para funcionar com stdClass ou objeto com getError()
        $error = null;
        if (is_object($response) && method_exists($response, 'getError')) {
            $error = $response->getError();
        } elseif (is_object($response) && isset($response->error)) {
            $error = $response->error;
        }
        
        if ($error) {
            $errorMessage = method_exists($error, 'getMessage') ? $error->getMessage() : (is_string($error) ? $error : 'Erro desconhecido');
            sendResponse(500, ['error' => 'Erro ao criar lead: ' . $errorMessage]);
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
        
        // Obter o ID do lead criado - tratando todos os formatos possíveis
        if (is_array($responseData) && !empty($responseData)) {
            // Formato 1: Array com objetos/arrays
            if (isset($responseData[0]['id'])) {
                $leadId = $responseData[0]['id'];
            } elseif (isset($responseData[0]) && is_object($responseData[0]) && isset($responseData[0]->id)) {
                $leadId = $responseData[0]->id;
            }
        } elseif (is_object($responseData)) {
            // Formato 2: Objeto direto com ID
            if (isset($responseData->id)) {
                $leadId = $responseData->id;
            } 
            // Formato 3: Objeto com array 'data'
            elseif (isset($responseData->data) && is_array($responseData->data) && !empty($responseData->data)) {
                if (isset($responseData->data[0]->id)) {
                    $leadId = $responseData->data[0]->id;
                } elseif (isset($responseData->data[0]['id'])) {
                    $leadId = $responseData->data[0]['id'];
                }
            }
        } 
        // Formato 4: Acessar diretamente a propriedade data da resposta
        elseif (is_object($response) && isset($response->data)) {
            if (is_array($response->data) && !empty($response->data)) {
                // Array de objetos/arrays
                if (isset($response->data[0]->id)) {
                    $leadId = $response->data[0]->id;
                } elseif (isset($response->data[0]['id'])) {
                    $leadId = $response->data[0]['id'];
                } elseif (isset($response->data[0]) && is_string($response->data[0]) && is_numeric($response->data[0])) {
                    // Caso raro: array de strings numéricas
                    $leadId = $response->data[0];
                }
            } elseif (is_object($response->data) && isset($response->data->id)) {
                // Objeto único
                $leadId = $response->data->id;
            } elseif (is_string($response->data) && substr($response->data, 0, 1) === '{') {
                // String JSON
                try {
                    $jsonData = json_decode($response->data);
                    if (isset($jsonData->id)) {
                        $leadId = $jsonData->id;
                    }
                } catch (Exception $e) {
                    error_log('Erro ao decodificar JSON: ' . $e->getMessage());
                }
            }
        }
        
        // Formato 5: Supabase às vezes retorna um formato específico para inserções
        if (!$leadId && is_object($response) && isset($response->statusCode)) {
            error_log('Resposta tem statusCode: ' . $response->statusCode);
            // Tenta encontrar algo no formato específico do Supabase (não apenas para statusCode 201)
            if (isset($response->data)) {
                $data = $response->data;
                error_log('Conteúdo de response->data: ' . json_encode($data));
                // Se data é um objeto único
                if (is_object($data) && isset($data->id)) {
                    $leadId = $data->id;
                    error_log('Encontrado ID no objeto: ' . $leadId);
                }
                // Se data é um array com um objeto
                elseif (is_array($data) && !empty($data)) {
                    if (isset($data[0]) && is_object($data[0]) && isset($data[0]->id)) {
                        $leadId = $data[0]->id;
                        error_log('Encontrado ID no primeiro item do array (objeto): ' . $leadId);
                    } elseif (isset($data[0]) && is_array($data[0]) && isset($data[0]['id'])) {
                        $leadId = $data[0]['id'];
                        error_log('Encontrado ID no primeiro item do array (array assoc): ' . $leadId);
                    } elseif (isset($data[0]) && is_string($data[0]) && 
                              (preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $data[0]) || is_numeric($data[0]))) {
                        // String que parece um UUID ou ID numérico
                        $leadId = $data[0];
                        error_log('Encontrado possível ID como string: ' . $leadId);
                    }
                } elseif (is_string($data) && (strpos($data, '{') === 0 || strpos($data, '[') === 0)) {
                    // Tentar interpretar como JSON
                    try {
                        $jsonData = json_decode($data);
                        error_log('Data decodificado como JSON: ' . json_encode($jsonData));
                        if (is_object($jsonData) && isset($jsonData->id)) {
                            $leadId = $jsonData->id;
                            error_log('Encontrado ID no JSON decodificado: ' . $leadId);
                        } elseif (is_array($jsonData) && !empty($jsonData) && isset($jsonData[0]->id)) {
                            $leadId = $jsonData[0]->id;
                            error_log('Encontrado ID no array JSON decodificado: ' . $leadId);
                        }
                    } catch (Exception $e) {
                        error_log('Erro ao decodificar JSON: ' . $e->getMessage());
                    }
                }
            }
        }
        
        // Formato 6: Verificar se há ID em outras propriedades comuns
        if (!$leadId && is_object($response)) {
            // Verificar propriedade body (comum em alguns clientes Supabase)
            if (isset($response->body)) {
                $body = $response->body;
                error_log('Verificando propriedade body: ' . json_encode($body));
                
                if (is_object($body) && isset($body->id)) {
                    $leadId = $body->id;
                    error_log('Encontrado ID em body->id: ' . $leadId);
                } elseif (is_string($body) && (strpos($body, '{') === 0 || strpos($body, '[') === 0)) {
                    // Tentar interpretar como JSON
                    try {
                        $jsonBody = json_decode($body);
                        error_log('Body decodificado como JSON: ' . json_encode($jsonBody));
                        if (is_object($jsonBody) && isset($jsonBody->id)) {
                            $leadId = $jsonBody->id;
                        } elseif (is_array($jsonBody) && !empty($jsonBody) && isset($jsonBody[0]->id)) {
                            $leadId = $jsonBody[0]->id;
                        }
                    } catch (Exception $e) {
                        error_log('Erro ao decodificar body como JSON: ' . $e->getMessage());
                    }
                }
            }
            
            // Verificar propriedade result (outro formato comum)
            if (!$leadId && isset($response->result)) {
                $result = $response->result;
                error_log('Verificando propriedade result: ' . json_encode($result));
                
                if (is_object($result) && isset($result->id)) {
                    $leadId = $result->id;
                } elseif (is_array($result) && !empty($result) && isset($result[0]->id)) {
                    $leadId = $result[0]->id;
                }
            }
        }
        
        if (!$leadId) {
            // Log detalhado da estrutura de resposta para debug
            error_log('Erro ao obter ID do lead criado. Detalhes da resposta:');
            error_log('Resposta completa: ' . json_encode($response));
            error_log('Tipo de $responseData: ' . gettype($responseData));
            
            if (is_object($responseData)) {
                error_log('Propriedades de $responseData: ' . implode(', ', array_keys((array)$responseData)));
            } elseif (is_array($responseData)) {
                error_log('Estrutura de $responseData: ' . json_encode($responseData));
            }
            
            if (is_object($response)) {
                error_log('Estrutura de $response: ' . json_encode($response));
                if (isset($response->data)) {
                    error_log('Tipo de $response->data: ' . gettype($response->data));
                    error_log('Conteúdo de $response->data: ' . json_encode($response->data));
                }
            }
            
            // Verificar se podemos processar a resposta de outra forma
            if (is_object($response)) {
                // Última tentativa: examinar todas as propriedades recursivamente
                error_log('Buscando ID recursivamente em todas as propriedades da resposta...');
                $leadId = findIdInObject($response);
                
                if ($leadId) {
                    error_log('ID encontrado na busca recursiva: ' . $leadId);
                } else {
                    error_log('Nenhum ID encontrado na busca recursiva');
                    
                    // Tentar extrair da inserção direta 
                    // Como última alternativa, verificar se conseguimos recuperar o ID pelo email
                    error_log('Tentativa final: buscando lead pelo email ' . $data['email']);
                    $findLeadQuery = $supabase->from('leads')
                        ->select('id')
                        ->filter('email', 'eq', trim($data['email']))
                        ->filter('user_id', 'eq', $userId)
                        ->order('created_at', ['descending' => true])
                        ->limit(1);
                        
                    if (is_object($findLeadQuery) && method_exists($findLeadQuery, 'execute')) {
                        $findLeadResponse = $findLeadQuery->execute();
                    } else {
                        $findLeadResponse = $findLeadQuery;
                    }
                    
                    // Extrair ID do lead da resposta
                    if (is_object($findLeadResponse)) {
                        error_log('Resposta da busca por email: ' . json_encode($findLeadResponse));
                        if (isset($findLeadResponse->data) && is_array($findLeadResponse->data) && !empty($findLeadResponse->data)) {
                            if (isset($findLeadResponse->data[0]->id)) {
                                $leadId = $findLeadResponse->data[0]->id;
                                error_log('ID encontrado via email: ' . $leadId);
                            } elseif (isset($findLeadResponse->data[0]['id'])) {
                                $leadId = $findLeadResponse->data[0]['id'];
                                error_log('ID encontrado via email (array): ' . $leadId);
                            }
                        }
                    }
                }
            }
            
            // Se após todas as tentativas ainda não temos um ID
            if (!$leadId) {
                error_log('ERRO FATAL: Não foi possível obter o ID do lead após múltiplas tentativas');
                sendResponse(500, [
                    'error' => 'Erro ao obter ID do lead criado',
                    'details' => 'A inserção pode ter ocorrido, mas não foi possível recuperar o ID',
                    'debug_info' => 'Verifique os logs para mais informações'
                ]);
                return;
            }
        }
    }
    
    // Agora temos o ID do lead (novo ou existente), vamos criar a associação com o projeto
    // Remover data para evitar erros de cache de schema, Supabase irá adicionar automaticamente com valor padrão
    $leadProject = [
        'lead_id' => $leadId,
        'project_id' => $data['project_id'],
        'utm_source' => isset($data['utm_source']) ? $data['utm_source'] : null,
        'utm_medium' => isset($data['utm_medium']) ? $data['utm_medium'] : null,
        'utm_campaign' => isset($data['utm_campaign']) ? $data['utm_campaign'] : null,
        'utm_term' => isset($data['utm_term']) ? $data['utm_term'] : null,
        'utm_content' => isset($data['utm_content']) ? $data['utm_content'] : null
        // captured_at será adicionado automaticamente pelo Supabase com o valor padrão now()
    ];
    
    // Inserir relação lead-projeto no banco de dados
    $insertRelationQuery = $supabase->from('lead_project')->insert($leadProject);
    
    // Verificar se o objeto tem o método execute
    if (is_object($insertRelationQuery) && method_exists($insertRelationQuery, 'execute')) {
        $relationResponse = $insertRelationQuery->execute();
    } else {
        // Quando o insertRelationQuery é direto (sem método execute), ele já é a resposta da operação
        $relationResponse = $insertRelationQuery;
        
        // Para debug
        error_log('Tipo da resposta direta de insert relation: ' . gettype($relationResponse));
        if (is_object($relationResponse)) {
            error_log('Classe da resposta direta: ' . get_class($relationResponse));
            error_log('Propriedades disponíveis: ' . implode(', ', array_keys((array)$relationResponse)));
        }
    }
    
    // Verificar erro - adaptar para funcionar com stdClass ou objeto com getError()
    $error = null;
    if (is_object($relationResponse) && method_exists($relationResponse, 'getError')) {
        $error = $relationResponse->getError();
    } elseif (is_object($relationResponse) && isset($relationResponse->error)) {
        $error = $relationResponse->error;
    }
    
    if ($error) {
        $errorMessage = method_exists($error, 'getMessage') ? $error->getMessage() : (is_string($error) ? $error : 'Erro desconhecido');
        sendResponse(500, ['error' => 'Erro ao associar lead ao projeto: ' . $errorMessage]);
        return;
    }
    
    // Buscar os dados completos do lead para retornar
    $getLeadQuery = $supabase->from('leads')
        ->select('*')
        ->filter('id', 'eq', $leadId);
        
    // Verificar se o objeto tem o método execute
    if (is_object($getLeadQuery) && method_exists($getLeadQuery, 'execute')) {
        $leadResponse = $getLeadQuery->execute();
    } else {
        // Quando o getLeadQuery é direto (sem método execute), ele já é a resposta da operação
        $leadResponse = $getLeadQuery;
        
        // Para debug
        error_log('Tipo da resposta direta de get lead: ' . gettype($leadResponse));
        if (is_object($leadResponse)) {
            error_log('Classe da resposta direta: ' . get_class($leadResponse));
            error_log('Propriedades disponíveis: ' . implode(', ', array_keys((array)$leadResponse)));
        }
    }
    
    // Obter dados da resposta
    $lead = null;
    if (is_object($leadResponse) && method_exists($leadResponse, 'getData')) {
        $lead = $leadResponse->getData();
    } elseif (is_object($leadResponse) && isset($leadResponse->data)) {
        $lead = $leadResponse->data;
    } else {
        $lead = $leadResponse;
    }
    
    // Extrair o lead (primeiro item do array)
    $leadData = null;
    if (is_array($lead) && !empty($lead)) {
        $leadData = $lead[0];
    } elseif (is_object($lead) && isset($lead->data) && is_array($lead->data) && !empty($lead->data)) {
        $leadData = $lead->data[0]; 
    } elseif (is_object($lead)) {
        $leadData = $lead;
    } elseif (is_array($leadResponse->data) && !empty($leadResponse->data)) {
        $leadData = $leadResponse->data[0];
    } else {
        // Se não conseguimos obter dados completos, usar dados parciais
        $leadData = [
            'id' => $leadId,
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $phone
        ];
    }
    
    // Preparar resposta
    $responseData = [
        'lead' => $leadData,
        'message' => $existingLead ? 'Lead existente associado ao projeto' : 'Lead capturado com sucesso',
        'details' => [
            'name' => $data['name'],
            'project' => $projectName,
            'captured_at' => date('d/m/Y H:i:s')
        ]
    ];
    
    // Retornar o resultado
    sendResponse(201, $responseData);
}

/**
 * Obtém estatísticas sobre os leads
 * 
 * @param object $supabase Cliente Supabase
 * @param string $userId ID do usuário autenticado
 */
function handleLeadStats($supabase, $userId) {
    // Verificar se há um ID específico de projeto na requisição
    $projectId = isset($_GET['project_id']) ? $_GET['project_id'] : null;
    $periodDays = isset($_GET['period']) ? intval($_GET['period']) : 30; // Padrão: últimos 30 dias
    
    // Verificar que período é válido
    if ($periodDays <= 0) {
        $periodDays = 30;
    }
    
    // Inicializar estatísticas
    $stats = [
        'total_leads' => 0,
        'new_leads_period' => 0,
        'leads_by_status' => [],
        'leads_by_source' => [],
        'leads_by_day' => [],
        'conversion_rate' => 0
    ];
    
    try {
        // 1. Contar total de leads do usuário
        $totalLeadsQuery = $supabase->from('leads')
            ->select('count')
            ->filter('user_id', 'eq', $userId);
            
        if (is_object($totalLeadsQuery) && method_exists($totalLeadsQuery, 'execute')) {
            $totalLeadsResponse = $totalLeadsQuery->execute();
            
            // Obter dados da resposta
            $totalLeadsData = null;
            if (is_object($totalLeadsResponse) && method_exists($totalLeadsResponse, 'getData')) {
                $totalLeadsData = $totalLeadsResponse->getData();
            } elseif (is_object($totalLeadsResponse) && isset($totalLeadsResponse->data)) {
                $totalLeadsData = $totalLeadsResponse->data;
            } else {
                $totalLeadsData = $totalLeadsResponse;
            }
            
            // Extrair contagem
            if (is_array($totalLeadsData) && isset($totalLeadsData[0]['count'])) {
                $stats['total_leads'] = intval($totalLeadsData[0]['count']);
            } elseif (is_array($totalLeadsData) && isset($totalLeadsData[0]->count)) {
                $stats['total_leads'] = intval($totalLeadsData[0]->count);
            }
        }
        
        // 2. Contar leads criados no período especificado
        $periodDate = date('Y-m-d', strtotime("-$periodDays days"));
        $newLeadsQuery = $supabase->from('leads')
            ->select('count')
            ->filter('user_id', 'eq', $userId)
            ->filter('created_at', 'gte', $periodDate);
            
        if (is_object($newLeadsQuery) && method_exists($newLeadsQuery, 'execute')) {
            $newLeadsResponse = $newLeadsQuery->execute();
            
            // Obter dados da resposta
            $newLeadsData = null;
            if (is_object($newLeadsResponse) && method_exists($newLeadsResponse, 'getData')) {
                $newLeadsData = $newLeadsResponse->getData();
            } elseif (is_object($newLeadsResponse) && isset($newLeadsResponse->data)) {
                $newLeadsData = $newLeadsResponse->data;
            } else {
                $newLeadsData = $newLeadsResponse;
            }
            
            // Extrair contagem
            if (is_array($newLeadsData) && isset($newLeadsData[0]['count'])) {
                $stats['new_leads_period'] = intval($newLeadsData[0]['count']);
            } elseif (is_array($newLeadsData) && isset($newLeadsData[0]->count)) {
                $stats['new_leads_period'] = intval($newLeadsData[0]->count);
            }
        }
        
        // 3. Contar leads por status
        $statusQuery = $supabase->from('leads')
            ->select('status, count')
            ->filter('user_id', 'eq', $userId)
            ->groupBy('status');
            
        if (is_object($statusQuery) && method_exists($statusQuery, 'execute')) {
            $statusResponse = $statusQuery->execute();
            
            // Obter dados da resposta
            $statusData = null;
            if (is_object($statusResponse) && method_exists($statusResponse, 'getData')) {
                $statusData = $statusResponse->getData();
            } elseif (is_object($statusResponse) && isset($statusResponse->data)) {
                $statusData = $statusResponse->data;
            } else {
                $statusData = $statusResponse;
            }
            
            // Processar dados de status
            if (is_array($statusData)) {
                foreach ($statusData as $item) {
                    if (is_array($item) && isset($item['status']) && isset($item['count'])) {
                        $stats['leads_by_status'][$item['status']] = intval($item['count']);
                    } elseif (is_object($item) && isset($item->status) && isset($item->count)) {
                        $stats['leads_by_status'][$item->status] = intval($item->count);
                    }
                }
            }
        }
        
        // 4. Dados específicos do projeto
        if ($projectId) {
            // 4.1 Contar leads por origem (UTM source)
            $sourceQuery = $supabase->from('lead_project')
                ->select('utm_source, count')
                ->filter('project_id', 'eq', $projectId)
                ->groupBy('utm_source');
                
            if (is_object($sourceQuery) && method_exists($sourceQuery, 'execute')) {
                $sourceResponse = $sourceQuery->execute();
                
                // Obter dados da resposta
                $sourceData = null;
                if (is_object($sourceResponse) && method_exists($sourceResponse, 'getData')) {
                    $sourceData = $sourceResponse->getData();
                } elseif (is_object($sourceResponse) && isset($sourceResponse->data)) {
                    $sourceData = $sourceResponse->data;
                } else {
                    $sourceData = $sourceResponse;
                }
                
                // Processar dados de fonte
                if (is_array($sourceData)) {
                    foreach ($sourceData as $item) {
                        $source = 'desconhecida';
                        $count = 0;
                        
                        if (is_array($item)) {
                            $source = isset($item['utm_source']) && !empty($item['utm_source']) ? $item['utm_source'] : 'desconhecida';
                            $count = isset($item['count']) ? intval($item['count']) : 0;
                        } elseif (is_object($item)) {
                            $source = isset($item->utm_source) && !empty($item->utm_source) ? $item->utm_source : 'desconhecida';
                            $count = isset($item->count) ? intval($item->count) : 0;
                        }
                        
                        $stats['leads_by_source'][$source] = $count;
                    }
                }
                
                // 4.2 Contar leads por dia no período
                $today = date('Y-m-d');
                $periodStart = date('Y-m-d', strtotime("-$periodDays days"));
                
                // Inicializar array de dias
                $days = [];
                $currentDate = $periodStart;
                while ($currentDate <= $today) {
                    $days[$currentDate] = 0;
                    $currentDate = date('Y-m-d', strtotime("$currentDate +1 day"));
                }
                
                // Consultar leads capturados por dia para o projeto
                $dailyQuery = $supabase->from('lead_project')
                    ->select('DATE(captured_at) as date, count')
                    ->filter('project_id', 'eq', $projectId)
                    ->filter('captured_at', 'gte', $periodStart)
                    ->groupBy('date')
                    ->order('date', ['ascending' => true]);
                    
                if (is_object($dailyQuery) && method_exists($dailyQuery, 'execute')) {
                    $dailyResponse = $dailyQuery->execute();
                    
                    // Obter dados da resposta
                    $dailyData = null;
                    if (is_object($dailyResponse) && method_exists($dailyResponse, 'getData')) {
                        $dailyData = $dailyResponse->getData();
                    } elseif (is_object($dailyResponse) && isset($dailyResponse->data)) {
                        $dailyData = $dailyResponse->data;
                    } else {
                        $dailyData = $dailyResponse;
                    }
                    
                    // Processar dados diários
                    if (is_array($dailyData)) {
                        foreach ($dailyData as $item) {
                            $date = '';
                            $count = 0;
                            
                            if (is_array($item)) {
                                $date = isset($item['date']) ? $item['date'] : '';
                                $count = isset($item['count']) ? intval($item['count']) : 0;
                            } elseif (is_object($item)) {
                                $date = isset($item->date) ? $item->date : '';
                                $count = isset($item->count) ? intval($item->count) : 0;
                            }
                            
                            if ($date && isset($days[$date])) {
                                $days[$date] = $count;
                            }
                        }
                    }
                    
                    // Formatar para resposta
                    foreach ($days as $date => $count) {
                        $stats['leads_by_day'][] = [
                            'date' => $date,
                            'count' => $count
                        ];
                    }
                }
                
                // 4.3 Calcular taxa de conversão (apenas exemplo, ajuste conforme necessário)
                // Esta é uma taxa simulada; poderia ser calculada com dados reais de visualizações/cliques
                $conversionRate = 0;
                $totalLeadsInProject = array_sum(array_values($stats['leads_by_source']));
                
                // Buscar dados do projeto para definir conversão com base em alguma métrica
                $projectQuery = $supabase->from('projects')
                    ->select('views_count')
                    ->filter('id', 'eq', $projectId);
                    
                if (is_object($projectQuery) && method_exists($projectQuery, 'execute')) {
                    $projectResponse = $projectQuery->execute();
                    
                    // Obter dados da resposta
                    $projectData = null;
                    if (is_object($projectResponse) && method_exists($projectResponse, 'getData')) {
                        $projectData = $projectResponse->getData();
                    } elseif (is_object($projectResponse) && isset($projectResponse->data)) {
                        $projectData = $projectResponse->data;
                    } else {
                        $projectData = $projectResponse;
                    }
                    
                    // Calcular taxa de conversão
                    $viewsCount = 0;
                    if (is_array($projectData) && !empty($projectData)) {
                        if (isset($projectData[0]['views_count'])) {
                            $viewsCount = intval($projectData[0]['views_count']) ?: 100; // Valor padrão se for zero
                        } elseif (isset($projectData[0]->views_count)) {
                            $viewsCount = intval($projectData[0]->views_count) ?: 100;
                        }
                    }
                    
                    if ($viewsCount > 0) {
                        $conversionRate = ($totalLeadsInProject / $viewsCount) * 100;
                    } else {
                        // Se não houver dados de visualizações, use uma taxa simulada
                        $conversionRate = 2.5; // Taxa média simulada
                    }
                } else {
                    // Taxa simulada
                    $conversionRate = 2.5;
                }
                
                $stats['conversion_rate'] = round($conversionRate, 2);
            }
        }
        
        // Retornar estatísticas
        sendResponse(200, [
            'stats' => $stats,
            'period_days' => $periodDays,
            'project_id' => $projectId
        ]);
        
    } catch (Exception $e) {
        error_log('Erro ao obter estatísticas de leads: ' . $e->getMessage());
        sendResponse(500, ['error' => 'Erro ao obter estatísticas: ' . $e->getMessage()]);
    }
}

/**
 * Atualiza o status de um lead
 * 
 * @param object $supabase Cliente Supabase
 * @param string $userId ID do usuário autenticado
 * @param string $leadId ID do lead a ser atualizado
 */
function handleUpdateLeadStatus($supabase, $userId, $leadId) {
    // Obter dados da requisição
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validar dados
    if (!isset($data['status']) || empty(trim($data['status']))) {
        sendResponse(400, ['error' => 'O status do lead é obrigatório']);
        return;
    }
    
    // Valores de status válidos
    $validStatuses = ['novo', 'qualificado', 'contatado', 'convertido', 'desistiu', 'inativo'];
    
    if (!in_array($data['status'], $validStatuses)) {
        sendResponse(400, [
            'error' => 'Status inválido',
            'valid_statuses' => $validStatuses
        ]);
        return;
    }
    
    // Notas opcionais
    $notes = isset($data['notes']) ? trim($data['notes']) : null;
    
    // Verificar se o lead existe e pertence ao usuário
    $checkQuery = $supabase->from('leads')
        ->select('id, name, email, status')
        ->filter('id', 'eq', $leadId)
        ->filter('user_id', 'eq', $userId);
        
    // Verificar se o objeto tem o método execute
    if (is_object($checkQuery) && method_exists($checkQuery, 'execute')) {
        $checkResponse = $checkQuery->execute();
        
        // Obter dados da resposta
        $leadData = null;
        if (is_object($checkResponse) && method_exists($checkResponse, 'getData')) {
            $leadData = $checkResponse->getData();
        } elseif (is_object($checkResponse) && isset($checkResponse->data)) {
            $leadData = $checkResponse->data;
        } else {
            $leadData = $checkResponse;
        }
        
        // Verificar se temos resultados
        $hasResults = false;
        $currentLead = null;
        
        if (is_array($leadData) && !empty($leadData)) {
            $hasResults = count($leadData) > 0;
            if ($hasResults) {
                $currentLead = $leadData[0];
            }
        } elseif (is_object($leadData) && !empty((array)$leadData)) {
            $hasResults = true;
            $currentLead = $leadData;
        }
        
        if (!$hasResults) {
            sendResponse(404, ['error' => 'Lead não encontrado ou sem permissão']);
            return;
        }
        
        // Obter status atual para log de alterações
        $currentStatus = '';
        if (is_array($currentLead) && isset($currentLead['status'])) {
            $currentStatus = $currentLead['status'];
        } elseif (is_object($currentLead) && isset($currentLead->status)) {
            $currentStatus = $currentLead->status;
        }
        
        // Se o status é o mesmo, verificar se apenas as notas estão sendo atualizadas
        if ($currentStatus === $data['status'] && $notes === null) {
            sendResponse(200, [
                'message' => 'Nenhuma alteração necessária, status já está como ' . $data['status'],
                'lead_id' => $leadId
            ]);
            return;
        }
        
        // Preparar dados para atualização
        $updateData = [
            'status' => $data['status'],
            'updated_at' => date('c')
        ];
        
        // Adicionar notas se fornecidas
        if ($notes !== null) {
            $updateData['notes'] = $notes;
        }
        
        // Atualizar o lead
        $updateQuery = $supabase->from('leads')
            ->filter('id', 'eq', $leadId)
            ->update($updateData);
            
        // Verificar se o objeto tem o método execute
        if (is_object($updateQuery) && method_exists($updateQuery, 'execute')) {
            $updateResponse = $updateQuery->execute();
            
            // Verificar erro - adaptar para funcionar com stdClass ou objeto com getError()
            $error = null;
            if (is_object($updateResponse) && method_exists($updateResponse, 'getError')) {
                $error = $updateResponse->getError();
            } elseif (is_object($updateResponse) && isset($updateResponse->error)) {
                $error = $updateResponse->error;
            }
            
            if ($error) {
                $errorMessage = method_exists($error, 'getMessage') ? $error->getMessage() : (is_string($error) ? $error : 'Erro desconhecido');
                sendResponse(500, ['error' => 'Erro ao atualizar status do lead: ' . $errorMessage]);
                return;
            }
            
            // Obter nome e email do lead para a resposta
            $leadName = '';
            $leadEmail = '';
            
            if (is_array($currentLead)) {
                $leadName = $currentLead['name'] ?? '';
                $leadEmail = $currentLead['email'] ?? '';
            } elseif (is_object($currentLead)) {
                $leadName = $currentLead->name ?? '';
                $leadEmail = $currentLead->email ?? '';
            }
            
            // Registrar alteração de status no histórico (se a aplicação tiver esta funcionalidade)
            // Este é um exemplo de como registrar no log de ações
            try {
                $logEntry = [
                    'user_id' => $userId,
                    'lead_id' => $leadId,
                    'action' => 'status_change',
                    'old_value' => $currentStatus,
                    'new_value' => $data['status'],
                    'notes' => $notes,
                    'created_at' => date('c')
                ];
                
                // Inserir no log (opcional - não retorna erro se falhar)
                $logQuery = $supabase->from('lead_status_logs')->insert($logEntry);
                
                if (is_object($logQuery) && method_exists($logQuery, 'execute')) {
                    $logQuery->execute();
                }
            } catch (Exception $e) {
                // Apenas registrar erro em log, não interromper o fluxo
                error_log('Erro ao registrar log de alteração de status: ' . $e->getMessage());
            }
            
            // Retornar sucesso
            sendResponse(200, [
                'message' => 'Status do lead atualizado com sucesso',
                'lead_id' => $leadId,
                'lead_name' => $leadName,
                'lead_email' => $leadEmail,
                'previous_status' => $currentStatus,
                'new_status' => $data['status'],
                'updated_at' => date('d/m/Y H:i:s')
            ]);
        } else {
            // Se o objeto não tem o método execute, retornar erro
            sendResponse(500, ['error' => 'Erro ao atualizar status do lead: método de execução não disponível']);
        }
    } else {
        // Se o objeto não tem o método execute, retornar erro
        sendResponse(500, ['error' => 'Erro ao verificar lead: método de execução não disponível']);
    }
}