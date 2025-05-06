import { ApiResponse } from '../interfaces';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9032/api';

/**
 * API client for making requests to the backend
 */
export class ApiClient {
  private token: string | null = null;

  /**
   * Set the authentication token
   */
  setToken(token: string) {
    this.token = token;
    
    // Store token in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  /**
   * Get the authentication token
   */
  getToken(): string | null {
    // Try to get from instance, then from localStorage
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  /**
   * Clear the authentication token
   */
  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  /**
   * Make a GET request
   */
  async get<T>(path: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const url = new URL(`${API_URL}${path}`);
    
    // Add query parameters
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.getHeaders(),
    });
    
    return this.handleResponse<T>(response);
  }

  /**
   * Make a POST request
   */
  async post<T>(path: string, data?: any): Promise<ApiResponse<T>> {
    const response = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });
    
    return this.handleResponse<T>(response);
  }

  /**
   * Make a PUT request
   */
  async put<T>(path: string, data?: any): Promise<ApiResponse<T>> {
    const response = await fetch(`${API_URL}${path}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });
    
    return this.handleResponse<T>(response);
  }

  /**
   * Make a DELETE request
   */
  async delete<T>(path: string): Promise<ApiResponse<T>> {
    const response = await fetch(`${API_URL}${path}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    
    return this.handleResponse<T>(response);
  }

  /**
   * Get headers for API requests
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  /**
   * Handle API response
   */
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const data = await response.json();
    
    // If the response is not in the expected format, normalize it
    if (data.success === undefined) {
      return {
        success: response.ok,
        data: response.ok ? data : undefined,
        error: response.ok ? undefined : data.message || 'Unknown error',
        statusCode: response.status,
      };
    }
    
    return data;
  }
}

// Create a singleton instance
export const apiClient = new ApiClient();

export default apiClient;