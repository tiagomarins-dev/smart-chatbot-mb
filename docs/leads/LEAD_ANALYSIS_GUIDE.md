# Guia de Análise de Leads

Este documento explica como usar as ferramentas de análise de sentimento e atividade para acompanhar interações com leads.

## Análise de Sentimento

A análise de sentimento avalia automaticamente as conversas de WhatsApp e classifica os leads em categorias que ajudam a equipe de vendas a priorizar e personalizar o atendimento.

### Como funciona

1. O sistema analisa as mensagens a cada 2 horas
2. Analisa tanto mensagens individuais quanto o contexto completo da conversa
3. Classifica o lead em um status de sentimento e atribui uma pontuação
4. Fornece uma análise detalhada com recomendações

### Status de Sentimento

Os leads são classificados nas seguintes categorias:

| Status | Descrição | Lead Score | Prioridade |
|--------|-----------|------------|------------|
| **interessado** | Demonstra forte interesse e urgência na compra | 80-100 | Alta |
| **compra futura** | Interesse claro, mas para aquisição posterior | 70-85 | Média |
| **achou caro** | Objeção específica ao preço apresentado | 60-75 | Média |
| **quer desconto** | Tenta negociar ativamente uma redução de preço | 65-80 | Média-Alta |
| **parcelamento** | Interesse com necessidade de dividir pagamentos | 70-85 | Média-Alta |
| **sem interesse** | Sinais claros de desinteresse na oferta | 0-30 | Baixa |
| **indeterminado** | Não foi possível determinar o interesse | 40-60 | Variável |

### Lead Score

Cada lead recebe uma pontuação de 0 a 100 que indica a proximidade de uma decisão de compra:

- **0-30**: Leads frios, sem interesse aparente
- **31-60**: Leads mornos, com potencial futuro
- **61-80**: Leads quentes, próximos de decidir
- **81-100**: Leads muito quentes, com alta probabilidade de conversão

## Ferramentas de Análise

### Análise de Sentimento (Processamento Automático)

A análise de sentimento é executada automaticamente a cada 2 horas, mas você também pode executá-la manualmente:

```bash
node scripts/sentiment-analysis.js
```

### Verificação de Resultados da Análise de Sentimento

Para verificar os resultados da análise de sentimento em todo o banco de dados:

```bash
node test-sentiment-results.js
```

Este script mostra:
- Leads com análise de sentimento disponível
- Mensagens que foram analisadas
- Relatório consolidado de sentimento

### Análise Completa de Atividade do Lead

Para uma análise completa de todas as interações de um lead específico:

```bash
node lead-activity-analysis.js <ID_DO_LEAD>
```

Substitua `<ID_DO_LEAD>` pelo UUID do lead que deseja analisar.

Este script fornece:

1. **Informações Básicas do Lead**: Dados cadastrais e status atual
2. **Projetos Associados**: Projetos vinculados ao lead
3. **Cronologia de Eventos**: Todos os eventos registrados em lead_events
4. **Conversas de WhatsApp**: Histórico completo de mensagens
5. **Análise de Sentimento**: Status, pontuação e análise detalhada
6. **Resumo de Interações**: Estatísticas e recomendações de abordagem

## Interpretação dos Resultados

### Para Leads "Interessado"

- **Características**: Mensagens com urgência, pedidos de detalhes finais, indicações de decisão próxima
- **Abordagem recomendada**: Contato imediato com proposta comercial concreta
- **Exemplos de frases**: "quero fechar", "quando podemos assinar", "preciso disso logo"

### Para Leads "Achou Caro"

- **Características**: Objeções específicas ao preço, sem rejeitar o produto em si
- **Abordagem recomendada**: Foco em demonstrar valor e benefícios que justificam o investimento
- **Exemplos de frases**: "está acima do meu orçamento", "muito caro", "esperava um valor menor"

### Para Leads "Quer Desconto"

- **Características**: Tenta negociar ativamente, questiona sobre condições especiais
- **Abordagem recomendada**: Oferecer valor adicional em vez de desconto direto
- **Exemplos de frases**: "tem desconto?", "pode melhorar o preço?", "qual o melhor valor?"

### Para Leads "Parcelamento"

- **Características**: Interesse no produto mas com limitações no fluxo de caixa
- **Abordagem recomendada**: Apresentar opções de parcelamento e financiamento
- **Exemplos de frases**: "pode parcelar?", "quantas parcelas?", "tem financiamento?"

### Para Leads "Compra Futura"

- **Características**: Interesse claro, mas com horizonte temporal mais distante
- **Abordagem recomendada**: Contato periódico com informações relevantes
- **Exemplos de frases**: "planejo comprar no próximo ano", "estou pensando para o futuro"

### Para Leads "Sem Interesse"

- **Características**: Rejeição clara do produto ou serviço
- **Abordagem recomendada**: Reavaliar necessidade de contato ou mudar completamente a abordagem
- **Exemplos de frases**: "não tenho interesse", "escolhi outro fornecedor", "não quero mais contato"

## Dashboards e Relatórios

Para visualização agregada, consulte:

1. **View lead_sentiment_report** - Fornece um panorama completo de todos os leads com análise de sentimento
2. **Função get_priority_leads(limit)** - Retorna os leads mais prioritários para contato imediato