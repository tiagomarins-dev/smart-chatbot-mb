# Guia de Provedores de IA

Este documento descreve como integrar diferentes provedores de modelos de IA ao serviço, detalhando a arquitetura de adaptadores, configurações necessárias e exemplos de implementação.

## Arquitetura de Adaptadores

O serviço utiliza um padrão de adaptador para abstrair as diferenças entre os provedores de IA. Todos os adaptadores implementam uma interface comum, permitindo que o sistema use qualquer provedor de forma intercambiável.

### Interface Base do Adaptador

```python
from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional

class BaseProviderAdapter(ABC):
    """Interface base que todos os adaptadores de provedores de IA devem implementar."""
    
    @abstractmethod
    async def get_completion(self, prompt: str, options: Dict[str, Any]) -> str:
        """Gera uma completion baseada no prompt fornecido."""
        pass
        
    @abstractmethod
    async def get_chat_response(self, messages: List[Dict[str, str]], options: Dict[str, Any]) -> Dict[str, Any]:
        """Gera uma resposta de chat baseada na lista de mensagens."""
        pass
        
    @abstractmethod
    async def get_embedding(self, text: str, options: Dict[str, Any]) -> List[float]:
        """Gera um embedding vetorial para o texto fornecido."""
        pass
        
    @abstractmethod
    async def analyze_sentiment(self, text: str, options: Dict[str, Any]) -> Dict[str, Any]:
        """Analisa o sentimento de um texto."""
        pass
        
    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Retorna o nome do provedor."""
        pass
        
    @property
    @abstractmethod
    def available_models(self) -> Dict[str, List[str]]:
        """Retorna um dicionário com os modelos disponíveis agrupados por tipo."""
        pass
        
    @abstractmethod
    async def validate_credentials(self) -> bool:
        """Valida se as credenciais do provedor estão corretas."""
        pass
```

## Provedores Implementados

### 1. OpenAI

O adaptador OpenAI é a implementação de referência, suportando modelos GPT-3.5, GPT-4 e embeddings.

#### Configuração

Configuração necessária no arquivo de ambiente:

```
OPENAI_API_KEY=sua_chave_api
OPENAI_ORG_ID=seu_id_organizacao  # opcional
```

#### Implementação

```python
# app/providers/adapters/openai_adapter.py
import openai
from typing import Dict, List, Any, Optional
from app.providers.base_adapter import BaseProviderAdapter

class OpenAIAdapter(BaseProviderAdapter):
    """Adaptador para a API da OpenAI."""
    
    def __init__(self, api_key: str, org_id: Optional[str] = None):
        """Inicializa o cliente OpenAI com credenciais."""
        self.client = openai.OpenAI(api_key=api_key, organization=org_id)
        self._models_info = self._get_models_info()
    
    async def get_completion(self, prompt: str, options: Dict[str, Any]) -> str:
        """Gera uma completion usando a API da OpenAI."""
        model = options.get("model", "gpt-3.5-turbo-instruct")
        max_tokens = options.get("max_tokens", 100)
        temperature = options.get("temperature", 0.7)
        
        response = await self.client.completions.create(
            model=model,
            prompt=prompt,
            max_tokens=max_tokens,
            temperature=temperature
        )
        
        return response.choices[0].text.strip()
    
    async def get_chat_response(self, messages: List[Dict[str, str]], options: Dict[str, Any]) -> Dict[str, Any]:
        """Gera uma resposta de chat usando a API da OpenAI."""
        model = options.get("model", "gpt-3.5-turbo")
        temperature = options.get("temperature", 0.7)
        
        response = await self.client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature
        )
        
        return {
            "message": {
                "role": response.choices[0].message.role,
                "content": response.choices[0].message.content
            },
            "usage": {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens
            }
        }
    
    async def get_embedding(self, text: str, options: Dict[str, Any]) -> List[float]:
        """Gera um embedding usando a API da OpenAI."""
        model = options.get("model", "text-embedding-ada-002")
        
        response = await self.client.embeddings.create(
            model=model,
            input=text
        )
        
        return response.data[0].embedding
    
    async def analyze_sentiment(self, text: str, options: Dict[str, Any]) -> Dict[str, Any]:
        """Analisa o sentimento usando um modelo da OpenAI."""
        model = options.get("model", "gpt-4")
        context = options.get("context", {})
        
        system_prompt = """
        Analise o sentimento do texto a seguir e forneça:
        1. Uma pontuação de sentimento de -1 (muito negativo) a 1 (muito positivo)
        2. A intenção principal (pergunta, reclamação, elogio, solicitação, informação)
        3. Entidades relevantes mencionadas e o sentimento associado a cada uma
        4. Status do lead (interessado, sem interesse, achou caro, quer desconto, parcelamento, compra futura, indeterminado)
        5. Lead score (0-100) indicando proximidade de conversão
        6. Recomendações para abordagem

        Responda em formato JSON.
        """
        
        if context.get("product"):
            system_prompt += f"\nContexto: O produto/serviço em questão é {context.get('product')}."
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": text}
        ]
        
        response = await self.client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        
        result = json.loads(response.choices[0].message.content)
        return result
    
    @property
    def provider_name(self) -> str:
        """Retorna o nome do provedor."""
        return "openai"
    
    @property
    def available_models(self) -> Dict[str, List[str]]:
        """Retorna os modelos disponíveis agrupados por tipo."""
        return self._models_info
    
    def _get_models_info(self) -> Dict[str, List[str]]:
        """Obtém informações sobre os modelos disponíveis."""
        # Categorização dos modelos por tipo
        return {
            "chat": [
                "gpt-4", "gpt-4-turbo", "gpt-3.5-turbo", "gpt-3.5-turbo-16k"
            ],
            "completion": [
                "gpt-3.5-turbo-instruct", "babbage-002", "davinci-002"
            ],
            "embedding": [
                "text-embedding-ada-002"
            ]
        }
    
    async def validate_credentials(self) -> bool:
        """Valida se as credenciais da OpenAI estão corretas."""
        try:
            response = await self.client.models.list()
            return True if response else False
        except Exception:
            return False
```

## Adicionando Novos Provedores

Para adicionar um novo provedor, siga estes passos:

1. **Criar um Novo Adaptador**: Implemente a interface `BaseProviderAdapter`
2. **Registrar o Adaptador**: Adicione-o ao gerenciador de provedores
3. **Configurar Variáveis de Ambiente**: Defina as chaves de API necessárias
4. **Atualizar Documentação**: Documente os modelos e recursos suportados

### Exemplo: Implementando Adaptador para Anthropic Claude

```python
# app/providers/adapters/anthropic_adapter.py
from typing import Dict, List, Any, Optional
import anthropic
import json
from app.providers.base_adapter import BaseProviderAdapter

class AnthropicAdapter(BaseProviderAdapter):
    """Adaptador para a API da Anthropic (Claude)."""
    
    def __init__(self, api_key: str):
        """Inicializa o cliente Anthropic com credenciais."""
        self.client = anthropic.Anthropic(api_key=api_key)
    
    async def get_completion(self, prompt: str, options: Dict[str, Any]) -> str:
        """Gera uma completion usando a API da Anthropic."""
        model = options.get("model", "claude-2")
        max_tokens = options.get("max_tokens", 100)
        temperature = options.get("temperature", 0.7)
        
        response = await self.client.completions.create(
            model=model,
            prompt=f"{anthropic.HUMAN_PROMPT} {prompt}{anthropic.AI_PROMPT}",
            max_tokens_to_sample=max_tokens,
            temperature=temperature
        )
        
        return response.completion
    
    async def get_chat_response(self, messages: List[Dict[str, str]], options: Dict[str, Any]) -> Dict[str, Any]:
        """Gera uma resposta de chat usando a API da Anthropic."""
        model = options.get("model", "claude-2")
        temperature = options.get("temperature", 0.7)
        
        # Converter formato de mensagens OpenAI para Anthropic
        prompt = ""
        for message in messages:
            if message["role"] == "system":
                # Prepend system message to the first user message
                continue
            elif message["role"] == "user":
                prompt += f"{anthropic.HUMAN_PROMPT} {message['content']}"
            elif message["role"] == "assistant":
                prompt += f"{anthropic.AI_PROMPT} {message['content']}"
        
        # Add final AI prompt
        prompt += anthropic.AI_PROMPT
        
        response = await self.client.completions.create(
            model=model,
            prompt=prompt,
            max_tokens_to_sample=1000,
            temperature=temperature
        )
        
        return {
            "message": {
                "role": "assistant",
                "content": response.completion
            },
            "usage": {
                "prompt_tokens": None,  # Anthropic não fornece contagem de tokens
                "completion_tokens": None,
                "total_tokens": None
            }
        }
    
    async def get_embedding(self, text: str, options: Dict[str, Any]) -> List[float]:
        """Gera um embedding (não disponível nativamente no Anthropic)."""
        raise NotImplementedError("Embeddings não são suportados nativamente pela API da Anthropic")
    
    async def analyze_sentiment(self, text: str, options: Dict[str, Any]) -> Dict[str, Any]:
        """Analisa o sentimento usando um modelo da Anthropic."""
        model = options.get("model", "claude-2")
        context = options.get("context", {})
        
        system_instruction = """
        Analise o sentimento do texto a seguir e forneça:
        1. Uma pontuação de sentimento de -1 (muito negativo) a 1 (muito positivo)
        2. A intenção principal (pergunta, reclamação, elogio, solicitação, informação)
        3. Entidades relevantes mencionadas e o sentimento associado a cada uma
        4. Status do lead (interessado, sem interesse, achou caro, quer desconto, parcelamento, compra futura, indeterminado)
        5. Lead score (0-100) indicando proximidade de conversão
        6. Recomendações para abordagem

        Responda em formato JSON.
        """
        
        if context.get("product"):
            system_instruction += f"\nContexto: O produto/serviço em questão é {context.get('product')}."
        
        prompt = f"{anthropic.HUMAN_PROMPT} {system_instruction}\n\nTexto para análise: {text}\n\nForneça a análise em formato JSON.{anthropic.AI_PROMPT}"
        
        response = await self.client.completions.create(
            model=model,
            prompt=prompt,
            max_tokens_to_sample=1000,
            temperature=0.3
        )
        
        try:
            # Extrair o JSON da resposta
            result = json.loads(response.completion.strip())
            return result
        except json.JSONDecodeError:
            # Fallback se a resposta não for um JSON válido
            return {
                "error": "Falha ao parsear resposta JSON",
                "raw_response": response.completion
            }
    
    @property
    def provider_name(self) -> str:
        """Retorna o nome do provedor."""
        return "anthropic"
    
    @property
    def available_models(self) -> Dict[str, List[str]]:
        """Retorna os modelos disponíveis agrupados por tipo."""
        return {
            "chat": ["claude-2", "claude-instant-1"],
            "completion": ["claude-2", "claude-instant-1"],
            "embedding": []  # Não suportado nativamente
        }
    
    async def validate_credentials(self) -> bool:
        """Valida se as credenciais da Anthropic estão corretas."""
        try:
            # Teste simples para verificar se a API está funcionando
            response = await self.client.completions.create(
                model="claude-instant-1",
                prompt=f"{anthropic.HUMAN_PROMPT} Hello{anthropic.AI_PROMPT}",
                max_tokens_to_sample=10
            )
            return True if response else False
        except Exception:
            return False
```

## Registrando Provedores no Gerenciador

O gerenciador de provedores carrega e gerencia todos os adaptadores disponíveis:

```python
# app/providers/manager.py
from typing import Dict, Any, Optional, List, Type
import importlib
import os

from app.providers.base_adapter import BaseProviderAdapter
from app.core.config import settings

class ProviderManager:
    """Gerenciador de provedores de IA."""
    
    def __init__(self):
        """Inicializa o gerenciador e carrega os adaptadores configurados."""
        self.adapters: Dict[str, BaseProviderAdapter] = {}
        self.default_provider = settings.DEFAULT_PROVIDER
        self._load_providers()
    
    def _load_providers(self) -> None:
        """Carrega os adaptadores de provedores conforme configuração."""
        # OpenAI (sempre disponível como provedor padrão)
        from app.providers.adapters.openai_adapter import OpenAIAdapter
        if settings.OPENAI_API_KEY:
            self.adapters["openai"] = OpenAIAdapter(
                api_key=settings.OPENAI_API_KEY,
                org_id=settings.OPENAI_ORG_ID
            )
        
        # Anthropic (opcional)
        if settings.ANTHROPIC_API_KEY:
            try:
                from app.providers.adapters.anthropic_adapter import AnthropicAdapter
                self.adapters["anthropic"] = AnthropicAdapter(
                    api_key=settings.ANTHROPIC_API_KEY
                )
            except ImportError:
                pass  # Ignora se o paciente anthropic não estiver instalado
        
        # Outros provedores podem ser adicionados aqui
    
    def get_provider(self, provider_name: Optional[str] = None) -> BaseProviderAdapter:
        """Obtém o adaptador do provedor especificado ou o padrão."""
        name = provider_name or self.default_provider
        if name not in self.adapters:
            raise ValueError(f"Provedor '{name}' não configurado ou não disponível")
        return self.adapters[name]
    
    def available_providers(self) -> List[str]:
        """Retorna a lista de provedores disponíveis."""
        return list(self.adapters.keys())
    
    def provider_status(self) -> Dict[str, Any]:
        """Verifica o status de todos os provedores configurados."""
        status = {}
        for name, adapter in self.adapters.items():
            try:
                is_valid = adapter.validate_credentials()
                status[name] = {
                    "available": True,
                    "credentials_valid": is_valid,
                    "models": adapter.available_models
                }
            except Exception as e:
                status[name] = {
                    "available": False,
                    "error": str(e)
                }
        return status
```

## Configuração de Modelos

Cada adaptador deve definir a propriedade `available_models` para listar os modelos suportados por tipo. A configuração de modelos padrão para cada tipo de operação pode ser definida no arquivo de configuração:

```yaml
# config/providers.yaml
providers:
  openai:
    default_models:
      chat: gpt-3.5-turbo
      completion: gpt-3.5-turbo-instruct
      embedding: text-embedding-ada-002
      sentiment: gpt-4
  
  anthropic:
    default_models:
      chat: claude-2
      completion: claude-2
      sentiment: claude-2
```

## Considerações para Adicionar Novos Provedores

Ao implementar um novo adaptador, considere:

1. **Mapeamento de Funcionalidades**: Nem todos os provedores oferecem os mesmos recursos
2. **Formatos de Mensagens**: Converta entre formatos (ex: OpenAI vs Anthropic)
3. **Parâmetros Específicos**: Adapte parâmetros genéricos para os específicos do provedor
4. **Tratamento de Erros**: Mapeie erros específicos do provedor para uma camada de abstração
5. **Limitações**: Documente quais recursos não são suportados

## Testando Provedores

Para cada adaptador, crie testes automatizados que verifiquem a funcionalidade com as APIs reais:

```python
# tests/providers/test_openai_adapter.py
import pytest
from app.providers.adapters.openai_adapter import OpenAIAdapter

@pytest.mark.asyncio
async def test_openai_completion():
    adapter = OpenAIAdapter(api_key="test-key")
    # Mock a resposta da API
    # Teste a função get_completion
    
@pytest.mark.asyncio
async def test_openai_chat():
    adapter = OpenAIAdapter(api_key="test-key")
    # Mock a resposta da API
    # Teste a função get_chat_response
```

## Roteiro de Implementação de Provedores

### Fase 1: Provedor Inicial
- [x] OpenAI (Implementação completa)

### Fase 2: Provedores Adicionais
- [ ] Anthropic Claude
- [ ] Google Gemini
- [ ] Mistral AI
- [ ] Cohere

### Fase 3: Modelos Locais
- [ ] Llama 2
- [ ] Falcon
- [ ] Ollama