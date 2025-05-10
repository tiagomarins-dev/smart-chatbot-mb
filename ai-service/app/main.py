from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time
import logging
import os
from typing import List

# Importar configurações
from app.core.config import settings
from app.core.logging import setup_logging, get_logger

# Configurar logging
setup_logging()
logger = get_logger(__name__)

# Inicializar aplicação FastAPI
app = FastAPI(
    title="Smart Chatbot MB AI Service",
    description="Microserviço para integração com provedores de IA",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware para logging de requisições
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    # Processar requisição
    response = await call_next(request)
    
    # Calcular tempo de processamento
    process_time = time.time() - start_time
    
    # Log da requisição
    logger.info(
        f"Request: {request.method} {request.url.path}",
        extra={
            "method": request.method,
            "path": request.url.path,
            "process_time_ms": round(process_time * 1000, 2),
            "status_code": response.status_code
        }
    )
    
    return response

# Rota básica de saúde
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "0.1.0",
        "api_version": settings.API_VERSION,
        "environment": settings.ENVIRONMENT
    }

# Rota de informações
@app.get("/info")
async def service_info():
    return {
        "name": "Smart Chatbot MB AI Service",
        "version": "0.1.0",
        "description": "Microserviço para integração com provedores de IA",
        "providers": ["openai"],  # Por enquanto, apenas OpenAI
        "endpoints": [
            {"path": "/health", "method": "GET", "description": "Verificação de saúde do serviço"},
            {"path": "/info", "method": "GET", "description": "Informações sobre o serviço"},
            {"path": "/lead-messages/generate", "method": "POST", "description": "Geração de mensagens para leads"},
            {"path": "/lead-messages/ruth", "method": "POST", "description": "Geração de mensagens para o chatbot Ruth"}
        ]
    }

# Incluir rotas da API
from app.api.router import api_router
app.include_router(api_router, prefix=f"/{settings.API_VERSION}")

# Dependência para o Serviço de IA
from app.services.ai_service import AIService
@app.get("/api/dependencies")
def get_dependencies():
    return {"message": "Service dependencies loaded successfully"}

# Configuração para inicialização direta
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)