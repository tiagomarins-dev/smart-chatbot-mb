# Documentação do Sistema

## Visão Geral

Esta pasta contém a documentação técnica e de usuário para o sistema Smart Chatbot MB. A documentação está organizada por categorias para facilitar a navegação e consulta.

## Índice de Documentação

Para uma visão completa e organizada da documentação disponível, consulte o [Índice de Documentação](INDEX.md).

## Categorias Principais

### API e Integrações
Documentos relacionados a endpoints de API, integrações e comunicação entre serviços.

### Autenticação e Segurança
Detalhes sobre autenticação, autorização e segurança do sistema.

### Gestão de Leads
Documentação sobre o sistema de captura, acompanhamento e análise de leads.

### Integração com WhatsApp
Detalhes técnicos sobre a integração com a API do WhatsApp e funcionalidades relacionadas.

### Infraestrutura e Resilência
Informações sobre configuração de servidores, Docker, e mecanismos de resiliência como o modo offline.

### Serviço de IA
Documentação específica do serviço de inteligência artificial, incluindo configuração, provedores e implantação.

## Documentos Recentes

### Modo Offline
O [documento sobre Modo Offline](OFFLINE_MODE.md) detalha a implementação que permite que o sistema continue funcionando mesmo quando há problemas de conectividade com o banco de dados Supabase.

### Proxy de API
O [documento sobre Proxy de API](API_PROXY.md) explica como configuramos o roteamento de requisições entre o frontend e o backend para garantir comunicação resiliente.

## Como Contribuir com a Documentação

Ao adicionar novos documentos:

1. Adicione o arquivo à pasta principal ou à subpasta apropriada
2. Atualize o [Índice de Documentação](INDEX.md) para incluir o novo documento
3. Siga o padrão de nomenclatura existente: MAIÚSCULAS_COM_UNDERSCORE.md
4. Inclua um cabeçalho no início do documento descrevendo seu propósito

## Diretório de Documentação do Serviço de IA

O serviço de IA possui um conjunto dedicado de documentos na pasta [ai-service](ai-service/). Consulte o README.md nesse diretório para mais detalhes.