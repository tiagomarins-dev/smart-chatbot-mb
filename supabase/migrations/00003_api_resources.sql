-- Migration: 00003_api_resources.sql
-- Description: Recursos da API para mensagens e contatos
-- Data: 2025-05-04

-- Tabela para armazenar webhooks
create table public.webhooks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  url text not null,
  events text[] not null,
  is_active boolean not null default true,
  secret_token text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  last_triggered_at timestamp with time zone
);

-- Habilitar RLS
alter table public.webhooks enable row level security;

-- Policies para webhooks
create policy "Usuários podem gerenciar seus próprios webhooks"
  on public.webhooks
  for all
  using (auth.uid() = user_id);

-- Tabela para armazenar mensagens recebidas pela API
create table public.api_messages (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  whatsapp_message_id text,
  phone_number text not null,
  message_content text not null,
  media_url text,
  direction text not null check (direction in ('inbound', 'outbound')),
  status text not null default 'pending' check (status in ('pending', 'sent', 'delivered', 'read', 'failed')),
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  sent_at timestamp with time zone,
  delivered_at timestamp with time zone,
  read_at timestamp with time zone,
  metadata jsonb
);

-- Índices para busca eficiente
create index idx_api_messages_user_id on public.api_messages(user_id);
create index idx_api_messages_phone_number on public.api_messages(phone_number);
create index idx_api_messages_created_at on public.api_messages(created_at);
create index idx_api_messages_status on public.api_messages(status);

-- Habilitar RLS
alter table public.api_messages enable row level security;

-- Policies para mensagens
create policy "Usuários podem ver suas próprias mensagens"
  on public.api_messages
  for select
  using (auth.uid() = user_id);

create policy "Usuários podem enviar mensagens"
  on public.api_messages
  for insert
  with check (auth.uid() = user_id);

create policy "Usuários podem atualizar status de suas mensagens"
  on public.api_messages
  for update
  using (auth.uid() = user_id);

-- Tabela para armazenar contatos
create table public.contacts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  phone_number text not null,
  name text,
  first_name text,
  last_name text,
  email text,
  profile_image_url text,
  is_blocked boolean not null default false,
  last_message_at timestamp with time zone,
  tags text[],
  custom_fields jsonb,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  unique(user_id, phone_number)
);

-- Índices para busca
create index idx_contacts_user_id on public.contacts(user_id);
create index idx_contacts_phone_number on public.contacts(phone_number);
create index idx_contacts_name on public.contacts(name);
create index idx_contacts_last_message_at on public.contacts(last_message_at);

-- Habilitar RLS
alter table public.contacts enable row level security;

-- Policies para contatos
create policy "Usuários podem gerenciar seus próprios contatos"
  on public.contacts
  for all
  using (auth.uid() = user_id);