<?php
/**
 * Endpoint para testar a API do Supabase
 * 
 * Este endpoint tenta realizar operações básicas de CRUD na API do Supabase
 * para verificar se a conexão e o cliente estão funcionando corretamente.
 */

require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../models/Database.php';
require_once __DIR__ . '/../models/SupabaseClient.php';

// Configurar CORS
if (function_exists('configureCors')) {
    configureCors();
} else {
    // Configuração manual de CORS se a função não existir
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key');
    
    // Tratar solicitações OPTIONS (preflight)
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        header('HTTP/1.1 204 No Content');
        exit;
    }
}

// Verificar se método é GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(405, ['error' => 'Método não permitido']);
    exit;
}

try {
    // Inicializar o cliente Supabase
    $supabase = new SupabaseClient(
        getenv('SUPABASE_URL') ?: 'https://gciezqjeaehrtihqjihz.supabase.co',
        getenv('SUPABASE_SERVICE_ROLE_KEY')
    );
    
    // Array para armazenar resultados dos testes
    $testResults = [];
    
    // Teste 1: Verificar configuração
    $testResults['config'] = [
        'name' => 'Verificação de Configuração',
        'status' => 'success',
        'message' => 'Cliente Supabase inicializado com sucesso',
        'details' => [
            'url' => getenv('SUPABASE_URL') ?: 'https://gciezqjeaehrtihqjihz.supabase.co',
            'service_role_key_exists' => !empty(getenv('SUPABASE_SERVICE_ROLE_KEY')),
            'jwt_secret_exists' => !empty(getenv('SUPABASE_JWT_SECRET'))
        ]
    ];
    
    // Teste 2: Lista de tabelas disponíveis
    try {
        // Verificar se podemos acessar o Supabase usando o PG Catalog para listar tabelas
        $response = $supabase
            ->from('information_schema.tables')
            ->select('table_name')
            ->filter('table_schema', 'eq', 'public')
            ->execute();
        
        if ($response->getError()) {
            throw new Exception($response->getError()->getMessage());
        }
        
        $tables = $response->getData();
        
        $testResults['list_tables'] = [
            'name' => 'Listagem de Tabelas',
            'status' => 'success',
            'message' => 'Tabelas listadas com sucesso',
            'details' => [
                'count' => count($tables),
                'tables' => $tables
            ]
        ];
    } catch (Exception $e) {
        $testResults['list_tables'] = [
            'name' => 'Listagem de Tabelas',
            'status' => 'error',
            'message' => 'Erro ao listar tabelas',
            'details' => [
                'error' => $e->getMessage()
            ]
        ];
    }
    
    // Teste 3: Testar tabela de empresas
    try {
        // Consultar empresas
        $companiesResponse = $supabase
            ->from('companies')
            ->select('*')
            ->execute();
        
        if ($companiesResponse->getError()) {
            throw new Exception($companiesResponse->getError()->getMessage());
        }
        
        $companies = $companiesResponse->getData();
        
        $testResults['companies'] = [
            'name' => 'Acesso à Tabela de Empresas',
            'status' => 'success',
            'message' => 'Empresas consultadas com sucesso',
            'details' => [
                'count' => count($companies),
                'first_few' => array_slice((array)$companies, 0, 3) // Mostrar apenas as 3 primeiras
            ]
        ];
    } catch (Exception $e) {
        $testResults['companies'] = [
            'name' => 'Acesso à Tabela de Empresas',
            'status' => 'error',
            'message' => 'Erro ao consultar empresas',
            'details' => [
                'error' => $e->getMessage()
            ]
        ];
    }
    
    // Teste 4: Testar tabela de projetos
    try {
        // Consultar projetos
        $projectsResponse = $supabase
            ->from('projects')
            ->select('*')
            ->execute();
        
        if ($projectsResponse->getError()) {
            throw new Exception($projectsResponse->getError()->getMessage());
        }
        
        $projects = $projectsResponse->getData();
        
        $testResults['projects'] = [
            'name' => 'Acesso à Tabela de Projetos',
            'status' => 'success',
            'message' => 'Projetos consultados com sucesso',
            'details' => [
                'count' => count($projects),
                'first_few' => array_slice((array)$projects, 0, 3) // Mostrar apenas os 3 primeiros
            ]
        ];
    } catch (Exception $e) {
        $testResults['projects'] = [
            'name' => 'Acesso à Tabela de Projetos',
            'status' => 'error',
            'message' => 'Erro ao consultar projetos',
            'details' => [
                'error' => $e->getMessage()
            ]
        ];
    }
    
    // Determinar status geral dos testes
    $successCount = 0;
    $errorCount = 0;
    
    foreach ($testResults as $test) {
        if ($test['status'] === 'success') {
            $successCount++;
        } else {
            $errorCount++;
        }
    }
    
    $overallStatus = $errorCount > 0 ? 'partial' : 'success';
    if ($successCount === 0) {
        $overallStatus = 'error';
    }
    
    // Enviar resposta com resultados dos testes
    sendResponse(200, [
        'status' => $overallStatus,
        'message' => "Teste de API do Supabase concluído: $successCount sucesso(s), $errorCount erro(s)",
        'tests' => $testResults,
        '_debug' => [
            'memory_usage' => round(memory_get_usage() / 1024 / 1024, 2) . ' MB',
            'execution_time' => microtime(true) - $_SERVER['REQUEST_TIME_FLOAT']
        ]
    ]);
    
} catch (Exception $e) {
    // Registrar erro em log
    error_log('Erro ao testar API do Supabase: ' . $e->getMessage());
    
    // Enviar resposta de erro
    sendResponse(500, [
        'status' => 'error',
        'message' => 'Erro ao inicializar cliente Supabase',
        'error' => $e->getMessage(),
        '_debug' => [
            'memory_usage' => round(memory_get_usage() / 1024 / 1024, 2) . ' MB',
            'execution_time' => microtime(true) - $_SERVER['REQUEST_TIME_FLOAT']
        ]
    ]);
}