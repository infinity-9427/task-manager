import { Task } from '@/src/domain/task/entities/Task';
import { ITaskRepository } from '@/src/domain/task/repositories/ITaskRepository';
import { IUserRepository } from '@/src/domain/user/repositories/IUserRepository';
import { TaskPriority } from '@/src/shared/types/enums';
import { DomainEvents } from '@/src/domain/shared/DomainEvent';

export interface CreateTaskCommand {
  title: string;
  description?: string;
  priority?: TaskPriority;
  parentId?: number;
  assigneeId?: number;
  createdById: number;
  dueDate?: string;
}

export class CreateTaskUseCase {
  constructor(
    private taskRepository: ITaskRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(command: CreateTaskCommand): Promise<Task> {
    const { title, description, priority, parentId, assigneeId, createdById, dueDate } = command;

    // Validate parent task if provided
    if (parentId) {
      const parentTask = await this.taskRepository.findById(parentId);
      if (!parentTask) {
        throw new Error('Parent task not found');
      }
    }

    // Handle assignee validation - subtasks don't have assignees
    let finalAssigneeId: number | undefined;
    if (!parentId) {
      // This is a parent task, validate assignee
      finalAssigneeId = assigneeId || createdById;
      const assignee = await this.userRepository.findById(finalAssigneeId);
      if (!assignee) {
        throw new Error('Assignee user not found');
      }
    }

    // Parse dueDate if provided
    let parsedDueDate: Date | undefined;
    if (dueDate) {
      parsedDueDate = new Date(dueDate);
      if (isNaN(parsedDueDate.getTime())) {
        throw new Error('Invalid due date format');
      }
    }

    // Create task using domain factory method
    const task = Task.create(
      title,
      createdById,
      description,
      priority,
      finalAssigneeId,
      parentId,
      parsedDueDate
    );

    // Save task
    const savedTask = await this.taskRepository.save(task);

    // Dispatch domain events
    await DomainEvents.dispatchEvents();

    return savedTask;
  }
}