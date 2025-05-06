import { authenticate, generateToken } from '../../middleware/auth';
import { User } from '../../interfaces';
import jwt from 'jsonwebtoken';

// Mock the supabaseService
jest.mock('../../services/supabaseService', () => ({
  getSupabaseAdmin: jest.fn().mockReturnValue({
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      then: jest.fn().mockResolvedValue({
        data: { id: 'test-user-id', email: 'test@example.com', role: 'user' },
        error: null
      })
    })
  })
}));

describe('Auth Middleware', () => {
  describe('authenticate', () => {
    let mockReq: any;
    let mockRes: any;
    let mockNext: jest.Mock;
    
    beforeEach(() => {
      mockReq = {
        headers: {
          authorization: 'Bearer valid-token'
        }
      };
      
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      mockNext = jest.fn();
      
      // Mock jwt.verify to return a valid payload
      jest.spyOn(jwt, 'verify').mockImplementation(() => ({
        sub: 'test-user-id',
        email: 'test@example.com',
        role: 'user',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      }));
    });
    
    afterEach(() => {
      jest.restoreAllMocks();
    });
    
    it('should call next() for valid token', () => {
      authenticate(mockReq, mockRes, mockNext);
      
      // Allow async operations to complete
      setImmediate(() => {
        expect(mockNext).toHaveBeenCalled();
        expect(mockReq.user).toBeDefined();
        expect(mockReq.user.id).toBe('test-user-id');
        expect(mockReq.auth).toBeDefined();
        expect(mockReq.auth.authenticated).toBe(true);
      });
    });
    
    it('should return 401 when no token is provided', () => {
      mockReq.headers.authorization = undefined;
      
      authenticate(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Authentication required'
      }));
      expect(mockNext).not.toHaveBeenCalled();
    });
    
    it('should return 401 for invalid token', () => {
      // Mock jwt.verify to throw an error
      jest.spyOn(jwt, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      authenticate(mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Invalid token'
      }));
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
  
  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const user: User = {
        id: 'test-user-id',
        email: 'test@example.com',
        role: 'user'
      };
      
      // Mock jwt.sign to return a fixed token
      jest.spyOn(jwt, 'sign').mockReturnValue('test-token');
      
      const token = generateToken(user);
      
      expect(token).toBe('test-token');
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: user.id,
          email: user.email,
          role: user.role
        }),
        process.env.JWT_SECRET
      );
    });
  });
});