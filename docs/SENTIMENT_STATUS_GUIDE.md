# Guia de Status de Sentimento de Leads

Este documento detalha os diferentes status de sentimento que podem ser atribuídos aos leads com base na análise das conversas de WhatsApp, explicando seus significados, critérios de detecção e estratégias de abordagem recomendadas.

## Visão Geral dos Status

A análise de sentimento classifica os leads em uma das seguintes categorias:

| Status | Descrição | Lead Score (0-100) |
|--------|-----------|-------------------|
| **interessado** | Lead com alta probabilidade de conversão imediata | 80-95 |
| **compra futura** | Lead com intenção de compra, mas não no curto prazo | 70-80 |
| **achou caro** | Lead interessado com objeção específica sobre preço | 60-70 |
| **quer desconto** | Lead interessado negociando redução de preço | 65-75 |
| **parcelamento** | Lead interessado buscando condições de pagamento facilitadas | 75-85 |
| **sem interesse** | Lead demonstrando desinteresse ou rejeição | 0-30 |
| **indeterminado** | Não foi possível classificar com clareza | 40-60 |

## Detalhamento dos Status

### 1. Interessado

**Indicadores de detecção:**
- Solicita orçamento final ou proposta detalhada
- Usa termos de urgência como "hoje", "agora", "imediato"
- Pergunta sobre prazos curtos de entrega
- Demonstra comprometimento claro com a compra
- Solicita informações sobre assinatura de contrato

**Abordagem recomendada:**
- Contato prioritário e imediato
- Fornecer detalhes específicos sobre o projeto/produto
- Apresentar proposta completa com todos os benefícios
- Enfatizar diferenciais exclusivos
- Oferecer algum benefício por fechamento rápido

**Exemplos de mensagens:**
- "Preciso disso para ontem, como fechamos?"
- "Quero avançar com o projeto o mais rápido possível."
- "Já decidi, só precisamos acertar os detalhes."

### 2. Compra Futura

**Indicadores de detecção:**
- Demonstra interesse, mas sem urgência
- Menciona "próximo mês", "em breve", "futuramente"
- Solicita informações detalhadas sobre o produto/serviço
- Está comparando alternativas para decisão futura
- Faz perguntas específicas sobre funcionalidades

**Abordagem recomendada:**
- Enviar material informativo regularmente
- Manter contato periódico sem pressionar
- Destacar benefícios e diferenciais gradualmente
- Apresentar casos de sucesso e depoimentos
- Estabelecer um cronograma de follow-up

**Exemplos de mensagens:**
- "Tenho interesse, mas só poderei seguir com isso no próximo mês."
- "Estou analisando opções para implementar no próximo trimestre."
- "Gostei da proposta, preciso planejar o orçamento para avançar."

### 3. Achou Caro

**Indicadores de detecção:**
- Menciona explicitamente que o valor está acima do esperado
- Demonstra surpresa negativa com o preço
- Questiona a relação custo-benefício
- Compara com alternativas mais baratas
- Afirma que está fora do orçamento

**Abordagem recomendada:**
- Destacar o valor agregado e retorno sobre investimento
- Apresentar o valor total em perspectiva de benefícios
- Oferecer recursos adicionais em vez de baixar preço
- Detalhar todos os itens inclusos no valor
- Comparar com alternativas mais baratas destacando desvantagens

**Exemplos de mensagens:**
- "Achei o valor bem acima do que estávamos imaginando."
- "É possível revisar este preço? Está fora do nosso orçamento."
- "Para este valor, esperávamos mais funcionalidades."

### 4. Quer Desconto

**Indicadores de detecção:**
- Solicita diretamente redução de preço ou desconto
- Negocia ativamente valores ou condições
- Menciona orçamentos de concorrentes
- Sugere fechamento condicionado a melhoria nas condições
- Pede "condição especial" ou "melhor preço"

**Abordagem recomendada:**
- Oferecer desconto limitado com condicionantes
- Propor valor igual com benefícios adicionais
- Apresentar planos alternativos com menor custo
- Sugerir escalonamento de valores por volume ou tempo
- Enfatizar políticas de preço justo para todos os clientes

**Exemplos de mensagens:**
- "Qual é o melhor desconto que vocês podem oferecer?"
- "Se conseguirmos um valor mais atrativo, fechamos hoje."
- "Tenho orçamentos mais baratos de outros fornecedores."

### 5. Parcelamento

**Indicadores de detecção:**
- Pergunta sobre opções de parcelamento ou financiamento
- Demonstra aceitação do valor, mas dificuldade com fluxo de caixa
- Solicita pagamentos distribuídos ao longo do tempo
- Menciona "prestações", "mensalidades" ou "pagamento em vezes"
- Questiona sobre taxas de juros ou condições de crédito

**Abordagem recomendada:**
- Apresentar diferentes opções de parcelamento
- Oferecer condições especiais para pagamento à vista
- Propor um plano de pagamento personalizado
- Sugerir entrada menor com parcelas maiores
- Considerar parcerias com instituições financeiras

**Exemplos de mensagens:**
- "Vocês trabalham com parcelamento em 12 vezes?"
- "Posso pagar uma entrada e o restante em prestações mensais?"
- "O valor está bom, mas precisamos dividir o pagamento."

### 6. Sem Interesse

**Indicadores de detecção:**
- Recusa explícita ou manifestação clara de desinteresse
- Menciona ter escolhido um concorrente
- Não responde a múltiplas tentativas de contato
- Usa expressões como "não vamos seguir" ou "não é o momento"
- Pede para não ser mais contatado

**Abordagem recomendada:**
- Tentar entender as objeções fundamentais (uma última vez)
- Oferecer alternativa de produto/serviço mais adequada
- Sugerir contato futuro em momento mais oportuno
- Agradecer o tempo e atenção dedicados
- Manter porta aberta para contato futuro

**Exemplos de mensagens:**
- "Obrigado, mas decidimos não avançar com este projeto."
- "Já contratamos outro fornecedor para este serviço."
- "No momento não temos interesse, talvez no futuro."

## Implementação Técnica

### Detecção Automatizada

O sistema detecta estes status através de:

1. **Análise de palavras-chave** - Expressões regulares que identificam padrões característicos de cada status
2. **Contexto das mensagens** - Considera sequência e interação entre mensagens
3. **Lead score** - Pontuação numérica baseada na proximidade e probabilidade de conversão

### Personalização

Os padrões de detecção podem ser ajustados através da edição dos regex no arquivo `scripts/sentiment-analysis.js`:

```javascript
// Exemplo de como personalizar a detecção de "achou caro"
if (/caro|preço alto|alto valor|valor elevado|muito dinheiro|fora do orçamento/i.test(lowerContent)) {
  sentimentStatus = 'achou caro';
  leadScore = 65;
}
```

## Dashboard e Relatórios

Os status de sentimento são visíveis em:

1. **Perfil do Lead** - Status e pontuação atual do lead
2. **Dashboard de Vendas** - Distribuição de leads por status de sentimento
3. **Relatórios de Conversão** - Taxa de conversão por status de sentimento
4. **Lista de Priorização** - Leads ordenados por score e status

## Próximos Passos

- **Implementar modelos de IA avançados** - Substituir a detecção baseada em regex por análise contextual com ML
- **Histórico de status** - Manter registro da evolução do sentimento ao longo do tempo
- **Alertas por mudança de status** - Notificar a equipe de vendas quando um lead mudar para status de alta prioridade
- **Auto-sugestão de mensagens** - Recomendar respostas apropriadas baseadas no status identificado