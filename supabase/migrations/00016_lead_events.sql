-- Migration: 00016_lead_events.sql
-- Cria a tabela lead_events para rastrear o histórico completo de atividades de um lead

-- Criação da tabela para usuários de empresas se ainda não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'company_users') THEN
        CREATE TABLE public.company_users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            role TEXT NOT NULL DEFAULT 'member',
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            UNIQUE(company_id, user_id)
        );
        
        -- Índices
        CREATE INDEX idx_company_users_company_id ON public.company_users(company_id);
        CREATE INDEX idx_company_users_user_id ON public.company_users(user_id);
        
        -- Habilitar RLS
        ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;
        
        -- Políticas de acesso
        CREATE POLICY "Donos de empresas podem gerenciar usuários"
            ON public.company_users
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM public.companies
                    WHERE id = company_users.company_id 
                    AND user_id = auth.uid()
                )
            );
            
        CREATE POLICY "Usuários podem ver empresas às quais pertencem"
            ON public.company_users
            FOR SELECT
            USING (user_id = auth.uid());
            
        -- Permissões
        GRANT ALL ON public.company_users TO service_role;
        GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_users TO authenticated;
        
        -- Comentários
        COMMENT ON TABLE public.company_users IS 'Relação entre usuários e empresas para acesso compartilhado';
    END IF;
END
$$;

-- Criação da tabela lead_events
CREATE TABLE IF NOT EXISTS public.lead_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    origin TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Comentários para documentação da tabela e colunas
COMMENT ON TABLE public.lead_events IS 'Registra o histórico completo de atividades de um lead ao longo da campanha';
COMMENT ON COLUMN public.lead_events.id IS 'Identificador único do evento';
COMMENT ON COLUMN public.lead_events.lead_id IS 'Referência ao lead associado a este evento';
COMMENT ON COLUMN public.lead_events.event_type IS 'Tipo do evento (ex: whatsapp_message, form_submit, click, checkout)';
COMMENT ON COLUMN public.lead_events.event_data IS 'Dados específicos do evento em formato JSON';
COMMENT ON COLUMN public.lead_events.origin IS 'Origem do evento (ex: whatsapp, landing_page, checkout)';
COMMENT ON COLUMN public.lead_events.created_at IS 'Data e hora em que o evento foi registrado';

-- Criação de índices para otimizar consultas frequentes
CREATE INDEX IF NOT EXISTS idx_lead_events_lead_id ON public.lead_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_events_event_type ON public.lead_events(event_type);
CREATE INDEX IF NOT EXISTS idx_lead_events_origin ON public.lead_events(origin);
CREATE INDEX IF NOT EXISTS idx_lead_events_created_at ON public.lead_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_events_lead_created ON public.lead_events(lead_id, created_at DESC);

-- Permissões RLS (Row Level Security)
ALTER TABLE public.lead_events ENABLE ROW LEVEL SECURITY;

-- Política para usuários autenticados - baseada na posse do lead
CREATE POLICY lead_events_user_policy ON public.lead_events
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.leads l
            WHERE l.id = lead_events.lead_id 
            AND l.user_id = auth.uid()
        )
    );

-- Política para acesso via empresa - para usuários que são membros da empresa que possui o projeto
CREATE POLICY lead_events_company_policy ON public.lead_events
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.leads l
            JOIN public.lead_project lp ON l.id = lp.lead_id
            JOIN public.projects p ON lp.project_id = p.id
            JOIN public.company_users cu ON p.company_id = cu.company_id
            WHERE l.id = lead_events.lead_id
            AND cu.user_id = auth.uid()
        )
    );

-- Permissões para o papel de serviço
GRANT ALL ON public.lead_events TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_events TO authenticated;

-- Exemplos de consultas comuns (como comentários para referência)

/*
-- 1. Obter todos os eventos de um lead específico, ordenados por data de criação
SELECT * FROM public.lead_events
WHERE lead_id = '00000000-0000-0000-0000-000000000000'
ORDER BY created_at DESC;

-- 2. Contar eventos por tipo para um lead específico
SELECT event_type, COUNT(*) 
FROM public.lead_events
WHERE lead_id = '00000000-0000-0000-0000-000000000000'
GROUP BY event_type
ORDER BY COUNT(*) DESC;

-- 3. Obter eventos de um lead de uma origem específica
SELECT * FROM public.lead_events
WHERE lead_id = '00000000-0000-0000-0000-000000000000'
AND origin = 'whatsapp'
ORDER BY created_at DESC;

-- 4. Buscar o último evento de um determinado tipo para cada lead
SELECT DISTINCT ON (lead_id) lead_id, event_type, event_data, created_at
FROM public.lead_events
WHERE event_type = 'whatsapp_message'
ORDER BY lead_id, created_at DESC;

-- 5. Obter leads que tiveram um evento específico nos últimos 7 dias
SELECT DISTINCT l.* 
FROM public.leads l
JOIN public.lead_events e ON l.id = e.lead_id
WHERE e.event_type = 'checkout'
AND e.created_at >= NOW() - INTERVAL '7 days';

-- 6. Análise de funil - Contar leads por estágio do funil com base nos eventos
SELECT 
    COUNT(DISTINCT CASE WHEN event_type = 'view' THEN lead_id END) as views,
    COUNT(DISTINCT CASE WHEN event_type = 'form_submit' THEN lead_id END) as form_submits,
    COUNT(DISTINCT CASE WHEN event_type = 'checkout_start' THEN lead_id END) as checkout_starts,
    COUNT(DISTINCT CASE WHEN event_type = 'purchase' THEN lead_id END) as purchases
FROM public.lead_events
WHERE created_at BETWEEN '2023-01-01' AND '2023-01-31';
*/