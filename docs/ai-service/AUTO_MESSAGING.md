# Sistema de Mensagens Automáticas para Leads com IA

Este documento detalha a implementação do sistema de mensagens automáticas para leads, utilizando o serviço de IA para personalização e o sistema existente de WhatsApp para envio.

## Visão Geral

O sistema de mensagens automáticas usa análise de sentimento, histórico de interações e contexto para enviar mensagens personalizadas e relevantes aos leads em momentos apropriados, visando aumentar o engajamento e a conversão.

## Arquitetura Integrada

```
┌─────────────────┐     ┌───────────────────┐     ┌───────────────────┐
│                 │     │                   │     │                   │
│  Sistema de     │     │   Serviço de IA   │     │   API WhatsApp    │
│  Leads (Node.js)│────►│   (Python/FastAPI)│────►│                   │
│                 │     │                   │     │                   │
└─────────────────┘     └───────────────────┘     └───────────────────┘
       │                        ▲                        │
       │                        │                        │
       ▼                        │                        ▼
┌─────────────────┐     ┌───────────────────┐     ┌───────────────────┐
│                 │     │                   │     │                   │
│  Banco de Dados │     │   Agendador de    │     │ Serviço de Eventos│
│  (Supabase)     │◄───►│   Mensagens       │◄───►│ de Lead           │
│                 │     │                   │     │                   │
└─────────────────┘     └───────────────────┘     └───────────────────┘
```

## Componentes Principais

### 1. Agendador de Mensagens

Um serviço responsável por determinar quando e para quem enviar mensagens automáticas:

- Executa periodicamente (ex: a cada 30 minutos)
- Identifica leads que atendem a critérios para receber mensagens
- Gerencia frequência de contato para evitar spam
- Agenda mensagens baseadas em eventos e horário comercial

### 2. Gerador de Conteúdo com IA

Utiliza o serviço de IA para gerar mensagens personalizadas:

- Acessa histórico de interações do lead
- Fornece contexto relevante (produto, status, sentimento)
- Gera texto personalizado baseado em templates e análise de sentimento
- Adapta tom e abordagem ao perfil do lead

### 3. Integração com WhatsApp

Utiliza a API WhatsApp existente para envio de mensagens:

- Envia mensagens geradas pela IA
- Processa respostas recebidas
- Atualiza histórico de interações
- Registra eventos de comunicação

### 4. Sistema de Feedback e Melhoria

Mede eficácia e melhora as mensagens automáticas:

- Monitora taxas de resposta e conversão
- Identifica padrões de comunicação bem-sucedidos
- Usa aprendizado para melhorar templates futuros
- Detecta quando intervenção humana é necessária

## Fluxo de Operação

### Identificação de Leads para Contato

O sistema identifica leads para mensagens automáticas nas seguintes situações:

1. **Lead Novo**: 
   - Primeiro contato automático após cadastro
   - Ativado após período definido sem resposta ao contato inicial

2. **Lead Inativo**: 
   - Sem interação recente (ex: 3+ dias desde última mensagem)
   - Status mostra interesse, mas sem progresso

3. **Follow-up Pós-evento**:
   - Após visita a páginas específicas do site
   - Depois de abrir um email de campanha
   - Após solicitação de informações

4. **Resposta a Objeções**:
   - Quando a análise de sentimento detecta objeções específicas
   - Para leads categorizados como "achou caro" ou "precisa de mais informações"

### Geração de Mensagem com IA

O processo de geração de mensagens segue estas etapas:

1. Coleta de dados do lead:
   ```json
   {
     "lead_id": "a5cd4a8d-1264-4752-b1a3-29e7e5740083",
     "name": "João Silva",
     "interaction_history": [
       {"direction": "incoming", "message": "Olá, gostaria de informações sobre o projeto X", "timestamp": "2023-06-01T10:15:00Z"},
       {"direction": "outgoing", "message": "Olá João! Claro, temos várias opções para o projeto X...", "timestamp": "2023-06-01T10:30:00Z"},
       {"direction": "incoming", "message": "O valor está um pouco acima do meu orçamento", "timestamp": "2023-06-01T11:05:00Z"}
     ],
     "sentiment_status": "achou caro",
     "lead_score": 68,
     "project_info": {
       "name": "Residencial Aurora",
       "type": "Apartamento",
       "price_range": "300.000 - 400.000"
     },
     "contact_frequency": "medium",
     "message_type": "price_objection_follow_up",
     "last_contact": "2023-06-01T11:10:00Z"
   }
   ```

2. Envio para o endpoint de geração de mensagem do serviço IA:
   ```
   POST /ai-service/v1/lead-message
   ```

3. IA processa o contexto e seleciona a abordagem apropriada:
   - Para "achou caro" → enfatiza valor e benefícios
   - Para "interessado" → oferece próximos passos concretos
   - Para "quer desconto" → sugere opções de financiamento

4. Resposta gerada e validada:
   ```json
   {
     "message": "Olá João, entendo sua preocupação com o orçamento. O Residencial Aurora oferece excelente custo-benefício considerando a localização e acabamento premium. Temos opções de financiamento que podem adequar o valor às suas possibilidades. Podemos conversar sobre isso? Estou à disposição para encontrar a melhor solução para você.",
     "suggested_time": "2023-06-04T14:00:00Z",
     "expected_intent": "reengagement",
     "follow_up_recommendation": "Se não houver resposta em 24h, enviar opções de financiamento específicas"
   }
   ```

### Envio da Mensagem

A mensagem é enviada através do fluxo:

1. Agendador programa a mensagem para o horário sugerido
2. Sistema verifica regras de frequência de contato
3. Mensagem é enviada via API WhatsApp
4. Evento é registrado no sistema de eventos de lead
5. Status do lead é atualizado

## Types de Mensagens Automáticas

### 1. Mensagens de Boas-vindas

**Propósito**: Primeiro contato após cadastro  
**Personalização**: Nome do lead e projeto/produto de interesse  
**Exemplo**:  
```
Olá [Nome], seja bem-vindo! Obrigado pelo interesse no [Produto]. Sou [Assistente] e estou aqui para ajudar com qualquer dúvida sobre o [Projeto]. Em que posso auxiliar hoje?
```

### 2. Follow-up de Interesse

**Propósito**: Seguimento após demonstração de interesse  
**Personalização**: Referência específica ao interesse demonstrado  
**Exemplo**:  
```
Olá [Nome], notei que você esteve vendo informações sobre [Característica Específica] do [Produto]. Posso compartilhar mais detalhes sobre isso ou esclarecer alguma dúvida particular?
```

### 3. Resposta a Objeções de Preço

**Propósito**: Abordar preocupações com preço/orçamento  
**Personalização**: Baseada no status "achou caro" ou "quer desconto"  
**Exemplo**:  
```
Olá [Nome], compreendo sua consideração sobre o investimento no [Produto]. Muitos clientes inicialmente tiveram a mesma percepção, mas descobriram o valor ao considerar [Benefícios Específicos]. Temos também opções flexíveis de pagamento que podem ser adequadas para seu planejamento financeiro. Podemos conversar sobre isso?
```

### 4. Reativação de Lead Inativo

**Propósito**: Reengajar leads sem interação recente  
**Personalização**: Referência ao histórico e novas informações  
**Exemplo**:  
```
Olá [Nome], faz alguns dias que não conversamos sobre o [Produto]. Queria compartilhar que agora temos [Nova Funcionalidade/Condição] que pode ser interessante para você. Ainda está considerando esta opção?
```

### 5. Perguntas Qualificadoras

**Propósito**: Obter mais informações para qualificar o lead  
**Personalização**: Baseada no tipo de produto/serviço  
**Exemplo**:  
```
Olá [Nome], para encontrar a melhor solução para você no [Projeto], ajudaria muito saber: qual é o principal benefício que você busca? E qual seria seu cronograma ideal para [Ação/Implementação]?
```

## Regras de Engajamento

Para manter uma experiência positiva e evitar spam:

1. **Frequência Máxima**:
   - No máximo 1 mensagem automática por dia
   - No máximo 3 mensagens automáticas por semana
   - Pausa automática após 5 mensagens sem resposta

2. **Horários Apropriados**:
   - Apenas em horário comercial (9h às 18h)
   - Respeitar feriados (via API de calendário)
   - Evitar fins de semana (exceto para leads "interessado" que iniciaram contato no fim de semana)

3. **Interrupção de Automação**:
   - Qualquer resposta do lead transfere o atendimento para humano
   - Solicitação explícita de "não contatar" marca o lead como "não contatar"
   - Após 3 mensagens sem engajamento, requer aprovação humana para continuar

## Integração com Sistema de Eventos de Lead

O sistema de mensagens automáticas é integrado ao sistema de eventos de lead existente:

1. **Captura de Eventos**:
   - Cada mensagem automática gera um evento tipo `whatsapp_message`
   - Respostas geram eventos que alimentam análise de sentimento

2. **Triggers de Eventos**:
   - Visitas ao site podem iniciar sequências de mensagens
   - Mudanças de status ativam templates específicos
   - Abertura de emails dispara follow-ups relevantes

## Implementação Técnica

### Serviço de Agendamento

1. **Cron job** para verificação de leads:
```javascript
// scheduler.js
const cron = require('node-cron');
const { findLeadsForAutomatedContact } = require('./services/leadsService');
const { generateAndSendMessage } = require('./services/automationService');

// Executa a cada 30 minutos em horário comercial
cron.schedule('*/30 9-18 * * 1-5', async () => {
  console.log('Verificando leads para contato automatizado...');
  
  const leads = await findLeadsForAutomatedContact();
  console.log(`Encontrados ${leads.length} leads para contato`);
  
  for (const lead of leads) {
    await generateAndSendMessage(lead);
  }
});
```

2. **Lógica para encontrar leads elegíveis**:
```javascript
// leadsService.js
async function findLeadsForAutomatedContact() {
  const { data, error } = await supabase
    .from('leads')
    .select('*, lead_events(*), projects(*)')
    .or('sentiment_status.eq.interessado,sentiment_status.eq.achou caro,sentiment_status.eq.quer desconto')
    .gt('lead_score', 50)
    .is('do_not_contact', false)
    .is('last_automated_message_at', null)
    .order('lead_score', { ascending: false });
    
  if (error) {
    console.error('Erro ao buscar leads para contato:', error);
    return [];
  }
  
  // Filtrar baseado em regras de frequência
  return data.filter(lead => isEligibleForContact(lead));
}

function isEligibleForContact(lead) {
  // Verifica última mensagem (automatizada ou não)
  const lastMessage = findLastMessage(lead);
  if (!lastMessage) return true; // Nenhuma mensagem, elegível para primeira mensagem
  
  const now = new Date();
  const lastMessageDate = new Date(lastMessage.created_at);
  const daysSinceLastMessage = (now - lastMessageDate) / (1000 * 60 * 60 * 24);
  
  // Regras de frequência
  if (lead.last_automated_message_at) {
    const lastAutoDate = new Date(lead.last_automated_message_at);
    const daysSinceLastAuto = (now - lastAutoDate) / (1000 * 60 * 60 * 24);
    
    // No mínimo 1 dia entre mensagens automatizadas
    if (daysSinceLastAuto < 1) return false;
    
    // Máximo de 3 mensagens por semana
    const weekMessages = countMessagesInLastDays(lead, 7);
    if (weekMessages >= 3) return false;
  }
  
  // Regras específicas por status
  switch (lead.sentiment_status) {
    case 'interessado':
      // Mais agressivo com leads interessados
      return daysSinceLastMessage > 1;
    case 'achou caro':
      // Mais cauteloso com leads que acharam caro
      return daysSinceLastMessage > 2;
    default:
      return daysSinceLastMessage > 3;
  }
}
```

### Integração com Serviço de IA

```javascript
// automationService.js
const axios = require('axios');
const { sendWhatsAppMessage } = require('./whatsappService');
const { updateLeadAutomationStatus } = require('./leadsService');

async function generateAndSendMessage(lead) {
  try {
    // Preparar dados para o serviço de IA
    const leadData = await prepareLeadContextData(lead);
    
    // Chamar serviço de IA para gerar mensagem
    const response = await axios.post(
      `${process.env.AI_SERVICE_URL}/lead-message`,
      leadData,
      {
        headers: {
          'Authorization': `Bearer ${process.env.AI_SERVICE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const { message, suggested_time, expected_intent, follow_up_recommendation } = response.data;
    
    // Enviar mensagem via WhatsApp
    const messageResult = await sendWhatsAppMessage(lead.phone, message);
    
    // Registrar evento e atualizar lead
    await Promise.all([
      recordMessageEvent(lead.id, message, 'automated'),
      updateLeadAutomationStatus(lead.id, {
        last_automated_message_at: new Date().toISOString(),
        last_automated_message_content: message,
        last_automated_message_intent: expected_intent,
        next_follow_up_recommendation: follow_up_recommendation,
        automated_messages_count: (lead.automated_messages_count || 0) + 1
      })
    ]);
    
    return {
      success: true,
      message_id: messageResult.id
    };
  } catch (error) {
    console.error('Erro ao gerar ou enviar mensagem automatizada:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function prepareLeadContextData(lead) {
  // Buscar histórico de mensagens do lead
  const { data: messages } = await supabase
    .from('whatsapp_conversations')
    .select('*')
    .eq('lead_id', lead.id)
    .order('created_at', { ascending: false })
    .limit(10);
  
  // Buscar informações do projeto associado
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', lead.project_id)
    .single();
  
  // Formatar dados para o serviço de IA
  return {
    lead_id: lead.id,
    name: lead.name,
    interaction_history: messages.map(msg => ({
      direction: msg.direction,
      message: msg.content,
      timestamp: msg.created_at
    })),
    sentiment_status: lead.sentiment_status,
    lead_score: lead.lead_score,
    project_info: project ? {
      name: project.name,
      type: project.type,
      price_range: project.price_range
    } : null,
    contact_frequency: determineContactFrequency(lead),
    message_type: determineMessageType(lead),
    last_contact: lead.last_message_at || lead.created_at
  };
}
```

### Endpoint do Serviço de IA para Mensagens

```python
# app/api/lead_messages.py
from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, List
from app.models.lead_message import LeadMessageRequest, LeadMessageResponse
from app.services.ai_service import AIService
from app.core.auth import get_api_key

router = APIRouter()

@router.post("/lead-message", response_model=LeadMessageResponse)
async def generate_lead_message(
    request: LeadMessageRequest,
    ai_service: AIService = Depends(),
    api_key: str = Depends(get_api_key)
):
    """Gera uma mensagem personalizada para um lead com base no contexto e histórico."""
    
    # Determinar o tipo de template a ser usado
    template_type = determine_template_type(request)
    
    # Construir o prompt para o modelo de IA
    system_prompt = construct_system_prompt(template_type, request)
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Gere uma mensagem personalizada para o lead {request.name} com status {request.sentiment_status}"}
    ]
    
    # Adicionar contexto de mensagens anteriores se disponível
    if request.interaction_history and len(request.interaction_history) > 0:
        context_prompt = "Histórico de interações recentes:\n\n"
        for msg in request.interaction_history[:5]:  # Limitar a 5 mensagens para o contexto
            direction = "Lead disse" if msg.direction == "incoming" else "Assistente disse"
            context_prompt += f"{direction}: \"{msg.message}\"\n"
        
        messages.append({"role": "user", "content": context_prompt})
    
    # Chamar serviço de IA para gerar resposta
    try:
        response = await ai_service.get_chat_response(
            messages=messages,
            options={
                "model": "gpt-4",  # Usar modelo avançado para qualidade
                "temperature": 0.7  # Alguma criatividade, mas manter coerência
            }
        )
        
        # Analisar resposta e sugerir timing
        message_content = response["message"]["content"]
        suggested_time = suggest_next_contact_time(request)
        
        # Determinar a intenção esperada e recomendação de follow-up
        intent_analysis = await analyze_message_intent(message_content, request, ai_service)
        
        return LeadMessageResponse(
            message=message_content,
            suggested_time=suggested_time,
            expected_intent=intent_analysis["intent"],
            follow_up_recommendation=intent_analysis["follow_up"]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar mensagem: {str(e)}")

def determine_template_type(request: LeadMessageRequest) -> str:
    """Determina o tipo de template com base no contexto do lead."""
    
    # Lead sem histórico - primeira mensagem
    if not request.interaction_history:
        return "welcome_message"
    
    # Baseado no status de sentimento
    if request.sentiment_status == "achou caro":
        return "price_objection_response"
    elif request.sentiment_status == "quer desconto":
        return "discount_negotiation"
    elif request.sentiment_status == "interessado":
        return "interested_follow_up"
    elif request.sentiment_status == "sem interesse":
        return "reengagement_attempt"
    elif request.sentiment_status == "compra futura":
        return "future_purchase_nurture"
    
    # Se nenhum caso específico, verificar tempo desde último contato
    last_contact = datetime.fromisoformat(request.last_contact.replace('Z', '+00:00'))
    days_since_contact = (datetime.now(UTC) - last_contact).days
    
    if days_since_contact > 7:
        return "reactivation_message"
    
    # Default para follow-up genérico
    return "general_follow_up"

def construct_system_prompt(template_type: str, request: LeadMessageRequest) -> str:
    """Constrói o prompt do sistema baseado no tipo de template e dados do lead."""
    
    base_prompt = f"""
    Você é um assistente de vendas inteligente ajudando a manter contato com potenciais clientes.
    
    SOBRE O LEAD:
    - Nome: {request.name}
    - Status: {request.sentiment_status}
    - Score: {request.lead_score}/100
    """
    
    if request.project_info:
        base_prompt += f"""
    - Interesse: {request.project_info.name} ({request.project_info.type})
    - Faixa de preço: {request.project_info.price_range}
        """
    
    # Adicionar instruções específicas por tipo de template
    if template_type == "welcome_message":
        base_prompt += """
        TAREFA: Crie uma primeira mensagem de boas-vindas calorosa e concisa.
        DIRETRIZES:
        - Seja amigável e profissional
        - Agradeça pelo interesse
        - Ofereça ajuda sem pressionar
        - Faça uma pergunta aberta para iniciar conversa
        - Mantenha entre 2-3 frases
        """
    
    elif template_type == "price_objection_response":
        base_prompt += """
        TAREFA: Crie uma mensagem que aborde a objeção de preço de forma construtiva.
        DIRETRIZES:
        - Reconheça a preocupação com preço sem diminuir o valor do produto
        - Destaque benefícios que justificam o investimento
        - Mencione possíveis soluções (financiamento, parcelamento)
        - Convide para conversa sobre opções
        - Mantenha tom colaborativo e não desesperado
        - Não mencione valores específicos
        """
    
    # Outros tipos de template...
    
    base_prompt += """
    IMPORTANTE:
    - Use linguagem natural e conversacional
    - Evite linguagem de marketing exagerada
    - Não use emojis excessivos (máximo 1-2)
    - Não inclua marcações de data/hora, apenas o conteúdo da mensagem
    - Limite a mensagem a 3-4 frases curtas
    - Inclua o nome do lead na saudação
    - Não use caps lock para ênfase
    """
    
    return base_prompt
```

## Métricas e Análise de Desempenho

Para avaliar e melhorar o sistema, monitoramos:

1. **Taxa de Resposta**:
   - Percentual de leads que respondem a mensagens automáticas
   - Tempo médio até a resposta

2. **Taxa de Conversão**:
   - Conversão de leads contatados automaticamente vs. manualmente
   - Progresso no funil de vendas após mensagens automáticas

3. **Feedback de Qualidade**:
   - Sentimento das respostas recebidas
   - Solicitações de contato humano

4. **Eficiência Operacional**:
   - Tempo economizado da equipe de vendas
   - Capacidade aumentada de acompanhamento de leads

## Considerações Éticas e Legais

Para garantir um uso ético e de acordo com regulamentações:

1. **Transparência**:
   - As mensagens não fingem ser humanas quando são automáticas
   - O lead sempre pode optar por falar com uma pessoa real

2. **Privacidade**:
   - Conformidade com LGPD e outras leis de privacidade
   - Processamento de dados pessoais apenas para fins necessários
   - Opção clara de descadastramento ("opt-out")

3. **Frequência e Timing**:
   - Respeito aos limites de contato para evitar spam
   - Horários apropriados para comunicação comercial

## Roadmap de Implementação

### Fase 1: MVP

1. Implementar serviço básico de mensagens automáticas para 3 cenários:
   - Boas-vindas a novos leads
   - Follow-up para leads "interessado"
   - Resposta a objeção de preço

2. Desenvolver integração com WhatsApp existente
3. Implementar regras básicas de frequência e timing
4. Configurar logs e métricas para análise

### Fase 2: Expansão

1. Adicionar templates para todos os status de sentimento
2. Implementar personalização baseada em análise comportamental
3. Desenvolver sistema de feedback e aprendizado
4. Melhorar algoritmo de timing e priorização

### Fase 3: Otimização

1. Implementar testes A/B para templates de mensagens
2. Desenvolver previsão de propensão a resposta
3. Adicionar personalização avançada por segmento de cliente
4. Implementar detecção de necessidade de intervenção humana

## Exemplos de Implementação

### Template para Lead que "Achou Caro"

**Exemplo de Prompt para IA**:
```
Você é um assistente de vendas ajudando com leads. O lead João demonstrou interesse em um apartamento no Residencial Aurora, mas mencionou que o preço está acima do esperado. O Residencial Aurora custa entre R$300.000 e R$400.000. O lead tem score 68/100 e status "achou caro".

Crie uma mensagem educada para reengajamento que:
1. Reconheça a preocupação com preço
2. Destaque valor e benefícios
3. Mencione opções de pagamento flexíveis
4. Convide para conversa sobre alternativas

Mantenha a mensagem curta (3-4 frases) e natural.
```

**Resposta da IA (Mensagem para Envio)**:
```
Olá João, entendo sua preocupação quanto ao investimento no Residencial Aurora. Muitos clientes inicialmente tiveram a mesma impressão, mas valorizam a localização privilegiada e economia a longo prazo com eficiência energética. Temos opções de financiamento personalizadas que podem adequar as parcelas ao seu orçamento mensal. Podemos conversar sobre algumas alternativas que têm funcionado bem para perfis semelhantes ao seu?
```

## Conclusão

O sistema de mensagens automáticas com IA oferece uma abordagem eficiente e personalizada para manter contato com leads, usando inteligência artificial para criar comunicações relevantes e contextuais que aumentam o engajamento e a conversão.

A integração entre o serviço de IA, o sistema de leads existente e a API de WhatsApp permite uma automação inteligente que economiza tempo da equipe de vendas enquanto mantém uma experiência positiva para os potenciais clientes.