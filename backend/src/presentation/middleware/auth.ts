import { Request, Response, NextFunction } from 'express';
import { getActiveDataSource } from '@/src/shared/utils/database';
import { User } from '@/src/domain/user/entities/User';
import { verifyToken } from '@/src/infrastructure/config/jwt';
import { AuthenticatedRequest } from '@/src/shared/types/interfaces';

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Auth middleware: No token provided');
      }
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('Auth middleware: Verifying token...');
    }
    const decoded = verifyToken(token);
    if (process.env.NODE_ENV === 'development') {
      console.log('Auth middleware: Token decoded successfully, userId:', decoded.userId);
    }
    
    // Check if database is connected
    let dataSource;
    try {
      dataSource = getActiveDataSource();
    } catch (error) {
      console.error('Auth middleware: Database not initialized -', error.message);
      res.status(503).json({ error: 'Service temporarily unavailable' });
      return;
    }

    if (!dataSource.isInitialized) {
      console.error('Auth middleware: Database not connected');
      res.status(503).json({ error: 'Service temporarily unavailable' });
      return;
    }

    const userRepository = dataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: decoded.userId } });

    if (!user) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Auth middleware: User not found for userId:', decoded.userId);
      }
      res.status(401).json({ error: 'Invalid token - user not found' });
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('Auth middleware: User found:', user.email);
    }
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({ error: 'Token expired' });
    } else if (error.name === 'JsonWebTokenError') {
      res.status(401).json({ error: 'Invalid token format' });
    } else {
      res.status(403).json({ error: 'Invalid or expired token' });
    }
  }
};