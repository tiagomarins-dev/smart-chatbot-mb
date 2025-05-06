import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthResult, JwtPayload, User } from '../interfaces';
import { getSupabaseAdmin } from '../services/supabaseService';
import { HttpStatus, sendError } from '../utils/responseUtils';

// JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || '';

// Error if JWT_SECRET is not set
if (!JWT_SECRET) {
  console.error('JWT_SECRET environment variable is required');
  process.exit(1);
}

/**
 * Extend Express Request interface to include user information
 */
declare global {
  namespace Express {
    interface Request {
      user?: User;
      auth?: AuthResult;
      apiKey?: {
        id: string;
        key_value: string;
        permissions: string[];
      }
    }
  }
}

/**
 * Verify JWT token from authorization header
 */
export async function verifyToken(token: string): Promise<AuthResult> {
  try {
    if (!token) {
      return { authenticated: false, error: 'No token provided' };
    }

    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    if (!decoded || !decoded.sub) {
      return { authenticated: false, error: 'Invalid token' };
    }

    // Check if user exists in database
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('id', decoded.sub)
      .single();
    
    if (error || !data) {
      return { authenticated: false, error: 'User not found' };
    }

    return { 
      authenticated: true, 
      user_id: decoded.sub 
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return { 
      authenticated: false, 
      error: error instanceof Error ? error.message : 'Invalid token'
    };
  }
}

/**
 * Verify API key credentials
 */
export async function verifyApiKey(key: string): Promise<AuthResult> {
  try {
    if (!key) {
      return { authenticated: false, error: 'No API key provided' };
    }

    // Call the verify_api_credentials function from Supabase
    const supabase = getSupabaseAdmin();
    
    // First, check if the API key exists and is active
    const { data, error } = await supabase
      .from('api_keys')
      .select('id, user_id, key_value, permissions')
      .eq('key_value', key)
      .eq('is_active', true)
      .single();
    
    if (error || !data) {
      console.error('API key verification error:', error?.message || 'API key not found');
      return { authenticated: false, error: 'Invalid API key' };
    }
    
    // Update last_used_at timestamp
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', data.id);
    
    return { 
      authenticated: true, 
      user_id: data.user_id,
      api_key_id: data.id
    };
  } catch (error) {
    console.error('API key verification error:', error);
    return { 
      authenticated: false, 
      error: error instanceof Error ? error.message : 'Invalid API key'
    };
  }
}

/**
 * Authentication middleware for Express
 * Supports both JWT token and API key authentication
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  // Try to get authentication from different sources
  const authHeader = req.headers.authorization;
  const apiKeyQuery = req.query.api_key as string;
  
  // First try Authorization header
  if (authHeader) {
    const parts = authHeader.split(' ');
    
    // Handle Bearer token (JWT)
    if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
      const token = parts[1];
      
      // Check if it's an API key (starts with 'api_')
      if (token.startsWith('api_')) {
        authenticateWithApiKey(token, req, res, next);
      } else {
        // It's a JWT token
        authenticateWithJwt(token, req, res, next);
      }
      return;
    }
  }
  
  // If not in Authorization header, try query parameter
  if (apiKeyQuery) {
    authenticateWithApiKey(apiKeyQuery, req, res, next);
    return;
  }
  
  // No authentication provided
  sendError(res, 'Authentication required', HttpStatus.UNAUTHORIZED);
}

/**
 * Handle authentication with JWT token
 */
async function authenticateWithJwt(token: string, req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
      if (err) {
        sendError(res, 'Invalid token', HttpStatus.UNAUTHORIZED);
        return;
      }

      const payload = decoded as JwtPayload;
      
      // Check if user exists in database
      try {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name')
          .eq('id', payload.sub)
          .single();
        
        if (error || !data) {
          sendError(res, 'User not found', HttpStatus.UNAUTHORIZED);
          return;
        }
        
        // Get user email from auth
        const { data: authData, error: authError } = await supabase.auth.admin.getUserById(
          payload.sub
        );
        
        if (authError || !authData.user) {
          sendError(res, 'Auth user not found', HttpStatus.UNAUTHORIZED);
          return;
        }

        // Add user info to request object
        req.user = {
          id: payload.sub,
          email: authData.user.email || '',
          name: data.name,
          role: payload.role
        };

        req.auth = {
          authenticated: true,
          user_id: payload.sub
        };

        next();
      } catch (error) {
        console.error('JWT Authentication error:', error);
        sendError(res, 'Authentication failed', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    });
  } catch (error) {
    console.error('JWT Authentication error:', error);
    sendError(res, 'Authentication failed', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Handle authentication with API key
 */
async function authenticateWithApiKey(apiKey: string, req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authResult = await verifyApiKey(apiKey);
    
    if (!authResult.authenticated || !authResult.user_id) {
      sendError(res, 'Invalid API key', HttpStatus.UNAUTHORIZED);
      return;
    }
    
    // Get user details
    const supabase = getSupabaseAdmin();
    
    // Get API key details
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('api_keys')
      .select('id, key_value, permissions')
      .eq('key_value', apiKey)
      .single();
      
    if (apiKeyError || !apiKeyData) {
      sendError(res, 'API key not found', HttpStatus.UNAUTHORIZED);
      return;
    }
    
    // Get user profile
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('id', authResult.user_id)
      .single();
    
    if (userError || !userData) {
      sendError(res, 'User not found', HttpStatus.UNAUTHORIZED);
      return;
    }
    
    // Get user email from auth
    const { data: authData, error: authError } = await supabase.auth.admin.getUserById(
      authResult.user_id
    );
    
    if (authError || !authData.user) {
      sendError(res, 'Auth user not found', HttpStatus.UNAUTHORIZED);
      return;
    }
    
    // Add API key info to request
    req.apiKey = {
      id: apiKeyData.id,
      key_value: apiKeyData.key_value,
      permissions: apiKeyData.permissions || []
    };
    
    // Add user info to request object
    req.user = {
      id: userData.id,
      email: authData.user.email || '',
      name: userData.name,
      role: 'api' // Mark this as an API-authenticated request
    };
    
    req.auth = {
      authenticated: true,
      user_id: authResult.user_id,
      api_key_id: authResult.api_key_id
    };
    
    // Log API usage (optional, can be implemented in a separate middleware)
    // logApiUsage(req, apiKeyData.id);
    
    next();
  } catch (error) {
    console.error('API Key Authentication error:', error);
    sendError(res, 'Authentication failed', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(user: User): string {
  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
  };

  return jwt.sign(payload, JWT_SECRET);
}

export default authenticate;