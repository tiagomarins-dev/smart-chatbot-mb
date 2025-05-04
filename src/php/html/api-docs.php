<?php
// Verificar se o arquivo Swagger existe
$swaggerFile = __DIR__ . '/../../../api/swagger.json';

// Verificar se o arquivo pode ser lido
if (!file_exists($swaggerFile) || !is_readable($swaggerFile)) {
    // Se não conseguir acessar o arquivo JSON, incluir o conteúdo diretamente
    $swaggerJson = <<<'JSON'
{
  "openapi": "3.0.0",
  "info": {
    "title": "Smart-ChatBox API",
    "description": "API para gerenciamento de WhatsApp, empresas, projetos e leads.",
    "version": "1.0.0",
    "contact": {
      "name": "Tiago Marins",
      "url": "https://github.com/tiagomarins-dev/smart-chatbot-mb"
    }
  },
  "servers": [
    {
      "url": "/api",
      "description": "Servidor de produção"
    },
    {
      "url": "http://localhost/api",
      "description": "Servidor local"
    }
  ],
  "tags": [
    {
      "name": "auth",
      "description": "Operações de autenticação"
    },
    {
      "name": "messages",
      "description": "Gerenciamento de mensagens do WhatsApp"
    },
    {
      "name": "contacts",
      "description": "Gerenciamento de contatos"
    },
    {
      "name": "webhooks",
      "description": "Gerenciamento de webhooks"
    },
    {
      "name": "companies",
      "description": "Gerenciamento de empresas"
    }
  ],
  "paths": {
    "/v1/auth": {
      "post": {
        "tags": ["auth"],
        "summary": "Autenticar usuário",
        "description": "Autentica um usuário com email e senha ou obtém um token através de uma chave API",
        "operationId": "authenticate",
        "parameters": [
          {
            "name": "action",
            "in": "query",
            "description": "Ação de autenticação (login, token)",
            "required": true,
            "schema": {
              "type": "string",
              "enum": ["login", "token"]
            }
          }
        ],
        "requestBody": {
          "description": "Credenciais do usuário",
          "content": {
            "application/json": {
              "schema": {
                "oneOf": [
                  {
                    "$ref": "#/components/schemas/LoginCredentials"
                  },
                  {
                    "$ref": "#/components/schemas/ApiCredentials"
                  }
                ]
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "Autenticação bem-sucedida",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AuthResponse"
                }
              }
            }
          },
          "401": {
            "description": "Credenciais inválidas",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          }
        }
      }
    },
    "/v1/companies": {
      "get": {
        "tags": ["companies"],
        "summary": "Listar empresas",
        "description": "Retorna a lista de empresas do usuário autenticado",
        "operationId": "getCompanies",
        "security": [
          {
            "bearerAuth": []
          },
          {
            "apiKeyAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "query",
            "description": "ID da empresa (opcional)",
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Lista de empresas",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "companies": {
                      "type": "array",
                      "items": {
                        "$ref": "#/components/schemas/Company"
                      }
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Não autorizado",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          }
        }
      },
      "post": {
        "tags": ["companies"],
        "summary": "Criar empresa",
        "description": "Cria uma nova empresa",
        "operationId": "createCompany",
        "security": [
          {
            "bearerAuth": []
          },
          {
            "apiKeyAuth": []
          }
        ],
        "requestBody": {
          "description": "Dados da empresa",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/CompanyInput"
              }
            }
          },
          "required": true
        },
        "responses": {
          "201": {
            "description": "Empresa criada com sucesso",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "company": {
                      "$ref": "#/components/schemas/Company"
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "Dados inválidos",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          },
          "401": {
            "description": "Não autorizado",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          }
        }
      }
    },
    "/v1/companies/{id}": {
      "put": {
        "tags": ["companies"],
        "summary": "Atualizar empresa",
        "description": "Atualiza uma empresa existente",
        "operationId": "updateCompany",
        "security": [
          {
            "bearerAuth": []
          },
          {
            "apiKeyAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "description": "ID da empresa",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "requestBody": {
          "description": "Dados da empresa",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/CompanyUpdateInput"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "Empresa atualizada com sucesso",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "company": {
                      "$ref": "#/components/schemas/Company"
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "Dados inválidos",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          },
          "401": {
            "description": "Não autorizado",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          },
          "404": {
            "description": "Empresa não encontrada",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          }
        }
      },
      "delete": {
        "tags": ["companies"],
        "summary": "Desativar empresa",
        "description": "Desativa uma empresa existente (soft delete)",
        "operationId": "deactivateCompany",
        "security": [
          {
            "bearerAuth": []
          },
          {
            "apiKeyAuth": []
          }
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "description": "ID da empresa",
            "required": true,
            "schema": {
              "type": "string",
              "format": "uuid"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Empresa desativada com sucesso",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "message": {
                      "type": "string",
                      "example": "Empresa desativada com sucesso"
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Não autorizado",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          },
          "404": {
            "description": "Empresa não encontrada",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          }
        }
      }
    },
    "/v1/messages": {
      "get": {
        "tags": ["messages"],
        "summary": "Listar mensagens",
        "description": "Retorna a lista de mensagens do WhatsApp",
        "operationId": "getMessages",
        "security": [
          {
            "bearerAuth": []
          },
          {
            "apiKeyAuth": []
          }
        ],
        "parameters": [
          {
            "name": "phone",
            "in": "query",
            "description": "Número de telefone para filtrar mensagens",
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "limit",
            "in": "query",
            "description": "Número máximo de mensagens por número",
            "schema": {
              "type": "integer",
              "default": 50
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Lista de mensagens",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "messages": {
                      "type": "object",
                      "additionalProperties": {
                        "type": "array",
                        "items": {
                          "$ref": "#/components/schemas/Message"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Não autorizado",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          }
        }
      },
      "post": {
        "tags": ["messages"],
        "summary": "Enviar mensagem",
        "description": "Envia uma mensagem do WhatsApp",
        "operationId": "sendMessage",
        "security": [
          {
            "bearerAuth": []
          },
          {
            "apiKeyAuth": []
          }
        ],
        "requestBody": {
          "description": "Dados da mensagem",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/MessageInput"
              }
            }
          },
          "required": true
        },
        "responses": {
          "200": {
            "description": "Mensagem enviada com sucesso",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {
                      "type": "boolean",
                      "example": true
                    },
                    "to": {
                      "type": "string",
                      "example": "5511999999999"
                    },
                    "message_id": {
                      "type": "string",
                      "example": "3EB01234567890F234C"
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "Dados inválidos",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          },
          "401": {
            "description": "Não autorizado",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          }
        }
      }
    },
    "/v1/contacts": {
      "get": {
        "tags": ["contacts"],
        "summary": "Listar contatos",
        "description": "Retorna a lista de contatos do WhatsApp",
        "operationId": "getContacts",
        "security": [
          {
            "bearerAuth": []
          },
          {
            "apiKeyAuth": []
          }
        ],
        "parameters": [
          {
            "name": "phone",
            "in": "query",
            "description": "Número de telefone para filtrar contatos",
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Lista de contatos",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "contacts": {
                      "type": "array",
                      "items": {
                        "$ref": "#/components/schemas/Contact"
                      }
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Não autorizado",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          }
        }
      }
    },
    "/v1/webhooks": {
      "get": {
        "tags": ["webhooks"],
        "summary": "Listar webhooks",
        "description": "Retorna a lista de webhooks configurados",
        "operationId": "getWebhooks",
        "security": [
          {
            "bearerAuth": []
          },
          {
            "apiKeyAuth": []
          }
        ],
        "responses": {
          "200": {
            "description": "Lista de webhooks",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "webhooks": {
                      "type": "array",
                      "items": {
                        "$ref": "#/components/schemas/Webhook"
                      }
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Não autorizado",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          }
        }
      },
      "post": {
        "tags": ["webhooks"],
        "summary": "Criar webhook",
        "description": "Cria um novo webhook",
        "operationId": "createWebhook",
        "security": [
          {
            "bearerAuth": []
          },
          {
            "apiKeyAuth": []
          }
        ],
        "requestBody": {
          "description": "Dados do webhook",
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/WebhookInput"
              }
            }
          },
          "required": true
        },
        "responses": {
          "201": {
            "description": "Webhook criado com sucesso",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "webhook": {
                      "$ref": "#/components/schemas/Webhook"
                    },
                    "secret_token": {
                      "type": "string",
                      "description": "Token secreto (exibido apenas uma vez)",
                      "example": "whsec_abc123def456"
                    }
                  }
                }
              }
            }
          },
          "400": {
            "description": "Dados inválidos",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          },
          "401": {
            "description": "Não autorizado",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/ErrorResponse"
                }
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "securitySchemes": {
      "bearerAuth": {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT",
        "description": "Token JWT obtido através do endpoint de autenticação"
      },
      "apiKeyAuth": {
        "type": "apiKey",
        "in": "header",
        "name": "X-API-Key",
        "description": "Chave API obtida na página de integrações"
      }
    },
    "schemas": {
      "LoginCredentials": {
        "type": "object",
        "required": ["email", "password"],
        "properties": {
          "email": {
            "type": "string",
            "format": "email",
            "example": "usuario@exemplo.com"
          },
          "password": {
            "type": "string",
            "format": "password",
            "example": "senha123"
          }
        }
      },
      "ApiCredentials": {
        "type": "object",
        "required": ["key", "secret"],
        "properties": {
          "key": {
            "type": "string",
            "example": "key_abc123def456"
          },
          "secret": {
            "type": "string",
            "example": "secret_xyz789uvw123"
          }
        }
      },
      "AuthResponse": {
        "type": "object",
        "properties": {
          "token": {
            "type": "string",
            "example": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
          },
          "expires_in": {
            "type": "integer",
            "example": 3600
          },
          "token_type": {
            "type": "string",
            "example": "Bearer"
          },
          "user": {
            "type": "object",
            "properties": {
              "id": {
                "type": "string",
                "format": "uuid",
                "example": "123e4567-e89b-12d3-a456-426614174000"
              },
              "email": {
                "type": "string",
                "format": "email",
                "example": "usuario@exemplo.com"
              }
            }
          }
        }
      },
      "Company": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid",
            "example": "123e4567-e89b-12d3-a456-426614174000"
          },
          "user_id": {
            "type": "string",
            "format": "uuid",
            "example": "123e4567-e89b-12d3-a456-426614174000"
          },
          "name": {
            "type": "string",
            "example": "Milla Borges"
          },
          "is_active": {
            "type": "boolean",
            "example": true
          },
          "created_at": {
            "type": "string",
            "format": "date-time",
            "example": "2025-05-04T12:00:00Z"
          },
          "updated_at": {
            "type": "string",
            "format": "date-time",
            "example": "2025-05-04T12:00:00Z"
          }
        }
      },
      "CompanyInput": {
        "type": "object",
        "required": ["name"],
        "properties": {
          "name": {
            "type": "string",
            "example": "Milla Borges"
          }
        }
      },
      "CompanyUpdateInput": {
        "type": "object",
        "required": ["name"],
        "properties": {
          "name": {
            "type": "string",
            "example": "Milla Borges"
          },
          "is_active": {
            "type": "boolean",
            "example": true
          }
        }
      },
      "Message": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "example": "3EB01234567890F234C"
          },
          "body": {
            "type": "string",
            "example": "Olá, como vai?"
          },
          "fromMe": {
            "type": "boolean",
            "example": false
          },
          "fromOtherDevice": {
            "type": "boolean",
            "example": false
          },
          "timestamp": {
            "type": "string",
            "format": "date-time",
            "example": "2025-05-04T12:00:00Z"
          },
          "type": {
            "type": "string",
            "example": "chat"
          }
        }
      },
      "MessageInput": {
        "type": "object",
        "required": ["phone_number", "message_content"],
        "properties": {
          "phone_number": {
            "type": "string",
            "example": "5511999999999"
          },
          "message_content": {
            "type": "string",
            "example": "Olá, como vai?"
          }
        }
      },
      "Contact": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "example": "5511999999999@c.us"
          },
          "name": {
            "type": "string",
            "example": "João Silva"
          },
          "number": {
            "type": "string",
            "example": "5511999999999"
          },
          "profilePicture": {
            "type": "string",
            "format": "uri",
            "example": "https://exemplo.com/foto.jpg"
          },
          "isGroup": {
            "type": "boolean",
            "example": false
          }
        }
      },
      "Webhook": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "format": "uuid",
            "example": "123e4567-e89b-12d3-a456-426614174000"
          },
          "user_id": {
            "type": "string",
            "format": "uuid",
            "example": "123e4567-e89b-12d3-a456-426614174000"
          },
          "name": {
            "type": "string",
            "example": "Notificações de Mensagens"
          },
          "url": {
            "type": "string",
            "format": "uri",
            "example": "https://meu-app.com/webhook"
          },
          "events": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "example": ["message.received", "message.sent"]
          },
          "is_active": {
            "type": "boolean",
            "example": true
          },
          "created_at": {
            "type": "string",
            "format": "date-time",
            "example": "2025-05-04T12:00:00Z"
          },
          "updated_at": {
            "type": "string",
            "format": "date-time",
            "example": "2025-05-04T12:00:00Z"
          },
          "last_triggered_at": {
            "type": "string",
            "format": "date-time",
            "example": "2025-05-04T12:30:00Z"
          }
        }
      },
      "WebhookInput": {
        "type": "object",
        "required": ["name", "url", "events"],
        "properties": {
          "name": {
            "type": "string",
            "example": "Notificações de Mensagens"
          },
          "url": {
            "type": "string",
            "format": "uri",
            "example": "https://meu-app.com/webhook"
          },
          "events": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "example": ["message.received", "message.sent"]
          },
          "generate_secret": {
            "type": "boolean",
            "example": true
          }
        }
      },
      "ErrorResponse": {
        "type": "object",
        "properties": {
          "error": {
            "type": "string",
            "example": "Mensagem de erro"
          }
        }
      }
    }
  }
}
JSON;
} else {
    // Carregar o arquivo Swagger
    $swaggerJson = file_get_contents($swaggerFile);
}

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
    
    <!-- Font Awesome Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- Google Fonts - Inter -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        .custom-navbar {
            background-color: #1976D2;
            padding: 10px 20px;
            color: white;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .custom-navbar a {
            color: white;
            text-decoration: none;
            margin-right: 20px;
        }
        .custom-navbar a:hover {
            text-decoration: underline;
        }
        .swagger-ui .topbar {
            display: none;
        }
        .version-badge {
            background-color: #0D47A1;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 14px;
        }
        .title-container {
            display: flex;
            align-items: center;
        }
        .title-container h1 {
            margin: 0;
            margin-right: 15px;
        }
        .navbar-links a {
            color: white;
            text-decoration: none;
            margin-left: 15px;
            display: inline-flex;
            align-items: center;
        }
        .navbar-links a i {
            margin-right: 5px;
        }
    </style>
</head>
<body>
    <div class="custom-navbar">
        <div class="title-container">
            <h1><?php echo htmlspecialchars($title); ?></h1>
            <span class="version-badge">v<?php echo htmlspecialchars($version); ?></span>
        </div>
        <div class="navbar-links">
            <a href="/"><i class="fas fa-home"></i> Home</a>
            <a href="/empresas.php"><i class="fas fa-building"></i> Empresas</a>
            <a href="/projetos.php"><i class="fas fa-project-diagram"></i> Projetos</a>
            <a href="/integracoes.php"><i class="fas fa-plug"></i> Integrações</a>
        </div>
    </div>
    
    <div id="swagger-ui"></div>
    
    <!-- Swagger UI JavaScript -->
    <script src="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui-standalone-preset.js"></script>
    
    <script>
        window.onload = function() {
            // Obter o JSON Swagger diretamente do PHP para evitar problemas de CORS ou caminho
            const spec = <?php echo $swaggerJson; ?>;
            
            // Corrigir os URLs dos servidores para a porta atual
            if (spec.servers && Array.isArray(spec.servers)) {
                const currentProtocol = window.location.protocol;
                const currentHost = window.location.host;
                
                // Adicionar servidor atual como primeira opção
                spec.servers.unshift({
                    url: `${currentProtocol}//${currentHost}/api`,
                    description: "Servidor atual"
                });
            }
            
            const ui = SwaggerUIBundle({
                spec: spec,
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