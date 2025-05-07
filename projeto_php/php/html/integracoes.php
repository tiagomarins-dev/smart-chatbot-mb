<!DOCTYPE html>
<html lang="pt-BR" data-bs-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Integrações - Smart-ChatBox</title>
    
    <!-- Bootstrap 5 -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    
    <!-- Font Awesome Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- Google Fonts - Inter -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Custom CSS -->
    <link rel="stylesheet" href="assets/css/style.css">
    
    <!-- Highlight.js para syntax highlighting -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/github-dark.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/languages/json.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/languages/bash.min.js"></script>
    
    <!-- Carregamento antecipado dos scripts de autenticação -->
    <script src="https://cdn.jsdelivr.net/npm/es-module-shims@1.6.3/dist/es-module-shims.js"></script>
    <script type="importmap">
        {
            "imports": {
                "@supabase/supabase-js": "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm",
                "./supabase.js": "./assets/js/supabase.js",
                "./auth.js": "./assets/js/auth.js",
                "./login-check.js": "./assets/js/login-check.js"
            }
        }
    </script>
    <script type="module">
        import './assets/js/login-check.js';
    </script>
</head>
<body>
    <!-- Navbar Fixa -->
    <nav class="navbar navbar-expand-lg fixed-top">
        <div class="container-fluid">
            <a class="navbar-brand" href="#">
                <i class="fab fa-whatsapp"></i>
                Smart-ChatBox
            </a>
            
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarMain">
                <i class="fas fa-bars"></i>
            </button>
            
            <div class="collapse navbar-collapse" id="navbarMain">
                <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                    <li class="nav-item">
                        <a class="nav-link" href="index.php"><i class="fas fa-home me-1"></i> Home</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="empresas.php"><i class="fas fa-building me-1"></i> Empresas</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="projetos.php"><i class="fas fa-project-diagram me-1"></i> Projetos</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="leads.php"><i class="fas fa-users me-1"></i> Leads</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link active" href="integracoes.php"><i class="fas fa-plug me-1"></i> Integrações</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="api-docs.php"><i class="fas fa-book me-1"></i> API Docs</a>
                    </li>
                </ul>
                
                <div class="d-flex align-items-center">
                    <div class="theme-switch me-3" id="theme-switch">
                        <i class="fas fa-sun theme-switch-icon" id="theme-icon"></i>
                    </div>
                    
                    <!-- Usuário não autenticado -->
                    <div class="non-auth-required">
                        <a href="login.php" class="btn btn-outline-primary me-2">
                            <i class="fas fa-sign-in-alt me-1"></i> Login
                        </a>
                        <a href="register.php" class="btn btn-primary">
                            <i class="fas fa-user-plus me-1"></i> Cadastro
                        </a>
                    </div>
                    
                    <!-- Usuário autenticado - Dropdown -->
                    <div class="dropdown auth-required d-none">
                        <button class="btn dropdown-toggle user-dropdown" type="button" data-bs-toggle="dropdown">
                            <i class="fas fa-user-circle me-1"></i> <span class="user-dropdown-text">Minha Conta</span>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li><a class="dropdown-item" href="#"><i class="fas fa-user-cog me-2"></i>Perfil</a></li>
                            <li><a class="dropdown-item" href="#"><i class="fas fa-cog me-2"></i>Configurações</a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item" href="#" id="logout-btn"><i class="fas fa-sign-out-alt me-2"></i>Logout</a></li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </nav>

    <!-- Conteúdo Principal -->
    <div class="container-fluid main-container">
        <!-- Mensagem para usuários não autenticados -->
        <div class="row mt-4 non-auth-required">
            <div class="col-12">
                <div class="card fade-in">
                    <div class="card-body text-center py-5">
                        <div class="mb-4">
                            <i class="fas fa-plug display-1 text-primary"></i>
                        </div>
                        <h2 class="mb-3">Acesso às Integrações</h2>
                        <p class="lead mb-4">Você precisa estar autenticado para gerenciar suas integrações e chaves API.</p>
                        <div class="d-grid gap-2 col-md-6 mx-auto">
                            <a href="login.php" class="btn btn-primary btn-lg">
                                <i class="fas fa-sign-in-alt me-2"></i> Entrar na plataforma
                            </a>
                            <a href="register.php" class="btn btn-outline-primary">
                                <i class="fas fa-user-plus me-2"></i> Criar uma conta
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Conteúdo principal para usuários autenticados -->
        <div class="auth-required d-none">
            <div class="row mt-4">
                <div class="col-12">
                    <div class="card fade-in">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0"><i class="fas fa-plug me-2"></i>Integrações e API</h5>
                        </div>
                        <div class="card-body">
                            <ul class="nav nav-tabs mb-4" id="integrationTabs" role="tablist">
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link active" id="apikeys-tab" data-bs-toggle="tab" data-bs-target="#apikeys" type="button" role="tab" aria-controls="apikeys" aria-selected="true">
                                        <i class="fas fa-key me-1"></i> Chaves API
                                    </button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" id="webhooks-tab" data-bs-toggle="tab" data-bs-target="#webhooks" type="button" role="tab" aria-controls="webhooks" aria-selected="false">
                                        <i class="fas fa-bell me-1"></i> Webhooks
                                    </button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" id="docs-tab" data-bs-toggle="tab" data-bs-target="#docs" type="button" role="tab" aria-controls="docs" aria-selected="false">
                                        <i class="fas fa-book me-1"></i> Documentação
                                    </button>
                                </li>
                            </ul>
                            
                            <div class="tab-content" id="integrationTabsContent">
                                <!-- Tab de Chaves API -->
                                <div class="tab-pane fade show active" id="apikeys" role="tabpanel" aria-labelledby="apikeys-tab">
                                    <div class="d-flex justify-content-between align-items-center mb-4">
                                        <h5>Minhas Chaves API</h5>
                                        <button id="create-api-key-btn" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#createApiKeyModal">
                                            <i class="fas fa-plus-circle me-1"></i> Nova Chave API
                                        </button>
                                    </div>
                                    
                                    <div class="alert alert-info" id="api-key-info">
                                        <i class="fas fa-info-circle me-1"></i> 
                                        As chaves API permitem que aplicações externas se conectem com segurança à sua conta Smart-ChatBox.
                                    </div>
                                    
                                    <div id="api-keys-list">
                                        <div class="text-center my-5" id="api-keys-loading">
                                            <div class="spinner-border text-primary" role="status">
                                                <span class="visually-hidden">Carregando...</span>
                                            </div>
                                            <p class="mt-2">Carregando suas chaves API...</p>
                                        </div>
                                        
                                        <div id="api-keys-empty" class="d-none">
                                            <div class="text-center my-5">
                                                <i class="fas fa-key text-muted" style="font-size: 3rem;"></i>
                                                <p class="mt-3">Você ainda não tem nenhuma chave API.</p>
                                                <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#createApiKeyModal">
                                                    <i class="fas fa-plus-circle me-1"></i> Criar Chave API
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div id="api-keys-table-container" class="d-none">
                                            <div class="table-responsive">
                                                <table class="table table-hover" id="api-keys-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Nome</th>
                                                            <th>Chave</th>
                                                            <th>Permissões</th>
                                                            <th>Limite</th>
                                                            <th>Status</th>
                                                            <th>Criada em</th>
                                                            <th>Ações</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <!-- Preenchido dinamicamente via JavaScript -->
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Tab de Webhooks -->
                                <div class="tab-pane fade" id="webhooks" role="tabpanel" aria-labelledby="webhooks-tab">
                                    <div class="d-flex justify-content-between align-items-center mb-4">
                                        <h5>Meus Webhooks</h5>
                                        <button id="create-webhook-btn" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#createWebhookModal">
                                            <i class="fas fa-plus-circle me-1"></i> Novo Webhook
                                        </button>
                                    </div>
                                    
                                    <div class="alert alert-info">
                                        <i class="fas fa-info-circle me-1"></i> 
                                        Os webhooks permitem que você receba notificações em tempo real sobre eventos do WhatsApp.
                                    </div>
                                    
                                    <div id="webhooks-list">
                                        <div class="text-center my-5" id="webhooks-loading">
                                            <div class="spinner-border text-primary" role="status">
                                                <span class="visually-hidden">Carregando...</span>
                                            </div>
                                            <p class="mt-2">Carregando seus webhooks...</p>
                                        </div>
                                        
                                        <div id="webhooks-empty" class="d-none">
                                            <div class="text-center my-5">
                                                <i class="fas fa-bell text-muted" style="font-size: 3rem;"></i>
                                                <p class="mt-3">Você ainda não tem nenhum webhook configurado.</p>
                                                <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#createWebhookModal">
                                                    <i class="fas fa-plus-circle me-1"></i> Criar Webhook
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div id="webhooks-table-container" class="d-none">
                                            <div class="table-responsive">
                                                <table class="table table-hover" id="webhooks-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Nome</th>
                                                            <th>URL</th>
                                                            <th>Eventos</th>
                                                            <th>Status</th>
                                                            <th>Última Execução</th>
                                                            <th>Ações</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <!-- Preenchido dinamicamente via JavaScript -->
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Tab de Documentação -->
                                <div class="tab-pane fade" id="docs" role="tabpanel" aria-labelledby="docs-tab">
                                    <h5 class="mb-4">Documentação da API</h5>
                                    
                                    <div class="accordion" id="docsAccordion">
                                        <!-- Introdução -->
                                        <div class="accordion-item">
                                            <h2 class="accordion-header" id="headingIntro">
                                                <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseIntro" aria-expanded="true" aria-controls="collapseIntro">
                                                    Introdução
                                                </button>
                                            </h2>
                                            <div id="collapseIntro" class="accordion-collapse collapse show" aria-labelledby="headingIntro" data-bs-parent="#docsAccordion">
                                                <div class="accordion-body">
                                                    <p>A API Smart-ChatBox permite que desenvolvedores integrem funcionalidades de mensagens WhatsApp diretamente em seus aplicativos.</p>
                                                    <p>Todas as requisições devem ser feitas para a URL base: <code>https://seu-dominio.com/api/v1/</code></p>
                                                    <div class="mt-3">
                                                        <a href="api-docs.php" class="btn btn-primary">
                                                            <i class="fas fa-book me-2"></i> Ver Documentação Completa (Swagger)
                                                        </a>
                                                    </div>
                                                    <h6>Autenticação</h6>
                                                    <p>Existem duas formas de autenticar suas requisições:</p>
                                                    <ol>
                                                        <li><strong>Token JWT</strong>: Obtenha um token via endpoint <code>/auth?action=token</code> e use-o no header Authorization.</li>
                                                        <li><strong>API Key</strong>: Use sua chave API diretamente no header X-API-Key.</li>
                                                    </ol>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <!-- Autenticação -->
                                        <div class="accordion-item">
                                            <h2 class="accordion-header" id="headingAuth">
                                                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseAuth" aria-expanded="false" aria-controls="collapseAuth">
                                                    Autenticação
                                                </button>
                                            </h2>
                                            <div id="collapseAuth" class="accordion-collapse collapse" aria-labelledby="headingAuth" data-bs-parent="#docsAccordion">
                                                <div class="accordion-body">
                                                    <h6>Obter Token JWT</h6>
                                                    <p>Para obter um token JWT, faça uma requisição POST para <code>/auth?action=token</code>:</p>
                                                    <pre><code class="language-bash">curl -X POST "https://seu-dominio.com/api/v1/auth?action=token" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "sua-chave-api",
    "secret": "seu-secret"
  }'</code></pre>
                                                    <p>Resposta:</p>
                                                    <pre><code class="language-json">{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600,
  "token_type": "Bearer",
  "scopes": ["messages:read", "messages:write", "contacts:read"]
}</code></pre>
                                                    <h6>Usar Token JWT</h6>
                                                    <pre><code class="language-bash">curl -X GET "https://seu-dominio.com/api/v1/messages" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."</code></pre>
                                                    <h6>Usar API Key Diretamente</h6>
                                                    <pre><code class="language-bash">curl -X GET "https://seu-dominio.com/api/v1/messages" \
  -H "X-API-Key: sua-chave-api"</code></pre>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <!-- Mensagens -->
                                        <div class="accordion-item">
                                            <h2 class="accordion-header" id="headingMessages">
                                                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseMessages" aria-expanded="false" aria-controls="collapseMessages">
                                                    Mensagens
                                                </button>
                                            </h2>
                                            <div id="collapseMessages" class="accordion-collapse collapse" aria-labelledby="headingMessages" data-bs-parent="#docsAccordion">
                                                <div class="accordion-body">
                                                    <h6>Listar Mensagens</h6>
                                                    <pre><code class="language-bash">curl -X GET "https://seu-dominio.com/api/v1/messages" \
  -H "X-API-Key: sua-chave-api"</code></pre>
                                                    <h6>Filtrar por Número</h6>
                                                    <pre><code class="language-bash">curl -X GET "https://seu-dominio.com/api/v1/messages?phone=5511999999999" \
  -H "X-API-Key: sua-chave-api"</code></pre>
                                                    <h6>Enviar Mensagem</h6>
                                                    <pre><code class="language-bash">curl -X POST "https://seu-dominio.com/api/v1/messages" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sua-chave-api" \
  -d '{
    "phone_number": "5511999999999",
    "message_content": "Olá, esta é uma mensagem de teste!"
  }'</code></pre>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <!-- Contatos -->
                                        <div class="accordion-item">
                                            <h2 class="accordion-header" id="headingContacts">
                                                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseContacts" aria-expanded="false" aria-controls="collapseContacts">
                                                    Contatos
                                                </button>
                                            </h2>
                                            <div id="collapseContacts" class="accordion-collapse collapse" aria-labelledby="headingContacts" data-bs-parent="#docsAccordion">
                                                <div class="accordion-body">
                                                    <h6>Listar Contatos</h6>
                                                    <pre><code class="language-bash">curl -X GET "https://seu-dominio.com/api/v1/contacts" \
  -H "X-API-Key: sua-chave-api"</code></pre>
                                                    <h6>Buscar Contato</h6>
                                                    <pre><code class="language-bash">curl -X GET "https://seu-dominio.com/api/v1/contacts?phone=5511999999999" \
  -H "X-API-Key: sua-chave-api"</code></pre>
                                                    <h6>Criar Contato</h6>
                                                    <pre><code class="language-bash">curl -X POST "https://seu-dominio.com/api/v1/contacts" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sua-chave-api" \
  -d '{
    "phone_number": "5511999999999",
    "name": "João Silva",
    "email": "joao@exemplo.com",
    "tags": ["cliente", "vip"]
  }'</code></pre>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <!-- Webhooks -->
                                        <div class="accordion-item">
                                            <h2 class="accordion-header" id="headingWebhooks">
                                                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseWebhooks" aria-expanded="false" aria-controls="collapseWebhooks">
                                                    Webhooks
                                                </button>
                                            </h2>
                                            <div id="collapseWebhooks" class="accordion-collapse collapse" aria-labelledby="headingWebhooks" data-bs-parent="#docsAccordion">
                                                <div class="accordion-body">
                                                    <h6>Listar Webhooks</h6>
                                                    <pre><code class="language-bash">curl -X GET "https://seu-dominio.com/api/v1/webhooks" \
  -H "X-API-Key: sua-chave-api"</code></pre>
                                                    <h6>Criar Webhook</h6>
                                                    <pre><code class="language-bash">curl -X POST "https://seu-dominio.com/api/v1/webhooks" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sua-chave-api" \
  -d '{
    "name": "Notificações de Mensagens",
    "url": "https://meu-app.com/webhook",
    "events": ["message.received", "message.sent"],
    "generate_secret": true
  }'</code></pre>
                                                    <h6>Formato dos Eventos</h6>
                                                    <p>Quando um evento ocorre, enviamos uma requisição POST para a URL do webhook com o seguinte formato:</p>
                                                    <pre><code class="language-json">{
  "event": "message.received",
  "timestamp": "2025-05-04T12:34:56Z",
  "data": {
    "message_id": "abc123",
    "phone_number": "5511999999999",
    "content": "Olá!",
    "timestamp": "2025-05-04T12:34:50Z"
  }
}</code></pre>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Modal de Criação de Chave API -->
    <div class="modal fade" id="createApiKeyModal" tabindex="-1" aria-labelledby="createApiKeyModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="createApiKeyModalLabel">Nova Chave API</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="create-api-key-form">
                        <div class="mb-3">
                            <label for="api-key-name" class="form-label">Nome da Chave</label>
                            <input type="text" class="form-control" id="api-key-name" placeholder="Ex: Meu App" required>
                            <div class="form-text">Um nome para identificar esta chave.</div>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">Permissões</label>
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="scope-messages-read" checked>
                                <label class="form-check-label" for="scope-messages-read">
                                    Ler mensagens
                                </label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="scope-messages-write" checked>
                                <label class="form-check-label" for="scope-messages-write">
                                    Enviar mensagens
                                </label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="scope-contacts-read" checked>
                                <label class="form-check-label" for="scope-contacts-read">
                                    Ler contatos
                                </label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="scope-contacts-write">
                                <label class="form-check-label" for="scope-contacts-write">
                                    Gerenciar contatos
                                </label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="scope-status-read" checked>
                                <label class="form-check-label" for="scope-status-read">
                                    Ler status
                                </label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="scope-webhooks-manage">
                                <label class="form-check-label" for="scope-webhooks-manage">
                                    Gerenciar webhooks
                                </label>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <label for="api-key-limit" class="form-label">Limite de Requisições</label>
                            <select class="form-select" id="api-key-limit">
                                <option value="60">60 por minuto (padrão)</option>
                                <option value="120">120 por minuto</option>
                                <option value="300">300 por minuto</option>
                                <option value="600">600 por minuto</option>
                                <option value="1200">1200 por minuto</option>
                            </select>
                            <div class="form-text">Número máximo de requisições por minuto.</div>
                        </div>
                    </form>
                    
                    <div id="api-key-result" class="d-none mt-4">
                        <div class="alert alert-success">
                            <strong>Chave API criada com sucesso!</strong><br>
                            <small>Anote estas informações, pois o secret não será exibido novamente.</small>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">Chave (Key)</label>
                            <div class="input-group">
                                <input type="text" class="form-control" id="new-api-key" readonly>
                                <button class="btn btn-outline-secondary copy-btn" type="button" data-clipboard-target="#new-api-key">
                                    <i class="fas fa-copy"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">Secret</label>
                            <div class="input-group">
                                <input type="text" class="form-control" id="new-api-secret" readonly>
                                <button class="btn btn-outline-secondary copy-btn" type="button" data-clipboard-target="#new-api-secret">
                                    <i class="fas fa-copy"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div class="alert alert-warning">
                            <i class="fas fa-exclamation-triangle me-1"></i> 
                            <strong>Importante:</strong> Guarde estas credenciais em um local seguro. O secret não poderá ser visualizado novamente.
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" id="api-key-modal-close">Fechar</button>
                    <button type="button" class="btn btn-primary" id="api-key-create-btn">Criar Chave API</button>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Modal de Criação de Webhook -->
    <div class="modal fade" id="createWebhookModal" tabindex="-1" aria-labelledby="createWebhookModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="createWebhookModalLabel">Novo Webhook</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="create-webhook-form">
                        <div class="mb-3">
                            <label for="webhook-name" class="form-label">Nome</label>
                            <input type="text" class="form-control" id="webhook-name" placeholder="Ex: Notificações" required>
                        </div>
                        
                        <div class="mb-3">
                            <label for="webhook-url" class="form-label">URL de Callback</label>
                            <input type="url" class="form-control" id="webhook-url" placeholder="https://seu-app.com/webhook" required>
                            <div class="form-text">URL que receberá as requisições quando os eventos ocorrerem.</div>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">Eventos</label>
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="event-message-received" checked>
                                <label class="form-check-label" for="event-message-received">
                                    message.received - Quando uma mensagem é recebida
                                </label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="event-message-sent" checked>
                                <label class="form-check-label" for="event-message-sent">
                                    message.sent - Quando uma mensagem é enviada
                                </label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="event-message-delivered">
                                <label class="form-check-label" for="event-message-delivered">
                                    message.delivered - Quando uma mensagem é entregue
                                </label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="event-message-read">
                                <label class="form-check-label" for="event-message-read">
                                    message.read - Quando uma mensagem é lida
                                </label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="event-message-failed">
                                <label class="form-check-label" for="event-message-failed">
                                    message.failed - Quando uma mensagem falha
                                </label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="event-status-changed">
                                <label class="form-check-label" for="event-status-changed">
                                    status.changed - Quando o status da conexão muda
                                </label>
                            </div>
                        </div>
                        
                        <div class="mb-3 form-check">
                            <input type="checkbox" class="form-check-input" id="webhook-generate-secret" checked>
                            <label class="form-check-label" for="webhook-generate-secret">Gerar token secreto</label>
                            <div class="form-text">Um token secreto será enviado em cada requisição para validar a autenticidade.</div>
                        </div>
                    </form>
                    
                    <div id="webhook-result" class="d-none mt-4">
                        <div class="alert alert-success">
                            <strong>Webhook criado com sucesso!</strong>
                        </div>
                        
                        <div class="mb-3" id="webhook-secret-container">
                            <label class="form-label">Token Secreto</label>
                            <div class="input-group">
                                <input type="text" class="form-control" id="new-webhook-secret" readonly>
                                <button class="btn btn-outline-secondary copy-btn" type="button" data-clipboard-target="#new-webhook-secret">
                                    <i class="fas fa-copy"></i>
                                </button>
                            </div>
                            <div class="form-text">
                                Use este token para verificar a autenticidade das requisições. 
                                Ele será enviado no header <code>X-Webhook-Signature</code>.
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" id="webhook-modal-close">Fechar</button>
                    <button type="button" class="btn btn-primary" id="webhook-create-btn">Criar Webhook</button>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Modal de Exclusão -->
    <div class="modal fade" id="deleteConfirmModal" tabindex="-1" aria-labelledby="deleteConfirmModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="deleteConfirmModalLabel">Confirmar Exclusão</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <p id="delete-confirm-text">Tem certeza que deseja excluir este item?</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-danger" id="confirm-delete-btn">Excluir</button>
                </div>
            </div>
        </div>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/clipboard@2.0.11/dist/clipboard.min.js"></script>
    <script type="importmap">
        {
            "imports": {
                "./auth-utils.js": "./assets/js/auth-utils.js",
                "./integrations.js": "./assets/js/integrations.js",
                "./integrations-ui.js": "./assets/js/integrations-ui.js"
            }
        }
    </script>
    <script type="module">
        import './assets/js/main.js';
        import IntegrationsUI from './assets/js/integrations-ui.js';
        
        document.addEventListener('DOMContentLoaded', function() {
            // Iniciar highlight.js
            hljs.highlightAll();
            
            // Inicializar clipboard.js
            new ClipboardJS('.copy-btn').on('success', function(e) {
                const originalText = e.trigger.innerHTML;
                e.trigger.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(function() {
                    e.trigger.innerHTML = originalText;
                }, 1500);
                e.clearSelection();
            });
            
            // Inicialização do tema
            function initTheme() {
                const savedTheme = localStorage.getItem('smartchatbox-theme') || 'light';
                document.documentElement.setAttribute('data-bs-theme', savedTheme);
                
                const themeIcon = document.getElementById('theme-icon');
                if (themeIcon) {
                    if (savedTheme === 'dark') {
                        themeIcon.classList.remove('fa-sun');
                        themeIcon.classList.add('fa-moon');
                    } else {
                        themeIcon.classList.remove('fa-moon');
                        themeIcon.classList.add('fa-sun');
                    }
                }
            }
            
            // Alternar tema
            function toggleTheme() {
                const currentTheme = document.documentElement.getAttribute('data-bs-theme');
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                
                document.documentElement.setAttribute('data-bs-theme', newTheme);
                localStorage.setItem('smartchatbox-theme', newTheme);
                
                const themeIcon = document.getElementById('theme-icon');
                if (themeIcon) {
                    if (newTheme === 'dark') {
                        themeIcon.classList.remove('fa-sun');
                        themeIcon.classList.add('fa-moon');
                    } else {
                        themeIcon.classList.remove('fa-moon');
                        themeIcon.classList.add('fa-sun');
                    }
                }
                
                // Reaplica o highlight após mudança de tema
                setTimeout(() => {
                    hljs.highlightAll();
                }, 100);
            }
            
            // Inicializar tema
            initTheme();
            
            // Adicionar evento de clique ao switch de tema
            const themeSwitch = document.getElementById('theme-switch');
            if (themeSwitch) {
                themeSwitch.addEventListener('click', toggleTheme);
            }
            
            // Inicializar a interface de integrações
            new IntegrationsUI();
        });
    </script>
</body>
</html>