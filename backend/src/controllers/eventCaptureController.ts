import { Request, Response } from 'express';
import { sendError, sendSuccess } from '../utils/responseUtils';
import { HttpStatus } from '../utils/responseUtils';
import { createLeadEvent } from '../services/leadEventsService';
import { getSupabaseAdmin } from '../services/supabaseService';

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Capture a lead event
 *     description: |
 *       Capture an event and automatically associate it with the correct lead using phone or email.
 *       This API allows capturing events from various sources like website, WhatsApp, email, etc.
 *     tags: [events]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 type: string
 *                 description: Phone number to identify the lead (either phone or email is required)
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email to identify the lead (either phone or email is required)
 *               event_type:
 *                 type: string
 *                 description: Type of event (e.g., whatsapp_message, form_submit, email_click)
 *                 required: true
 *               event_text:
 *                 type: string
 *                 description: Text or message content of the event
 *               origin:
 *                 type: string
 *                 description: Origin of the event (e.g., whatsapp, landing_page, email)
 *               additional_data:
 *                 type: object
 *                 description: Any additional data to store with the event in JSON format
 *             required:
 *               - event_type
 *     responses:
 *       200:
 *         description: Event captured successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: Event captured successfully
 *                     lead_id:
 *                       type: string
 *                       format: uuid
 *                     event_id:
 *                       type: string
 *                       format: uuid
 *       400:
 *         description: Bad request - missing required fields
 *       404:
 *         description: No lead found with the provided phone or email
 *       500:
 *         description: Server error
 */
export async function captureEvent(req: Request, res: Response): Promise<void> {
  try {
    const { 
      phone,           // Telefone para identificar o lead
      email,           // Email para identificar o lead (alternativa)
      event_type,      // Tipo do evento (ex: whatsapp_message, form_submit, email_click)
      event_text,      // Texto ou mensagem do evento
      origin,          // Origem do evento (ex: whatsapp, landing_page, email)
      additional_data  // Dados adicionais em formato de objeto (opcional)
    } = req.body;
    
    // Validar entradas obrigatórias
    if (!event_type) {
      sendError(res, 'Event type is required', HttpStatus.BAD_REQUEST);
      return;
    }
    
    if (!phone && !email) {
      sendError(res, 'Either phone or email is required to identify the lead', HttpStatus.BAD_REQUEST);
      return;
    }
    
    // Buscar o lead pelo telefone ou email
    let leadId: string | null = null;
    
    // Tentar encontrar pelo telefone primeiro (se fornecido)
    if (phone) {
      leadId = await findLeadByPhone(phone);
    }
    
    // Se não encontrar pelo telefone ou se o telefone não for fornecido, tentar pelo email
    if (!leadId && email) {
      leadId = await findLeadByEmail(email);
    }
    
    // Se não encontrar o lead, retornar erro
    if (!leadId) {
      sendError(res, 'No lead found with the provided phone or email', HttpStatus.NOT_FOUND);
      return;
    }
    
    // Preparar os dados do evento
    const eventData = {
      text: event_text || '',
      ...additional_data
    };
    
    // Registrar o evento
    const event = await createLeadEvent(leadId, event_type, eventData, origin);
    
    if (event) {
      sendSuccess(res, {
        success: true,
        message: 'Event captured successfully',
        lead_id: leadId,
        event_id: event.id
      });
    } else {
      sendError(res, 'Failed to register event', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  } catch (error) {
    console.error('Error capturing event:', error);
    sendError(res, 'Error processing event capture', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Find a lead by phone number using multiple formats
 */
async function findLeadByPhone(phone: string): Promise<string | null> {
  try {
    // Normalizar o número de telefone (remover caracteres não numéricos)
    const normalized = phone.replace(/\D/g, '');
    
    if (normalized.length < 8) {
      console.log(`Phone number ${phone} is too short after normalization`);
      return null;
    }
    
    const supabase = getSupabaseAdmin();
    
    // Criar várias opções de formato para busca
    const searchFormats = [
      `%${normalized}%`,                                  // Número completo em qualquer parte
      `%${normalized.substring(normalized.length - 8)}%`, // Últimos 8 dígitos (sem DDD)
      `%${normalized.substring(normalized.length - 9)}%`, // Últimos 9 dígitos (com DDD)
      // Variações com traços e parênteses para garantir compatibilidade
      `%${formatted(normalized)}%`,                       // Formato (XX) XXXXX-XXXX
      `%${normalized.replace(/(\d{2})(\d{4,5})(\d{4})/, '$1 $2-$3')}%`, // XX XXXXX-XXXX
      `%${normalized.replace(/(\d{2})(\d{5})(\d{4})/, '$1$2$3')}%`      // XXXXXXXXXXX
    ];
    
    console.log('Searching for phone with formats:', searchFormats);
    
    // Buscar utilizando o cliente Supabase
    let { data: leads, error } = await supabase
      .from('leads')
      .select('id')
      .or(
        searchFormats.map(format => `phone.ilike.${format}`).join(',')
      )
      .limit(1);
      
    if (error) {
      console.error('Supabase error finding lead by phone:', error);
      return null;
    }
    
    if (leads && leads.length > 0) {
      console.log(`Found lead by phone: ${leads[0].id}`);
      return leads[0].id;
    }
    
    console.log(`No lead found with phone: ${phone}`);
    return null;
  } catch (error) {
    console.error('Error finding lead by phone:', error);
    return null;
  }
}

/**
 * Find a lead by email
 */
async function findLeadByEmail(email: string): Promise<string | null> {
  try {
    const supabase = getSupabaseAdmin();
    
    console.log(`Searching for lead with email: ${email}`);
    
    // Buscar utilizando o cliente Supabase
    let { data: leads, error } = await supabase
      .from('leads')
      .select('id')
      .ilike('email', email)
      .limit(1);
      
    if (error) {
      console.error('Supabase error finding lead by email:', error);
      return null;
    }
    
    if (leads && leads.length > 0) {
      console.log(`Found lead by email: ${leads[0].id}`);
      return leads[0].id;
    }
    
    console.log(`No lead found with email: ${email}`);
    return null;
  } catch (error) {
    console.error('Error finding lead by email:', error);
    return null;
  }
}

/**
 * Format phone number to standard format for comparison
 */
function formatted(phone: string): string {
  // Tentar formatar para (XX) XXXXX-XXXX se tiver 11 dígitos (com DDD)
  if (phone.length >= 11) {
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  // Tentar formatar para (XX) XXXX-XXXX se tiver 10 dígitos (com DDD)
  else if (phone.length >= 10) {
    return phone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  // Formatar como XXXX-XXXX se tiver 8 dígitos (sem DDD)
  else if (phone.length >= 8) {
    return phone.replace(/(\d{4})(\d{4})/, '$1-$2');
  }
  return phone;
}