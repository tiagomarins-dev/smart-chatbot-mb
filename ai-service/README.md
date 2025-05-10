# Smart Chatbot MB AI Service

Microserviço para integração com provedores de IA para o projeto Smart Chatbot MB.

## Recursos

- API FastAPI para integração com modelos de IA
- Suporte ao chatbot Ruth personalizado com prompts XML
- Análise de sentimento para leads
- Geração de mensagens automáticas personalizadas
- Arquitetura flexível para adicionar novos provedores de IA

## Pré-requisitos

- Python 3.9+
- API Key da OpenAI
- Redis (opcional, para cache)

## Configuração

1. Clone o repositório
2. Crie um ambiente virtual Python:
   ```bash
   cd ai-service
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   venv\Scripts\activate     # Windows
   ```
3. Instale as dependências:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure as variáveis de ambiente copiando o arquivo `.env.example` para `.env` e preenchendo os valores necessários
   ```bash
   cp .env.example .env
   # Edite o arquivo .env com suas configurações
   ```

## Executando o serviço

### Desenvolvimento

Para executar o serviço em modo de desenvolvimento:

```bash
cd ai-service
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Docker

Para executar usando Docker:

```bash
cd ai-service
docker-compose up -d
```

### Scripts de Conveniência

O projeto inclui scripts para facilitar o gerenciamento do serviço:

- `./start-dev.sh` - Inicia o serviço em modo de desenvolvimento
- `./stop-dev.sh` - Para o serviço
- `./test-api.sh` - Testa os endpoints da API

## API Endpoints

- `GET /health` - Verificação de saúde do serviço
- `GET /info` - Informações sobre o serviço
- `POST /v1/lead-messages/generate` - Geração de mensagens para leads
- `POST /v1/lead-messages/ruth` - Geração de mensagens para o chatbot Ruth

A documentação completa da API está disponível em:
- Swagger UI: `/docs`
- ReDoc: `/redoc`

## Autenticação

A API utiliza autenticação por API Key. Você deve incluir o header `X-API-Key` com o valor configurado em todas as requisições.

## Implementações Futuras

- Suporte a outros provedores de IA (Anthropic, Google, etc.)
- Cache em Redis para otimização de desempenho
- Analytics e rastreamento de uso
- Testes automatizados