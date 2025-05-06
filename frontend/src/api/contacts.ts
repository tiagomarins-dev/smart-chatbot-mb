import apiClient from './client';
import { ApiResponse, ContactsResponse, ContactResponse } from '../interfaces';

export const contactsApi = {
  /**
   * Get all contacts with pagination and filters
   */
  getContacts: async (params?: {
    page?: number;
    limit?: number;
    tag?: string;
    search?: string;
  }): Promise<ApiResponse<ContactsResponse>> => {
    return await apiClient.get<ContactsResponse>('/contacts', params);
  },
  
  /**
   * Get a contact by ID
   */
  getContactById: async (id: string): Promise<ApiResponse<ContactResponse>> => {
    return await apiClient.get<ContactResponse>(`/contacts/${id}`);
  },
  
  /**
   * Get a contact by phone number
   */
  getContactByPhone: async (phone: string): Promise<ApiResponse<ContactResponse>> => {
    return await apiClient.get<ContactResponse>('/contacts/phone', { phone });
  },
  
  /**
   * Create a new contact
   */
  createContact: async (data: {
    phone_number: string;
    name?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    profile_image_url?: string;
    is_blocked?: boolean;
    tags?: string[];
    custom_fields?: Record<string, any>;
  }): Promise<ApiResponse<ContactResponse>> => {
    return await apiClient.post<ContactResponse>('/contacts', data);
  },
  
  /**
   * Update a contact
   */
  updateContact: async (
    id: string,
    data: {
      name?: string;
      first_name?: string;
      last_name?: string;
      email?: string;
      profile_image_url?: string;
      is_blocked?: boolean;
      tags?: string[];
      custom_fields?: Record<string, any>;
    }
  ): Promise<ApiResponse<ContactResponse>> => {
    return await apiClient.put<ContactResponse>(`/contacts/${id}`, data);
  },
  
  /**
   * Delete a contact
   */
  deleteContact: async (id: string): Promise<ApiResponse<{
    message: string;
    id: string;
  }>> => {
    return await apiClient.delete<{ message: string; id: string }>(`/contacts/${id}`);
  }
};

export default contactsApi;