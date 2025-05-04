<!DOCTYPE html>
<html lang="pt-BR" data-bs-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Empresas - Smart-ChatBox</title>
    
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
                        <a class="nav-link active" href="empresas.php"><i class="fas fa-building me-1"></i> Empresas</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="projetos.php"><i class="fas fa-project-diagram me-1"></i> Projetos</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#"><i class="fas fa-users me-1"></i> Leads</a>
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
                            <i class="fas fa-building display-1 text-primary"></i>
                        </div>
                        <h2 class="mb-3">Acesso às Empresas</h2>
                        <p class="lead mb-4">Você precisa estar autenticado para gerenciar suas empresas.</p>
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
                            <h5 class="mb-0"><i class="fas fa-building me-2"></i>Gerenciamento de Empresas</h5>
                            <button id="new-company-btn" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#companyModal">
                                <i class="fas fa-plus me-1"></i> Nova Empresa
                            </button>
                        </div>
                        <div class="card-body">
                            <!-- Alerta para feedback -->
                            <div id="company-alert" class="alert d-none" role="alert"></div>
                            
                            <!-- Tabela de empresas -->
                            <div id="companies-container">
                                <div id="companies-loading" class="text-center my-5">
                                    <div class="spinner-border text-primary" role="status">
                                        <span class="visually-hidden">Carregando...</span>
                                    </div>
                                    <p class="mt-2">Carregando empresas...</p>
                                </div>
                                
                                <div id="companies-empty" class="text-center my-5 d-none">
                                    <i class="fas fa-building text-muted" style="font-size: 3rem;"></i>
                                    <p class="mt-3">Você ainda não cadastrou nenhuma empresa.</p>
                                    <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#companyModal">
                                        <i class="fas fa-plus-circle me-1"></i> Cadastrar Empresa
                                    </button>
                                </div>
                                
                                <div id="companies-table-container" class="d-none">
                                    <div class="table-responsive">
                                        <table class="table table-hover" id="companies-table">
                                            <thead>
                                                <tr>
                                                    <th>Nome</th>
                                                    <th>Status</th>
                                                    <th>Data de Criação</th>
                                                    <th>Ações</th>
                                                </tr>
                                            </thead>
                                            <tbody id="companies-table-body">
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
    
    <!-- Modal de Empresa -->
    <div class="modal fade" id="companyModal" tabindex="-1" aria-labelledby="companyModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="companyModalLabel">Nova Empresa</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
                </div>
                <div class="modal-body">
                    <form id="company-form">
                        <input type="hidden" id="company-id">
                        <div class="mb-3">
                            <label for="company-name" class="form-label">Nome da Empresa</label>
                            <input type="text" class="form-control" id="company-name" required>
                        </div>
                        <div class="mb-3" id="company-status-container">
                            <label class="form-label">Status</label>
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="company-status" id="company-status-active" value="true" checked>
                                <label class="form-check-label" for="company-status-active">
                                    Ativa
                                </label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="company-status" id="company-status-inactive" value="false">
                                <label class="form-check-label" for="company-status-inactive">
                                    Inativa
                                </label>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-primary" id="save-company-btn">Salvar</button>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Modal de Confirmação de Exclusão -->
    <div class="modal fade" id="deleteModal" tabindex="-1" aria-labelledby="deleteModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="deleteModalLabel">Confirmar Desativação</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
                </div>
                <div class="modal-body">
                    <p>Tem certeza que deseja desativar a empresa "<span id="delete-company-name"></span>"?</p>
                    <p class="text-muted">Esta ação não exclui permanentemente a empresa, apenas a desativa no sistema.</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-danger" id="confirm-delete-btn">Desativar</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Scripts -->
    <script type="importmap">
        {
            "imports": {
                "./auth-utils.js": "./assets/js/auth-utils.js",
                "./companies.js": "./assets/js/companies.js"
            }
        }
    </script>
    <script type="module">
        import './assets/js/main.js';
        import CompaniesManager from './assets/js/companies.js';
        
        document.addEventListener('DOMContentLoaded', function() {
            // Inicializar gerenciador de empresas
            const companiesManager = new CompaniesManager();
            companiesManager.init();
            
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