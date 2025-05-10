/**
 * Configuration for the WhatsApp Smart Chatbot
 * This file contains settings that can be adjusted to fine-tune chatbot behavior
 */

export const ChatbotConfig = {
  // General settings
  enabled: true,
  minimumConfidenceThreshold: 0.7,
  
  // Question detection
  questionPhrases: [
    'o que', 'qual', 'como', 'quando', 'onde', 'por que', 'quem', 'quanto',
    'me fale', 'gostaria de saber', 'pode me informar', 'tem como'
  ],
  
  // Project-related keywords
  projectKeywords: [
    'projeto', 'empreendimento', 'casa', 'apartamento', 'imóvel', 
    'preço', 'valor', 'custo', 'lançamento', 'entrega', 'localização',
    'metragem', 'área', 'planta', 'quartos', 'suítes', 'vaga', 'garagem'
  ],
  
  // Question categories and their keywords
  categories: {
    price: [
      'preço', 'valor', 'custo', 'quanto custa', 'pagamento', 'financiamento',
      'parcela', 'prestação', 'investimento', 'orçamento'
    ],
    delivery: [
      'entrega', 'quando fica pronto', 'conclusão', 'previsão', 'cronograma',
      'prazo', 'data de finalização', 'termina quando'
    ],
    location: [
      'localização', 'endereço', 'onde fica', 'bairro', 'rua', 'avenida',
      'perto de', 'próximo a', 'região', 'zona'
    ],
    size: [
      'área', 'metragem', 'tamanho', 'dimensão', 'metros quadrados', 'm²',
      'metro', 'espaço', 'planta'
    ],
    bedrooms: [
      'quarto', 'dormitório', 'suíte', 'cômodo', 'quartos', 'dependência',
      'quantos quartos', 'tem suíte'
    ],
    amenities: [
      'lazer', 'piscina', 'academia', 'salão', 'churrasqueira', 'playground',
      'quadra', 'pet place', 'coworking', 'espaço'
    ],
    details: [
      'informação', 'detalhe', 'sobre o projeto', 'característica', 'feature',
      'funcionalidade', 'descrição', 'explicação', 'material', 'acabamento'
    ]
  },
  
  // Response templates
  responseTemplates: {
    price: 'O valor do {projectName} é {price}.',
    priceNotAvailable: 'Não tenho a informação de preço do {projectName} neste momento. Um de nossos consultores entrará em contato para fornecer essa informação.',
    
    delivery: 'A previsão de entrega do {projectName} é {deliveryDate}.',
    deliveryNotAvailable: 'Não tenho a informação de entrega do {projectName} neste momento. Um de nossos consultores entrará em contato para fornecer essa informação.',
    
    location: 'O {projectName} está localizado em {location}.',
    locationNotAvailable: 'Não tenho a informação de localização do {projectName} neste momento. Um de nossos consultores entrará em contato para fornecer essa informação.',
    
    size: 'O {projectName} possui {size} metros quadrados.',
    sizeNotAvailable: 'Não tenho a informação de metragem do {projectName} neste momento. Um de nossos consultores entrará em contato para fornecer essa informação.',
    
    bedrooms: 'O {projectName} possui {bedrooms} quartos.',
    bedroomsNotAvailable: 'Não tenho a informação sobre quartos do {projectName} neste momento. Um de nossos consultores entrará em contato para fornecer essa informação.',
    
    details: 'O {projectName} é um excelente empreendimento{description}. Gostaria de mais alguma informação específica?',
    detailsNotAvailable: 'Não tenho detalhes adicionais sobre o {projectName} neste momento. Um de nossos consultores entrará em contato para fornecer mais informações.',
    
    multipleProjects: 'Você está interessado em qual dos seguintes projetos: {projectList}?',
    noProjectFound: 'Não consegui identificar o projeto específico. Poderia me dizer qual projeto lhe interessa?',
    
    generalResponse: 'Não entendi completamente sua pergunta sobre o {projectName}. Poderia ser mais específico ou perguntar sobre o preço, data de entrega, localização ou tamanho?'
  },
  
  // Analytics settings
  analytics: {
    trackCategories: true,
    trackResponseTimes: true,
    trackUserSatisfaction: true,
    satisfactionKeywords: {
      positive: ['obrigado', 'valeu', 'perfeito', 'ótimo', 'excelente', 'bom'],
      negative: ['não entendi', 'confuso', 'não ajudou', 'errado', 'incorreto']
    }
  }
};

export default ChatbotConfig;