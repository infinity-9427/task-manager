import { Router } from 'express';
import { authRoutes } from './authRoutes';
import { taskRoutes } from './taskRoutes';
import { createMessageRoutes } from './messageRoutes';
import { SocketManager } from '@/src/infrastructure/socket/SocketManager';

export const createApiRoutes = (socketManager: SocketManager): Router => {
  const router = Router();

  router.use('/auth', authRoutes);
  router.use('/tasks', taskRoutes());
  router.use('/messages', createMessageRoutes(socketManager));

  return router;
};