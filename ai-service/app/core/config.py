import os
from typing import Dict, List, Union, Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """Configurações da aplicação baseadas em variáveis de ambiente."""
    
    # Configurações do servidor
    API_VERSION: str = "v1"
    PORT: int = int(os.getenv("PORT", 8000))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "info")
    LOG_FORMAT: str = os.getenv("LOG_FORMAT", "json")
    LOG_FILE: Optional[str] = os.getenv("LOG_FILE")
    
    # Segurança
    SECRET_KEY: str = os.getenv("SECRET_KEY", "insecure_dev_key_change_this")
    API_KEY: str = os.getenv("API_KEY", "dev_api_key_change_this")

    @property
    def ALLOWED_ORIGINS(self) -> List[str]:
        origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
        return origins.split(",")
    
    # Provedores de IA
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_ORG_ID: Optional[str] = os.getenv("OPENAI_ORG_ID")
    DEFAULT_PROVIDER: str = os.getenv("DEFAULT_PROVIDER", "openai")
    
    # Configurações de modelos
    CHAT_MODEL: str = os.getenv("CHAT_MODEL", "gpt-3.5-turbo")
    COMPLETION_MODEL: str = os.getenv("COMPLETION_MODEL", "gpt-3.5-turbo-instruct")
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "text-embedding-ada-002")
    SENTIMENT_MODEL: str = os.getenv("SENTIMENT_MODEL", "gpt-4")
    
    # Cache
    REDIS_URL: Optional[str] = os.getenv("REDIS_URL")
    CACHE_TTL: int = int(os.getenv("CACHE_TTL", 3600))
    CACHE_ENABLED: bool = os.getenv("CACHE_ENABLED", "true").lower() == "true"
    
    # Configurações por provedor
    PROVIDER_CONFIG: Dict[str, Dict] = {
        "openai": {
            "default_models": {
                "chat": CHAT_MODEL,
                "completion": COMPLETION_MODEL,
                "embedding": EMBEDDING_MODEL,
                "sentiment": SENTIMENT_MODEL
            }
        }
    }
    
    model_config = {
        "env_file": ".env",
        "case_sensitive": True
    }

# Instância única das configurações
settings = Settings()

# Função auxiliar para verificar ambiente
def is_development() -> bool:
    return settings.ENVIRONMENT.lower() == "development"

def is_production() -> bool:
    return settings.ENVIRONMENT.lower() == "production"

def get_model_for_task(task: str, provider: Optional[str] = None) -> str:
    """Obtém o modelo apropriado para uma tarefa específica."""
    provider_name = provider or settings.DEFAULT_PROVIDER
    provider_config = settings.PROVIDER_CONFIG.get(provider_name, {})
    default_models = provider_config.get("default_models", {})
    
    return default_models.get(task, settings.CHAT_MODEL)