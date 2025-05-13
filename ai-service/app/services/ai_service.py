"""
Serviço para operações de IA.
"""

import logging
from typing import Dict, List, Any, Optional

from app.providers.manager import provider_manager
from app.core.config import settings, get_model_for_task

logger = logging.getLogger(__name__)

class AIService:
    """Serviço que coordena operações de IA."""
    
    async def get_completion(self, prompt: str, options: Dict[str, Any] = None) -> str:
        """
        Gera uma completion para o prompt fornecido.
        
        Args:
            prompt: Texto de entrada.
            options: Opções para a geração (modelo, temperatura, etc).
            
        Returns:
            Texto gerado.
        """
        options = options or {}
        provider_name = options.pop("provider", None)
        model = options.get("model", get_model_for_task("completion", provider_name))
        
        logger.info(f"Getting completion with model {model}")
        
        provider = provider_manager.get_provider(provider_name)
        return await provider.get_completion(prompt, {"model": model, **options})
    
    async def get_chat_response(self, messages: List[Dict[str, str]], options: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Gera uma resposta de chat para as mensagens fornecidas.
        
        Args:
            messages: Lista de mensagens no formato {role, content}.
            options: Opções para a geração (modelo, temperatura, etc).
            
        Returns:
            Dicionário com a resposta e metadados.
        """
        options = options or {}
        provider_name = options.pop("provider", None)
        model = options.get("model", get_model_for_task("chat", provider_name))
        
        logger.info(f"Getting chat response with model {model}")
        
        provider = provider_manager.get_provider(provider_name)
        return await provider.get_chat_response(messages, {"model": model, **options})
    
    async def get_embedding(self, text: str, options: Dict[str, Any] = None) -> List[float]:
        """
        Gera um embedding vetorial para o texto fornecido.
        
        Args:
            text: Texto para gerar o embedding.
            options: Opções para a geração (modelo, etc).
            
        Returns:
            Lista de valores float representando o embedding.
        """
        options = options or {}
        provider_name = options.pop("provider", None)
        model = options.get("model", get_model_for_task("embedding", provider_name))
        
        logger.info(f"Getting embedding with model {model}")
        
        provider = provider_manager.get_provider(provider_name)
        return await provider.get_embedding(text, {"model": model, **options})
    
    async def analyze_sentiment(self, text: str, context: Dict[str, Any] = None, options: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Analisa o sentimento de um texto.
        
        Args:
            text: Texto para analisar.
            context: Contexto adicional para a análise.
            options: Opções para a análise (modelo, etc).
            
        Returns:
            Dicionário com os resultados da análise de sentimento.
        """
        options = options or {}
        context = context or {}
        provider_name = options.pop("provider", None)
        model = options.get("model", get_model_for_task("sentiment", provider_name))
        
        logger.info(f"Analyzing sentiment with model {model}")
        
        provider = provider_manager.get_provider(provider_name)
        return await provider.analyze_sentiment(text, {"model": model, "context": context, **options})
    
    async def generate_lead_message(self, context: Dict[str, Any], options: Dict[str, Any] = None) -> str:
        """
        Gera uma mensagem personalizada para um lead.

        Args:
            context: Contexto do lead e do evento.
            options: Opções para a geração da mensagem.

        Returns:
            Mensagem gerada.
        """
        options = options or {}
        provider_name = options.pop("provider", None)
        model = options.get("model", get_model_for_task("chat", provider_name))

        logger.info(f"Generating lead message with model {model}")

        provider = provider_manager.get_provider(provider_name)
        # The provider's generate_lead_message method is already async
        # so we need to wait for its result
        result = await provider.generate_lead_message(context, {"model": model, **options})
        return result
    
    async def get_provider_status(self) -> Dict[str, Any]:
        """
        Verifica o status de todos os provedores configurados.
        
        Returns:
            Dicionário com o status de cada provedor.
        """
        return await provider_manager.provider_status()