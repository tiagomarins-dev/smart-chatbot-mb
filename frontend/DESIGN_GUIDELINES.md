# Documentação do Design do Dashboard

## Visão Geral

Este documento descreve as decisões de design, padrões e implementações aplicadas à página de dashboard do sistema Smart-ChatBox. Estas diretrizes devem ser seguidas ao implementar ou atualizar outras páginas do sistema para manter consistência visual e funcional.

## 1. Tema e Identidade Visual

### 1.1 Paleta de Cores

- **Cor primária**: Roxo (`#7e57c2`) - Usado para elementos principais, ícones e texto destacado
- **Cor primária hover**: Roxo escuro (`#673ab7`) - Usado para estados hover em elementos interativos
- **Cores de status**:
  - Sucesso: Verde (`#66bb6a`)
  - Informação: Azul (`#42a5f5`)
  - Aviso: Laranja (`#ffb74d`)
  - Perigo: Vermelho (`#ef5350`)
  - Secundário: Cinza (`#616161`) para itens inativos

### 1.2 Tema Escuro

Implementado com suporte completo a modo escuro com variáveis CSS:
- Fundo escuro: `--dark-bg: #212529`
- Cards escuros: `--dark-card: #2c3034`
- Texto escuro: `--dark-text: #f8f9fa`
- Bordas: `--dark-border: #343a40`

### 1.3 Tipografia

- Fonte principal: Sistema `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif`
- Espaçamento entre linhas: `1.4`
- Títulos: Fonte negrito com cor primária
- Texto em cards: Legibilidade aumentada com tamanhos apropriados

## 2. Componentes e Elementos de UI

### 2.1 Cards

Os cards são os elementos principais de organização visual da interface:

```css
.card {
  transition: background-color 0.3s, border-color 0.3s, box-shadow 0.3s;
  border-radius: 12px !important;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.07) !important;
  border: none !important;
  padding: 4px;
  margin-bottom: 20px;
}
```

**Características principais:**
- Raio de borda: 12px
- Sem bordas visíveis
- Sombras sutis
- Animação de hover
- Transições suaves
- **Alturas mínimas**:
  - Cards de estatísticas: 165px
  - Cards de distribuição: 240px

**Componentes internos:**

1. **Card Header**:
```css
.card-header {
  background-color: transparent !important;
  border-bottom: none !important;
  padding: 0.9rem 1rem 0.3rem !important;
  border-radius: 12px !important;
}
```

2. **Card Body**:
```css
.card-body {
  padding: 1rem !important;
}
```

3. **Card Footer**:
```css
.card-footer {
  background-color: transparent !important;
  padding: 0.6rem 1rem !important;
  border-top: 1px solid rgba(0, 0, 0, 0.05) !important;
}
```

### 2.2 Tabelas

Tabelas modernas e responsivas:

```css
.table {
  border-radius: 10px !important;
  overflow: hidden;
  margin-bottom: 0;
}

.table-responsive {
  border-radius: 10px !important;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}
```

**Características principais:**
- Canto arredondado para tabelas
- Cabeçalhos estilizados e diminuídos
- Espaçamento ajustado em células

**Responsividade Mobile:**
A classe `mobile-card-table` transforma tabelas em cards em dispositivos móveis:
- Cada linha se torna um card
- Células exibem rótulos para identificação
- Badges e status alinhados à direita
- Transição suave no hover

### 2.3 Badges e Ícones

Ícones com estilo consistente:
```css
.badge {
  padding: 0.4em 0.7em;
  font-weight: 500;
  border-radius: 6px;
}
```

Ícones em círculos nos cards:
```html
<div class="p-2 rounded-circle" style="backgroundColor: rgba(126, 87, 194, 0.1)">
  <i class="bi bi-folder-fill fs-5" style="color: #7e57c2"></i>
</div>
```

### 2.4 Navegação e Links

Links em rodapés de cards:
```html
<Link href="/projects" className="text-decoration-none d-flex justify-content-end align-items-center">
  <span style={{ color: "#7e57c2" }}>Ver Todos</span>
  <i className="bi bi-arrow-right ms-2" style={{ color: "#7e57c2" }}></i>
</Link>
```

## 3. Layout e Grid System

### 3.1 Estrutura de Grid

O sistema utiliza o grid do Bootstrap com personalizações:

- **Layout principal**: Container com padding vertical (`py-4`)
- **Espaçamento entre seções**: `mb-3` para todas as rows
- **Cards de estatísticas**: 3 cards por linha em desktop (col-md-4) com `mb-3`
- **Cards de distribuição**: 2 cards por linha em desktop (col-lg-6) com `mb-3`
- **Tabelas**: Largura total (col-12)

### 3.2 Responsividade

Ajustes específicos para dispositivos móveis:
```css
@media (max-width: 767.98px) {
  .container {
    padding-left: 15px !important;
    padding-right: 15px !important;
  }
  
  .card {
    margin-bottom: 15px;
  }
  
  h1 {
    font-size: 1.75rem !important;
  }
  
  .row.mb-3 {
    margin-bottom: 0.75rem !important;
  }
  
  .card.h-100 {
    min-height: auto !important;
  }
}
```

## 4. Animações e Transições

### 4.1 Transições de Página

```css
main {
  animation: fadeIn 0.3s ease-in-out;
}

.card {
  animation: slideInUp 0.5s ease-out;
  animation-fill-mode: both;
}
```

### 4.2 Animações Escalonadas

Cards aparecem em sequência:
```css
.row .col-md-4:nth-child(1) .card {
  animation-delay: 0.1s;
}

.row .col-md-4:nth-child(2) .card {
  animation-delay: 0.2s;
}

.row .col-md-4:nth-child(3) .card {
  animation-delay: 0.3s;
}
```

### 4.3 Hover Effects

```css
.card:hover {
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15) !important;
  transform: translateY(-2px);
}

.table-hover tbody tr:hover {
  transform: translateX(3px);
  transition: transform 0.2s ease;
}
```

## 5. Estados e Feedback Visual

### 5.1 Loading States

Placeholders durante carregamento:
```html
{loading ? (
  <span className="placeholder-glow">
    <span className="placeholder col-4"></span>
  </span>
) : (
  <actual-content />
)}
```

### 5.2 Indicadores de Status

Barras de progresso estilizadas:
```css
.progress {
  height: 10px !important;
  border-radius: 5px !important;
  background-color: rgba(0, 0, 0, 0.05) !important;
  overflow: hidden;
}

.progress-bar {
  border-radius: 5px !important;
}
```

## 6. Padrões de Implementação

### 6.1 Filtros de Dados

Para contagem de itens ativos:
```javascript
items.filter(item => item.is_active).length
```

Para leads, a lógica exclui status 'inativo' e 'desistiu':
```javascript
leadStats.total_leads - ((leadStats.leads_by_status?.inativo || 0) + 
                         (leadStats.leads_by_status?.desistiu || 0))
```

### 6.2 Tratamento de Dados Vazios

Sempre use fallbacks para dados que podem estar ausentes:
```javascript
leadStats?.total_leads || 0
```

### 6.3 Formatação de Datas

Formato padrão de data:
```javascript
new Date(item.created_at).toLocaleDateString()
```

## 7. Boas Práticas para Novas Implementações

1. **Manter Consistência Visual**:
   - Seguir a paleta de cores e estilo de cards
   - Usar os mesmos padrões de espaçamento
   - Aplicar os mesmos estilos para elementos comuns (badges, botões, ícones)

2. **Responsividade**:
   - Sempre testar e adaptar para visualização mobile
   - Usar as classes `.mobile-card-table` para tabelas
   - Ajustar tamanhos de fonte e espaçamento para telas pequenas

3. **Performance**:
   - Preferir carregamento assíncrono de dados
   - Usar placeholders durante carregamento
   - Implementar logging para depuração

4. **Acessibilidade**:
   - Manter contraste adequado entre texto e fundo
   - Fornecer textos alternativos para ícones
   - Garantir controles interativos adequados

5. **Tema Escuro**:
   - Sempre implementar suporte para tema escuro
   - Usar as variáveis CSS para cores no tema escuro
   - Testar especificamente o modo escuro

## 8. Componentes Implementados

1. **Cards de Estatísticas**:
   - Indicam contagens totais de entidades ativas
   - Incluem ícones representativos
   - Exibem link para página de listagem completa

2. **Cards de Distribuição**:
   - Mostram dados estatísticos em formatos visuais
   - Usam barras de progresso para status
   - Organizam dados de origem em lista

3. **Tabelas Responsivas**:
   - Mostram dados recentes
   - Transformam-se em cards em dispositivos móveis
   - Incluem ações rápidas

4. **Badges de Status**:
   - Usam cores correspondentes ao estado
   - Formato compacto e legível
   - Consistentes em todo o sistema

## 9. Próximos Passos Recomendados

1. Aplicar os mesmos padrões de design às páginas de listagem (empresas, projetos, leads)
2. Implementar páginas de detalhes seguindo o mesmo estilo
3. Desenvolver formulários com estilos consistentes
4. Expandir a funcionalidade de tema escuro/claro com um toggle no cabeçalho

Esta documentação serve como guia para manter a consistência visual e funcional em todo o sistema Smart-ChatBox, garantindo uma experiência de usuário coesa e profissional.