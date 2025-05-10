export interface User {
  id: string;
  email: string;
  role?: string;
  name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role?: string;
  name?: string;
  iat: number;
  exp: number;
  mode?: string; // Indica modo offline, fallback, etc
}

export interface AuthResult {
  authenticated: boolean;
  user_id?: string;
  error?: string;
  api_key_id?: string; // Added for API key authentication
  email?: string; // Email do usuário (para uso em modo offline)
  user_name?: string; // Nome do usuário (para uso em modo offline)
  is_offline_token?: boolean; // Indica se é um token de modo offline
  offline_mode?: string; // Tipo específico de modo offline (generated, db_error, etc)
}