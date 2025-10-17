import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { getActiveDataSource } from '@/src/shared/utils/database';
import { User } from '@/src/domain/user/entities/User';
import { generateToken } from '@/src/infrastructure/config/jwt';
import { IUserRepository } from '@/src/domain/user/repositories/IUserRepository';

export interface IAuthService {
  register(email: string, name: string, password: string): Promise<{ user: User; token: string }>;
  login(email: string, password: string): Promise<{ user: User; token: string }>;
}

export class AuthService implements IAuthService {
  private userRepository: Repository<User> | null = null;
  private readonly saltRounds = 12;
  private readonly minPasswordLength = 8;

  constructor(private customUserRepository?: IUserRepository) {}

  private getUserRepository(): Repository<User> {
    if (!this.userRepository) {
      this.userRepository = this.customUserRepository?.getRepository() || getActiveDataSource().getRepository(User);
    }
    return this.userRepository;
  }

  async register(email: string, name: string, password: string): Promise<{ user: User; token: string }> {
    try {
      await this.validateRegistrationInput(email, name, password);
      await this.checkUserExists(email);
      
      const hashedPassword = await this.hashPassword(password);
      const user = await this.createUser(email, name, hashedPassword);
      const token = this.generateAuthToken(user);

      return { user, token };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Registration failed due to unexpected error');
    }
  }

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    try {
      await this.validateLoginInput(email, password);
      
      const user = await this.findUserByEmail(email);
      await this.verifyPassword(password, user.password);
      
      const token = this.generateAuthToken(user);

      return { user, token };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Login failed due to unexpected error');
    }
  }

  private async validateRegistrationInput(email: string, name: string, password: string): Promise<void> {
    if (!this.isValidEmail(email)) {
      throw new Error('Invalid email format');
    }
    
    if (!this.isValidName(name)) {
      throw new Error('Name must be between 2 and 50 characters');
    }
    
    if (!this.isValidPassword(password)) {
      throw new Error(`Password must be at least ${this.minPasswordLength} characters long`);
    }
  }

  private async validateLoginInput(email: string, password: string): Promise<void> {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
  }

  private async checkUserExists(email: string): Promise<void> {
    const repository = this.getUserRepository();
    const existingUser = await repository.findOne({ where: { email } });
    if (existingUser) {
      throw new Error('User already exists with this email');
    }
  }

  private async findUserByEmail(email: string): Promise<User> {
    const repository = this.getUserRepository();
    const user = await repository.findOne({ where: { email } });
    if (!user) {
      throw new Error('Invalid credentials');
    }
    return user;
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  private async verifyPassword(plainPassword: string, hashedPassword: string): Promise<void> {
    const isValid = await bcrypt.compare(plainPassword, hashedPassword);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }
  }

  private async createUser(email: string, name: string, hashedPassword: string): Promise<User> {
    const repository = this.getUserRepository();
    const user = repository.create({
      email: email.toLowerCase().trim(),
      name: name.trim(),
      password: hashedPassword
    });

    return repository.save(user);
  }

  private generateAuthToken(user: User): string {
    return generateToken({ userId: user.id, email: user.email });
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  private isValidName(name: string): boolean {
    return name.trim().length >= 2 && name.trim().length <= 50;
  }

  private isValidPassword(password: string): boolean {
    return password.length >= this.minPasswordLength;
  }
}