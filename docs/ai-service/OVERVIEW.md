# Serviço de IA - Visão Geral

## Introdução

Este documento descreve a arquitetura e implementação do serviço de IA para a plataforma Smart Chatbot MB. O serviço é implementado como um microserviço Python independente utilizando FastAPI, com capacidade para integrar múltiplos provedores de modelos de IA, começando com a OpenAI.

## Objetivos

- Criar uma arquitetura de serviço de IA flexível e extensível
- Começar com integração da OpenAI, mas facilitar a adição de outros provedores no futuro
- Manter total desacoplamento entre o serviço de IA e o restante da aplicação
- Otimizar desempenho e custos das chamadas de API de IA

## Arquitetura Geral

```
┌─────────────────┐     ┌───────────────────┐     ┌───────────────────┐
│                 │     │                   │     │                   │
│  Aplicação      │     │   Serviço de IA   │     │   Provedores IA   │
│  Principal      │◄───►│   (Python/FastAPI)│◄───►│   (OpenAI, etc.)  │
│  (Node.js)      │     │                   │     │                   │
│                 │     │                   │     │                   │
└─────────────────┘     └───────────────────┘     └───────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │                 │
                        │  Cache Redis    │
                        │  (Opcional)     │
                        │                 │
                        └─────────────────┘
```

## Componentes Principais

1. **API Gateway**: Interface REST para o serviço de IA
2. **Gerenciador de Provedores**: Abstração para diferentes provedores de IA
3. **Adaptadores de Provedores**: Implementações específicas para cada provedor
4. **Cache**: Sistema de cache para otimizar chamadas repetitivas
5. **Sistema de Logs**: Monitoramento e rastreamento de uso e desempenho

## Fluxo de Dados

1. A aplicação principal faz uma solicitação REST ao serviço de IA
2. O serviço verifica o cache para resultados existentes (se aplicável)
3. Se não encontrado no cache, o serviço encaminha a solicitação ao provedor configurado
4. O resultado é armazenado em cache (se aplicável) e retornado à aplicação principal

## Decisões Técnicas

1. **FastAPI**: Framework Python de alto desempenho para APIs REST
2. **Docker**: Containerização para implantação consistente
3. **Redis**: Armazenamento em cache para respostas de IA
4. **Pydantic**: Validação de dados e serialização
5. **Async/Await**: Processamento assíncrono para melhor desempenho

## Próximos Passos

1. Implementar MVP com suporte à OpenAI
2. Estabelecer métricas de desempenho e monitoramento
3. Adicionar sistema de cache
4. Integrar provedores adicionais de IA

## Documentos Relacionados

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Detalhes técnicos da arquitetura
- [API_SPEC.md](./API_SPEC.md) - Especificação da API REST
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Instruções de implantação
- [PROVIDERS.md](./PROVIDERS.md) - Guia para adicionar novos provedores