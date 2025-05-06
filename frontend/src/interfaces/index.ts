// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode: number;
}

// User and Auth
export interface User {
  id: string;
  email: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  session?: any;
}

// Company
export interface Company {
  id?: string;
  user_id: string;
  name: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CompaniesResponse {
  companies: Company[];
}

export interface CompanyResponse {
  company: Company;
}

// Project
export interface Project {
  id?: string;
  user_id: string;
  company_id: string;
  company_name?: string;
  name: string;
  description?: string;
  status: 'em_planejamento' | 'em_andamento' | 'pausado' | 'concluido' | 'cancelado';
  start_date?: string;
  end_date?: string;
  views_count?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectsResponse {
  projects: Project[];
}

export interface ProjectResponse {
  project: Project;
}

// Lead
export interface Lead {
  id?: string;
  user_id: string;
  name: string;
  first_name: string;
  email: string;
  phone: string;
  status: 'novo' | 'qualificado' | 'contatado' | 'convertido' | 'desistiu' | 'inativo';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LeadsResponse {
  leads: Lead[];
}

export interface LeadResponse {
  lead: Lead;
  projects?: any[];
}

export interface LeadStats {
  total_leads: number;
  new_leads_period: number;
  leads_by_status: Record<string, number>;
  leads_by_source: Record<string, number>;
  leads_by_day: { date: string; count: number }[];
  conversion_rate: number;
}

export interface LeadStatsResponse {
  stats: LeadStats;
  period_days: number;
  project_id?: string;
}

// Contact
export interface Contact {
  id?: string;
  user_id: string;
  phone_number: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  profile_image_url?: string;
  is_blocked?: boolean;
  tags?: string[];
  custom_fields?: Record<string, any>;
  last_message_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ContactsResponse {
  data: Contact[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface ContactResponse {
  data: Contact;
  message?: string;
}