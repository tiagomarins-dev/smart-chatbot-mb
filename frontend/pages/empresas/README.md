# Módulo de Gerenciamento de Empresas

Este módulo implementa funcionalidades para gerenciar empresas no sistema Smart-ChatBox.

## Páginas implementadas

1. **Lista de Empresas** (`/empresas/index.tsx`)
   - Exibe empresas em formato de cards
   - Separa empresas ativas e inativas usando abas
   - Permite busca por nome de empresa
   - Botões para criar, visualizar, editar e excluir empresas

2. **Detalhes da Empresa** (`/empresas/[id].tsx`)
   - Mostra informações detalhadas da empresa
   - Exibe lista de projetos associados à empresa
   - Permite ativar/desativar a empresa
   - Fornece ações rápidas como criar novo projeto

3. **Criar Empresa** (`/empresas/new.tsx`)
   - Formulário para criar nova empresa
   - Validação de campos obrigatórios
   - Feedback visual durante submissão

4. **Editar Empresa** (`/empresas/[id]/edit.tsx`)
   - Formulário pré-preenchido com dados da empresa
   - Detecta se houve alterações antes de permitir salvar
   - Feedback visual durante carregamento e submissão

## Recursos utilizados

- Design consistente conforme DESIGN_GUIDELINES.md
- Cards com bordas arredondadas e sombras sutis
- Animações e transições suaves
- Tema roxo (#7e57c2) aplicado consistentemente
- Responsividade para dispositivos móveis
- Suporte a modo escuro

## Funcionalidades

- **Listagem com abas**: Divisão clara entre empresas ativas e inativas
- **Busca**: Filtragem rápida por nome de empresa
- **Visualização em cards**: Layout moderno com informações essenciais
- **Botões de ação**: Acesso rápido a operações comuns
- **Feedback visual**: Indicadores de carregamento e mensagens de estado
- **Navegação intuitiva**: Links para navegar entre páginas relacionadas

## Integração com API

Este módulo utiliza a API de empresas (`companiesApi`) e projetos (`projectsApi`) para:
- Obter lista de empresas
- Criar novas empresas
- Atualizar empresas existentes
- Excluir empresas
- Gerenciar relacionamentos com projetos

## Próximos Passos

- Adicionar paginação à lista de empresas
- Implementar filtragem avançada
- Adicionar estatísticas mais detalhadas
- Melhorar integração com módulo de projetos e leads