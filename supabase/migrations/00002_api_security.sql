-- Migration: 00002_api_security.sql
-- Description: Configuração para segurança da API
-- Data: 2025-05-04

-- Tabela para armazenar credenciais de API 
create table public.api_keys (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  key_value text not null,
  secret_hash text not null,
  permissions jsonb not null default '[]'::jsonb,
  rate_limit integer not null default 100,
  is_active boolean not null default true,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  expires_at timestamp with time zone,
  last_used_at timestamp with time zone
);

-- Índice para busca por chave
create index idx_api_keys_key_value on public.api_keys(key_value);
create index idx_api_keys_user_id on public.api_keys(user_id);

-- Habilitar RLS
alter table public.api_keys enable row level security;

-- Policies para api_keys
create policy "Usuários podem visualizar suas próprias chaves de API"
  on public.api_keys
  for select
  using (auth.uid() = user_id);

create policy "Usuários podem criar suas próprias chaves de API"
  on public.api_keys
  for insert
  with check (auth.uid() = user_id);

create policy "Usuários podem atualizar suas próprias chaves de API"
  on public.api_keys
  for update
  using (auth.uid() = user_id);

create policy "Usuários podem excluir suas próprias chaves de API"
  on public.api_keys
  for delete
  using (auth.uid() = user_id);

-- Função para verificar credenciais de API
create or replace function public.verify_api_credentials(p_key text, p_secret text)
returns uuid as $$
declare
  v_api_key record;
  v_user_id uuid;
begin
  -- Buscar registro da chave
  select * into v_api_key from public.api_keys 
  where key_value = p_key and is_active = true 
  and (expires_at is null or expires_at > now());
  
  -- Verificar se a chave existe
  if v_api_key.id is null then
    return null;
  end if;
  
  -- Verificar o secret (na implementação real, verificaria o hash)
  -- NOTA: Esta é uma simplificação. Na prática, você usaria crypt() para verificar o hash
  if v_api_key.secret_hash != p_secret then
    return null;
  end if;
  
  -- Atualizar última utilização
  update public.api_keys set last_used_at = now() where id = v_api_key.id;
  
  -- Retornar o user_id associado
  return v_api_key.user_id;
end;
$$ language plpgsql security definer;

-- Tabela para log de uso da API
create table public.api_usage_logs (
  id uuid default uuid_generate_v4() primary key,
  api_key_id uuid references public.api_keys not null,
  endpoint text not null,
  method text not null,
  status_code integer not null,
  response_time_ms integer not null,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone default now() not null
);

-- Índice para busca de logs
create index idx_api_usage_logs_api_key_id on public.api_usage_logs(api_key_id);
create index idx_api_usage_logs_created_at on public.api_usage_logs(created_at);

-- Habilitar RLS
alter table public.api_usage_logs enable row level security;

-- Apenas administradores e o próprio usuário podem ver logs
create policy "Usuários podem visualizar seus próprios logs de API"
  on public.api_usage_logs
  for select
  using (auth.uid() in (
    select user_id from public.api_keys where id = api_key_id
  ));