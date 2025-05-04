<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WhatsApp Connection Manager</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <style>
        .container {
            max-width: 800px;
            margin-top: 50px;
        }
        #qrcode-container {
            text-align: center;
            margin: 20px 0;
        }
        #qrcode-container img {
            max-width: 300px;
        }
        .status-badge {
            font-size: 1rem;
            padding: 0.5rem 1rem;
        }
        .status-disconnected { background-color: #dc3545; }
        .status-initializing { background-color: #ffc107; }
        .status-qr_received { background-color: #0dcaf0; }
        .status-authenticated { background-color: #0d6efd; }
        .status-connected { background-color: #198754; }
        .status-error { background-color: #6c757d; }
        
        /* Estilos para a seção de mensagens */
        #messages-list {
            max-height: 400px;
            overflow-y: auto;
        }
        
        #messages-list .list-group-item {
            border-radius: 0;
            border-left: none;
            border-right: none;
        }
        
        #messages-list .list-group-item:first-child {
            border-top-left-radius: 0.25rem;
            border-top-right-radius: 0.25rem;
        }
        
        #received-messages .card-body {
            padding: 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="mb-4">WhatsApp Connection Manager</h1>
        
        <div class="card mb-4">
            <div class="card-header">
                <h5>Status da Conexão</h5>
            </div>
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center">
                    <span>Status atual:</span>
                    <span id="status-badge" class="badge status-disconnected">Desconectado</span>
                </div>
                <div class="mt-3">
                    <button id="connect-btn" class="btn btn-primary me-2">Conectar WhatsApp</button>
                    <button id="disconnect-btn" class="btn btn-danger" disabled>Desconectar</button>
                </div>
            </div>
        </div>
        
        <div id="qrcode-container" class="card mb-4 d-none">
            <div class="card-header">
                <h5>Escaneie o QR Code</h5>
            </div>
            <div class="card-body">
                <p class="card-text">Abra o WhatsApp no seu celular e escaneie o QR Code abaixo:</p>
                <img id="qrcode-img" src="" alt="QR Code">
            </div>
        </div>
        
        <div class="row mb-4">
            <div class="col-md-4">
                <div id="message-form" class="card h-100 d-none">
                    <div class="card-header">
                        <h5>Nova Mensagem</h5>
                    </div>
                    <div class="card-body">
                        <form id="send-message-form">
                            <div class="mb-3">
                                <label for="number" class="form-label">Número de telefone</label>
                                <input type="text" class="form-control" id="number" placeholder="Ex: +5511999999999 ou 11999999999" required>
                                <div class="form-text">Digite o número com DDD, sem espaços ou caracteres especiais.</div>
                            </div>
                            <div class="mb-3">
                                <label for="message" class="form-label">Mensagem</label>
                                <textarea class="form-control" id="message" rows="3" required></textarea>
                            </div>
                            <button type="submit" class="btn btn-success">Enviar</button>
                        </form>
                        <div id="message-status" class="mt-3 d-none"></div>
                    </div>
                </div>
            </div>
            
            <div class="col-md-8">
                <div id="contacts-list-container" class="card h-100 d-none">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5>Contatos</h5>
                        <button id="refresh-messages" class="btn btn-sm btn-primary">Atualizar</button>
                    </div>
                    <div class="card-body p-0">
                        <div id="contacts-list" class="list-group list-group-flush"></div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Modal para conversa -->
        <div class="modal fade" id="chatModal" tabindex="-1" aria-labelledby="chatModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="chatModalLabel">Conversa com <span id="chatModalNumber"></span></h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div id="modal-messages-container" style="max-height: 400px; overflow-y: auto;">
                            <div id="modal-messages-list" class="list-group"></div>
                        </div>
                        <hr>
                        <form id="modal-send-form" class="mt-3">
                            <div class="input-group">
                                <input type="hidden" id="modal-number">
                                <textarea class="form-control" id="modal-message" rows="2" placeholder="Digite sua mensagem..." required></textarea>
                                <button class="btn btn-primary" type="submit">Enviar</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h5>Última atualização</h5>
            </div>
            <div class="card-body">
                <p id="last-update" class="mb-0">-</p>
            </div>
        </div>
    </div>

    <script>
        // Configuração da API
        // Verifica se está acessando de dentro ou fora do Docker
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const API_URL = isLocalhost ? 'http://localhost:3000/api' : 'http://node-api:3000/api';
        let updateInterval = null;
        
        // Elementos DOM
        const statusBadge = document.getElementById('status-badge');
        const connectBtn = document.getElementById('connect-btn');
        const disconnectBtn = document.getElementById('disconnect-btn');
        const qrcodeContainer = document.getElementById('qrcode-container');
        const qrcodeImg = document.getElementById('qrcode-img');
        const messageForm = document.getElementById('message-form');
        const sendMessageForm = document.getElementById('send-message-form');
        const messageStatus = document.getElementById('message-status');
        const contactsListContainer = document.getElementById('contacts-list-container');
        const contactsList = document.getElementById('contacts-list');
        const refreshMessagesBtn = document.getElementById('refresh-messages');
        const lastUpdate = document.getElementById('last-update');
        
        // Elementos do modal
        const chatModal = document.getElementById('chatModal');
        const chatModalNumber = document.getElementById('chatModalNumber');
        const modalMessagesList = document.getElementById('modal-messages-list');
        const modalSendForm = document.getElementById('modal-send-form');
        const modalNumber = document.getElementById('modal-number');
        const modalMessage = document.getElementById('modal-message');
        
        // Bootstrap Modal
        const modal = new bootstrap.Modal(chatModal);
        
        // Variáveis para controlar a atualização de mensagens
        let messagesInterval = null;
        let receivedMessages = {}; // Cache local das mensagens
        
        // Tradução dos status
        const statusTranslations = {
            'disconnected': 'Desconectado',
            'initializing': 'Inicializando',
            'qr_received': 'QR Code Recebido',
            'authenticated': 'Autenticado',
            'connected': 'Conectado',
            'error': 'Erro'
        };
        
        // Atualiza a interface com base no status
        function updateUI(status) {
            statusBadge.textContent = statusTranslations[status] || status;
            statusBadge.className = `badge status-${status}`;
            
            connectBtn.disabled = ['initializing', 'qr_received', 'authenticated', 'connected'].includes(status);
            disconnectBtn.disabled = ['disconnected', 'error'].includes(status);
            
            if (status === 'qr_received') {
                fetchQRCode();
                qrcodeContainer.classList.remove('d-none');
                messageForm.classList.add('d-none');
                contactsListContainer.classList.add('d-none');
                // Parar de atualizar mensagens
                stopMessagePolling();
            } else if (status === 'connected') {
                qrcodeContainer.classList.add('d-none');
                messageForm.classList.remove('d-none');
                contactsListContainer.classList.remove('d-none');
                // Iniciar atualização de mensagens
                startMessagePolling();
            } else {
                qrcodeContainer.classList.add('d-none');
                messageForm.classList.add('d-none');
                contactsListContainer.classList.add('d-none');
                // Parar de atualizar mensagens
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
        
        // Enviar mensagem
        async function sendMessage(event) {
            event.preventDefault();
            
            const numberInput = document.getElementById('number');
            const messageInput = document.getElementById('message');
            const number = numberInput.value.trim();
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
                    showMessageStatus('success', `Mensagem enviada para ${data.to}!`);
                    
                    // Adicionar a mensagem enviada ao histórico local imediatamente
                    // para feedback instantâneo sem esperar a próxima atualização
                    const formattedNumber = data.to;
                    if (!receivedMessages[formattedNumber]) {
                        receivedMessages[formattedNumber] = [];
                    }
                    
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
                } else {
                    showMessageStatus('error', `Erro: ${data.error}`);
                }
            } catch (error) {
                console.error('Erro ao enviar mensagem:', error);
                showMessageStatus('error', 'Erro de conexão ao enviar mensagem');
            }
        }
        
        // Exibir status da mensagem
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
            if (type === 'success') {
                setTimeout(() => {
                    messageStatus.classList.add('d-none');
                }, 5000);
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
                
                // Se o modal estiver aberto, atualizar as mensagens do contato atual
                if (chatModal.classList.contains('show') && modalNumber.value) {
                    displayModalMessages(modalNumber.value);
                }
            } catch (error) {
                console.error('Erro ao buscar mensagens:', error);
            }
        }
        
        // Exibir lista de contatos na interface
        function displayContacts(messages) {
            // Limpar a lista atual
            contactsList.innerHTML = '';
            
            // Se não houver mensagens, mostrar uma mensagem
            if (Object.keys(messages).length === 0) {
                contactsList.innerHTML = '<div class="list-group-item text-center">Nenhuma conversa encontrada</div>';
                return;
            }
            
            // Iterar por cada número/contato
            Object.keys(messages).forEach(number => {
                // Verificar se há mensagens para este número
                if (!messages[number] || messages[number].length === 0) return;
                
                // Criar um item para cada contato
                const contactItem = document.createElement('button');
                contactItem.type = 'button';
                contactItem.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
                
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
                
                // Definir o conteúdo do item
                contactItem.innerHTML = `
                    <div class="d-flex flex-column align-items-start">
                        <strong>${formattedNumber}</strong>
                        <small class="text-muted">${lastMessageText}</small>
                    </div>
                    <div class="d-flex flex-column align-items-end">
                        <small class="text-muted">${formattedDate}</small>
                        <span class="badge bg-primary rounded-pill">${messages[number].length}</span>
                    </div>
                `;
                
                // Adicionar evento de clique para abrir o modal
                contactItem.addEventListener('click', () => openChatModal(number, formattedNumber));
                
                contactsList.appendChild(contactItem);
            });
        }
        
        // Abrir modal de chat para um contato específico
        function openChatModal(number, displayNumber) {
            // Definir o número no modal
            modalNumber.value = number;
            chatModalNumber.textContent = displayNumber;
            
            // Exibir mensagens no modal
            displayModalMessages(number);
            
            // Abrir o modal
            modal.show();
            
            // Focar no campo de mensagem
            setTimeout(() => modalMessage.focus(), 500);
        }
        
        // Exibir mensagens no modal
        function displayModalMessages(number) {
            // Limpar a lista atual
            modalMessagesList.innerHTML = '';
            
            // Verificar se há mensagens para este número
            if (!receivedMessages[number] || receivedMessages[number].length === 0) {
                modalMessagesList.innerHTML = '<div class="text-center p-3">Nenhuma mensagem encontrada</div>';
                return;
            }
            
            // Adicionar as mensagens
            receivedMessages[number].forEach(msg => {
                const messageItem = document.createElement('div');
                messageItem.className = 'list-group-item';
                
                // Formatar data/hora
                const date = new Date(msg.timestamp);
                const formattedDate = formatDateTime(date);
                
                // Estilo diferente para mensagens enviadas vs. recebidas
                if (msg.fromMe) {
                    // Mensagem enviada por mim
                    messageItem.classList.add('list-group-item-success', 'text-end');
                    
                    // Badge diferente se foi enviado do celular ou web
                    const badge = msg.fromOtherDevice 
                        ? '<span class="badge bg-warning text-dark">Celular</span>'
                        : '<span class="badge bg-success">Web</span>';
                    
                    messageItem.innerHTML = `
                        <div class="d-flex justify-content-end align-items-center mb-1">
                            ${badge}
                            <small class="text-muted ms-2">${formattedDate}</small>
                        </div>
                        <p class="mb-1">${msg.body}</p>
                    `;
                } else {
                    // Mensagem recebida
                    messageItem.classList.add('list-group-item-light');
                    messageItem.innerHTML = `
                        <div class="d-flex align-items-center mb-1">
                            <span class="badge bg-primary me-2">Recebida</span>
                            <small class="text-muted">${formattedDate}</small>
                        </div>
                        <p class="mb-1">${msg.body}</p>
                    `;
                }
                
                modalMessagesList.appendChild(messageItem);
            });
            
            // Rolar para a mensagem mais recente
            const messagesContainer = document.getElementById('modal-messages-container');
            messagesContainer.scrollTop = 0;
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
        
        // Função para formatar data e hora
        function formatDateTime(date) {
            return date.toLocaleString('pt-BR', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit'
            });
        }
        
        // Iniciar atualização periódica de mensagens
        function startMessagePolling() {
            fetchMessages(); // Buscar mensagens imediatamente
            if (!messagesInterval) {
                messagesInterval = setInterval(fetchMessages, 5000); // Atualizar a cada 5 segundos
            }
        }
        
        // Parar atualização de mensagens
        function stopMessagePolling() {
            if (messagesInterval) {
                clearInterval(messagesInterval);
                messagesInterval = null;
            }
        }
        
        // Função para enviar mensagem pelo modal
        async function sendMessageFromModal(event) {
            event.preventDefault();
            
            const number = modalNumber.value;
            const message = modalMessage.value.trim();
            
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
                    
                    // Atualizar a visualização do modal
                    displayModalMessages(formattedNumber);
                    
                    // Limpar campo de mensagem
                    modalMessage.value = '';
                    
                    // Focar no campo de mensagem para enviar outra
                    modalMessage.focus();
                    
                    // Atualizar a lista de contatos
                    displayContacts(receivedMessages);
                }
            } catch (error) {
                console.error('Erro ao enviar mensagem:', error);
            }
        }
        
        // Event listeners
        connectBtn.addEventListener('click', connect);
        disconnectBtn.addEventListener('click', disconnect);
        sendMessageForm.addEventListener('submit', sendMessage);
        modalSendForm.addEventListener('submit', sendMessageFromModal);
        refreshMessagesBtn.addEventListener('click', fetchMessages);
        
        // Inicializar
        startStatusPolling();
    </script>
</body>
</html>