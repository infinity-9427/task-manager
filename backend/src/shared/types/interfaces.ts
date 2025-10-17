import { Request } from 'express';
import { User } from '@/src/domain/user/entities/User';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export interface JWTPayload {
  userId: number;
  email: string;
}

export interface TaskUpdatePayload {
  id: number;
  update: {
    field: string;
    newValue: any;
  };
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  parentId?: number;
  assigneeId?: number;
  dueDate?: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  assigneeId?: number;
  dueDate?: string;
}

export interface TaskQueryParams {
  include?: string;
  status?: string;
  assignee?: string;
  priority?: string;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'priority';
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface CreateMessageDto {
  content: string;
  type: 'GENERAL' | 'DIRECT';
  receiverId?: number;
}

export interface MessageQueryParams {
  page?: number;
  limit?: number;
}

export interface SocketUserData {
  userId: number;
  email: string;
}

export interface TypingData {
  userId: number;
  email: string;
  isTyping: boolean;
  receiverId?: number;
}

export interface UserStatusData {
  userId: number;
  email: string;
}