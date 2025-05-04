<?php
/**
 * Utilidades para manipulação de JWT
 */

/**
 * Decodifica e valida um token JWT
 * 
 * @param string $token O token JWT a ser validado
 * @param string $secret A chave secreta para validação
 * @return object|false Payload decodificado ou false em caso de erro
 */
function verifyJwt($token, $secret) {
    // Dividir o token em partes (header, payload, signature)
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return false;
    }
    
    list($headerB64, $payloadB64, $signature) = $parts;
    
    // Decodificar header e payload
    $header = json_decode(base64UrlDecode($headerB64));
    $payload = json_decode(base64UrlDecode($payloadB64));
    
    // Verificar expiração
    if (isset($payload->exp) && $payload->exp < time()) {
        return false;
    }
    
    // Verificar assinatura
    $generatedSignature = generateSignature("$headerB64.$payloadB64", $secret);
    if ($generatedSignature !== $signature) {
        return false;
    }
    
    return $payload;
}

/**
 * Gera um token JWT
 * 
 * @param array $payload Os dados a serem incluídos no token
 * @param string $secret A chave secreta para assinatura
 * @param int $expiration Tempo de expiração em segundos
 * @return string O token JWT gerado
 */
function generateJwt($payload, $secret, $expiration = 3600) {
    // Adicionar claims padrão
    $payload['iat'] = time(); // Issued At
    $payload['exp'] = time() + $expiration; // Expiration
    
    // Gerar header
    $header = [
        'typ' => 'JWT',
        'alg' => 'HS256'
    ];
    
    // Converter header e payload para Base64Url
    $headerB64 = base64UrlEncode(json_encode($header));
    $payloadB64 = base64UrlEncode(json_encode($payload));
    
    // Gerar assinatura
    $signature = generateSignature("$headerB64.$payloadB64", $secret);
    
    // Montar token
    return "$headerB64.$payloadB64.$signature";
}

/**
 * Gera a assinatura para um token JWT
 * 
 * @param string $data Os dados a serem assinados
 * @param string $secret A chave secreta
 * @return string A assinatura gerada
 */
function generateSignature($data, $secret) {
    return base64UrlEncode(hash_hmac('sha256', $data, $secret, true));
}

/**
 * Codifica dados em Base64Url
 * 
 * @param string $data Os dados a serem codificados
 * @return string Dados codificados em Base64Url
 */
function base64UrlEncode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

/**
 * Decodifica dados em Base64Url
 * 
 * @param string $data Os dados a serem decodificados
 * @return string Dados decodificados
 */
function base64UrlDecode($data) {
    return base64_decode(strtr($data, '-_', '+/'));
}