/**
 * Gerenciador de Eventos de Leads
 * Este módulo é responsável por gerenciar eventos associados a leads, como interações, mensagens e outras atividades.
 */

class LeadEventsManager {
    constructor() {
        // Configuração de API
        this.isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        this.apiBaseUrl = this.isLocalhost ? 'http://localhost:9032/api' : '/api';
        // API V1 (antiga)
        this.apiBaseUrlV1 = this.isLocalhost ? 'http://localhost:9030/api/v1' : '/api/v1';
        this.leadEventsApiUrl = `${this.apiBaseUrlV1}/leads`;
        
        // Tipo de visualização: 'modal' ou 'card'
        this.viewType = 'card';
        
        console.log('[LeadEvents] Inicializando gerenciador de eventos');
        console.log('[LeadEvents] API principal:', this.apiBaseUrl);
        console.log('[LeadEvents] API V1:', this.apiBaseUrlV1);
        
        // Inicializar elementos DOM
        this.initDOMElements();
    }
    
    /**
     * Inicializa os elementos DOM
     * Este método é chamado no construtor e quando o modal é exibido
     */
    initDOMElements() {
        if (this.viewType === 'modal') {
            // Elementos DOM do modal
            this.containerElement = document.getElementById('lead-events-container');
            this.tableBodyElement = document.getElementById('lead-events-table-body');
            this.loadingElement = document.getElementById('lead-events-loading');
            this.emptyElement = document.getElementById('lead-events-empty');
        } else {
            // Elementos DOM do card
            this.containerElement = document.getElementById('card-lead-events-container');
            this.tableBodyElement = document.getElementById('card-lead-events-table-body');
            this.loadingElement = document.getElementById('card-lead-events-loading');
            this.emptyElement = document.getElementById('card-lead-events-empty');
        }
        
        // Verificando se os elementos foram encontrados
        console.log('[LeadEvents] DOM elements: ', {
            container: !!this.containerElement,
            tableBody: !!this.tableBodyElement,
            loading: !!this.loadingElement,
            empty: !!this.emptyElement
        });
    }
    
    /**
     * Define o tipo de visualização (modal ou card)
     */
    setViewType(type) {
        this.viewType = type;
        this.initDOMElements();
    }
    
    /**
     * Carrega os eventos de um lead específico
     * @param {string} leadId ID do lead
     */
    async loadLeadEvents(leadId, authHeaders) {
        try {
            console.log('[LeadEvents] Carregando eventos para o lead:', leadId);
            this.showLoading();
            
            if (!leadId) {
                console.warn('[LeadEvents] ID do lead não fornecido');
                this.showEmpty();
                return;
            }
            
            // Utiliza o endpoint dedicado para eventos de leads
            const url = `${this.apiBaseUrl}/leads/${leadId}/events-list`;
            console.log('[LeadEvents] Requisitando URL:', url);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: authHeaders
            });
            
            console.log('[LeadEvents] Resposta da API:', response.status, response.statusText);
            
            if (!response.ok) {
                // Se o endpoint não existir (404), tenta o endpoint antigo como fallback
                if (response.status === 404) {
                    console.warn('[LeadEvents] API dedicada de eventos não encontrada, tentando endpoint antigo');
                    return this.loadLeadEventsLegacy(leadId, authHeaders);
                }
                
                const errorData = await response.json();
                console.error('[LeadEvents] Erro da API:', errorData);
                throw new Error(errorData.error || 'Erro ao carregar eventos do lead');
            }
            
            const data = await response.json();
            console.log('[LeadEvents] Dados recebidos:', data);
            
            // Extrai os eventos da resposta - formato: { success: true, data: { lead_id, events, count } }
            let events = [];
            
            // Processamento específico para o formato da resposta do novo endpoint
            if (data.success && data.data && data.data.events) {
                console.log('[LeadEvents] Usando formato do novo endpoint dedicado');
                events = data.data.events;
                
                if (events.length === 0) {
                    console.log('[LeadEvents] Nenhum evento encontrado para o lead');
                    this.showEmpty();
                    return [];
                }
                
                console.log(`[LeadEvents] ${events.length} eventos encontrados para o lead`);
            } 
            // Processamento para formatos alternativos (manter compatibilidade)
            else if (data.data && data.data.events) {
                events = data.data.events;
            } else if (data.events) {
                events = data.events;
            } else if (Array.isArray(data)) {
                events = data;
            } else if (typeof data === 'object' && data !== null) {
                // Tenta extrair eventos de outras propriedades do objeto
                events = Object.values(data)
                    .filter(item => typeof item === 'object' && item !== null && !Array.isArray(item))
                    .flatMap(item => Array.isArray(item) ? item : [item]);
            }
            
            // Renderiza os eventos
            this.renderLeadEvents(events);
            
            return events;
        } catch (error) {
            console.error('[LeadEvents] Erro ao carregar eventos do lead:', error);
            this.showEmpty();
            return [];
        }
    }
    
    /**
     * Método legacy para carregar eventos (fallback)
     * @param {string} leadId ID do lead
     * @private
     */
    async loadLeadEventsLegacy(leadId, authHeaders) {
        try {
            console.log('[LeadEvents] Usando endpoint legacy para eventos');
            
            // Faz a requisição para a API legacy
            const url = `${this.leadEventsApiUrl}/${leadId}/events`;
            console.log('[LeadEvents] Requisitando URL legacy:', url);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: authHeaders
            });
            
            console.log('[LeadEvents] Resposta da API legacy:', response.status, response.statusText);
            
            if (!response.ok) {
                // Se o endpoint não existir (404), mostra uma mensagem vazia em vez de erro
                if (response.status === 404) {
                    console.warn('[LeadEvents] API de eventos de leads não encontrada');
                    this.showEmpty();
                    return [];
                }
                
                const errorData = await response.json();
                console.error('[LeadEvents] Erro da API legacy:', errorData);
                throw new Error(errorData.error || 'Erro ao carregar eventos do lead');
            }
            
            const data = await response.json();
            console.log('[LeadEvents] Dados recebidos do endpoint legacy:', data);
            
            // Verificar o formato dos dados retornados
            let events = [];
            if (data.events) {
                events = data.events;
            } else if (Array.isArray(data)) {
                events = data;
            } else if (typeof data === 'object' && data !== null) {
                events = Object.values(data).filter(item => typeof item === 'object' && item !== null);
            }
            
            // Renderiza os eventos
            this.renderLeadEvents(events);
            
            return events;
        } catch (error) {
            console.error('[LeadEvents] Erro ao carregar eventos legacy do lead:', error);
            this.showEmpty();
            return [];
        }
    }
    
    /**
     * Renderiza a lista de eventos do lead
     * @param {Array} events Lista de eventos
     */
    renderLeadEvents(events) {
        if (!events || events.length === 0) {
            this.showEmpty();
            return;
        }
        
        // Limpa a tabela
        this.tableBodyElement.innerHTML = '';
        
        // Ordena eventos por data de criação (mais recentes primeiro)
        const sortedEvents = [...events].sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
        );
        
        // Adiciona cada evento à tabela
        sortedEvents.forEach(event => {
            const row = document.createElement('tr');
            
            // Formata a data
            const eventDate = new Date(event.created_at);
            const formattedDate = this.formatDate(eventDate);
            
            // Formata o tipo de evento
            const eventType = this.formatEventType(event.event_type);
            
            // Origem do evento
            const origin = event.origin || '-';
            
            // Detalhes do evento
            let details = '-';
            if (event.event_data && Object.keys(event.event_data).length > 0) {
                // Verifica diferentes possíveis campos para extrair o texto principal do evento
                if (event.event_data.text) {
                    details = this.truncateText(event.event_data.text, 50);
                } else if (event.event_data.message) {
                    details = this.truncateText(event.event_data.message, 50);
                } else if (event.event_data.description) {
                    details = this.truncateText(event.event_data.description, 50);
                } else if (event.event_data.content) {
                    details = this.truncateText(event.event_data.content, 50);
                } else if (event.event_data.summary) {
                    details = this.truncateText(event.event_data.summary, 50);
                } else if (event.event_data.action) {
                    // Para eventos de mudança de status ou ações específicas
                    const action = event.event_data.action;
                    const oldValue = event.event_data.old_value || event.event_data.from;
                    const newValue = event.event_data.new_value || event.event_data.to;
                    
                    if (oldValue && newValue) {
                        details = `${action}: ${oldValue} → ${newValue}`;
                    } else {
                        details = `${action}`;
                    }
                } else {
                    // Para outros formatos, tenta uma representação mais limpa
                    const eventDataStr = JSON.stringify(event.event_data)
                        .replace(/[{}"]/g, '')
                        .replace(/,/g, ', ')
                        .replace(/:/g, ': ');
                    
                    details = this.truncateText(eventDataStr, 50);
                }
            }
            
            row.innerHTML = `
                <td><small>${formattedDate}</small></td>
                <td><span class="badge ${this.getEventTypeClass(event.event_type)}">${eventType}</span></td>
                <td><small>${origin}</small></td>
                <td><small data-bs-toggle="tooltip" title="${details}">${details}</small></td>
            `;
            
            // Adiciona evento para mostrar tooltip com detalhes completos ao passar o mouse
            const detailsElement = row.querySelector('td:last-child small');
            if (detailsElement && details !== '-') {
                try {
                    new bootstrap.Tooltip(detailsElement);
                } catch (e) {
                    console.warn('[LeadEvents] Erro ao inicializar tooltip:', e);
                }
            }
            
            this.tableBodyElement.appendChild(row);
        });
        
        // Mostra a tabela
        this.showTable();
    }
    
    /**
     * Formata o tipo de evento para exibição
     * @param {string} eventType Tipo do evento
     * @returns {string} Tipo formatado
     */
    formatEventType(eventType) {
        if (!eventType) return 'Desconhecido';
        
        const typeMap = {
            'whatsapp_message': 'WhatsApp',
            'email_sent': 'Email',
            'email_opened': 'Email Aberto',
            'email_clicked': 'Email Clicado',
            'form_submit': 'Formulário',
            'page_view': 'Visualização',
            'click': 'Clique',
            'conversion': 'Conversão',
            'status_change': 'Mudança de Status',
            'note_added': 'Nota Adicionada',
            'resposta_formulario': 'Resposta de Formulário',
            'make_integration': 'Integração Make',
            'api_event': 'Evento API',
            'webhook': 'Webhook',
            'crm_sync': 'Sincronização CRM',
            'lead_capture': 'Captura de Lead',
            'lead_update': 'Atualização de Lead'
        };
        
        // Se o tipo não estiver no mapa, tenta formatar automaticamente
        // Por exemplo: "resposta_formulario" → "Resposta Formulario"
        if (!typeMap[eventType]) {
            return eventType
                .split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        }
        
        return typeMap[eventType];
    }
    
    /**
     * Obtém a classe CSS para o tipo de evento
     * @param {string} eventType Tipo do evento
     * @returns {string} Classe CSS
     */
    getEventTypeClass(eventType) {
        if (!eventType) return 'bg-secondary';
        
        const classMap = {
            'whatsapp_message': 'bg-success',
            'email_sent': 'bg-primary',
            'email_opened': 'bg-info',
            'email_clicked': 'bg-primary',
            'form_submit': 'bg-warning',
            'page_view': 'bg-secondary',
            'click': 'bg-secondary',
            'conversion': 'bg-success',
            'status_change': 'bg-info',
            'note_added': 'bg-light text-dark',
            'resposta_formulario': 'bg-warning',
            'make_integration': 'bg-info',
            'api_event': 'bg-dark',
            'webhook': 'bg-primary',
            'crm_sync': 'bg-info',
            'lead_capture': 'bg-success',
            'lead_update': 'bg-primary'
        };
        
        return classMap[eventType] || 'bg-secondary';
    }
    
    /**
     * Formata uma data para exibição
     * @param {Date} date Data
     * @returns {string} Data formatada
     */
    formatDate(date) {
        if (!date) return '-';
        
        return date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    /**
     * Trunca um texto para o tamanho máximo
     * @param {string} text Texto
     * @param {number} maxLength Tamanho máximo
     * @returns {string} Texto truncado
     */
    truncateText(text, maxLength = 50) {
        if (!text) return '-';
        
        if (text.length <= maxLength) {
            return text;
        }
        
        return text.substring(0, maxLength) + '...';
    }
    
    /* Estados de visualização */
    
    /**
     * Mostra o indicador de carregamento
     */
    showLoading() {
        if (this.loadingElement) this.loadingElement.classList.remove('d-none');
        if (this.containerElement) this.containerElement.classList.add('d-none');
        if (this.emptyElement) this.emptyElement.classList.add('d-none');
    }
    
    /**
     * Mostra a mensagem de nenhum evento
     */
    showEmpty() {
        if (this.loadingElement) this.loadingElement.classList.add('d-none');
        if (this.containerElement) this.containerElement.classList.add('d-none');
        if (this.emptyElement) this.emptyElement.classList.remove('d-none');
    }
    
    /**
     * Mostra a tabela de eventos
     */
    showTable() {
        if (this.loadingElement) this.loadingElement.classList.add('d-none');
        if (this.containerElement) this.containerElement.classList.remove('d-none');
        if (this.emptyElement) this.emptyElement.classList.add('d-none');
    }
}

export default LeadEventsManager;