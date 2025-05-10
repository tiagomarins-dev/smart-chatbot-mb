import logging
import os
import sys
from pythonjsonlogger import jsonlogger
from .config import settings

def setup_logging():
    """Configura o logging da aplicação."""
    # Determinar formato de logging
    if settings.LOG_FORMAT.lower() == "json":
        formatter = jsonlogger.JsonFormatter(
            fmt="%(asctime)s %(levelname)s %(name)s %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
    else:
        formatter = logging.Formatter(
            fmt="%(asctime)s - %(levelname)s - %(name)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
    
    # Configurar nível de log
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    
    # Configurar handler para console
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    
    # Configurar handler para arquivo, se especificado
    file_handlers = []
    if settings.LOG_FILE:
        # Criar diretório de logs se não existir
        os.makedirs(os.path.dirname(settings.LOG_FILE), exist_ok=True)
        
        file_handler = logging.FileHandler(settings.LOG_FILE)
        file_handler.setFormatter(formatter)
        file_handlers.append(file_handler)
    
    # Aplicar configuração
    logging.basicConfig(
        level=log_level,
        handlers=[console_handler] + file_handlers,
        force=True
    )
    
    # Reduzir verbosidade de logs de bibliotecas de terceiros
    logging.getLogger("uvicorn").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    
    # Log inicial
    logging.info(
        f"Logging initialized: level={settings.LOG_LEVEL}, format={settings.LOG_FORMAT}",
        extra={"environment": settings.ENVIRONMENT}
    )

# Função de conveniência para obter um logger configurado
def get_logger(name: str) -> logging.Logger:
    """Obtém um logger configurado para o módulo especificado."""
    return logging.getLogger(name)