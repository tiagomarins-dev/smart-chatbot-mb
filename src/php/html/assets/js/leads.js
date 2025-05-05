/**
 * Gerenciador de Leads
 * Este módulo gerencia operações relacionadas a leads: listagem, filtragem e manipulação.
 * Implementa um layout em três seções: empresas, projetos e leads.
 */

import authService from './auth.js';

class LeadsManager {
    constructor() {
        // Configuração de API
        this.isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        this.apiBaseUrl = this.isLocalhost ? 'http://localhost:9030/api/v1' : '/api/v1';
        this.leadsApiUrl = `${this.apiBaseUrl}/leads`;
        this.companiesApiUrl = `${this.apiBaseUrl}/companies`;
        this.projectsApiUrl = `${this.apiBaseUrl}/projects`;
        
        // Elementos DOM - Alertas e containers gerais
        this.leadsAlert = document.getElementById('leads-alert');
        this.leadsLoading = document.getElementById('leads-loading');
        
        // Empresas
        this.companiesContainer = document.getElementById('companies-container');
        this.companiesLoading = document.getElementById('companies-loading');
        this.companiesEmpty = document.getElementById('companies-empty');
        this.companiesList = document.getElementById('companies-list');
        this.selectedCompanyName = document.getElementById('selected-company-name');
        
        // Projetos
        this.projectsSection = document.getElementById('projects-section');
        this.projectsContainer = document.getElementById('projects-container');
        this.projectsLoading = document.getElementById('projects-loading');
        this.projectsEmpty = document.getElementById('projects-empty');
        this.projectsList = document.getElementById('projects-list');
        this.selectedProjectName = document.getElementById('selected-project-name');
        
        // Leads
        this.leadsDetailSection = document.getElementById('leads-detail-section');
        this.backToProjectsBtn = document.getElementById('back-to-projects-btn');
        this.leadsTableLoading = document.getElementById('leads-table-loading');
        this.leadsTableEmpty = document.getElementById('leads-table-empty');
        this.leadsTableContainer = document.getElementById('leads-table-container');
        this.leadsTableBody = document.getElementById('leads-table-body');
        this.leadsPagination = document.getElementById('leads-pagination');
        this.leadsSearch = document.getElementById('leads-search');
        this.statusFilterBtn = document.getElementById('status-filter-btn');
        this.statusFilterMenu = document.getElementById('status-filter-menu');
        this.exportLeadsBtn = document.getElementById('export-leads-btn');
        this.deleteSelectedLeadsBtn = document.getElementById('delete-selected-leads-btn');
        this.selectAllLeads = document.getElementById('select-all-leads');
        
        // Modais
        this.leadModal = new bootstrap.Modal(document.getElementById('leadModal'));
        this.leadDetailsModal = new bootstrap.Modal(document.getElementById('leadDetailsModal'));
        this.deleteLeadModal = new bootstrap.Modal(document.getElementById('deleteLeadModal'));
        this.bulkDeleteModal = new bootstrap.Modal(document.getElementById('bulkDeleteModal'));
        
        // Formulário de lead
        this.leadForm = document.getElementById('lead-form');
        this.leadIdInput = document.getElementById('lead-id');
        this.leadProjectIdInput = document.getElementById('lead-project-id');
        this.leadNameInput = document.getElementById('lead-name');
        this.leadEmailInput = document.getElementById('lead-email');
        this.leadPhoneInput = document.getElementById('lead-phone');
        this.leadStatusInput = document.getElementById('lead-status');
        this.leadNotesInput = document.getElementById('lead-notes');
        this.leadUtmSourceInput = document.getElementById('lead-utm-source');
        this.leadUtmMediumInput = document.getElementById('lead-utm-medium');
        this.leadUtmCampaignInput = document.getElementById('lead-utm-campaign');
        this.leadUtmTermInput = document.getElementById('lead-utm-term');
        this.leadUtmContentInput = document.getElementById('lead-utm-content');
        this.saveLeadBtn = document.getElementById('save-lead-btn');
        
        // Detalhes do lead
        this.detailLeadName = document.getElementById('detail-lead-name');
        this.detailLeadEmail = document.getElementById('detail-lead-email');
        this.detailLeadPhone = document.getElementById('detail-lead-phone');
        this.detailLeadStatus = document.getElementById('detail-lead-status');
        this.detailLeadNotes = document.getElementById('detail-lead-notes');
        this.detailLeadUtmSource = document.getElementById('detail-lead-utm-source');
        this.detailLeadUtmMedium = document.getElementById('detail-lead-utm-medium');
        this.detailLeadUtmCampaign = document.getElementById('detail-lead-utm-campaign');
        this.detailLeadOrigin = document.getElementById('detail-lead-origin');
        this.detailLeadCreatedAt = document.getElementById('detail-lead-created-at');
        this.editFromDetailsBtn = document.getElementById('edit-from-details-btn');
        
        // Botões de exclusão
        this.deleteLeadName = document.getElementById('delete-lead-name');
        this.confirmDeleteLeadBtn = document.getElementById('confirm-delete-lead-btn');
        this.bulkDeleteCount = document.getElementById('bulk-delete-count');
        this.confirmBulkDeleteBtn = document.getElementById('confirm-bulk-delete-btn');
        
        // Estado interno
        this.companies = [];
        this.projects = [];
        this.leads = [];
        this.currentCompanyId = null;
        this.currentProjectId = null;
        this.currentLeadId = null;
        this.selectedLeads = new Set();
        this.currentPage = 1;
        this.totalPages = 1;
        this.leadsPerPage = 10;
        this.currentStatusFilter = 'all';
        this.currentSearchTerm = '';
    }
    
    /**
     * Inicializa o gerenciador de leads
     */
    init() {
        // Esconder a seção principal até a autenticação estar pronta
        document.querySelector('.auth-required').classList.add('d-none');
        
        // Verificar autenticação e iniciar aplicação
        this.checkAuth().then(authenticated => {
            if (authenticated) {
                // Mostrar a seção principal
                document.querySelector('.auth-required').classList.remove('d-none');
                document.querySelector('.non-auth-required').classList.add('d-none');
                
                // Iniciar carregando dados
                this.loadData();
                
                // Configurar eventos
                this.bindEvents();
            } else {
                // Mostrar mensagem para usuários não autenticados
                document.querySelector('.auth-required').classList.add('d-none');
                document.querySelector('.non-auth-required').classList.remove('d-none');
            }
        });
    }
    
    /**
     * Verifica se o usuário está autenticado
     * @returns {Promise<boolean>} Promessa que resolve para true se autenticado
     */
    async checkAuth() {
        try {
            const session = await authService.getSession();
            return !!session;
        } catch (error) {
            console.error('Erro ao verificar autenticação:', error);
            return false;
        }
    }
    
    /**
     * Carrega os dados iniciais
     */
    async loadData() {
        this.showLoading();
        
        try {
            // Carregar empresas e projetos em paralelo
            await Promise.all([
                this.loadCompanies(),
                this.loadProjects()
            ]);
            
            // Ocultar indicador de carregamento principal
            this.hideLoading();
        } catch (error) {
            console.error('Erro ao carregar dados iniciais:', error);
            this.showAlert('error', `Erro ao carregar dados: ${error.message}`);
            this.hideLoading();
        }
    }
    
    /**
     * Configura todos os event listeners
     */
    bindEvents() {
        // Navegação entre seções
        this.backToProjectsBtn.addEventListener('click', () => this.showProjectsSection());
        
        // Formulário de lead
        document.getElementById('new-lead-btn').addEventListener('click', () => this.showCreateLeadModal());
        this.saveLeadBtn.addEventListener('click', () => this.saveLead());
        
        // Filtros e busca
        this.leadsSearch.addEventListener('input', this.debounce(() => {
            this.currentSearchTerm = this.leadsSearch.value.trim();
            this.currentPage = 1;
            this.filterAndRenderLeads();
        }, 300));
        
        // Adicionar eventos aos itens do menu de filtro de status
        this.statusFilterMenu.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const status = e.target.getAttribute('data-status');
                this.currentStatusFilter = status;
                
                // Atualizar texto do botão
                const statusText = status === 'all' ? 'Status' : this.formatStatus(status);
                this.statusFilterBtn.innerHTML = `<i class="fas fa-filter me-1"></i> ${statusText}`;
                
                // Atualizar classe active
                this.statusFilterMenu.querySelectorAll('.dropdown-item').forEach(i => {
                    i.classList.remove('active');
                });
                e.target.classList.add('active');
                
                // Filtrar leads
                this.currentPage = 1;
                this.filterAndRenderLeads();
            });
        });
        
        // Exportar leads
        this.exportLeadsBtn.addEventListener('click', () => this.exportLeadsToCSV());
        
        // Seleção de leads
        this.selectAllLeads.addEventListener('change', () => {
            const checkboxes = this.leadsTableBody.querySelectorAll('.lead-select');
            const checked = this.selectAllLeads.checked;
            
            checkboxes.forEach(checkbox => {
                checkbox.checked = checked;
                const leadId = checkbox.getAttribute('data-lead-id');
                
                if (checked) {
                    this.selectedLeads.add(leadId);
                } else {
                    this.selectedLeads.delete(leadId);
                }
            });
            
            this.updateBulkDeleteButton();
        });
        
        // Exclusão em massa
        this.deleteSelectedLeadsBtn.addEventListener('click', () => {
            this.bulkDeleteCount.textContent = this.selectedLeads.size;
            this.bulkDeleteModal.show();
        });
        
        this.confirmBulkDeleteBtn.addEventListener('click', () => this.deleteBulkLeads());
        
        // Exclusão individual
        this.confirmDeleteLeadBtn.addEventListener('click', () => this.deleteLead());
        
        // Editar do modal de detalhes
        this.editFromDetailsBtn.addEventListener('click', () => {
            this.leadDetailsModal.hide();
            this.showEditLeadModal(this.currentLeadId);
        });
        
        // Resetar formulário quando modal é fechado
        document.getElementById('leadModal').addEventListener('hidden.bs.modal', () => {
            this.resetLeadForm();
        });
    }
    
    /**
     * Carrega a lista de empresas do backend
     */
    async loadCompanies() {
        try {
            this.showCompaniesLoading();
            
            // Obter o token de autenticação
            const session = await authService.getSession();
            
            if (!session) {
                this.showAlert('error', 'Você precisa estar autenticado para gerenciar leads.');
                return;
            }
            
            // Faz a requisição para a API
            const headers = await this.getAuthHeaders(session);
            
            const response = await fetch(this.companiesApiUrl, {
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
            this.showCompaniesEmpty();
        }
    }
    
    /**
     * Carrega a lista de projetos do backend
     */
    async loadProjects(companyId = null) {
        try {
            this.showProjectsLoading();
            
            // Obter o token de autenticação
            const session = await authService.getSession();
            
            if (!session) {
                this.showAlert('error', 'Você precisa estar autenticado para gerenciar leads.');
                return;
            }
            
            // Faz a requisição para a API
            const headers = await this.getAuthHeaders(session);
            
            // Construir URL com filtro de empresa, se necessário
            let url = this.projectsApiUrl;
            if (companyId) {
                url += `?company_id=${companyId}`;
            }
            
            const response = await fetch(url, {
                method: 'GET',
                headers: headers
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
            this.showProjectsEmpty();
        }
    }
    
    /**
     * Carrega os leads de um projeto específico
     * @param {string} projectId ID do projeto
     */
    async loadLeads(projectId) {
        try {
            this.showLeadsTableLoading();
            
            // Atualizar o estado atual
            this.currentProjectId = projectId;
            
            // Atualizar o nome do projeto selecionado
            const project = this.projects.find(p => p.id === projectId);
            if (project) {
                this.selectedProjectName.textContent = project.name;
                this.leadProjectIdInput.value = projectId;
            }
            
            // Obter o token de autenticação
            const session = await authService.getSession();
            
            if (!session) {
                this.showAlert('error', 'Você precisa estar autenticado para gerenciar leads.');
                return;
            }
            
            // Faz a requisição para a API
            const headers = await this.getAuthHeaders(session);
            
            const url = `${this.leadsApiUrl}?project_id=${projectId}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: headers
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Erro ao carregar leads');
            }
            
            // Atualiza o estado interno
            this.leads = data.leads || [];
            
            // Resetar filtros
            this.currentPage = 1;
            this.currentStatusFilter = 'all';
            this.currentSearchTerm = '';
            this.leadsSearch.value = '';
            this.statusFilterBtn.innerHTML = '<i class="fas fa-filter me-1"></i> Status';
            this.statusFilterMenu.querySelectorAll('.dropdown-item').forEach(i => {
                i.classList.remove('active');
            });
            this.statusFilterMenu.querySelector('[data-status="all"]').classList.add('active');
            
            // Limpar seleções
            this.selectedLeads.clear();
            this.selectAllLeads.checked = false;
            this.updateBulkDeleteButton();
            
            // Renderizar leads
            this.filterAndRenderLeads();
            
            // Mostrar a seção de leads
            this.showLeadsDetailSection();
        } catch (error) {
            console.error('Erro ao carregar leads:', error);
            this.showLeadsTableEmpty();
        }
    }
    
    /**
     * Filtra e renderiza os leads com base nos filtros atuais
     */
    filterAndRenderLeads() {
        // Aplicar filtros
        let filteredLeads = [...this.leads];
        
        // Filtrar por status
        if (this.currentStatusFilter !== 'all') {
            filteredLeads = filteredLeads.filter(lead => lead.status === this.currentStatusFilter);
        }
        
        // Filtrar por busca (nome, email ou telefone)
        if (this.currentSearchTerm) {
            const searchTerm = this.currentSearchTerm.toLowerCase();
            filteredLeads = filteredLeads.filter(lead => {
                const name = (lead.name || '').toLowerCase();
                const email = (lead.email || '').toLowerCase();
                const phone = (lead.phone || '').toLowerCase();
                
                return name.includes(searchTerm) || 
                       email.includes(searchTerm) || 
                       phone.includes(searchTerm);
            });
        }
        
        // Calcular paginação
        this.totalPages = Math.max(1, Math.ceil(filteredLeads.length / this.leadsPerPage));
        if (this.currentPage > this.totalPages) {
            this.currentPage = 1;
        }
        
        // Obter leads da página atual
        const startIndex = (this.currentPage - 1) * this.leadsPerPage;
        const endIndex = startIndex + this.leadsPerPage;
        const paginatedLeads = filteredLeads.slice(startIndex, endIndex);
        
        // Renderizar a tabela
        this.renderLeadsTable(paginatedLeads);
        
        // Renderizar a paginação
        this.renderPagination();
        
        // Mostrar mensagem vazia se não houver leads
        if (filteredLeads.length === 0) {
            this.showLeadsTableEmpty();
        } else {
            this.showLeadsTable();
        }
    }
    
    /**
     * Renderiza a lista de empresas
     */
    renderCompanies() {
        if (!this.companies || this.companies.length === 0) {
            this.showCompaniesEmpty();
            return;
        }
        
        // Limpa a lista
        this.companiesList.innerHTML = '';
        
        // Adiciona cada empresa à lista
        this.companies.forEach(company => {
            // Apenas empresas ativas
            if (!company.is_active) {
                return;
            }
            
            // Conta projetos relacionados
            const projectCount = this.projects.filter(
                project => project.company_id === company.id && project.is_active
            ).length;
            
            const companyCard = document.createElement('div');
            companyCard.className = 'card company-card mb-3';
            companyCard.setAttribute('data-company-id', company.id);
            
            // Verificar se é a empresa selecionada atualmente
            if (this.currentCompanyId === company.id) {
                companyCard.classList.add('active');
            }
            
            companyCard.innerHTML = `
                <div class="card-body py-2 px-3">
                    <div class="d-flex justify-content-between align-items-center">
                        <h6 class="mb-0">${company.name}</h6>
                        <span class="badge bg-primary rounded-pill">${projectCount}</span>
                    </div>
                </div>
            `;
            
            // Adiciona event listener
            companyCard.addEventListener('click', () => {
                this.selectCompany(company.id);
            });
            
            this.companiesList.appendChild(companyCard);
        });
        
        // Adiciona card "Todas as empresas"
        const allCompaniesCard = document.createElement('div');
        allCompaniesCard.className = 'card company-card mb-3';
        allCompaniesCard.setAttribute('data-company-id', 'all');
        
        // Verificar se nenhuma empresa está selecionada
        if (!this.currentCompanyId) {
            allCompaniesCard.classList.add('active');
        }
        
        // Contar todos os projetos ativos
        const allProjectsCount = this.projects.filter(project => project.is_active).length;
        
        allCompaniesCard.innerHTML = `
            <div class="card-body py-2 px-3">
                <div class="d-flex justify-content-between align-items-center">
                    <h6 class="mb-0">Todas as Empresas</h6>
                    <span class="badge bg-primary rounded-pill">${allProjectsCount}</span>
                </div>
            </div>
        `;
        
        // Adiciona event listener
        allCompaniesCard.addEventListener('click', () => {
            this.selectCompany(null);
        });
        
        // Adicionar no topo da lista
        this.companiesList.insertBefore(allCompaniesCard, this.companiesList.firstChild);
        
        // Mostra a lista
        this.showCompaniesList();
    }
    
    /**
     * Renderiza a lista de projetos
     */
    renderProjects() {
        // Filtrar projetos pela empresa selecionada
        let filteredProjects = [...this.projects];
        
        if (this.currentCompanyId) {
            filteredProjects = filteredProjects.filter(project => 
                project.company_id === this.currentCompanyId && project.is_active
            );
        } else {
            // Mostrar apenas projetos ativos
            filteredProjects = filteredProjects.filter(project => project.is_active);
        }
        
        if (filteredProjects.length === 0) {
            this.showProjectsEmpty();
            return;
        }
        
        // Limpa a lista
        this.projectsList.innerHTML = '';
        
        // Adiciona cada projeto à lista
        filteredProjects.forEach(project => {
            // Encontra a empresa do projeto
            const company = this.companies.find(c => c.id === project.company_id);
            const companyName = company ? company.name : 'Desconhecida';
            
            const projectCard = document.createElement('div');
            projectCard.className = 'col-md-4 mb-3';
            
            const leads = project.lead_count || 0;
            
            // Badge de status
            const statusBadge = project.is_active 
                ? '<span class="badge bg-success">Ativo</span>' 
                : '<span class="badge bg-danger">Inativo</span>';
            
            projectCard.innerHTML = `
                <div class="card project-card h-100" data-project-id="${project.id}">
                    <div class="card-body">
                        <h6 class="card-title">${project.name}</h6>
                        <p class="card-text mb-1">
                            ${statusBadge}
                        </p>
                        <small class="text-muted d-block mb-2">${companyName}</small>
                        <div class="d-flex justify-content-between align-items-center mt-2">
                            <span class="badge bg-light text-dark">
                                <i class="fas fa-users me-1"></i> ${leads} Leads
                            </span>
                            <button class="btn btn-sm btn-primary view-leads-btn">
                                <i class="fas fa-eye me-1"></i>Ver Leads
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            // Adiciona event listener ao botão de ver leads
            const viewLeadsBtn = projectCard.querySelector('.view-leads-btn');
            viewLeadsBtn.addEventListener('click', () => {
                this.loadLeads(project.id);
            });
            
            this.projectsList.appendChild(projectCard);
        });
        
        // Mostra a lista
        this.showProjectsList();
    }
    
    /**
     * Renderiza a tabela de leads
     * @param {Array} leads Lista de leads a serem renderizados
     */
    renderLeadsTable(leads) {
        // Limpa a tabela
        this.leadsTableBody.innerHTML = '';
        
        if (!leads || leads.length === 0) {
            return;
        }
        
        // Adiciona cada lead à tabela
        leads.forEach(lead => {
            const row = document.createElement('tr');
            
            // Status badge
            const statusClass = this.getStatusClass(lead.status);
            const statusBadge = `<span class="badge ${statusClass}">${this.formatStatus(lead.status)}</span>`;
            
            // Tags (usando UTMs como exemplo)
            let tags = '';
            
            if (lead.utm_source) {
                tags += `<span class="lead-tag">${lead.utm_source}</span>`;
            }
            
            if (lead.utm_medium) {
                tags += `<span class="lead-tag">${lead.utm_medium}</span>`;
            }
            
            if (lead.utm_campaign) {
                tags += `<span class="lead-tag">${lead.utm_campaign}</span>`;
            }
            
            // Se não tiver nenhuma tag
            if (!tags) {
                tags = '<span class="text-muted">-</span>';
            }
            
            // Formatação de telefone
            const formattedPhone = this.formatPhone(lead.phone);
            
            // Checkbox para seleção
            const isChecked = this.selectedLeads.has(lead.id) ? 'checked' : '';
            
            // Conteúdo da linha
            row.innerHTML = `
                <td>
                    <div class="form-check">
                        <input class="form-check-input lead-select" type="checkbox" data-lead-id="${lead.id}" ${isChecked}>
                    </div>
                </td>
                <td>${lead.name || '-'}</td>
                <td>${lead.email || '-'}</td>
                <td>${formattedPhone}</td>
                <td>${statusBadge}</td>
                <td>${tags}</td>
                <td>
                    <button class="btn btn-sm btn-outline-info me-1 view-lead-btn" data-lead-id="${lead.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-primary me-1 edit-lead-btn" data-lead-id="${lead.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-lead-btn" data-lead-id="${lead.id}" data-name="${lead.name}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            `;
            
            // Adiciona event listeners
            const checkbox = row.querySelector('.lead-select');
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    this.selectedLeads.add(lead.id);
                } else {
                    this.selectedLeads.delete(lead.id);
                }
                
                this.updateBulkDeleteButton();
            });
            
            const viewBtn = row.querySelector('.view-lead-btn');
            viewBtn.addEventListener('click', () => this.showLeadDetails(lead.id));
            
            const editBtn = row.querySelector('.edit-lead-btn');
            editBtn.addEventListener('click', () => this.showEditLeadModal(lead.id));
            
            const deleteBtn = row.querySelector('.delete-lead-btn');
            deleteBtn.addEventListener('click', () => this.showDeleteLeadModal(lead.id, lead.name));
            
            this.leadsTableBody.appendChild(row);
        });
    }
    
    /**
     * Renderiza a paginação
     */
    renderPagination() {
        // Limpa a paginação
        this.leadsPagination.innerHTML = '';
        
        // Se houver apenas uma página, não exibe a paginação
        if (this.totalPages <= 1) {
            return;
        }
        
        // Botão "Anterior"
        const prevLi = document.createElement('li');
        prevLi.className = 'page-item' + (this.currentPage === 1 ? ' disabled' : '');
        
        const prevButton = document.createElement('button');
        prevButton.className = 'page-link';
        prevButton.innerHTML = '&laquo;';
        prevButton.addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.filterAndRenderLeads();
            }
        });
        
        prevLi.appendChild(prevButton);
        this.leadsPagination.appendChild(prevLi);
        
        // Limite de páginas mostradas
        const maxPages = 5;
        const startPage = Math.max(1, Math.min(this.currentPage - Math.floor(maxPages / 2), this.totalPages - maxPages + 1));
        const endPage = Math.min(startPage + maxPages - 1, this.totalPages);
        
        // Links para páginas
        for (let i = startPage; i <= endPage; i++) {
            const pageLi = document.createElement('li');
            pageLi.className = 'page-item' + (i === this.currentPage ? ' active' : '');
            
            const pageButton = document.createElement('button');
            pageButton.className = 'page-link';
            pageButton.textContent = i;
            pageButton.addEventListener('click', () => {
                this.currentPage = i;
                this.filterAndRenderLeads();
            });
            
            pageLi.appendChild(pageButton);
            this.leadsPagination.appendChild(pageLi);
        }
        
        // Botão "Próximo"
        const nextLi = document.createElement('li');
        nextLi.className = 'page-item' + (this.currentPage === this.totalPages ? ' disabled' : '');
        
        const nextButton = document.createElement('button');
        nextButton.className = 'page-link';
        nextButton.innerHTML = '&raquo;';
        nextButton.addEventListener('click', () => {
            if (this.currentPage < this.totalPages) {
                this.currentPage++;
                this.filterAndRenderLeads();
            }
        });
        
        nextLi.appendChild(nextButton);
        this.leadsPagination.appendChild(nextLi);
    }
    
    /**
     * Seleciona uma empresa e filtra projetos por ela
     * @param {string|null} companyId ID da empresa ou null para todas
     */
    selectCompany(companyId) {
        this.currentCompanyId = companyId;
        
        // Atualizar visuais dos cards de empresas
        const companyCards = this.companiesList.querySelectorAll('.company-card');
        companyCards.forEach(card => {
            const cardCompanyId = card.getAttribute('data-company-id');
            
            if ((cardCompanyId === 'all' && companyId === null) || 
                (cardCompanyId === companyId)) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });
        
        // Atualizar nome da empresa selecionada
        if (companyId) {
            const company = this.companies.find(c => c.id === companyId);
            if (company) {
                this.selectedCompanyName.textContent = company.name;
            }
        } else {
            this.selectedCompanyName.textContent = 'Todos';
        }
        
        // Carregar projetos filtrados
        this.loadProjects(companyId);
    }
    
    /**
     * Mostra a seção de projetos (esconde a seção de leads)
     */
    showProjectsSection() {
        this.projectsSection.classList.remove('d-none');
        this.leadsDetailSection.classList.add('d-none');
    }
    
    /**
     * Mostra a seção de detalhes de leads (esconde a seção de projetos)
     */
    showLeadsDetailSection() {
        this.projectsSection.classList.add('d-none');
        this.leadsDetailSection.classList.remove('d-none');
    }
    
    /**
     * Mostra o modal para criar um novo lead
     */
    showCreateLeadModal() {
        // Reseta o formulário
        this.resetLeadForm();
        
        // Configura o projeto selecionado
        this.leadProjectIdInput.value = this.currentProjectId;
        
        // Configura status inicial
        this.leadStatusInput.value = 'novo';
        
        // Configura o modal
        document.getElementById('leadModalLabel').textContent = 'Novo Lead';
        
        // Mostra o modal
        this.leadModal.show();
    }
    
    /**
     * Mostra o modal para editar um lead existente
     * @param {string} leadId ID do lead
     */
    async showEditLeadModal(leadId) {
        // Busca o lead
        const lead = this.leads.find(l => l.id === leadId);
        
        if (!lead) {
            this.showAlert('error', 'Lead não encontrado');
            return;
        }
        
        // Preenche o formulário
        this.leadIdInput.value = lead.id;
        this.leadProjectIdInput.value = this.currentProjectId;
        this.leadNameInput.value = lead.name || '';
        this.leadEmailInput.value = lead.email || '';
        this.leadPhoneInput.value = lead.phone || '';
        this.leadStatusInput.value = lead.status || 'novo';
        this.leadNotesInput.value = lead.notes || '';
        
        // Preenche os campos de UTM
        this.leadUtmSourceInput.value = lead.utm_source || '';
        this.leadUtmMediumInput.value = lead.utm_medium || '';
        this.leadUtmCampaignInput.value = lead.utm_campaign || '';
        this.leadUtmTermInput.value = lead.utm_term || '';
        this.leadUtmContentInput.value = lead.utm_content || '';
        
        // Configura o modal
        document.getElementById('leadModalLabel').textContent = 'Editar Lead';
        
        // Salva o ID do lead atual
        this.currentLeadId = leadId;
        
        // Mostra o modal
        this.leadModal.show();
    }
    
    /**
     * Mostra os detalhes de um lead
     * @param {string} leadId ID do lead
     */
    showLeadDetails(leadId) {
        // Busca o lead
        const lead = this.leads.find(l => l.id === leadId);
        
        if (!lead) {
            this.showAlert('error', 'Lead não encontrado');
            return;
        }
        
        // Preenche os campos de detalhes
        this.detailLeadName.textContent = lead.name || '-';
        this.detailLeadEmail.textContent = lead.email || '-';
        this.detailLeadPhone.textContent = this.formatPhone(lead.phone) || '-';
        
        // Status com formatação
        const statusBadge = `<span class="badge ${this.getStatusClass(lead.status)}">${this.formatStatus(lead.status)}</span>`;
        this.detailLeadStatus.innerHTML = statusBadge;
        
        // Observações
        this.detailLeadNotes.textContent = lead.notes || '-';
        
        // UTMs
        this.detailLeadUtmSource.textContent = lead.utm_source || '-';
        this.detailLeadUtmMedium.textContent = lead.utm_medium || '-';
        this.detailLeadUtmCampaign.textContent = lead.utm_campaign || '-';
        
        // Origem do lead
        let origin = '-';
        if (lead.utm_source && lead.utm_medium) {
            origin = `${lead.utm_source} / ${lead.utm_medium}`;
            if (lead.utm_campaign) {
                origin += ` / ${lead.utm_campaign}`;
            }
        }
        this.detailLeadOrigin.textContent = origin;
        
        // Data de criação
        const createdDate = new Date(lead.created_at);
        this.detailLeadCreatedAt.textContent = createdDate.toLocaleDateString('pt-BR') + ' ' + createdDate.toLocaleTimeString('pt-BR');
        
        // Salva o ID do lead atual
        this.currentLeadId = leadId;
        
        // Mostra o modal
        this.leadDetailsModal.show();
    }
    
    /**
     * Mostra o modal para confirmar a exclusão de um lead
     * @param {string} leadId ID do lead
     * @param {string} leadName Nome do lead
     */
    showDeleteLeadModal(leadId, leadName) {
        // Preenche o modal
        this.deleteLeadName.textContent = leadName;
        
        // Salva o ID do lead atual
        this.currentLeadId = leadId;
        
        // Mostra o modal
        this.deleteLeadModal.show();
    }
    
    /**
     * Salva um lead (cria novo ou atualiza existente)
     */
    async saveLead() {
        try {
            // Valida o formulário
            if (!this.leadNameInput.value.trim()) {
                this.showAlert('error', 'O nome do lead é obrigatório', true);
                return;
            }
            
            if (!this.leadEmailInput.value.trim()) {
                this.showAlert('error', 'O e-mail do lead é obrigatório', true);
                return;
            }
            
            if (!this.leadPhoneInput.value.trim()) {
                this.showAlert('error', 'O telefone do lead é obrigatório', true);
                return;
            }
            
            if (!this.leadProjectIdInput.value) {
                this.showAlert('error', 'O projeto do lead é obrigatório', true);
                return;
            }
            
            // Desabilita o botão durante o processamento
            this.saveLeadBtn.disabled = true;
            this.saveLeadBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Salvando...';
            
            // Obter o token de autenticação
            const session = await authService.getSession();
            
            if (!session) {
                throw new Error('Você precisa estar autenticado para gerenciar leads.');
            }
            
            // Prepara os dados do lead
            const leadData = {
                project_id: this.leadProjectIdInput.value,
                name: this.leadNameInput.value.trim(),
                email: this.leadEmailInput.value.trim(),
                phone: this.leadPhoneInput.value.trim().replace(/\D/g, ''), // Remove caracteres não numéricos
                status: this.leadStatusInput.value,
                notes: this.leadNotesInput.value.trim() || null
            };
            
            // Adiciona UTMs se preenchidos
            if (this.leadUtmSourceInput.value.trim()) {
                leadData.utm_source = this.leadUtmSourceInput.value.trim();
            }
            
            if (this.leadUtmMediumInput.value.trim()) {
                leadData.utm_medium = this.leadUtmMediumInput.value.trim();
            }
            
            if (this.leadUtmCampaignInput.value.trim()) {
                leadData.utm_campaign = this.leadUtmCampaignInput.value.trim();
            }
            
            if (this.leadUtmTermInput.value.trim()) {
                leadData.utm_term = this.leadUtmTermInput.value.trim();
            }
            
            if (this.leadUtmContentInput.value.trim()) {
                leadData.utm_content = this.leadUtmContentInput.value.trim();
            }
            
            // Determina se é uma criação ou atualização
            const isEditing = !!this.leadIdInput.value;
            const method = isEditing ? 'PUT' : 'POST';
            const url = isEditing 
                ? `${this.leadsApiUrl}/${this.leadIdInput.value}/status` 
                : this.leadsApiUrl;
            
            // Caso seja uma atualização, ajusta os dados enviados
            const requestData = isEditing 
                ? { status: leadData.status, notes: leadData.notes } 
                : leadData;
            
            // Prepara os headers
            const headers = await this.getAuthHeaders(session);
            headers['Content-Type'] = 'application/json';
            
            // Faz a requisição para a API
            const response = await fetch(url, {
                method: method,
                headers: headers,
                body: JSON.stringify(requestData)
            });
            
            // Ler resposta conforme o tipo de conteúdo
            const contentType = response.headers.get('content-type') || '';
            let data;
            if (contentType.includes('application/json')) {
                data = await response.json();
            } else {
                // Se não for JSON, mostrar texto bruto para depuração
                const text = await response.text();
                console.error('Resposta não-JSON ao salvar lead:', text);
                throw new Error('Resposta inválida do servidor');
            }
            
            // Verificar sucesso HTTP
            if (!response.ok) {
                const message = data.error?.message || data.error || 'Erro ao salvar lead';
                throw new Error(message);
            }
            
            // Fecha o modal
            this.leadModal.hide();
            
            // Recarrega os leads
            this.loadLeads(this.currentProjectId);
            
            // Mostra mensagem de sucesso
            this.showAlert('success', isEditing ? 'Lead atualizado com sucesso!' : 'Lead criado com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar lead:', error);
            this.showAlert('error', `Erro ao salvar lead: ${error.message}`, true);
        } finally {
            // Restaura o botão
            this.saveLeadBtn.disabled = false;
            this.saveLeadBtn.textContent = 'Salvar';
        }
    }
    
    /**
     * Exclui um lead
     */
    async deleteLead() {
        try {
            if (!this.currentLeadId) {
                this.showAlert('error', 'ID do lead não fornecido');
                return;
            }
            
            // Desabilita o botão durante o processamento
            this.confirmDeleteLeadBtn.disabled = true;
            this.confirmDeleteLeadBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Excluindo...';
            
            // Obter o token de autenticação
            const session = await authService.getSession();
            
            if (!session) {
                throw new Error('Você precisa estar autenticado para gerenciar leads.');
            }
            
            // Prepara os headers
            const headers = await this.getAuthHeaders(session);
            
            // Na verdade, faremos uma atualização de status
            const url = `${this.leadsApiUrl}/${this.currentLeadId}/status`;
            
            // Faz a requisição para a API
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    ...headers,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: 'inativo',
                    notes: 'Lead excluído manualmente.'
                })
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Erro ao excluir lead');
            }
            
            // Fecha o modal
            this.deleteLeadModal.hide();
            
            // Recarrega os leads
            this.loadLeads(this.currentProjectId);
            
            // Mostra mensagem de sucesso
            this.showAlert('success', 'Lead excluído com sucesso!');
        } catch (error) {
            console.error('Erro ao excluir lead:', error);
            this.showAlert('error', `Erro ao excluir lead: ${error.message}`);
        } finally {
            // Restaura o botão
            this.confirmDeleteLeadBtn.disabled = false;
            this.confirmDeleteLeadBtn.textContent = 'Excluir';
        }
    }
    
    /**
     * Exclui vários leads de uma vez
     */
    async deleteBulkLeads() {
        try {
            if (this.selectedLeads.size === 0) {
                this.showAlert('error', 'Nenhum lead selecionado');
                return;
            }
            
            // Desabilita o botão durante o processamento
            this.confirmBulkDeleteBtn.disabled = true;
            this.confirmBulkDeleteBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Excluindo...';
            
            // Obter o token de autenticação
            const session = await authService.getSession();
            
            if (!session) {
                throw new Error('Você precisa estar autenticado para gerenciar leads.');
            }
            
            // Prepara os headers
            const headers = await this.getAuthHeaders(session);
            
            // Exclusão em lote (atualizando um por um)
            const promises = Array.from(this.selectedLeads).map(leadId => {
                const url = `${this.leadsApiUrl}/${leadId}/status`;
                
                return fetch(url, {
                    method: 'PUT',
                    headers: {
                        ...headers,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        status: 'inativo',
                        notes: 'Lead excluído em massa.'
                    })
                });
            });
            
            // Aguarda todas as requisições terminarem
            await Promise.all(promises);
            
            // Fecha o modal
            this.bulkDeleteModal.hide();
            
            // Recarrega os leads
            this.loadLeads(this.currentProjectId);
            
            // Mostra mensagem de sucesso
            this.showAlert('success', `${this.selectedLeads.size} leads excluídos com sucesso!`);
            
            // Limpa a seleção
            this.selectedLeads.clear();
            this.updateBulkDeleteButton();
        } catch (error) {
            console.error('Erro ao excluir leads em massa:', error);
            this.showAlert('error', `Erro ao excluir leads: ${error.message}`);
        } finally {
            // Restaura o botão
            this.confirmBulkDeleteBtn.disabled = false;
            this.confirmBulkDeleteBtn.textContent = 'Excluir Todos';
        }
    }
    
    /**
     * Exporta os leads para um arquivo CSV
     */
    exportLeadsToCSV() {
        try {
            // Se não houver leads, mostra mensagem
            if (this.leads.length === 0) {
                this.showAlert('error', 'Não há leads para exportar');
                return;
            }
            
            // Cabeçalhos do CSV
            const headers = [
                'Nome', 
                'Email', 
                'Telefone', 
                'Status', 
                'Observações', 
                'UTM Source', 
                'UTM Medium', 
                'UTM Campaign',
                'UTM Term',
                'UTM Content',
                'Data de Criação'
            ];
            
            // Linhas do CSV
            const rows = this.leads.map(lead => [
                lead.name || '',
                lead.email || '',
                this.formatPhone(lead.phone) || '',
                this.formatStatus(lead.status) || '',
                lead.notes || '',
                lead.utm_source || '',
                lead.utm_medium || '',
                lead.utm_campaign || '',
                lead.utm_term || '',
                lead.utm_content || '',
                new Date(lead.created_at).toLocaleString('pt-BR')
            ]);
            
            // Junta tudo em uma string CSV
            let csvContent = [
                headers.join(','),
                ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
            ].join('\n');
            
            // Cria blob e link para download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            
            // Projeto atual
            const project = this.projects.find(p => p.id === this.currentProjectId);
            const projectName = project ? project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'leads';
            
            // Data atual
            const today = new Date();
            const dateStr = today.toISOString().split('T')[0];
            
            link.setAttribute('href', url);
            link.setAttribute('download', `${projectName}_leads_${dateStr}.csv`);
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.showAlert('success', 'Leads exportados com sucesso!');
        } catch (error) {
            console.error('Erro ao exportar leads:', error);
            this.showAlert('error', `Erro ao exportar leads: ${error.message}`);
        }
    }
    
    /**
     * Atualiza o botão de exclusão em massa
     */
    updateBulkDeleteButton() {
        if (this.selectedLeads.size > 0) {
            this.deleteSelectedLeadsBtn.classList.remove('d-none');
            this.deleteSelectedLeadsBtn.textContent = `Excluir Selecionados (${this.selectedLeads.size})`;
        } else {
            this.deleteSelectedLeadsBtn.classList.add('d-none');
        }
    }
    
    /**
     * Reseta o formulário de lead
     */
    resetLeadForm() {
        this.leadForm.reset();
        this.leadIdInput.value = '';
        this.currentLeadId = null;
    }
    
    /**
     * Obtém os headers para autenticação
     * @param {Object} session Sessão atual do usuário
     * @returns {Object} Headers para requisição
     */
    async getAuthHeaders(session) {
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
        
        return headers;
    }
    
    /**
     * Formata o status para exibição
     * @param {string} status Status do lead
     * @returns {string} Status formatado
     */
    formatStatus(status) {
        const statusMap = {
            'novo': 'Novo',
            'qualificado': 'Qualificado',
            'contatado': 'Contatado',
            'convertido': 'Convertido',
            'desistiu': 'Desistiu',
            'inativo': 'Inativo'
        };
        
        return statusMap[status] || status;
    }
    
    /**
     * Obtém a classe CSS para o status
     * @param {string} status Status do lead
     * @returns {string} Classe CSS
     */
    getStatusClass(status) {
        const statusClasses = {
            'novo': 'bg-info',
            'qualificado': 'bg-primary',
            'contatado': 'bg-warning',
            'convertido': 'bg-success',
            'desistiu': 'bg-danger',
            'inativo': 'bg-secondary'
        };
        
        return statusClasses[status] || 'bg-secondary';
    }
    
    /**
     * Formata um número de telefone
     * @param {string} phone Número de telefone
     * @returns {string} Telefone formatado
     */
    formatPhone(phone) {
        if (!phone) return '';
        
        // Remove caracteres não numéricos
        const numbers = phone.replace(/\D/g, '');
        
        // Formatos possíveis
        if (numbers.length === 11) { // Celular com DDD (11 dígitos)
            return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
        } else if (numbers.length === 10) { // Fixo com DDD (10 dígitos)
            return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
        } else if (numbers.length === 9) { // Celular sem DDD (9 dígitos)
            return `${numbers.slice(0, 5)}-${numbers.slice(5)}`;
        } else if (numbers.length === 8) { // Fixo sem DDD (8 dígitos)
            return `${numbers.slice(0, 4)}-${numbers.slice(4)}`;
        }
        
        // Se não se encaixar em nenhum padrão, retorna o original
        return phone;
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
            this.leadsAlert;
        
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
            this.leadForm.before(alertElement);
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
     * Função debounce para evitar execuções repetidas
     * @param {Function} func Função a ser executada
     * @param {number} wait Tempo de espera em ms
     * @returns {Function} Função com debounce
     */
    debounce(func, wait) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                func.apply(context, args);
            }, wait);
        };
    }
    
    /* Estados de visualização */
    
    // Estado principal
    showLoading() {
        this.leadsLoading.classList.remove('d-none');
    }
    
    hideLoading() {
        this.leadsLoading.classList.add('d-none');
    }
    
    // Empresas
    showCompaniesLoading() {
        this.companiesLoading.classList.remove('d-none');
        this.companiesEmpty.classList.add('d-none');
        this.companiesList.classList.add('d-none');
    }
    
    showCompaniesEmpty() {
        this.companiesLoading.classList.add('d-none');
        this.companiesEmpty.classList.remove('d-none');
        this.companiesList.classList.add('d-none');
    }
    
    showCompaniesList() {
        this.companiesLoading.classList.add('d-none');
        this.companiesEmpty.classList.add('d-none');
        this.companiesList.classList.remove('d-none');
    }
    
    // Projetos
    showProjectsLoading() {
        this.projectsLoading.classList.remove('d-none');
        this.projectsEmpty.classList.add('d-none');
        this.projectsList.classList.add('d-none');
    }
    
    showProjectsEmpty() {
        this.projectsLoading.classList.add('d-none');
        this.projectsEmpty.classList.remove('d-none');
        this.projectsList.classList.add('d-none');
    }
    
    showProjectsList() {
        this.projectsLoading.classList.add('d-none');
        this.projectsEmpty.classList.add('d-none');
        this.projectsList.classList.remove('d-none');
    }
    
    // Tabela de leads
    showLeadsTableLoading() {
        this.leadsTableLoading.classList.remove('d-none');
        this.leadsTableEmpty.classList.add('d-none');
        this.leadsTableContainer.classList.add('d-none');
    }
    
    showLeadsTableEmpty() {
        this.leadsTableLoading.classList.add('d-none');
        this.leadsTableEmpty.classList.remove('d-none');
        this.leadsTableContainer.classList.add('d-none');
    }
    
    showLeadsTable() {
        this.leadsTableLoading.classList.add('d-none');
        this.leadsTableEmpty.classList.add('d-none');
        this.leadsTableContainer.classList.remove('d-none');
    }
}

export default LeadsManager;