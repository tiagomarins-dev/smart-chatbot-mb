"""
API para geração de mensagens para leads.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, Security
from typing import Dict, Any, List

from app.models.lead_message import (
    LeadMessageRequest, RuthMessageRequest, MessageResponse
)
from app.services.ai_service import AIService
from app.core.config import settings
from app.core.auth import get_api_key

router = APIRouter(prefix="/lead-messages", tags=["lead-messages"])
logger = logging.getLogger(__name__)

@router.post("/generate", response_model=MessageResponse)
async def generate_lead_message(
    request: LeadMessageRequest,
    ai_service: AIService = Depends(),
    api_key: str = Depends(get_api_key)
):
    """
    Gera uma mensagem personalizada para um lead.
    
    Args:
        request: Dados do lead e contexto para a mensagem.
        ai_service: Serviço de IA injetado.
        
    Returns:
        Mensagem gerada para o lead.
    """
    try:
        # Preparar o contexto para o provedor de IA
        context = {
            "lead_info": request.lead_info.dict(),
            "chatbot_type": request.chatbot_type,
            "user_message": request.user_message,
            "personalization_hints": request.personalization_hints or []
        }
        
        # Adicionar histórico de conversa se disponível
        if request.conversation_history:
            context["conversation_history"] = [msg.dict() for msg in request.conversation_history]
        
        # Adicionar contexto de evento se disponível
        if request.event_context:
            context["event_type"] = request.event_context.event_type
            context["event_data"] = request.event_context.event_data
            context["message_purpose"] = request.event_context.message_purpose
        
        # Adicionar contexto de inatividade se disponível
        if request.inactivity_context:
            context["inactivity_context"] = request.inactivity_context.dict()
        
        # Opções para a geração da mensagem
        options = {}
        if request.model:
            options["model"] = request.model
        if request.provider:
            options["provider"] = request.provider
        
        # Gerar a mensagem
        message = await ai_service.generate_lead_message(context, options)
        
        # Determinar timing sugerido
        suggested_timing = "business_hours"
        if context.get("event_type") == "carrinho_abandonado":
            suggested_timing = "immediate"
        elif context.get("inactivity_context", {}).get("level") == "long":
            suggested_timing = "morning"
        
        # Metadados
        metadata = {
            "lead_id": request.lead_info.id,
            "sentiment_status": request.lead_info.sentiment_status,
            "lead_score": request.lead_info.lead_score
        }
        
        if request.event_context:
            metadata["event_type"] = request.event_context.event_type
        
        if request.inactivity_context:
            metadata["inactivity_level"] = request.inactivity_context.level
            metadata["days_inactive"] = request.inactivity_context.days_inactive
        
        return MessageResponse(
            message=message,
            suggested_timing=suggested_timing,
            metadata=metadata
        )
    
    except Exception as e:
        logger.error(f"Error generating lead message: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate message: {str(e)}")

@router.post("/ruth", response_model=MessageResponse)
async def generate_ruth_message(
    request: RuthMessageRequest,
    ai_service: AIService = Depends(),
    api_key: str = Depends(get_api_key)
):
    """
    Gera uma mensagem específica para o chatbot Ruth.
    
    Args:
        request: Mensagem do usuário e contexto.
        ai_service: Serviço de IA injetado.
        
    Returns:
        Mensagem gerada pelo chatbot Ruth.
    """
    try:
        # Preparar o contexto
        context = {
            "chatbot_type": "ruth",
            "user_message": request.user_message
        }
        
        # Adicionar histórico de conversa se disponível
        if request.conversation_history:
            context["conversation_history"] = [msg.dict() for msg in request.conversation_history]
        
        # Opções para a geração da mensagem
        options = {}
        if request.model:
            options["model"] = request.model
        
        # Gerar a mensagem
        message = await ai_service.generate_lead_message(context, options)
        
        return MessageResponse(
            message=message,
            metadata={
                "chatbot": "ruth"
            }
        )
    
    except Exception as e:
        logger.error(f"Error generating Ruth message: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate message: {str(e)}")