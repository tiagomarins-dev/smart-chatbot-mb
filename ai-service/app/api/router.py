"""
Configuração de rotas da API.
"""

from fastapi import APIRouter
from app.api import lead_messages

# Criar router principal
api_router = APIRouter()

# Incluir routers específicos
api_router.include_router(lead_messages.router)

# Adicionar rota direta para analyze-lead no nível /api
@api_router.post("/analyze-lead")
async def analyze_lead_direct(request: dict):
    """Rota direta para análise de lead (compatibilidade com backend)"""
    from app.api.lead_messages import analyze_lead as _analyze_lead
    from app.services.ai_service import AIService
    ai_service = AIService()
    # Simular API key para chamadas internas
    return await _analyze_lead(request, ai_service, "internal")