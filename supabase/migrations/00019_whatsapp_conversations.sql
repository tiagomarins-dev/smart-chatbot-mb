-- Migration: 00019_whatsapp_conversations.sql
-- Cria a estrutura para armazenar e analisar conversas via WhatsApp

-- Criação da tabela whatsapp_conversations
CREATE TABLE IF NOT EXISTS public.whatsapp_conversations (
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
    analyzed_at TIMESTAMPTZ, -- Quando foi analisado pela IA
    
    -- Garantir unicidade por mensagem
    UNIQUE(message_id, lead_id)
);

-- Comentários para documentação
COMMENT ON TABLE public.whatsapp_conversations IS 'Armazena mensagens de WhatsApp para análise e IA';
COMMENT ON COLUMN public.whatsapp_conversations.id IS 'Identificador único da mensagem no sistema';
COMMENT ON COLUMN public.whatsapp_conversations.lead_id IS 'Referência ao lead associado';
COMMENT ON COLUMN public.whatsapp_conversations.message_id IS 'ID da mensagem no sistema WhatsApp';
COMMENT ON COLUMN public.whatsapp_conversations.phone_number IS 'Número de telefone associado';
COMMENT ON COLUMN public.whatsapp_conversations.direction IS 'Direção da mensagem (incoming=recebida, outgoing=enviada)';
COMMENT ON COLUMN public.whatsapp_conversations.content IS 'Conteúdo textual da mensagem';
COMMENT ON COLUMN public.whatsapp_conversations.media_type IS 'Tipo de mídia da mensagem';
COMMENT ON COLUMN public.whatsapp_conversations.message_status IS 'Status de entrega da mensagem';
COMMENT ON COLUMN public.whatsapp_conversations.message_timestamp IS 'Timestamp da mensagem no WhatsApp';
COMMENT ON COLUMN public.whatsapp_conversations.sentiment IS 'Análise de sentimento da mensagem (-1 negativo, 0 neutro, 1 positivo)';
COMMENT ON COLUMN public.whatsapp_conversations.intent IS 'Intenção detectada na mensagem';
COMMENT ON COLUMN public.whatsapp_conversations.response_time_seconds IS 'Tempo de resposta para mensagens enviadas';
COMMENT ON COLUMN public.whatsapp_conversations.entities IS 'Entidades extraídas da mensagem (produtos, valores, datas, etc.)';
COMMENT ON COLUMN public.whatsapp_conversations.tags IS 'Tags atribuídas pela análise de IA';
COMMENT ON COLUMN public.whatsapp_conversations.created_at IS 'Data e hora em que a mensagem foi armazenada no sistema';
COMMENT ON COLUMN public.whatsapp_conversations.analyzed_at IS 'Data e hora em que a mensagem foi analisada pela IA';

-- Índices para otimizar consultas frequentes
CREATE INDEX IF NOT EXISTS idx_whatsapp_conv_lead_id ON public.whatsapp_conversations(lead_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conv_direction ON public.whatsapp_conversations(direction);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conv_timestamp ON public.whatsapp_conversations(message_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conv_phone ON public.whatsapp_conversations(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conv_lead_timestamp ON public.whatsapp_conversations(lead_id, message_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conv_sentiment ON public.whatsapp_conversations(sentiment) WHERE sentiment IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_whatsapp_conv_intent ON public.whatsapp_conversations(intent) WHERE intent IS NOT NULL;

-- Ativar busca de texto completo para análise de conteúdo
ALTER TABLE public.whatsapp_conversations ADD COLUMN IF NOT EXISTS content_tsv tsvector 
    GENERATED ALWAYS AS (to_tsvector('portuguese', content)) STORED;
CREATE INDEX IF NOT EXISTS idx_whatsapp_conv_content_tsv ON public.whatsapp_conversations USING GIN (content_tsv);

-- Trigger para sincronizar com a tabela lead_events
CREATE OR REPLACE FUNCTION public.sync_whatsapp_message_to_events()
RETURNS TRIGGER AS $$
BEGIN
    -- Inserir um novo registro na tabela lead_events
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

CREATE TRIGGER trigger_sync_whatsapp_message_to_events
AFTER INSERT ON public.whatsapp_conversations
FOR EACH ROW
EXECUTE FUNCTION public.sync_whatsapp_message_to_events();

-- Função para obter a linha do tempo de conversas de um lead
CREATE OR REPLACE FUNCTION public.get_lead_whatsapp_timeline(lead_id_param UUID)
RETURNS TABLE (
    id UUID,
    message_id TEXT,
    direction TEXT,
    content TEXT,
    media_type TEXT,
    message_timestamp TIMESTAMPTZ,
    sentiment FLOAT,
    intent TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wc.id,
        wc.message_id,
        wc.direction,
        wc.content,
        wc.media_type,
        wc.message_timestamp,
        wc.sentiment,
        wc.intent
    FROM 
        public.whatsapp_conversations wc
    WHERE 
        wc.lead_id = lead_id_param
    ORDER BY 
        wc.message_timestamp ASC;
END;
$$ LANGUAGE plpgsql;

-- Função para obter estatísticas de conversa
CREATE OR REPLACE FUNCTION public.get_lead_whatsapp_stats(lead_id_param UUID)
RETURNS TABLE (
    total_messages INTEGER,
    incoming_messages INTEGER,
    outgoing_messages INTEGER,
    avg_sentiment FLOAT,
    response_time_avg INTEGER,
    most_common_intent TEXT,
    first_contact_date TIMESTAMPTZ,
    last_contact_date TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::INTEGER AS total_messages,
        COUNT(*) FILTER (WHERE direction = 'incoming')::INTEGER AS incoming_messages,
        COUNT(*) FILTER (WHERE direction = 'outgoing')::INTEGER AS outgoing_messages,
        AVG(sentiment) AS avg_sentiment,
        AVG(response_time_seconds)::INTEGER AS response_time_avg,
        (
            SELECT intent
            FROM (
                SELECT intent, COUNT(*) AS count
                FROM public.whatsapp_conversations
                WHERE lead_id = lead_id_param AND intent IS NOT NULL
                GROUP BY intent
                ORDER BY count DESC
                LIMIT 1
            ) AS intents
        ) AS most_common_intent,
        MIN(message_timestamp) AS first_contact_date,
        MAX(message_timestamp) AS last_contact_date
    FROM
        public.whatsapp_conversations
    WHERE
        lead_id = lead_id_param;
END;
$$ LANGUAGE plpgsql;

-- Permissões RLS (Row Level Security)
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;

-- Política para usuários autenticados - baseada na posse do lead
CREATE POLICY whatsapp_conversations_user_policy ON public.whatsapp_conversations
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.leads l
            WHERE l.id = whatsapp_conversations.lead_id 
            AND l.user_id = auth.uid()
        )
    );

-- Política para acesso via empresa - para usuários que são membros da empresa que possui o projeto
CREATE POLICY whatsapp_conversations_company_policy ON public.whatsapp_conversations
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.leads l
            JOIN public.lead_project lp ON l.id = lp.lead_id
            JOIN public.projects p ON lp.project_id = p.id
            JOIN public.company_users cu ON p.company_id = cu.company_id
            WHERE l.id = whatsapp_conversations.lead_id
            AND cu.user_id = auth.uid()
        )
    );

-- Permissões para os papéis
GRANT ALL ON public.whatsapp_conversations TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.whatsapp_conversations TO authenticated;

-- View para análise rápida de conversas
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

-- Comentário na view
COMMENT ON VIEW public.whatsapp_conversation_analysis IS 'Visão agregada de análise de conversas por lead para dashboard e relatórios';