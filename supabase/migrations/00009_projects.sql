-- Migration: 00009_projects.sql
-- Description: Tabela de projetos para gerenciamento de leads
-- Data: 2025-05-04

-- Tabela de projetos
CREATE TABLE public.projects (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id uuid REFERENCES public.companies NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Índices
CREATE INDEX idx_projects_company_id ON public.projects(company_id);
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_projects_name ON public.projects(name);

-- Habilitar RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Policies para projetos
CREATE POLICY "Usuários podem gerenciar seus próprios projetos"
  ON public.projects
  FOR ALL
  USING (auth.uid() = user_id);

-- Policy para vincular projetos apenas a empresas do usuário
CREATE POLICY "Projetos só podem ser vinculados a empresas do usuário"
  ON public.projects
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.companies
      WHERE id = projects.company_id AND user_id = auth.uid()
    )
  );

-- Função para atualizar o timestamp updated_at
CREATE OR REPLACE FUNCTION public.update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar o timestamp updated_at
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_projects_updated_at();