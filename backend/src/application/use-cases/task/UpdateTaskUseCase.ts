import { Task } from '@/src/domain/task/entities/Task';
import { ITaskRepository } from '@/src/domain/task/repositories/ITaskRepository';
import { IUserRepository } from '@/src/domain/user/repositories/IUserRepository';
import { TaskStatus, TaskPriority } from '@/src/shared/types/enums';
import { DomainEvents } from '@/src/domain/shared/DomainEvent';

export interface UpdateTaskCommand {
  taskId: number;
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: number;
  dueDate?: string;
  userId: number;
}

export class UpdateTaskUseCase {
  constructor(
    private taskRepository: ITaskRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(command: UpdateTaskCommand): Promise<Task> {
    const { taskId, title, description, status, priority, assigneeId, dueDate } = command;

    // Find task
    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    // Get subtasks for validation
    const subtasks = await this.taskRepository.findByParentId(taskId);

    // Update fields using domain methods
    if (title !== undefined) {
      task.updateTitle(title);
    }

    if (description !== undefined) {
      task.description = description;
    }

    if (status !== undefined) {
      task.updateStatus(status, subtasks);
    }

    if (priority !== undefined) {
      task.updatePriority(priority);
    }

    if (assigneeId !== undefined) {
      const assignee = await this.userRepository.findById(assigneeId);
      if (!assignee) {
        throw new Error('Assignee user not found');
      }
      task.assignTo(assigneeId);
    }

    if (dueDate !== undefined) {
      if (dueDate) {
        const parsedDueDate = new Date(dueDate);
        if (isNaN(parsedDueDate.getTime())) {
          throw new Error('Invalid due date format');
        }
        task.dueDate = parsedDueDate;
      } else {
        task.dueDate = undefined;
      }
    }

    // Save task
    const savedTask = await this.taskRepository.save(task);

    // Dispatch domain events
    await DomainEvents.dispatchEvents();

    return savedTask;
  }
}