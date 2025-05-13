# Documentação da Integração WhatsApp

Este diretório contém a documentação completa para a integração do sistema com o WhatsApp.

## Índice de Documentos

1. [**Implementação da Integração WhatsApp**](./WHATSAPP_INTEGRATION_IMPLEMENTATION.md)
   - Descrição detalhada da arquitetura e implementação
   - Endpoints da API e fluxos de comunicação
   - Configuração e solução de problemas

2. [**Guia de Testes da Integração WhatsApp**](./WHATSAPP_TESTING_GUIDE.md)
   - Scripts e procedimentos de teste
   - Verificação de conexão e funcionalidades
   - Exemplos de uso com curl e JavaScript

3. [**Implementação do Smart Chatbot**](./WHATSAPP_SMART_CHATBOT.md)
   - Configuração do sistema de respostas automáticas
   - Integração com serviços de IA
   - Análise de intenções e entidades

4. [**Análise de Sentimento em Conversas**](./WHATSAPP_SENTIMENT_ANALYSIS.md)
   - Implementação da análise de sentimento
   - Métricas e indicadores
   - Integração com dashboard

5. [**Passos de Implementação**](./WHATSAPP_IMPLEMENTATION_STEPS.md)
   - Etapas de implementação passo a passo
   - Fluxo de trabalho e prazos
   - Checklist de funcionalidades

6. [**Atualizações de Implementação**](./WHATSAPP_IMPLEMENTATION_UPDATE.md)
   - Registro de atualizações e melhorias
   - Novas funcionalidades adicionadas
   - Correções de problemas

7. [**Captura de Mensagens WhatsApp**](./WHATSAPP_MESSAGE_CAPTURE.md)
   - Detalhes sobre a captura de mensagens
   - Processamento e armazenamento
   - Integração com sistema de leads

## Diagramas

### Arquitetura da Integração

```
┌────────────┐      ┌────────────┐      ┌────────────┐
│  Frontend  │──────►  Backend   │──────►  WhatsApp  │
│ (9034)     │◄─────┤ (9033)     │◄─────┤ API (9029) │
└────────────┘      └────────────┘      └────────────┘
                          │
                          ▼
                    ┌────────────┐
                    │  Supabase  │
                    │  Database  │
                    └────────────┘
```

### Fluxo de Mensagens

```
┌──────────┐  1. Envia   ┌──────────┐  2. Processa  ┌──────────┐
│ WhatsApp │────────────►│ Backend  │───────────────►│ Supabase │
└──────────┘  webhook   └──────────┘  e armazena   └──────────┘
      ▲                      │                           │
      │                      │                           │
      │                      ▼                           │
      │                ┌──────────┐  4. Busca      ┌─────┘
      └────────────────┤ Frontend │◄───────────────┘
        3. Envia       └──────────┘  mensagens
        resposta
```

## Scripts Úteis

Para facilitar a manutenção e teste da integração, foram criados diversos scripts utilitários:

- `./test-whatsapp-endpoints.sh` - Testa todos os endpoints da API WhatsApp
- `./fix-whatsapp-connection.sh` - Corrige problemas de conexão entre frontend e API

## Endpoints Principais

| Endpoint | Descrição |
|----------|-----------|
| `/api/status` | Verifica status da conexão |
| `/api/qrcode` | Obtém QR code para autenticação |
| `/api/send` | Envia mensagem para um número |
| `/api/messages` | Lista mensagens recentes |

## Diagnóstico

Para diagnosticar problemas na integração, acesse:
http://localhost:9034/whatsapp/diagnostico

## Servidor WhatsApp API

O servidor WhatsApp API roda na porta 9029 e é responsável pela comunicação direta com o WhatsApp Web. 
É um serviço Node.js separado, que utiliza a biblioteca WhatsApp Web.js.

## Dúvidas e Resolução de Problemas

Caso encontre problemas na integração, consulte a seção de solução de problemas em [Implementação da Integração WhatsApp](./WHATSAPP_INTEGRATION_IMPLEMENTATION.md#solução-de-problemas).