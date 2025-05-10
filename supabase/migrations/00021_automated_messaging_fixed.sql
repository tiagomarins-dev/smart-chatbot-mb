-- Migração para adicionar suporte a mensagens automatizadas
-- Este arquivo cria as tabelas necessárias para o sistema de mensagens automatizadas com eventos personalizados

-- Extensão para gerar UUIDs (caso ainda não exista)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Função para atualizar a coluna updated_at (caso ainda não exista)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now(); 
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Tabela de templates de mensagens automatizadas
CREATE TABLE IF NOT EXISTS automated_message_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  instructions TEXT NOT NULL,
  example_message TEXT,
  send_delay_minutes INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  lead_score_min INTEGER,
  lead_score_max INTEGER,
  applicable_sentiments TEXT[],
  max_sends_per_lead INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Tabela para registrar eventos disponíveis
CREATE TABLE IF NOT EXISTS event_triggers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  event_code TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_description TEXT,
  capture_points TEXT[],
  required_parameters JSONB DEFAULT '{}'::jsonb,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(project_id, event_code)
);

-- Tabela para mapeamento entre templates e eventos
CREATE TABLE IF NOT EXISTS template_event_mapping (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES automated_message_templates(id) ON DELETE CASCADE,
  event_trigger_id UUID REFERENCES event_triggers(id) ON DELETE CASCADE,
  conditions JSONB DEFAULT '{}'::jsonb,
  priority INTEGER DEFAULT 0,
  UNIQUE(template_id, event_trigger_id)
);

-- Tabela para log de mensagens enviadas
CREATE TABLE IF NOT EXISTS automated_message_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES automated_message_templates(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  message_content TEXT NOT NULL,
  event_data JSONB,
  lead_score_at_time INTEGER,
  lead_sentiment_at_time TEXT,
  response_received BOOLEAN DEFAULT false,
  response_time_minutes INTEGER,
  response_sentiment TEXT
);

-- Trigger para atualizar updated_at na tabela de templates
DROP TRIGGER IF EXISTS set_updated_at ON automated_message_templates;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON automated_message_templates
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- Inserir eventos pré-definidos para os projetos existentes
INSERT INTO event_triggers (project_id, event_code, event_name, event_description, active, created_at)
SELECT 
  id as project_id,
  'resposta_pesquisa' as event_code,
  'Resposta de Pesquisa' as event_name,
  'Quando um lead responde a uma pesquisa de satisfação' as event_description,
  true as active,
  NOW() as created_at
FROM projects
ON CONFLICT (project_id, event_code) DO NOTHING;

INSERT INTO event_triggers (project_id, event_code, event_name, event_description, active, created_at)
SELECT 
  id as project_id,
  'carrinho_abandonado' as event_code,
  'Carrinho Abandonado' as event_name,
  'Quando um lead adiciona itens ao carrinho mas não finaliza a compra' as event_description,
  true as active,
  NOW() as created_at
FROM projects
ON CONFLICT (project_id, event_code) DO NOTHING;

INSERT INTO event_triggers (project_id, event_code, event_name, event_description, active, created_at)
SELECT 
  id as project_id,
  'visualizou_propriedade' as event_code,
  'Visualizou Propriedade' as event_name,
  'Quando um lead visualiza detalhes de uma propriedade específica' as event_description,
  true as active,
  NOW() as created_at
FROM projects
ON CONFLICT (project_id, event_code) DO NOTHING;

INSERT INTO event_triggers (project_id, event_code, event_name, event_description, active, created_at)
SELECT 
  id as project_id,
  'solicitou_informacoes' as event_code,
  'Solicitou Informações' as event_name,
  'Quando um lead preenche um formulário solicitando informações' as event_description,
  true as active,
  NOW() as created_at
FROM projects
ON CONFLICT (project_id, event_code) DO NOTHING;

INSERT INTO event_triggers (project_id, event_code, event_name, event_description, active, created_at)
SELECT 
  id as project_id,
  'visualizou_precos' as event_code,
  'Visualizou Preços' as event_name,
  'Quando um lead acessa informações de preços/condições' as event_description,
  true as active,
  NOW() as created_at
FROM projects
ON CONFLICT (project_id, event_code) DO NOTHING;

INSERT INTO event_triggers (project_id, event_code, event_name, event_description, active, created_at)
SELECT 
  id as project_id,
  'dias_sem_resposta' as event_code,
  'Dias Sem Resposta' as event_name,
  'Evento automático quando o lead fica X dias sem responder' as event_description,
  true as active,
  NOW() as created_at
FROM projects
ON CONFLICT (project_id, event_code) DO NOTHING;

INSERT INTO event_triggers (project_id, event_code, event_name, event_description, active, created_at)
SELECT 
  id as project_id,
  'mudanca_status' as event_code,
  'Mudança de Status' as event_name,
  'Quando o status do lead muda' as event_description,
  true as active,
  NOW() as created_at
FROM projects
ON CONFLICT (project_id, event_code) DO NOTHING;

-- Adicionar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_event_triggers_project_id ON event_triggers(project_id);
CREATE INDEX IF NOT EXISTS idx_automated_message_templates_project_id ON automated_message_templates(project_id);
CREATE INDEX IF NOT EXISTS idx_automated_message_templates_event_type ON automated_message_templates(event_type);
CREATE INDEX IF NOT EXISTS idx_automated_message_logs_lead_id ON automated_message_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_automated_message_logs_template_id ON automated_message_logs(template_id);

-- Adicionar permissões RLS para segurança
ALTER TABLE automated_message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_event_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE automated_message_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para templates
CREATE POLICY "Templates visíveis para membros do projeto"
  ON automated_message_templates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM company_users cu
      JOIN projects p ON p.company_id = cu.company_id
      WHERE p.id = automated_message_templates.project_id
      AND cu.user_id = auth.uid()
    )
  );

CREATE POLICY "Templates editáveis por admins do projeto"
  ON automated_message_templates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM company_users cu
      JOIN projects p ON p.company_id = cu.company_id
      WHERE p.id = automated_message_templates.project_id
      AND cu.user_id = auth.uid()
      AND cu.role IN ('admin', 'owner')
    )
  );

-- Políticas para event_triggers
CREATE POLICY "Eventos visíveis para membros do projeto"
  ON event_triggers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM company_users cu
      JOIN projects p ON p.company_id = cu.company_id
      WHERE p.id = event_triggers.project_id
      AND cu.user_id = auth.uid()
    )
  );

CREATE POLICY "Eventos editáveis por admins do projeto"
  ON event_triggers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM company_users cu
      JOIN projects p ON p.company_id = cu.company_id
      WHERE p.id = event_triggers.project_id
      AND cu.user_id = auth.uid()
      AND cu.role IN ('admin', 'owner')
    )
  );

-- Políticas para logs
CREATE POLICY "Logs visíveis para membros do projeto"
  ON automated_message_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM company_users cu
      JOIN projects p ON p.company_id = cu.company_id
      JOIN lead_project lp ON lp.project_id = p.id
      WHERE lp.lead_id = automated_message_logs.lead_id
      AND cu.user_id = auth.uid()
    )
  );

-- Adicionar campos na tabela de leads para rastreamento de comunicação automatizada
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_automated_message_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS automated_messages_count INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS do_not_contact BOOLEAN DEFAULT false;

-- Habilitar notificações no Supabase para novas mensagens automatizadas
CREATE OR REPLACE FUNCTION notify_new_automated_message()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify(
    'new_automated_message',
    json_build_object(
      'lead_id', NEW.lead_id,
      'template_id', NEW.template_id,
      'message_id', NEW.id,
      'sent_at', NEW.sent_at
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notify_automated_message_sent ON automated_message_logs;
CREATE TRIGGER notify_automated_message_sent
AFTER INSERT ON automated_message_logs
FOR EACH ROW
EXECUTE FUNCTION notify_new_automated_message();

-- Função para contar mensagens automatizadas enviadas para um lead
CREATE OR REPLACE FUNCTION count_automated_messages(lead_id UUID)
RETURNS INTEGER AS $$
DECLARE
  message_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO message_count
  FROM automated_message_logs
  WHERE lead_id = $1;
  
  RETURN message_count;
END;
$$ LANGUAGE plpgsql;

-- Função para verificar se lead é elegível para mensagem automatizada
CREATE OR REPLACE FUNCTION is_lead_eligible_for_automated_message(
  p_lead_id UUID,
  p_template_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_lead RECORD;
  v_template RECORD;
  v_message_count INTEGER;
BEGIN
  -- Buscar dados do lead
  SELECT * INTO v_lead FROM leads WHERE id = p_lead_id;
  
  -- Verificar se lead existe e não está marcado como "não contatar"
  IF v_lead IS NULL OR v_lead.do_not_contact THEN
    RETURN FALSE;
  END IF;
  
  -- Buscar template
  SELECT * INTO v_template FROM automated_message_templates WHERE id = p_template_id;
  
  -- Verificar se template existe e está ativo
  IF v_template IS NULL OR NOT v_template.active THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar restrições de score
  IF v_template.lead_score_min IS NOT NULL AND v_lead.lead_score < v_template.lead_score_min THEN
    RETURN FALSE;
  END IF;
  
  IF v_template.lead_score_max IS NOT NULL AND v_lead.lead_score > v_template.lead_score_max THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar status de sentimento
  IF v_template.applicable_sentiments IS NOT NULL AND 
     array_length(v_template.applicable_sentiments, 1) > 0 AND
     NOT v_lead.sentiment_status = ANY(v_template.applicable_sentiments) THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar limite de envios
  SELECT COUNT(*) INTO v_message_count
  FROM automated_message_logs
  WHERE lead_id = p_lead_id AND template_id = p_template_id;
  
  IF v_message_count >= v_template.max_sends_per_lead THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;