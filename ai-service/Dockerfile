FROM python:3.9-slim

WORKDIR /app

# Copiar requirements e instalar dependências
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código da aplicação
COPY ./app /app/app

# Criar diretório de logs
RUN mkdir -p /app/logs

# Usar um usuário não-root para segurança
RUN adduser --disabled-password --gecos "" appuser
RUN chown -R appuser:appuser /app
USER appuser

# Configurar variáveis de ambiente
ENV PYTHONPATH=/app
ENV PORT=8050
ENV HOST=0.0.0.0

# Expor porta
EXPOSE 8050

# Comando para iniciar a aplicação
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8050"]