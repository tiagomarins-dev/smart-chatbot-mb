export interface MessageTemplate {
  id: string;
  project_id: string;
  name: string;
  description: string;
  content: string;
  min_lead_score?: number;
  max_lead_score?: number;
  min_sentiment?: number;
  max_sentiment?: number;
  max_sends_per_lead: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventTrigger {
  id: string;
  project_id: string;
  name: string;
  event_type: string;
  description: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TemplateEventMapping {
  id: string;
  template_id: string;
  event_id: string;
  delay_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface MessageLog {
  id: string;
  lead_id: string;
  template_id: string;
  event_id?: string;
  content: string;
  sent_at: string;
  was_read: boolean;
  had_response: boolean;
  response_content?: string;
  response_time?: string;
}

export interface MessageTemplateFormData {
  name: string;
  description: string;
  content: string;
  min_lead_score?: number;
  max_lead_score?: number;
  min_sentiment?: number;
  max_sentiment?: number;
  max_sends_per_lead: number;
  active: boolean;
  event_ids?: string[];
}

export interface EventTriggerFormData {
  name: string;
  event_type: string;
  description: string;
  active: boolean;
}