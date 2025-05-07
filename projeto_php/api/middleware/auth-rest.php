<?php
/**
 * Middleware de autenticação via REST API
 * 
 * Responsável por verificar a autenticação das requisições usando a API REST do Supabase
 * em vez de conectar diretamente ao banco de dados.
 * 
 * Versão 2.0 - Melhorada com tratamento de erros, logs detalhados e cache
 */

require_once __DIR__ . '/../utils/jwt.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../models/SupabaseClient.php';

/**
 * Verifica se a requisição está autenticada via header Authorization Bearer
 * 
 * @param bool $required Define se a autenticação é obrigatória
 * @return array|bool Dados do usuário autenticado ou false
 */
function authenticateJwt($required = true) {
    // Obter o token do cabeçalho Authorization
    $headers = getallheaders();
    $authorization = isset($headers['Authorization']) ? $headers['Authorization'] : '';
    
    // Verificar o formato do cabeçalho
    if (empty($authorization) || !preg_match('/Bearer\s+(.*)$/i', $authorization, $matches)) {
        if ($required) {
            error_log('Auth REST: Token JWT ausente ou formato inválido');
            sendResponse(401, errorResponse(401, 'Não autorizado. Token JWT ausente ou inválido.', 'AUTH_REQUIRED'));
            exit;
        }
        return false;
    }
    
    $token = $matches[1];
    $config = require __DIR__ . '/../config/supabase.php';
    
    // Para depuração
    $tokenParts = explode('.', $token);
    if (count($tokenParts) === 3) {
        error_log('Auth REST: Token JWT recebido (formato válido): ' . substr($token, 0, 10) . '...');
    } else {
        error_log('Auth REST: Token JWT recebido (formato inválido): ' . substr($token, 0, 10) . '...');
    }
    
    // Verificar se o segredo JWT está definido
    if (empty($config['jwt_secret'])) {
        error_log('Auth REST: ERRO - JWT Secret não definido na configuração');
        if ($required) {
            sendResponse(500, errorResponse(500, 'Erro de configuração: JWT Secret não definido.', 'CONFIG_ERROR'));
            exit;
        }
        return false;
    }
    
    // Verificar token JWT usando o segredo do Supabase
    $payload = verifyJwt($token, $config['jwt_secret']);
    
    if (!$payload) {
        error_log('Auth REST: Token JWT inválido ou expirado');
        if ($required) {
            sendResponse(401, errorResponse(401, 'Token inválido ou expirado.', 'INVALID_TOKEN'));
            exit;
        }
        return false;
    }
    
    // Registrar sucesso
    error_log('Auth REST: Token JWT verificado com sucesso para usuário: ' . $payload->sub);
    
    // O token é válido, retornar dados do usuário
    return [
        'user_id' => $payload->sub,
        'email' => $payload->email ?? null,
        'role' => $payload->role ?? 'authenticated',
        'exp' => $payload->exp,
    ];
}

/**
 * Cache simples em memória para API Keys
 */
$apiKeyCache = [];

/**
 * Verifica se a requisição está autenticada via API Key
 * Usa a API REST do Supabase em vez de conectar diretamente ao banco
 * 
 * @param string|array $requiredScope Escopo(s) necessário(s) para acessar o recurso
 * @return array|bool Dados da API key autenticada ou false
 */
function authenticateApiKey($requiredScope = null) {
    global $apiKeyCache;
    
    // Obter a chave de API do cabeçalho
    $headers = getallheaders();
    $apiKey = isset($headers['X-API-Key']) ? $headers['X-API-Key'] : '';
    
    if (empty($apiKey)) {
        error_log('Auth REST: API Key ausente no cabeçalho');
        sendResponse(401, errorResponse(401, 'API Key ausente.', 'API_KEY_MISSING'));
        exit;
    }
    
    // Log de início da autenticação
    error_log('Auth REST: Iniciando autenticação da API Key: ' . substr($apiKey, 0, 5) . '...' . substr($apiKey, -5));
    
    // Verificar cache (válido por 5 minutos)
    $cacheKey = md5($apiKey . ($requiredScope ? implode(',', (array)$requiredScope) : ''));
    if (isset($apiKeyCache[$cacheKey]) && $apiKeyCache[$cacheKey]['expires'] > time()) {
        error_log('Auth REST: Usando API Key em cache');
        return $apiKeyCache[$cacheKey]['data'];
    }
    
    try {
        error_log('Auth REST: Criando cliente Supabase para verificar API Key: ' . substr($apiKey, 0, 5) . '...');
        
        // Carregar configuração
        $supabaseConfig = require __DIR__ . '/../config/supabase.php';
        error_log('Auth REST: Service Role Key configurada: ' . (empty($supabaseConfig['service_role_key']) ? 'NÃO' : 'SIM'));
        
        // Criar cliente Supabase com retry e timeout configurados
        $supabase = SupabaseClient::getInstance('service_role', [
            'debug' => true,
            'timeout' => 10,
            'retry_attempts' => 2,
            'retry_delay' => 1
        ]);
        
        error_log('Auth REST: Cliente Supabase criado, consultando API key');
        
        // Consultar API keys no Supabase
        $response = $supabase
            ->from('api_keys')
            ->select('id, user_id, name, permissions, rate_limit, expires_at')
            ->filter('key_value', 'eq', $apiKey)
            ->filter('is_active', 'eq', true)
            ->execute();
            
        error_log('Auth REST: Consulta de API key executada');
        
        // Verificar erro na consulta - adaptar para funcionar com stdClass ou objeto com getError()
        $error = null;
        if (is_object($response) && method_exists($response, 'getError')) {
            $error = $response->getError();
        } elseif (is_object($response) && isset($response->error)) {
            $error = $response->error;
        }
        
        if ($error) {
            $errorMessage = method_exists($error, 'getMessage') ? $error->getMessage() : (is_string($error) ? $error : 'Erro desconhecido');
            error_log('Auth REST: Erro ao consultar API Key: ' . $errorMessage);
            throw new Exception($errorMessage);
        }
        
        // Verificar se a API Key existe - adaptar para funcionar com stdClass ou objeto com getData()
        $keys = null;
        if (is_object($response) && method_exists($response, 'getData')) {
            $keys = $response->getData();
        } elseif (is_object($response) && isset($response->data)) {
            $keys = $response->data;
        } elseif (is_array($response)) {
            $keys = $response;
        } else {
            $keys = $response; // Último recurso, tentar usar o próprio objeto
        }
        
        error_log('Auth REST: Tipo de dados da resposta: ' . gettype($keys));
        
        if (!$keys || count((array)$keys) === 0) {
            error_log('Auth REST: API Key não encontrada ou inativa: ' . substr($apiKey, 0, 5) . '...');
            sendResponse(401, errorResponse(401, 'API Key inválida ou expirada.', 'INVALID_API_KEY'));
            exit;
        }
        
        // Usar o primeiro resultado
        $apiKeyData = is_array($keys) ? $keys[0] : $keys;
        
        // Verificar expiração
        if (!empty($apiKeyData->expires_at)) {
            $expiresAt = strtotime($apiKeyData->expires_at);
            if ($expiresAt !== false && $expiresAt < time()) {
                error_log('Auth REST: API Key expirada em: ' . $apiKeyData->expires_at);
                sendResponse(401, errorResponse(401, 'API Key expirada.', 'EXPIRED_API_KEY'));
                exit;
            }
        }
        
        // Tentar obter informações do usuário da tabela profiles (opcional)
        $userEmail = null;
        try {
            error_log('Auth REST: Tentando obter informações do usuário da tabela profiles');
            
            // Ignoraremos erros aqui, pois esta consulta é opcional
            try {
                $userResponse = $supabase
                    ->from('profiles')
                    ->select('email')
                    ->filter('id', 'eq', $apiKeyData->user_id)
                    ->limit(1)
                    ->execute();
                
                // Vamos tentar extrair o email independente do formato da resposta
                $userData = null;
                if (is_object($userResponse) && method_exists($userResponse, 'getData')) {
                    $userData = $userResponse->getData();
                } elseif (is_object($userResponse) && isset($userResponse->data)) {
                    $userData = $userResponse->data;
                } else {
                    $userData = $userResponse;
                }
                
                if ($userData) {
                    // Tente extrair o email de diferentes formatos possíveis
                    if (is_array($userData) && !empty($userData)) {
                        $userEmail = $userData[0]->email ?? null;
                    } elseif (is_object($userData)) {
                        $userEmail = $userData->email ?? null;
                    }
                    
                    error_log('Auth REST: Email do usuário encontrado: ' . ($userEmail ?: 'Não encontrado'));
                }
            } catch (Exception $e) {
                // Ignorar erros nesta parte opcional
                error_log('Auth REST: Exceção ao consultar perfil (ignorado): ' . $e->getMessage());
            }
        } catch (Exception $e) {
            error_log('Auth REST: Exceção no bloco de consulta do perfil (ignorado): ' . $e->getMessage());
            // Continuamos mesmo se houver erros - este é um recurso opcional
        }
        
        // Se há escopos necessários, verificar se a chave tem permissão
        if ($requiredScope) {
            $scopes = is_array($requiredScope) ? $requiredScope : [$requiredScope];
            
            // Consultar escopos da API key
            try {
                $scopesResponse = $supabase
                    ->from('api_key_scopes aks')
                    ->select('s.name')
                    ->filter('aks.api_key_id', 'eq', $apiKeyData->id)
                    ->execute();
                
                // Verificar erro - adaptar para funcionar com stdClass ou objeto com getError()
                $error = null;
                if (is_object($scopesResponse) && method_exists($scopesResponse, 'getError')) {
                    $error = $scopesResponse->getError();
                } elseif (is_object($scopesResponse) && isset($scopesResponse->error)) {
                    $error = $scopesResponse->error;
                }
                
                if ($error) {
                    $errorMessage = method_exists($error, 'getMessage') ? $error->getMessage() : (is_string($error) ? $error : 'Erro desconhecido');
                    error_log('Auth REST: Erro ao consultar escopos: ' . $errorMessage);
                    throw new Exception($errorMessage);
                }
            } catch (Exception $e) {
                error_log('Auth REST: Exceção ao consultar escopos: ' . $e->getMessage());
                throw new Exception('Erro ao verificar permissões: ' . $e->getMessage());
            }
            
            // Extrair dados de escopo - adaptar para funcionar com stdClass ou objeto com getData()
            $apiScopes = null;
            if (is_object($scopesResponse) && method_exists($scopesResponse, 'getData')) {
                $apiScopes = $scopesResponse->getData();
            } elseif (is_object($scopesResponse) && isset($scopesResponse->data)) {
                $apiScopes = $scopesResponse->data;
            } else {
                $apiScopes = $scopesResponse;
            }
            
            $apiScopeNames = [];
            
            // Extrair nomes dos escopos
            if ($apiScopes) {
                foreach ((array)$apiScopes as $scope) {
                    if (is_object($scope) && isset($scope->name)) {
                        $apiScopeNames[] = $scope->name;
                    } elseif (is_string($scope)) {
                        $apiScopeNames[] = $scope;
                    }
                }
            }
            
            error_log('Auth REST: Escopos encontrados: ' . implode(', ', $apiScopeNames));
            
            // Verificar se todos os escopos necessários estão presentes
            $missingScopes = array_diff($scopes, $apiScopeNames);
            if (!empty($missingScopes)) {
                error_log('Auth REST: Escopos insuficientes. Necessários: ' . implode(', ', $scopes) . 
                          ' Disponíveis: ' . implode(', ', $apiScopeNames));
                sendResponse(403, errorResponse(403, 'Escopo insuficiente para acessar este recurso.', 'INSUFFICIENT_SCOPE', [
                    'required_scope' => $requiredScope
                ]));
                exit;
            }
        }
        
        // Registrar o uso da API - ignora erros se falhar
        try {
            // Verificar se existe a coluna updated_at na tabela
            $logData = [
                'api_key_id' => $apiKeyData->id,
                'endpoint' => $_SERVER['REQUEST_URI'],
                'method' => $_SERVER['REQUEST_METHOD'],
                'status_code' => 200, // Código inicial
                'response_time_ms' => 0, // Tempo inicial
                'ip_address' => $_SERVER['REMOTE_ADDR'] ?? null,
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null,
                'created_at' => date('c')
                // Removido updated_at para evitar erro
            ];
            
            error_log('Auth REST: Tentando registrar uso da API');
            
            try {
                $logResponse = $supabase
                    ->from('api_usage_logs')
                    ->insert($logData);
                    // ->execute(); - Deixamos o execute fora para verificar se conseguimos chamar o método
                
                // Verificar se logResponse tem o método execute
                if (is_object($logResponse) && method_exists($logResponse, 'execute')) {
                    $logResponse = $logResponse->execute();
                    
                    $logId = null;
                    // Verificar erro
                    $error = null;
                    if (is_object($logResponse) && method_exists($logResponse, 'getError')) {
                        $error = $logResponse->getError();
                    } elseif (is_object($logResponse) && isset($logResponse->error)) {
                        $error = $logResponse->error;
                    }
                    
                    if (!$error) {
                        // Tentar obter dados da resposta
                        if (is_object($logResponse) && method_exists($logResponse, 'getData')) {
                            $logResult = $logResponse->getData();
                        } elseif (is_object($logResponse) && isset($logResponse->data)) {
                            $logResult = $logResponse->data;
                        } else {
                            $logResult = $logResponse; 
                        }
                        
                        // Tentar extrair ID
                        if (is_array($logResult) && !empty($logResult)) {
                            $logId = $logResult[0]->id ?? null;
                        } elseif (is_object($logResult)) {
                            $logId = $logResult->id ?? null;
                        }
                        
                        error_log('Auth REST: Uso da API registrado com sucesso' . ($logId ? ', ID: ' . $logId : ''));
                    } else {
                        $errorMessage = method_exists($error, 'getMessage') ? $error->getMessage() : (is_string($error) ? $error : 'Erro desconhecido');
                        error_log('Auth REST: Erro ao registrar uso da API: ' . $errorMessage);
                        // Não interromper o fluxo se o log falhar
                    }
                } else {
                    error_log('Auth REST: Método execute não disponível no objeto de resposta - pulando registro de uso');
                }
            } catch (Exception $e) {
                error_log('Auth REST: Exceção ao registrar uso da API (inner): ' . $e->getMessage());
                // Não interromper o fluxo se o log falhar
            }
        } catch (Exception $e) {
            error_log('Auth REST: Exceção ao registrar uso da API (outer): ' . $e->getMessage());
            // Não interromper o fluxo se o log falhar
        }
        
        // Atualizar timestamp de último uso - ignora erros se falhar
        try {
            error_log('Auth REST: Tentando atualizar timestamp de último uso');
            
            try {
                $updateResponse = $supabase
                    ->from('api_keys')
                    ->update(['last_used_at' => date('c')])
                    ->filter('id', 'eq', $apiKeyData->id);
                
                // Verificar se updateResponse tem o método execute
                if (is_object($updateResponse) && method_exists($updateResponse, 'execute')) {
                    $updateResponse = $updateResponse->execute();
                    
                    // Verificar erro
                    $error = null;
                    if (is_object($updateResponse) && method_exists($updateResponse, 'getError')) {
                        $error = $updateResponse->getError();
                    } elseif (is_object($updateResponse) && isset($updateResponse->error)) {
                        $error = $updateResponse->error;
                    }
                    
                    if ($error) {
                        $errorMessage = method_exists($error, 'getMessage') ? $error->getMessage() : (is_string($error) ? $error : 'Erro desconhecido');
                        error_log('Auth REST: Erro ao atualizar último uso da API Key: ' . $errorMessage);
                        // Não interromper o fluxo se a atualização falhar
                    } else {
                        error_log('Auth REST: Timestamp de último uso atualizado com sucesso');
                    }
                } else {
                    error_log('Auth REST: Método execute não disponível no objeto de resposta - pulando atualização');
                }
            } catch (Exception $e) {
                error_log('Auth REST: Exceção ao atualizar último uso da API Key (inner): ' . $e->getMessage());
                // Não interromper o fluxo se a atualização falhar
            }
        } catch (Exception $e) {
            error_log('Auth REST: Exceção ao atualizar último uso da API Key (outer): ' . $e->getMessage());
            // Não interromper o fluxo se a atualização falhar
        }
        
        // Construir resultado
        $permissions = null;
        
        // Tentar decodificar permissões apenas se for string JSON
        if (isset($apiKeyData->permissions) && is_string($apiKeyData->permissions)) {
            $permissions = json_decode($apiKeyData->permissions);
        } elseif (isset($apiKeyData->permissions) && (is_object($apiKeyData->permissions) || is_array($apiKeyData->permissions))) {
            $permissions = $apiKeyData->permissions; // Já está decodificado
        }
        
        $result = [
            'api_key_id' => $apiKeyData->id,
            'user_id' => $apiKeyData->user_id,
            'email' => $userEmail,
            'name' => $apiKeyData->name,
            'permissions' => $permissions,
            'rate_limit' => $apiKeyData->rate_limit
        ];
        
        error_log('Auth REST: Autenticação por API Key concluída com sucesso');
        
        // Armazenar em cache por 5 minutos
        $apiKeyCache[$cacheKey] = [
            'data' => $result,
            'expires' => time() + 300 // 5 minutos
        ];
        
        // Log de sucesso
        error_log('Auth REST: API Key autenticada com sucesso: ' . substr($apiKey, 0, 5) . '...' . substr($apiKey, -5));
        
        // Retornar resultado
        return $result;
    } catch (Exception $e) {
        // Registrar erro em log, mas não expor detalhes sensíveis
        error_log('Auth REST: Erro ao autenticar API Key: ' . $e->getMessage());
        sendResponse(500, errorResponse(500, 'Erro interno de autenticação.', 'AUTH_ERROR'));
        exit;
    }
}

/**
 * Função principal de autenticação
 * Tenta autenticar usando JWT ou API Key
 * 
 * @return array Dados do usuário autenticado
 */
function authenticate() {
    // Verificar cabeçalhos para determinar o método de autenticação
    $headers = getallheaders();
    
    // Para depuração
    $headersLog = [];
    foreach ($headers as $key => $value) {
        if (strtolower($key) === 'authorization') {
            $headersLog[$key] = 'Bearer ' . substr(str_replace('Bearer ', '', $value), 0, 10) . '...';
        } else if (strtolower($key) === 'x-api-key') {
            $headersLog[$key] = substr($value, 0, 5) . '...' . substr($value, -5);
        } else {
            $headersLog[$key] = $value;
        }
    }
    error_log('Auth REST: Cabeçalhos de autenticação: ' . json_encode($headersLog));
    
    // Tentar autenticar via API Key primeiro
    if (isset($headers['X-API-Key'])) {
        error_log('Auth REST: Tentando autenticação por API Key');
        $apiAuthResult = authenticateApiKey();
        
        if ($apiAuthResult) {
            return [
                'authenticated' => true,
                'method' => 'api_key',
                'user_id' => $apiAuthResult['user_id'],
                'email' => $apiAuthResult['email'],
                'api_key_id' => $apiAuthResult['api_key_id']
            ];
        }
    }
    
    // Se não houver API Key, tentar via JWT
    error_log('Auth REST: Tentando autenticação por JWT');
    $jwtAuthResult = authenticateJwt(false);
    
    if ($jwtAuthResult) {
        return [
            'authenticated' => true,
            'method' => 'jwt',
            'user_id' => $jwtAuthResult['user_id'],
            'email' => $jwtAuthResult['email'],
            'role' => $jwtAuthResult['role'],
            'exp' => $jwtAuthResult['exp']
        ];
    }
    
    // Nenhum método de autenticação válido
    error_log('Auth REST: Nenhum método de autenticação válido');
    return [
        'authenticated' => false,
        'error' => 'Autenticação necessária'
    ];
}