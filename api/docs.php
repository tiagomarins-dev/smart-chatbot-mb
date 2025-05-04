<?php
// Verificar se o arquivo Swagger existe
$swaggerFile = __DIR__ . '/swagger.json';

if (!file_exists($swaggerFile)) {
    http_response_code(404);
    echo "Arquivo de documentação não encontrado";
    exit;
}

// Carregar o arquivo Swagger
$swaggerJson = file_get_contents($swaggerFile);

// Verificar se é um JSON válido
$swagger = json_decode($swaggerJson);
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(500);
    echo "Erro ao analisar a documentação Swagger";
    exit;
}

// Definir o título da página
$title = $swagger->info->title ?? 'API Documentation';
$version = $swagger->info->version ?? '1.0.0';
?>

<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlspecialchars($title); ?> - Documentação</title>
    
    <!-- Swagger UI CSS -->
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui.css" />
    
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        .topbar {
            background-color: #1976D2;
            padding: 10px 20px;
            color: white;
        }
        .topbar-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .swagger-ui .topbar {
            display: none;
        }
        .swagger-ui .information-container {
            margin-top: 20px;
        }
        .version-badge {
            background-color: #0D47A1;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="topbar">
        <div class="topbar-info">
            <h1><?php echo htmlspecialchars($title); ?></h1>
            <span class="version-badge">v<?php echo htmlspecialchars($version); ?></span>
        </div>
    </div>
    
    <div id="swagger-ui"></div>
    
    <!-- Swagger UI JavaScript -->
    <script src="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui-standalone-preset.js"></script>
    
    <script>
        window.onload = function() {
            const ui = SwaggerUIBundle({
                url: "swagger.json",
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout",
                defaultModelsExpandDepth: -1, // Oculta a seção "Models" por padrão
                displayRequestDuration: true,
                filter: true,
                syntaxHighlight: {
                    activated: true,
                    theme: "agate"
                }
            });
            
            window.ui = ui;
        };
    </script>
</body>
</html>