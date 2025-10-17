import { Request, Response } from 'express';
import { AuthService } from '@/src/application/services/AuthService';
import { validate } from 'class-validator';
import { User } from '@/src/domain/user/entities/User';

export class AuthController {
  private authService = new AuthService();

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, name, password } = req.body;

      // Validate required fields
      if (!email || !name || !password) {
        res.status(400).json({ error: 'Email, name, and password are required' });
        return;
      }

      // Validate field types
      if (typeof email !== 'string' || typeof name !== 'string' || typeof password !== 'string') {
        res.status(400).json({ error: 'Email, name, and password must be strings' });
        return;
      }

      // Sanitize inputs
      const sanitizedEmail = email.trim().toLowerCase();
      const sanitizedName = name.trim();
      const sanitizedPassword = password.trim();

      // Additional validation
      if (sanitizedEmail.length === 0 || sanitizedName.length === 0 || sanitizedPassword.length === 0) {
        res.status(400).json({ error: 'Email, name, and password cannot be empty' });
        return;
      }

      const user = new User();
      user.email = sanitizedEmail;
      user.name = sanitizedName;
      user.password = sanitizedPassword;

      const errors = await validate(user);
      if (errors.length > 0) {
        res.status(400).json({ 
          error: 'Validation failed',
          errors: errors.map(err => err.constraints) 
        });
        return;
      }

      const result = await this.authService.register(sanitizedEmail, sanitizedName, sanitizedPassword);
      
      res.status(201).json({
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name
        },
        token: result.token
      });
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error.message.includes('User already exists') || error.message.includes('duplicate key')) {
        res.status(400).json({ error: 'User already exists' });
      } else if (error.message.includes('Invalid email')) {
        res.status(400).json({ error: 'Invalid email format' });
      } else if (error.message.includes('password')) {
        res.status(400).json({ error: 'Password does not meet requirements' });
      } else {
        res.status(500).json({ 
          error: 'Internal server error',
          message: process.env.NODE_ENV === 'development' ? error.message : 'Registration failed'
        });
      }
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      // Validate required fields
      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }

      // Validate field types
      if (typeof email !== 'string' || typeof password !== 'string') {
        res.status(400).json({ error: 'Email and password must be strings' });
        return;
      }

      // Sanitize inputs
      const sanitizedEmail = email.trim().toLowerCase();
      const sanitizedPassword = password.trim();

      // Additional validation
      if (sanitizedEmail.length === 0 || sanitizedPassword.length === 0) {
        res.status(400).json({ error: 'Email and password cannot be empty' });
        return;
      }

      const result = await this.authService.login(sanitizedEmail, sanitizedPassword);
      
      res.json({
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name
        },
        token: result.token
      });
    } catch (error) {
      console.error('Login error:', error);
      
      // Always return generic error message for security
      if (error.message.includes('Invalid credentials') || 
          error.message.includes('User not found') ||
          error.message.includes('Incorrect password')) {
        res.status(401).json({ error: 'Invalid credentials' });
      } else if (error.message.includes('Account locked') || error.message.includes('suspended')) {
        res.status(403).json({ error: 'Account access denied' });
      } else if (error.message.includes('rate limit')) {
        res.status(429).json({ error: 'Too many login attempts. Please try again later.' });
      } else {
        res.status(500).json({ 
          error: 'Internal server error',
          message: process.env.NODE_ENV === 'development' ? error.message : 'Login failed'
        });
      }
    }
  };
}