import { ApiResponse, Project, ProjectsResponse, ProjectResponse } from '../interfaces';
import client from './client';

// API base URL for projects
const PROJECTS_API_URL = '/v1/projects';

// Get all projects
const getProjects = async (params?: Record<string, any>): Promise<ApiResponse<ProjectsResponse>> => {
  try {
    const response = await client.get(PROJECTS_API_URL, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching projects:', error);
    return {
      success: false,
      error: 'Failed to fetch projects',
      statusCode: 500
    };
  }
};

// Get a project by ID
const getProject = async (id: string): Promise<ApiResponse<ProjectResponse>> => {
  try {
    const response = await client.get(`${PROJECTS_API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching project ${id}:`, error);
    return {
      success: false,
      error: 'Failed to fetch project',
      statusCode: 500
    };
  }
};

// Create a new project
const createProject = async (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<ProjectResponse>> => {
  try {
    const response = await client.post(PROJECTS_API_URL, project);
    return response.data;
  } catch (error) {
    console.error('Error creating project:', error);
    return {
      success: false,
      error: 'Failed to create project',
      statusCode: 500
    };
  }
};

// Update a project
const updateProject = async (id: string, project: Partial<Project>): Promise<ApiResponse<ProjectResponse>> => {
  try {
    const response = await client.put(`${PROJECTS_API_URL}/${id}`, project);
    return response.data;
  } catch (error) {
    console.error(`Error updating project ${id}:`, error);
    return {
      success: false,
      error: 'Failed to update project',
      statusCode: 500
    };
  }
};

// Delete a project
const deleteProject = async (id: string): Promise<ApiResponse> => {
  try {
    const response = await client.delete(`${PROJECTS_API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting project ${id}:`, error);
    return {
      success: false,
      error: 'Failed to delete project',
      statusCode: 500
    };
  }
};

// Get project stats
const getProjectStats = async (params?: Record<string, any>): Promise<ApiResponse> => {
  try {
    const response = await client.get(`${PROJECTS_API_URL}/stats`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching project stats:', error);
    return {
      success: false,
      error: 'Failed to fetch project stats',
      statusCode: 500
    };
  }
};

const projectsApi = {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getProjectStats
};

export default projectsApi;