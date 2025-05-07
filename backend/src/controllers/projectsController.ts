import { Request, Response } from 'express';
import { Project, ProjectCreateRequest, ProjectUpdateRequest } from '../interfaces';
import { executeQuery, insertData, updateData, QueryFilter } from '../utils/dbUtils';
import { HttpStatus, sendError, sendSuccess } from '../utils/responseUtils';

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Listar todos os projetos
 *     description: Retorna a lista de projetos do usuário autenticado com filtros opcionais
 *     tags: [projects]
 *     security:
 *       - bearerAuth: []
 *       - apiKeyAuth: []
 *       - apiKeyQuery: []
 *     parameters:
 *       - in: query
 *         name: company_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID da empresa para filtrar projetos (opcional)
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Status de ativação do projeto (opcional)
 *     responses:
 *       200:
 *         description: Lista de projetos
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
 *                     projects:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Project'
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
export async function getProjects(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const companyId = req.query.company_id as string;
    const isActive = req.query.is_active === 'true';
    
    // Build filters
    const filters: QueryFilter[] = [
      { column: 'user_id', operator: 'eq', value: userId }
    ];

    // Add company ID filter if provided
    if (companyId) {
      filters.push({ column: 'company_id', operator: 'eq', value: companyId });
    }

    // Add active status filter if provided
    if (req.query.is_active !== undefined) {
      filters.push({ column: 'is_active', operator: 'eq', value: isActive });
    }

    // Query database
    const projects = await executeQuery<Project>({
      table: 'projects',
      select: '*',
      filters,
      order: { created_at: 'desc' }
    });

    sendSuccess(res, { projects });
  } catch (error) {
    console.error('Error getting projects:', error);
    sendError(res, error, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Obter projeto por ID
 *     description: Retorna os detalhes de um projeto específico
 *     tags: [projects]
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
 *         description: ID do projeto
 *     responses:
 *       200:
 *         description: Detalhes do projeto
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
 *                     project:
 *                       $ref: '#/components/schemas/Project'
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
 *         description: Projeto não encontrado
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
export async function getProjectById(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const projectId = req.params.id;

    if (!projectId) {
      sendError(res, 'Project ID is required', HttpStatus.BAD_REQUEST);
      return;
    }

    // Query database for specific project
    const projects = await executeQuery<Project>({
      table: 'projects',
      select: '*',
      filters: [
        { column: 'id', operator: 'eq', value: projectId },
        { column: 'user_id', operator: 'eq', value: userId }
      ]
    });

    if (projects.length === 0) {
      sendError(res, 'Project not found', HttpStatus.NOT_FOUND);
      return;
    }

    sendSuccess(res, { project: projects[0] });
  } catch (error) {
    console.error('Error getting project:', error);
    sendError(res, error, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Criar novo projeto
 *     description: Cria um novo projeto para o usuário autenticado
 *     tags: [projects]
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
 *               - company_id
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Campanha de Verão"
 *               company_id:
 *                 type: string
 *                 format: uuid
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               description:
 *                 type: string
 *                 example: "Campanha de marketing para o verão de 2025"
 *               status:
 *                 type: string
 *                 enum: ['em_planejamento', 'em_andamento', 'pausado', 'concluido', 'cancelado']
 *                 example: "em_planejamento"
 *               campaign_start_date:
 *                 type: string
 *                 format: date
 *                 example: "2025-06-01"
 *               campaign_end_date:
 *                 type: string
 *                 format: date
 *                 example: "2025-08-31"
 *               start_date:
 *                 type: string
 *                 format: date
 *                 description: Campo legado - use campaign_start_date
 *                 example: "2025-06-01"
 *               end_date:
 *                 type: string
 *                 format: date
 *                 description: Campo legado - use campaign_end_date
 *                 example: "2025-08-31"
 *     responses:
 *       201:
 *         description: Projeto criado com sucesso
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
 *                     project:
 *                       $ref: '#/components/schemas/Project'
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
export async function createProject(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const projectData: ProjectCreateRequest = req.body;

    // Validate request
    if (!projectData.name || !projectData.name.trim()) {
      sendError(res, 'Project name is required', HttpStatus.BAD_REQUEST);
      return;
    }

    if (!projectData.company_id) {
      sendError(res, 'Company ID is required', HttpStatus.BAD_REQUEST);
      return;
    }

    // Check if company exists and belongs to user
    const companies = await executeQuery({
      table: 'companies',
      select: 'id',
      filters: [
        { column: 'id', operator: 'eq', value: projectData.company_id },
        { column: 'user_id', operator: 'eq', value: userId }
      ]
    });

    if (companies.length === 0) {
      sendError(res, 'Company not found or unauthorized', HttpStatus.NOT_FOUND);
      return;
    }

    // Create project data
    const project: Project = {
      user_id: userId!,
      company_id: projectData.company_id,
      name: projectData.name.trim(),
      description: projectData.description,
      status: projectData.status || 'em_planejamento',
      views_count: 0,
      is_active: true
    };
    
    // Handle date fields and backwards compatibility
    if (projectData.campaign_start_date) {
      project.campaign_start_date = projectData.campaign_start_date;
    } else if (projectData.start_date) {
      project.campaign_start_date = projectData.start_date;
    }
    
    if (projectData.campaign_end_date) {
      project.campaign_end_date = projectData.campaign_end_date;
    } else if (projectData.end_date) {
      project.campaign_end_date = projectData.end_date;
    }

    // Insert into database
    const newProject = await insertData<Project>('projects', project);

    sendSuccess(res, { project: newProject }, HttpStatus.CREATED);
  } catch (error) {
    console.error('Error creating project:', error);
    sendError(res, error, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * @swagger
 * /api/projects/{id}:
 *   put:
 *     summary: Atualizar projeto
 *     description: Atualiza os dados de um projeto existente
 *     tags: [projects]
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
 *         description: ID do projeto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Campanha de Verão Atualizada"
 *               description:
 *                 type: string
 *                 example: "Campanha de marketing para o verão de 2025 atualizada"
 *               status:
 *                 type: string
 *                 enum: ['em_planejamento', 'em_andamento', 'pausado', 'concluido', 'cancelado']
 *                 example: "em_andamento"
 *               campaign_start_date:
 *                 type: string
 *                 format: date
 *                 example: "2025-06-15"
 *               campaign_end_date:
 *                 type: string
 *                 format: date
 *                 example: "2025-09-15"
 *               start_date:
 *                 type: string
 *                 format: date
 *                 description: Campo legado - use campaign_start_date
 *                 example: "2025-06-15"
 *               end_date:
 *                 type: string
 *                 format: date
 *                 description: Campo legado - use campaign_end_date
 *                 example: "2025-09-15"
 *               is_active:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Projeto atualizado com sucesso
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
 *                     project:
 *                       $ref: '#/components/schemas/Project'
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
 *         description: Projeto não encontrado
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
export async function updateProject(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const projectId = req.params.id;
    const projectUpdateData: ProjectUpdateRequest = req.body;

    if (!projectId) {
      sendError(res, 'Project ID is required', HttpStatus.BAD_REQUEST);
      return;
    }

    // Check if project exists and belongs to user
    const projects = await executeQuery<Project>({
      table: 'projects',
      select: 'id',
      filters: [
        { column: 'id', operator: 'eq', value: projectId },
        { column: 'user_id', operator: 'eq', value: userId }
      ]
    });

    if (projects.length === 0) {
      sendError(res, 'Project not found or unauthorized', HttpStatus.NOT_FOUND);
      return;
    }

    // Prepare update data
    const updates: Partial<Project> = {
      updated_at: new Date().toISOString()
    };

    // Add fields if provided
    if (projectUpdateData.name) {
      updates.name = projectUpdateData.name.trim();
    }

    if (projectUpdateData.description !== undefined) {
      updates.description = projectUpdateData.description;
    }

    if (projectUpdateData.status) {
      updates.status = projectUpdateData.status;
    }

    // Handle both campaign_start_date and start_date (for backward compatibility)
    if (projectUpdateData.campaign_start_date) {
      updates.campaign_start_date = projectUpdateData.campaign_start_date;
    } else if (projectUpdateData.start_date) {
      updates.campaign_start_date = projectUpdateData.start_date;
    }

    // Handle both campaign_end_date and end_date (for backward compatibility)
    if (projectUpdateData.campaign_end_date) {
      updates.campaign_end_date = projectUpdateData.campaign_end_date;
    } else if (projectUpdateData.end_date) {
      updates.campaign_end_date = projectUpdateData.end_date;
    }

    if (typeof projectUpdateData.is_active === 'boolean') {
      updates.is_active = projectUpdateData.is_active;
    }

    // Update project
    const updatedProjects = await updateData<Project>(
      'projects',
      [{ column: 'id', operator: 'eq', value: projectId }],
      updates
    );

    if (updatedProjects.length === 0) {
      sendError(res, 'Failed to update project', HttpStatus.INTERNAL_SERVER_ERROR);
      return;
    }

    sendSuccess(res, { project: updatedProjects[0] });
  } catch (error) {
    console.error('Error updating project:', error);
    sendError(res, error, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     summary: Desativar projeto
 *     description: Desativa um projeto existente (soft delete) e altera o status para cancelado
 *     tags: [projects]
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
 *         description: ID do projeto
 *     responses:
 *       200:
 *         description: Projeto desativado com sucesso
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
 *                       example: "Projeto desativado com sucesso"
 *                 statusCode:
 *                   type: number
 *                   example: 200
 *       400:
 *         description: ID do projeto não fornecido
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
 *         description: Projeto não encontrado
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
export async function deactivateProject(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const projectId = req.params.id;

    if (!projectId) {
      sendError(res, 'Project ID is required', HttpStatus.BAD_REQUEST);
      return;
    }

    // Check if project exists and belongs to user
    const projects = await executeQuery<Project>({
      table: 'projects',
      select: 'id',
      filters: [
        { column: 'id', operator: 'eq', value: projectId },
        { column: 'user_id', operator: 'eq', value: userId }
      ]
    });

    if (projects.length === 0) {
      sendError(res, 'Project not found or unauthorized', HttpStatus.NOT_FOUND);
      return;
    }

    // Update project to inactive
    const updates: Partial<Project> = {
      is_active: false,
      status: 'cancelled',
      updated_at: new Date().toISOString()
    };

    await updateData<Project>(
      'projects',
      [{ column: 'id', operator: 'eq', value: projectId }],
      updates
    );

    sendSuccess(res, {
      success: true,
      message: 'Project deactivated successfully'
    });
  } catch (error) {
    console.error('Error deactivating project:', error);
    sendError(res, error, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}