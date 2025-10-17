import { Router } from 'express';
import { MessageController } from '@/src/presentation/controllers/MessageController';
import { authenticateToken } from '@/src/presentation/middleware/auth';
import { SocketManager } from '@/src/infrastructure/socket/SocketManager';

export const createMessageRoutes = (socketManager: SocketManager): Router => {
  const router = Router();
  const messageController = new MessageController(socketManager);

  // All routes require authentication
  router.use(authenticateToken);

  // Send a message (general or direct)
  router.post('/', messageController.sendMessage);

  // Get general messages (public chat)
  router.get('/general', messageController.getGeneralMessages);

  // Get direct messages with a specific user
  router.get('/direct/:userId', messageController.getDirectMessages);

  // Get list of users for direct messaging
  router.get('/users', messageController.getUsers);

  return router;
};