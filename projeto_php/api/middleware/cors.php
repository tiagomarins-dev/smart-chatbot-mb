<?php
/**
 * Middleware para CORS (Cross-Origin Resource Sharing)
 */

/**
 * Processa cabeçalhos CORS de acordo com a configuração
 * 
 * @return void
 */
function handleCors() {
    $config = require __DIR__ . '/../config/config.php';
    $corsConfig = $config['cors'] ?? [];
    
    // Origem permitida
    $allowedOrigins = $corsConfig['allowed_origins'] ?? ['*'];
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    
    if (in_array('*', $allowedOrigins) || in_array($origin, $allowedOrigins)) {
        header('Access-Control-Allow-Origin: ' . (in_array('*', $allowedOrigins) ? '*' : $origin));
    }
    
    // Métodos permitidos
    $allowedMethods = $corsConfig['allowed_methods'] ?? ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];
    header('Access-Control-Allow-Methods: ' . implode(', ', $allowedMethods));
    
    // Cabeçalhos permitidos
    $allowedHeaders = $corsConfig['allowed_headers'] ?? ['Content-Type', 'Authorization', 'X-Requested-With'];
    header('Access-Control-Allow-Headers: ' . implode(', ', $allowedHeaders));
    
    // Cabeçalhos expostos
    $exposeHeaders = $corsConfig['expose_headers'] ?? [];
    if (!empty($exposeHeaders)) {
        header('Access-Control-Expose-Headers: ' . implode(', ', $exposeHeaders));
    }
    
    // Tempo de cache
    $maxAge = $corsConfig['max_age'] ?? 86400;
    header('Access-Control-Max-Age: ' . $maxAge);
    
    // Credentials
    $allowCredentials = $corsConfig['allow_credentials'] ?? false;
    if ($allowCredentials) {
        header('Access-Control-Allow-Credentials: true');
    }
    
    // Responder imediatamente a requisições OPTIONS (preflight)
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204); // No Content
        exit;
    }
}