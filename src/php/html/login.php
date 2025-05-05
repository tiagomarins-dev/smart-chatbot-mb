<?php
    $activePage = 'login';
    $pageTitle = 'Login - Smart-ChatBox';
    include __DIR__ . '/partials/header.php';
?>
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

    <script type="module">
        import './assets/js/main.js';
    </script>
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
<?php include __DIR__ . '/partials/footer.php'; ?>