-- Migration: 00010_project_campaign_dates.sql
-- Description: Adiciona datas de início e fim de campanha à tabela de projetos
-- Data: 2025-05-04

-- Adicionar campos de data da campanha à tabela de projetos
ALTER TABLE public.projects
ADD COLUMN campaign_start_date date,
ADD COLUMN campaign_end_date date;

-- Adicionar validação para garantir que a data final seja posterior à data inicial
ALTER TABLE public.projects
ADD CONSTRAINT campaign_dates_check 
CHECK (campaign_end_date IS NULL OR campaign_start_date IS NULL OR campaign_end_date >= campaign_start_date);

-- Adicionar índices para melhorar o desempenho em consultas por data
CREATE INDEX idx_projects_campaign_start_date ON public.projects(campaign_start_date);
CREATE INDEX idx_projects_campaign_end_date ON public.projects(campaign_end_date);