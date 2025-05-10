# Documentação da API de Leads

## Visão Geral

A API de Leads permite capturar e gerenciar informações de leads associados a projetos específicos. Um lead pode estar associado a múltiplos projetos, e cada associação pode ter informações específicas de campanha (UTMs).

## Modelo de Dados

### Lead
```
{
  "id": "uuid",
  "name": "Nome Completo",
  "first_name": "Nome",
  "email": "email@example.com",
  "phone": "5521999998877",
  "status": "novo",
  "notes": "Observações sobre o lead",
  "created_at": "2025-05-04T12:00:00Z",
  "updated_at": "2025-05-04T12:00:00Z"
}
```

### Lead-Project (Relação)
```
{
  "id": "uuid",
  "lead_id": "uuid",
  "project_id": "uuid",
  "utm_source": "google",
  "utm_medium": "cpc",
  "utm_campaign": "summer_promo",
  "utm_term": "marketing digital",
  "utm_content": "banner_top",
  "captured_at": "2025-05-04T12:00:00Z"
}
```

### Lead Status Log
```
{
  "id": "uuid",
  "user_id": "uuid", // Referência ao profiles(id), não auth.users
  "lead_id": "uuid",
  "action": "status_change",
  "old_value": "novo",
  "new_value": "qualificado",
  "notes": "Lead qualificado após contato telefônico",
  "created_at": "2025-05-04T12:00:00Z"
}
```

## Endpoints

### Capturar Lead

**URL**: `/api/v1/leads`  
**Método**: `POST`  
**Autenticação**: Bearer Token JWT ou API Key  

**Corpo da Requisição**:
```json
{
  "project_id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "João da Silva",
  "first_name": "João",  // Opcional - quando não fornecido, será extraído do name
  "email": "email@joao.com",
  "phone": "5521999998877",
  "notes": "Lead interessado no produto premium",
  "utm_source": "google",
  "utm_medium": "cpc",
  "utm_campaign": "summer_promo",
  "utm_term": "marketing digital",
  "utm_content": "banner_top"
}
```

**Campos Obrigatórios**:
- `project_id`: UUID do projeto
- `name`: Nome completo do lead
- `email`: Email do lead
- `phone`: Telefone do lead (apenas números)

**Resposta de Sucesso**:
- Código: `201 Created`
- Conteúdo:
```json
{
  "lead": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "João da Silva",
    "first_name": "João",
    "email": "email@joao.com",
    "phone": "5521999998877",
    "status": "novo",
    "notes": "Lead interessado no produto premium",
    "created_at": "2025-05-04T12:00:00Z",
    "updated_at": "2025-05-04T12:00:00Z"
  },
  "message": "Lead capturado com sucesso",
  "details": {
    "name": "João da Silva",
    "project": "Campanha de Verão",
    "captured_at": "04/05/2025 14:30:00"
  }
}
```

### Listar Leads

**URL**: `/api/v1/leads`  
**Método**: `GET`  
**Autenticação**: Bearer Token JWT ou API Key  

**Parâmetros de Consulta**:
- `id` (opcional): UUID do lead
- `project_id` (opcional): UUID do projeto para filtrar leads
- `email` (opcional): Email do lead para busca

**Resposta de Sucesso**:
- Código: `200 OK`
- Conteúdo:
```json
{
  "leads": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "João da Silva",
      "first_name": "João",
      "email": "email@joao.com",
      "phone": "5521999998877",
      "status": "novo",
      "notes": "Lead interessado no produto premium",
      "created_at": "2025-05-04T12:00:00Z",
      "updated_at": "2025-05-04T12:00:00Z"
    },
    {
      "id": "223e4567-e89b-12d3-a456-426614174001",
      "name": "Maria Oliveira",
      "first_name": "Maria",
      "email": "maria@example.com",
      "phone": "5511888887777",
      "status": "novo",
      "notes": "Lead do formulário de contato",
      "created_at": "2025-05-04T14:30:00Z",
      "updated_at": "2025-05-04T14:30:00Z"
    }
  ]
}
```

### Atualizar Status do Lead

**URL**: `/api/v1/leads/{id}/status`  
**Método**: `PUT`  
**Autenticação**: Bearer Token JWT ou API Key  

**Parâmetros de URL**:
- `id`: UUID do lead

**Corpo da Requisição**:
```json
{
  "status": "qualificado",
  "notes": "Lead qualificado após contato telefônico"
}
```

**Valores Válidos para Status**:
- `novo`
- `qualificado`
- `contatado`
- `convertido`
- `desistiu`
- `inativo`

**Campos Obrigatórios**:
- `status`: Novo status do lead

**Resposta de Sucesso**:
- Código: `200 OK`
- Conteúdo:
```json
{
  "message": "Status do lead atualizado com sucesso",
  "lead_id": "123e4567-e89b-12d3-a456-426614174000",
  "lead_name": "João da Silva",
  "lead_email": "email@joao.com",
  "previous_status": "novo",
  "new_status": "qualificado",
  "updated_at": "04/05/2025 15:30:00"
}
```

### Obter Estatísticas de Leads

**URL**: `/api/v1/leads/stats`  
**Método**: `GET`  
**Autenticação**: Bearer Token JWT ou API Key  

**Parâmetros de Consulta**:
- `project_id` (opcional): UUID do projeto para filtrar estatísticas
- `period` (opcional): Período em dias para análise (padrão: 30)

**Resposta de Sucesso**:
- Código: `200 OK`
- Conteúdo:
```json
{
  "stats": {
    "total_leads": 157,
    "new_leads_period": 42,
    "leads_by_status": {
      "novo": 45,
      "qualificado": 32,
      "contatado": 20,
      "convertido": 25,
      "desistiu": 15,
      "inativo": 20
    },
    "leads_by_source": {
      "google": 25,
      "facebook": 15,
      "instagram": 18,
      "desconhecida": 9
    },
    "leads_by_day": [
      {
        "date": "2025-04-05",
        "count": 3
      },
      {
        "date": "2025-04-06",
        "count": 5
      },
      // ... dados para cada dia do período
    ],
    "conversion_rate": 2.37
  },
  "period_days": 30,
  "project_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

## Tratamento de Erros

### Erros Comuns

- **400 Bad Request**: Dados inválidos ou faltando campos obrigatórios
```json
{
  "error": "Nome do lead é obrigatório"
}
```

- **401 Unauthorized**: Token de autenticação inválido ou expirado
```json
{
  "error": "Não autorizado"
}
```

- **404 Not Found**: Recurso não encontrado
```json
{
  "error": "Projeto não encontrado ou sem permissão"
}
```

- **500 Internal Server Error**: Erro interno do servidor
```json
{
  "error": "Erro ao criar lead: mensagem de erro"
}
```

## Notas de Implementação

1. Cada lead é identificado unicamente pelo email para cada usuário (constraint `leads_email_user_unique`).
2. Quando um lead com o mesmo email já existe, apenas a relação com o projeto é criada.
3. Se o campo `first_name` não for fornecido, o sistema extrairá a primeira palavra do campo `name`.
4. O número de telefone é armazenado sem formatação (apenas números).
5. Cada lead pode estar associado a múltiplos projetos, e cada associação pode ter diferentes parâmetros de UTM.
6. Uma relação lead-projeto só pode existir uma vez (constraint `lead_project_unique`).
7. A tabela `leads` tem uma chave estrangeira para `public.profiles` (não para `auth.users`), seguindo o padrão do sistema.
8. A tabela `lead_status_logs` também referencia `public.profiles` para o campo `user_id`.

## Exemplo de Uso com cURL

```bash
curl -X POST "http://localhost:9030/api/v1/leads" \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sua_api_key" \
  -d '{
    "project_id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "João da Silva",
    "email": "joao@example.com",
    "phone": "5521999998877",
    "notes": "Lead de teste",
    "utm_source": "google",
    "utm_medium": "cpc",
    "utm_campaign": "summer_promo",
    "utm_term": "marketing digital",
    "utm_content": "banner_top"
  }'
```