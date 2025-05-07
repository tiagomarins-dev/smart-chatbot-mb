<?php
/**
 * Ponto de entrada principal da API Smart-ChatBox
 */

// Configuração de exibição de erros
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Carregar configurações
$config = require_once __DIR__ . '/config/config.php';

// Configurar exibição de erros com base no modo de debug
if (isset($config['debug']) && $config['debug']) {
    ini_set('display_errors', 1);
} else {
    ini_set('display_errors', 0);
}

// Configurar fuso horário
date_default_timezone_set('America/Sao_Paulo');

// Carregar utilitários
require_once __DIR__ . '/utils/response.php';

// Preparar o tratamento de erros
set_error_handler(function($severity, $message, $file, $line) {
    throw new ErrorException($message, 0, $severity, $file, $line);
});

// Preparar o tratamento de exceções não capturadas
set_exception_handler(function($exception) {
    error_log($exception->getMessage() . ' in ' . $exception->getFile() . ' on line ' . $exception->getLine());
    
    $config = require_once __DIR__ . '/config/config.php';
    $debug = isset($config['debug']) && $config['debug'];
    
    $response = [
        'error' => [
            'message' => 'Erro interno do servidor.',
            'status' => 500,
            'code' => 'INTERNAL_ERROR',
        ]
    ];
    
    // Adicionar detalhes do erro em modo debug
    if ($debug) {
        $response['error']['debug'] = [
            'message' => $exception->getMessage(),
            'file' => $exception->getFile(),
            'line' => $exception->getLine(),
            'trace' => $exception->getTraceAsString(),
        ];
    }
    
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
});

// Obter o caminho da requisição
$path = $_SERVER['PATH_INFO'] ?? $_SERVER['REQUEST_URI'] ?? '/';
// Remover prefixo /api/ se existir
$path = preg_replace('|^/api/|', '', $path);
$path = trim($path, '/');

// Log para depuração
error_log('Request Path: ' . $path);
error_log('REQUEST_URI: ' . $_SERVER['REQUEST_URI']);
error_log('PATH_INFO: ' . ($_SERVER['PATH_INFO'] ?? 'não definido'));

// Verificar versão da API
if (strpos($path, 'v1/') === 0) {
    // API v1
    $endpoint = substr($path, 3); // Remover "v1/"
} else {
    // Redirecionar para a versão mais recente se nenhuma versão for especificada
    $endpoint = $path;
    
    // Se não for um endpoint da API v1, redirecionar
    if ($endpoint && $endpoint !== 'status') {
        header('Location: /api/v1/' . $endpoint);
        exit;
    }
}

// Rota de documentação
if ($endpoint === 'docs' || $endpoint === 'documentation') {
    require_once __DIR__ . '/docs.php';
    exit;
}

// Rota padrão (status da API)
if ($endpoint === '' || $endpoint === 'status') {
    // Informações básicas da API
    $response = [
        'name' => 'Smart-ChatBox API',
        'version' => '1.0.0',
        'status' => 'online',
        'timestamp' => date('Y-m-d\TH:i:s\Z'),
        'documentation' => '../api-docs.php',
        'endpoints' => [
            '/api/v1/auth',
            '/api/v1/messages',
            '/api/v1/contacts',
            '/api/v1/webhooks',
            '/api/v1/companies',
            '/api/v1/status',
        ],
    ];
    
    sendResponse(200, $response);
    exit;
}

// Extrair o endpoint base (antes de qualquer ID ou parâmetro)
$endpointBase = explode('/', $endpoint)[0];
error_log('Endpoint Base: ' . $endpointBase);

// Router para os endpoints disponíveis
$endpointFile = __DIR__ . '/v1/' . $endpointBase . '.php';

if (file_exists($endpointFile)) {
    // Executar o endpoint
    require_once $endpointFile;
} else {
    // Endpoint não encontrado
    sendResponse(404, errorResponse(
        404,
        'Endpoint não encontrado: ' . $endpoint,
        'ENDPOINT_NOT_FOUND'
    ));
}