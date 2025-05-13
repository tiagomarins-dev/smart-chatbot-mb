# Scripts Utilitários

Este diretório contém scripts utilitários para ajudar com várias tarefas relacionadas ao projeto.

## Scripts Principais

Estes scripts estão disponíveis no diretório raiz para fácil acesso:

- `offline-mode.sh` - Ativa o modo offline (dados simulados)
- `online-mode.sh` - Ativa o modo online (dados do Supabase)
- `test-whatsapp.sh` - Testa a conexão com o servidor WhatsApp

## Organização dos Scripts

Os scripts estão organizados nas seguintes categorias:

### Scripts de Modo Offline (`scripts/offline-utils/`)

Scripts relacionados ao modo offline e manipulação de dados simulados:

- `disable-offline-mode.sh` - Desativa o modo offline
- `enable-offline-mode.sh` - Ativa o modo offline
- `fix-all-controllers.sh` - Corrige os controladores para respeitarem a configuração offline
- `fix-offline-mode.sh` - Script original para corrigir a detecção de modo offline
- `fix-offline-validation.js` - Script Node.js para corrigir validação offline
- `force-online-mode.sh` - Força o modo online
- `run-fix-and-rebuild.sh` - Executa correções e reconstrução
- `toggle-offline-mode.sh` - Alterna entre modo online e offline

### Scripts de Teste (`scripts/test-utils/`)

Scripts para testes e diagnósticos:

- `run-supabase-tests.sh` - Executa testes do Supabase
- `test-offline-companies.sh` - Testa a listagem de empresas em modo offline
- `test-online-companies.sh` - Testa a listagem de empresas em modo online
- `test-supabase-*.js` - Testes específicos do Supabase
- `test-whatsapp-connection.sh` - Testa a conexão com o WhatsApp

### Scripts de Serviço (`scripts/service-utils/`)

Scripts relacionados aos serviços do projeto:

- `rebuild-backend.sh` - Reconstrói o backend (incluindo parar e iniciar o Docker)
- `restart-backend.sh` - Apenas reinicia o backend

## Como Usar

### Modo Online/Offline

Para alternar entre o modo online (dados reais do Supabase) e offline (dados simulados):

```bash
# Para ativar o modo online
./online-mode.sh

# Para ativar o modo offline
./offline-mode.sh
```

### Testando o WhatsApp

Para testar a conexão com o servidor WhatsApp:

```bash
./test-whatsapp.sh
```

Você também pode acessar a página de diagnóstico no navegador:
http://localhost:9034/whatsapp/diagnostico
# Adições recentes
- \ - Testa todos os endpoints da API WhatsApp
