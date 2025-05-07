<!DOCTYPE html>
<html lang="pt-BR" data-bs-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gerenciamento de Leads - Smart-ChatBox</title>
    
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
    
    <style>
        /* Estilos adicionais para a página de Leads */
        .company-card {
            cursor: pointer;
            transition: all 0.2s ease;
            border: 2px solid transparent;
        }
        
        .company-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .company-card.active {
            border-color: var(--primary);
            background-color: rgba(111, 66, 193, 0.05);
        }
        
        .project-card {
            cursor: pointer;
            transition: all 0.2s ease;
            border: 2px solid transparent;
        }
        
        .project-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .project-card.active {
            border-color: var(--primary);
            background-color: rgba(111, 66, 193, 0.05);
        }
        
        .leads-table-container {
            margin-top: 1.5rem;
        }
        
        .lead-badge {
            font-size: 0.7rem;
            padding: 0.25em 0.6em;
            border-radius: 50px;
            font-weight: 500;
            margin-right: 0.25rem;
        }
        
        .filter-dropdown {
            max-width: 200px;
        }
        
        .search-input {
            max-width: 300px;
        }
        
        .lead-tag {
            background-color: var(--gray-200);
            color: var(--gray-800);
            padding: 2px 8px;
            border-radius: 50px;
            font-size: 0.7rem;
            margin-right: 0.25rem;
            display: inline-block;
        }
        
        .table-responsive {
            min-height: 300px;
        }
        
        .back-btn {
            margin-bottom: 1rem;
        }
    </style>
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
                        <a class="nav-link active" href="leads.php"><i class="fas fa-users me-1"></i> Leads</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="integracoes.php"><i class="fas fa-plug me-1"></i> Integrações</a>
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
                            <li><a class="dropdown-item" href="integracoes.php"><i class="fas fa-plug me-2"></i>Integrações</a></li>
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
                            <i class="fas fa-users display-1 text-primary"></i>
                        </div>
                        <h2 class="mb-3">Gerenciamento de Leads</h2>
                        <p class="lead mb-4">Você precisa estar autenticado para gerenciar seus leads.</p>
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
                <div class="col-12 mb-4">
                    <div class="card fade-in">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0"><i class="fas fa-users me-2"></i>Gerenciamento de Leads</h5>
                        </div>
                        <div class="card-body">
                            <!-- Alerta para feedback -->
                            <div id="leads-alert" class="alert d-none" role="alert"></div>
                            
                            <!-- Carregando indicador -->
                            <div id="leads-loading" class="text-center my-5">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">Carregando...</span>
                                </div>
                                <p class="mt-2">Carregando dados...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Layout Grid com 3 seções -->
            <div class="row">
                <!-- Lateral esquerda: Empresas -->
                <div class="col-md-3">
                    <div class="card fade-in">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h6 class="mb-0"><i class="fas fa-building me-2"></i>Empresas</h6>
                        </div>
                        <div class="card-body">
                            <div id="companies-container">
                                <div id="companies-loading" class="text-center my-5">
                                    <div class="spinner-border spinner-border-sm text-primary" role="status">
                                        <span class="visually-hidden">Carregando...</span>
                                    </div>
                                    <p class="mt-2">Carregando empresas...</p>
                                </div>
                                
                                <div id="companies-empty" class="text-center my-5 d-none">
                                    <i class="fas fa-building text-muted" style="font-size: 2rem;"></i>
                                    <p class="mt-3">Sem empresas disponíveis.</p>
                                </div>
                                
                                <!-- Lista de empresas (preenchida via JavaScript) -->
                                <div id="companies-list" class="d-none">
                                    <!-- Template de um card de empresa -->
                                    <!--
                                    <div class="card company-card mb-3" data-company-id="1">
                                        <div class="card-body py-2 px-3">
                                            <div class="d-flex justify-content-between align-items-center">
                                                <h6 class="mb-0">Nome da Empresa</h6>
                                                <span class="badge bg-primary rounded-pill">3</span>
                                            </div>
                                        </div>
                                    </div>
                                    -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Seção principal: Projetos e Leads -->
                <div class="col-md-9">
                    <!-- Projetos -->
                    <div id="projects-section">
                        <div class="card fade-in">
                            <div class="card-header d-flex justify-content-between align-items-center">
                                <h6 class="mb-0"><i class="fas fa-project-diagram me-2"></i>Projetos</h6>
                                <div>
                                    <span id="selected-company-name" class="badge bg-primary">Todos</span>
                                </div>
                            </div>
                            <div class="card-body">
                                <div id="projects-container">
                                    <div id="projects-loading" class="text-center my-5">
                                        <div class="spinner-border spinner-border-sm text-primary" role="status">
                                            <span class="visually-hidden">Carregando...</span>
                                        </div>
                                        <p class="mt-2">Carregando projetos...</p>
                                    </div>
                                    
                                    <div id="projects-empty" class="text-center my-5 d-none">
                                        <i class="fas fa-project-diagram text-muted" style="font-size: 2rem;"></i>
                                        <p class="mt-3">Nenhum projeto disponível para esta empresa.</p>
                                    </div>
                                    
                                    <!-- Lista de projetos (preenchida via JavaScript) -->
                                    <div id="projects-list" class="row d-none">
                                        <!-- Template de um card de projeto -->
                                        <!--
                                        <div class="col-md-4 mb-3">
                                            <div class="card project-card h-100" data-project-id="1">
                                                <div class="card-body">
                                                    <h6 class="card-title">Nome do Projeto</h6>
                                                    <p class="card-text mb-2">
                                                        <span class="badge bg-success">Ativo</span>
                                                    </p>
                                                    <div class="d-flex justify-content-between align-items-center mt-2">
                                                        <small class="text-muted">Leads: 42</small>
                                                        <button class="btn btn-sm btn-outline-primary view-leads-btn">
                                                            <i class="fas fa-eye me-1"></i>Ver Leads
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        -->
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Tabela de Leads (inicialmente escondida) -->
                    <div id="leads-detail-section" class="d-none mt-4">
                        <button id="back-to-projects-btn" class="btn btn-outline-secondary back-btn">
                            <i class="fas fa-arrow-left me-1"></i> Voltar para Projetos
                        </button>
                        
                        <!-- Card de detalhes e eventos de lead -->
                        <div id="lead-details-section" class="mb-4 d-none">
                            <div class="row">
                                <div class="col-md-12">
                                    <div class="card fade-in">
                                        <div class="card-header d-flex justify-content-between align-items-center">
                                            <h6 class="mb-0"><i class="fas fa-user me-2"></i>Detalhes do Lead: <span id="card-lead-name">-</span></h6>
                                            <div>
                                                <button id="card-edit-lead-btn" class="btn btn-outline-primary btn-sm me-2">
                                                    <i class="fas fa-edit me-1"></i> Editar
                                                </button>
                                                <button id="close-lead-details-btn" class="btn btn-outline-secondary btn-sm">
                                                    <i class="fas fa-times me-1"></i> Fechar
                                                </button>
                                            </div>
                                        </div>
                                        <div class="card-body">
                                            <div class="row mb-4">
                                                <div class="col-md-6">
                                                    <h6>Informações Pessoais</h6>
                                                    <div class="mb-2">
                                                        <label class="fw-bold mb-0">Nome:</label>
                                                        <p id="card-detail-lead-name" class="mb-2">-</p>
                                                    </div>
                                                    <div class="mb-2">
                                                        <label class="fw-bold mb-0">E-mail:</label>
                                                        <p id="card-detail-lead-email" class="mb-2">-</p>
                                                    </div>
                                                    <div class="mb-2">
                                                        <label class="fw-bold mb-0">Telefone:</label>
                                                        <p id="card-detail-lead-phone" class="mb-2">-</p>
                                                    </div>
                                                    <div class="mb-2">
                                                        <label class="fw-bold mb-0">Status:</label>
                                                        <p id="card-detail-lead-status" class="mb-2">-</p>
                                                    </div>
                                                </div>
                                                <div class="col-md-6">
                                                    <h6>Informações da Campanha</h6>
                                                    <div class="mb-2">
                                                        <label class="fw-bold mb-0">UTM Source:</label>
                                                        <p id="card-detail-lead-utm-source" class="mb-2">-</p>
                                                    </div>
                                                    <div class="mb-2">
                                                        <label class="fw-bold mb-0">UTM Medium:</label>
                                                        <p id="card-detail-lead-utm-medium" class="mb-2">-</p>
                                                    </div>
                                                    <div class="mb-2">
                                                        <label class="fw-bold mb-0">UTM Campaign:</label>
                                                        <p id="card-detail-lead-utm-campaign" class="mb-2">-</p>
                                                    </div>
                                                    <div class="mb-2">
                                                        <label class="fw-bold mb-0">Origem:</label>
                                                        <p id="card-detail-lead-origin" class="mb-2">-</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="row mb-3">
                                                <div class="col-12">
                                                    <h6>Observações</h6>
                                                    <p id="card-detail-lead-notes" class="border p-2 rounded bg-light">-</p>
                                                </div>
                                            </div>
                                            <div class="row">
                                                <div class="col-12">
                                                    <h6>Data de Criação</h6>
                                                    <p id="card-detail-lead-created-at">-</p>
                                                </div>
                                            </div>
                                            <hr>
                                            <div class="row mt-3">
                                                <div class="col-12">
                                                    <div class="d-flex justify-content-between align-items-center mb-2">
                                                        <h6 class="mb-0 d-flex align-items-center">
                                                            <i class="fas fa-history me-2 text-primary"></i>
                                                            <span>Histórico de Eventos</span>
                                                        </h6>
                                                        <div>
                                                            <span id="card-lead-events-loading" class="spinner-border spinner-border-sm text-primary d-none" role="status"></span>
                                                        </div>
                                                    </div>
                                                    <div id="card-lead-events-empty" class="text-center my-4 p-3 border rounded bg-light d-none">
                                                        <i class="fas fa-info-circle text-muted mb-2" style="font-size: 1.5rem;"></i>
                                                        <p class="text-muted mb-0">Nenhum evento registrado para este lead.</p>
                                                    </div>
                                                    <div id="card-lead-events-container" class="mt-2">
                                                        <div class="table-responsive">
                                                            <table class="table table-sm table-hover">
                                                                <thead class="table-light">
                                                                    <tr>
                                                                        <th style="width: 25%">Data</th>
                                                                        <th style="width: 20%">Tipo</th>
                                                                        <th style="width: 20%">Origem</th>
                                                                        <th style="width: 35%">Detalhes</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody id="card-lead-events-table-body">
                                                                    <!-- Preenchido via JavaScript -->
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="card fade-in">
                            <div class="card-header d-flex justify-content-between align-items-center">
                                <h6 class="mb-0"><i class="fas fa-users me-2"></i>Leads do Projeto: <span id="selected-project-name"></span></h6>
                                <button id="new-lead-btn" class="btn btn-primary btn-sm" data-bs-toggle="modal" data-bs-target="#leadModal">
                                    <i class="fas fa-plus me-1"></i> Novo Lead
                                </button>
                            </div>
                            <div class="card-body">
                                <!-- Barra de ações e filtros -->
                                <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                                    <div class="d-flex align-items-center gap-2 flex-wrap">
                                        <div class="input-group search-input">
                                            <span class="input-group-text"><i class="fas fa-search"></i></span>
                                            <input type="text" id="leads-search" class="form-control" placeholder="Buscar leads...">
                                        </div>
                                        
                                        <div class="dropdown filter-dropdown">
                                            <button class="btn btn-outline-secondary dropdown-toggle" type="button" id="status-filter-btn" data-bs-toggle="dropdown">
                                                <i class="fas fa-filter me-1"></i> Status
                                            </button>
                                            <ul class="dropdown-menu" id="status-filter-menu">
                                                <li><a class="dropdown-item active" href="#" data-status="all">Todos</a></li>
                                                <li><a class="dropdown-item" href="#" data-status="novo">Novo</a></li>
                                                <li><a class="dropdown-item" href="#" data-status="qualificado">Qualificado</a></li>
                                                <li><a class="dropdown-item" href="#" data-status="contatado">Contatado</a></li>
                                                <li><a class="dropdown-item" href="#" data-status="convertido">Convertido</a></li>
                                                <li><a class="dropdown-item" href="#" data-status="desistiu">Desistiu</a></li>
                                                <li><a class="dropdown-item" href="#" data-status="inativo">Inativo</a></li>
                                            </ul>
                                        </div>
                                    </div>
                                    
                                    <div class="d-flex align-items-center gap-2">
                                        <button id="export-leads-btn" class="btn btn-outline-success btn-sm">
                                            <i class="fas fa-file-export me-1"></i> Exportar CSV
                                        </button>
                                        <button id="delete-selected-leads-btn" class="btn btn-outline-danger btn-sm d-none">
                                            <i class="fas fa-trash-alt me-1"></i> Excluir Selecionados
                                        </button>
                                    </div>
                                </div>
                                
                                <!-- Indicador de carregamento para leads -->
                                <div id="leads-table-loading" class="text-center my-5">
                                    <div class="spinner-border text-primary" role="status">
                                        <span class="visually-hidden">Carregando...</span>
                                    </div>
                                    <p class="mt-2">Carregando leads...</p>
                                </div>
                                
                                <!-- Mensagem de nenhum lead encontrado -->
                                <div id="leads-table-empty" class="text-center my-5 d-none">
                                    <i class="fas fa-users text-muted" style="font-size: 2rem;"></i>
                                    <p class="mt-3">Nenhum lead encontrado para este projeto.</p>
                                    <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#leadModal">
                                        <i class="fas fa-plus-circle me-1"></i> Cadastrar Lead
                                    </button>
                                </div>
                                
                                <!-- Tabela de leads -->
                                <div id="leads-table-container" class="table-responsive d-none">
                                    <table class="table table-hover" id="leads-table">
                                        <thead>
                                            <tr>
                                                <th>
                                                    <div class="form-check">
                                                        <input class="form-check-input" type="checkbox" id="select-all-leads">
                                                    </div>
                                                </th>
                                                <th>Nome</th>
                                                <th>E-mail</th>
                                                <th>Telefone</th>
                                                <th>Status</th>
                                                <th>Tags</th>
                                                <th>Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody id="leads-table-body">
                                            <!-- Preenchido via JavaScript -->
                                        </tbody>
                                    </table>
                                    
                                    <!-- Paginação -->
                                    <nav aria-label="Paginação de leads">
                                        <ul class="pagination justify-content-center" id="leads-pagination">
                                            <!-- Preenchido via JavaScript -->
                                        </ul>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Modal de Lead -->
    <div class="modal fade" id="leadModal" tabindex="-1" aria-labelledby="leadModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="leadModalLabel">Novo Lead</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
                </div>
                <div class="modal-body">
                    <form id="lead-form">
                        <input type="hidden" id="lead-id">
                        <input type="hidden" id="lead-project-id">
                        
                        <div class="mb-3">
                            <label for="lead-name" class="form-label">Nome Completo</label>
                            <input type="text" class="form-control" id="lead-name" required>
                        </div>
                        
                        <div class="mb-3">
                            <label for="lead-email" class="form-label">E-mail</label>
                            <input type="email" class="form-control" id="lead-email" required>
                        </div>
                        
                        <div class="mb-3">
                            <label for="lead-phone" class="form-label">Telefone</label>
                            <input type="tel" class="form-control" id="lead-phone" required>
                        </div>
                        
                        <div class="mb-3" id="lead-status-container">
                            <label for="lead-status" class="form-label">Status</label>
                            <select class="form-select" id="lead-status" required>
                                <option value="novo">Novo</option>
                                <option value="qualificado">Qualificado</option>
                                <option value="contatado">Contatado</option>
                                <option value="convertido">Convertido</option>
                                <option value="desistiu">Desistiu</option>
                                <option value="inativo">Inativo</option>
                            </select>
                        </div>
                        
                        <div class="mb-3">
                            <label for="lead-notes" class="form-label">Observações</label>
                            <textarea class="form-control" id="lead-notes" rows="3"></textarea>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">Informações da Campanha</label>
                            <div class="row g-2">
                                <div class="col-md-6 mb-2">
                                    <input type="text" class="form-control form-control-sm" id="lead-utm-source" placeholder="UTM Source">
                                </div>
                                <div class="col-md-6 mb-2">
                                    <input type="text" class="form-control form-control-sm" id="lead-utm-medium" placeholder="UTM Medium">
                                </div>
                                <div class="col-md-6 mb-2">
                                    <input type="text" class="form-control form-control-sm" id="lead-utm-campaign" placeholder="UTM Campaign">
                                </div>
                                <div class="col-md-6 mb-2">
                                    <input type="text" class="form-control form-control-sm" id="lead-utm-term" placeholder="UTM Term">
                                </div>
                                <div class="col-md-12">
                                    <input type="text" class="form-control form-control-sm" id="lead-utm-content" placeholder="UTM Content">
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-primary" id="save-lead-btn">Salvar</button>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Modal de Detalhes do Lead -->
    <div class="modal fade" id="leadDetailsModal" tabindex="-1" aria-labelledby="leadDetailsModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="leadDetailsModalLabel">Detalhes do Lead</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
                </div>
                <div class="modal-body">
                    <div class="row">
                        <div class="col-md-6">
                            <h6>Informações Pessoais</h6>
                            <div class="mb-3">
                                <label class="fw-bold">Nome:</label>
                                <p id="detail-lead-name">-</p>
                            </div>
                            <div class="mb-3">
                                <label class="fw-bold">E-mail:</label>
                                <p id="detail-lead-email">-</p>
                            </div>
                            <div class="mb-3">
                                <label class="fw-bold">Telefone:</label>
                                <p id="detail-lead-phone">-</p>
                            </div>
                            <div class="mb-3">
                                <label class="fw-bold">Status:</label>
                                <p id="detail-lead-status">-</p>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <h6>Informações da Campanha</h6>
                            <div class="mb-3">
                                <label class="fw-bold">UTM Source:</label>
                                <p id="detail-lead-utm-source">-</p>
                            </div>
                            <div class="mb-3">
                                <label class="fw-bold">UTM Medium:</label>
                                <p id="detail-lead-utm-medium">-</p>
                            </div>
                            <div class="mb-3">
                                <label class="fw-bold">UTM Campaign:</label>
                                <p id="detail-lead-utm-campaign">-</p>
                            </div>
                            <div class="mb-3">
                                <label class="fw-bold">Origem do Lead:</label>
                                <p id="detail-lead-origin">-</p>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-12">
                            <h6>Observações</h6>
                            <p id="detail-lead-notes" class="border p-2 rounded bg-light">-</p>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-12">
                            <h6>Data de Criação</h6>
                            <p id="detail-lead-created-at">-</p>
                        </div>
                    </div>
                    <div class="row mt-3">
                        <div class="col-12">
                            <h6 class="d-flex justify-content-between align-items-center">
                                <span>Histórico de Eventos</span>
                                <span id="lead-events-loading" class="spinner-border spinner-border-sm text-primary d-none" role="status"></span>
                            </h6>
                            <div id="lead-events-empty" class="text-center my-3 d-none">
                                <p class="text-muted">Nenhum evento registrado para este lead.</p>
                            </div>
                            <div id="lead-events-container" class="mt-2">
                                <div class="table-responsive">
                                    <table class="table table-sm table-hover">
                                        <thead>
                                            <tr>
                                                <th>Data</th>
                                                <th>Tipo</th>
                                                <th>Origem</th>
                                                <th>Detalhes</th>
                                            </tr>
                                        </thead>
                                        <tbody id="lead-events-table-body">
                                            <!-- Preenchido via JavaScript -->
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline-primary me-2" id="edit-from-details-btn">
                        <i class="fas fa-edit me-1"></i> Editar
                    </button>
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Modal de Confirmação de Exclusão -->
    <div class="modal fade" id="deleteLeadModal" tabindex="-1" aria-labelledby="deleteLeadModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="deleteLeadModalLabel">Confirmar Exclusão</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
                </div>
                <div class="modal-body">
                    <p>Tem certeza que deseja excluir o lead "<span id="delete-lead-name"></span>"?</p>
                    <p class="text-muted">Esta ação não poderá ser desfeita.</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-danger" id="confirm-delete-lead-btn">Excluir</button>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Modal de Confirmação de Exclusão em Massa -->
    <div class="modal fade" id="bulkDeleteModal" tabindex="-1" aria-labelledby="bulkDeleteModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="bulkDeleteModalLabel">Confirmar Exclusão em Massa</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
                </div>
                <div class="modal-body">
                    <p>Tem certeza que deseja excluir os <span id="bulk-delete-count">0</span> leads selecionados?</p>
                    <p class="text-muted">Esta ação não poderá ser desfeita.</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-danger" id="confirm-bulk-delete-btn">Excluir Todos</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Scripts -->
    <script type="importmap">
        {
            "imports": {
                "./auth-utils.js": "./assets/js/auth-utils.js",
                "./leads.js": "./assets/js/leads.js",
                "./leads-events.js": "./assets/js/leads-events.js"
            }
        }
    </script>
    <script type="module">
        import './assets/js/main.js';
        import LeadsManager from './assets/js/leads.js';
        // Para depuração
        window.debugMode = true;
        
        document.addEventListener('DOMContentLoaded', function() {
            // Inicializar gerenciador de leads
            const leadsManager = new LeadsManager();
            leadsManager.init();
            
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
            }
            
            // Inicializar tema
            initTheme();
            
            // Adicionar evento de clique ao switch de tema
            const themeSwitch = document.getElementById('theme-switch');
            if (themeSwitch) {
                themeSwitch.addEventListener('click', toggleTheme);
            }
        });
    </script>
</body>
</html>