# Análise de Sentimento para Conversas WhatsApp

Este documento detalha a implementação da análise de sentimento para conversas WhatsApp com uma abordagem otimizada para equilibrar custo e eficácia.

## Visão Geral

A análise de sentimento será implementada como um processo agendado que roda a cada 2 horas, processando apenas as mensagens que foram recebidas ou enviadas nesse intervalo. Essa abordagem permite:

1. Manter a análise de sentimento atualizada sem processar todo o histórico
2. Reduzir custos de processamento de IA
3. Focar nos leads com interações recentes
4. Manter a estrutura de dados existente

## Implementação

### Agendamento

A análise será executada a cada 2 horas através de um cron job:

```
0 */2 * * * node scripts/sentiment-analysis.js
```

### Algoritmo de Processamento

```javascript
/**
 * Script para análise de sentimento bihourly das mensagens WhatsApp
 * Processa apenas mensagens da última janela de 2 horas que ainda não foram analisadas
 */

const { createClient } = require('@supabase/supabase-js');
const { analyzeSentiment } = require('./ai-service'); // Serviço de IA para análise

// Inicializar cliente Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function processBihourlyAnalysis() {
  console.log('Iniciando análise de sentimento bihourly - ' + new Date().toISOString());
  
  // 1. Buscar mensagens não analisadas das últimas 2 horas
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const { data: messages, error } = await supabase
    .from('whatsapp_conversations')
    .select('id, lead_id, content, created_at, direction')
    .is('analyzed_at', null)
    .gt('created_at', twoHoursAgo)
    .order('lead_id', { ascending: true })
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Erro ao buscar mensagens para análise:', error);
    return;
  }
  
  console.log(`Encontradas ${messages.length} mensagens para análise de sentimento`);
  
  // Agrupar mensagens por lead para análise contextual
  const messagesByLead = groupByLead(messages);
  let totalProcessed = 0;
  
  // 2. Processar mensagens agrupadas por lead
  for (const [leadId, leadMessages] of Object.entries(messagesByLead)) {
    try {
      console.log(`Processando ${leadMessages.length} mensagens para lead ${leadId}`);
      
      // Processar no máximo 5 mensagens mais recentes por lead
      const messagesToProcess = leadMessages.slice(0, 5);
      
      // Analisar sentimento das mensagens
      for (const message of messagesToProcess) {
        // Realizar análise de sentimento
        const { sentiment, intent, entities } = await analyzeSentiment(message.content);
        
        // Atualizar registro com resultados da análise
        await updateMessageAnalysis(message.id, sentiment, intent, entities);
        totalProcessed++;
      }
    } catch (err) {
      console.error(`Erro ao processar mensagens para lead ${leadId}:`, err);
    }
  }
  
  console.log(`Concluída análise de sentimento. Processadas ${totalProcessed} mensagens.`);
}

/**
 * Agrupa mensagens por lead_id
 */
function groupByLead(messages) {
  return messages.reduce((groups, message) => {
    const key = message.lead_id;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(message);
    return groups;
  }, {});
}

/**
 * Atualiza a mensagem com os resultados da análise
 */
async function updateMessageAnalysis(messageId, sentiment, intent, entities) {
  const { error } = await supabase
    .from('whatsapp_conversations')
    .update({
      sentiment,
      intent, 
      entities,
      analyzed_at: new Date().toISOString()
    })
    .eq('id', messageId);
  
  if (error) {
    console.error(`Erro ao atualizar análise para mensagem ${messageId}:`, error);
  }
}

// Verificação de limite de uso da API (opcional)
async function checkApiUsage() {
  // Implementar verificação de limites da API de IA
  return { withinLimits: true, remainingCredits: 1000 };
}

// Executar processamento
processBihourlyAnalysis().catch(console.error);
```

### Serviço de Análise de Sentimento

Podemos implementar o serviço de análise usando OpenAI ou outro provedor:

```javascript
// ai-service.js
const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Analisa o sentimento de uma mensagem de texto
 * @param {string} text - Texto para analisar
 * @returns {Object} Resultado com sentimento, intenção e entidades
 */
async function analyzeSentiment(text) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Analise o sentimento do texto a seguir e forneça:
1. Uma pontuação de sentimento de -1 (muito negativo) a 1 (muito positivo)
2. A intenção principal (pergunta, reclamação, elogio, solicitação, informação)
3. Entidades relevantes mencionadas (produtos, valores, datas, locais)
Responda em formato JSON com as propriedades "sentiment", "intent" e "entities".`
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.3,
      max_tokens: 150
    });

    // Extrair resultado da resposta
    const content = response.choices[0].message.content;
    const result = JSON.parse(content);
    
    return {
      sentiment: result.sentiment,
      intent: result.intent,
      entities: result.entities
    };
  } catch (error) {
    console.error('Erro na análise de sentimento:', error);
    // Retornar valores neutros em caso de erro
    return {
      sentiment: 0,
      intent: 'desconhecido',
      entities: {}
    };
  }
}

module.exports = {
  analyzeSentiment
};
```

## Estrutura de Dados

Atualizaremos a tabela `leads` com os seguintes campos para armazenar a análise de sentimento:

- `sentiment_status`: Status de interesse do lead, com os seguintes valores possíveis:
  - `interessado`: Lead demonstra forte interesse e proximidade de compra
  - `sem interesse`: Lead mostra sinais claros de desinteresse
  - `compra futura`: Lead com intenção de compra, mas não no curto prazo
  - `achou caro`: Lead interessado, mas com objeção específica sobre preço
  - `quer desconto`: Lead está negociando e solicitando redução de preço
  - `parcelamento`: Lead interessado, mas necessita de condições de pagamento facilitadas
  - `indeterminado`: Não foi possível determinar o status com clareza

- `lead_score`: Pontuação de 0 a 100 indicando a proximidade de compra
- `ai_analysis`: Análise detalhada da IA sobre o sentimento e estratégias de vendas

Também manteremos os campos na tabela `whatsapp_conversations` para análise individual das mensagens:
- `sentiment`: Pontuação de -1 (negativo) a 1 (positivo)
- `intent`: Intenção da mensagem (pergunta, reclamação, elogio, etc.)
- `entities`: Objetos mencionados (produtos, valores, datas, etc.)
- `analyzed_at`: Timestamp de quando a análise foi realizada

### Campos Adicionais no Lead

```sql
-- Adicionar à tabela leads
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS sentiment_status TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS lead_score INTEGER;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS ai_analysis TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS last_sentiment_update TIMESTAMPTZ;
```

## Validação e Monitoramento

Para avaliar a eficácia da análise, implementaremos:

1. **Dashboard de Sentimento**: Visualização da tendência de sentimento por lead
2. **Alertas**: Notificação para sentimentos muito negativos (< -0.7)
3. **Log de Uso da API**: Monitoramento do consumo da API de IA
4. **Feedback Loop**: Mecanismo para os usuários corrigirem análises incorretas

## Considerações sobre Escala

- Para bases com muitos leads ativos, podemos:
  - Aumentar o intervalo para 3-4 horas
  - Limitar o número máximo de mensagens processadas por execução
  - Implementar uma fila de processamento para distribuir a carga

## Otimizações de Custo

1. **Agrupamento de Mensagens**: Analisar várias mensagens de uma vez quando apropriado
2. **Threshold de Tamanho**: Pular mensagens muito curtas (< 5 palavras)
3. **Modelos Alternativos**: Usar modelos locais mais leves para análise básica
4. **Caching de Análises Similares**: Reutilizar resultados para mensagens muito semelhantes

## Próximos Passos

1. Implementar o script de análise bihourly
2. Configurar o cron job no servidor
3. Desenvolver o dashboard de visualização
4. Configurar sistema de alertas para sentimentos negativos
5. Implementar mecanismos de feedback para melhorar a precisão

## Exemplos de Resultado da Análise

### Análise a Nível de Mensagem
```json
{
  "id": "2ac90ee7-f10e-4ace-99a1-2970cc5a2410",
  "lead_id": "a5cd4a8d-1264-4752-b1a3-29e7e5740083",
  "content": "Ainda não recebi retorno sobre meu projeto e já faz uma semana!",
  "sentiment": -0.7,
  "intent": "reclamação",
  "entities": {
    "tempo": "uma semana",
    "objeto": "projeto"
  },
  "analyzed_at": "2025-05-09T22:15:32.105Z"
}
```

### Análise Consolidada do Lead

#### Exemplo 1: Lead Interessado
```json
{
  "id": "a5cd4a8d-1264-4752-b1a3-29e7e5740083",
  "name": "João Silva",
  "email": "joao@exemplo.com",
  "sentiment_status": "interessado",
  "lead_score": 85,
  "ai_analysis": "O lead demonstra interesse genuíno no projeto, mas está insatisfeito com o tempo de resposta. Está próximo de tomar uma decisão de compra, mas precisa de atenção imediata para não perder o interesse. Recomenda-se contato prioritário com detalhes específicos sobre prazos e próximas etapas. Utilizar abordagem prestativa e assertiva, reconhecendo a demora e oferecendo compensação.",
  "last_sentiment_update": "2025-05-09T22:15:32.105Z"
}
```

#### Exemplo 2: Lead com Objeção de Preço
```json
{
  "id": "b2e81f76-3c94-4a11-b89c-5d7f32a9e456",
  "name": "Maria Oliveira",
  "email": "maria@exemplo.com",
  "sentiment_status": "achou caro",
  "lead_score": 65,
  "ai_analysis": "O lead demonstra interesse no projeto e acompanhou detalhes técnicos, porém manifestou clara objeção ao preço apresentado. Considere apresentar o valor total em perspectiva (benefício vs. custo) ou destacar o valor agregado que justifica o investimento. Evite diminuir o valor do produto/serviço, mas enfatize o retorno obtido. Alternativamente, ofereça um recurso adicional em vez de reduzir o preço.",
  "last_sentiment_update": "2025-05-09T23:05:18.732Z"
}
```

#### Exemplo 3: Lead Solicitando Parcelamento
```json
{
  "id": "c3f92a81-7d45-4e22-a09d-8c63b4a78901",
  "name": "Carlos Santos",
  "email": "carlos@exemplo.com",
  "sentiment_status": "parcelamento",
  "lead_score": 78,
  "ai_analysis": "O lead está decidido a adquirir o serviço, mas apresenta limitações de fluxo de caixa para pagamento integral. As mensagens indicam que o valor não é o problema principal, mas sim a distribuição dos pagamentos ao longo do tempo. Recomenda-se apresentar um plano de parcelamento detalhado ou opções de financiamento. Enfatize condições especiais para pagamento à vista caso seja possível para o cliente.",
  "last_sentiment_update": "2025-05-09T21:42:55.219Z"
}
```