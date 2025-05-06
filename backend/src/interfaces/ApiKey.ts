export interface ApiKey {
  id: string;
  user_id: string;
  name: string;
  key_value: string;
  permissions: string[];
  rate_limit: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  expires_at?: string;
  last_used_at?: string;
}

export interface ApiKeyWithSecret {
  api_key: ApiKey;
  secret: string;
  warning: string;
}

export interface ApiKeysResponse {
  api_keys: ApiKey[];
}