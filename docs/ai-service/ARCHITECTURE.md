# Arquitetura do Serviço de IA

## Visão Detalhada da Arquitetura

O serviço de IA é implementado como um microserviço Python utilizando FastAPI, com uma arquitetura modular que permite a integração fácil de diferentes provedores de IA.

### Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                      AI Service (FastAPI)                       │
│                                                                 │
│  ┌─────────────┐    ┌───────────────┐    ┌──────────────────┐   │
│  │             │    │               │    │                  │   │
│  │  API Routes │───►│ Service Layer │───►│ Provider Manager │   │
│  │             │    │               │    │                  │   │
│  └─────────────┘    └───────────────┘    └──────────────────┘   │
│                                                   │             │
│                                                   ▼             │
│  ┌─────────────┐    ┌───────────────┐    ┌──────────────────┐   │
│  │             │    │               │    │                  │   │
│  │  Middleware │    │  Cache Layer  │◄───┤ Provider Adapters│   │
│  │             │    │               │    │                  │   │
│  └─────────────┘    └───────────────┘    └──────────────────┘   │
│                                                   │             │
└─────────────────────────────────────────────────────────────────┘
                                                    │
                                                    ▼
                                         ┌──────────────────────┐
                                         │                      │
                                         │   AI Provider APIs   │
                                         │   (OpenAI, etc.)     │
                                         │                      │
                                         └──────────────────────┘
```

## Módulos Principais

### 1. API Routes (`/app/api/`)

Contém todos os endpoints FastAPI expostos pelo serviço. Os principais endpoints incluem:

- `/completion`: Solicitar uma resposta de texto do modelo
- `/chat`: Iniciar ou continuar uma conversa com o modelo
- `/embedding`: Gerar embeddings vetoriais para texto
- `/health`: Verificar o status do serviço

### 2. Service Layer (`/app/services/`)

Contém a lógica de negócios que coordena as chamadas entre os controllers e os provedores:

- `ai_service.py`: Orquestra operações de IA
- `cache_service.py`: Gerencia o cache de respostas
- `auth_service.py`: Lida com autenticação e autorização

### 3. Provider Manager (`/app/providers/manager.py`)

Gerencia os diferentes provedores de IA e encaminha requisições para o adaptador apropriado:

- Carrega configurações dinâmicas de provedores
- Seleciona o provedor com base na configuração ou parâmetros da requisição
- Fornece interface unificada para todos os adaptadores

### 4. Provider Adapters (`/app/providers/adapters/`)

Implementações específicas para cada provedor de IA, todos seguindo uma interface comum:

- `openai_adapter.py`: Adaptador para a API OpenAI
- `anthropic_adapter.py`: Preparado para futura integração com Claude
- `base_adapter.py`: Interface base que todos os adaptadores devem implementar

### 5. Cache Layer (`/app/cache/`)

Sistema de cache para otimizar requisições repetitivas:

- `redis_cache.py`: Implementação usando Redis
- `memory_cache.py`: Implementação em memória para desenvolvimento
- `cache_strategy.py`: Estratégias de chave de cache e expiração

### 6. Middleware (`/app/middleware/`)

Interceptores de requisição para processamento adicional:

- `logging_middleware.py`: Registro detalhado de todas as operações
- `rate_limiter.py`: Limitação de taxa para proteção do serviço
- `error_handler.py`: Manipulação centralizada de erros

## Interface do Adaptador de Provedor

Todos os adaptadores de provedores implementam a seguinte interface comum:

```python
class BaseProviderAdapter(ABC):
    @abstractmethod
    async def get_completion(self, prompt: str, options: Dict[str, Any]) -> str:
        """Gera uma completion baseada no prompt fornecido"""
        pass
        
    @abstractmethod
    async def get_chat_response(self, messages: List[Dict[str, str]], options: Dict[str, Any]) -> Dict[str, Any]:
        """Gera uma resposta de chat baseada na lista de mensagens"""
        pass
        
    @abstractmethod
    async def get_embedding(self, text: str, options: Dict[str, Any]) -> List[float]:
        """Gera um embedding vetorial para o texto fornecido"""
        pass
        
    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Retorna o nome do provedor"""
        pass
```

## Estratégia de Cache

O sistema utiliza uma estratégia de cache baseada em:

1. **Chave de Cache**: Gerada a partir do provedor, modelo, texto de entrada e parâmetros relevantes
2. **TTL (Time-to-Live)**: Configurável por tipo de operação
3. **Invalidação Seletiva**: Capacidade de limpar o cache por padrões de chave

## Gestão de Configuração

A configuração do serviço é gerenciada através de:

1. **Variáveis de Ambiente**: Para credenciais e configurações sensíveis
2. **Arquivos de Configuração**: Para configurações complexas
3. **Configuração Dinâmica**: Opção de atualizar configurações via API administrativa

## Considerações de Escalabilidade

O serviço é projetado considerando:

1. **Escalabilidade Horizontal**: Múltiplas instâncias podem ser executadas em paralelo
2. **Cache Distribuído**: Redis como camada de cache compartilhada
3. **Processamento Assíncrono**: Uso extensivo de async/await para maximizar throughput
4. **Rate Limiting**: Proteção contra sobrecarga (por cliente e globalmente)