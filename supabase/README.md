# Migrações do Supabase para API Smart-ChatBox

Este diretório contém todos os scripts SQL necessários para configurar o banco de dados Supabase para a API da Smart-ChatBox.

## Organização

Os scripts são organizados em ordem numérica sequencial, onde cada script representa uma fase de migração. Esta abordagem permite:

- Aplicação incremental de alterações
- Controle de versão do esquema do banco de dados
- Rastreabilidade das mudanças ao longo do tempo

## Arquivos de Migração

1. **00001_init_auth_schema.sql**
   - Configuração inicial do esquema de autenticação
   - Tabela de perfis de usuários
   - Policies de segurança para acessos

2. **00002_api_security.sql**
   - Configuração para segurança da API
   - Tabela de chaves de API
   - Sistema de log de uso da API

3. **00003_api_resources.sql**
   - Recursos da API para mensagens e contatos
   - Tabela de webhooks
   - Tabelas para mensagens e contatos

4. **00004_api_access_control.sql**
   - Controle de acesso granular para API
   - Sistema de escopos para permissões
   - Gerenciamento de tokens

5. **00005_api_rate_limiting.sql**
   - Configuração de limite de taxa para API
   - Sistema de blacklist para IPs abusivos
   - Controle de requisições por minuto

6. **00006_api_analytics.sql**
   - Esquema para analytics da API
   - Estatísticas de uso diárias, horárias e mensais
   - Agregação de métricas

7. **00007_api_webhooks_delivery.sql**
   - Sistema para entrega confiável de webhooks
   - Mecanismo de retry com backoff exponencial
   - Rastreamento de entregas de webhooks

## Como Aplicar

1. Acesse o painel do Supabase (https://app.supabase.com)
2. Navegue até seu projeto
3. Vá para a seção "SQL Editor"
4. Crie uma nova query
5. Aplique os scripts em ordem sequencial, começando pelo 00001
6. Execute cada script e verifique se não há erros

## Observações

- Sempre faça backup do banco de dados antes de aplicar novas migrações
- Verifique as configurações de RLS (Row Level Security) para garantir a proteção adequada dos dados
- Após aplicar as migrações, teste as permissões para garantir que estão funcionando conforme esperado

## Dependências

Estes scripts usam recursos do PostgreSQL disponíveis no Supabase:
- RLS (Row Level Security)
- Funções e Triggers PL/pgSQL
- Extensão pgcrypto para funções de hash
- UUID para identificadores únicos