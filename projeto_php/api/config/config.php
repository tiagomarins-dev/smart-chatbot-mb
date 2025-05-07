<?php
/**
 * Configuração principal da API
 * 
 * Este arquivo contém configurações gerais para a API.
 */

// Fuso horário
date_default_timezone_set('America/Sao_Paulo');

// Configurações da API
return [
    // Informações básicas da API
    'name' => 'Smart-ChatBox API',
    'version' => '1.0.0',
    'base_url' => '/api',
    
    // Configurações gerais
    'debug' => true, // Definir como false em produção
    'cors' => [
        'allowed_origins' => ['*'], // Origens permitidas (restringir em produção)
        'allowed_methods' => ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        'allowed_headers' => ['Content-Type', 'Authorization', 'X-Requested-With'],
        'expose_headers' => [],
        'max_age' => 86400, // 24 horas
        'allow_credentials' => false,
    ],
    
    // Limites de taxa padrão
    'rate_limit' => [
        'enabled' => true,
        'max_requests' => 60, // Requisições por minuto
        'window' => 60, // Período em segundos (1 minuto)
    ],
    
    // Tempo de expiração de tokens (em segundos)
    'token_expiration' => 3600, // 1 hora
    
    // Configurações do log
    'log' => [
        'enabled' => true,
        'file' => __DIR__ . '/../logs/api.log',
        'level' => 'info', // debug, info, warning, error
    ],
];