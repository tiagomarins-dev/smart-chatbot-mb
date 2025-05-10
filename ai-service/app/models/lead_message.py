"""
Modelos para a API de mensagens para leads.
"""

from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any, Union

class LeadInfo(BaseModel):
    """Informações básicas sobre um lead."""
    
    id: str
    name: str
    sentiment_status: Optional[str] = "indeterminado"
    lead_score: Optional[int] = 50
    project_name: Optional[str] = None

class MessageInfo(BaseModel):
    """Informações sobre uma mensagem."""
    
    direction: str  # "incoming" ou "outgoing"
    content: str
    timestamp: str

class InactivityContext(BaseModel):
    """Contexto para mensagens de inatividade."""
    
    level: str  # "short", "medium", "long"
    days_inactive: int
    last_interaction: Optional[Dict[str, Any]] = None

class EventContext(BaseModel):
    """Contexto para mensagens baseadas em eventos."""
    
    event_type: str
    event_data: Dict[str, Any] = {}
    message_purpose: Optional[str] = None

class LeadMessageRequest(BaseModel):
    """Requisição para geração de mensagem para lead."""
    
    lead_info: LeadInfo
    user_message: Optional[str] = None
    conversation_history: Optional[List[MessageInfo]] = None
    event_context: Optional[EventContext] = None
    inactivity_context: Optional[InactivityContext] = None
    personalization_hints: Optional[List[str]] = None
    chatbot_type: Optional[str] = None  # "ruth" para o chatbot Ruth
    provider: Optional[str] = None
    model: Optional[str] = None
    
    class Config:
        schema_extra = {
            "example": {
                "lead_info": {
                    "id": "a5cd4a8d-1264-4752-b1a3-29e7e5740083",
                    "name": "João Silva",
                    "sentiment_status": "interessado",
                    "lead_score": 85,
                    "project_name": "Residencial Aurora"
                },
                "user_message": "Olá, gostaria de saber mais sobre o curso de redação",
                "conversation_history": [
                    {
                        "direction": "incoming",
                        "content": "Olá, gostaria de saber mais sobre o curso de redação",
                        "timestamp": "2023-06-01T10:15:00Z"
                    }
                ],
                "chatbot_type": "ruth",
                "model": "gpt-4"
            }
        }

class RuthMessageRequest(BaseModel):
    """Requisição específica para mensagens do chatbot Ruth."""
    
    user_message: str
    conversation_history: Optional[List[MessageInfo]] = None
    model: Optional[str] = None
    
    class Config:
        schema_extra = {
            "example": {
                "user_message": "Olá, gostaria de saber mais sobre o curso de redação",
                "conversation_history": [
                    {
                        "direction": "incoming",
                        "content": "Olá, gostaria de saber mais sobre o curso de redação",
                        "timestamp": "2023-06-01T10:15:00Z"
                    }
                ],
                "model": "gpt-4"
            }
        }

class MessageResponse(BaseModel):
    """Resposta com mensagem gerada."""
    
    message: str
    suggested_timing: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    
    class Config:
        schema_extra = {
            "example": {
                "message": "Olá João, tudo bem? Vi que você demonstrou interesse no Método Blindado. Posso te contar mais sobre como nosso curso pode te ajudar a melhorar suas redações?",
                "suggested_timing": "business_hours",
                "metadata": {
                    "event_type": "lead_inquiry",
                    "sentiment_used": "interessado",
                    "lead_score_used": 85
                }
            }
        }