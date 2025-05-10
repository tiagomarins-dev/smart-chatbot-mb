-- Migration: 00020_lead_sentiment_analysis.sql
-- Adiciona campos para armazenar análise de sentimento dos leads

-- Adicionando campos à tabela leads para armazenar análise de sentimento
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS sentiment_status TEXT;
COMMENT ON COLUMN public.leads.sentiment_status IS 'Status de interesse do lead: interessado, sem interesse, compra futura, achou caro, quer desconto, parcelamento';

-- Criar um tipo ENUM para garantir a consistência dos status
-- Nota: Em alguns casos, é preferível usar CHECK constraint em vez de ENUM para maior flexibilidade
ALTER TABLE public.leads ADD CONSTRAINT lead_sentiment_status_check
CHECK (
    sentiment_status IS NULL OR
    sentiment_status IN (
        'interessado',
        'sem interesse',
        'compra futura',
        'achou caro',
        'quer desconto',
        'parcelamento',
        'indeterminado'
    )
);

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS lead_score INTEGER;
COMMENT ON COLUMN public.leads.lead_score IS 'Pontuação de 0 a 100 indicando a proximidade de compra';

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS ai_analysis TEXT;
COMMENT ON COLUMN public.leads.ai_analysis IS 'Análise detalhada da IA sobre o sentimento do lead e estratégias de vendas';

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS last_sentiment_update TIMESTAMPTZ;
COMMENT ON COLUMN public.leads.last_sentiment_update IS 'Timestamp da última atualização de análise de sentimento';

-- Adicionando um índice para facilitar a busca de leads por sentiment_status
CREATE INDEX IF NOT EXISTS idx_leads_sentiment_status ON public.leads(sentiment_status);

-- Adicionando um índice para ordenar leads por score
CREATE INDEX IF NOT EXISTS idx_leads_score ON public.leads(lead_score DESC);

-- Criando uma View para relatórios de sentimento de leads
CREATE OR REPLACE VIEW public.lead_sentiment_report AS
SELECT
    l.id,
    l.name,
    l.email,
    l.phone,
    l.sentiment_status,
    l.lead_score,
    l.status AS lead_status,
    lp.project_id,
    p.name AS project_name,
    l.last_sentiment_update,
    (
        SELECT COUNT(*)
        FROM public.whatsapp_conversations wc
        WHERE wc.lead_id = l.id
    ) AS total_messages,
    (
        SELECT COUNT(*)
        FROM public.whatsapp_conversations wc
        WHERE wc.lead_id = l.id AND wc.direction = 'incoming'
    ) AS incoming_messages,
    (
        SELECT COUNT(*)
        FROM public.whatsapp_conversations wc
        WHERE wc.lead_id = l.id AND wc.direction = 'outgoing'
    ) AS outgoing_messages,
    (
        SELECT MAX(wc.created_at)
        FROM public.whatsapp_conversations wc
        WHERE wc.lead_id = l.id
    ) AS last_message_date
FROM
    public.leads l
    LEFT JOIN public.lead_project lp ON l.id = lp.lead_id
    LEFT JOIN public.projects p ON lp.project_id = p.id
WHERE
    l.sentiment_status IS NOT NULL;

COMMENT ON VIEW public.lead_sentiment_report IS 'Relatório de sentimento e engajamento de leads com base na análise de IA';

-- Função para selecionar leads prioritários para contato
CREATE OR REPLACE FUNCTION public.get_priority_leads(limit_count INTEGER DEFAULT 5)
RETURNS TABLE (
    id UUID,
    name TEXT,
    phone TEXT,
    email TEXT,
    lead_score INTEGER,
    sentiment_status TEXT,
    ai_analysis TEXT,
    last_message_date TIMESTAMPTZ,
    project_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        l.id,
        l.name,
        l.phone,
        l.email,
        l.lead_score,
        l.sentiment_status,
        l.ai_analysis,
        (
            SELECT MAX(wc.created_at)
            FROM public.whatsapp_conversations wc
            WHERE wc.lead_id = l.id
        ) AS last_message_date,
        p.name AS project_name
    FROM
        public.leads l
        LEFT JOIN public.lead_project lp ON l.id = lp.lead_id
        LEFT JOIN public.projects p ON lp.project_id = p.id
    WHERE
        l.lead_score > 60 AND
        l.sentiment_status IN ('interessado', 'compra futura', 'quer desconto', 'parcelamento')
    ORDER BY
        l.lead_score DESC,
        last_message_date DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.get_priority_leads IS 'Retorna leads prioritários para contato com base na análise de sentimento';

-- Conceder permissões
GRANT SELECT ON public.lead_sentiment_report TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_priority_leads TO authenticated;