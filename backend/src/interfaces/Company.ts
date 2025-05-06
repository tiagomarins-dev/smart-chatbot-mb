export interface Company {
  id?: string;
  user_id: string;
  name: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CompanyResponse {
  companies?: Company[];
  company?: Company;
  message?: string;
  error?: string;
}

export interface CompanyUpdateRequest {
  name: string;
  is_active?: boolean;
}