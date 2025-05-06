export interface Project {
  id?: string;
  user_id: string;
  company_id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  start_date?: string;
  end_date?: string;
  views_count?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export type ProjectStatus = 'active' | 'completed' | 'paused' | 'cancelled';

export interface ProjectCreateRequest {
  name: string;
  company_id: string;
  description?: string;
  status?: ProjectStatus;
  start_date?: string;
  end_date?: string;
}

export interface ProjectUpdateRequest {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
}

export interface ProjectResponse {
  projects?: Project[];
  project?: Project;
  message?: string;
  error?: string;
}