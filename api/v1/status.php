<?php
/**
 * Endpoint de status da API
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

// Autenticar requisição via API Key (escopo de leitura de status)
$auth = authenticateApiKey(['status:read']);

// Aplicar limite de taxa com base na API Key
applyRateLimit('api_' . $auth['api_key_id'], $auth['rate_limit']);

// Processar apenas requisições GET
if ($method === 'GET') {
    try {
        // Verificar status da conexão WhatsApp
        $isLocalhost = strpos($_SERVER['HTTP_HOST'], 'localhost') !== false || 
                      strpos($_SERVER['HTTP_HOST'], '127.0.0.1') !== false;
        $apiUrl = $isLocalhost ? 'http://localhost:3000/api' : 'http://node-api:3000/api';
        
        // Tentar obter status do WhatsApp
        $whatsappStatus = 'unknown';
        $connectionDetails = null;
        
        // Opções da requisição
        $options = [
            'http' => [
                'method' => 'GET',
                'header' => "Content-Type: application/json\r\n",
                'timeout' => 5,
            ],
        ];
        
        // Criar contexto e fazer a requisição
        $context = stream_context_create($options);
        $result = @file_get_contents($apiUrl . '/status', false, $context);
        
        if ($result !== false) {
            $statusData = json_decode($result, true);
            $whatsappStatus = $statusData['status'] ?? 'unknown';
            
            // Obter detalhes adicionais se estiver conectado
            if ($whatsappStatus === 'connected') {
                // Em uma implementação real, aqui você buscaria mais detalhes
                // sobre a conexão, como número conectado, última atividade, etc.
                $connectionDetails = [
                    'connected_at' => $statusData['timestamp'] ?? date('Y-m-d H:i:s'),
                ];
            }
        }
        
        // Obter estatísticas de uso da API
        $usage = [
            'daily' => [
                'total_requests' => 0,
                'successful_requests' => 0,
                'failed_requests' => 0,
            ],
            'monthly' => [
                'total_requests' => 0,
                'successful_requests' => 0,
                'failed_requests' => 0,
            ],
        ];
        
        // Buscar estatísticas diárias
        $dailyStats = Database::queryOne(
            'SELECT 
                SUM(total_requests) as total_requests,
                SUM(successful_requests) as successful_requests,
                SUM(failed_requests) as failed_requests
             FROM api_daily_stats
             WHERE user_id = ? AND date = CURRENT_DATE',
            [$auth['user_id']]
        );
        
        if ($dailyStats) {
            $usage['daily']['total_requests'] = (int)$dailyStats['total_requests'] ?: 0;
            $usage['daily']['successful_requests'] = (int)$dailyStats['successful_requests'] ?: 0;
            $usage['daily']['failed_requests'] = (int)$dailyStats['failed_requests'] ?: 0;
        }
        
        // Buscar estatísticas mensais
        $monthlyStats = Database::queryOne(
            'SELECT 
                SUM(total_requests) as total_requests,
                SUM(successful_requests) as successful_requests,
                SUM(failed_requests) as failed_requests
             FROM api_daily_stats
             WHERE user_id = ? AND date >= DATE_TRUNC(\'month\', CURRENT_DATE)',
            [$auth['user_id']]
        );
        
        if ($monthlyStats) {
            $usage['monthly']['total_requests'] = (int)$monthlyStats['total_requests'] ?: 0;
            $usage['monthly']['successful_requests'] = (int)$monthlyStats['successful_requests'] ?: 0;
            $usage['monthly']['failed_requests'] = (int)$monthlyStats['failed_requests'] ?: 0;
        }
        
        // Verificar limite de taxa restante
        $rateLimit = $auth['rate_limit'];
        $currentUsage = Database::queryOne(
            'SELECT request_count FROM api_rate_limits
             WHERE api_key_id = ? AND minute_timestamp = DATE_TRUNC(\'minute\', NOW())',
            [$auth['api_key_id']]
        );
        
        $currentCount = $currentUsage ? (int)$currentUsage['request_count'] : 0;
        $remainingRequests = $rateLimit - $currentCount;
        
        // Montar resposta
        $response = [
            'status' => 'online',
            'timestamp' => date('Y-m-d\TH:i:s\Z'),
            'version' => '1.0.0',
            'whatsapp' => [
                'status' => $whatsappStatus,
                'details' => $connectionDetails,
            ],
            'api' => [
                'usage' => $usage,
                'rate_limits' => [
                    'limit' => $rateLimit,
                    'remaining' => $remainingRequests,
                    'reset' => strtotime(date('Y-m-d H:i:00')) + 60, // Próximo minuto
                ],
            ],
        ];
        
        sendResponse(200, $response);
    } catch (Exception $e) {
        sendResponse(500, errorResponse(
            500,
            'Erro ao obter status da API.',
            'STATUS_ERROR'
        ));
    }
} else {
    // Método não permitido
    sendResponse(405, errorResponse(
        405,
        'Método não permitido. Use GET.',
        'METHOD_NOT_ALLOWED'
    ));
}