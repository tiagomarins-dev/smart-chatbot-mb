<?php
// Header partial for Smart-ChatBox pages
?>
<!DOCTYPE html>
<html lang="pt-BR" data-bs-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= isset($pageTitle) ? $pageTitle : 'Smart-ChatBox'; ?></title>
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Font Awesome Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- Google Fonts - Inter -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <!-- Custom CSS -->
    <link rel="stylesheet" href="assets/css/style.css">
    <!-- Supabase Auth scripts -->
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
                        <a class="nav-link <?= ($activePage==='index')?'active':''?>" href="index.php"><i class="fas fa-home me-1"></i> Home</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link <?= ($activePage==='empresas')?'active':''?>" href="empresas.php"><i class="fas fa-building me-1"></i> Empresas</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link <?= ($activePage==='projetos')?'active':''?>" href="projetos.php"><i class="fas fa-project-diagram me-1"></i> Projetos</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link <?= ($activePage==='leads')?'active':''?>" href="leads.php"><i class="fas fa-users me-1"></i> Leads</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link <?= ($activePage==='integracoes')?'active':''?>" href="integracoes.php"><i class="fas fa-plug me-1"></i> Integrações</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link <?= ($activePage==='api-docs')?'active':''?>" href="api-docs.php"><i class="fas fa-book me-1"></i> API Docs</a>
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
    <!-- Espaço de topo para navbar fixa -->
    <div class="container-fluid main-container" style="margin-top:56px;">