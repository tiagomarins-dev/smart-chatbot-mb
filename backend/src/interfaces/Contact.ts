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

export interface ContactCreateRequest {
  phone_number: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  profile_image_url?: string;
  is_blocked?: boolean;
  tags?: string[];
  custom_fields?: Record<string, any>;
}

export interface ContactUpdateRequest {
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  profile_image_url?: string;
  is_blocked?: boolean;
  tags?: string[];
  custom_fields?: Record<string, any>;
}

export interface ContactsQueryParams {
  page?: number;
  limit?: number;
  tag?: string;
  search?: string;
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