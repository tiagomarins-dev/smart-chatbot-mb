import { sendSuccess, sendError, HttpStatus } from '../../utils/responseUtils';

describe('Response Utils', () => {
  let mockRes: any;
  
  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });
  
  describe('sendSuccess', () => {
    it('should send a success response with default status code', () => {
      const data = { id: 1, name: 'Test' };
      
      sendSuccess(mockRes, data);
      
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data,
        statusCode: HttpStatus.OK
      });
    });
    
    it('should send a success response with custom status code and message', () => {
      const data = { id: 1, name: 'Test' };
      const statusCode = HttpStatus.CREATED;
      const message = 'Resource created successfully';
      
      sendSuccess(mockRes, data, statusCode, message);
      
      expect(mockRes.status).toHaveBeenCalledWith(statusCode);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data,
        message,
        statusCode
      });
    });
  });
  
  describe('sendError', () => {
    it('should send an error response with default status code', () => {
      const error = 'Something went wrong';
      
      sendError(mockRes, error);
      
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR
      });
    });
    
    it('should send an error response with custom status code', () => {
      const error = 'Bad request';
      const statusCode = HttpStatus.BAD_REQUEST;
      
      sendError(mockRes, error, statusCode);
      
      expect(mockRes.status).toHaveBeenCalledWith(statusCode);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error,
        statusCode
      });
    });
    
    it('should handle Error objects', () => {
      const errorObj = new Error('Test error');
      
      sendError(mockRes, errorObj);
      
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Test error',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR
      });
    });
  });
});