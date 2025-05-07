import { Request, Response } from 'express';
import { HttpStatus, sendError, sendSuccess } from '../utils/responseUtils';
import { mockProjects, getProjectById } from '../utils/mockData';

/**
 * Get all projects (with optional filters)
 */
export async function getProjects(req: Request, res: Response): Promise<void> {
  try {
    // Return mock projects
    sendSuccess(res, { projects: mockProjects });
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
    const projectId = req.params.id;
    const project = getProjectById(projectId);
    
    if (!project) {
      sendError(res, 'Project not found', HttpStatus.NOT_FOUND);
      return;
    }
    
    sendSuccess(res, { project });
  } catch (error) {
    console.error('Error getting project by ID:', error);
    sendError(res, error, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Create a new project
 */
export async function createProject(req: Request, res: Response): Promise<void> {
  try {
    // For mock purposes, just return the submitted data with an ID
    const newProject = {
      id: 'new-project-id',
      ...req.body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    sendSuccess(res, { 
      message: 'Project created successfully',
      project: newProject
    });
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
    const projectId = req.params.id;
    const projectData = req.body;
    
    // Check if project exists
    const existingProject = getProjectById(projectId);
    if (!existingProject) {
      sendError(res, 'Project not found', HttpStatus.NOT_FOUND);
      return;
    }
    
    // For mock purposes, just return the updated data
    const updatedProject = {
      ...existingProject,
      ...projectData,
      updated_at: new Date().toISOString()
    };
    
    sendSuccess(res, { 
      message: 'Project updated successfully',
      project: updatedProject
    });
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
    const projectId = req.params.id;
    
    // Check if project exists
    const existingProject = getProjectById(projectId);
    if (!existingProject) {
      sendError(res, 'Project not found', HttpStatus.NOT_FOUND);
      return;
    }
    
    sendSuccess(res, { 
      message: 'Project deactivated successfully' 
    });
  } catch (error) {
    console.error('Error deactivating project:', error);
    sendError(res, error, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}