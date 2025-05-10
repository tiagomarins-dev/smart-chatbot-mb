"""
Configuração de rotas da API.
"""

from fastapi import APIRouter
from app.api import lead_messages

# Criar router principal
api_router = APIRouter()

# Incluir routers específicos
api_router.include_router(lead_messages.router)