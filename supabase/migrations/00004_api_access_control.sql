-- Migration: 00004_api_access_control.sql
-- Description: Controle de acesso granular para API
-- Data: 2025-05-04

-- Enum para níveis de permissão
create type permission_level as enum ('read', 'write', 'admin');

-- Tabela para definir escopos de API
create table public.api_scopes (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  description text not null,
  resource text not null,
  permission permission_level not null default 'read',
  created_at timestamp with time zone default now() not null
);

-- Inserir escopos padrão
insert into public.api_scopes (name, description, resource, permission) values
('messages:read', 'Ler mensagens', 'messages', 'read'),
('messages:write', 'Enviar mensagens', 'messages', 'write'),
('contacts:read', 'Ler contatos', 'contacts', 'read'),
('contacts:write', 'Gerenciar contatos', 'contacts', 'write'),
('status:read', 'Ler status da conexão', 'status', 'read'),
('webhooks:manage', 'Gerenciar webhooks', 'webhooks', 'admin');

-- Tabela de relação entre chaves de API e escopos
create table public.api_key_scopes (
  id uuid default uuid_generate_v4() primary key,
  api_key_id uuid references public.api_keys not null,
  scope_id uuid references public.api_scopes not null,
  created_at timestamp with time zone default now() not null,
  unique(api_key_id, scope_id)
);

-- Índices para relacionamento
create index idx_api_key_scopes_api_key_id on public.api_key_scopes(api_key_id);
create index idx_api_key_scopes_scope_id on public.api_key_scopes(scope_id);

-- Habilitar RLS
alter table public.api_key_scopes enable row level security;

-- Policies para atribuição de escopos
create policy "Usuários podem gerenciar escopos das suas próprias chaves"
  on public.api_key_scopes
  for all
  using (
    auth.uid() in (
      select user_id from public.api_keys where id = api_key_id
    )
  );

-- Função para verificar se uma chave API tem determinado escopo
create or replace function public.api_key_has_scope(p_key_id uuid, p_scope_name text)
returns boolean as $$
begin
  return exists (
    select 1 from public.api_key_scopes ks
    join public.api_scopes s on s.id = ks.scope_id
    where ks.api_key_id = p_key_id and s.name = p_scope_name
  );
end;
$$ language plpgsql security definer;

-- Tabela para rastreamento de tokens de API
create table public.api_tokens (
  id uuid default uuid_generate_v4() primary key,
  token_hash text not null unique,
  api_key_id uuid references public.api_keys not null,
  user_id uuid references auth.users not null,
  created_at timestamp with time zone default now() not null,
  expires_at timestamp with time zone not null,
  is_revoked boolean not null default false,
  revoked_at timestamp with time zone,
  last_used_at timestamp with time zone
);

-- Índices para tokens
create index idx_api_tokens_token_hash on public.api_tokens(token_hash);
create index idx_api_tokens_api_key_id on public.api_tokens(api_key_id);
create index idx_api_tokens_user_id on public.api_tokens(user_id);

-- Habilitar RLS
alter table public.api_tokens enable row level security;

-- Policies para tokens
create policy "Somente sistema pode criar tokens"
  on public.api_tokens
  for insert
  with check (false); -- Só pode ser inserido via função com security definer

create policy "Usuários podem ver seus próprios tokens"
  on public.api_tokens
  for select
  using (auth.uid() = user_id);

create policy "Usuários podem revogar seus próprios tokens"
  on public.api_tokens
  for update
  using (auth.uid() = user_id);

-- Função para criar token de API
create or replace function public.create_api_token(p_key_id uuid, p_token_lifetime_minutes integer default 60)
returns text as $$
declare
  v_token text;
  v_token_hash text;
  v_user_id uuid;
  v_expires_at timestamp with time zone;
begin
  -- Verificar se a chave existe e está ativa
  select user_id into v_user_id 
  from public.api_keys
  where id = p_key_id and is_active = true;
  
  if v_user_id is null then
    raise exception 'Chave de API inválida ou inativa';
  end if;
  
  -- Gerar token único
  v_token := gen_random_uuid()::text || gen_random_uuid()::text;
  -- Na implementação real usaríamos uma função de hash
  v_token_hash := v_token; -- Simplificação para exemplo
  
  -- Definir expiração
  v_expires_at := now() + (p_token_lifetime_minutes * interval '1 minute');
  
  -- Criar registro do token
  insert into public.api_tokens (
    token_hash, api_key_id, user_id, expires_at
  ) values (
    v_token_hash, p_key_id, v_user_id, v_expires_at
  );
  
  -- Retornar o token
  return v_token;
end;
$$ language plpgsql security definer;