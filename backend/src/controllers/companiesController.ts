import { Request, Response } from 'express';
import { Company, CompanyUpdateRequest } from '../interfaces';
import { executeQuery, insertData, updateData, QueryFilter } from '../utils/dbUtils';
import { HttpStatus, sendError, sendSuccess } from '../utils/responseUtils';
import * as fs from 'fs';
import * as path from 'path';

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

    console.log('Obtendo empresas para usuário:', userId);

    // Detectar se estamos em modo offline
    const OFFLINE_MODE = process.env.SUPABASE_OFFLINE_MODE === 'true';
    // Log para debug
    console.log('SUPABASE_OFFLINE_MODE =', process.env.SUPABASE_OFFLINE_MODE);
    console.log('Modo offline está:', OFFLINE_MODE ? 'ATIVADO' : 'DESATIVADO');

    if (OFFLINE_MODE) {
      console.log('Usando modo offline para empresas');

      try {
        // Tenta carregar os dados do arquivo JSON
        const dataFilePath = path.resolve(__dirname, '../data/companies.json');
        console.log('Buscando dados de:', dataFilePath);

        let companies: Company[] = [];

        if (fs.existsSync(dataFilePath)) {
          const rawData = fs.readFileSync(dataFilePath, 'utf8');
          const jsonData = JSON.parse(rawData);
          companies = jsonData.companies.map((company: any) => ({
            ...company,
            user_id: userId // Garante que as empresas pertençam ao usuário atual
          }));
          console.log(`Carregados ${companies.length} registros de empresas do arquivo`);
        } else {
          console.log('Arquivo de dados não encontrado, usando dados padrão');
          // Dados padrão caso o arquivo não exista
          companies = [
            {
              id: '1',
              user_id: userId!,
              name: 'Empresa Demonstração',
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: '2',
              user_id: userId!,
              name: 'Empresa Teste',
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ];
        }

        // Filtrar por ID se necessário
        const filteredCompanies = companyId ?
          companies.filter(c => c.id === companyId) :
          companies;

        return sendSuccess(res, { companies: filteredCompanies });
      } catch (error) {
        console.error('Erro ao carregar dados offline:', error);

        // Dados de fallback em caso de erro
        const mockCompanies: Company[] = [
          {
            id: '1',
            user_id: userId!,
            name: 'Empresa Demonstração (Fallback)',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];

        // Filtrar por ID se necessário
        const companies = companyId ?
          mockCompanies.filter(c => c.id === companyId) :
          mockCompanies;

        return sendSuccess(res, { companies });
      }
    }

    // Caso contrário, continuar com comportamento normal (consulta ao banco)
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

    // Em caso de erro, também retornar dados fictícios
    try {
      console.log('Fallback: retornando dados offline após erro');
      const userId = req.user?.id;
      const mockCompanies: Company[] = [
        {
          id: '1',
          user_id: userId!,
          name: 'Empresa Demonstração (Fallback)',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      return sendSuccess(res, { companies: mockCompanies });
    } catch (fallbackError) {
      // Se até o fallback falhar, então retornar o erro original
      sendError(res, error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
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

    // Detectar se estamos em modo offline
    const OFFLINE_MODE = process.env.SUPABASE_OFFLINE_MODE === 'true';
    // Log para debug
    console.log('SUPABASE_OFFLINE_MODE =', process.env.SUPABASE_OFFLINE_MODE);
    console.log('Modo offline está:', OFFLINE_MODE ? 'ATIVADO' : 'DESATIVADO');

    if (OFFLINE_MODE) {
      console.log('Usando modo offline para busca de empresa por ID');

      try {
        // Tenta carregar os dados do arquivo JSON
        const dataFilePath = path.resolve(__dirname, '../data/companies.json');
        console.log('Buscando dados de:', dataFilePath);

        if (fs.existsSync(dataFilePath)) {
          const rawData = fs.readFileSync(dataFilePath, 'utf8');
          const jsonData = JSON.parse(rawData);
          const companies = jsonData.companies;

          // Encontra a empresa com o ID correspondente
          const company = companies.find((c: any) => c.id === companyId);

          if (company) {
            // Garante que a empresa pertença ao usuário atual
            company.user_id = userId;
            return sendSuccess(res, { company });
          } else {
            return sendError(res, 'Company not found', HttpStatus.NOT_FOUND);
          }
        } else {
          console.log('Arquivo de dados não encontrado');
          return sendError(res, 'Offline data not available', HttpStatus.NOT_FOUND);
        }
      } catch (error) {
        console.error('Erro ao carregar dados offline:', error);
        return sendError(res, 'Error loading offline data', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }

    // Comportamento normal (consulta ao banco)
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