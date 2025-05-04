-- Migration: 00008_companies.sql
-- Description: Tabela de empresas para gerenciamento de leads
-- Data: 2025-05-04

-- Tabela de empresas
CREATE TABLE public.companies (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Índices
CREATE INDEX idx_companies_user_id ON public.companies(user_id);
CREATE INDEX idx_companies_name ON public.companies(name);

-- Habilitar RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Policies para empresas
CREATE POLICY "Usuários podem gerenciar suas próprias empresas"
  ON public.companies
  FOR ALL
  USING (auth.uid() = user_id);

-- Função para atualizar o timestamp updated_at
CREATE OR REPLACE FUNCTION public.update_companies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar o timestamp updated_at
CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.update_companies_updated_at();