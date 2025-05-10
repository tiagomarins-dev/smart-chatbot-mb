# Mapa de Implementação: Sistema de IA e Mensagens Automáticas

Este documento serve como um roteiro passo a passo para implementar o sistema de IA e mensagens automáticas no projeto Smart Chatbot MB. O mapa permite que a implementação possa ser pausada e retomada de maneira organizada, garantindo que nenhum processo seja perdido.

## Índice

1. [Preparação do Ambiente](#1-preparação-do-ambiente)
2. [Microserviço Python para IA](#2-microserviço-python-para-ia)
3. [Banco de Dados e Migrações](#3-banco-de-dados-e-migrações)
4. [Backend Node.js](#4-backend-nodejs)
5. [Frontend React](#5-frontend-react)
6. [Integrações](#6-integrações)
7. [Testes](#7-testes)
8. [Implantação](#8-implantação)
9. [Pós-Implantação](#9-pós-implantação)

## Progresso Geral

Para acompanhar o progresso, marque as etapas conforme forem completadas.

- [ ] 1. Preparação do Ambiente
- [ ] 2. Microserviço Python para IA
- [ ] 3. Banco de Dados e Migrações
- [ ] 4. Backend Node.js 
- [ ] 5. Frontend React
- [ ] 6. Integrações
- [ ] 7. Testes
- [ ] 8. Implantação
- [ ] 9. Pós-Implantação

---

## 1. Preparação do Ambiente

### 1.1 Configuração do Ambiente de Desenvolvimento

- [ ] **1.1.1** Verificar pré-requisitos
  - [ ] Node.js v14+ instalado
  - [ ] Python 3.9+ instalado
  - [ ] Docker e Docker Compose instalados
  - [ ] Conta na OpenAI com API key válida
  - [ ] Supabase CLI instalado

- [ ] **1.1.2** Preparar variáveis de ambiente
  - [ ] Criar arquivo `.env.ai-service` para o microserviço Python
  - [ ] Atualizar arquivo `.env` existente para o backend Node.js
  - [ ] Anotar chaves de API da OpenAI

- [ ] **1.1.3** Configurar diretórios do projeto
  - [ ] Criar diretório `ai-service` na raiz do projeto
  - [ ] Criar estrutura de pastas dentro de `ai-service`

### 1.2 Dependências e Bibliotecas

- [ ] **1.2.1** Instalar dependências Python
  - [ ] Criar arquivo `requirements.txt` com:
    ```
    fastapi==0.103.1
    uvicorn==0.23.2
    pydantic==2.3.0
    httpx==0.24.1
    python-dotenv==1.0.0
    openai==0.28.1
    redis==4.6.0
    ```
  - [ ] Executar `pip install -r ai-service/requirements.txt`

- [ ] **1.2.2** Atualizar dependências Node.js
  - [ ] Adicionar novas dependências ao package.json
    ```
    "axios": "^1.5.0",
    "redis": "^4.6.8"
    ```
  - [ ] Executar `npm install` na pasta `backend`

## 2. Microserviço Python para IA

### 2.1 Estrutura Básica

- [ ] **2.1.1** Configurar projeto FastAPI
  - [ ] Criar arquivo `ai-service/main.py`
  - [ ] Implementar estrutura básica do aplicativo FastAPI
  - [ ] Configurar CORS e middleware

- [ ] **2.1.2** Implementar estrutura de diretórios
  ```
  ai-service/
  ├── app/
  │   ├── api/
  │   │   ├── __init__.py
  │   │   ├── chat.py
  │   │   ├── completion.py
  │   │   ├── embedding.py
  │   │   ├── health.py
  │   │   ├── lead_messages.py
  │   │   └── router.py
  │   ├── core/
  │   │   ├── __init__.py
  │   │   ├── auth.py
  │   │   ├── config.py
  │   │   └── logging.py
  │   ├── models/
  │   │   ├── __init__.py
  │   │   ├── chat.py
  │   │   ├── completion.py
  │   │   ├── embedding.py
  │   │   └── lead_message.py
  │   ├── providers/
  │   │   ├── __init__.py
  │   │   ├── adapters/
  │   │   │   ├── __init__.py
  │   │   │   ├── base_adapter.py
  │   │   │   └── openai_adapter.py
  │   │   └── manager.py
  │   ├── services/
  │   │   ├── __init__.py
  │   │   ├── ai_service.py
  │   │   └── cache_service.py
  │   └── main.py
  ├── Dockerfile
  ├── docker-compose.yml
  └── requirements.txt
  ```

### 2.2 Implementação de Componentes Core

- [ ] **2.2.1** Implementar configurações (`app/core/config.py`)
  - [ ] Configurações de ambiente
  - [ ] Configurações de API
  - [ ] Configurações de provedores de IA

- [ ] **2.2.2** Implementar autenticação (`app/core/auth.py`)
  - [ ] Middleware de autenticação
  - [ ] Validação de API key

- [ ] **2.2.3** Implementar logging (`app/core/logging.py`)
  - [ ] Configuração de logs estruturados
  - [ ] Captura de erros e exceções

### 2.3 Modelos de Dados

- [ ] **2.3.1** Implementar modelos Pydantic
  - [ ] Modelo de requisição/resposta de chat
  - [ ] Modelo de requisição/resposta de completion
  - [ ] Modelo de requisição/resposta de embedding
  - [ ] Modelo de mensagem para lead

### 2.4 Providers e Adapters

- [ ] **2.4.1** Implementar adaptador base (`app/providers/adapters/base_adapter.py`)
  - [ ] Definir interface do adaptador

- [ ] **2.4.2** Implementar adaptador OpenAI (`app/providers/adapters/openai_adapter.py`)
  - [ ] Implementar métodos para chat, completion, embedding
  - [ ] Implementar método para análise de sentimento
  - [ ] Implementar método para geração de mensagens para leads

- [ ] **2.4.3** Implementar gerenciador de provedores (`app/providers/manager.py`)
  - [ ] Lógica para carregar e gerenciar diferentes adaptadores
  - [ ] Seleção de provedor baseada em configuração

### 2.5 Serviços

- [ ] **2.5.1** Implementar serviço de IA (`app/services/ai_service.py`)
  - [ ] Lógica de negócios para processamento de IA
  - [ ] Método para geração de resposta de chat
  - [ ] Método para geração de completion
  - [ ] Método para geração de embedding
  - [ ] Método para análise de sentimento
  - [ ] Método para geração de mensagens para leads

- [ ] **2.5.2** Implementar serviço de cache (`app/services/cache_service.py`)
  - [ ] Integração com Redis
  - [ ] Estratégias de cache para respostas de IA

### 2.6 API Endpoints

- [ ] **2.6.1** Implementar router principal (`app/api/router.py`)
  - [ ] Configurar todos os routers

- [ ] **2.6.2** Implementar endpoints específicos
  - [ ] API de chat (`app/api/chat.py`)
  - [ ] API de completion (`app/api/completion.py`) 
  - [ ] API de embedding (`app/api/embedding.py`)
  - [ ] API de mensagens para leads (`app/api/lead_messages.py`)
  - [ ] API de saúde (`app/api/health.py`)

### 2.7 Dockerfile e Containerização

- [ ] **2.7.1** Criar Dockerfile para o serviço
  - [ ] Configurar imagem base Python
  - [ ] Configurar dependências
  - [ ] Configurar comando de inicialização

- [ ] **2.7.2** Criar docker-compose para desenvolvimento
  - [ ] Configurar serviço Python
  - [ ] Configurar Redis para cache (opcional)

## 3. Banco de Dados e Migrações

### 3.1 Aplicar Migrações

- [ ] **3.1.1** Verificar migração SQL
  - [ ] Revisar arquivo `supabase/migrations/00021_automated_messaging.sql`
  - [ ] Verificar se todas as tabelas necessárias estão incluídas

- [ ] **3.1.2** Aplicar migração ao banco de dados
  - [ ] Executar `npx supabase migration up` ou script equivalente
  - [ ] Verificar se as tabelas foram criadas corretamente

### 3.2 Dados Iniciais

- [ ] **3.2.1** Inserir eventos pré-definidos
  - [ ] Verificar se os eventos pré-definidos foram criados
  - [ ] Adicionar eventos personalizados adicionais se necessário

## 4. Backend Node.js

### 4.1 Controladores e Rotas

- [ ] **4.1.1** Implementar controlador de mensagens automatizadas
  - [ ] Criar arquivo `backend/src/controllers/automatedMessagesController.ts`
  - [ ] Implementar métodos para CRUD de templates
  - [ ] Implementar métodos para gerenciamento de eventos

- [ ] **4.1.2** Implementar rotas de API
  - [ ] Criar arquivo `backend/src/routes/automatedMessagesRoutes.ts`
  - [ ] Definir rotas RESTful para gerenciamento de templates e eventos
  - [ ] Adicionar rotas ao index de rotas principal

### 4.2 Serviços

- [ ] **4.2.1** Implementar serviço de eventos
  - [ ] Criar arquivo `backend/src/services/eventProcessingService.ts`
  - [ ] Implementar lógica para processamento de eventos
  - [ ] Implementar lógica para eligibilidade de leads

- [ ] **4.2.2** Implementar serviço de integração com IA
  - [ ] Criar arquivo `backend/src/services/aiIntegrationService.ts`
  - [ ] Implementar cliente para comunicação com microserviço Python
  - [ ] Implementar métodos para geração de mensagens

- [ ] **4.2.3** Atualizar serviço WhatsApp
  - [ ] Modificar `backend/src/services/whatsappService.ts`
  - [ ] Adicionar suporte a mensagens automatizadas
  - [ ] Implementar rastreamento de respostas

### 4.3 Middleware

- [ ] **4.3.1** Implementar middleware de autenticação para rotas de mensagens automatizadas
  - [ ] Atualizar `backend/src/middleware/auth.ts` se necessário
  - [ ] Adicionar verificações de permissão baseadas em função

## 5. Frontend React

### 5.1 Componentes de Interface

- [ ] **5.1.1** Implementar aba de mensagens automatizadas
  - [ ] Criar arquivo `frontend/src/components/projects/AutomatedMessagesTab.tsx`
  - [ ] Implementar listagem de templates de mensagens

- [ ] **5.1.2** Implementar formulário de template
  - [ ] Criar arquivo `frontend/src/components/projects/TemplateForm.tsx`
  - [ ] Implementar formulário para criar/editar templates
  - [ ] Implementar previsualização de mensagens

- [ ] **5.1.3** Implementar gerenciamento de eventos
  - [ ] Criar arquivo `frontend/src/components/projects/EventTriggersManager.tsx`
  - [ ] Implementar interface para criação/edição de eventos

- [ ] **5.1.4** Implementar dashboard de métricas
  - [ ] Criar arquivo `frontend/src/components/projects/MessagingMetrics.tsx`
  - [ ] Implementar visualizações de métricas de desempenho

### 5.2 Integrações de API

- [ ] **5.2.1** Implementar cliente de API para mensagens automatizadas
  - [ ] Criar arquivo `frontend/src/api/automatedMessages.ts`
  - [ ] Implementar métodos para CRUD de templates e eventos

- [ ] **5.2.2** Atualizar navegação
  - [ ] Modificar componente de navegação para incluir nova aba
  - [ ] Atualizar rotas

## 6. Integrações

### 6.1 Integração WhatsApp

- [ ] **6.1.1** Atualizar serviço de mensagens WhatsApp
  - [ ] Implementar suporte a mensagens automatizadas
  - [ ] Configurar rastreamento de respostas

- [ ] **6.1.2** Implementar detecção de eventos WhatsApp
  - [ ] Modificar handler de mensagens para detectar eventos

### 6.2 Integração de Eventos

- [ ] **6.2.1** Implementar sistema de captura de eventos
  - [ ] Criar hooks para captura de eventos em diferentes partes do sistema
  - [ ] Implementar API client para registro de eventos

- [ ] **6.2.2** Implementar schedulers para eventos temporais
  - [ ] Criar job para verificação de leads inativos
  - [ ] Implementar lógica para eventos baseados em tempo

## 7. Testes

### 7.1 Testes de Unidade

- [ ] **7.1.1** Testar adaptadores de IA
  - [ ] Implementar mocks para API da OpenAI
  - [ ] Testar geração de mensagens

- [ ] **7.1.2** Testar serviços de processamento de eventos
  - [ ] Testar elegibilidade de leads
  - [ ] Testar criação e envio de mensagens

### 7.2 Testes de Integração

- [ ] **7.2.1** Testar fluxo completo em ambiente de desenvolvimento
  - [ ] Testar criação de template
  - [ ] Testar disparo de evento
  - [ ] Testar geração e envio de mensagem

### 7.3 Testes Manuais

- [ ] **7.3.1** Executar testes manuais
  - [ ] Testar interface de usuário
  - [ ] Verificar personalização de mensagens
  - [ ] Validar regras de eligibilidade

## 8. Implantação

### 8.1 Configuração do Ambiente de Produção

- [ ] **8.1.1** Configurar infraestrutura
  - [ ] Configurar servidor ou container para microserviço Python
  - [ ] Configurar Redis para produção (se usado)
  - [ ] Atualizar configurações de backend Node.js

- [ ] **8.1.2** Configurar variáveis de ambiente
  - [ ] Definir variáveis de ambiente para produção
  - [ ] Configurar chaves de API

### 8.2 Implantação dos Serviços

- [ ] **8.2.1** Implantar microserviço Python
  - [ ] Construir e publicar imagem Docker
  - [ ] Iniciar o serviço

- [ ] **8.2.2** Aplicar migrações de banco de dados
  - [ ] Executar script de migração no ambiente de produção

- [ ] **8.2.3** Atualizar backend Node.js
  - [ ] Implantar novas versões dos controladores e serviços

- [ ] **8.2.4** Implantar frontend
  - [ ] Construir e publicar novas versões dos componentes

### 8.3 Monitoramento Inicial

- [ ] **8.3.1** Configurar alertas
  - [ ] Configurar alertas para erros de API
  - [ ] Configurar alertas para falhas de envio de mensagem

- [ ] **8.3.2** Validar funcionalidades em produção
  - [ ] Testar configuração de templates
  - [ ] Testar envio de mensagens
  - [ ] Verificar logs e métricas

## 9. Pós-Implantação

### 9.1 Documentação

- [ ] **9.1.1** Atualizar documentação para usuários
  - [ ] Criar guia de uso para configuração de mensagens automáticas
  - [ ] Documentar melhores práticas

- [ ] **9.1.2** Atualizar documentação técnica
  - [ ] Documentar arquitetura implementada
  - [ ] Atualizar diagramas

### 9.2 Treinamento

- [ ] **9.2.1** Treinar equipe
  - [ ] Conduzir sessão de treinamento para administradores
  - [ ] Preparar material de referência

### 9.3 Otimização e Ajustes

- [ ] **9.3.1** Coletar feedback inicial
  - [ ] Entrevistar usuários sobre a nova funcionalidade
  - [ ] Identificar pontos de melhoria

- [ ] **9.3.2** Implementar ajustes
  - [ ] Realizar ajustes na interface baseados no feedback
  - [ ] Otimizar desempenho se necessário

---

## Notas sobre o Progresso

Use esta seção para documentar notas importantes sobre o progresso da implementação, decisões tomadas, problemas encontrados e suas soluções.

| Data | Etapa | Notas |
|------|-------|-------|
| | | |

---

## Referências e Recursos

- [Documentação FastAPI](https://fastapi.tiangolo.com/)
- [Documentação OpenAI](https://platform.openai.com/docs/api-reference)
- [Documentação Supabase](https://supabase.io/docs)
- [Documentação Redis](https://redis.io/documentation)

---

## Contato para Suporte

Se precisar de suporte durante a implementação, entre em contato com:

- **Suporte Técnico**: [email ou contato do responsável técnico]
- **Gestor do Projeto**: [email ou contato do gestor]