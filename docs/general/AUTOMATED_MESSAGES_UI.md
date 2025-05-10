# Documentação da Interface de Mensagens Automatizadas

## Visão Geral
A funcionalidade de Mensagens Automatizadas permite que os usuários configurem mensagens que serão enviadas automaticamente aos leads com base em gatilhos de eventos, score do lead e análise de sentimento. Isso ajuda a manter o engajamento com leads e melhorar as taxas de conversão.

## Componentes Principais

### 1. API de Mensagens Automatizadas
- **Arquivo:** `/frontend/src/api/automatedMessages.ts`
- **Funcionalidades:**
  - Gerenciamento de modelos de mensagens
  - Gerenciamento de gatilhos de eventos
  - Obtenção do histórico de mensagens de um lead
  - Envio de mensagens de teste

### 2. Interfaces
- **Arquivo:** `/frontend/src/interfaces/AutomatedMessages.ts`
- **Estruturas de Dados:**
  - `MessageTemplate`: Modelo de mensagem automatizada
  - `EventTrigger`: Gatilhos de eventos para mensagens
  - `TemplateEventMapping`: Mapeamento entre modelos e eventos
  - `MessageLog`: Registro de mensagens enviadas

### 3. Página Principal de Mensagens Automatizadas
- **Arquivo:** `/frontend/pages/automated-messages/index.tsx`
- **Funcionalidades:**
  - Listar todos os modelos de mensagens
  - Listar todos os gatilhos de eventos
  - Navegar para criação/edição de modelos e gatilhos
  - Acesso à função de envio de mensagens de teste

### 4. Páginas de Gerenciamento de Modelos
- **Arquivos:**
  - `/frontend/pages/automated-messages/templates/new.tsx`
  - `/frontend/pages/automated-messages/templates/[id]/edit.tsx`
  - `/frontend/pages/automated-messages/templates/[id]/index.tsx`
- **Funcionalidades:**
  - Criar novos modelos de mensagens
  - Editar modelos existentes
  - Visualizar detalhes de um modelo

### 5. Páginas de Gerenciamento de Eventos
- **Arquivos:**
  - `/frontend/pages/automated-messages/events/new.tsx`
  - `/frontend/pages/automated-messages/events/[id]/edit.tsx`
- **Funcionalidades:**
  - Criar novos gatilhos de eventos
  - Editar gatilhos existentes

### 6. Envio de Mensagens de Teste
- **Arquivo:** `/frontend/pages/automated-messages/send-test.tsx`
- **Funcionalidades:**
  - Enviar mensagem de teste para um lead
  - Usar modelo existente ou mensagem personalizada

### 7. Visualização de Mensagens na Página do Lead
- **Arquivo:** `/frontend/src/components/leads/LeadAutomatedMessages.tsx`
- **Funcionalidades:**
  - Exibir histórico de mensagens automatizadas para um lead
  - Mostrar status de leitura e resposta

## Fluxo de Trabalho

1. O usuário acessa a página de Mensagens Automatizadas
2. Cria modelos de mensagens com condições (score, sentimento)
3. Configura gatilhos de eventos para acionar as mensagens
4. As mensagens são enviadas automaticamente quando os critérios são atendidos
5. O usuário pode ver o histórico de mensagens na página do lead
6. O usuário pode enviar mensagens de teste para verificar o funcionamento

## Integração com Backend

Esta interface se integra com o backend através da API RESTful que gerencia:
- Armazenamento e recuperação de modelos e gatilhos
- Processamento de eventos para determinar quando enviar mensagens
- Integração com serviço de IA para personalização de mensagens
- Registro de mensagens enviadas e respostas recebidas

## Integrações Futuras

Melhorias planejadas para a interface de mensagens automatizadas:
1. Dashboard de desempenho de mensagens (taxas de abertura, resposta)
2. A/B testing para diferentes modelos de mensagens
3. Agendamento de mensagens baseado em horários específicos
4. Integrações com canais adicionais (e-mail, SMS)