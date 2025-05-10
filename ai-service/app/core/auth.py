"""
Funcionalidades de autenticação e autorização.
"""

import logging
from fastapi import Depends, HTTPException, status, Security
from fastapi.security import APIKeyHeader
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)

# Definir esquema de autenticação por API Key no header
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

async def get_api_key(api_key: Optional[str] = Security(api_key_header)) -> str:
    """
    Dependência para validar API Key.
    
    Args:
        api_key: API Key fornecida no header da requisição.
        
    Returns:
        API Key validada.
        
    Raises:
        HTTPException: Se a API Key for inválida ou ausente.
    """
    if api_key == settings.API_KEY:
        return api_key
    
    logger.warning(f"Invalid API key attempt: {api_key}")
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or missing API Key"
    )