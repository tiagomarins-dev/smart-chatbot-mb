import { ApiResponse } from '../interfaces';

// Base path for API calls proxied through Next.js
const API_PREFIX = '/api';

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
    let url = `${API_PREFIX}${path}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const query = searchParams.toString();
      if (query) {
        url += `?${query}`;
      }
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<T>(response);
  }

  /**
   * Make a POST request
   */
  async post<T>(path: string, data?: any): Promise<ApiResponse<T>> {
    const response = await fetch(`${API_PREFIX}${path}`, {
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
    console.log(`PUT request to: ${API_PREFIX}${path}`);
    console.log('Data being sent:', data);
    console.log('JSON data:', data ? JSON.stringify(data) : 'undefined');

    const response = await fetch(`${API_PREFIX}${path}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });
    console.log('Response status:', response.status);

    return this.handleResponse<T>(response);
  }

  /**
   * Make a DELETE request
   */
  async delete<T>(path: string): Promise<ApiResponse<T>> {
    const response = await fetch(`${API_PREFIX}${path}`, {
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
    try {
      console.log('Response status before parsing:', response.status);
      const responseText = await response.text();
      console.log('Response text:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Parsed data:', data);
      } catch (e) {
        console.error('Error parsing JSON:', e);
        return {
          success: false,
          error: 'Invalid JSON response: ' + responseText.substring(0, 100) + '...',
          statusCode: response.status,
        };
      }

      if (data.success === undefined) {
        return {
          success: response.ok,
          data: response.ok ? data : undefined,
          error: response.ok ? undefined : data.message || 'Unknown error',
          statusCode: response.status,
        };
      }

      return data;
    } catch (e) {
      console.error('Error in handleResponse:', e);
      return {
        success: false,
        error: 'Error processing response: ' + String(e),
        statusCode: response.status || 500,
      };
    }
  }
}

// Create a singleton instance
export const apiClient = new ApiClient();

export default apiClient;
