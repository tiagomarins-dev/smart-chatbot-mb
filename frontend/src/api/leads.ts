import apiClient from './client';
import { ApiResponse, LeadsResponse, LeadResponse, LeadStatsResponse, LeadEventsResponse } from '../interfaces';

export const leadsApi = {
  /**
   * Get all leads
   */
  getLeads: async (params?: { project_id?: string; email?: string }): Promise<ApiResponse<LeadsResponse>> => {
    return await apiClient.get<LeadsResponse>('/leads', params);
  },
  
  /**
   * Get a lead by ID
   */
  getLead: async (id: string): Promise<ApiResponse<LeadResponse>> => {
    return await apiClient.get<LeadResponse>(`/leads/${id}`);
  },
  
  /**
   * Get lead events
   */
  getLeadEvents: async (id: string): Promise<ApiResponse<LeadEventsResponse>> => {
    return await apiClient.get<LeadEventsResponse>(`/leads/${id}/events-list`);
  },
  
  /**
   * Capture a new lead
   */
  captureLead: async (data: {
    name: string;
    email: string;
    phone: string;
    project_id: string;
    first_name?: string;
    notes?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
  }): Promise<ApiResponse<LeadResponse>> => {
    return await apiClient.post<LeadResponse>('/leads', data);
  },
  
  /**
   * Update a lead's status
   */
  updateLeadStatus: async (
    id: string, 
    data: { 
      status: 'novo' | 'qualificado' | 'contatado' | 'convertido' | 'desistiu' | 'inativo';
      notes?: string;
    }
  ): Promise<ApiResponse<{ 
    message: string;
    lead_id: string;
    previous_status: string;
    new_status: string;
  }>> => {
    return await apiClient.put<any>(`/leads/${id}/status`, data);
  },
  
  /**
   * Update a lead (full update)
   */
  updateLead: async (
    id: string,
    data: {
      name: string;
      first_name: string;
      email: string;
      phone: string;
      status: 'novo' | 'qualificado' | 'contatado' | 'convertido' | 'desistiu' | 'inativo';
      notes?: string;
    }
  ): Promise<ApiResponse<{
    message: string;
    lead: any;
  }>> => {
    return await apiClient.put<any>(`/leads/${id}`, data);
  },
  
  /**
   * Get lead statistics
   */
  getLeadStats: async (params?: { 
    project_id?: string;
    period?: number;
  }): Promise<ApiResponse<LeadStatsResponse>> => {
    return await apiClient.get<LeadStatsResponse>('/leads/stats', params);
  }
};

export default leadsApi;