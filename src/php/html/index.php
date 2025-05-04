<!DOCTYPE html>
<html lang="pt-BR" data-bs-theme="light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Smart-ChatBox</title>
    
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
                        <a class="nav-link active" href="#"><i class="fas fa-home me-1"></i> Home</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#"><i class="fas fa-building me-1"></i> Empresas</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#"><i class="fas fa-project-diagram me-1"></i> Projetos</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#"><i class="fas fa-users me-1"></i> Leads</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="integracoes.php"><i class="fas fa-plug me-1"></i> Integrações</a>
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
                            <i class="fab fa-whatsapp display-1 text-primary"></i>
                        </div>
                        <h2 class="mb-3">Bem-vindo ao Smart-ChatBox</h2>
                        <p class="lead mb-4">Uma plataforma inteligente para gerenciar suas conversas do WhatsApp.</p>
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
        <div class="row mt-4 auth-required d-none">
            <!-- Card de Status do WhatsApp -->
            <div class="col-md-6 mb-4">
                <div class="card fade-in h-100">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0"><i class="fab fa-whatsapp me-2"></i>Status do WhatsApp</h5>
                        <span id="status-badge" class="badge status-disconnected">Desconectado</span>
                    </div>
                    <div class="card-body" id="connection-status">
                        <div id="disconnected-view">
                            <p>Para começar a receber e enviar mensagens, conecte seu WhatsApp.</p>
                            <button id="connect-btn" class="btn btn-primary">
                                <i class="fas fa-plug me-1"></i> Conectar WhatsApp
                            </button>
                            <div id="qrcode-container" class="d-none mt-3 shadow-sm">
                                <p class="mb-2">Escaneie o QR Code com seu WhatsApp:</p>
                                <img id="qrcode-img" src="" alt="QR Code" class="mx-auto d-block">
                            </div>
                        </div>
                        
                        <div id="connected-view" class="d-none">
                            <div class="d-flex align-items-center mb-3">
                                <div class="connected-icon me-3">
                                    <i class="fas fa-check-circle text-success"></i>
                                </div>
                                <div>
                                    <h6 class="mb-1">Conectado como:</h6>
                                    <p class="mb-0 fw-bold" id="connected-number">+55 (00) 00000-0000</p>
                                </div>
                            </div>
                            <button id="disconnect-btn" class="btn btn-outline-danger" disabled>
                                <i class="fas fa-power-off me-1"></i> Desconectar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Card de Mensagens Rápidas -->
            <div class="col-md-6 mb-4">
                <div class="card fade-in h-100">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0"><i class="fas fa-comments me-2"></i>Mensagens</h5>
                        <button id="refresh-messages" class="btn btn-sm btn-outline-primary">
                            <i class="fas fa-sync-alt me-1"></i> Atualizar
                        </button>
                    </div>
                    <div class="card-body p-0">
                        <div class="quick-message-header p-3 border-bottom d-flex justify-content-between align-items-center">
                            <span><i class="fas fa-users me-1"></i> <span id="contact-count">0</span> contatos</span>
                            <button class="btn btn-sm btn-primary" data-bs-toggle="modal" data-bs-target="#newMessageModal">
                                <i class="fas fa-paper-plane me-1"></i> Enviar Mensagem Rápida
                            </button>
                        </div>
                        <div id="contacts-list" class="contacts-list">
                            <!-- Contacts will be loaded here -->
                            <div class="text-center p-4 text-muted">
                                <i class="fas fa-spinner fa-spin mb-2" style="font-size: 1.5rem;"></i>
                                <p>Carregando contatos...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Status Footer -->
        <div class="row">
            <div class="col-12">
                <div class="card fade-in">
                    <div class="card-body d-flex justify-content-between align-items-center py-2">
                        <div>
                            <small class="text-muted">
                                <i class="fas fa-clock me-1"></i> Última atualização: <span id="last-update">-</span>
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
    
    <!-- Modal de Nova Mensagem Rápida -->
    <div class="modal fade" id="newMessageModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Nova Mensagem</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="send-message-form">
                        <div class="mb-3">
                            <label for="number" class="form-label">Número de telefone</label>
                            <div class="input-group mb-1">
                                <span class="input-group-text">+55</span>
                                <input type="text" class="form-control" id="number" placeholder="DDD + Número" required>
                            </div>
                            <div class="form-text">Digite o número sem espaços ou caracteres especiais.</div>
                        </div>
                        <div class="mb-3">
                            <label for="message" class="form-label">Mensagem</label>
                            <textarea class="form-control" id="message" rows="3" required></textarea>
                        </div>
                        <div id="message-status" class="mt-3 d-none"></div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-primary" id="send-message-btn">
                        <i class="fas fa-paper-plane me-1"></i> Enviar
                    </button>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Sidebar Offcanvas para Conversas -->
    <div class="offcanvas offcanvas-end chat-offcanvas" tabindex="-1" id="chatOffcanvas" aria-labelledby="chatOffcanvasLabel">
        <div class="offcanvas-header">
            <h5 class="offcanvas-title" id="chatOffcanvasLabel">
                <i class="fas fa-comment-alt me-2"></i>
                Conversa com <span id="chatOffcanvasNumber" class="fw-bold"></span>
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
        </div>
        <div class="offcanvas-body p-0 d-flex flex-column">
            <div class="chat-messages-container flex-grow-1" id="offcanvas-messages-container">
                <div id="offcanvas-messages-list" class="d-flex flex-column-reverse p-3">
                    <!-- Messages will be loaded here -->
                </div>
            </div>
            
            <div class="chat-input-container p-3 border-top">
                <form id="offcanvas-send-form">
                    <input type="hidden" id="offcanvas-number">
                    <div class="input-group">
                        <textarea class="form-control" id="offcanvas-message" rows="1" placeholder="Digite sua mensagem..." required></textarea>
                        <button class="btn btn-primary" type="submit">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </form>
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
                "./auth-utils.js": "./assets/js/auth-utils.js",
                "./login-check.js": "./assets/js/login-check.js"
            }
        }
    </script>
    <script type="module">
        import './assets/js/main.js';
        import './assets/js/login-check.js';
    </script>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Configuração da API
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const API_URL = isLocalhost ? 'http://localhost:3000/api' : 'http://node-api:3000/api';
            let updateInterval = null;
            
            // Elementos DOM
            // Elementos da interface
            const statusBadge = document.getElementById('status-badge');
            const connectBtn = document.getElementById('connect-btn');
            const disconnectBtn = document.getElementById('disconnect-btn');
            const qrcodeContainer = document.getElementById('qrcode-container');
            const qrcodeImg = document.getElementById('qrcode-img');
            const disconnectedView = document.getElementById('disconnected-view');
            const connectedView = document.getElementById('connected-view');
            const connectedNumber = document.getElementById('connected-number');
            const contactCount = document.getElementById('contact-count');
            const contactsList = document.getElementById('contacts-list');
            const refreshMessagesBtn = document.getElementById('refresh-messages');
            const lastUpdate = document.getElementById('last-update');
            
            // Elementos do modal de nova mensagem
            const newMessageModalElement = document.getElementById('newMessageModal');
            const newMessageModal = newMessageModalElement ? new bootstrap.Modal(newMessageModalElement) : null;
            const sendMessageForm = document.getElementById('send-message-form');
            const messageStatus = document.getElementById('message-status');
            const sendMessageBtn = document.getElementById('send-message-btn');
            
            // Elementos do offcanvas de chat
            const chatOffcanvasElement = document.getElementById('chatOffcanvas');
            const chatOffcanvas = chatOffcanvasElement ? new bootstrap.Offcanvas(chatOffcanvasElement) : null;
            const chatOffcanvasNumber = document.getElementById('chatOffcanvasNumber');
            const offcanvasMessagesList = document.getElementById('offcanvas-messages-list');
            const offcanvasSendForm = document.getElementById('offcanvas-send-form');
            const offcanvasNumber = document.getElementById('offcanvas-number');
            const offcanvasMessage = document.getElementById('offcanvas-message');
            
            // Theme switcher
            const themeSwitch = document.getElementById('theme-switch');
            const themeIcon = document.getElementById('theme-icon');
            
            // Variáveis para controlar a atualização de mensagens
            let messagesInterval = null;
            let receivedMessages = {}; // Cache local das mensagens
            let activeContactItem = null; // Referência ao item de contato ativo
            
            // Tradução dos status
            const statusTranslations = {
                'disconnected': 'Desconectado',
                'initializing': 'Inicializando',
                'qr_received': 'QR Code Recebido',
                'authenticated': 'Autenticado',
                'connected': 'Conectado',
                'error': 'Erro'
            };
            
            // Inicialização do tema
            function initTheme() {
                const savedTheme = localStorage.getItem('smartchatbox-theme') || 'light';
                document.documentElement.setAttribute('data-bs-theme', savedTheme);
                
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
            
            // Atualiza a interface com base no status
            function updateUI(status) {
                statusBadge.textContent = statusTranslations[status] || status;
                statusBadge.className = `badge status-${status}`;
                
                connectBtn.disabled = ['initializing', 'qr_received', 'authenticated', 'connected'].includes(status);
                disconnectBtn.disabled = ['disconnected', 'error'].includes(status);
                
                if (status === 'qr_received') {
                    fetchQRCode();
                    disconnectedView.classList.remove('d-none');
                    connectedView.classList.add('d-none');
                    qrcodeContainer.classList.remove('d-none');
                    stopMessagePolling();
                } else if (status === 'connected') {
                    qrcodeContainer.classList.add('d-none');
                    disconnectedView.classList.add('d-none');
                    connectedView.classList.remove('d-none');
                    startMessagePolling();
                } else {
                    qrcodeContainer.classList.add('d-none');
                    disconnectedView.classList.remove('d-none');
                    connectedView.classList.add('d-none');
                    stopMessagePolling();
                }
                
                lastUpdate.textContent = new Date().toLocaleString();
            }
            
            // Busca o status atual
            async function fetchStatus() {
                try {
                    const response = await fetch(`${API_URL}/status`);
                    const data = await response.json();
                    updateUI(data.status);
                } catch (error) {
                    console.error('Erro ao buscar status:', error);
                    updateUI('error');
                }
            }
            
            // Busca o QR Code
            async function fetchQRCode() {
                try {
                    const response = await fetch(`${API_URL}/qrcode`);
                    if (!response.ok) {
                        throw new Error('QR Code não disponível');
                    }
                    const data = await response.json();
                    qrcodeImg.src = data.qrcode;
                } catch (error) {
                    console.error('Erro ao buscar QR code:', error);
                }
            }
            
            // Iniciar conexão
            async function connect() {
                try {
                    await fetch(`${API_URL}/connect`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    startStatusPolling();
                } catch (error) {
                    console.error('Erro ao conectar:', error);
                }
            }
            
            // Desconectar
            async function disconnect() {
                try {
                    await fetch(`${API_URL}/disconnect`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    fetchStatus();
                } catch (error) {
                    console.error('Erro ao desconectar:', error);
                }
            }
            
            // Inicia a verificação periódica de status
            function startStatusPolling() {
                fetchStatus();
                if (!updateInterval) {
                    updateInterval = setInterval(fetchStatus, 3000);
                }
            }
            
            // Parar atualização de mensagens
            function stopMessagePolling() {
                if (messagesInterval) {
                    clearInterval(messagesInterval);
                    messagesInterval = null;
                }
            }
            
            // Buscar mensagens recebidas
            async function fetchMessages() {
                try {
                    const response = await fetch(`${API_URL}/messages`);
                    if (!response.ok) {
                        throw new Error('Falha ao buscar mensagens');
                    }
                    
                    const data = await response.json();
                    receivedMessages = data.messages; // Atualizar cache local
                    displayContacts(data.messages);
                    
                    // Atualizar contagem de contatos
                    contactCount.textContent = Object.keys(data.messages).length;
                    
                    // Atualizar a hora da última atualização
                    lastUpdate.textContent = new Date().toLocaleString();
                } catch (error) {
                    console.error('Erro ao buscar mensagens:', error);
                }
            }
            
            // Exibir lista de contatos na interface
            function displayContacts(messages) {
                // Limpar a lista atual de contatos que são carregados dinamicamente
                // Verificar se há o elemento de spinner e remover apenas os itens da lista
                const loadingSpinner = contactsList.querySelector('.text-center.p-4');
                if (loadingSpinner) {
                    contactsList.innerHTML = '';
                } else if (contactsList.children.length > 0) {
                    // Remover apenas os itens de contato, preservando outros possíveis elementos
                    Array.from(contactsList.children).forEach(child => {
                        if (child.classList.contains('contacts-list-item')) {
                            child.remove();
                        }
                    });
                }
                
                // Se não houver mensagens, mostrar uma mensagem
                if (Object.keys(messages).length === 0) {
                    const emptyMessage = document.createElement('div');
                    emptyMessage.className = 'text-center p-4 text-muted';
                    emptyMessage.innerHTML = '<p>Nenhuma conversa encontrada</p>';
                    contactsList.appendChild(emptyMessage);
                    return;
                }
                
                // Ordenar contatos pela data da última mensagem (mais recentes primeiro)
                const sortedContacts = Object.keys(messages).sort((a, b) => {
                    if (!messages[a].length) return 1;
                    if (!messages[b].length) return -1;
                    
                    const dateA = new Date(messages[a][0].timestamp);
                    const dateB = new Date(messages[b][0].timestamp);
                    return dateB - dateA;
                });
                
                // Iterar por cada número/contato
                sortedContacts.forEach(number => {
                    // Verificar se há mensagens para este número
                    if (!messages[number] || messages[number].length === 0) return;
                    
                    // Criar um item para cada contato
                    const contactItem = document.createElement('div');
                    contactItem.className = 'contacts-list-item';
                    
                    // Formatar o número para exibição
                    const formattedNumber = formatPhoneNumberForDisplay(number);
                    
                    // Obter a última mensagem para preview
                    const lastMessage = messages[number][0];
                    const lastMessageText = lastMessage.body.length > 40 
                        ? lastMessage.body.substring(0, 37) + '...' 
                        : lastMessage.body;
                    
                    // Formatar data/hora da última mensagem
                    const date = new Date(lastMessage.timestamp);
                    const formattedDate = formatDateTimeShort(date);
                    
                    // Ícone para indicar tipo da última mensagem
                    let messageIcon = '<i class="fas fa-arrow-down text-primary me-2"></i>';
                    if (lastMessage.fromMe) {
                        messageIcon = lastMessage.fromOtherDevice 
                            ? '<i class="fas fa-arrow-up text-warning me-2"></i>' 
                            : '<i class="fas fa-arrow-up text-success me-2"></i>';
                    }
                    
                    // Definir o conteúdo do item
                    contactItem.innerHTML = `
                        <div class="d-flex justify-content-between align-items-start w-100">
                            <div class="d-flex align-items-center">
                                <div class="contact-icon">
                                    <i class="fas fa-user-circle fs-4 me-2 text-muted"></i>
                                </div>
                                <div>
                                    <div class="fw-semibold">${formattedNumber}</div>
                                    <div class="contact-preview text-muted small d-flex align-items-center">
                                        ${messageIcon}
                                        <span>${lastMessageText}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="ms-2 text-end">
                                <div class="text-muted small">${formattedDate}</div>
                                <span class="badge bg-primary rounded-pill mt-1">${messages[number].length}</span>
                            </div>
                        </div>
                    `;
                    
                    // Adicionar evento de clique para abrir o offcanvas
                    contactItem.addEventListener('click', () => openChat(number, formattedNumber));
                    
                    contactsList.appendChild(contactItem);
                });
            }
            
            // Abrir o offcanvas de chat
            function openChat(number, displayNumber) {
                // Definir o número no offcanvas
                offcanvasNumber.value = number;
                chatOffcanvasNumber.textContent = displayNumber;
                
                // Exibir mensagens no offcanvas
                displayChatMessages(number);
                
                // Abrir o offcanvas
                chatOffcanvas.show();
                
                // Focar no campo de mensagem
                setTimeout(() => offcanvasMessage.focus(), 500);
            }
            
            // Exibir mensagens no offcanvas
            function displayChatMessages(number) {
                // Limpar a lista atual
                offcanvasMessagesList.innerHTML = '';
                
                // Verificar se há mensagens para este número
                if (!receivedMessages[number] || receivedMessages[number].length === 0) {
                    offcanvasMessagesList.innerHTML = '<div class="text-center p-4 text-muted">Nenhuma mensagem encontrada</div>';
                    return;
                }
                
                // Container para agrupar mensagens do mesmo tipo
                let currentGroup = null;
                let currentType = null;
                let lastTime = null;
                
                // Adicionar as mensagens
                receivedMessages[number].forEach((msg, index) => {
                    const date = new Date(msg.timestamp);
                    const formattedTime = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    const isNewDay = lastTime && !isSameDay(date, new Date(lastTime));
                    
                    // Se for um novo dia, adicionar separador
                    if (isNewDay) {
                        const dayDivider = document.createElement('div');
                        dayDivider.className = 'text-center my-3';
                        dayDivider.innerHTML = `<span class="badge bg-secondary">${formatDateOnly(date)}</span>`;
                        offcanvasMessagesList.appendChild(dayDivider);
                    }
                    
                    // Determinar o tipo de mensagem
                    let msgType = msg.fromMe ? (msg.fromOtherDevice ? 'sent-other' : 'sent') : 'received';
                    
                    // Se o tipo mudar ou for uma nova data, criar um novo grupo
                    if (msgType !== currentType || isNewDay) {
                        currentGroup = document.createElement('div');
                        currentGroup.className = 'd-flex flex-column my-2 ' + 
                            (msgType.includes('sent') ? 'align-items-end' : 'align-items-start');
                        offcanvasMessagesList.appendChild(currentGroup);
                        currentType = msgType;
                    }
                    
                    // Criar elemento da mensagem
                    const messageItem = document.createElement('div');
                    messageItem.className = `chat-message message-${msgType}`;
                    
                    // Conteúdo da mensagem
                    messageItem.innerHTML = `
                        <div>${msg.body}</div>
                        <div class="message-time text-end">${formattedTime}</div>
                    `;
                    
                    // Adicionar ao grupo atual
                    currentGroup.appendChild(messageItem);
                    
                    // Atualizar a última hora
                    lastTime = msg.timestamp;
                });
                
                // Adicionar separador de data no início
                if (receivedMessages[number].length > 0) {
                    const firstMsg = receivedMessages[number][receivedMessages[number].length - 1];
                    const firstDate = new Date(firstMsg.timestamp);
                    const dayDivider = document.createElement('div');
                    dayDivider.className = 'text-center my-3';
                    dayDivider.innerHTML = `<span class="badge bg-secondary">${formatDateOnly(firstDate)}</span>`;
                    offcanvasMessagesList.appendChild(dayDivider);
                }
                
                // Rolar para a mensagem mais recente
                setTimeout(() => {
                    const messagesContainer = document.getElementById('offcanvas-messages-container');
                    messagesContainer.scrollTop = 0;
                }, 100);
            }
            
            // Verificar se duas datas são do mesmo dia
            function isSameDay(date1, date2) {
                return date1.getDate() === date2.getDate() &&
                       date1.getMonth() === date2.getMonth() &&
                       date1.getFullYear() === date2.getFullYear();
            }
            
            // Formatar apenas a data
            function formatDateOnly(date) {
                const today = new Date();
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                
                if (isSameDay(date, today)) {
                    return 'Hoje';
                } else if (isSameDay(date, yesterday)) {
                    return 'Ontem';
                } else {
                    return date.toLocaleDateString('pt-BR', { 
                        day: '2-digit', 
                        month: '2-digit',
                        year: 'numeric'
                    });
                }
            }
            
            // Formato curto de data/hora para lista de contatos
            function formatDateTimeShort(date) {
                // Se for hoje, mostrar apenas a hora
                const today = new Date();
                if (date.toDateString() === today.toDateString()) {
                    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                }
                
                // Se for nos últimos 7 dias, mostrar o dia da semana
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                if (date > weekAgo) {
                    return date.toLocaleDateString('pt-BR', { weekday: 'short' });
                }
                
                // Caso contrário, mostrar a data
                return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            }
            
            // Função para formatar número de telefone para exibição
            function formatPhoneNumberForDisplay(number) {
                // Se começa com 55 (Brasil), formatar como +55 (XX) XXXXX-XXXX
                if (number.startsWith('55') && number.length >= 12) {
                    const country = number.substring(0, 2);
                    const ddd = number.substring(2, 4);
                    const part1 = number.substring(4, 9);
                    const part2 = number.substring(9);
                    return `+${country} (${ddd}) ${part1}-${part2}`;
                }
                return number;
            }
            
            // Iniciar atualização periódica de mensagens
            function startMessagePolling() {
                fetchMessages(); // Buscar mensagens imediatamente
                if (!messagesInterval) {
                    messagesInterval = setInterval(fetchMessages, 5000); // Atualizar a cada 5 segundos
                }
            }
            
            // Enviar mensagem pelo modal
            async function sendMessageFromForm() {
                const numberInput = document.getElementById('number');
                const messageInput = document.getElementById('message');
                
                // Adicionar código do país (+55) ao número
                const number = '55' + numberInput.value.trim().replace(/\D/g, '');
                const message = messageInput.value.trim();
                
                if (!number || !message) {
                    showMessageStatus('error', 'Preencha todos os campos!');
                    return;
                }
                
                // Mostrar status de envio
                showMessageStatus('info', 'Enviando mensagem...');
                
                try {
                    const response = await fetch(`${API_URL}/send`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ number, message })
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        showMessageStatus('success', `Mensagem enviada para ${formatPhoneNumberForDisplay(data.to)}!`);
                        
                        // Adicionar a mensagem enviada ao histórico local imediatamente
                        const formattedNumber = data.to;
                        
                        // Adicionar mensagem enviada ao histórico local
                        const sentMessage = {
                            body: message,
                            timestamp: new Date().toISOString(),
                            id: 'local-' + Date.now(), // ID temporário local
                            fromMe: true
                        };
                        
                        // Atualizar o histórico local
                        if (!receivedMessages[formattedNumber]) {
                            receivedMessages[formattedNumber] = [sentMessage];
                        } else {
                            receivedMessages[formattedNumber].unshift(sentMessage);
                        }
                        
                        // Atualizar a visualização
                        fetchMessages();
                        
                        // Limpar campos após envio bem-sucedido
                        messageInput.value = '';
                        
                        // Fechar o modal
                        setTimeout(() => {
                            newMessageModal.hide();
                        }, 1500);
                    } else {
                        showMessageStatus('error', `Erro: ${data.error}`);
                    }
                } catch (error) {
                    console.error('Erro ao enviar mensagem:', error);
                    showMessageStatus('error', 'Erro de conexão ao enviar mensagem');
                }
            }
            
            // Exibir status da mensagem no modal
            function showMessageStatus(type, text) {
                messageStatus.classList.remove('d-none', 'alert-success', 'alert-danger', 'alert-info');
                
                switch (type) {
                    case 'success':
                        messageStatus.classList.add('alert', 'alert-success');
                        break;
                    case 'error':
                        messageStatus.classList.add('alert', 'alert-danger');
                        break;
                    case 'info':
                        messageStatus.classList.add('alert', 'alert-info');
                        break;
                }
                
                messageStatus.textContent = text;
                messageStatus.classList.remove('d-none');
                
                // Esconder o status após 5 segundos se for sucesso
                if (type === 'success' || type === 'info') {
                    setTimeout(() => {
                        messageStatus.classList.add('d-none');
                    }, 5000);
                }
            }
            
            // Enviar mensagem pelo offcanvas de chat
            async function sendMessageFromOffcanvas(event) {
                event.preventDefault();
                
                const number = offcanvasNumber.value;
                const message = offcanvasMessage.value.trim();
                
                if (!number || !message) return;
                
                try {
                    const response = await fetch(`${API_URL}/send`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ number, message })
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        // Adicionar mensagem ao histórico local imediatamente
                        const formattedNumber = data.to;
                        
                        // Adicionar mensagem enviada ao histórico local
                        const sentMessage = {
                            body: message,
                            timestamp: new Date().toISOString(),
                            id: 'local-' + Date.now(), // ID temporário local
                            fromMe: true
                        };
                        
                        // Atualizar o histórico local
                        if (!receivedMessages[formattedNumber]) {
                            receivedMessages[formattedNumber] = [sentMessage];
                        } else {
                            receivedMessages[formattedNumber].unshift(sentMessage);
                        }
                        
                        // Atualizar a visualização do chat
                        displayChatMessages(formattedNumber);
                        
                        // Atualizar a lista de contatos
                        fetchMessages();
                        
                        // Limpar campo de mensagem
                        offcanvasMessage.value = '';
                        
                        // Focar no campo de mensagem para enviar outra
                        offcanvasMessage.focus();
                    }
                } catch (error) {
                    console.error('Erro ao enviar mensagem:', error);
                }
            }
            
            // Inicializar a interface
            initTheme();
            
            // Botões de conexão
            connectBtn.addEventListener('click', connect);
            disconnectBtn.addEventListener('click', disconnect);
            
            // Atualização de mensagens
            refreshMessagesBtn.addEventListener('click', fetchMessages);
            
            // Tema
            themeSwitch.addEventListener('click', toggleTheme);
            
            // Modal de nova mensagem
            sendMessageBtn.addEventListener('click', sendMessageFromForm);
            
            // Offcanvas de chat
            offcanvasSendForm.addEventListener('submit', sendMessageFromOffcanvas);
            
            // Auto-resize para o textarea
            offcanvasMessage.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = (this.scrollHeight) + 'px';
            });
            
            // Inicializar a verificação de status
            startStatusPolling();
            
            // Se o número de telefone conectado estiver disponível, exibi-lo
            if (localStorage.getItem('connected-number')) {
                connectedNumber.textContent = localStorage.getItem('connected-number');
            }
        });
    </script>
</body>
</html>