import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/src/shared/errors/AppError';
import { logger } from '@/src/shared/utils/logger';

interface ExtendedRequest extends Request {
  requestId?: string;
}

export const errorHandler = (
  error: Error,
  req: ExtendedRequest,
  res: Response,
  next: NextFunction
): void => {
  const requestId = req.requestId || 'unknown';

  if (error instanceof AppError) {
    logger.error(
      `Operational Error: ${error.message}`,
      error,
      {
        requestId,
        statusCode: error.statusCode,
        path: req.path,
        method: req.method,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      }
    );

    res.status(error.statusCode).json({
      error: {
        message: error.message,
        statusCode: error.statusCode,
        timestamp: error.timestamp,
        requestId,
        path: req.path,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      }
    });
    return;
  }

  // Handle specific error types
  if (error.name === 'ValidationError') {
    logger.error('Validation Error', error, { requestId, path: req.path });
    res.status(400).json({
      error: {
        message: 'Validation failed',
        details: error.message,
        statusCode: 400,
        timestamp: new Date().toISOString(),
        requestId,
        path: req.path
      }
    });
    return;
  }

  if (error.name === 'JsonWebTokenError') {
    logger.error('JWT Error', error, { requestId, path: req.path });
    res.status(401).json({
      error: {
        message: 'Invalid token',
        statusCode: 401,
        timestamp: new Date().toISOString(),
        requestId,
        path: req.path
      }
    });
    return;
  }

  if (error.name === 'TokenExpiredError') {
    logger.error('JWT Expired', error, { requestId, path: req.path });
    res.status(401).json({
      error: {
        message: 'Token expired',
        statusCode: 401,
        timestamp: new Date().toISOString(),
        requestId,
        path: req.path
      }
    });
    return;
  }

  // Database errors
  if (error.message.includes('duplicate key') || error.message.includes('UNIQUE constraint')) {
    logger.error('Database Constraint Error', error, { requestId, path: req.path });
    res.status(409).json({
      error: {
        message: 'Resource already exists',
        statusCode: 409,
        timestamp: new Date().toISOString(),
        requestId,
        path: req.path
      }
    });
    return;
  }

  // Unexpected errors
  logger.error(
    `Unexpected Error: ${error.message}`,
    error,
    {
      requestId,
      path: req.path,
      method: req.method,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      body: process.env.NODE_ENV === 'development' ? req.body : '[HIDDEN]'
    }
  );

  res.status(500).json({
    error: {
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message,
      statusCode: 500,
      timestamp: new Date().toISOString(),
      requestId,
      path: req.path,
      ...(process.env.NODE_ENV === 'development' && { 
        stack: error.stack,
        details: error.message 
      })
    }
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = (req as ExtendedRequest).requestId || 'unknown';
  
  logger.warn(`Route not found: ${req.method} ${req.path}`, {
    requestId,
    method: req.method,
    path: req.path,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  res.status(404).json({
    error: {
      message: `Route ${req.method} ${req.path} not found`,
      statusCode: 404,
      timestamp: new Date().toISOString(),
      requestId,
      path: req.path
    }
  });
};