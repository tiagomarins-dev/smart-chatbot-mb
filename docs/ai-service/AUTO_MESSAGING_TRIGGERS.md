# Gatilhos para Mensagens Automáticas

Este documento complementa o sistema de mensagens automáticas, detalhando os dois principais mecanismos de disparo: **baseado em eventos** e **baseado em inatividade**.

## 1. Mensagens Baseadas em Eventos

As mensagens baseadas em eventos são disparadas quando ocorrem ações ou interações específicas, exigindo resposta contextualizada imediata.

### Tipos de Eventos e Respostas

| Evento | Descrição | Exemplo de Mensagem | Considerações |
|--------|-----------|---------------------|---------------|
| **carrinho_abandonado** | Lead adicionou itens ao carrinho mas não finalizou compra | "Olá [Nome], notamos que você deixou alguns itens no carrinho. O [Produto] ainda está reservado para você. Podemos ajudar com alguma dúvida sobre as condições de pagamento?" | - Enviar após 1-3 horas<br>- Incluir link direto para retomar<br>- Considerar oferta especial para leads com score alto |
| **visualizou_propriedade** | Lead visualizou detalhes específicos de uma propriedade | "Olá [Nome], vi que você demonstrou interesse no [Propriedade]. Este imóvel possui [Características Relevantes] que combinam com o que você procura. Posso enviar mais informações ou agendar uma visita?" | - Personalizar com detalhes da propriedade<br>- Adaptar tom ao status do lead |
| **solicitou_informacoes** | Lead preencheu formulário solicitando mais informações | "Olá [Nome], recebi sua solicitação sobre [Tópico]. [Resposta Personalizada]. Existe algo específico que gostaria de saber sobre isso?" | - Responder em até 15 minutos<br>- Fornecer informação específica e relevante |
| **visualizou_precos** | Lead acessou informações de preços/condições | "Olá [Nome], percebi que você consultou os valores do [Produto/Serviço]. Temos condições especiais de [Parcelamento/Financiamento] que podem ser interessantes para você. Posso detalhar as opções?" | - Adaptar conforme análise de sentimento<br>- Abordar diferentes para "achou caro" vs "interessado" |
| **conteudo_relacionado** | Lead consumiu conteúdo relacionado ao produto | "Olá [Nome], vi que você acessou nosso [Conteúdo]. Baseado nisso, acho que o [Produto/Solução] pode resolver exatamente o que você está buscando. Quer saber como?" | - Relacionar conteúdo com benefícios do produto<br>- Personalizar para fase do funil |
| **segunda_visita** | Lead retornou ao site/plataforma após primeira interação | "Que bom te ver novamente, [Nome]! Desde sua última visita, atualizamos [Novidades Relevantes]. Gostaria de conhecer mais?" | - Realçar o que mudou desde última visita<br>- Estimular progresso no funil |
| **lead_qualificado** | Lead atingiu pontuação de qualificação definida | "Olá [Nome], baseado em seu interesse em [Área de Interesse], preparamos uma proposta personalizada para suas necessidades. Podemos conversar sobre como [Benefício Principal] pode ajudar em seus objetivos?" | - Mensagem mais assertiva<br>- Incentivar próximo passo no funil |
| **desconto_temporario** | Promoção relevante para o perfil do lead | "Olá [Nome], por tempo limitado, estamos com condições especiais para o [Produto] que você demonstrou interesse: [Detalhes da Oferta]. Esta oferta é válida até [Data]." | - Criar senso de urgência<br>- Personalizar oferta ao perfil |

### Implementação do Sistema de Eventos

```javascript
// eventTriggerService.js
class EventTriggerService {
  constructor(aiService, whatsappService) {
    this.aiService = aiService;
    this.whatsappService = whatsappService;
    this.eventHandlers = this.registerEventHandlers();
  }
  
  registerEventHandlers() {
    return {
      'carrinho_abandonado': this.handleAbandonedCart.bind(this),
      'visualizou_propriedade': this.handlePropertyView.bind(this),
      'solicitou_informacoes': this.handleInfoRequest.bind(this),
      'visualizou_precos': this.handlePriceView.bind(this),
      'conteudo_relacionado': this.handleRelatedContent.bind(this),
      'segunda_visita': this.handleReturnVisit.bind(this),
      'lead_qualificado': this.handleQualifiedLead.bind(this),
      'desconto_temporario': this.handleTemporaryDiscount.bind(this)
    };
  }
  
  async processEvent(eventType, leadId, eventData) {
    try {
      // Verificar se existe handler para este evento
      if (!this.eventHandlers[eventType]) {
        console.warn(`Nenhum handler encontrado para evento: ${eventType}`);
        return { success: false, reason: 'event_type_not_supported' };
      }
      
      // Verificar regras de frequência e permissão de contato
      const canContact = await this.canContactLead(leadId);
      if (!canContact.allowed) {
        return { success: false, reason: canContact.reason };
      }
      
      // Processar o evento com o handler apropriado
      return await this.eventHandlers[eventType](leadId, eventData);
    } catch (error) {
      console.error(`Erro ao processar evento ${eventType}:`, error);
      return { success: false, error: error.message };
    }
  }
  
  async canContactLead(leadId) {
    // Buscar informações do lead incluindo histórico de contatos
    const lead = await this.fetchLeadData(leadId);
    
    // Verificar se lead optou por não receber mensagens
    if (lead.do_not_contact) {
      return { allowed: false, reason: 'lead_opted_out' };
    }
    
    // Verificar frequência de mensagens recentes
    const recentMessages = this.countRecentMessages(lead);
    if (recentMessages.last24h >= 2) {
      return { allowed: false, reason: 'frequency_limit_day' };
    }
    if (recentMessages.last7days >= 5) {
      return { allowed: false, reason: 'frequency_limit_week' };
    }
    
    // Verificar horário apropriado (evitar mensagens fora do horário comercial)
    if (!this.isBusinessHours()) {
      return { allowed: false, reason: 'outside_business_hours' };
    }
    
    return { allowed: true };
  }
  
  // Implementação de handlers específicos para cada evento
  async handleAbandonedCart(leadId, eventData) {
    const lead = await this.fetchLeadData(leadId);
    const cartItems = eventData.items || [];
    
    // Preparar contexto para IA gerar mensagem
    const context = {
      lead_info: {
        name: lead.name,
        sentiment_status: lead.sentiment_status,
        lead_score: lead.lead_score
      },
      event_type: 'carrinho_abandonado',
      event_data: {
        items: cartItems,
        total_value: eventData.total_value,
        abandoned_at: eventData.timestamp
      },
      message_purpose: 'Recuperar venda de carrinho abandonado',
      personalization_hints: []
    };
    
    // Personalizar abordagem com base no status de sentimento
    if (lead.sentiment_status === 'achou caro') {
      context.personalization_hints.push(
        'Enfatizar opções de pagamento e financiamento',
        'Mencionar garantia de menor preço se aplicável'
      );
    } else if (lead.sentiment_status === 'interessado') {
      context.personalization_hints.push(
        'Destacar benefícios e diferenciais do produto',
        'Criar senso de urgência positivo'
      );
    }
    
    // Obter mensagem personalizada via IA
    const message = await this.aiService.generateEventTriggeredMessage(context);
    
    // Enviar mensagem
    const sentMessage = await this.whatsappService.sendMessage(lead.phone, message);
    
    // Registrar atividade
    await this.recordAutomatedMessage(leadId, 'carrinho_abandonado', message, sentMessage.id);
    
    return { success: true, messageId: sentMessage.id };
  }
  
  // Outros handlers seguem padrão similar...
}
```

## 2. Mensagens Baseadas em Inatividade

As mensagens baseadas em inatividade são enviadas quando o lead não interage por um período determinado, buscando reengajar ou manter contato.

### Períodos de Inatividade e Abordagens

| Dias Inativo | Abordagem | Objetivo | Considerações |
|--------------|-----------|----------|---------------|
| **2-3 dias** | Lembrete suave | Manter o lead engajado no ciclo de vendas | - Mais frequente para leads "interessado"<br>- Referência a última interação<br>- Tom consultivo |
| **7 dias** | Reengajamento com valor | Recuperar atenção com informação relevante | - Compartilhar conteúdo ou informação útil<br>- Questão aberta para estimular resposta |
| **15 dias** | Oferta específica | Incentivar tomada de ação | - Oferta personalizada baseada no histórico<br>- Senso de exclusividade |
| **30 dias** | Última tentativa | Verificar se ainda há interesse | - Abordagem direta sobre interesse<br>- Oferta de descadastramento educado |

### Exemplos de Mensagens por Tipo de Lead e Período

#### Para Lead "Interessado" após 3 dias:
```
Olá [Nome], notei que conversamos sobre [Tópico/Produto] há alguns dias. Surgiu alguma nova dúvida ou posso ajudar com mais informações para sua decisão? Estou disponível quando precisar.
```

#### Para Lead "Achou Caro" após 7 dias:
```
Olá [Nome], preparei um comparativo de custo-benefício do [Produto] que conversamos, mostrando o valor do investimento ao longo do tempo. Também separei algumas opções de financiamento que podem ser interessantes para você. Posso compartilhar?
```

#### Para Lead "Compra Futura" após 15 dias:
```
Olá [Nome], como vai? Lembrei de você porque acabamos de lançar um plano especial de reserva antecipada para o [Produto/Projeto] com condições exclusivas para 2025. Achei que poderia ser relevante para seu planejamento futuro. Quer conhecer os detalhes?
```

### Implementação do Sistema de Inatividade

```javascript
// inactivityTriggerService.js
class InactivityTriggerService {
  constructor(aiService, whatsappService, leadService) {
    this.aiService = aiService;
    this.whatsappService = whatsappService;
    this.leadService = leadService;
  }
  
  async findInactiveLeads() {
    const now = new Date();
    
    // Definir pontos de corte para diferentes períodos de inatividade
    const thresholds = {
      interested: {
        short: 2, // 2 dias para leads interessados
        medium: 5, // 5 dias
        long: 15   // 15 dias
      },
      default: {
        short: 3,  // 3 dias para outros leads
        medium: 7, // 7 dias
        long: 30   // 30 dias
      }
    };
    
    // Buscar leads com diferentes períodos de inatividade
    const results = {
      shortTerm: [],
      mediumTerm: [],
      longTerm: []
    };
    
    // Para cada lead ativo no sistema
    const activeLeads = await this.leadService.getActiveLeads();
    for (const lead of activeLeads) {
      // Pular leads marcados para não contatar
      if (lead.do_not_contact) continue;
      
      // Determinar thresholds aplicáveis baseado no status do lead
      const isInterested = lead.sentiment_status === 'interessado';
      const applicable = isInterested ? thresholds.interested : thresholds.default;
      
      // Calcular dias desde última interação
      const lastActivity = new Date(lead.last_activity_at || lead.created_at);
      const daysSinceActivity = Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24));
      
      // Verificar automensagens recentes para evitar duplicação
      const hasRecentAutoMessage = await this.hasRecentAutomatedMessage(lead.id);
      if (hasRecentAutoMessage) continue;
      
      // Categorizar lead por período de inatividade
      if (daysSinceActivity >= applicable.long) {
        results.longTerm.push({
          lead,
          days_inactive: daysSinceActivity,
          inactivity_level: 'long'
        });
      } else if (daysSinceActivity >= applicable.medium) {
        results.mediumTerm.push({
          lead,
          days_inactive: daysSinceActivity,
          inactivity_level: 'medium'
        });
      } else if (daysSinceActivity >= applicable.short) {
        results.shortTerm.push({
          lead,
          days_inactive: daysSinceActivity,
          inactivity_level: 'short'
        });
      }
    }
    
    return results;
  }
  
  async processInactiveLeads() {
    // Encontrar leads inativos
    const inactiveLeads = await this.findInactiveLeads();
    let processed = 0;
    
    // Processar leads por ordem de prioridade
    const priorityOrder = [
      { category: 'shortTerm', leads: inactiveLeads.shortTerm.filter(l => l.lead.sentiment_status === 'interessado') },
      { category: 'mediumTerm', leads: inactiveLeads.mediumTerm.filter(l => l.lead.sentiment_status === 'interessado') },
      { category: 'shortTerm', leads: inactiveLeads.shortTerm.filter(l => l.lead.sentiment_status !== 'interessado') },
      { category: 'mediumTerm', leads: inactiveLeads.mediumTerm.filter(l => l.lead.sentiment_status !== 'interessado') },
      { category: 'longTerm', leads: inactiveLeads.longTerm }
    ];
    
    // Processar cada grupo de prioridade
    for (const group of priorityOrder) {
      for (const item of group.leads) {
        // Verificar limites diários
        if (processed >= this.getDailyLimit()) break;
        
        // Verificar regras de contato
        const canContact = await this.canContactLead(item.lead.id);
        if (!canContact.allowed) continue;
        
        // Gerar e enviar mensagem
        await this.sendInactivityMessage(item.lead, item.inactivity_level, item.days_inactive);
        processed++;
      }
    }
    
    return {
      total_processed: processed,
      total_found: inactiveLeads.shortTerm.length + inactiveLeads.mediumTerm.length + inactiveLeads.longTerm.length
    };
  }
  
  async sendInactivityMessage(lead, inactivityLevel, daysInactive) {
    // Preparar contexto para IA gerar mensagem
    const context = {
      lead_info: {
        id: lead.id,
        name: lead.name,
        sentiment_status: lead.sentiment_status,
        lead_score: lead.lead_score,
        project: lead.project_name
      },
      inactivity_context: {
        level: inactivityLevel,
        days_inactive: daysInactive,
        last_interaction: await this.getLastInteractionSummary(lead.id)
      },
      message_purpose: 'Reengajar lead inativo',
      personalization_hints: []
    };
    
    // Personalizar por status de sentimento e tempo inativo
    this.addPersonalizationHints(context, lead, inactivityLevel);
    
    // Obter última interação para contexto
    const lastInteractions = await this.getRecentInteractions(lead.id, 3);
    if (lastInteractions.length > 0) {
      context.recent_interactions = lastInteractions;
    }
    
    // Gerar mensagem via IA
    const message = await this.aiService.generateInactivityMessage(context);
    
    // Enviar mensagem
    const sentMessage = await this.whatsappService.sendMessage(lead.phone, message);
    
    // Registrar atividade
    await this.recordAutomatedMessage(
      lead.id, 
      `inactivity_${inactivityLevel}`, 
      message, 
      sentMessage.id
    );
    
    return { success: true, messageId: sentMessage.id };
  }
  
  addPersonalizationHints(context, lead, inactivityLevel) {
    // Base na situação de sentimento
    switch (lead.sentiment_status) {
      case 'interessado':
        context.personalization_hints.push(
          'Tom positivo e proativo',
          'Sugerir próximos passos concretos',
          'Mencionar benefícios específicos do produto/serviço'
        );
        break;
      
      case 'achou caro':
        context.personalization_hints.push(
          'Enfatizar valor e retorno do investimento',
          'Mencionar opções de financiamento/pagamento',
          'Destacar diferenciais que justificam o preço'
        );
        break;
      
      case 'quer desconto':
        context.personalization_hints.push(
          'Oferecer valor agregado em vez de desconto direto',
          'Mencionar condições especiais limitadas',
          'Ressaltar benefícios exclusivos'
        );
        break;
      
      case 'compra futura':
        context.personalization_hints.push(
          'Fornecer informações úteis para planejamento',
          'Mencionar vantagens de decisão antecipada',
          'Sugerir reserva ou pré-compra se aplicável'
        );
        break;
    }
    
    // Base no nível de inatividade
    if (inactivityLevel === 'long') {
      context.personalization_hints.push(
        'Abordagem mais direta sobre continuidade do interesse',
        'Oferecer opção de reagendamento se aplicável',
        'Mencionar mudanças ou novidades desde último contato'
      );
    }
  }
  
  async getLastInteractionSummary(leadId) {
    const lastMessage = await this.leadService.getLastMessage(leadId);
    if (!lastMessage) return null;
    
    return {
      content: lastMessage.content,
      direction: lastMessage.direction,
      timestamp: lastMessage.created_at,
      topic: await this.extractTopic(lastMessage.content)
    };
  }
  
  async extractTopic(messageContent) {
    // Usar IA para extrair tópico principal da mensagem
    const topic = await this.aiService.extractMainTopic(messageContent);
    return topic;
  }
}
```

## 3. Considerações para a Implementação

### Integrando os Dois Sistemas

Para maximizar a eficácia do sistema de mensagens automáticas, os dois mecanismos de disparo (eventos e inatividade) devem ser coordenados:

```javascript
// automationCoordinatorService.js
class AutomationCoordinatorService {
  constructor(eventTriggerService, inactivityTriggerService, leadService) {
    this.eventTriggerService = eventTriggerService;
    this.inactivityTriggerService = inactivityTriggerService;
    this.leadService = leadService;
  }
  
  async registerEvent(eventType, leadId, eventData) {
    // Registrar evento no histórico do lead
    await this.leadService.recordEvent(leadId, eventType, eventData);
    
    // Processar evento para possível mensagem automática
    return await this.eventTriggerService.processEvent(eventType, leadId, eventData);
  }
  
  async runInactivityCheck() {
    // Executar verificação de leads inativos
    return await this.inactivityTriggerService.processInactiveLeads();
  }
  
  async getLeadAutomationStatus(leadId) {
    // Obter informações sobre automação para um lead específico
    const lead = await this.leadService.getLeadById(leadId);
    const recentMessages = await this.leadService.getRecentAutomatedMessages(leadId, 5);
    const eligibility = await this.checkEligibility(leadId);
    
    return {
      lead_id: leadId,
      lead_score: lead.lead_score,
      sentiment_status: lead.sentiment_status,
      recent_automated_messages: recentMessages,
      next_contact_eligibility: eligibility
    };
  }
  
  async checkEligibility(leadId) {
    // Verificar se lead está elegível para mensagens automáticas
    const eventEligibility = await this.eventTriggerService.canContactLead(leadId);
    const inactivityEligibility = await this.inactivityTriggerService.canContactLead(leadId);
    
    let nextEligibleDate = null;
    if (!eventEligibility.allowed || !inactivityEligibility.allowed) {
      // Calcular próxima data elegível com base nas restrições
      nextEligibleDate = this.calculateNextEligibleDate(leadId);
    }
    
    return {
      eligible_for_event_messages: eventEligibility.allowed,
      eligible_for_inactivity_messages: inactivityEligibility.allowed,
      reason_if_not_eligible: eventEligibility.allowed ? inactivityEligibility.reason : eventEligibility.reason,
      next_eligible_date: nextEligibleDate
    };
  }
  
  async calculateNextEligibleDate(leadId) {
    // Lógica para determinar próxima data elegível com base no histórico
    const lastMessage = await this.leadService.getLastAutomatedMessage(leadId);
    if (!lastMessage) return new Date(); // Elegível imediatamente se não há mensagens
    
    const lastMessageDate = new Date(lastMessage.created_at);
    const nextDate = new Date(lastMessageDate);
    nextDate.setDate(nextDate.getDate() + 1); // +1 dia como regra básica
    
    return nextDate;
  }
}
```

### Personalização Baseada em Lead Score e Sentimento

A personalização das mensagens deve considerar tanto o lead score quanto o sentimento do lead de forma integrada:

| Lead Score | Sentimento | Abordagem Recomendada |
|------------|------------|------------------------|
| 80-100 | interessado | Mensagens mais diretas focadas em converter e fechar, detalhamento de próximos passos |
| 80-100 | achou caro | Ênfase no valor e retorno sobre investimento, demonstração de casos similares |
| 60-80 | interessado | Fornecer informações detalhadas, remover objeções potenciais, começar a encaminhar para conversão |
| 60-80 | achou caro | Apresentar opções de financiamento/pagamento, explicar benefícios que justificam valor |
| 40-60 | qualquer | Foco em educação e construção de valor, sem pressão para conversão imediata |
| 0-40 | qualquer | Abordagem muito soft, foco em despertar interesse inicial ou qualificar melhor |

### Endpoint no Serviço de IA para Mensagens Específicas

```python
# app/api/automated_messages.py
from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, List, Optional
from app.models.automated_message import EventMessageRequest, InactivityMessageRequest, MessageResponse
from app.services.ai_service import AIService
from app.core.auth import get_api_key

router = APIRouter()

@router.post("/event-message", response_model=MessageResponse)
async def generate_event_message(
    request: EventMessageRequest,
    ai_service: AIService = Depends(),
    api_key: str = Depends(get_api_key)
):
    """Gera uma mensagem personalizada baseada em um evento específico."""
    
    # Construir o prompt para o modelo de IA
    system_prompt = construct_event_message_prompt(request)
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Gere uma mensagem para o evento {request.event_type} para o lead {request.lead_info.name}"}
    ]
    
    # Adicionar contexto de interações recentes se disponível
    if request.recent_interactions:
        context_prompt = "Interações recentes:\n\n"
        for interaction in request.recent_interactions:
            direction = "Lead disse" if interaction.direction == "incoming" else "Assistente disse"
            context_prompt += f"{direction}: \"{interaction.content}\"\n"
        
        messages.append({"role": "user", "content": context_prompt})
    
    # Chamar serviço de IA para gerar resposta
    try:
        response = await ai_service.get_chat_response(
            messages=messages,
            options={
                "model": determine_appropriate_model(request.lead_info.lead_score),
                "temperature": 0.7
            }
        )
        
        return MessageResponse(
            message=response["message"]["content"],
            suggested_timing=suggest_timing_for_event(request.event_type),
            metadata={
                "event_type": request.event_type,
                "sentiment_used": request.lead_info.sentiment_status,
                "lead_score_used": request.lead_info.lead_score
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar mensagem: {str(e)}")

@router.post("/inactivity-message", response_model=MessageResponse)
async def generate_inactivity_message(
    request: InactivityMessageRequest,
    ai_service: AIService = Depends(),
    api_key: str = Depends(get_api_key)
):
    """Gera uma mensagem personalizada para reengajar leads inativos."""
    
    # Construir prompt específico para reengajamento por inatividade
    system_prompt = construct_inactivity_message_prompt(
        request.lead_info, 
        request.inactivity_context,
        request.personalization_hints
    )
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Gere uma mensagem de reengajamento para o lead {request.lead_info.name} inativo há {request.inactivity_context.days_inactive} dias"}
    ]
    
    # Chamar serviço de IA
    try:
        response = await ai_service.get_chat_response(
            messages=messages,
            options={
                "model": determine_appropriate_model(request.lead_info.lead_score),
                "temperature": 0.7
            }
        )
        
        return MessageResponse(
            message=response["message"]["content"],
            suggested_timing="business_hours",
            metadata={
                "inactivity_level": request.inactivity_context.level,
                "days_inactive": request.inactivity_context.days_inactive,
                "sentiment_used": request.lead_info.sentiment_status,
                "lead_score_used": request.lead_info.lead_score
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar mensagem: {str(e)}")

def construct_event_message_prompt(request: EventMessageRequest) -> str:
    """Constrói o prompt específico para mensagem baseada em evento."""
    
    # Template base
    base_prompt = f"""
    Você é um assistente de vendas especializado em gerar mensagens personalizadas.
    
    DADOS DO LEAD:
    - Nome: {request.lead_info.name}
    - Status de sentimento: {request.lead_info.sentiment_status}
    - Score do lead: {request.lead_info.lead_score}/100
    - Evento acionado: {request.event_type}
    
    DADOS DO EVENTO:
    """
    
    # Adicionar detalhes específicos do evento
    event_details = ""
    if request.event_type == "carrinho_abandonado":
        event_details = f"""
        - Produtos no carrinho: {format_products(request.event_data.get('items', []))}
        - Valor total: {request.event_data.get('total_value', 'N/A')}
        - Tempo desde abandono: {format_time_since(request.event_data.get('abandoned_at'))}
        """
    elif request.event_type == "visualizou_propriedade":
        event_details = f"""
        - Propriedade visualizada: {request.event_data.get('property_name')}
        - Tipo: {request.event_data.get('property_type')}
        - Preço: {request.event_data.get('price')}
        - Características de destaque: {request.event_data.get('highlights', [])}
        """
    # Adicione outros formatos de evento conforme necessário
    
    # Adicionar diretrizes específicas por status de sentimento
    sentiment_guidelines = get_sentiment_guidelines(request.lead_info.sentiment_status)
    
    # Diretrizes específicas por score do lead
    score_guidelines = get_score_guidelines(request.lead_info.lead_score)
    
    # Instruções para formatação da mensagem
    formatting_instructions = """
    FORMATO DA MENSAGEM:
    - Comece com uma saudação personalizada incluindo o nome do lead
    - Corpo da mensagem (2-3 frases) abordando o evento específico
    - Inclua uma pergunta ou chamada para ação clara
    - Mantenha tom conversacional e natural
    - Não ultrapasse 3-4 frases no total
    - Evite linguagem de marketing exagerada
    - Não use mais que 1-2 emojis se apropriado
    """
    
    return base_prompt + event_details + sentiment_guidelines + score_guidelines + formatting_instructions

def construct_inactivity_message_prompt(lead_info, inactivity_context, personalization_hints) -> str:
    """Constrói o prompt para mensagem baseada em inatividade."""
    
    # Base do prompt
    base_prompt = f"""
    Você é um assistente de vendas especializado em reengajar leads inativos.
    
    DADOS DO LEAD:
    - Nome: {lead_info.name}
    - Status de sentimento: {lead_info.sentiment_status}
    - Score do lead: {lead_info.lead_score}/100
    - Dias sem interação: {inactivity_context.days_inactive}
    """
    
    # Adicionar contexto da última interação se disponível
    if inactivity_context.last_interaction:
        base_prompt += f"""
        ÚLTIMA INTERAÇÃO:
        - Conteúdo: "{inactivity_context.last_interaction.content}"
        - Tópico principal: {inactivity_context.last_interaction.topic or "Não identificado"}
        - Quando: {format_time_ago(inactivity_context.last_interaction.timestamp)}
        """
    
    # Adicionar dicas de personalização
    hints = "\n".join([f"- {hint}" for hint in personalization_hints])
    personalization_section = f"""
    DICAS DE PERSONALIZAÇÃO:
    {hints}
    """
    
    # Diretrizes baseadas no nível de inatividade
    inactivity_guidelines = get_inactivity_guidelines(inactivity_context.level)
    
    # Diretrizes de formato
    format_guidelines = """
    FORMATO DA MENSAGEM:
    - Inicie com saudação personalizada
    - Mencione de forma sutil o tempo sem contato (sem tom acusatório)
    - Forneça um motivo relevante para o contato
    - Inclua informação de valor ou oferta relevante
    - Termine com pergunta aberta ou chamada para ação clara
    - Mantenha tom amigável e prestativo
    - Máximo de 4 frases
    """
    
    return base_prompt + personalization_section + inactivity_guidelines + format_guidelines
```

## 4. Medição e Otimização

Para otimizar continuamente as mensagens automáticas, é essencial medir:

### KPIs Principais

- **Taxa de Resposta**: Percentual de leads que respondem às mensagens automáticas
- **Tempo até Resposta**: Tempo médio entre envio da mensagem e resposta do lead
- **Taxa de Conversão**: Percentual de leads que avançam no funil após mensagens automáticas
- **Eficácia por Tipo de Evento**: Comparação das taxas de resposta por tipo de evento
- **Eficácia por Segmento**: Comparação de resultados por faixas de lead score e status de sentimento

### Modelo de Feedback Contínuo

Implementar um sistema que registre desempenho das mensagens e alimente a IA para melhorias:

```javascript
// messageFeedbackCollector.js
class MessageFeedbackCollector {
  constructor(database, aiService) {
    this.db = database;
    this.aiService = aiService;
  }
  
  async recordMessageOutcome(messageId, outcome) {
    // Registrar resultado da mensagem (resposta, clique, conversão, etc.)
    await this.db.collection('message_outcomes').insertOne({
      message_id: messageId,
      outcome_type: outcome.type,
      lead_response: outcome.response,
      response_sentiment: outcome.sentiment,
      time_to_response: outcome.time_to_response,
      led_to_conversion: outcome.led_to_conversion,
      timestamp: new Date()
    });
    
    // Recalcular estatísticas globais
    await this.updateMessageStats();
  }
  
  async updateMessageStats() {
    // Agregar estatísticas por tipo de mensagem, segmento de lead, etc.
    const stats = await this.calculateMessageStats();
    
    // Armazenar insights para uso futuro
    await this.db.collection('message_insights').updateOne(
      { type: 'global_stats' },
      { $set: { stats, updated_at: new Date() } },
      { upsert: true }
    );
    
    // Enviar insights para o serviço de IA para melhorar geração futura
    await this.aiService.updateMessageInsights(stats);
  }
  
  async getInsightsForContext(context) {
    // Recuperar insights relevantes para um contexto específico
    // Usado para melhorar prompts da IA
    const relevantInsights = await this.db.collection('message_insights')
      .find({
        'lead_segment.sentiment': context.lead_info.sentiment_status,
        'lead_segment.score_range': this.getScoreRange(context.lead_info.lead_score)
      })
      .sort({ updated_at: -1 })
      .limit(1)
      .toArray();
      
    return relevantInsights[0] || null;
  }
  
  getScoreRange(score) {
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    if (score >= 40) return 'low';
    return 'very_low';
  }
}
```

## 5. Exemplos de Mensagens por Tipo e Contexto

### Mensagens Baseadas em Eventos

#### Carrinho Abandonado - Lead "Interessado" (Score 85)
```
Olá Mariana, vi que você adicionou o Apartamento Garden ao carrinho há pouco. Este modelo está com alta demanda e temos apenas 3 unidades disponíveis. Posso reservar uma unidade para você ou esclarecer alguma dúvida sobre as condições de pagamento?
```

#### Visualização de Preços - Lead "Achou Caro" (Score 68)
```
Olá Carlos, notei seu interesse nos valores do Condomínio Horizonte. Muitos de nossos clientes inicialmente tiveram a mesma impressão sobre o investimento, mas descobriram o excelente custo-benefício ao considerar a valorização da região nos próximos anos. Posso detalhar as opções de financiamento que tornam este investimento mais acessível?
```

#### Segunda Visita - Lead "Compra Futura" (Score 72)
```
Que bom vê-lo novamente, Roberto! Desde sua última visita, atualizamos nosso plano de investimento para o Residencial Aurora com opções de pré-lançamento que podem ser interessantes para seu planejamento futuro. Gostaria de conhecer as condições especiais para reserva antecipada?
```

### Mensagens Baseadas em Inatividade

#### Lead "Interessado" (Score 88) - 3 Dias Inativo
```
Olá Paula, tudo bem? Estou acompanhando aquela simulação de financiamento que conversamos na terça-feira para o apartamento de 2 quartos. Consegui algumas condições especiais com o banco parceiro que podem reduzir significativamente o valor das parcelas. Quando seria um bom momento para apresentar estas opções?
```

#### Lead "Quer Desconto" (Score 65) - 7 Dias Inativo
```
Olá Miguel, como vai? Acabamos de lançar um programa de benefícios exclusivos para o Residencial Jardins que inclui decoração personalizada e eletrodomésticos da linha premium sem custo adicional. Achei que isso poderia agregar valor ao seu investimento. Posso compartilhar mais detalhes?
```

#### Lead "Sem Interesse" (Score 35) - 15 Dias Inativo
```
Olá Juliana, faz algum tempo desde nosso último contato. Estamos com novos modelos de imóveis que têm um perfil diferente do que conversamos anteriormente, com valores a partir de R$180.000. Se ainda estiver em busca de um imóvel, posso apresentar essas novas opções? Caso contrário, é só avisar que não entrarei mais em contato.
```