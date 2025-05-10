# Análise de Conversas WhatsApp

Este documento descreve a implementação do sistema de armazenamento e análise de conversas WhatsApp, projetado para capturar todas as mensagens trocadas com leads, permitir sua análise por IA e gerar insights valiosos sobre o engajamento dos leads.

## Visão Geral

O sistema de análise de conversas WhatsApp foi projetado para:

- Armazenar todas as mensagens WhatsApp trocadas com leads
- Suportar análise de dados através de IA (sentimento, intenção, etc.)
- Fornecer métricas e insights sobre o engajamento dos leads
- Ajudar a identificar oportunidades de conversão
- Permitir a personalização de mensagens com base em histórico

## Arquitetura

A solução implementada inclui:

1. **Banco de Dados**: Nova tabela `whatsapp_conversations` otimizada para análise
2. **API**: Endpoints para consulta e análise de conversas
3. **Integração**: Captura automática de mensagens enviadas e recebidas
4. **Análise**: Estrutura preparada para processamento por IA

## Banco de Dados

### Tabela Principal: whatsapp_conversations

A tabela foi projetada para armazenar mensagens com campos especializados para análise:

```sql
CREATE TABLE public.whatsapp_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    message_id TEXT NOT NULL, -- ID original da mensagem no WhatsApp
    phone_number TEXT NOT NULL, -- Número do telefone associado
    direction TEXT NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
    content TEXT NOT NULL, -- Conteúdo da mensagem
    media_type TEXT DEFAULT 'text', -- Tipo de mídia: texto, imagem, áudio, vídeo, etc.
    message_status TEXT, -- status: delivered, read, etc.
    message_timestamp TIMESTAMPTZ, -- Timestamp da mensagem no WhatsApp
    
    -- Campos para análise (serão preenchidos pela IA posteriormente)
    sentiment FLOAT, -- Pontuação de sentimento (-1 a 1)
    intent TEXT, -- Intenção detectada (pergunta, reclamação, elogio, etc.)
    response_time_seconds INTEGER, -- Tempo de resposta (para mensagens de saída)
    entities JSONB, -- Entidades extraídas (produtos, datas, valores, etc.)
    tags TEXT[], -- Tags atribuídas pela IA
    
    -- Metadados
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    analyzed_at TIMESTAMPTZ -- Quando foi analisado pela IA
)
```

### Índices e Otimizações

Para garantir desempenho em consultas:

- Índice por lead_id e timestamp (`idx_whatsapp_conv_lead_timestamp`)
- Busca de texto completo via `content_tsv`
- Índices para sentiment e intent para filtragem rápida
- Constraint de unicidade para message_id + lead_id

### Sincronização com Events

Um trigger automático garante que as mensagens salvas na tabela `whatsapp_conversations` sejam também registradas na tabela `lead_events` existente, mantendo a compatibilidade com o sistema atual:

```sql
CREATE OR REPLACE FUNCTION public.sync_whatsapp_message_to_events()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.lead_events (
        lead_id,
        event_type,
        event_data,
        origin,
        created_at
    ) VALUES (
        NEW.lead_id,
        'whatsapp_message',
        jsonb_build_object(
            'message_id', NEW.message_id,
            'direction', NEW.direction,
            'message', NEW.content,
            'timestamp', NEW.message_timestamp,
            'phone_number', NEW.phone_number,
            'media_type', NEW.media_type,
            'message_status', NEW.message_status
        ),
        'whatsapp',
        NEW.created_at
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## Backend

### Serviço de Conversas WhatsApp

O serviço `whatsappConversationsService.ts` fornece as seguintes funcionalidades:

- **Registrar novas mensagens**: Salva mensagens enviadas e recebidas via WhatsApp
- **Consultar conversas**: Recupera mensagens de um lead específico com filtros
- **Calcular estatísticas**: Gera métricas sobre conversas (tempo de resposta, etc.)
- **Atualizar análise**: Permite que a IA atualize os campos de análise

```typescript
// Principais funções do serviço
createWhatsAppConversation(data: CreateWhatsAppConversationInput): Promise<WhatsAppConversation | null>
getWhatsAppConversations(filter: WhatsAppConversationFilter): Promise<WhatsAppConversation[]>
getWhatsAppConversationById(id: string): Promise<WhatsAppConversation | null>
getWhatsAppConversationStats(leadId: string): Promise<WhatsAppConversationStats | null>
getWhatsAppConversationTimeline(leadId: string): Promise<WhatsAppConversation[]>
updateWhatsAppConversationAnalysis(conversationId: string, analysisData: UpdateWhatsAppAnalysisInput): Promise<WhatsAppConversation | null>
calculateResponseTime(leadId: string, messageId: string, messageTimestamp: string): Promise<number | null>
```

### Captura de Mensagens

As mensagens são capturadas automaticamente em dois pontos:

1. **Envio de Mensagens**: No `whatsappController.ts` quando uma mensagem é enviada via API
2. **Recebimento de Mensagens**: No webhook handler quando uma mensagem é recebida

Exemplo de código para captura de mensagens enviadas:

```typescript
// No controller de envio de mensagem
const conversationData = {
  lead_id,
  message_id: messageId,
  phone_number: cleanNumber,
  direction: 'outgoing',
  content: message,
  media_type: 'text',
  message_status: success ? 'sent' : 'error',
  message_timestamp: new Date().toISOString()
};

const savedConversation = await createWhatsAppConversation(conversationData);
```

### Endpoints da API

Os seguintes endpoints foram implementados:

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/whatsapp-conversations/leads/:leadId/conversations` | GET | Lista conversas de um lead específico |
| `/api/whatsapp-conversations/leads/:leadId/conversations/stats` | GET | Estatísticas das conversas do lead |
| `/api/whatsapp-conversations/leads/:leadId/conversations/timeline` | GET | Timeline de conversas em ordem cronológica |
| `/api/whatsapp-conversations/conversations/:id` | GET | Detalhe de uma conversa específica |
| `/api/whatsapp-conversations/conversations/:id/analysis` | PATCH | Atualiza dados de análise da IA |

## Consultas SQL Úteis

### Funções de Database

Criamos duas funções úteis no banco de dados:

1. **get_lead_whatsapp_timeline**: Recupera a linha do tempo de conversa de um lead
2. **get_lead_whatsapp_stats**: Calcula estatísticas de conversas de um lead

```sql
-- Exemplo de uso da função de estatísticas
SELECT * FROM get_lead_whatsapp_stats('123e4567-e89b-12d3-a456-426614174000');

-- Exemplo de uso da função timeline
SELECT * FROM get_lead_whatsapp_timeline('123e4567-e89b-12d3-a456-426614174000');
```

### View para Dashboard

Uma view de análise foi criada para simplificar a geração de dashboards:

```sql
CREATE OR REPLACE VIEW public.whatsapp_conversation_analysis AS
SELECT
    l.id AS lead_id,
    l.name AS lead_name,
    l.email AS lead_email,
    l.phone AS lead_phone,
    l.status AS lead_status,
    COUNT(wc.id) AS total_messages,
    COUNT(*) FILTER (WHERE wc.direction = 'incoming') AS incoming_messages,
    COUNT(*) FILTER (WHERE wc.direction = 'outgoing') AS outgoing_messages,
    AVG(wc.sentiment) AS average_sentiment,
    MIN(wc.message_timestamp) AS first_message,
    MAX(wc.message_timestamp) AS last_message,
    AVG(wc.response_time_seconds) AS avg_response_time_seconds,
    ARRAY_AGG(DISTINCT wc.intent) FILTER (WHERE wc.intent IS NOT NULL) AS detected_intents
FROM
    public.leads l
    LEFT JOIN public.whatsapp_conversations wc ON l.id = wc.lead_id
GROUP BY
    l.id, l.name, l.email, l.phone, l.status;
```

## Implementação da IA (Próximos Passos)

A estrutura foi preparada para implementação de inteligência artificial. Os próximos passos sugeridos são:

1. **Processador de Análise de Sentimento**:
   - Implementar um serviço que processa periodicamente mensagens não analisadas
   - Calcular o sentimento e intenção de cada mensagem
   - Atualizar os campos de análise via API

2. **Extração de Entidades**:
   - Identificar produtos, valores, datas mencionados
   - Detectar reclamações, elogios, dúvidas comuns

3. **Recomendação de Respostas**:
   - Com base no histórico e análise, sugerir respostas para mensagens recebidas
   - Personalizar as sugestões com base no perfil do lead

4. **Lead Scoring Baseado em Conversa**:
   - Calcular um score de engajamento com base nas conversas
   - Identificar leads mais propensos à conversão

## Como Migrar o Banco de Dados

Para aplicar as alterações ao banco de dados Supabase:

```bash
# Navegar até o diretório do projeto
cd /caminho/para/o/projeto

# Executar a migração
supabase db push --db-url=sua_url_supabase

# Ou usar o script auxiliar
./supabase/run-migrations.sh
```

## Exemplos de Uso

### Salvar uma Mensagem

```typescript
const messageData = {
  lead_id: "123e4567-e89b-12d3-a456-426614174000",
  message_id: "wamid.123456789",
  phone_number: "5521987654321",
  direction: "incoming",
  content: "Olá, gostaria de mais informações sobre o projeto X",
  media_type: "text",
  message_timestamp: new Date().toISOString()
};

const savedMessage = await createWhatsAppConversation(messageData);
```

### Atualizar Análise

```typescript
const analysisData = {
  sentiment: 0.75, // Sentimento positivo
  intent: "inquiry", // Intenção: pergunta/consulta
  tags: ["interested", "project_info"],
  entities: {
    projects: ["Projeto X"],
    locations: ["Rio de Janeiro"]
  }
};

await updateWhatsAppConversationAnalysis("message-uuid-here", analysisData);
```

### Consultar Conversas de um Lead

```typescript
const conversations = await getWhatsAppConversations({
  lead_id: "123e4567-e89b-12d3-a456-426614174000",
  start_date: "2023-01-01T00:00:00Z",
  direction: "incoming"
});
```

## Considerações de Segurança

- **Dados Sensíveis**: As mensagens são protegidas pelas mesmas políticas RLS da tabela leads
- **Compartilhamento**: Usuários da mesma empresa têm acesso às conversas relacionadas aos projetos da empresa
- **Acesso via API**: Toda a API requer autenticação via JWT

## Conclusão

O sistema implementado fornece uma base sólida para armazenamento, análise e aproveitamento das conversas de WhatsApp com leads. A estrutura permite fácil extensão para incorporar modelos de IA para análise mais avançada no futuro.

---

## Apêndice: Interfaces TypeScript

```typescript
// Interfaces principais
export interface WhatsAppConversation {
  id?: string;
  lead_id: string;
  message_id: string;
  phone_number: string;
  direction: 'incoming' | 'outgoing';
  content: string;
  media_type?: string;
  message_status?: string;
  message_timestamp: string;
  sentiment?: number;
  intent?: string;
  response_time_seconds?: number;
  entities?: Record<string, any>;
  tags?: string[];
  created_at?: string;
  analyzed_at?: string;
}

export interface WhatsAppConversationStats {
  lead_id: string;
  total_messages: number;
  incoming_messages: number;
  outgoing_messages: number;
  avg_sentiment?: number;
  response_time_avg?: number;
  most_common_intent?: string;
  first_contact_date?: string;
  last_contact_date?: string;
}
```