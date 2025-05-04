<?php
/**
 * Configuração do banco de dados
 */

// Obter configurações do Supabase
$supabase = require __DIR__ . '/supabase.php';

// Extrair host e porta da URL do Supabase
$url = parse_url($supabase['url']);
$host = $url['host'] ?? 'db.gciezqjeaehrtihqjihz.supabase.co';
$port = $url['port'] ?? 5432;

return [
    'driver' => 'pgsql',
    'host' => $host,
    'port' => $port,
    'database' => 'postgres',
    'username' => 'postgres',
    'password' => $supabase['service_role_key'], // A chave de serviço é usada como senha
    'charset' => 'utf8',
    'schema' => 'public',
    'options' => [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ],
];