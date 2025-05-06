import { Request, Response } from 'express';
import { getSupabaseAdmin } from '../services/supabaseService';
import { HttpStatus, sendError, sendSuccess } from '../utils/responseUtils';
import crypto from 'crypto';

/**
 * @swagger
 * tags:
 *   name: api-keys
 *   description: Gerenciamento de chaves de API
 */

/**
 * @swagger
 * /api/api-keys:
 *   get:
 *     summary: Lista todas as chaves de API do usuário
 *     tags: [api-keys]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de chaves de API
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
 *                     api_keys:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ApiKey'
 *                 statusCode:
 *                   type: number
 *                   example: 200
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export async function getApiKeys(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user?.id) {
      sendError(res, 'Usuário não autenticado', HttpStatus.UNAUTHORIZED);
      return;
    }

    const supabase = getSupabaseAdmin();
    
    // Get the user's API keys, excluding secret_hash from the result
    const { data, error } = await supabase
      .from('api_keys')
      .select('id, name, key_value, permissions, rate_limit, is_active, created_at, updated_at, expires_at, last_used_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar API keys:', error.message);
      sendError(res, error.message, HttpStatus.INTERNAL_SERVER_ERROR);
      return;
    }

    sendSuccess(res, { api_keys: data });
  } catch (error) {
    console.error('Erro ao buscar API keys:', error);
    sendError(res, 'Falha ao buscar API keys', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * @swagger
 * /api/api-keys:
 *   post:
 *     summary: Cria uma nova chave de API
 *     tags: [api-keys]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApiKeyInput'
 *     responses:
 *       201:
 *         description: Chave de API criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiKeyCreationResponse'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export async function createApiKey(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user?.id) {
      sendError(res, 'Usuário não autenticado', HttpStatus.UNAUTHORIZED);
      return;
    }

    const { name, permissions, rate_limit, expires_at } = req.body;

    if (!name) {
      sendError(res, 'Nome da API key é obrigatório', HttpStatus.BAD_REQUEST);
      return;
    }

    // Generate API key and secret
    const keyValue = 'api_' + crypto.randomBytes(16).toString('hex');
    const apiSecret = 'secret_' + crypto.randomBytes(32).toString('hex');
    
    // Hash the secret before storing it
    // In a production environment, use a proper password hashing algorithm like bcrypt
    const secretHash = crypto.createHash('sha256').update(apiSecret).digest('hex');

    const supabase = getSupabaseAdmin();
    
    // Insert new API key
    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: req.user.id,
        name,
        key_value: keyValue,
        secret_hash: secretHash,
        permissions: permissions || [],
        rate_limit: rate_limit || 100,
        expires_at: expires_at || null,
        is_active: true
      })
      .select('id, name, key_value, permissions, rate_limit, is_active, created_at, updated_at, expires_at')
      .single();

    if (error) {
      console.error('Erro ao criar API key:', error.message);
      sendError(res, error.message, HttpStatus.INTERNAL_SERVER_ERROR);
      return;
    }

    // Return the newly created API key along with the secret
    // WARNING: The secret will only be shown once and cannot be retrieved later
    sendSuccess(res, {
      api_key: data,
      secret: apiSecret,
      warning: 'O segredo (secret) não será exibido novamente. Salve-o em um local seguro.'
    }, HttpStatus.CREATED);
  } catch (error) {
    console.error('Erro ao criar API key:', error);
    sendError(res, 'Falha ao criar API key', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * @swagger
 * /api/api-keys/{id}:
 *   put:
 *     summary: Atualiza uma chave de API existente
 *     tags: [api-keys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da chave de API
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ApiKeyUpdateInput'
 *     responses:
 *       200:
 *         description: Chave de API atualizada com sucesso
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
 *                     api_key:
 *                       $ref: '#/components/schemas/ApiKey'
 *                 statusCode:
 *                   type: number
 *                   example: 200
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Chave de API não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export async function updateApiKey(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user?.id) {
      sendError(res, 'Usuário não autenticado', HttpStatus.UNAUTHORIZED);
      return;
    }

    const { id } = req.params;
    const { name, permissions, rate_limit, expires_at, is_active } = req.body;

    if (!id) {
      sendError(res, 'ID da API key é obrigatório', HttpStatus.BAD_REQUEST);
      return;
    }

    // Prepare update data
    const updateData: { [key: string]: any } = {};
    if (name !== undefined) updateData.name = name;
    if (permissions !== undefined) updateData.permissions = permissions;
    if (rate_limit !== undefined) updateData.rate_limit = rate_limit;
    if (expires_at !== undefined) updateData.expires_at = expires_at;
    if (is_active !== undefined) updateData.is_active = is_active;
    updateData.updated_at = new Date().toISOString();

    if (Object.keys(updateData).length === 0) {
      sendError(res, 'Nenhum dado para atualizar', HttpStatus.BAD_REQUEST);
      return;
    }

    const supabase = getSupabaseAdmin();
    
    // Update API key
    const { data, error } = await supabase
      .from('api_keys')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', req.user.id) // Ensure user owns this API key
      .select('id, name, key_value, permissions, rate_limit, is_active, created_at, updated_at, expires_at, last_used_at')
      .single();

    if (error) {
      console.error('Erro ao atualizar API key:', error.message);
      sendError(res, error.message, HttpStatus.INTERNAL_SERVER_ERROR);
      return;
    }

    if (!data) {
      sendError(res, 'API key não encontrada ou não pertence ao usuário', HttpStatus.NOT_FOUND);
      return;
    }

    sendSuccess(res, { api_key: data });
  } catch (error) {
    console.error('Erro ao atualizar API key:', error);
    sendError(res, 'Falha ao atualizar API key', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * @swagger
 * /api/api-keys/{id}/revoke:
 *   put:
 *     summary: Revoga (desativa) uma chave de API existente
 *     tags: [api-keys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da chave de API
 *     responses:
 *       200:
 *         description: Chave de API revogada com sucesso
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
 *                       example: API key revogada com sucesso
 *                 statusCode:
 *                   type: number
 *                   example: 200
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Chave de API não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export async function revokeApiKey(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user?.id) {
      sendError(res, 'Usuário não autenticado', HttpStatus.UNAUTHORIZED);
      return;
    }

    const { id } = req.params;

    if (!id) {
      sendError(res, 'ID da API key é obrigatório', HttpStatus.BAD_REQUEST);
      return;
    }

    const supabase = getSupabaseAdmin();
    
    // Deactivate API key (soft delete)
    const { data, error } = await supabase
      .from('api_keys')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', req.user.id) // Ensure user owns this API key
      .select('id')
      .single();

    if (error) {
      console.error('Erro ao revogar API key:', error.message);
      sendError(res, error.message, HttpStatus.INTERNAL_SERVER_ERROR);
      return;
    }

    if (!data) {
      sendError(res, 'API key não encontrada ou não pertence ao usuário', HttpStatus.NOT_FOUND);
      return;
    }

    sendSuccess(res, { message: 'API key revogada com sucesso' });
  } catch (error) {
    console.error('Erro ao revogar API key:', error);
    sendError(res, 'Falha ao revogar API key', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * @swagger
 * /api/api-keys/{id}:
 *   delete:
 *     summary: Exclui permanentemente uma chave de API
 *     tags: [api-keys]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da chave de API
 *     responses:
 *       200:
 *         description: Chave de API excluída com sucesso
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
 *                       example: API key excluída com sucesso
 *                 statusCode:
 *                   type: number
 *                   example: 200
 *       401:
 *         description: Não autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Chave de API não encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export async function deleteApiKey(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user?.id) {
      sendError(res, 'Usuário não autenticado', HttpStatus.UNAUTHORIZED);
      return;
    }

    const { id } = req.params;

    if (!id) {
      sendError(res, 'ID da API key é obrigatório', HttpStatus.BAD_REQUEST);
      return;
    }

    const supabase = getSupabaseAdmin();
    
    // Delete API key permanently
    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id); // Ensure user owns this API key

    if (error) {
      console.error('Erro ao excluir API key:', error.message);
      sendError(res, error.message, HttpStatus.INTERNAL_SERVER_ERROR);
      return;
    }

    sendSuccess(res, { message: 'API key excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir API key:', error);
    sendError(res, 'Falha ao excluir API key', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}