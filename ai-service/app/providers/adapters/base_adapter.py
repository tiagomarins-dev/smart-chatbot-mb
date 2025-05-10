"""
Interface base para adaptadores de provedores de IA.
"""

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
        
    @abstractmethod
    async def generate_lead_message(self, context: Dict[str, Any], options: Dict[str, Any]) -> str:
        """Gera uma mensagem personalizada para um lead."""
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