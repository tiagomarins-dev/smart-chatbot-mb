import { Request, Response } from 'express';
import { Project, ProjectCreateRequest, ProjectUpdateRequest } from '../interfaces';
import { executeQuery, insertData, updateData, QueryFilter } from '../utils/dbUtils';
import { HttpStatus, sendError, sendSuccess } from '../utils/responseUtils';

/**
 * Get all projects (with optional filters)
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
 * Get project by ID
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
 * Create a new project
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
      status: projectData.status || 'active',
      start_date: projectData.start_date,
      end_date: projectData.end_date,
      views_count: 0,
      is_active: true
    };

    // Insert into database
    const newProject = await insertData<Project>('projects', project);

    sendSuccess(res, { project: newProject }, HttpStatus.CREATED);
  } catch (error) {
    console.error('Error creating project:', error);
    sendError(res, error, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Update project
 */
export async function updateProject(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    const projectId = req.params.id;
    const updateData: ProjectUpdateRequest = req.body;

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
    if (updateData.name) {
      updates.name = updateData.name.trim();
    }

    if (updateData.description !== undefined) {
      updates.description = updateData.description;
    }

    if (updateData.status) {
      updates.status = updateData.status;
    }

    if (updateData.start_date) {
      updates.start_date = updateData.start_date;
    }

    if (updateData.end_date) {
      updates.end_date = updateData.end_date;
    }

    if (typeof updateData.is_active === 'boolean') {
      updates.is_active = updateData.is_active;
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
 * Deactivate project (soft delete)
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