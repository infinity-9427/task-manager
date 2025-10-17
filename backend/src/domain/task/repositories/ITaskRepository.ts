import { Task } from '../entities/Task';
import { TaskQueryParams, PaginatedResponse } from '@/src/shared/types/interfaces';

export interface ITaskRepository {
  findById(id: number): Promise<Task | null>;
  findAll(queryParams: TaskQueryParams): Promise<PaginatedResponse<Task>>;
  save(task: Task): Promise<Task>;
  delete(task: Task): Promise<void>;
  findByParentId(parentId: number): Promise<Task[]>;
  findIncompleteSubtasks(parentId: number): Promise<Task[]>;
}