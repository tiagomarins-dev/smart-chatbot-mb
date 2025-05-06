import apiClient from './client';
import { ApiResponse, CompaniesResponse, CompanyResponse, Company } from '../interfaces';

export const companiesApi = {
  /**
   * Get all companies
   */
  getCompanies: async (): Promise<ApiResponse<CompaniesResponse>> => {
    return await apiClient.get<CompaniesResponse>('/companies');
  },
  
  /**
   * Get a company by ID
   */
  getCompany: async (id: string): Promise<ApiResponse<CompanyResponse>> => {
    return await apiClient.get<CompanyResponse>(`/companies/${id}`);
  },
  
  /**
   * Create a new company
   */
  createCompany: async (data: { name: string }): Promise<ApiResponse<CompanyResponse>> => {
    return await apiClient.post<CompanyResponse>('/companies', data);
  },
  
  /**
   * Update a company
   */
  updateCompany: async (id: string, data: { name: string; is_active?: boolean }): Promise<ApiResponse<CompanyResponse>> => {
    return await apiClient.put<CompanyResponse>(`/companies/${id}`, data);
  },
  
  /**
   * Delete a company (soft delete)
   */
  deleteCompany: async (id: string): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    return await apiClient.delete<{ success: boolean; message: string }>(`/companies/${id}`);
  }
};

export default companiesApi;