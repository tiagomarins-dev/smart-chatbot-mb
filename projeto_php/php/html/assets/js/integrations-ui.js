import integrationsService from './integrations.js';
import authService from './auth.js';

// UI Controller para a página de integrações
class IntegrationsUI {
  constructor() {
    // Elementos DOM para chaves API
    this.apiKeysLoading = document.getElementById('api-keys-loading');
    this.apiKeysEmpty = document.getElementById('api-keys-empty');
    this.apiKeysTable = document.getElementById('api-keys-table-container');
    this.apiKeysTableBody = document.querySelector('#api-keys-table tbody');
    
    // Elementos DOM para webhooks
    this.webhooksLoading = document.getElementById('webhooks-loading');
    this.webhooksEmpty = document.getElementById('webhooks-empty');
    this.webhooksTable = document.getElementById('webhooks-table-container');
    this.webhooksTableBody = document.querySelector('#webhooks-table tbody');
    
    // Elementos DOM do formulário de criação de chave API
    this.apiKeyCreateForm = document.getElementById('create-api-key-form');
    this.apiKeyCreateBtn = document.getElementById('api-key-create-btn');
    this.apiKeyResult = document.getElementById('api-key-result');
    this.newApiKey = document.getElementById('new-api-key');
    this.newApiSecret = document.getElementById('new-api-secret');
    
    // Elementos DOM do formulário de criação de webhook
    this.webhookCreateForm = document.getElementById('create-webhook-form');
    this.webhookCreateBtn = document.getElementById('webhook-create-btn');
    this.webhookResult = document.getElementById('webhook-result');
    this.webhookSecretContainer = document.getElementById('webhook-secret-container');
    this.newWebhookSecret = document.getElementById('new-webhook-secret');
    
    // Botões e modals
    this.confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    
    // Inicialização
    this.init();
  }
  
  // Inicializar a UI da página de integrações
  async init() {
    // Verificar se está autenticado antes de carregar dados
    const isAuthenticated = await authService.isAuthenticated();
    if (!isAuthenticated) return;
    
    // Configurar listeners de eventos
    this.setupEventListeners();
    
    // Carregar dados quando os tabs forem selecionados
    document.getElementById('apikeys-tab').addEventListener('shown.bs.tab', () => {
      this.loadApiKeys();
    });
    
    document.getElementById('webhooks-tab').addEventListener('shown.bs.tab', () => {
      this.loadWebhooks();
    });
    
    // Carregar dados da primeira tab ativa
    this.loadApiKeys();
  }
  
  // Configurar listeners de eventos
  setupEventListeners() {
    // Criar chave API
    this.apiKeyCreateBtn.addEventListener('click', () => this.createApiKey());
    
    // Criar webhook
    this.webhookCreateBtn.addEventListener('click', () => this.createWebhook());
    
    // Resetar modals quando fechados
    document.getElementById('createApiKeyModal').addEventListener('hidden.bs.modal', () => {
      this.apiKeyCreateForm.classList.remove('d-none');
      this.apiKeyResult.classList.add('d-none');
      this.apiKeyCreateBtn.classList.remove('d-none');
      this.apiKeyCreateForm.reset();
    });
    
    document.getElementById('createWebhookModal').addEventListener('hidden.bs.modal', () => {
      this.webhookCreateForm.classList.remove('d-none');
      this.webhookResult.classList.add('d-none');
      this.webhookCreateBtn.classList.remove('d-none');
      this.webhookCreateForm.reset();
    });
    
    // Adicionar funções de exclusão para o escopo global
    window.deleteApiKey = (id, name) => this.deleteApiKey(id, name);
    window.deleteWebhook = (id, name) => this.deleteWebhook(id, name);
  }
  
  // Carregar chaves API do usuário atual
  async loadApiKeys() {
    try {
      this.showApiKeysLoading();
      
      const apiKeys = await integrationsService.getApiKeys();
      
      if (apiKeys.length === 0) {
        this.showApiKeysEmpty();
      } else {
        this.renderApiKeys(apiKeys);
      }
    } catch (error) {
      console.error('Erro ao carregar chaves API:', error);
      this.showApiKeysError(error.message);
    }
  }
  
  // Mostrar carregamento para chaves API
  showApiKeysLoading() {
    this.apiKeysLoading.classList.remove('d-none');
    this.apiKeysEmpty.classList.add('d-none');
    this.apiKeysTable.classList.add('d-none');
  }
  
  // Mostrar estado vazio para chaves API
  showApiKeysEmpty() {
    this.apiKeysLoading.classList.add('d-none');
    this.apiKeysEmpty.classList.remove('d-none');
    this.apiKeysTable.classList.add('d-none');
  }
  
  // Mostrar erro ao carregar chaves API
  showApiKeysError(message) {
    this.apiKeysLoading.classList.add('d-none');
    
    // Inserir mensagem de erro antes da tabela
    const errorAlert = document.createElement('div');
    errorAlert.className = 'alert alert-danger';
    errorAlert.innerHTML = `<i class="fas fa-exclamation-circle me-1"></i> Erro ao carregar chaves API: ${message}`;
    
    // Limpar mensagens de erro anteriores
    const previousAlerts = document.querySelectorAll('#api-keys-list .alert-danger');
    previousAlerts.forEach(alert => alert.remove());
    
    document.getElementById('api-keys-list').prepend(errorAlert);
  }
  
  // Renderizar tabela de chaves API
  renderApiKeys(keys) {
    this.apiKeysLoading.classList.add('d-none');
    this.apiKeysEmpty.classList.add('d-none');
    this.apiKeysTable.classList.remove('d-none');
    
    // Limpar a tabela
    this.apiKeysTableBody.innerHTML = '';
    
    // Adicionar cada chave à tabela
    keys.forEach(key => {
      const row = document.createElement('tr');
      
      // Formatar permissões como badges
      const scopesBadges = key.scopes.map(scope => {
        const [resource, action] = scope.split(':');
        let badgeClass = 'bg-primary';
        if (action === 'read') badgeClass = 'bg-info';
        if (action === 'write') badgeClass = 'bg-success';
        if (action === 'manage' || action === 'admin') badgeClass = 'bg-warning';
        
        return `<span class="badge ${badgeClass} me-1">${scope}</span>`;
      }).join('');
      
      // Status badge
      const statusBadge = key.is_active 
        ? '<span class="badge bg-success">Ativa</span>' 
        : '<span class="badge bg-danger">Inativa</span>';
      
      // Formatar data
      const createdDate = new Date(key.created_at);
      const formattedDate = createdDate.toLocaleDateString('pt-BR') + ' ' + 
                          createdDate.toLocaleTimeString('pt-BR');
      
      // Adicionar células para cada coluna
      row.innerHTML = `
        <td>${key.name}</td>
        <td><code>${key.key}</code></td>
        <td>${scopesBadges}</td>
        <td>${key.rate_limit}/min</td>
        <td>${statusBadge}</td>
        <td>${formattedDate}</td>
        <td>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteApiKey('${key.id}', '${key.name}')">
            <i class="fas fa-trash-alt"></i>
          </button>
        </td>
      `;
      
      this.apiKeysTableBody.appendChild(row);
    });
  }
  
  // Criar uma nova chave API
  async createApiKey() {
    try {
      const name = document.getElementById('api-key-name').value.trim();
      
      if (!name) {
        alert('Por favor, informe um nome para a chave API.');
        return;
      }
      
      // Coletar escopos selecionados
      const scopes = [];
      if (document.getElementById('scope-messages-read').checked) scopes.push('messages:read');
      if (document.getElementById('scope-messages-write').checked) scopes.push('messages:write');
      if (document.getElementById('scope-contacts-read').checked) scopes.push('contacts:read');
      if (document.getElementById('scope-contacts-write').checked) scopes.push('contacts:write');
      if (document.getElementById('scope-status-read').checked) scopes.push('status:read');
      if (document.getElementById('scope-webhooks-manage').checked) scopes.push('webhooks:manage');
      
      if (scopes.length === 0) {
        alert('Por favor, selecione pelo menos uma permissão.');
        return;
      }
      
      const rateLimit = parseInt(document.getElementById('api-key-limit').value);
      
      // Mostrar estado de carregamento
      this.apiKeyCreateBtn.disabled = true;
      this.apiKeyCreateBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Criando...';
      
      // Chamar o serviço para criar a chave
      const newKey = await integrationsService.createApiKey(name, scopes, rateLimit);
      
      // Exibir resultado
      this.apiKeyCreateForm.classList.add('d-none');
      this.apiKeyResult.classList.remove('d-none');
      this.newApiKey.value = newKey.key;
      this.newApiSecret.value = newKey.secret;
      
      // Mudar botão
      this.apiKeyCreateBtn.classList.add('d-none');
      
    } catch (error) {
      console.error('Erro ao criar chave API:', error);
      alert(`Erro ao criar chave API: ${error.message}`);
      
      // Resetar estado do botão
      this.apiKeyCreateBtn.disabled = false;
      this.apiKeyCreateBtn.innerHTML = 'Criar Chave API';
    }
  }
  
  // Excluir uma chave API
  async deleteApiKey(id, name) {
    // Configurar o modal de confirmação
    document.getElementById('delete-confirm-text').textContent = `Tem certeza que deseja excluir a chave API "${name}"?`;
    const deleteModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    deleteModal.show();
    
    // Configurar ação do botão de confirmação
    this.confirmDeleteBtn.onclick = async () => {
      try {
        // Desabilitar botão e mostrar carregamento
        this.confirmDeleteBtn.disabled = true;
        this.confirmDeleteBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Excluindo...';
        
        // Chamar serviço para excluir
        await integrationsService.deleteApiKey(id);
        
        // Fechar modal
        deleteModal.hide();
        
        // Recarregar lista
        this.loadApiKeys();
        
      } catch (error) {
        console.error('Erro ao excluir chave API:', error);
        alert(`Erro ao excluir chave API: ${error.message}`);
        
        // Resetar estado do botão
        this.confirmDeleteBtn.disabled = false;
        this.confirmDeleteBtn.innerHTML = 'Excluir';
      }
    };
  }
  
  // Carregar webhooks do usuário atual
  async loadWebhooks() {
    try {
      this.showWebhooksLoading();
      
      const webhooks = await integrationsService.getWebhooks();
      
      if (webhooks.length === 0) {
        this.showWebhooksEmpty();
      } else {
        this.renderWebhooks(webhooks);
      }
    } catch (error) {
      console.error('Erro ao carregar webhooks:', error);
      this.showWebhooksError(error.message);
    }
  }
  
  // Mostrar carregamento para webhooks
  showWebhooksLoading() {
    this.webhooksLoading.classList.remove('d-none');
    this.webhooksEmpty.classList.add('d-none');
    this.webhooksTable.classList.add('d-none');
  }
  
  // Mostrar estado vazio para webhooks
  showWebhooksEmpty() {
    this.webhooksLoading.classList.add('d-none');
    this.webhooksEmpty.classList.remove('d-none');
    this.webhooksTable.classList.add('d-none');
  }
  
  // Mostrar erro ao carregar webhooks
  showWebhooksError(message) {
    this.webhooksLoading.classList.add('d-none');
    
    // Inserir mensagem de erro antes da tabela
    const errorAlert = document.createElement('div');
    errorAlert.className = 'alert alert-danger';
    errorAlert.innerHTML = `<i class="fas fa-exclamation-circle me-1"></i> Erro ao carregar webhooks: ${message}`;
    
    // Limpar mensagens de erro anteriores
    const previousAlerts = document.querySelectorAll('#webhooks-list .alert-danger');
    previousAlerts.forEach(alert => alert.remove());
    
    document.getElementById('webhooks-list').prepend(errorAlert);
  }
  
  // Renderizar tabela de webhooks
  renderWebhooks(webhooks) {
    this.webhooksLoading.classList.add('d-none');
    this.webhooksEmpty.classList.add('d-none');
    this.webhooksTable.classList.remove('d-none');
    
    // Limpar a tabela
    this.webhooksTableBody.innerHTML = '';
    
    // Adicionar cada webhook à tabela
    webhooks.forEach(webhook => {
      const row = document.createElement('tr');
      
      // Formatar eventos como badges
      const eventsBadges = webhook.events.map(event => {
        let badgeClass = 'bg-primary';
        if (event.includes('received')) badgeClass = 'bg-info';
        if (event.includes('sent')) badgeClass = 'bg-success';
        if (event.includes('failed')) badgeClass = 'bg-danger';
        
        return `<span class="badge ${badgeClass} me-1">${event}</span>`;
      }).join('');
      
      // Status badge
      const statusBadge = webhook.is_active 
        ? '<span class="badge bg-success">Ativo</span>' 
        : '<span class="badge bg-danger">Inativo</span>';
      
      // Formatar data da última execução
      let lastTriggered = '-';
      if (webhook.last_triggered_at) {
        const triggerDate = new Date(webhook.last_triggered_at);
        lastTriggered = triggerDate.toLocaleDateString('pt-BR') + ' ' + 
                        triggerDate.toLocaleTimeString('pt-BR');
      }
      
      // Adicionar células para cada coluna
      row.innerHTML = `
        <td>${webhook.name}</td>
        <td><code>${webhook.url}</code></td>
        <td>${eventsBadges}</td>
        <td>${statusBadge}</td>
        <td>${lastTriggered}</td>
        <td>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteWebhook('${webhook.id}', '${webhook.name}')">
            <i class="fas fa-trash-alt"></i>
          </button>
        </td>
      `;
      
      this.webhooksTableBody.appendChild(row);
    });
  }
  
  // Criar um novo webhook
  async createWebhook() {
    try {
      const name = document.getElementById('webhook-name').value.trim();
      const url = document.getElementById('webhook-url').value.trim();
      
      if (!name || !url) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
      }
      
      // Validar URL
      try {
        new URL(url);
      } catch (e) {
        alert('Por favor, informe uma URL válida.');
        return;
      }
      
      // Coletar eventos selecionados
      const events = [];
      if (document.getElementById('event-message-received').checked) events.push('message.received');
      if (document.getElementById('event-message-sent').checked) events.push('message.sent');
      if (document.getElementById('event-message-delivered').checked) events.push('message.delivered');
      if (document.getElementById('event-message-read').checked) events.push('message.read');
      if (document.getElementById('event-message-failed').checked) events.push('message.failed');
      if (document.getElementById('event-status-changed').checked) events.push('status.changed');
      
      if (events.length === 0) {
        alert('Por favor, selecione pelo menos um evento.');
        return;
      }
      
      const generateSecret = document.getElementById('webhook-generate-secret').checked;
      
      // Mostrar estado de carregamento
      this.webhookCreateBtn.disabled = true;
      this.webhookCreateBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Criando...';
      
      // Chamar o serviço para criar o webhook
      const newWebhook = await integrationsService.createWebhook(name, url, events, generateSecret);
      
      // Exibir resultado
      this.webhookCreateForm.classList.add('d-none');
      this.webhookResult.classList.remove('d-none');
      
      // Exibir token secreto, se gerado
      if (generateSecret && newWebhook.secret_token) {
        this.webhookSecretContainer.classList.remove('d-none');
        this.newWebhookSecret.value = newWebhook.secret_token;
      } else {
        this.webhookSecretContainer.classList.add('d-none');
      }
      
      // Mudar botão
      this.webhookCreateBtn.classList.add('d-none');
      
    } catch (error) {
      console.error('Erro ao criar webhook:', error);
      alert(`Erro ao criar webhook: ${error.message}`);
      
      // Resetar estado do botão
      this.webhookCreateBtn.disabled = false;
      this.webhookCreateBtn.innerHTML = 'Criar Webhook';
    }
  }
  
  // Excluir um webhook
  async deleteWebhook(id, name) {
    // Configurar o modal de confirmação
    document.getElementById('delete-confirm-text').textContent = `Tem certeza que deseja excluir o webhook "${name}"?`;
    const deleteModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    deleteModal.show();
    
    // Configurar ação do botão de confirmação
    this.confirmDeleteBtn.onclick = async () => {
      try {
        // Desabilitar botão e mostrar carregamento
        this.confirmDeleteBtn.disabled = true;
        this.confirmDeleteBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Excluindo...';
        
        // Chamar serviço para excluir
        await integrationsService.deleteWebhook(id);
        
        // Fechar modal
        deleteModal.hide();
        
        // Recarregar lista
        this.loadWebhooks();
        
      } catch (error) {
        console.error('Erro ao excluir webhook:', error);
        alert(`Erro ao excluir webhook: ${error.message}`);
        
        // Resetar estado do botão
        this.confirmDeleteBtn.disabled = false;
        this.confirmDeleteBtn.innerHTML = 'Excluir';
      }
    };
  }
}

// Exportar a classe para uso no importmap
export default IntegrationsUI;