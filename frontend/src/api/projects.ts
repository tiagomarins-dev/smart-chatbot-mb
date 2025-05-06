import apiClient from './client';
import { ApiResponse, Project, ProjectsResponse, ProjectResponse } from '../interfaces';

export const projectsApi = {
  /**
   * Get all projects
   */
  getProjects: async (params?: Record<string, any>): Promise<ApiResponse<ProjectsResponse>> => {
    try {
      return await apiClient.get<ProjectsResponse>('/projects', params);
    } catch (error) {
      console.error('Error fetching projects:', error);
      return {
        success: false,
        error: 'Failed to fetch projects',
        statusCode: 500
      };
    }
  },
  
  /**
   * Get a project by ID
   */
  getProject: async (id: string): Promise<ApiResponse<ProjectResponse>> => {
    try {
      return await apiClient.get<ProjectResponse>(`/projects/${id}`);
    } catch (error) {
      console.error(`Error fetching project ${id}:`, error);
      return {
        success: false,
        error: 'Failed to fetch project',
        statusCode: 500
      };
    }
  },
  
  /**
   * Create a new project
   */
  createProject: async (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<ProjectResponse>> => {
    try {
      return await apiClient.post<ProjectResponse>('/projects', project);
    } catch (error) {
      console.error('Error creating project:', error);
      return {
        success: false,
        error: 'Failed to create project',
        statusCode: 500
      };
    }
  },
  
  /**
   * Update a project
   */
  updateProject: async (id: string, project: Partial<Project>): Promise<ApiResponse<ProjectResponse>> => {
    try {
      return await apiClient.put<ProjectResponse>(`/projects/${id}`, project);
    } catch (error) {
      console.error(`Error updating project ${id}:`, error);
      return {
        success: false,
        error: 'Failed to update project',
        statusCode: 500
      };
    }
  },
  
  /**
   * Delete a project
   */
  deleteProject: async (id: string): Promise<ApiResponse> => {
    try {
      return await apiClient.delete(`/projects/${id}`);
    } catch (error) {
      console.error(`Error deleting project ${id}:`, error);
      return {
        success: false,
        error: 'Failed to delete project',
        statusCode: 500
      };
    }
  },
  
  /**
   * Get project stats
   */
  getProjectStats: async (params?: Record<string, any>): Promise<ApiResponse> => {
    try {
      return await apiClient.get('/projects/stats', params);
    } catch (error) {
      console.error('Error fetching project stats:', error);
      return {
        success: false,
        error: 'Failed to fetch project stats',
        statusCode: 500
      };
    }
  }
};

export default projectsApi;