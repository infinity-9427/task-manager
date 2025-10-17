import { Task } from '@/src/domain/task/entities/Task';
import { ITaskRepository } from '@/src/domain/task/repositories/ITaskRepository';
import { TaskQueryParams, PaginatedResponse } from '@/src/shared/types/interfaces';

export class GetTasksUseCase {
  constructor(private taskRepository: ITaskRepository) {}

  async execute(queryParams: TaskQueryParams): Promise<PaginatedResponse<Task>> {
    return await this.taskRepository.findAll(queryParams);
  }
}

export class GetTaskByIdUseCase {
  constructor(private taskRepository: ITaskRepository) {}

  async execute(taskId: number): Promise<Task | null> {
    return await this.taskRepository.findById(taskId);
  }
}