import { Router } from 'express';
import { AuthController } from '@/src/presentation/controllers/AuthController';

const router = Router();
const authController = new AuthController();

router.post('/register', authController.register);
router.post('/login', authController.login);

export { router as authRoutes };