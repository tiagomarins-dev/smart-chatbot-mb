import apiClient from './client';
import { ApiResponse, AuthResponse, User } from '../interfaces';

export const authApi = {
  /**
   * Login user
   */
  login: async (email: string, password: string): Promise<ApiResponse<AuthResponse>> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', { email, password });
    
    // Store token if login successful
    if (response.success && response.data?.token) {
      apiClient.setToken(response.data.token);
    }
    
    return response;
  },
  
  /**
   * Register a new user
   */
  register: async (email: string, password: string, name: string): Promise<ApiResponse<AuthResponse>> => {
    return await apiClient.post<AuthResponse>('/auth/register', { email, password, name });
  },
  
  /**
   * Verify the current token
   */
  verifyToken: async (): Promise<ApiResponse<{ valid: boolean; user: User }>> => {
    const token = apiClient.getToken();
    
    if (!token) {
      return {
        success: false,
        error: 'No token available',
        statusCode: 401
      };
    }
    
    return await apiClient.post<{ valid: boolean; user: User }>('/auth/verify', { token });
  },
  
  /**
   * Get current user
   */
  getCurrentUser: async (): Promise<ApiResponse<{ user: User }>> => {
    return await apiClient.get<{ user: User }>('/auth/user');
  },
  
  /**
   * Logout user
   */
  logout: (): void => {
    apiClient.clearToken();
  }
};

export default authApi;