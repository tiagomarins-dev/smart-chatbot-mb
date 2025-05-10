/**
 * Controlador para gerenciamento de mensagens automatizadas
 */

import { Request, Response } from 'express';
import { supabase } from '../../services/supabaseService';
import { aiIntegrationService } from '../../services/aiIntegrationService';
import { eventProcessingService } from '../../services/eventProcessingService';

/**
 * Cria um novo template de mensagem automatizada
 */
export const createAutomatedMessageTemplate = async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      trigger_type,
      trigger_conditions,
      message_template,
      active,
      sentiment_filter,
      score_filter,
      project_id
    } = req.body;

    // Validar dados
    if (\!name || \!trigger_type || \!message_template) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios não fornecidos'
      });
    }

    // Criar template no banco de dados
    const { data, error } = await supabase
      .from('automated_message_templates')
      .insert({
        name,
        description,
        trigger_type,
        trigger_conditions,
        message_template,
        active: active ?? true,
        sentiment_filter,
        score_filter,
        project_id
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar template:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar template de mensagem automatizada',
        error: error.message
      });
    }

    return res.status(201).json({
      success: true,
      data
    });
  } catch (error: any) {
    console.error('Erro ao processar solicitação:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

/**
 * Obtém todos os templates de mensagens automatizadas
 */
export const getAutomatedMessageTemplates = async (req: Request, res: Response) => {
  try {
    const { project_id } = req.query;
    
    let query = supabase
      .from('automated_message_templates')
      .select('*');
    
    // Filtrar por projeto, se especificado
    if (project_id) {
      query = query.eq('project_id', project_id);
    }
    
    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar templates:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar templates de mensagens automatizadas',
        error: error.message
      });
    }

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error: any) {
    console.error('Erro ao processar solicitação:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

/**
 * Obtém um template específico de mensagem automatizada
 */
export const getAutomatedMessageTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('automated_message_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar template:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar template de mensagem automatizada',
        error: error.message
      });
    }

    if (\!data) {
      return res.status(404).json({
        success: false,
        message: 'Template não encontrado'
      });
    }

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error: any) {
    console.error('Erro ao processar solicitação:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

/**
 * Atualiza um template de mensagem automatizada
 */
export const updateAutomatedMessageTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      trigger_type,
      trigger_conditions,
      message_template,
      active,
      sentiment_filter,
      score_filter
    } = req.body;

    // Verificar se o template existe
    const { data: existingTemplate, error: fetchError } = await supabase
      .from('automated_message_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || \!existingTemplate) {
      return res.status(404).json({
        success: false,
        message: 'Template não encontrado'
      });
    }

    // Atualizar template
    const { data, error } = await supabase
      .from('automated_message_templates')
      .update({
        name,
        description,
        trigger_type,
        trigger_conditions,
        message_template,
        active,
        sentiment_filter,
        score_filter,
        updated_at: new Date()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar template:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar template de mensagem automatizada',
        error: error.message
      });
    }

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error: any) {
    console.error('Erro ao processar solicitação:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

/**
 * Ativa ou desativa um template de mensagem automatizada
 */
export const toggleAutomatedMessageTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { active } = req.body;

    if (active === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Campo active não fornecido'
      });
    }

    // Atualizar status do template
    const { data, error } = await supabase
      .from('automated_message_templates')
      .update({
        active,
        updated_at: new Date()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar status do template:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar status do template',
        error: error.message
      });
    }

    if (\!data) {
      return res.status(404).json({
        success: false,
        message: 'Template não encontrado'
      });
    }

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error: any) {
    console.error('Erro ao processar solicitação:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

/**
 * Remove um template de mensagem automatizada
 */
export const deleteAutomatedMessageTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Remover template
    const { error } = await supabase
      .from('automated_message_templates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao remover template:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao remover template de mensagem automatizada',
        error: error.message
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Template removido com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao processar solicitação:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

/**
 * Processa um evento e envia mensagens automatizadas quando aplicável
 */
export const processEvent = async (req: Request, res: Response) => {
  try {
    const { event_type, lead_id, data } = req.body;

    if (\!event_type || \!lead_id) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios não fornecidos'
      });
    }

    // Processar evento e enviar mensagens automatizadas
    const result = await eventProcessingService.processEvent(event_type, lead_id, data);

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Erro ao processar evento:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao processar evento',
      error: error.message
    });
  }
};

/**
 * Testa a geração de mensagem para um template específico
 */
export const testAutomatedMessage = async (req: Request, res: Response) => {
  try {
    const { lead_id, template_id } = req.body;

    if (\!lead_id || \!template_id) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios não fornecidos'
      });
    }

    // Buscar o template
    const { data: template, error: templateError } = await supabase
      .from('automated_message_templates')
      .select('*')
      .eq('id', template_id)
      .single();

    if (templateError || \!template) {
      return res.status(404).json({
        success: false,
        message: 'Template não encontrado'
      });
    }

    // Buscar informações do lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select(`
        *,
        lead_sentiment_analysis(*)
      `)
      .eq('id', lead_id)
      .single();

    if (leadError || \!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead não encontrado'
      });
    }

    // Gerar mensagem
    const message = await aiIntegrationService.generateLeadMessage(lead, template);

    return res.status(200).json({
      success: true,
      data: {
        message,
        template,
        lead
      }
    });
  } catch (error: any) {
    console.error('Erro ao gerar mensagem de teste:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao gerar mensagem de teste',
      error: error.message
    });
  }
};
EOF < /dev/null