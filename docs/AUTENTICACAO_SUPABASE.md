# Guia de Autenticação do Supabase

Este documento explica como funciona a autenticação com o Supabase nesta aplicação, os problemas comuns enfrentados e como resolvê-los.

## Arquitetura de Autenticação

O sistema oferece dois métodos de autenticação com o Supabase:

1. **Conexão direta ao PostgreSQL** (auth.php): Conecta diretamente ao banco de dados PostgreSQL do Supabase.
2. **API REST do Supabase** (auth-rest.php): Utiliza a API REST para autenticação e acesso aos dados.

### Problemas comuns com a conexão direta ao PostgreSQL

A conexão direta ao PostgreSQL do Supabase (utilizada em `auth.php`) frequentemente falha porque:

- O acesso direto ao banco de dados a partir de IPs externos geralmente é bloqueado pelo Supabase
- Timeouts de conexão ocorrem frequentemente
- Firewall e restrições de rede podem impedir a conexão

### Método recomendado: API REST

A solução mais confiável é utilizar a API REST do Supabase através do `auth-rest.php` e `SupabaseClient.php`, que:

- Funciona independente de restrições de firewall
- É mais rápida e confiável
- Tem suporte oficial do Supabase
- Implementa automaticamente retry em caso de falhas

## Configuração

Para configurar a autenticação corretamente, você precisa definir as seguintes variáveis de ambiente:

```
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anonima
SUPABASE_SERVICE_ROLE_KEY=sua-chave-de-servico
SUPABASE_JWT_SECRET=seu-jwt-secret
```

Estas variáveis devem ser definidas no arquivo `.env` na raiz do projeto ou como variáveis de ambiente do sistema.

### Onde encontrar estas credenciais

1. Acesse o [dashboard do Supabase](https://app.supabase.io)
2. Selecione seu projeto
3. Vá para Configurações > API
4. Copie as chaves necessárias:
   - URL do projeto = `SUPABASE_URL`
   - anon/public key = `SUPABASE_ANON_KEY`
   - service_role key = `SUPABASE_SERVICE_ROLE_KEY`
5. Para o JWT Secret, vá para Configurações > API > JWT Settings

## Diagnóstico de problemas

Para diagnosticar problemas de autenticação, utilize as ferramentas de diagnóstico incluídas:

### 1. Verificar configuração do ambiente

```bash
./check-config.sh
```

Este script verifica se todas as variáveis de ambiente necessárias estão corretamente configuradas.

### 2. Diagnóstico completo de autenticação

```bash
./auth-diagnostic.sh
```

Este script realiza testes tanto na conexão direta ao PostgreSQL quanto na API REST, fornecendo informações detalhadas sobre o funcionamento de cada método.

### 3. Testar autenticação com API Key

```bash
./test-auth.sh
```

Este script testa a autenticação com uma API Key específica.

## Migrando para a autenticação via REST

Para migrar um endpoint para usar a autenticação via REST:

1. Altere o require no início do arquivo:

```php
// De:
require_once __DIR__ . '/../middleware/auth.php';

// Para:
require_once __DIR__ . '/../middleware/auth-rest.php';
```

2. Use o SupabaseClient para acessar os dados:

```php
// Inicializar o cliente Supabase REST
$supabase = SupabaseClient::getInstance('service_role');

// Fazer consultas, por exemplo:
$response = $supabase
    ->from('tabela')
    ->select('*')
    ->filter('coluna', 'eq', $valor)
    ->execute();
```

## Debug e resolução de problemas

### Problemas comuns de conexão

1. **Erro "Timeout na conexão com o banco de dados"**
   - Causa: O Supabase bloqueia conexões diretas ao banco de dados PostgreSQL
   - Solução: Use a autenticação via REST API (auth-rest.php)

2. **Erro "Erro de autenticação no banco de dados"**
   - Causa: A variável `SUPABASE_SERVICE_ROLE_KEY` está incorreta ou não foi definida
   - Solução: Verifique a chave no dashboard do Supabase e atualize o arquivo .env

3. **Erro "API Key inválida ou expirada"**
   - Causa: A API Key fornecida não é válida ou não existe no banco de dados
   - Solução: Verifique a API Key e crie uma nova, se necessário

### Logs e debugging

Para melhorar o debugging da autenticação:

1. Ative os logs detalhados na classe SupabaseClient:

```php
$supabase = SupabaseClient::getInstance('service_role')
    ->debug(true)
    ->timeout(10)
    ->retry(3, 2);
```

2. Verifique os logs em:
   - Apache: `/var/log/apache2/error.log`
   - PHP: `/api/logs/api.log`
   - Docker: `docker logs nome-do-container`

## Configurações avançadas

### Retry e timeout

O SupabaseClient suporta configurações avançadas para melhorar a confiabilidade:

```php
$supabase = SupabaseClient::getInstance('service_role')
    ->timeout(30)      // 30 segundos de timeout
    ->retry(3, 2);     // 3 tentativas com 2 segundos de espera entre elas
```

### Segurança nas chaves de API

Para criar ou gerenciar API Keys com segurança:

1. Use `uuid_generate_v4()` para criar chaves aleatórias
2. Defina escopos específicos para cada API Key
3. Configure limites de uso e expiração
4. Monitore o uso através da tabela `api_usage_logs`

## Suporte e ajuda

Se precisar de ajuda adicional:

1. Consulte a [documentação oficial do Supabase](https://supabase.io/docs)
2. Utilize as ferramentas de diagnóstico incluídas neste projeto
3. Verifique os logs de erro para informações detalhadas