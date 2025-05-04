-- Criar tabela de perfis de usuários
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  name text,
  avatar_url text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Habilitar RLS (Row Level Security)
alter table public.profiles enable row level security;

-- Criar policy para permitir acesso ao próprio perfil
create policy "Usuários podem visualizar seus próprios perfis"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy "Usuários podem inserir seus próprios perfis"
  on public.profiles
  for insert
  with check (auth.uid() = id);

create policy "Usuários podem atualizar seus próprios perfis"
  on public.profiles
  for update
  using (auth.uid() = id);

-- Função para criar perfil automaticamente após registro
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger para executar após o registro de um novo usuário
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
