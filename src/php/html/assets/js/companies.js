/**
 * Gerenciador de Empresas
 * Este módulo gerencia operações relacionadas a empresas: listagem, criação, edição e desativação.
 */

import authService from './auth.js';

class CompaniesManager {
    constructor() {
        // Configuração de API
        this.isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        this.apiUrl = this.isLocalhost ? 'http://localhost:9030/api/v1/companies' : '/api/v1/companies';
        
        // Elementos DOM
        this.companyForm = document.getElementById('company-form');
        this.companyIdInput = document.getElementById('company-id');
        this.companyNameInput = document.getElementById('company-name');
        this.companyStatusContainer = document.getElementById('company-status-container');
        this.companyModal = new bootstrap.Modal(document.getElementById('companyModal'));
        this.deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
        this.saveCompanyBtn = document.getElementById('save-company-btn');
        this.confirmDeleteBtn = document.getElementById('confirm-delete-btn');
        this.companyAlert = document.getElementById('company-alert');
        
        // Referências a elementos de estado
        this.companiesLoading = document.getElementById('companies-loading');
        this.companiesEmpty = document.getElementById('companies-empty');
        this.companiesTableContainer = document.getElementById('companies-table-container');
        this.companiesTableBody = document.getElementById('companies-table-body');
        
        // Estado interno
        this.currentCompanyId = null;
        this.companies = [];
    }
    
    /**
     * Inicializa o gerenciador de empresas
     */
    init() {
        this.bindEvents();
        this.loadCompanies();
    }
    
    /**
     * Configura todos os event listeners
     */
    bindEvents() {
        // Modal de nova empresa
        document.getElementById('new-company-btn').addEventListener('click', () => this.showCreateCompanyModal());
        
        // Botão salvar no modal
        this.saveCompanyBtn.addEventListener('click', () => this.saveCompany());
        
        // Botão confirmar exclusão
        this.confirmDeleteBtn.addEventListener('click', () => this.deleteCompany());
        
        // Redefine o modal quando fechado
        document.getElementById('companyModal').addEventListener('hidden.bs.modal', () => {
            this.resetCompanyForm();
        });
    }
    
    /**
     * Carrega a lista de empresas do backend
     */
    async loadCompanies() {
        try {
            this.showLoading();
            
            // Obtém o token de autenticação
            const session = await authService.getSession();
            
            if (!session) {
                this.showAlert('error', 'Você precisa estar autenticado para gerenciar empresas.');
                return;
            }
            
            // Faz a requisição para a API
            const headers = {
                'Authorization': `Bearer ${session.access_token}`
            };
            
            // Tenta obter a API key se disponível
            try {
                const apiKey = localStorage.getItem('api_key');
                if (apiKey) {
                    headers['X-API-Key'] = apiKey;
                    console.log('Usando API Key para autenticação');
                    // Remover o token JWT se estamos usando API Key
                    delete headers['Authorization'];
                } else {
                    console.log('Usando JWT para autenticação');
                }
            } catch (e) {
                console.warn('Erro ao obter API key do localStorage:', e);
            }
            
            console.log('Requisição GET para:', this.apiUrl, 'com headers:', JSON.stringify(headers));
            
            const response = await fetch(this.apiUrl, {
                method: 'GET',
                headers: headers
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Erro ao carregar empresas');
            }
            
            // Atualiza o estado interno
            this.companies = data.companies || [];
            
            // Atualiza a interface
            this.renderCompanies();
        } catch (error) {
            console.error('Erro ao carregar empresas:', error);
            this.showAlert('error', `Erro ao carregar empresas: ${error.message}`);
            this.showEmpty();
        }
    }
    
    /**
     * Renderiza a lista de empresas na tabela
     */
    renderCompanies() {
        if (!this.companies || this.companies.length === 0) {
            this.showEmpty();
            return;
        }
        
        // Limpa a tabela
        this.companiesTableBody.innerHTML = '';
        
        // Adiciona cada empresa à tabela
        this.companies.forEach(company => {
            const row = document.createElement('tr');
            
            // Status badge
            const statusBadge = company.is_active 
                ? '<span class="badge bg-success">Ativa</span>' 
                : '<span class="badge bg-danger">Inativa</span>';
            
            // Formatar data
            const createdDate = new Date(company.created_at);
            const formattedDate = createdDate.toLocaleDateString('pt-BR') + ' ' + 
                               createdDate.toLocaleTimeString('pt-BR');
            
            // Botões de ação
            const editButton = `<button class="btn btn-sm btn-outline-primary me-1 edit-company-btn" data-id="${company.id}">
                                <i class="fas fa-edit"></i>
                            </button>`;
            
            const deleteButton = company.is_active 
                ? `<button class="btn btn-sm btn-outline-danger delete-company-btn" data-id="${company.id}" data-name="${company.name}">
                    <i class="fas fa-trash-alt"></i>
                  </button>`
                : '';
            
            // Conteúdo da linha
            row.innerHTML = `
                <td>${company.name}</td>
                <td>${statusBadge}</td>
                <td>${formattedDate}</td>
                <td>
                    ${editButton}
                    ${deleteButton}
                </td>
            `;
            
            // Adiciona event listeners
            const editBtn = row.querySelector('.edit-company-btn');
            if (editBtn) {
                editBtn.addEventListener('click', () => this.showEditCompanyModal(company.id));
            }
            
            const deleteBtn = row.querySelector('.delete-company-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => this.showDeleteCompanyModal(company.id, company.name));
            }
            
            this.companiesTableBody.appendChild(row);
        });
        
        // Mostra a tabela
        this.showTable();
    }
    
    /**
     * Mostra o modal para criar uma nova empresa
     */
    showCreateCompanyModal() {
        // Reseta o formulário
        this.resetCompanyForm();
        
        // Configura o modal
        document.getElementById('companyModalLabel').textContent = 'Nova Empresa';
        
        // Esconde o container de status (não é necessário para nova empresa)
        this.companyStatusContainer.classList.add('d-none');
        
        // Mostra o modal
        this.companyModal.show();
    }
    
    /**
     * Mostra o modal para editar uma empresa existente
     * @param {string} companyId ID da empresa
     */
    showEditCompanyModal(companyId) {
        // Busca a empresa pelo ID
        const company = this.companies.find(c => c.id === companyId);
        
        if (!company) {
            this.showAlert('error', 'Empresa não encontrada');
            return;
        }
        
        // Preenche o formulário com os dados da empresa
        this.companyIdInput.value = company.id;
        this.companyNameInput.value = company.name;
        
        // Seta o status da empresa
        if (company.is_active) {
            document.getElementById('company-status-active').checked = true;
        } else {
            document.getElementById('company-status-inactive').checked = true;
        }
        
        // Mostra o container de status
        this.companyStatusContainer.classList.remove('d-none');
        
        // Configura o modal
        document.getElementById('companyModalLabel').textContent = 'Editar Empresa';
        
        // Salva o ID da empresa atual
        this.currentCompanyId = companyId;
        
        // Mostra o modal
        this.companyModal.show();
    }
    
    /**
     * Mostra o modal para confirmar a desativação de uma empresa
     * @param {string} companyId ID da empresa
     * @param {string} companyName Nome da empresa
     */
    showDeleteCompanyModal(companyId, companyName) {
        // Preenche o modal com os dados da empresa
        document.getElementById('delete-company-name').textContent = companyName;
        
        // Salva o ID da empresa atual
        this.currentCompanyId = companyId;
        
        // Mostra o modal
        this.deleteModal.show();
    }
    
    /**
     * Salva uma empresa (cria nova ou atualiza existente)
     */
    async saveCompany() {
        try {
            // Valida o formulário
            if (!this.companyNameInput.value.trim()) {
                this.showAlert('error', 'O nome da empresa é obrigatório', true);
                return;
            }
            
            // Desabilita o botão durante o processamento
            this.saveCompanyBtn.disabled = true;
            this.saveCompanyBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Salvando...';
            
            // Obtém o token de autenticação
            const session = await authService.getSession();
            
            if (!session) {
                throw new Error('Você precisa estar autenticado para gerenciar empresas.');
            }
            
            // Prepara os dados da empresa
            const companyData = {
                name: this.companyNameInput.value.trim()
            };
            
            // Se for edição, inclui o status
            if (this.currentCompanyId) {
                companyData.is_active = document.getElementById('company-status-active').checked;
            }
            
            // Determina se é uma criação ou atualização
            const isEditing = !!this.currentCompanyId;
            const method = isEditing ? 'PUT' : 'POST';
            const url = isEditing ? `${this.apiUrl}/${this.currentCompanyId}` : this.apiUrl;
            
            // Prepara os headers
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            };
            
            // Tenta obter a API key se disponível
            try {
                const apiKey = localStorage.getItem('api_key');
                if (apiKey) {
                    headers['X-API-Key'] = apiKey;
                    console.log('Usando API Key para salvar empresa');
                    // Remover o token JWT se estamos usando API Key
                    delete headers['Authorization'];
                }
            } catch (e) {
                console.warn('Erro ao obter API key do localStorage:', e);
            }
            
            console.log(`Requisição ${method} para:`, url, 'com headers:', JSON.stringify(headers));
            
            // Faz a requisição para a API
            const response = await fetch(url, {
                method: method,
                headers: headers,
                body: JSON.stringify(companyData)
            });
            
            // Ler resposta conforme o tipo de conteúdo
            const contentType = response.headers.get('content-type') || '';
            let data;
            if (contentType.includes('application/json')) {
                data = await response.json();
            } else {
                // Se não for JSON, mostrar texto bruto para depuração
                const text = await response.text();
                console.error('Resposta não-JSON ao salvar empresa:', text);
                throw new Error('Resposta inválida do servidor');
            }
            // Verificar sucesso HTTP
            if (!response.ok) {
                const message = data.error?.message || data.error || 'Erro ao salvar empresa';
                throw new Error(message);
            }
            
            // Fecha o modal
            this.companyModal.hide();
            
            // Recarrega as empresas
            this.loadCompanies();
            
            // Mostra mensagem de sucesso
            this.showAlert('success', isEditing ? 'Empresa atualizada com sucesso!' : 'Empresa criada com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar empresa:', error);
            this.showAlert('error', `Erro ao salvar empresa: ${error.message}`, true);
        } finally {
            // Restaura o botão
            this.saveCompanyBtn.disabled = false;
            this.saveCompanyBtn.textContent = 'Salvar';
        }
    }
    
    /**
     * Desativa uma empresa (soft delete)
     */
    async deleteCompany() {
        try {
            if (!this.currentCompanyId) {
                this.showAlert('error', 'ID da empresa não fornecido');
                return;
            }
            
            // Desabilita o botão durante o processamento
            this.confirmDeleteBtn.disabled = true;
            this.confirmDeleteBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Desativando...';
            
            // Obtém o token de autenticação
            const session = await authService.getSession();
            
            if (!session) {
                throw new Error('Você precisa estar autenticado para gerenciar empresas.');
            }
            
            // Prepara os headers
            const headers = {
                'Authorization': `Bearer ${session.access_token}`
            };
            
            // Tenta obter a API key se disponível
            try {
                const apiKey = localStorage.getItem('api_key');
                if (apiKey) {
                    headers['X-API-Key'] = apiKey;
                    console.log('Usando API Key para desativar empresa');
                    // Remover o token JWT se estamos usando API Key
                    delete headers['Authorization'];
                }
            } catch (e) {
                console.warn('Erro ao obter API key do localStorage:', e);
            }
            
            const url = `${this.apiUrl}/${this.currentCompanyId}`;
            console.log('Requisição DELETE para:', url, 'com headers:', JSON.stringify(headers));
            
            // Faz a requisição para a API
            const response = await fetch(url, {
                method: 'DELETE',
                headers: headers
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Erro ao desativar empresa');
            }
            
            // Fecha o modal
            this.deleteModal.hide();
            
            // Recarrega as empresas
            this.loadCompanies();
            
            // Mostra mensagem de sucesso
            this.showAlert('success', 'Empresa desativada com sucesso!');
        } catch (error) {
            console.error('Erro ao desativar empresa:', error);
            this.showAlert('error', `Erro ao desativar empresa: ${error.message}`);
        } finally {
            // Restaura o botão
            this.confirmDeleteBtn.disabled = false;
            this.confirmDeleteBtn.textContent = 'Desativar';
        }
    }
    
    /**
     * Reseta o formulário de empresa
     */
    resetCompanyForm() {
        this.companyForm.reset();
        this.companyIdInput.value = '';
        this.currentCompanyId = null;
    }
    
    /**
     * Mostra um alerta na página
     * @param {string} type Tipo de alerta ('success', 'error', 'info')
     * @param {string} message Mensagem a ser exibida
     * @param {boolean} inModal Se verdadeiro, mostra o alerta no modal
     */
    showAlert(type, message, inModal = false) {
        const alertClass = type === 'success' ? 'alert-success' : 
                         type === 'error' ? 'alert-danger' : 
                         'alert-info';
        
        const alertIcon = type === 'success' ? 'check-circle' : 
                        type === 'error' ? 'exclamation-circle' : 
                        'info-circle';
        
        const alertElement = inModal ? 
            document.createElement('div') : 
            this.companyAlert;
        
        if (inModal) {
            alertElement.className = `alert ${alertClass} mb-3`;
            alertElement.id = 'modal-alert';
            const existingAlert = document.getElementById('modal-alert');
            if (existingAlert) {
                existingAlert.remove();
            }
        } else {
            alertElement.className = `alert ${alertClass}`;
        }
        
        alertElement.innerHTML = `<i class="fas fa-${alertIcon} me-2"></i>${message}`;
        
        if (inModal) {
            this.companyForm.before(alertElement);
            setTimeout(() => {
                alertElement.remove();
            }, 5000);
        } else {
            alertElement.classList.remove('d-none');
            setTimeout(() => {
                alertElement.classList.add('d-none');
            }, 5000);
        }
    }
    
    /**
     * Mostra o estado de carregamento
     */
    showLoading() {
        this.companiesLoading.classList.remove('d-none');
        this.companiesEmpty.classList.add('d-none');
        this.companiesTableContainer.classList.add('d-none');
    }
    
    /**
     * Mostra o estado vazio (sem empresas)
     */
    showEmpty() {
        this.companiesLoading.classList.add('d-none');
        this.companiesEmpty.classList.remove('d-none');
        this.companiesTableContainer.classList.add('d-none');
    }
    
    /**
     * Mostra a tabela de empresas
     */
    showTable() {
        this.companiesLoading.classList.add('d-none');
        this.companiesEmpty.classList.add('d-none');
        this.companiesTableContainer.classList.remove('d-none');
    }
}

export default CompaniesManager;