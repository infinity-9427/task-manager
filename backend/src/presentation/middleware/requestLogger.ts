import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/src/shared/utils/logger';

interface ExtendedRequest extends Request {
  requestId?: string;
  startTime?: number;
}

export const requestLogger = (req: ExtendedRequest, res: Response, next: NextFunction): void => {
  req.requestId = uuidv4();
  req.startTime = Date.now();

  // Log incoming request
  logger.info(`Incoming Request: ${req.method} ${req.path}`, {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    contentType: req.get('Content-Type'),
    ...(process.env.NODE_ENV === 'development' && {
      headers: req.headers,
      body: req.body
    })
  });

  // Capture the original end method
  const originalEnd = res.end;

  res.end = function(chunk?: any, encoding?: any, cb?: any): Response {
    // Calculate request duration
    const duration = Date.now() - (req.startTime || Date.now());

    // Log response
    logger.request(
      req.method!,
      req.path,
      res.statusCode,
      duration,
      {
        requestId: req.requestId,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    // Call original end method
    return originalEnd.call(this, chunk, encoding, cb);
  };

  next();
};