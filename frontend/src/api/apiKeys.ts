import apiClient from './client';
import { ApiResponse } from '../interfaces';

export interface ApiKey {
  id: string;
  name: string;
  key_value: string;
  permissions?: string[];
  rate_limit?: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  expires_at?: string;
  last_used_at?: string;
}

export interface ApiKeysResponse {
  api_keys: ApiKey[];
}

export interface ApiKeyCreationResponse {
  api_key: ApiKey;
  secret: string;
  warning: string;
}

export const apiKeysApi = {
  /**
   * Get all API keys for the authenticated user
   */
  getApiKeys: async (): Promise<ApiResponse<ApiKeysResponse>> => {
    return await apiClient.get<ApiKeysResponse>('/api-keys');
  },

  /**
   * Create a new API key
   */
  createApiKey: async (name: string, expiresAt?: string): Promise<ApiResponse<ApiKeyCreationResponse>> => {
    return await apiClient.post<ApiKeyCreationResponse>('/api-keys', {
      name,
      expires_at: expiresAt
    });
  },

  /**
   * Update an API key
   */
  updateApiKey: async (id: string, data: {
    name?: string;
    permissions?: string[];
    rate_limit?: number;
    expires_at?: string;
    is_active?: boolean;
  }): Promise<ApiResponse<{ api_key: ApiKey }>> => {
    return await apiClient.put<{ api_key: ApiKey }>(`/api-keys/${id}`, data);
  },

  /**
   * Revoke an API key
   */
  revokeApiKey: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    return await apiClient.put<{ message: string }>(`/api-keys/${id}/revoke`, {});
  },

  /**
   * Delete an API key permanently
   */
  deleteApiKey: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    return await apiClient.delete<{ message: string }>(`/api-keys/${id}`);
  }
};

export default apiKeysApi;