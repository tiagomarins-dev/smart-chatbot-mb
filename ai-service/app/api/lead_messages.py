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

@router.post("/analyze-lead", response_model=Dict[str, Any])
async def analyze_lead(
    request: Dict[str, Any],
    ai_service: AIService = Depends(),
    api_key: str = Depends(get_api_key)
):
    """
    Analisa um lead com base em conversas, eventos e atividades.
    
    Args:
        request: Dados do lead incluindo conversas, eventos e contexto.
        ai_service: Serviço de IA injetado.
        
    Returns:
        Análise completa do lead com sentimento, score e recomendações.
    """
    try:
        # Extrair dados do request
        lead_id = request.get("lead_id")
        lead_name = request.get("lead_name")
        conversations = request.get("conversations", [])
        events = request.get("events", [])
        projects = request.get("projects", [])
        
        # Preparar contexto para análise
        context = {
            "lead_id": lead_id,
            "lead_name": lead_name,
            "current_status": request.get("current_status"),
            "conversations": conversations,
            "events": events,
            "projects": projects,
            "lead_notes": request.get("lead_notes"),
            "lead_created_at": request.get("lead_created_at"),
            "lead_updated_at": request.get("lead_updated_at")
        }
        
        # Analisar sentimento usando o serviço de IA
        # Combinar conversas e eventos em texto para análise
        analysis_text = f"Lead: {lead_name}\n\n"
        
        # Adicionar conversas
        if conversations:
            analysis_text += "Conversas:\n"
            for conv in conversations[-10:]:  # Últimas 10 mensagens
                direction = "Cliente" if conv.get("direction") == "incoming" else "Empresa"
                analysis_text += f"[{direction}]: {conv.get('content', '')}\n"
        
        # Adicionar eventos
        if events:
            analysis_text += "\nEventos:\n"
            for event in events[-10:]:  # Últimos 10 eventos
                analysis_text += f"- {event.get('event_type')}: {event.get('event_data', {})}\n"
        
        # Adicionar notas
        if request.get("lead_notes"):
            analysis_text += f"\nNotas: {request.get('lead_notes')}\n"
        
        # Realizar análise de sentimento
        sentiment_result = await ai_service.analyze_sentiment(
            text=analysis_text,
            context=context
        )
        
        # Mapear resultado para formato esperado
        # A OpenAI pode retornar com chaves diferentes, vamos normalizar
        return {
            "sentiment_status": sentiment_result.get("sentiment_status") or sentiment_result.get("status_lead", "indeterminado"),
            "lead_score": sentiment_result.get("lead_score", 50),
            "ai_analysis": sentiment_result.get("analysis") or sentiment_result.get("ai_analysis", "Análise não disponível"),
            "recommended_actions": sentiment_result.get("recommended_actions") or sentiment_result.get("recomendacoes", []),
            # Informações de debug
            "prompt_used": analysis_text,
            "ai_model": sentiment_result.get("model_used", "gpt-3.5-turbo"),
            "ai_raw_response": sentiment_result
        }
        
    except Exception as e:
        logger.error(f"Error analyzing lead: {str(e)}")
        # Retornar análise padrão em caso de erro
        return {
            "sentiment_status": "indeterminado",
            "lead_score": 50,
            "ai_analysis": f"Erro na análise: {str(e)}",
            "recommended_actions": []
        }

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