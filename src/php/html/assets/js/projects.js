/**
 * Gerenciador de Projetos
 * Este módulo gerencia operações relacionadas a projetos: listagem, criação, edição e desativação.
 * Inclui também funcionalidades para filtrar projetos por empresa.
 */

import authService from './auth.js';

class ProjectsManager {
    constructor() {
        // Configuração de API
        this.isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        this.apiUrl = this.isLocalhost ? 'http://localhost:9030/api/v1/projects' : '/api/v1/projects';
        this.companiesApiUrl = this.isLocalhost ? 'http://localhost:9030/api/v1/companies' : '/api/v1/companies';
        
        // Elementos DOM
        this.projectForm = document.getElementById('project-form');
        this.projectIdInput = document.getElementById('project-id');
        this.projectNameInput = document.getElementById('project-name');
        this.projectDescriptionInput = document.getElementById('project-description');
        this.projectCompanySelect = document.getElementById('project-company');
        this.projectCampaignStartInput = document.getElementById('project-campaign-start');
        this.projectCampaignEndInput = document.getElementById('project-campaign-end');
        this.projectStatusContainer = document.getElementById('project-status-container');
        this.projectModal = new bootstrap.Modal(document.getElementById('projectModal'));
        this.deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
        this.saveProjectBtn = document.getElementById('save-project-btn');
        this.confirmDeleteBtn = document.getElementById('confirm-delete-btn');
        this.projectAlert = document.getElementById('project-alert');
        
        // Elementos de filtro de empresa
        this.companySelect = document.getElementById('company-select');
        this.companyFilterLoading = document.getElementById('company-filter-loading');
        this.companyFilterEmpty = document.getElementById('company-filter-empty');
        this.companyFilterList = document.getElementById('company-filter-list');
        
        // Referências a elementos de estado
        this.projectsLoading = document.getElementById('projects-loading');
        this.projectsEmpty = document.getElementById('projects-empty');
        this.projectsTableContainer = document.getElementById('projects-table-container');
        this.projectsTableBody = document.getElementById('projects-table-body');
        
        // Estado interno
        this.currentProjectId = null;
        this.projects = [];
        this.companies = [];
        this.selectedCompanyId = '';
        this.companyMap = {}; // Mapeamento de ID -> Nome da empresa
    }
    
    /**
     * Inicializa o gerenciador de projetos
     */
    init() {
        this.bindEvents();
        // Primeiro carregamos as empresas, depois os projetos serão carregados
        // apenas quando uma empresa for selecionada
        this.loadCompanies();
    }
    
    /**
     * Configura todos os event listeners
     */
    bindEvents() {
        // Modal de novo projeto
        document.getElementById('new-project-btn').addEventListener('click', () => this.showCreateProjectModal());
        
        // Botão salvar no modal
        this.saveProjectBtn.addEventListener('click', () => this.saveProject());
        
        // Botão confirmar exclusão
        this.confirmDeleteBtn.addEventListener('click', () => this.deleteProject());
        
        // Filtro de empresa
        if (this.companySelect) {
            this.companySelect.addEventListener('change', () => {
                this.selectedCompanyId = this.companySelect.value;
                this.loadProjects();
            });
        }
        
        // Redefine o modal quando fechado
        document.getElementById('projectModal').addEventListener('hidden.bs.modal', () => {
            this.resetProjectForm();
        });
    }
    
    /**
     * Carrega a lista de empresas do backend
     */
    async loadCompanies() {
        try {
            this.showCompanyFilterLoading();
            
            // Obtém o token de autenticação
            const session = await authService.getSession();
            
            if (!session) {
                this.showAlert('error', 'Você precisa estar autenticado para gerenciar projetos.');
                return;
            }
            
            // Faz a requisição para a API
            const response = await fetch(this.companiesApiUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Erro ao carregar empresas');
            }
            
            // Atualiza o estado interno
            this.companies = data.companies || [];
            
            // Cria um mapeamento de ID -> Nome da empresa para uso futuro
            this.companyMap = {};
            this.companies.forEach(company => {
                this.companyMap[company.id] = company.name;
            });
            
            // Atualiza a interface
            this.renderCompanyFilter();
            this.populateCompanySelect();
        } catch (error) {
            console.error('Erro ao carregar empresas:', error);
            this.showAlert('error', `Erro ao carregar empresas: ${error.message}`);
            this.showCompanyFilterEmpty();
        }
    }
    
    /**
     * Renderiza o filtro de empresas
     */
    renderCompanyFilter() {
        if (!this.companies || this.companies.length === 0) {
            this.showCompanyFilterEmpty();
            return;
        }
        
        // Limpa o select
        this.companySelect.innerHTML = '<option value="" disabled>Selecione uma Empresa</option>';
        
        // Filtra apenas empresas ativas
        const activeCompanies = this.companies.filter(company => company.is_active);
        
        if (activeCompanies.length === 0) {
            this.showCompanyFilterEmpty();
            return;
        }
        
        // Adiciona cada empresa ao select
        activeCompanies.forEach(company => {
            const option = document.createElement('option');
            option.value = company.id;
            option.textContent = company.name;
            this.companySelect.appendChild(option);
        });
        
        // Seleciona a primeira empresa por padrão
        if (activeCompanies.length > 0) {
            this.companySelect.value = activeCompanies[0].id;
            this.selectedCompanyId = activeCompanies[0].id;
            
            // Carrega os projetos com a empresa selecionada
            this.loadProjects();
        }
        
        // Mostra o filtro
        this.showCompanyFilterList();
    }
    
    /**
     * Preenche o select de empresas no modal de projetos
     */
    populateCompanySelect() {
        if (!this.projectCompanySelect) return;
        
        // Limpa o select
        this.projectCompanySelect.innerHTML = '<option value="">Selecione uma empresa</option>';
        
        // Filtra apenas empresas ativas
        const activeCompanies = this.companies.filter(company => company.is_active);
        
        // Adiciona cada empresa ao select
        activeCompanies.forEach(company => {
            const option = document.createElement('option');
            option.value = company.id;
            option.textContent = company.name;
            this.projectCompanySelect.appendChild(option);
        });
    }
    
    /**
     * Carrega a lista de projetos do backend
     */
    async loadProjects() {
        try {
            this.showLoading();
            
            // Obtém o token de autenticação
            const session = await authService.getSession();
            
            if (!session) {
                this.showAlert('error', 'Você precisa estar autenticado para gerenciar projetos.');
                return;
            }
            
            // Um projeto deve sempre pertencer a uma empresa, então verificamos se uma empresa foi selecionada
            if (!this.selectedCompanyId) {
                this.showEmpty();
                this.showAlert('info', 'Selecione uma empresa para visualizar seus projetos');
                return;
            }
            
            // Constrói a URL com o filtro de empresa obrigatório
            let url = `${this.apiUrl}?company_id=${this.selectedCompanyId}`;
            
            // Faz a requisição para a API
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Erro ao carregar projetos');
            }
            
            // Atualiza o estado interno
            this.projects = data.projects || [];
            
            // Atualiza a interface
            this.renderProjects();
        } catch (error) {
            console.error('Erro ao carregar projetos:', error);
            this.showAlert('error', `Erro ao carregar projetos: ${error.message}`);
            this.showEmpty();
        }
    }
    
    /**
     * Renderiza a lista de projetos na tabela
     */
    renderProjects() {
        if (!this.projects || this.projects.length === 0) {
            this.showEmpty();
            return;
        }
        
        // Limpa a tabela
        this.projectsTableBody.innerHTML = '';
        
        // Adiciona cada projeto à tabela
        this.projects.forEach(project => {
            const row = document.createElement('tr');
            
            // Status badge
            const statusBadge = project.is_active 
                ? '<span class="badge bg-success">Ativo</span>' 
                : '<span class="badge bg-danger">Inativo</span>';
            
            // Nome da empresa
            const companyName = this.companyMap[project.company_id] || 'Desconhecida';
            
            // Formatar período da campanha
            let campaignPeriod = 'Não definido';
            if (project.campaign_start_date || project.campaign_end_date) {
                if (project.campaign_start_date && project.campaign_end_date) {
                    const startDate = new Date(project.campaign_start_date);
                    const endDate = new Date(project.campaign_end_date);
                    campaignPeriod = `${startDate.toLocaleDateString('pt-BR')} até ${endDate.toLocaleDateString('pt-BR')}`;
                } else if (project.campaign_start_date) {
                    const startDate = new Date(project.campaign_start_date);
                    campaignPeriod = `A partir de ${startDate.toLocaleDateString('pt-BR')}`;
                } else if (project.campaign_end_date) {
                    const endDate = new Date(project.campaign_end_date);
                    campaignPeriod = `Até ${endDate.toLocaleDateString('pt-BR')}`;
                }
            }
            
            // Formatar data
            const createdDate = new Date(project.created_at);
            const formattedDate = createdDate.toLocaleDateString('pt-BR') + ' ' + 
                               createdDate.toLocaleTimeString('pt-BR');
            
            // Botões de ação
            const editButton = `<button class="btn btn-sm btn-outline-primary me-1 edit-project-btn" data-id="${project.id}">
                                <i class="fas fa-edit"></i>
                            </button>`;
            
            const deleteButton = project.is_active 
                ? `<button class="btn btn-sm btn-outline-danger delete-project-btn" data-id="${project.id}" data-name="${project.name}">
                    <i class="fas fa-trash-alt"></i>
                  </button>`
                : '';
            
            // Conteúdo da linha
            row.innerHTML = `
                <td>${project.name}</td>
                <td>${companyName}</td>
                <td>${campaignPeriod}</td>
                <td>${statusBadge}</td>
                <td>${formattedDate}</td>
                <td>
                    ${editButton}
                    ${deleteButton}
                </td>
            `;
            
            // Adiciona event listeners
            const editBtn = row.querySelector('.edit-project-btn');
            if (editBtn) {
                editBtn.addEventListener('click', () => this.showEditProjectModal(project.id));
            }
            
            const deleteBtn = row.querySelector('.delete-project-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => this.showDeleteProjectModal(project.id, project.name));
            }
            
            this.projectsTableBody.appendChild(row);
        });
        
        // Mostra a tabela
        this.showTable();
    }
    
    /**
     * Mostra o modal para criar um novo projeto
     */
    showCreateProjectModal() {
        // Reseta o formulário
        this.resetProjectForm();
        
        // Configura o modal
        document.getElementById('projectModalLabel').textContent = 'Novo Projeto';
        
        // Esconde o container de status (não é necessário para novo projeto)
        this.projectStatusContainer.classList.add('d-none');
        
        // Mostra o modal
        this.projectModal.show();
    }
    
    /**
     * Mostra o modal para editar um projeto existente
     * @param {string} projectId ID do projeto
     */
    showEditProjectModal(projectId) {
        // Busca o projeto pelo ID
        const project = this.projects.find(p => p.id === projectId);
        
        if (!project) {
            this.showAlert('error', 'Projeto não encontrado');
            return;
        }
        
        // Preenche o formulário com os dados do projeto
        this.projectIdInput.value = project.id;
        this.projectNameInput.value = project.name;
        this.projectDescriptionInput.value = project.description || '';
        this.projectCompanySelect.value = project.company_id;
        
        // Preenche as datas da campanha
        this.projectCampaignStartInput.value = project.campaign_start_date || '';
        this.projectCampaignEndInput.value = project.campaign_end_date || '';
        
        // Seta o status do projeto
        if (project.is_active) {
            document.getElementById('project-status-active').checked = true;
        } else {
            document.getElementById('project-status-inactive').checked = true;
        }
        
        // Mostra o container de status
        this.projectStatusContainer.classList.remove('d-none');
        
        // Configura o modal
        document.getElementById('projectModalLabel').textContent = 'Editar Projeto';
        
        // Salva o ID do projeto atual
        this.currentProjectId = projectId;
        
        // Mostra o modal
        this.projectModal.show();
    }
    
    /**
     * Mostra o modal para confirmar a desativação de um projeto
     * @param {string} projectId ID do projeto
     * @param {string} projectName Nome do projeto
     */
    showDeleteProjectModal(projectId, projectName) {
        // Preenche o modal com os dados do projeto
        document.getElementById('delete-project-name').textContent = projectName;
        
        // Salva o ID do projeto atual
        this.currentProjectId = projectId;
        
        // Mostra o modal
        this.deleteModal.show();
    }
    
    /**
     * Salva um projeto (cria novo ou atualiza existente)
     */
    async saveProject() {
        try {
            // Valida o formulário
            if (!this.projectNameInput.value.trim()) {
                this.showAlert('error', 'O nome do projeto é obrigatório', true);
                return;
            }
            
            if (!this.projectCompanySelect.value) {
                this.showAlert('error', 'Selecione uma empresa para o projeto', true);
                return;
            }
            
            // Desabilita o botão durante o processamento
            this.saveProjectBtn.disabled = true;
            this.saveProjectBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Salvando...';
            
            // Obtém o token de autenticação
            const session = await authService.getSession();
            
            if (!session) {
                throw new Error('Você precisa estar autenticado para gerenciar projetos.');
            }
            
            // Prepara os dados do projeto
            const projectData = {
                name: this.projectNameInput.value.trim(),
                company_id: this.projectCompanySelect.value,
                description: this.projectDescriptionInput.value.trim() || null,
                campaign_start_date: this.projectCampaignStartInput.value || null,
                campaign_end_date: this.projectCampaignEndInput.value || null
            };
            
            // Validar datas da campanha
            if (projectData.campaign_start_date && projectData.campaign_end_date) {
                const startDate = new Date(projectData.campaign_start_date);
                const endDate = new Date(projectData.campaign_end_date);
                
                if (endDate < startDate) {
                    this.showAlert('error', 'A data de término da campanha não pode ser anterior à data de início', true);
                    // Restaura o botão
                    this.saveProjectBtn.disabled = false;
                    this.saveProjectBtn.textContent = 'Salvar';
                    return;
                }
            }
            
            // Se for edição, inclui o status
            if (this.currentProjectId) {
                projectData.is_active = document.getElementById('project-status-active').checked;
            }
            
            // Determina se é uma criação ou atualização
            const isEditing = !!this.currentProjectId;
            const method = isEditing ? 'PUT' : 'POST';
            const url = isEditing ? `${this.apiUrl}/${this.currentProjectId}` : this.apiUrl;
            
            // Faz a requisição para a API
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify(projectData)
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Erro ao salvar projeto');
            }
            
            // Fecha o modal
            this.projectModal.hide();
            
            // Recarrega os projetos
            this.loadProjects();
            
            // Mostra mensagem de sucesso
            this.showAlert('success', isEditing ? 'Projeto atualizado com sucesso!' : 'Projeto criado com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar projeto:', error);
            this.showAlert('error', `Erro ao salvar projeto: ${error.message}`, true);
        } finally {
            // Restaura o botão
            this.saveProjectBtn.disabled = false;
            this.saveProjectBtn.textContent = 'Salvar';
        }
    }
    
    /**
     * Desativa um projeto (soft delete)
     */
    async deleteProject() {
        try {
            if (!this.currentProjectId) {
                this.showAlert('error', 'ID do projeto não fornecido');
                return;
            }
            
            // Desabilita o botão durante o processamento
            this.confirmDeleteBtn.disabled = true;
            this.confirmDeleteBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Desativando...';
            
            // Obtém o token de autenticação
            const session = await authService.getSession();
            
            if (!session) {
                throw new Error('Você precisa estar autenticado para gerenciar projetos.');
            }
            
            // Faz a requisição para a API
            const response = await fetch(`${this.apiUrl}/${this.currentProjectId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Erro ao desativar projeto');
            }
            
            // Fecha o modal
            this.deleteModal.hide();
            
            // Recarrega os projetos
            this.loadProjects();
            
            // Mostra mensagem de sucesso
            this.showAlert('success', 'Projeto desativado com sucesso!');
        } catch (error) {
            console.error('Erro ao desativar projeto:', error);
            this.showAlert('error', `Erro ao desativar projeto: ${error.message}`);
        } finally {
            // Restaura o botão
            this.confirmDeleteBtn.disabled = false;
            this.confirmDeleteBtn.textContent = 'Desativar';
        }
    }
    
    /**
     * Reseta o formulário de projeto
     */
    resetProjectForm() {
        this.projectForm.reset();
        this.projectIdInput.value = '';
        this.currentProjectId = null;
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
            this.projectAlert;
        
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
            this.projectForm.before(alertElement);
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
     * Mostra o estado de carregamento do filtro de empresa
     */
    showCompanyFilterLoading() {
        this.companyFilterLoading.classList.remove('d-none');
        this.companyFilterEmpty.classList.add('d-none');
        this.companyFilterList.classList.add('d-none');
    }
    
    /**
     * Mostra o estado vazio do filtro de empresa
     */
    showCompanyFilterEmpty() {
        this.companyFilterLoading.classList.add('d-none');
        this.companyFilterEmpty.classList.remove('d-none');
        this.companyFilterList.classList.add('d-none');
    }
    
    /**
     * Mostra o filtro de empresa
     */
    showCompanyFilterList() {
        this.companyFilterLoading.classList.add('d-none');
        this.companyFilterEmpty.classList.add('d-none');
        this.companyFilterList.classList.remove('d-none');
    }
    
    /**
     * Mostra o estado de carregamento de projetos
     */
    showLoading() {
        this.projectsLoading.classList.remove('d-none');
        this.projectsEmpty.classList.add('d-none');
        this.projectsTableContainer.classList.add('d-none');
    }
    
    /**
     * Mostra o estado vazio (sem projetos)
     */
    showEmpty() {
        this.projectsLoading.classList.add('d-none');
        this.projectsEmpty.classList.remove('d-none');
        this.projectsTableContainer.classList.add('d-none');
    }
    
    /**
     * Mostra a tabela de projetos
     */
    showTable() {
        this.projectsLoading.classList.add('d-none');
        this.projectsEmpty.classList.add('d-none');
        this.projectsTableContainer.classList.remove('d-none');
    }
}

export default ProjectsManager;