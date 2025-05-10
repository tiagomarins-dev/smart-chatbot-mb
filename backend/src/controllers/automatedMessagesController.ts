import { Request, Response } from 'express';
import { supabase } from '../services/supabaseService';
import { logger } from '../utils/logger';

/**
 * Controlador para gerenciamento de templates de mensagens automatizadas
 */

/**
 * Obtém todos os templates de mensagens para um projeto
 */
export const getTemplates = async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId;
    
    if (!projectId) {
      return res.status(400).json({ 
        success: false,
        error: 'Project ID is required' 
      });
    }
    
    const { data, error } = await supabase
      .from('automated_message_templates')
      .select('*')
      .eq('project_id', projectId)
      .order('name', { ascending: true });
    
    if (error) {
      logger.error(`Error fetching message templates: ${error.message}`, { error });
      throw error;
    }
    
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error: any) {
    logger.error(`Error in getTemplates: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch message templates'
    });
  }
};

/**
 * Obtém um template específico por ID
 */
export const getTemplateById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('automated_message_templates')
      .select(`
        *,
        event_triggers(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }
      
      logger.error(`Error fetching template: ${error.message}`, { error });
      throw error;
    }
    
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error: any) {
    logger.error(`Error in getTemplateById: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch template details'
    });
  }
};

/**
 * Cria um novo template de mensagem automatizada
 */
export const createTemplate = async (req: Request, res: Response) => {
  try {
    const {
      project_id,
      event_type,
      name,
      description,
      instructions,
      example_message,
      send_delay_minutes,
      active,
      lead_score_min,
      lead_score_max,
      applicable_sentiments,
      max_sends_per_lead
    } = req.body;
    
    // Validações básicas
    if (!project_id || !event_type || !name || !instructions) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: project_id, event_type, name, and instructions are required'
      });
    }
    
    // Verificando se o projeto existe
    const { data: projectExists, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', project_id)
      .single();
    
    if (projectError || !projectExists) {
      return res.status(400).json({
        success: false,
        error: 'Invalid project ID'
      });
    }
    
    // Verificando se o evento existe
    const { data: eventExists, error: eventError } = await supabase
      .from('event_triggers')
      .select('id')
      .eq('project_id', project_id)
      .eq('event_code', event_type)
      .single();
    
    if (eventError && eventError.code !== 'PGRST116') {
      logger.error(`Error checking event trigger: ${eventError.message}`, { eventError });
      throw eventError;
    }
    
    // Criando o template
    const { data, error } = await supabase
      .from('automated_message_templates')
      .insert({
        project_id,
        event_type,
        name,
        description,
        instructions,
        example_message,
        send_delay_minutes: send_delay_minutes || 0,
        active: active !== undefined ? active : true,
        lead_score_min,
        lead_score_max,
        applicable_sentiments,
        max_sends_per_lead: max_sends_per_lead || 1,
        created_by: req.user?.id
      })
      .select()
      .single();
    
    if (error) {
      logger.error(`Error creating template: ${error.message}`, { error });
      throw error;
    }
    
    return res.status(201).json({
      success: true,
      data
    });
  } catch (error: any) {
    logger.error(`Error in createTemplate: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      error: 'Failed to create template'
    });
  }
};

/**
 * Atualiza um template existente
 */
export const updateTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Verificar se o template existe
    const { data: existingTemplate, error: checkError } = await supabase
      .from('automated_message_templates')
      .select('id, project_id')
      .eq('id', id)
      .single();
    
    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }
      
      logger.error(`Error checking template: ${checkError.message}`, { checkError });
      throw checkError;
    }
    
    // Não permitir alteração do project_id
    if (updateData.project_id && updateData.project_id !== existingTemplate.project_id) {
      return res.status(400).json({
        success: false,
        error: 'Project ID cannot be changed'
      });
    }
    
    // Remover campos que não devem ser atualizados
    delete updateData.id;
    delete updateData.created_at;
    delete updateData.created_by;
    
    // Adicionar updated_at
    updateData.updated_at = new Date().toISOString();
    
    // Atualizar o template
    const { data, error } = await supabase
      .from('automated_message_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      logger.error(`Error updating template: ${error.message}`, { error });
      throw error;
    }
    
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error: any) {
    logger.error(`Error in updateTemplate: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      error: 'Failed to update template'
    });
  }
};

/**
 * Ativa ou desativa um template
 */
export const toggleTemplateStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { active } = req.body;
    
    if (active === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Active status is required'
      });
    }
    
    // Verificar se o template existe
    const { data: existingTemplate, error: checkError } = await supabase
      .from('automated_message_templates')
      .select('id')
      .eq('id', id)
      .single();
    
    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }
      
      logger.error(`Error checking template: ${checkError.message}`, { checkError });
      throw checkError;
    }
    
    // Atualizar o status
    const { data, error } = await supabase
      .from('automated_message_templates')
      .update({ 
        active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      logger.error(`Error toggling template status: ${error.message}`, { error });
      throw error;
    }
    
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error: any) {
    logger.error(`Error in toggleTemplateStatus: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      error: 'Failed to update template status'
    });
  }
};

/**
 * Exclui um template
 */
export const deleteTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Verificar se o template existe
    const { data: existingTemplate, error: checkError } = await supabase
      .from('automated_message_templates')
      .select('id')
      .eq('id', id)
      .single();
    
    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }
      
      logger.error(`Error checking template: ${checkError.message}`, { checkError });
      throw checkError;
    }
    
    // Excluir o template
    const { error } = await supabase
      .from('automated_message_templates')
      .delete()
      .eq('id', id);
    
    if (error) {
      logger.error(`Error deleting template: ${error.message}`, { error });
      throw error;
    }
    
    return res.status(200).json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error: any) {
    logger.error(`Error in deleteTemplate: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      error: 'Failed to delete template'
    });
  }
};

/**
 * Obtém todos os eventos disponíveis para um projeto
 */
export const getEventTriggers = async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId;
    
    if (!projectId) {
      return res.status(400).json({ 
        success: false,
        error: 'Project ID is required' 
      });
    }
    
    const { data, error } = await supabase
      .from('event_triggers')
      .select('*')
      .eq('project_id', projectId)
      .eq('active', true)
      .order('event_name', { ascending: true });
    
    if (error) {
      logger.error(`Error fetching event triggers: ${error.message}`, { error });
      throw error;
    }
    
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error: any) {
    logger.error(`Error in getEventTriggers: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch event triggers'
    });
  }
};

/**
 * Cria um novo evento personalizado
 */
export const createEventTrigger = async (req: Request, res: Response) => {
  try {
    const {
      project_id,
      event_code,
      event_name,
      event_description,
      capture_points,
      required_parameters,
      active
    } = req.body;
    
    // Validações básicas
    if (!project_id || !event_code || !event_name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: project_id, event_code, and event_name are required'
      });
    }
    
    // Verificando se o projeto existe
    const { data: projectExists, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', project_id)
      .single();
    
    if (projectError || !projectExists) {
      return res.status(400).json({
        success: false,
        error: 'Invalid project ID'
      });
    }
    
    // Verificando se o evento já existe
    const { data: eventExists, error: eventError } = await supabase
      .from('event_triggers')
      .select('id')
      .eq('project_id', project_id)
      .eq('event_code', event_code)
      .single();
    
    if (eventExists) {
      return res.status(409).json({
        success: false,
        error: 'Event with this code already exists for this project'
      });
    }
    
    // Criando o evento
    const { data, error } = await supabase
      .from('event_triggers')
      .insert({
        project_id,
        event_code,
        event_name,
        event_description,
        capture_points,
        required_parameters,
        active: active !== undefined ? active : true,
        created_by: req.user?.id
      })
      .select()
      .single();
    
    if (error) {
      logger.error(`Error creating event trigger: ${error.message}`, { error });
      throw error;
    }
    
    return res.status(201).json({
      success: true,
      data
    });
  } catch (error: any) {
    logger.error(`Error in createEventTrigger: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      error: 'Failed to create event trigger'
    });
  }
};

/**
 * Obtém o histórico de mensagens automatizadas para um lead
 */
export const getLeadAutomatedMessages = async (req: Request, res: Response) => {
  try {
    const { leadId } = req.params;
    
    const { data, error } = await supabase
      .from('automated_message_logs')
      .select(`
        *,
        template:template_id(name, event_type)
      `)
      .eq('lead_id', leadId)
      .order('sent_at', { ascending: false });
    
    if (error) {
      logger.error(`Error fetching lead automated messages: ${error.message}`, { error });
      throw error;
    }
    
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error: any) {
    logger.error(`Error in getLeadAutomatedMessages: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch lead automated messages'
    });
  }
};

// Exportar todos os controladores
export default {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  toggleTemplateStatus,
  deleteTemplate,
  getEventTriggers,
  createEventTrigger,
  getLeadAutomatedMessages
};