import { Router } from 'express';
import { TaskController } from '@/src/presentation/controllers/TaskController';
import { authenticateToken } from '@/src/presentation/middleware/auth';

export const taskRoutes = (): Router => {
  const router = Router();
  const taskController = new TaskController();

  router.use(authenticateToken);

  router.get('/', taskController.getTasks);
  router.get('/:id', taskController.getTaskById);
  router.post('/', taskController.createTask);
  router.put('/:id', taskController.updateTask);
  router.delete('/:id', taskController.deleteTask);

  return router;
};