<?php
/**
 * Middleware para limitação de taxa (Rate Limiting)
 */

require_once __DIR__ . '/../utils/response.php';

/**
 * Verifica se o cliente excedeu o limite de requisições
 * 
 * @param string $identifier Identificador do cliente (IP ou API Key)
 * @param int $maxRequests Número máximo de requisições permitidas
 * @param int $window Janela de tempo em segundos
 * @return bool True se o cliente está dentro do limite, False caso contrário
 */
function checkRateLimit($identifier, $maxRequests = null, $window = null) {
    // Obter configurações padrão se não fornecidas
    $config = require __DIR__ . '/../config/config.php';
    $maxRequests = $maxRequests ?? $config['rate_limit']['max_requests'] ?? 60;
    $window = $window ?? $config['rate_limit']['window'] ?? 60;
    
    // Caso o rate limiting esteja desativado
    if (!($config['rate_limit']['enabled'] ?? true)) {
        return true;
    }
    
    // Diretório para armazenar contadores de taxa
    $dir = __DIR__ . '/../data/rate_limit';
    if (!is_dir($dir)) {
        mkdir($dir, 0777, true);
    }
    
    // Arquivo para o identificador atual
    $identifier = preg_replace('/[^a-zA-Z0-9]/', '_', $identifier);
    $file = $dir . '/' . $identifier . '.json';
    
    // Obter contagem atual
    $current = [
        'count' => 0,
        'reset' => time() + $window,
    ];
    
    if (file_exists($file)) {
        $current = json_decode(file_get_contents($file), true);
        
        // Verificar se o período foi reiniciado
        if (time() > $current['reset']) {
            $current = [
                'count' => 0,
                'reset' => time() + $window,
            ];
        }
    }
    
    // Incrementar contagem
    $current['count']++;
    
    // Salvar contagem atualizada
    file_put_contents($file, json_encode($current));
    
    // Definir cabeçalhos de limite de taxa
    header('X-RateLimit-Limit: ' . $maxRequests);
    header('X-RateLimit-Remaining: ' . max(0, $maxRequests - $current['count']));
    header('X-RateLimit-Reset: ' . $current['reset']);
    
    // Verificar se excedeu o limite
    if ($current['count'] > $maxRequests) {
        // Adicionar cabeçalho Retry-After
        header('Retry-After: ' . ($current['reset'] - time()));
        return false;
    }
    
    return true;
}

/**
 * Aplica o middleware de limitação de taxa
 * 
 * @param string $identifier Identificador do cliente (IP ou API Key)
 * @param int $maxRequests Número máximo de requisições permitidas
 * @param int $window Janela de tempo em segundos
 * @return void
 */
function applyRateLimit($identifier = null, $maxRequests = null, $window = null) {
    // Usar IP como identificador padrão
    $identifier = $identifier ?? $_SERVER['REMOTE_ADDR'];
    
    // Verificar limite de taxa
    if (!checkRateLimit($identifier, $maxRequests, $window)) {
        sendResponse(429, errorResponse(
            429, 
            'Limite de requisições excedido. Tente novamente mais tarde.',
            'RATE_LIMIT_EXCEEDED'
        ));
        exit;
    }
}