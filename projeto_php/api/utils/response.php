<?php
/**
 * Utilidades para manipulação de respostas da API
 */

/**
 * Envia uma resposta JSON para o cliente
 * 
 * @param int $statusCode Código de status HTTP
 * @param array $data Dados a serem enviados
 * @param array $headers Cabeçalhos adicionais
 * @return void
 */
function sendResponse($statusCode, $data, $headers = []) {
    // Definir código de status
    http_response_code($statusCode);
    
    // Definir cabeçalhos padrão
    header('Content-Type: application/json; charset=utf-8');
    
    // Adicionar cabeçalhos personalizados
    foreach ($headers as $name => $value) {
        header("$name: $value");
    }
    
    // Adicionar informações de tempo de resposta e uso de memória em modo debug
    $config = require __DIR__ . '/../config/config.php';
    if (isset($config['debug']) && $config['debug']) {
        $data['_debug'] = [
            'memory_usage' => formatBytes(memory_get_usage(true)),
            'execution_time' => microtime(true) - $_SERVER['REQUEST_TIME_FLOAT'],
        ];
    }
    
    // Enviar resposta
    echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Cria uma resposta de erro padrão
 * 
 * @param int $statusCode Código de status HTTP
 * @param string $message Mensagem de erro
 * @param string $errorCode Código de erro opcional
 * @param array $details Detalhes adicionais do erro
 * @return array Estrutura de resposta de erro
 */
function errorResponse($statusCode, $message, $errorCode = null, $details = []) {
    $response = [
        'error' => [
            'message' => $message,
            'status' => $statusCode,
        ]
    ];
    
    // Adicionar código de erro se fornecido
    if ($errorCode) {
        $response['error']['code'] = $errorCode;
    }
    
    // Adicionar detalhes se fornecidos
    if (!empty($details)) {
        $response['error']['details'] = $details;
    }
    
    return $response;
}

/**
 * Formata bytes para uma representação legível
 * 
 * @param int $bytes Número de bytes
 * @param int $precision Precisão decimal
 * @return string Representação formatada
 */
function formatBytes($bytes, $precision = 2) {
    $units = ['B', 'KB', 'MB', 'GB', 'TB'];
    
    $bytes = max($bytes, 0);
    $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
    $pow = min($pow, count($units) - 1);
    
    $bytes /= pow(1024, $pow);
    
    return round($bytes, $precision) . ' ' . $units[$pow];
}

/**
 * Gera uma referência única de requisição
 * 
 * @return string Referência da requisição
 */
function generateRequestRef() {
    return uniqid('req_', true);
}