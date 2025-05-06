export interface Lead {
  id?: string;
  user_id: string;
  name: string;
  first_name: string;
  email: string;
  phone: string;
  status: LeadStatus;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export type LeadStatus = 'novo' | 'qualificado' | 'contatado' | 'convertido' | 'desistiu' | 'inativo';

export interface LeadProject {
  lead_id: string;
  project_id: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  captured_at?: string;
}

export interface LeadCaptureRequest {
  name: string;
  first_name?: string;
  email: string;
  phone: string;
  project_id: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  notes?: string;
}

export interface LeadStatusUpdateRequest {
  status: LeadStatus;
  notes?: string;
}

export interface LeadStats {
  total_leads: number;
  new_leads_period: number;
  leads_by_status: Record<LeadStatus, number>;
  leads_by_source: Record<string, number>;
  leads_by_day: { date: string; count: number }[];
  conversion_rate: number;
}

export interface LeadResponse {
  leads?: Lead[];
  lead?: Lead;
  message?: string;
  error?: string;
  details?: Record<string, any>;
}

export interface LeadStatsResponse {
  stats: LeadStats;
  period_days: number;
  project_id?: string;
  error?: string;
}