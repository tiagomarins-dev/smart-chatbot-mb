/**
 * Serviço para processamento de eventos e envio de mensagens automatizadas
 */

import { supabase } from './supabaseService';
import { aiIntegrationService } from './aiIntegrationService';

/**
 * Processa um evento e envia mensagens automatizadas quando aplicável
 * 
 * @param eventType - Tipo do evento (ex: visualizou_propriedade, formulario_preenchido)
 * @param leadId - ID do lead associado ao evento
 * @param eventData - Dados adicionais do evento
 */
const processEvent = async (eventType: string, leadId: string, eventData: any = {}) => {
  try {
    console.log(`Processando evento ${eventType} para lead ${leadId}`);
    
    // Registrar o evento
    await recordEvent(eventType, leadId, eventData);
    
    // Buscar templates de mensagens ativos para este tipo de evento
    const { data: templates, error } = await supabase
      .from('automated_message_templates')
      .select('*')
      .eq('trigger_type', eventType)
      .eq('active', true);
    
    if (error) {
      console.error('Erro ao buscar templates:', error);
      throw new Error('Falha ao buscar templates de mensagens');
    }
    
    if (\!templates || templates.length === 0) {
      console.log(`Nenhum template ativo encontrado para o evento ${eventType}`);
      return {
        event_recorded: true,
        messages_sent: 0,
        templates_found: 0
      };
    }
    
    // Buscar informações do lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select(`
        *,
        lead_sentiment_analysis(*),
        lead_project(project_id)
      `)
      .eq('id', leadId)
      .single();
    
    if (leadError || \!lead) {
      console.error('Erro ao buscar lead:', leadError);
      throw new Error('Falha ao buscar informações do lead');
    }
    
    // Filtrar templates com base nas condições
    const matchingTemplates = filterTemplatesByConditions(templates, lead, eventData);
    
    console.log(`${matchingTemplates.length} templates correspondentes encontrados`);
    
    // Gerar e enviar mensagens para os templates correspondentes
    const messageResults = await sendMessagesForTemplates(matchingTemplates, lead, eventData);
    
    return {
      event_recorded: true,
      messages_sent: messageResults.length,
      templates_found: templates.length,
      templates_matched: matchingTemplates.length,
      messages: messageResults
    };
  } catch (error) {
    console.error('Erro ao processar evento:', error);
    throw error;
  }
};

/**
 * Registra um evento no banco de dados
 */
const recordEvent = async (eventType: string, leadId: string, eventData: any = {}) => {
  try {
    const { error } = await supabase
      .from('lead_events')
      .insert({
        lead_id: leadId,
        event_type: eventType,
        event_data: eventData
      });
    
    if (error) {
      console.error('Erro ao registrar evento:', error);
      throw new Error('Falha ao registrar evento');
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao registrar evento:', error);
    throw error;
  }
};

/**
 * Filtra templates com base nas condições específicas
 */
const filterTemplatesByConditions = (templates: any[], lead: any, eventData: any) => {
  // Extrair informações de sentimento, se disponíveis
  const sentimentStatus = lead.lead_sentiment_analysis?.status || 'indeterminado';
  const leadScore = lead.lead_sentiment_analysis?.lead_score || 50;
  
  return templates.filter(template => {
    // Verificar filtro de sentimento
    if (template.sentiment_filter && template.sentiment_filter.length > 0) {
      if (\!template.sentiment_filter.includes(sentimentStatus)) {
        return false;
      }
    }
    
    // Verificar filtro de score
    if (template.score_filter) {
      const minScore = template.score_filter.min || 0;
      const maxScore = template.score_filter.max || 100;
      
      if (leadScore < minScore || leadScore > maxScore) {
        return false;
      }
    }
    
    // Verificar condições específicas do template
    if (template.trigger_conditions) {
      for (const condition of template.trigger_conditions) {
        // Verificar condição de projeto
        if (condition.field === 'project_id' && condition.value) {
          // Obter IDs de projeto associados ao lead
          const projectIds = Array.isArray(lead.lead_project) 
            ? lead.lead_project.map((lp: any) => lp.project_id)
            : [];
          
          if (\!projectIds.includes(condition.value)) {
            return false;
          }
        }
        
        // Verificar condições em dados do evento
        if (condition.field.startsWith('event_data.')) {
          const fieldPath = condition.field.replace('event_data.', '');
          const fieldValue = getNestedProperty(eventData, fieldPath);
          
          if (fieldValue \!== condition.value) {
            return false;
          }
        }
      }
    }
    
    return true;
  });
};

/**
 * Gera e envia mensagens para os templates correspondentes
 */
const sendMessagesForTemplates = async (templates: any[], lead: any, eventData: any) => {
  const results = [];
  
  for (const template of templates) {
    try {
      // Gerar mensagem personalizada
      const message = await aiIntegrationService.generateLeadMessage(lead, template);
      
      // Registrar mensagem no banco de dados
      const { data, error } = await supabase
        .from('automated_messages')
        .insert({
          lead_id: lead.id,
          template_id: template.id,
          message_content: message,
          status: 'pending',
          metadata: {
            event_data: eventData,
            generated_at: new Date().toISOString()
          }
        })
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao registrar mensagem:', error);
        throw new Error('Falha ao registrar mensagem automatizada');
      }
      
      results.push({
        template_id: template.id,
        template_name: template.name,
        message_id: data.id,
        message: message,
        status: 'pending'
      });
    } catch (error) {
      console.error(`Erro ao processar template ${template.id}:`, error);
      results.push({
        template_id: template.id,
        template_name: template.name,
        error: 'Falha ao gerar ou registrar mensagem',
        status: 'error'
      });
    }
  }
  
  return results;
};

/**
 * Obtém valor de propriedade aninhada em um objeto
 */
const getNestedProperty = (obj: any, path: string) => {
  return path.split('.').reduce((prev, curr) => {
    return prev ? prev[curr] : undefined;
  }, obj);
};

/**
 * Verifica leads inativos e envia mensagens quando aplicável
 */
const processInactiveLeads = async () => {
  // Configurações de inatividade
  const SHORT_INACTIVITY_DAYS = 3;
  const MEDIUM_INACTIVITY_DAYS = 7;
  const LONG_INACTIVITY_DAYS = 14;
  
  try {
    console.log('Processando leads inativos...');
    
    // Buscar leads sem interações recentes
    const now = new Date();
    const shortInactivityDate = new Date(now);
    shortInactivityDate.setDate(now.getDate() - SHORT_INACTIVITY_DAYS);
    
    const mediumInactivityDate = new Date(now);
    mediumInactivityDate.setDate(now.getDate() - MEDIUM_INACTIVITY_DAYS);
    
    const longInactivityDate = new Date(now);
    longInactivityDate.setDate(now.getDate() - LONG_INACTIVITY_DAYS);
    
    // Buscar leads inativos
    const { data: inactiveLeads, error } = await supabase
      .from('leads')
      .select(`
        *,
        lead_sentiment_analysis(*),
        lead_events\!lead_events_lead_id_fkey(
          id,
          event_type,
          created_at
        )
      `)
      .order('lead_events.created_at', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar leads inativos:', error);
      throw new Error('Falha ao buscar leads inativos');
    }
    
    const results = {
      short_inactivity: 0,
      medium_inactivity: 0,
      long_inactivity: 0,
      messages_sent: 0,
      errors: 0
    };
    
    // Processar cada lead
    for (const lead of inactiveLeads || []) {
      try {
        // Determinar nível de inatividade
        const lastEventDate = lead.lead_events && lead.lead_events.length > 0
          ? new Date(lead.lead_events[0].created_at)
          : null;
        
        if (\!lastEventDate) {
          continue; // Pular leads sem eventos
        }
        
        // Verificar se já foi enviada mensagem de inatividade para este lead recentemente
        const { data: recentInactivityMessages } = await supabase
          .from('automated_messages')
          .select('*')
          .eq('lead_id', lead.id)
          .like('metadata->inactivity_level', '%')
          .order('created_at', { ascending: false })
          .limit(1);
        
        const lastInactivityMessage = recentInactivityMessages && recentInactivityMessages.length > 0
          ? recentInactivityMessages[0]
          : null;
        
        const lastMessageDate = lastInactivityMessage
          ? new Date(lastInactivityMessage.created_at)
          : null;
        
        // Determinar nível de inatividade e se deve enviar mensagem
        let inactivityLevel = null;
        let daysInactive = 0;
        
        if (lastEventDate < longInactivityDate) {
          // Inatividade longa (mais de 14 dias)
          inactivityLevel = 'long';
          daysInactive = Math.floor((now.getTime() - lastEventDate.getTime()) / (1000 * 60 * 60 * 24));
          
          // Só enviar se a última mensagem de inatividade foi há mais de 7 dias ou nunca foi enviada
          if (\!lastMessageDate || lastMessageDate < mediumInactivityDate) {
            results.long_inactivity++;
          } else {
            continue; // Pular este lead, mensagem de inatividade enviada recentemente
          }
        } else if (lastEventDate < mediumInactivityDate) {
          // Inatividade média (7-14 dias)
          inactivityLevel = 'medium';
          daysInactive = Math.floor((now.getTime() - lastEventDate.getTime()) / (1000 * 60 * 60 * 24));
          
          // Só enviar se a última mensagem de inatividade foi há mais de 3 dias ou nunca foi enviada
          if (\!lastMessageDate || lastMessageDate < shortInactivityDate) {
            results.medium_inactivity++;
          } else {
            continue; // Pular este lead, mensagem de inatividade enviada recentemente
          }
        } else if (lastEventDate < shortInactivityDate) {
          // Inatividade curta (3-7 dias)
          inactivityLevel = 'short';
          daysInactive = Math.floor((now.getTime() - lastEventDate.getTime()) / (1000 * 60 * 60 * 24));
          results.short_inactivity++;
        } else {
          continue; // Lead não está inativo
        }
        
        // Buscar templates para inatividade
        const { data: templates } = await supabase
          .from('automated_message_templates')
          .select('*')
          .eq('trigger_type', 'inactivity')
          .eq('active', true);
        
        if (\!templates || templates.length === 0) {
          continue; // Sem templates para inatividade
        }
        
        // Filtrar templates com base no nível de inatividade e outras condições
        const matchingTemplates = templates.filter(template => {
          const inactivityLevels = template.trigger_conditions?.inactivity_levels || ['short', 'medium', 'long'];
          return inactivityLevels.includes(inactivityLevel);
        });
        
        if (matchingTemplates.length === 0) {
          continue; // Sem templates correspondentes
        }
        
        // Usar apenas o primeiro template correspondente
        const template = matchingTemplates[0];
        
        // Preparar contexto de inatividade
        const inactivityContext = {
          level: inactivityLevel,
          days_inactive: daysInactive,
          last_interaction: lastEventDate ? {
            date: lastEventDate.toISOString(),
            event_type: lead.lead_events[0].event_type
          } : null
        };
        
        // Gerar mensagem personalizada
        const message = await aiIntegrationService.generateLeadMessage({
          ...lead,
          inactivity_context: inactivityContext
        }, template);
        
        // Registrar mensagem no banco de dados
        await supabase
          .from('automated_messages')
          .insert({
            lead_id: lead.id,
            template_id: template.id,
            message_content: message,
            status: 'pending',
            metadata: {
              inactivity_level: inactivityLevel,
              days_inactive: daysInactive,
              generated_at: now.toISOString()
            }
          });
        
        results.messages_sent++;
      } catch (error) {
        console.error(`Erro ao processar lead inativo ${lead.id}:`, error);
        results.errors++;
      }
    }
    
    return results;
  } catch (error) {
    console.error('Erro ao processar leads inativos:', error);
    throw error;
  }
};

// Exportar funções do serviço
export const eventProcessingService = {
  processEvent,
  processInactiveLeads
};
EOF < /dev/null