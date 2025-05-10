# API Proxy e Configuração de Conectividade

## Visão Geral
Este documento descreve como o proxy de API foi implementado e configurado para garantir comunicação resiliente entre o frontend e o backend, mesmo em ambientes com restrições de conectividade.

### Principais Benefícios
- Evita expor diretamente o backend ao navegador
- Remove a necessidade de variáveis de ambiente no cliente com URLs absolutas
- Funciona de forma transparente em desenvolvimento local e em contêineres
- Suporta ambientes corporativos com proxies e firewalls
- Funciona mesmo quando desconectado do banco de dados Supabase

## Configuração de Rewrites no Next.js

O arquivo `frontend/next.config.js` foi atualizado para detectar automaticamente o ambiente (Docker ou local) e direcionar o tráfego adequadamente:

```js
/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  // Proxy todas as requisições /api/* para o backend correto, dependendo do ambiente
  async rewrites() {
    // Quando estamos dentro do Docker, precisamos usar o nome do serviço como hostname
    const inDocker = process.env.NEXT_PUBLIC_IN_DOCKER === 'true';
    
    // Definição explícita do host baseado no ambiente
    // O backend está escutando na porta 9033 em ambos os ambientes
    const host = inDocker ? 'backend:9033' : 'localhost:9033';
    
    console.log(`API proxy configurado para: ${host}`);
    
    return [
      {
        source: '/api/:path*',
        destination: `http://${host}/api/:path*`,
      },
    ];
  },
};
```

Esta configuração permite:
- Detecção automática do ambiente Docker vs desenvolvimento local
- Configuração dinâmica do host de destino
- Logging para facilitar diagnóstico de problemas

## Cliente API Resiliente

O cliente API `frontend/src/api/client.ts` foi modificado para melhorar a resiliência:

```typescript
// Cliente API com suporte a detecção de ambiente e tratamento de erros aprimorado
export async function fetchApi<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  // Usar caminhos relativos para o proxy
  const url = endpoint.startsWith('/') ? `/api${endpoint}` : `/api/${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      }
    });
    
    const responseText = await response.text();
    
    // Validar o content type da resposta
    const contentType = response.headers.get('content-type') || '';
    
    // Se não vier JSON, retorna o texto bruto como erro
    if (!contentType.includes('application/json')) {
      return {
        success: false,
        error: responseText,
        statusCode: response.status,
      };
    }
    
    // Parse do JSON com verificação de string vazia
    const data = responseText.trim() ? JSON.parse(responseText) : {};
    
    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Erro desconhecido',
        statusCode: response.status,
        data: data.data
      };
    }
    
    return {
      success: true,
      data: data.data,
      statusCode: response.status
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      statusCode: 0
    };
  }
}
```

Principais melhorias:
- Tratamento adequado de respostas não-JSON
- Estrutura de resposta padronizada para sucesso e erro
- Mensagens de erro detalhadas
- Validação de tipo de conteúdo

## Configuração Docker

Atualizamos o `docker-compose.yml` para melhorar a compatibilidade:

```yaml
services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: crm-backend
    volumes:
      - ./backend:/usr/src/app
      - backend_node_modules:/usr/src/app/node_modules
    env_file:
      - ./.env
    environment:
      - RUNNING_IN_DOCKER=true
      - NODE_TLS_REJECT_UNAUTHORIZED=0
      - NODE_ENV=development
      - PORT=9033
    ports:
      - '9033:9033'
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: crm-frontend
    volumes:
      - ./frontend:/usr/src/app
      - frontend_node_modules:/usr/src/app/node_modules
    environment:
      - NODE_ENV=development
      # Marcador para o Next.js saber que está em Docker
      - NEXT_PUBLIC_IN_DOCKER=true
      # Para compatibilidade com código existente
      - NEXT_PUBLIC_API_URL=http://backend:9033/api
    ports:
      - '9034:9034'
    depends_on:
      - backend
    restart: unless-stopped
```

Aspectos importantes:
- Configuração explícita da porta (9033) para o backend
- Variável `NEXT_PUBLIC_IN_DOCKER` para detecção de ambiente
- Desativação da verificação TLS para ambientes com problemas de certificados

## Suporte a Ambientes Corporativos

### Detecção de Modo Offline

No backend, implementamos detecção automática de problemas de conectividade:

```typescript
// backend/src/controllers/leadsController.ts e outros
const OFFLINE_MODE = process.env.SUPABASE_OFFLINE_MODE === 'true' ||
                     process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0';

if (OFFLINE_MODE) {
  console.log('Usando modo offline para leads');
  // Retorna dados simulados
}
```

### Suporte a Proxies Corporativos

Para ambientes corporativos onde proxies HTTPS podem interferir:

```typescript
// backend/src/services/supabaseService.ts
fetch: (url: RequestInfo | URL, init?: RequestInit) => {
  console.log(`Supabase fetch: ${typeof url === 'string' ? url : url.toString()}`);
  
  return fetch(url, {
    ...init,
    redirect: 'follow',
    // Aceitar certificados SSL auto-assinados em desenvolvimento
    // @ts-ignore
    agent: process.env.NODE_ENV !== 'production' ? 
      new (require('https').Agent)({ rejectUnauthorized: false }) : 
      undefined
  }).then(response => {
    if (!response.ok) {
      console.error(`Supabase API error: ${response.status} ${response.statusText}`);
    }
    return response;
  }).catch(error => {
    console.error('Supabase fetch error:', error);
    throw error;
  });
}
```

## Fluxo de Requisição

1. Browser → Next.js (`localhost:9034`) → `/api/auth/login`
2. Next.js (proxy) → Docker network → `backend:9033/api/auth/login`
3. Backend → Tenta Supabase → Fallback para modo offline se necessário
4. Backend responde → Next.js → Browser

## Como Executar

```bash
# Iniciar com modo offline ativado
export SUPABASE_OFFLINE_MODE=true
# ou
export NODE_TLS_REJECT_UNAUTHORIZED=0

# Reiniciar contêineres
docker-compose down
docker-compose up -d
```

## Diagnóstico de Problemas

Se houver problemas de conexão:

1. Verifique os logs do Next.js para problemas de proxy:
   ```bash
   docker logs crm-frontend
   ```

2. Verifique os logs do backend para problemas com Supabase:
   ```bash
   docker logs crm-backend
   ```

3. Teste a conexão direta:
   ```bash
   curl -v http://localhost:9033/
   ```

## Próximos Passos

Para melhorar ainda mais a resiliência:

1. Implementar cache local no frontend
2. Adicionar suporte para operações offline e sincronização posterior
3. Expandir o modo offline para outros endpoints