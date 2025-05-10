# Integração com Supabase via API REST

Este documento descreve como o sistema se integra com o Supabase usando a API REST diretamente, sem depender do SDK oficial ou de conexão direta ao banco de dados PostgreSQL.

## Configuração

Para que a integração funcione corretamente, você precisa configurar as seguintes variáveis de ambiente no arquivo `.env`:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
SUPABASE_JWT_SECRET=seu-jwt-secret
```

- `SUPABASE_URL`: URL do seu projeto Supabase (encontrado no dashboard do Supabase)
- `SUPABASE_ANON_KEY`: Chave anônima para acesso público (encontrada em Project Settings > API)
- `SUPABASE_SERVICE_ROLE_KEY`: Chave de serviço para acesso administrativo (encontrada em Project Settings > API)
- `SUPABASE_JWT_SECRET`: Segredo JWT para validação de tokens (encontrado em Project Settings > API > JWT Settings)

## Cliente REST para Supabase

O sistema inclui um cliente HTTP específico para interagir com a API REST do Supabase, implementado em `api/models/SupabaseClient.php`. Este cliente oferece uma interface semelhante ao SDK oficial, permitindo realizar operações CRUD em tabelas do Supabase.

### Inicialização do Cliente

```php
// Obter uma instância do cliente com a chave de serviço
$supabase = SupabaseClient::getInstance('service_role');

// Ou com a chave anônima
$supabase = SupabaseClient::getInstance('anon');

// Ou inicializar manualmente
$supabase = new SupabaseClient('https://seu-projeto.supabase.co', 'sua-chave-api');
```

### Operações Básicas

#### Consultar Dados (SELECT)

```php
// Consulta simples
$response = $supabase
    ->from('companies')
    ->select('*')
    ->execute();

// Verificar se houve erro
if ($response->getError()) {
    // Tratar erro
    echo $response->getError()->getMessage();
} else {
    // Usar os dados
    $companies = $response->getData();
}

// Consulta com filtros
$response = $supabase
    ->from('companies')
    ->select('id, name, created_at')
    ->filter('user_id', 'eq', $userId)
    ->filter('is_active', 'eq', true)
    ->execute();
```

#### Inserir Dados (INSERT)

```php
$company = [
    'user_id' => $userId,
    'name' => 'Nova Empresa',
    'is_active' => true
];

$response = $supabase
    ->from('companies')
    ->insert($company)
    ->execute();

// A resposta contém os dados inseridos
$newCompany = $response->getData();
```

#### Atualizar Dados (UPDATE)

```php
$updates = [
    'name' => 'Empresa Atualizada',
    'updated_at' => date('c')
];

$response = $supabase
    ->from('companies')
    ->filter('id', 'eq', $companyId)
    ->filter('user_id', 'eq', $userId) // Garante que o usuário tem permissão
    ->update($updates)
    ->execute();
```

#### Soft Delete

```php
$updates = [
    'is_active' => false,
    'updated_at' => date('c')
];

$response = $supabase
    ->from('companies')
    ->filter('id', 'eq', $companyId)
    ->update($updates)
    ->execute();
```

## Row Level Security (RLS)

O Supabase usa Row Level Security (RLS) para controlar o acesso aos dados. No entanto, ao usar a chave de serviço (`service_role_key`), as políticas de RLS são ignoradas, concedendo acesso completo.

Por isso, é importante implementar verificações de acesso no código do aplicativo ao usar a chave de serviço, como filtrar registros pelo ID do usuário autenticado:

```php
$response = $supabase
    ->from('companies')
    ->filter('user_id', 'eq', $authResult['user_id'])
    ->execute();
```

## Melhores Práticas

1. **Segurança**: Nunca exponha suas chaves de API, especialmente a chave de serviço, em código client-side.

2. **Controle de Acesso**: Sempre verifique se o usuário tem permissão para acessar ou modificar os dados solicitados.

3. **Tratamento de Erros**: Verifique sempre se a resposta contém erros antes de prosseguir.

4. **Validação de Dados**: Valide os dados do usuário antes de enviá-los para a API.

5. **Paginação**: Para consultas que podem retornar muitos resultados, implemente paginação para melhorar o desempenho.

## Vantagens da API REST

- **Compatibilidade**: Funciona em qualquer ambiente com suporte a HTTP, sem dependências externas.
- **Simplicidade**: Fácil de entender e depurar.
- **Flexibilidade**: Pode ser usada com qualquer linguagem de programação.
- **Manutenção**: Menos suscetível a quebras devido a mudanças no SDK.

## Limitações

- **Funcionalidades Avançadas**: Alguns recursos avançados podem não estar disponíveis diretamente via API REST.
- **Performance**: Pode ser mais lento que usar o SDK oficial ou conexão direta ao banco.
- **Atualizações de API**: É necessário acompanhar as mudanças na API do Supabase.

## Depuração

Para diagnosticar problemas de conexão, use o endpoint de teste:

```
GET /api/v1/test-connection
```

Este endpoint verifica se todas as variáveis de ambiente necessárias estão configuradas corretamente e fornece informações sobre o ambiente de execução.