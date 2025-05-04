-- Migration: 00007_api_webhooks_delivery.sql
-- Description: Sistema para entrega confiável de webhooks
-- Data: 2025-05-04

-- Tabela para rastrear entregas de webhooks
create table public.webhook_deliveries (
  id uuid default uuid_generate_v4() primary key,
  webhook_id uuid references public.webhooks not null,
  event_type text not null,
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'success', 'failed', 'retrying')),
  attempts integer not null default 0,
  next_attempt_at timestamp with time zone,
  last_response_code integer,
  last_response_body text,
  error_message text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  completed_at timestamp with time zone
);

-- Índices para processamento eficiente
create index idx_webhook_deliveries_webhook_id on public.webhook_deliveries(webhook_id);
create index idx_webhook_deliveries_status on public.webhook_deliveries(status);
create index idx_webhook_deliveries_next_attempt_at on public.webhook_deliveries(next_attempt_at);

-- Habilitar RLS
alter table public.webhook_deliveries enable row level security;

-- Policies para entregas de webhooks
create policy "Usuários podem ver entregas dos seus webhooks"
  on public.webhook_deliveries
  for select
  using (
    exists (
      select 1 from public.webhooks w
      where w.id = webhook_id and w.user_id = auth.uid()
    )
  );

-- Função para calcular o próximo horário de tentativa com backoff exponencial
create or replace function public.calculate_next_retry_time(p_attempts integer)
returns timestamp with time zone as $$
declare
  -- Backoff exponencial: 30s, 2m, 8m, 32m, 2h8m, 8h32m
  v_delay interval;
  v_max_attempts integer := 6;  -- Máximo de 6 tentativas
begin
  if p_attempts >= v_max_attempts then
    return null;  -- Sem mais tentativas
  end if;
  
  -- Cálculo de backoff exponencial: 30s * 4^(tentativa-1)
  v_delay := (30 * power(4, p_attempts - 1)) * interval '1 second';
  
  return now() + v_delay;
end;
$$ language plpgsql;

-- Função para criar uma entrega de webhook
create or replace function public.create_webhook_delivery(
  p_webhook_id uuid, 
  p_event_type text, 
  p_payload jsonb
)
returns uuid as $$
declare
  v_delivery_id uuid;
  v_is_active boolean;
begin
  -- Verificar se o webhook está ativo
  select is_active into v_is_active
  from public.webhooks
  where id = p_webhook_id;
  
  if not v_is_active then
    return null;  -- Webhook inativo, não criar entrega
  end if;
  
  -- Criar registro de entrega
  insert into public.webhook_deliveries (
    webhook_id, event_type, payload, next_attempt_at
  ) values (
    p_webhook_id, p_event_type, p_payload, now()
  ) returning id into v_delivery_id;
  
  -- Atualizar timestamp do último disparo do webhook
  update public.webhooks
  set last_triggered_at = now()
  where id = p_webhook_id;
  
  return v_delivery_id;
end;
$$ language plpgsql security definer;

-- Função para marcar uma entrega como concluída
create or replace function public.complete_webhook_delivery(
  p_delivery_id uuid, 
  p_status text, 
  p_response_code integer,
  p_response_body text,
  p_error_message text default null
)
returns void as $$
begin
  update public.webhook_deliveries
  set 
    status = p_status,
    last_response_code = p_response_code,
    last_response_body = p_response_body,
    error_message = p_error_message,
    completed_at = case when p_status = 'success' then now() else null end,
    updated_at = now(),
    next_attempt_at = case 
      when p_status = 'failed' then 
        public.calculate_next_retry_time(attempts + 1)
      else 
        null
      end,
    attempts = case 
      when p_status = 'failed' then 
        attempts + 1
      else 
        attempts
      end
  where id = p_delivery_id;
end;
$$ language plpgsql security definer;

-- View para exibir webhooks pendentes de entrega
create or replace view public.pending_webhook_deliveries as
select 
  d.id as delivery_id,
  w.id as webhook_id,
  w.user_id,
  w.url,
  w.secret_token,
  d.event_type,
  d.payload,
  d.attempts,
  d.next_attempt_at
from 
  public.webhook_deliveries d
  join public.webhooks w on d.webhook_id = w.id
where 
  d.status in ('pending', 'retrying')
  and d.next_attempt_at <= now()
  and w.is_active = true
order by 
  d.next_attempt_at asc;