import { Repository } from 'typeorm';
import { User } from '@/src/domain/user/entities/User';

export interface IUserRepository {
  getRepository(): Repository<User>;
  findById(id: number): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(userData: Partial<User>): Promise<User>;
  update(id: number, userData: Partial<User>): Promise<User>;
  delete(id: number): Promise<void>;
  exists(email: string): Promise<boolean>;
}