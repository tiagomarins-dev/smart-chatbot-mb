# Proxy de API no Next.js

## Visão Geral
Este documento descreve como configurar o Next.js para rotear chamadas de API de `/api/*` para o serviço de backend dentro do Docker, eliminando problemas de CORS e DNS.

### Benefícios
- Evita expor diretamente o backend ao navegador.
- Remove necessidade de variáveis de ambiente cliente com URLs absolutas.
- Funciona de forma transparente em desenvolvimento local e em contêineres.

## 1. Configuração de Rewrites
Arquivo: `frontend/next.config.js`

```js
/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://backend:3000/api/:path*',
      },
    ];
  },
};
```

- **source**: rota que o navegador acessa (e.g. `/api/auth/login`).
- **destination**: URL interna do serviço Docker `backend` na porta 3000.

## 2. Chamadas de API Relativas
Arquivo: `frontend/src/api/client.ts`

Todas as requisições utilizam o prefixo `/api` de forma relativa:

```ts
const API_PREFIX = '/api';

// Exemplo de chamada POST
apiClient.post('/auth/login', { email, password });
```

O Next.js recebe `/api/auth/login` e encaminha para o backend.

## 3. Fluxo de Requisição
1. Browser → Next.js (`localhost:9034`) → `/api/auth/login`
2. Next.js (proxy) → Docker network → `backend:3000/api/auth/login`
3. Backend responde → Next.js → Browser

## 4. Como Rodar
```bash
docker-compose down
docker-compose up --build -d
```
Acesse: `http://localhost:9034`

Pronto! O login e demais APIs funcionarão sem erros de host ou CORS.
