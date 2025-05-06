import { Response } from 'express';

/**
 * API response structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode: number;
}

/**
 * Send a success response
 */
export function sendSuccess<T>(
  res: Response, 
  data: T, 
  statusCode: number = 200, 
  message?: string
): Response<ApiResponse<T>> {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
    statusCode
  });
}

/**
 * Send an error response
 */
export function sendError(
  res: Response, 
  error: string | Error, 
  statusCode: number = 500
): Response<ApiResponse<null>> {
  const errorMessage = error instanceof Error ? error.message : error;
  
  return res.status(statusCode).json({
    success: false,
    error: errorMessage,
    statusCode
  });
}

/**
 * Common HTTP status codes with descriptive names
 */
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};