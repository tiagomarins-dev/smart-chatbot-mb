export interface Project {
  id?: string;
  user_id: string;
  company_id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  campaign_start_date?: string; // Primary field for start date
  campaign_end_date?: string;   // Primary field for end date
  start_date?: string;          // Legacy field
  end_date?: string;            // Legacy field
  views_count?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export type ProjectStatus = 'em_planejamento' | 'em_andamento' | 'pausado' | 'concluido' | 'cancelado';

export interface ProjectCreateRequest {
  name: string;
  company_id: string;
  description?: string;
  status?: ProjectStatus;
  campaign_start_date?: string;
  campaign_end_date?: string;
  start_date?: string;          // Legacy field
  end_date?: string;            // Legacy field
}

export interface ProjectUpdateRequest {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  campaign_start_date?: string;
  campaign_end_date?: string;
  start_date?: string;          // Legacy field
  end_date?: string;            // Legacy field
  is_active?: boolean;
}

export interface ProjectResponse {
  projects?: Project[];
  project?: Project;
  message?: string;
  error?: string;
}