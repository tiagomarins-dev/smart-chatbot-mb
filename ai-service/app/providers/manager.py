"""
Gerenciador de provedores de IA.
"""

import logging
from typing import Dict, Any, Optional, List, Type
import importlib
import os

from app.providers.adapters.base_adapter import BaseProviderAdapter
from app.core.config import settings

logger = logging.getLogger(__name__)

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
            logger.info("Loading OpenAI adapter")
            self.adapters["openai"] = OpenAIAdapter(
                api_key=settings.OPENAI_API_KEY,
                org_id=settings.OPENAI_ORG_ID
            )
        else:
            logger.warning("OPENAI_API_KEY not found, OpenAI adapter will not be available")
        
        # Outros provedores podem ser adicionados aqui no futuro
    
    def get_provider(self, provider_name: Optional[str] = None) -> BaseProviderAdapter:
        """Obtém o adaptador do provedor especificado ou o padrão."""
        name = provider_name or self.default_provider
        if name not in self.adapters:
            raise ValueError(f"Provider '{name}' not configured or not available")
        return self.adapters[name]
    
    def available_providers(self) -> List[str]:
        """Retorna a lista de provedores disponíveis."""
        return list(self.adapters.keys())
    
    async def provider_status(self) -> Dict[str, Any]:
        """Verifica o status de todos os provedores configurados."""
        status = {}
        for name, adapter in self.adapters.items():
            try:
                is_valid = await adapter.validate_credentials()
                status[name] = {
                    "available": True,
                    "credentials_valid": is_valid,
                    "models": adapter.available_models
                }
            except Exception as e:
                logger.error(f"Error checking provider {name} status: {str(e)}")
                status[name] = {
                    "available": False,
                    "error": str(e)
                }
        return status


# Instância global do gerenciador
provider_manager = ProviderManager()