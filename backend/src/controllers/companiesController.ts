import { Request, Response } from 'express';
import { Company, CompanyUpdateRequest } from '../interfaces';
import { executeQuery, insertData, updateData, QueryFilter } from '../utils/dbUtils';
import { HttpStatus, sendError, sendSuccess } from '../utils/responseUtils';

/**
 * @swagger
 * /api/companies:
 *   get:
 *     summary: Listar todas as empresas
 *     description: Retorna a lista de empresas do usuário autenticado
 *     tags: [companies]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *       - apiKeyQuery: []
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da empresa (opcional)
 *     responses:
 *       200:
 *         description: Lista de empresas
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
 *                     companies:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Company'
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
export async function getCompanies(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const companyId = req.query.id as string;

    // Build filters
    const filters: QueryFilter[] = [
      { column: 'user_id', operator: 'eq', value: userId }
    ];

    // Add company ID filter if provided
    if (companyId) {
      filters.push({ column: 'id', operator: 'eq', value: companyId });
    }

    // Query database
    const companies = await executeQuery<Company>({
      table: 'companies',
      select: '*',
      filters,
      order: { created_at: 'desc' }
    });

    sendSuccess(res, { companies });
  } catch (error) {
    console.error('Error getting companies:', error);
    sendError(res, error, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * @swagger
 * /api/companies/{id}:
 *   get:
 *     summary: Obter empresa por ID
 *     description: Retorna os detalhes de uma empresa específica
 *     tags: [companies]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *       - apiKeyQuery: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da empresa
 *     responses:
 *       200:
 *         description: Detalhes da empresa
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
 *                     company:
 *                       $ref: '#/components/schemas/Company'
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
 *         description: Empresa não encontrada
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
export async function getCompanyById(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const companyId = req.params.id;

    if (!companyId) {
      sendError(res, 'Company ID is required', HttpStatus.BAD_REQUEST);
      return;
    }

    // Query database for specific company
    const companies = await executeQuery<Company>({
      table: 'companies',
      select: '*',
      filters: [
        { column: 'id', operator: 'eq', value: companyId },
        { column: 'user_id', operator: 'eq', value: userId }
      ]
    });

    if (companies.length === 0) {
      sendError(res, 'Company not found', HttpStatus.NOT_FOUND);
      return;
    }

    sendSuccess(res, { company: companies[0] });
  } catch (error) {
    console.error('Error getting company:', error);
    sendError(res, error, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * @swagger
 * /api/companies:
 *   post:
 *     summary: Criar nova empresa
 *     description: Cria uma nova empresa para o usuário autenticado
 *     tags: [companies]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *       - apiKeyQuery: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Minha Empresa"
 *     responses:
 *       201:
 *         description: Empresa criada com sucesso
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
 *                     company:
 *                       $ref: '#/components/schemas/Company'
 *                 statusCode:
 *                   type: number
 *                   example: 201
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
export async function createCompany(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const { name } = req.body;

    if (!name || !name.trim()) {
      sendError(res, 'Company name is required', HttpStatus.BAD_REQUEST);
      return;
    }

    // Create company data
    const companyData: Company = {
      user_id: userId!,
      name: name.trim(),
      is_active: true
    };

    // Insert into database
    const company = await insertData<Company>('companies', companyData);

    sendSuccess(res, { company }, HttpStatus.CREATED);
  } catch (error) {
    console.error('Error creating company:', error);
    sendError(res, error, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * @swagger
 * /api/companies/{id}:
 *   put:
 *     summary: Atualizar empresa
 *     description: Atualiza os dados de uma empresa existente
 *     tags: [companies]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *       - apiKeyQuery: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da empresa
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Minha Empresa Atualizada"
 *               is_active:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Empresa atualizada com sucesso
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
 *                     company:
 *                       $ref: '#/components/schemas/Company'
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
 *         description: Empresa não encontrada
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
export async function updateCompany(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const companyId = req.params.id;
    const updateData: CompanyUpdateRequest = req.body;

    if (!companyId) {
      sendError(res, 'Company ID is required', HttpStatus.BAD_REQUEST);
      return;
    }

    if (!updateData.name || !updateData.name.trim()) {
      sendError(res, 'Company name is required', HttpStatus.BAD_REQUEST);
      return;
    }

    // Check if company exists and belongs to user
    const companies = await executeQuery<Company>({
      table: 'companies',
      select: 'id',
      filters: [
        { column: 'id', operator: 'eq', value: companyId },
        { column: 'user_id', operator: 'eq', value: userId }
      ]
    });

    if (companies.length === 0) {
      sendError(res, 'Company not found or unauthorized', HttpStatus.NOT_FOUND);
      return;
    }

    // Prepare update data
    const updates: Partial<Company> = {
      name: updateData.name.trim(),
      updated_at: new Date().toISOString()
    };

    // Add is_active if provided
    if (typeof updateData.is_active === 'boolean') {
      updates.is_active = updateData.is_active;
    }

    // Update company
    const updatedCompanies = await updateData<Company>(
      'companies',
      [{ column: 'id', operator: 'eq', value: companyId }],
      updates
    );

    if (updatedCompanies.length === 0) {
      sendError(res, 'Failed to update company', HttpStatus.INTERNAL_SERVER_ERROR);
      return;
    }

    sendSuccess(res, { company: updatedCompanies[0] });
  } catch (error) {
    console.error('Error updating company:', error);
    sendError(res, error, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * @swagger
 * /api/companies/{id}:
 *   delete:
 *     summary: Desativar empresa
 *     description: Desativa uma empresa existente (soft delete)
 *     tags: [companies]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *       - apiKeyQuery: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da empresa
 *     responses:
 *       200:
 *         description: Empresa desativada com sucesso
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
 *                       example: "Empresa desativada com sucesso"
 *                 statusCode:
 *                   type: number
 *                   example: 200
 *       400:
 *         description: ID da empresa não fornecido
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
 *         description: Empresa não encontrada
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
export async function deactivateCompany(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const companyId = req.params.id;

    if (!companyId) {
      sendError(res, 'Company ID is required', HttpStatus.BAD_REQUEST);
      return;
    }

    // Check if company exists and belongs to user
    const companies = await executeQuery<Company>({
      table: 'companies',
      select: 'id',
      filters: [
        { column: 'id', operator: 'eq', value: companyId },
        { column: 'user_id', operator: 'eq', value: userId }
      ]
    });

    if (companies.length === 0) {
      sendError(res, 'Company not found or unauthorized', HttpStatus.NOT_FOUND);
      return;
    }

    // Update company to inactive
    const updates: Partial<Company> = {
      is_active: false,
      updated_at: new Date().toISOString()
    };

    await updateData<Company>(
      'companies',
      [{ column: 'id', operator: 'eq', value: companyId }],
      updates
    );

    sendSuccess(res, {
      success: true,
      message: 'Company deactivated successfully'
    });
  } catch (error) {
    console.error('Error deactivating company:', error);
    sendError(res, error, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}