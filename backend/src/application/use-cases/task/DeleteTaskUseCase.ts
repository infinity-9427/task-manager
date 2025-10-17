import { ITaskRepository } from '@/src/domain/task/repositories/ITaskRepository';
import { DomainEvents } from '@/src/domain/shared/DomainEvent';

export interface DeleteTaskCommand {
  taskId: number;
  userId: number;
}

export class DeleteTaskUseCase {
  constructor(private taskRepository: ITaskRepository) {}

  async execute(command: DeleteTaskCommand): Promise<void> {
    const { taskId } = command;

    // Find task
    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    // Mark for deletion (raises domain event)
    task.markForDeletion();

    // Delete task (cascade will handle subtasks)
    await this.taskRepository.delete(task);

    // Dispatch domain events
    await DomainEvents.dispatchEvents();
  }
}