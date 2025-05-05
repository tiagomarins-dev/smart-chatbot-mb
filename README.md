# Smart-ChatBox

Sistema completo para gerenciamento de WhatsApp Web com interface amigável para envio e recebimento de mensagens, com autenticação via Supabase.

## Funcionalidades

- **Autenticação**:
  - Login com email/senha
  - Registro de novos usuários
  - Persistência de sessão
  - Proteção de rotas restritas
  
- **WhatsApp**:
  - Conexão com WhatsApp via QR Code
  - Visualização em tempo real de mensagens recebidas e enviadas
  - Interface de chat organizada por contatos
  - Envio de mensagens direto da interface web
  - Captura de mensagens enviadas de outros dispositivos
  - Identificação visual de diferentes tipos de mensagens
  - Carregamento automático do histórico de conversas

## Tecnologias

- **Backend**: Node.js, Express, WhatsApp Web.js
- **Frontend**: HTML, CSS, JavaScript, Bootstrap 5
- **Autenticação**: Supabase
- **Contêineres**: Docker, Docker Compose
- **Servidor Web**: Apache com PHP

## Estrutura do Projeto

```
📁 src/
  📁 node/            # Servidor Node.js com WhatsApp Web API
    📄 server.js      # Servidor principal com API REST
  📁 php/             # Servidor web
    📁 html/          # Interface web
      📄 index.php    # Interface principal de usuário
📄 docker-compose.yml # Configuração dos containers
📄 Dockerfile.node    # Configuração do container Node.js
📄 Dockerfile.apache  # Configuração do container Apache+PHP
```

## Como usar

### Requisitos

- Docker
- Docker Compose
- Conta no Supabase (https://supabase.com)

### Instalação e execução

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/smart-chatbot-mb.git
cd smart-chatbot-mb
```

2. Configure as credenciais do Supabase:
   - Crie um arquivo `.env` na raiz do projeto
   - Adicione as seguintes variáveis:
   ```
   SUPABASE_URL=https://sua-url-supabase.supabase.co
   SUPABASE_ANON_KEY=sua-chave-anonima-supabase
   SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-supabase
   SUPABASE_JWT_SECRET=seu-jwt-secret-supabase
   ```
   - As chaves `SUPABASE_SERVICE_ROLE_KEY` e `SUPABASE_JWT_SECRET` são obrigatórias para autenticação via API Key e JWT
   - Você pode obter o `SUPABASE_JWT_SECRET` nas configurações API do seu projeto Supabase (JWT Settings)
   - A `SUPABASE_SERVICE_ROLE_KEY` está disponível na seção API do projeto Supabase (Project API Keys)

3. Configure o banco de dados Supabase:
   - Crie uma tabela `profiles` para armazenar dados de usuários:
   ```sql
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
   ```

4. Inicie os contêineres:
```bash
docker-compose up -d
```

5. Acesse a interface web:
```
http://localhost:9030
```

6. Crie uma conta ou faça login com suas credenciais.

7. Depois de autenticado, escaneie o QR Code com seu WhatsApp para conectar.

### Uso

- A página inicial exibirá um QR code para escanear com o aplicativo WhatsApp
- Após conectado, você verá uma lista de contatos com quem você conversou
- Clique em um contato para abrir o histórico de mensagens
- Use o campo de texto no modal para enviar novas mensagens
- O painel será atualizado automaticamente quando novas mensagens forem recebidas

## API

### API WhatsApp
- `GET /api/status` - Verifica o status da conexão
- `GET /api/qrcode` - Obtém o QR code para conexão
- `POST /api/connect` - Inicia o processo de conexão
- `POST /api/disconnect` - Desconecta o WhatsApp
- `POST /api/send` - Envia uma mensagem
- `GET /api/messages` - Obtém todas as mensagens
- `GET /api/messages/:number` - Obtém mensagens de um número específico
- `DELETE /api/messages` - Limpa todas as mensagens armazenadas

### API Empresas
- `GET /api/v1/companies` - Lista todas as empresas
- `GET /api/v1/companies?id={id}` - Busca uma empresa específica
- `POST /api/v1/companies` - Cria uma nova empresa
- `PUT /api/v1/companies/{id}` - Atualiza uma empresa existente
- `DELETE /api/v1/companies/{id}` - Desativa uma empresa (soft delete)

### API Projetos
- `GET /api/v1/projects?company_id={company_id}` - Lista projetos de uma empresa
- `GET /api/v1/projects?id={id}` - Busca um projeto específico
- `POST /api/v1/projects` - Cria um novo projeto
- `PUT /api/v1/projects/{id}` - Atualiza um projeto existente
- `DELETE /api/v1/projects/{id}` - Desativa um projeto (soft delete)

### API Leads
- `GET /api/v1/leads` - Lista todos os leads
- `GET /api/v1/leads?id={id}` - Busca um lead específico
- `GET /api/v1/leads?project_id={project_id}` - Lista leads de um projeto
- `GET /api/v1/leads?email={email}` - Busca um lead pelo email
- `POST /api/v1/leads` - Captura um novo lead
- `PUT /api/v1/leads/{id}/status` - Atualiza o status de um lead
- `GET /api/v1/leads/stats` - Obtém estatísticas de leads

Para mais detalhes, consulte a documentação Swagger em `/api/docs.php`.

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE para detalhes.

## Autor

Seu Nome