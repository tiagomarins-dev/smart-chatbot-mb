<!DOCTYPE html>
<html lang="pt-BR" data-bs-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Smart-ChatBox</title>
    
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
                </ul>
                
                <div class="d-flex align-items-center">
                    <div class="theme-switch me-3" id="theme-switch">
                        <i class="fas fa-sun theme-switch-icon" id="theme-icon"></i>
                    </div>
                </div>
            </div>
        </div>
    </nav>

    <!-- Conteúdo Principal -->
    <div class="container main-container">
        <div class="row justify-content-center">
            <div class="col-md-6 col-lg-5">
                <div class="card fade-in">
                    <div class="card-header">
                        <h4 class="mb-0 text-center">Login</h4>
                    </div>
                    <div class="card-body">
                        <form id="login-form">
                            <div class="mb-3">
                                <label for="login-email" class="form-label">Email</label>
                                <input type="email" class="form-control" id="login-email" required>
                            </div>
                            <div class="mb-3">
                                <label for="login-password" class="form-label">Senha</label>
                                <input type="password" class="form-control" id="login-password" required>
                            </div>
                            <div class="d-grid gap-2">
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-sign-in-alt me-2"></i> Entrar
                                </button>
                            </div>
                            <div id="login-status" class="mt-3"></div>
                        </form>
                        <hr>
                        <div class="text-center">
                            <p>Não tem uma conta? <a href="register.php">Cadastre-se</a></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Status Footer -->
    <div class="container mt-4">
        <div class="row">
            <div class="col-12">
                <div class="card fade-in">
                    <div class="card-body d-flex justify-content-between align-items-center py-2">
                        <div>
                            <small class="text-muted">
                                <i class="fas fa-info-circle me-1"></i> Faça login para acessar todos os recursos
                            </small>
                        </div>
                        <div>
                            <small class="text-muted">Desenvolvido por <a href="https://github.com/tiagomarins-dev/smart-chatbot-mb" target="_blank" class="text-decoration-none">TiagoMarins</a></small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/es-module-shims@1.6.3/dist/es-module-shims.js"></script>
    <script type="importmap">
        {
            "imports": {
                "@supabase/supabase-js": "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm",
                "./supabase.js": "./assets/js/supabase.js",
                "./auth.js": "./assets/js/auth.js",
                "./auth-utils.js": "./assets/js/auth-utils.js"
            }
        }
    </script>
    <script type="module" src="assets/js/main.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Inicialização do tema
            function initTheme() {
                const savedTheme = localStorage.getItem('smartchatbox-theme') || 'light';
                document.documentElement.setAttribute('data-bs-theme', savedTheme);
                
                const themeIcon = document.getElementById('theme-icon');
                if (savedTheme === 'dark') {
                    themeIcon.classList.remove('fa-sun');
                    themeIcon.classList.add('fa-moon');
                } else {
                    themeIcon.classList.remove('fa-moon');
                    themeIcon.classList.add('fa-sun');
                }
            }
            
            // Alternar tema
            function toggleTheme() {
                const currentTheme = document.documentElement.getAttribute('data-bs-theme');
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                
                document.documentElement.setAttribute('data-bs-theme', newTheme);
                localStorage.setItem('smartchatbox-theme', newTheme);
                
                const themeIcon = document.getElementById('theme-icon');
                if (newTheme === 'dark') {
                    themeIcon.classList.remove('fa-sun');
                    themeIcon.classList.add('fa-moon');
                } else {
                    themeIcon.classList.remove('fa-moon');
                    themeIcon.classList.add('fa-sun');
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