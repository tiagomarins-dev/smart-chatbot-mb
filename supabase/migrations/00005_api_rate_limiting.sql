-- Migration: 00005_api_rate_limiting.sql
-- Description: Configuração de limite de taxa para API
-- Data: 2025-05-04

-- Tabela para controle de requisições por minuto
create table public.api_rate_limits (
  id uuid default uuid_generate_v4() primary key,
  api_key_id uuid references public.api_keys not null,
  minute_timestamp timestamp with time zone not null,
  request_count integer not null default 1,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  unique(api_key_id, minute_timestamp)
);

-- Índices para limites de taxa
create index idx_api_rate_limits_api_key_id on public.api_rate_limits(api_key_id);
create index idx_api_rate_limits_minute_timestamp on public.api_rate_limits(minute_timestamp);

-- Habilitar RLS
alter table public.api_rate_limits enable row level security;

-- Função para verificar e atualizar limite de taxa
create or replace function public.check_api_rate_limit(p_api_key_id uuid)
returns boolean as $$
declare
  v_current_minute timestamp with time zone;
  v_rate_limit integer;
  v_current_count integer;
begin
  -- Obter o limite de taxa para esta chave
  select rate_limit into v_rate_limit 
  from public.api_keys
  where id = p_api_key_id;
  
  -- Truncar para o minuto atual
  v_current_minute := date_trunc('minute', now());
  
  -- Verificar ou criar registro para este minuto
  insert into public.api_rate_limits (api_key_id, minute_timestamp, request_count)
  values (p_api_key_id, v_current_minute, 1)
  on conflict (api_key_id, minute_timestamp)
  do update set 
    request_count = public.api_rate_limits.request_count + 1,
    updated_at = now()
  returning request_count into v_current_count;
  
  -- Verificar se excedeu o limite
  return v_current_count <= v_rate_limit;
end;
$$ language plpgsql security definer;

-- Criar job para limpar registros antigos de limite de taxa
create or replace function public.cleanup_old_rate_limits()
returns void as $$
begin
  -- Remover registros mais antigos que 24 horas
  delete from public.api_rate_limits
  where minute_timestamp < now() - interval '24 hours';
end;
$$ language plpgsql security definer;

-- Configurar mecanismo de blacklist para IPs abusivos
create table public.api_blacklist (
  id uuid default uuid_generate_v4() primary key,
  ip_address text not null unique,
  reason text not null,
  is_permanent boolean not null default false,
  expires_at timestamp with time zone,
  created_at timestamp with time zone default now() not null,
  created_by uuid references auth.users
);

-- Índice para busca rápida de IPs
create index idx_api_blacklist_ip_address on public.api_blacklist(ip_address);

-- Função para verificar se um IP está na blacklist
create or replace function public.is_ip_blacklisted(p_ip_address text)
returns boolean as $$
begin
  return exists (
    select 1 from public.api_blacklist
    where ip_address = p_ip_address
    and (
      is_permanent = true
      or (is_permanent = false and expires_at > now())
    )
  );
end;
$$ language plpgsql security definer;