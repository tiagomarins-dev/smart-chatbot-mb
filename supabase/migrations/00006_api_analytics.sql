-- Migration: 00006_api_analytics.sql
-- Description: Esquema para analytics da API
-- Data: 2025-05-04

-- Tabela para estatísticas agregadas diárias da API
create table public.api_daily_stats (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  api_key_id uuid references public.api_keys,
  date date not null,
  total_requests integer not null default 0,
  successful_requests integer not null default 0,
  failed_requests integer not null default 0,
  avg_response_time_ms numeric(10,2) not null default 0,
  unique_endpoints integer not null default 0,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  unique(user_id, api_key_id, date)
);

-- Índices para estatísticas
create index idx_api_daily_stats_user_id on public.api_daily_stats(user_id);
create index idx_api_daily_stats_api_key_id on public.api_daily_stats(api_key_id);
create index idx_api_daily_stats_date on public.api_daily_stats(date);

-- Habilitar RLS
alter table public.api_daily_stats enable row level security;

-- Policies para estatísticas
create policy "Usuários podem ver suas estatísticas"
  on public.api_daily_stats
  for select
  using (auth.uid() = user_id);

-- Tabela para armazenar uso de endpoints por hora
create table public.api_endpoint_usage (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  api_key_id uuid references public.api_keys,
  endpoint text not null,
  method text not null,
  hour timestamp with time zone not null,
  request_count integer not null default 0,
  avg_response_time_ms numeric(10,2) not null default 0,
  error_count integer not null default 0,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  unique(user_id, api_key_id, endpoint, method, hour)
);

-- Índices para uso de endpoints
create index idx_api_endpoint_usage_user_id on public.api_endpoint_usage(user_id);
create index idx_api_endpoint_usage_api_key_id on public.api_endpoint_usage(api_key_id);
create index idx_api_endpoint_usage_endpoint on public.api_endpoint_usage(endpoint);
create index idx_api_endpoint_usage_hour on public.api_endpoint_usage(hour);

-- Habilitar RLS
alter table public.api_endpoint_usage enable row level security;

-- Policies para uso de endpoints
create policy "Usuários podem ver uso de seus endpoints"
  on public.api_endpoint_usage
  for select
  using (auth.uid() = user_id);

-- Visão para agregação mensal de métricas
create or replace view public.api_monthly_metrics as
select
  user_id,
  api_key_id,
  date_trunc('month', date) as month,
  sum(total_requests) as total_requests,
  sum(successful_requests) as successful_requests,
  sum(failed_requests) as failed_requests,
  avg(avg_response_time_ms) as avg_response_time_ms,
  count(distinct date) as active_days
from
  public.api_daily_stats
group by
  user_id, api_key_id, date_trunc('month', date);

-- Função para atualizar estatísticas de uso com base nos logs
create or replace function public.update_api_statistics()
returns void as $$
declare
  v_today date;
  v_hour timestamp with time zone;
begin
  v_today := current_date;
  v_hour := date_trunc('hour', now());
  
  -- Atualizar estatísticas diárias
  insert into public.api_daily_stats (
    user_id, api_key_id, date, total_requests, successful_requests, 
    failed_requests, avg_response_time_ms, unique_endpoints
  )
  select
    a.user_id,
    l.api_key_id,
    current_date,
    count(*),
    count(*) filter (where l.status_code < 400),
    count(*) filter (where l.status_code >= 400),
    avg(l.response_time_ms),
    count(distinct l.endpoint)
  from
    public.api_usage_logs l
    join public.api_keys a on l.api_key_id = a.id
  where
    l.created_at >= v_today and l.created_at < v_today + interval '1 day'
  group by
    a.user_id, l.api_key_id
  on conflict (user_id, api_key_id, date) do update set
    total_requests = excluded.total_requests,
    successful_requests = excluded.successful_requests,
    failed_requests = excluded.failed_requests,
    avg_response_time_ms = excluded.avg_response_time_ms,
    unique_endpoints = excluded.unique_endpoints,
    updated_at = now();
    
  -- Atualizar uso de endpoints por hora
  insert into public.api_endpoint_usage (
    user_id, api_key_id, endpoint, method, hour, 
    request_count, avg_response_time_ms, error_count
  )
  select
    a.user_id,
    l.api_key_id,
    l.endpoint,
    l.method,
    v_hour,
    count(*),
    avg(l.response_time_ms),
    count(*) filter (where l.status_code >= 400)
  from
    public.api_usage_logs l
    join public.api_keys a on l.api_key_id = a.id
  where
    l.created_at >= v_hour and l.created_at < v_hour + interval '1 hour'
  group by
    a.user_id, l.api_key_id, l.endpoint, l.method
  on conflict (user_id, api_key_id, endpoint, method, hour) do update set
    request_count = excluded.request_count,
    avg_response_time_ms = excluded.avg_response_time_ms,
    error_count = excluded.error_count,
    updated_at = now();
end;
$$ language plpgsql security definer;