import { supabase } from '../supabaseService';
import { Project } from '../../interfaces/Project';
import { Lead } from '../../interfaces/Lead';
import ChatbotConfig from './chatbotConfig';

interface MessageAnalysis {
  isQuestion: boolean;
  projectQuestion: boolean;
  category: string;
  entities: {
    projectId?: string;
    projectName?: string;
    attribute?: string;
  };
}

interface ChatbotResponse {
  message: string;
  shouldRespond: boolean;
  analysis: MessageAnalysis;
}

class ChatbotService {
  private static instance: ChatbotService;

  private constructor() {}

  public static getInstance(): ChatbotService {
    if (!ChatbotService.instance) {
      ChatbotService.instance = new ChatbotService();
    }
    return ChatbotService.instance;
  }

  /**
   * Analyzes a message to determine if it's a question about a project
   */
  private analyzeMessage(message: string, leadId?: string): MessageAnalysis {
    const lowerMessage = message.toLowerCase();

    // Basic question detection
    const isQuestion = lowerMessage.includes('?') ||
      ChatbotConfig.questionPhrases.some(phrase => lowerMessage.includes(phrase));

    // Project-related question detection
    const projectQuestion = ChatbotConfig.projectKeywords.some(keyword => lowerMessage.includes(keyword));

    // Attempt to extract project name/ID
    let projectName = null;
    const projectNameMatch = lowerMessage.match(/projeto\s+([a-zA-Z0-9\s]+)/i) ||
                            lowerMessage.match(/empreendimento\s+([a-zA-Z0-9\s]+)/i) ||
                            lowerMessage.match(/imóvel\s+([a-zA-Z0-9\s]+)/i);
    if (projectNameMatch && projectNameMatch[1]) {
      projectName = projectNameMatch[1].trim();
    }

    // Categorize the question
    let category = 'other';
    let attribute = undefined;

    // Check each category from the config
    for (const [categoryKey, keywords] of Object.entries(ChatbotConfig.categories)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        category = categoryKey;

        // Map category to attribute name in database
        switch (categoryKey) {
          case 'price':
            attribute = 'price';
            break;
          case 'delivery':
            attribute = 'delivery_date';
            break;
          case 'location':
            attribute = 'address';
            break;
          case 'size':
            attribute = 'size';
            break;
          case 'bedrooms':
            attribute = 'bedrooms';
            break;
          case 'details':
            attribute = 'description';
            break;
        }

        break; // Stop after finding the first matching category
      }
    }

    return {
      isQuestion,
      projectQuestion,
      category,
      entities: {
        projectName,
        attribute
      }
    };
  }

  /**
   * Get project by name (fuzzy match)
   */
  private async getProjectByName(name: string): Promise<Project | null> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .ilike('name', `%${name}%`)
      .limit(1);
    
    if (error || !data || data.length === 0) {
      return null;
    }
    
    return data[0] as Project;
  }

  /**
   * Get projects associated with a lead
   */
  private async getLeadProjects(leadId: string): Promise<Project[]> {
    const { data, error } = await supabase
      .from('lead_project')
      .select('project_id')
      .eq('lead_id', leadId);
    
    if (error || !data || data.length === 0) {
      return [];
    }
    
    const projectIds = data.map(item => item.project_id);
    
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .in('id', projectIds);
    
    if (projectsError || !projects) {
      return [];
    }
    
    return projects as Project[];
  }

  /**
   * Generate a response to a project-related question
   */
  private async generateProjectResponse(analysis: MessageAnalysis, leadId: string): Promise<string> {
    let project: Project | null = null;

    // Try to get the specific project mentioned
    if (analysis.entities.projectName) {
      project = await this.getProjectByName(analysis.entities.projectName);
    }

    // If no specific project found or mentioned, get the lead's associated projects
    if (!project && leadId) {
      const leadProjects = await this.getLeadProjects(leadId);

      if (leadProjects.length === 1) {
        // If lead has only one project, use that
        project = leadProjects[0];
      } else if (leadProjects.length > 1) {
        // If lead has multiple projects, ask which one they're inquiring about
        const projectNames = leadProjects.map(p => p.name).join(', ');
        return ChatbotConfig.responseTemplates.multipleProjects.replace('{projectList}', projectNames);
      }
    }

    // If no project found, give a generic response
    if (!project) {
      return ChatbotConfig.responseTemplates.noProjectFound;
    }

    // Generate response based on question category
    switch (analysis.category) {
      case 'price':
        return project.price
          ? ChatbotConfig.responseTemplates.price
              .replace('{projectName}', project.name)
              .replace('{price}', this.formatCurrency(project.price))
          : ChatbotConfig.responseTemplates.priceNotAvailable
              .replace('{projectName}', project.name);

      case 'delivery':
        return project.delivery_date
          ? ChatbotConfig.responseTemplates.delivery
              .replace('{projectName}', project.name)
              .replace('{deliveryDate}', this.formatDate(project.delivery_date))
          : ChatbotConfig.responseTemplates.deliveryNotAvailable
              .replace('{projectName}', project.name);

      case 'location':
        return project.address
          ? ChatbotConfig.responseTemplates.location
              .replace('{projectName}', project.name)
              .replace('{location}', project.address)
          : ChatbotConfig.responseTemplates.locationNotAvailable
              .replace('{projectName}', project.name);

      case 'size':
        return project.size
          ? ChatbotConfig.responseTemplates.size
              .replace('{projectName}', project.name)
              .replace('{size}', project.size.toString())
          : ChatbotConfig.responseTemplates.sizeNotAvailable
              .replace('{projectName}', project.name);

      case 'bedrooms':
        return project.bedrooms
          ? ChatbotConfig.responseTemplates.bedrooms
              .replace('{projectName}', project.name)
              .replace('{bedrooms}', project.bedrooms.toString())
          : ChatbotConfig.responseTemplates.bedroomsNotAvailable
              .replace('{projectName}', project.name);

      case 'details':
        return ChatbotConfig.responseTemplates.details
          .replace('{projectName}', project.name)
          .replace('{description}', project.description ? `: ${project.description}` : '');

      default:
        return ChatbotConfig.responseTemplates.generalResponse
          .replace('{projectName}', project.name);
    }
  }

  /**
   * Format currency values
   */
  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  /**
   * Format date values
   */
  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long'
    });
  }

  /**
   * Process an incoming message and generate an appropriate response
   */
  public async processMessage(message: string, leadId: string): Promise<ChatbotResponse> {
    // Analyze the message
    const analysis = this.analyzeMessage(message, leadId);
    
    // Default is not to respond automatically
    let shouldRespond = false;
    let responseMessage = '';
    
    // Determine if we should respond
    if (analysis.isQuestion && analysis.projectQuestion) {
      shouldRespond = true;
      responseMessage = await this.generateProjectResponse(analysis, leadId);
    }
    
    return {
      message: responseMessage,
      shouldRespond,
      analysis
    };
  }

  /**
   * Save analysis results to the database
   */
  public async saveAnalysis(
    conversationId: string, 
    analysis: MessageAnalysis
  ): Promise<void> {
    const { error } = await supabase
      .from('whatsapp_conversations')
      .update({
        intent: analysis.category,
        entities: analysis.entities,
        ai_processed: true
      })
      .eq('id', conversationId);
    
    if (error) {
      console.error('Error saving analysis:', error);
    }
  }
}

export default ChatbotService.getInstance();