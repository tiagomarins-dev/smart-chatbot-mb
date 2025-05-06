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
 * Authentication middleware for Express
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  // Get token from authorization header
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN format
  
  if (!token) {
    sendError(res, 'Authentication required', HttpStatus.UNAUTHORIZED);
    return;
  }

  // Verify the token
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
      console.error('Authentication error:', error);
      sendError(res, 'Authentication failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  });
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