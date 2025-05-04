<?php
/**
 * Endpoint para testar consulta de usuários no Supabase
 * 
 * Este script demonstra como consultar usuários usando a API REST do Supabase
 * através do cliente HTTP personalizado.
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
    // Inicializar o cliente Supabase com a chave de serviço (necessária para acessar tabelas do sistema)
    $supabase = SupabaseClient::getInstance('service_role');
    
    // Obter parâmetros opcionais
    $userId = isset($_GET['id']) ? $_GET['id'] : null;
    $email = isset($_GET['email']) ? $_GET['email'] : null;
    
    // Array para armazenar resultados
    $results = [];
    
    // Verificar a estrutura do esquema auth (onde estão os usuários)
    try {
        $schemas = $supabase
            ->from('information_schema.schemata')
            ->select('schema_name')
            ->execute();
        
        if ($schemas->getError()) {
            throw new Exception($schemas->getError()->getMessage());
        }
        
        $results['schemas'] = $schemas->getData();
    } catch (Exception $e) {
        $results['schema_error'] = 'Erro ao consultar esquemas: ' . $e->getMessage();
    }
    
    // Consultar tabelas no esquema auth
    try {
        $tables = $supabase
            ->from('information_schema.tables')
            ->select('table_name')
            ->filter('table_schema', 'eq', 'auth')
            ->execute();
        
        if ($tables->getError()) {
            throw new Exception($tables->getError()->getMessage());
        }
        
        $results['auth_tables'] = $tables->getData();
    } catch (Exception $e) {
        $results['tables_error'] = 'Erro ao consultar tabelas de auth: ' . $e->getMessage();
    }
    
    // Consultar tabela de usuários
    try {
        // Construir a consulta base
        $supabaseClient = $supabase->from('auth.users')->select('id, email, last_sign_in_at, created_at, updated_at, confirmed_at');
        
        // Adicionar filtros se fornecidos
        if ($userId) {
            $supabaseClient->filter('id', 'eq', $userId);
        }
        
        if ($email) {
            $supabaseClient->filter('email', 'eq', $email);
        }
        
        // Executar a consulta
        $response = $supabaseClient->execute();
        
        if ($response->getError()) {
            throw new Exception($response->getError()->getMessage());
        }
        
        $users = $response->getData();
        
        // Processar os usuários para o formato de resposta
        $processedUsers = [];
        foreach ((array)$users as $user) {
            // Converter para array se for objeto
            $userData = is_object($user) ? (array)$user : $user;
            
            // Mascarar informações sensíveis para segurança
            if (isset($userData['email'])) {
                $parts = explode('@', $userData['email']);
                if (count($parts) == 2) {
                    $username = $parts[0];
                    $domain = $parts[1];
                    
                    // Mascarar parte do nome de usuário se for longo o suficiente
                    if (strlen($username) > 3) {
                        $maskedUsername = substr($username, 0, 2) . str_repeat('*', strlen($username) - 2);
                        $userData['email'] = $maskedUsername . '@' . $domain;
                    }
                }
            }
            
            // Adicionar à lista de usuários processados
            $processedUsers[] = $userData;
        }
        
        $results['users'] = [
            'count' => count($processedUsers),
            'records' => $processedUsers
        ];
    } catch (Exception $e) {
        $results['users_error'] = 'Erro ao consultar usuários: ' . $e->getMessage();
    }
    
    // Verificar tabela de perfis
    try {
        $profilesResponse = $supabase
            ->from('profiles')
            ->select('*')
            ->execute();
        
        if ($profilesResponse->getError()) {
            throw new Exception($profilesResponse->getError()->getMessage());
        }
        
        $profiles = $profilesResponse->getData();
        
        $results['profiles'] = [
            'count' => count((array)$profiles),
            'records' => $profiles
        ];
    } catch (Exception $e) {
        $results['profiles_error'] = 'Erro ao consultar perfis: ' . $e->getMessage();
    }
    
    // Determinar status geral
    $hasErrors = isset($results['schema_error']) || 
                isset($results['tables_error']) || 
                isset($results['users_error']) ||
                isset($results['profiles_error']);
    
    $status = $hasErrors ? 'partial' : 'success';
    
    // Enviar resposta com resultados
    sendResponse(200, [
        'status' => $status,
        'message' => 'Teste de consulta de usuários concluído',
        'results' => $results,
        '_debug' => [
            'memory_usage' => round(memory_get_usage() / 1024 / 1024, 2) . ' MB',
            'execution_time' => microtime(true) - $_SERVER['REQUEST_TIME_FLOAT']
        ]
    ]);
    
} catch (Exception $e) {
    // Registrar erro em log
    error_log('Erro ao testar consulta de usuários: ' . $e->getMessage());
    
    // Enviar resposta de erro
    sendResponse(500, [
        'status' => 'error',
        'message' => 'Erro ao testar consulta de usuários',
        'error' => $e->getMessage(),
        '_debug' => [
            'memory_usage' => round(memory_get_usage() / 1024 / 1024, 2) . ' MB',
            'execution_time' => microtime(true) - $_SERVER['REQUEST_TIME_FLOAT']
        ]
    ]);
}