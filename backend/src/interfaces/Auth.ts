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
}

export interface AuthResult {
  authenticated: boolean;
  user_id?: string;
  error?: string;
  api_key_id?: string; // Added for API key authentication
}