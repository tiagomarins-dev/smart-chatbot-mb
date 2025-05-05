-- Criar tabela de leads
-- Nota: A referência é para public.profiles, não auth.users
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- Referência para public.profiles
    name TEXT NOT NULL,
    first_name TEXT,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    status TEXT DEFAULT 'novo',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT leads_email_user_unique UNIQUE (email, user_id)
);

-- Criar tabela de relação entre leads e projetos
CREATE TABLE IF NOT EXISTS public.lead_project (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_term TEXT,
    utm_content TEXT,
    captured_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT lead_project_unique UNIQUE (lead_id, project_id)
);

-- Adicionar índices para melhorar performance de consultas comuns
CREATE INDEX IF NOT EXISTS leads_user_id_idx ON public.leads(user_id);
CREATE INDEX IF NOT EXISTS leads_email_idx ON public.leads(email);
CREATE INDEX IF NOT EXISTS leads_status_idx ON public.leads(status);
CREATE INDEX IF NOT EXISTS lead_project_lead_id_idx ON public.lead_project(lead_id);
CREATE INDEX IF NOT EXISTS lead_project_project_id_idx ON public.lead_project(project_id);

-- Configurar RLS (Row Level Security) para tabela de leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver apenas seus próprios leads"
    ON public.leads FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios leads"
    ON public.leads FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios leads"
    ON public.leads FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir seus próprios leads"
    ON public.leads FOR DELETE
    USING (auth.uid() = user_id);

-- Configurar RLS para tabela de relação lead_project
ALTER TABLE public.lead_project ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver apenas suas próprias relações lead-projeto"
    ON public.lead_project FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.leads l
            WHERE l.id = lead_id AND l.user_id = auth.uid()
        )
    );

CREATE POLICY "Usuários podem inserir relações para seus próprios leads e projetos"
    ON public.lead_project FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.leads l
            WHERE l.id = lead_id AND l.user_id = auth.uid()
        ) AND
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = project_id AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Usuários podem atualizar relações para seus próprios leads e projetos"
    ON public.lead_project FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.leads l
            WHERE l.id = lead_id AND l.user_id = auth.uid()
        ) AND
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = project_id AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Usuários podem excluir relações para seus próprios leads e projetos"
    ON public.lead_project FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.leads l
            WHERE l.id = lead_id AND l.user_id = auth.uid()
        )
    );

-- Garantir que o serviço service_role tenha acesso total
GRANT ALL ON public.leads TO service_role;
GRANT ALL ON public.lead_project TO service_role;

-- Permitir que usuários autenticados acessem as tabelas (RLS aplicará as restrições)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_project TO authenticated;

-- Trigger para atualizar a coluna updated_at automaticamente quando os dados forem alterados
-- Tabela para registro de histórico de alterações de status de leads
-- Nota: A referência é para public.profiles, não auth.users
CREATE TABLE IF NOT EXISTS public.lead_status_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- Referência para public.profiles
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Adicionar índices para melhorar performance de consultas
CREATE INDEX IF NOT EXISTS lead_status_logs_lead_id_idx ON public.lead_status_logs(lead_id);
CREATE INDEX IF NOT EXISTS lead_status_logs_user_id_idx ON public.lead_status_logs(user_id);
CREATE INDEX IF NOT EXISTS lead_status_logs_created_at_idx ON public.lead_status_logs(created_at);

-- Configurar RLS para tabela de logs
ALTER TABLE public.lead_status_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver apenas seus próprios logs"
    ON public.lead_status_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios logs"
    ON public.lead_status_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Trigger para atualizar a coluna updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();