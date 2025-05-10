# Guia de Implantação do Serviço de IA

Este documento descreve o processo de implantação do serviço de IA em diferentes ambientes.

## Pré-requisitos

- Python 3.9+
- Docker e Docker Compose
- Acesso a uma instância Redis (opcional, para cache)
- Chaves de API para os provedores de IA (OpenAI, etc.)

## Estrutura de Diretórios

```
ai-service/
├── app/                    # Código fonte do aplicativo
│   ├── api/                # Endpoints da API
│   ├── core/               # Componentes principais
│   ├── providers/          # Adaptadores de provedores de IA
│   ├── services/           # Lógica de negócios
│   └── main.py             # Ponto de entrada do aplicativo
├── config/                 # Arquivos de configuração
│   ├── dev.yaml            # Configuração de desenvolvimento
│   ├── prod.yaml           # Configuração de produção
│   └── test.yaml           # Configuração de teste
├── tests/                  # Testes automatizados
├── docker/                 # Arquivos Docker
│   ├── Dockerfile          # Definição da imagem
│   └── docker-compose.yml  # Configuração de composição
├── .env.example            # Exemplo de variáveis de ambiente
└── requirements.txt        # Dependências Python
```

## Configuração de Ambiente

### 1. Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```
# Configuração do servidor
PORT=8000
ENVIRONMENT=development  # development, testing, production
LOG_LEVEL=info

# Segurança
SECRET_KEY=seu_secret_key_seguro
ALLOWED_ORIGINS=http://localhost:3000,https://seudominio.com

# Provedores de IA
OPENAI_API_KEY=sua_chave_de_api_openai
DEFAULT_PROVIDER=openai
DEFAULT_MODEL=gpt-3.5-turbo

# Cache
REDIS_URL=redis://localhost:6379
CACHE_TTL=3600  # Tempo de vida do cache em segundos
```

### 2. Configuração Adicional

Configure os arquivos YAML em `config/` de acordo com o ambiente de implantação:

- `dev.yaml` para desenvolvimento local
- `prod.yaml` para produção
- `test.yaml` para testes automatizados

## Implantação com Docker

### 1. Construção da Imagem

```bash
docker build -t ai-service:latest -f docker/Dockerfile .
```

### 2. Execução com Docker Compose

```bash
docker-compose -f docker/docker-compose.yml up -d
```

O arquivo `docker-compose.yml` incluirá:

```yaml
version: '3.8'

services:
  ai-service:
    image: ai-service:latest
    ports:
      - "8000:8000"
    env_file:
      - .env
    volumes:
      - ./logs:/app/logs
    depends_on:
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:6.2-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    restart: unless-stopped

volumes:
  redis-data:
```

## Implantação em Kubernetes

### 1. Configuração de Kubernetes

Crie os arquivos de manifesto do Kubernetes:

1. **Deployment**

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-service
  namespace: default
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ai-service
  template:
    metadata:
      labels:
        app: ai-service
    spec:
      containers:
      - name: ai-service
        image: your-registry/ai-service:latest
        ports:
        - containerPort: 8000
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        env:
          - name: PORT
            value: "8000"
          - name: ENVIRONMENT
            value: "production"
        envFrom:
          - secretRef:
              name: ai-service-secrets
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
```

2. **Service**

```yaml
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: ai-service
  namespace: default
spec:
  selector:
    app: ai-service
  ports:
  - port: 80
    targetPort: 8000
  type: ClusterIP
```

3. **Secrets**

```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: ai-service-secrets
  namespace: default
type: Opaque
data:
  OPENAI_API_KEY: base64_encoded_key
  SECRET_KEY: base64_encoded_secret
  REDIS_URL: base64_encoded_url
```

### 2. Aplicar Configurações

```bash
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/secrets.yaml
```

## Implantação Serverless (AWS Lambda)

Para uma configuração serverless, siga estas etapas:

1. **Instale o framework Mangum** para compatibilidade do FastAPI com AWS Lambda:

```bash
pip install mangum
```

2. **Modifique `main.py`** para suportar AWS Lambda:

```python
from fastapi import FastAPI
from mangum import Mangum

app = FastAPI()

# Adicione seus endpoints aqui

# Handler para AWS Lambda
handler = Mangum(app)
```

3. **Configure o Serverless Framework**:

```yaml
# serverless.yml
service: ai-service

provider:
  name: aws
  runtime: python3.9
  region: us-east-1
  memorySize: 512
  timeout: 30
  environment:
    OPENAI_API_KEY: ${env:OPENAI_API_KEY}
    # outras variáveis de ambiente

functions:
  api:
    handler: app.main.handler
    events:
      - http:
          path: /{proxy+}
          method: ANY
          cors: true
```

4. **Implante com Serverless Framework**:

```bash
serverless deploy
```

## Escalabilidade e Alta Disponibilidade

### Recomendações para Produção

1. **Scaling Horizontal**:
   - Provisione múltiplas instâncias em Kubernetes
   - Configure auto-scaling baseado em carga

2. **Cache Distribuído**:
   - Use Redis cluster para maior throughput
   - Configure backup e persistência dos dados de cache

3. **Rate Limiting**:
   - Implemente limite por usuário e global
   - Configure alertas para picos de uso

4. **Monitoramento**:
   - Integre com Prometheus para métricas
   - Use Grafana para dashboards de monitoramento
   - Configure alertas para latência e erros

## Monitoramento e Logging

### Configuração de Logging

O serviço está configurado para usar o módulo `logging` do Python, com saída formatada em JSON para fácil integração com sistemas como ELK Stack ou Datadog.

Exemplo de configuração em `config/logging.yaml`:

```yaml
version: 1
formatters:
  json:
    class: pythonjsonlogger.jsonlogger.JsonFormatter
    format: "%(asctime)s %(levelname)s %(name)s %(message)s"
handlers:
  console:
    class: logging.StreamHandler
    formatter: json
    stream: ext://sys.stdout
  file:
    class: logging.FileHandler
    formatter: json
    filename: logs/ai-service.log
loggers:
  app:
    level: INFO
    handlers: [console, file]
    propagate: no
root:
  level: INFO
  handlers: [console]
```

### Métricas Importantes

Configure seu sistema de monitoramento para rastrear as seguintes métricas:

1. **Performance**:
   - Tempo médio de resposta por endpoint
   - Taxa de erros por endpoint
   - Uso de CPU e memória

2. **Uso de API de Provedores**:
   - Número de chamadas por provedor
   - Tempo de resposta de cada provedor
   - Custo acumulado de uso de API

3. **Cache**:
   - Taxa de acerto do cache
   - Taxa de falhas do cache
   - Tamanho total do cache

## Backup e Recuperação de Desastres

1. **Backup da Configuração**:
   - Armazene todos os arquivos de configuração em um repositório Git
   - Utilize ferramentas como Terraform para infraestrutura como código

2. **Recuperação de Desastres**:
   - Mantenha imagens Docker em múltiplos registros
   - Documente procedimentos de implantação do zero
   - Teste regularmente o processo de recuperação

## Atualizações e Rollbacks

### Estratégia de Implantação

Recomenda-se usar a estratégia Rolling Update no Kubernetes para atualizações sem tempo de inatividade:

```yaml
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 25%
      maxSurge: 25%
```

### Processo de Rollback

Em caso de problemas após uma atualização:

1. Kubernetes: `kubectl rollout undo deployment/ai-service`
2. Docker Compose: `docker-compose up -d --force-recreate --no-deps ai-service`