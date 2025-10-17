import { getActiveDataSource } from '@/src/shared/utils/database';
import { Task } from '@/src/domain/task/entities/Task';
import { User } from '@/src/domain/user/entities/User';
import { TaskStatus, TaskPriority } from '@/src/shared/types/enums';
import { CreateTaskDto, UpdateTaskDto, TaskQueryParams } from '@/src/shared/types/interfaces';
import { Repository } from 'typeorm';

export class TaskService {
  private taskRepository: Repository<Task> | null = null;
  private userRepository: Repository<User> | null = null;

  private getTaskRepository(): Repository<Task> {
    if (!this.taskRepository) {
      this.taskRepository = getActiveDataSource().getRepository(Task);
    }
    return this.taskRepository;
  }

  private getUserRepository(): Repository<User> {
    if (!this.userRepository) {
      this.userRepository = getActiveDataSource().getRepository(User);
    }
    return this.userRepository;
  }

  async createTask(createTaskDto: CreateTaskDto, createdById: number): Promise<Task> {
    const { title, description, status, priority, parentId, assigneeId } = createTaskDto;

    const userRepo = this.getUserRepository();
    const taskRepo = this.getTaskRepository();

    let assignee: User;
    if (assigneeId) {
      assignee = await userRepo.findOne({ where: { id: assigneeId } });
      if (!assignee) {
        throw new Error('Assignee user not found');
      }
    } else {
      assignee = await userRepo.findOne({ where: { id: createdById } });
    }

    if (parentId) {
      const parentTask = await taskRepo.findOne({ where: { id: parentId } });
      if (!parentTask) {
        throw new Error('Parent task not found');
      }
    }

    const task = taskRepo.create({
      title,
      description,
      status: status as TaskStatus || TaskStatus.TO_DO,
      priority: priority as TaskPriority || TaskPriority.MEDIUM,
      parentId,
      assigneeId: assignee.id,
      createdById
    });

    return await taskRepo.save(task);
  }

  async updateTask(id: number, updateTaskDto: UpdateTaskDto, userId: number): Promise<Task> {
    const taskRepo = this.getTaskRepository();
    const userRepo = this.getUserRepository();

    const task = await taskRepo.findOne({
      where: { id },
      relations: ['subtasks', 'assignee']
    });

    if (!task) {
      throw new Error('Task not found');
    }

    if (updateTaskDto.status === TaskStatus.COMPLETED) {
      const hasIncompleteSubtasks = task.subtasks?.some(
        subtask => subtask.status !== TaskStatus.COMPLETED
      );

      if (hasIncompleteSubtasks) {
        throw new Error('Cannot mark task as completed while subtasks are incomplete');
      }
    }

    if (updateTaskDto.assigneeId) {
      const assignee = await userRepo.findOne({ where: { id: updateTaskDto.assigneeId } });
      if (!assignee) {
        throw new Error('Assignee user not found');
      }
    }

    Object.assign(task, updateTaskDto);
    return await taskRepo.save(task);
  }

  async deleteTask(id: number): Promise<void> {
    const taskRepo = this.getTaskRepository();

    const task = await taskRepo.findOne({
      where: { id },
      relations: ['subtasks']
    });

    if (!task) {
      throw new Error('Task not found');
    }

    await taskRepo.remove(task);
  }

  async getTaskById(id: number): Promise<Task | null> {
    const taskRepo = this.getTaskRepository();
    return await taskRepo.findOne({
      where: { id },
      relations: ['subtasks', 'assignee', 'parent']
    });
  }

  async getTasks(queryParams: TaskQueryParams): Promise<{ tasks: Task[]; total: number }> {
    const { include, status, assignee, page = 1, limit = 10 } = queryParams;
    const taskRepo = this.getTaskRepository();
    
    const query = taskRepo.createQueryBuilder('task')
      .leftJoinAndSelect('task.assignee', 'assignee');

    if (include === 'subtasks') {
      query.leftJoinAndSelect('task.subtasks', 'subtasks');
    }

    if (status) {
      query.andWhere('task.status = :status', { status });
    }

    if (assignee) {
      query.andWhere('assignee.id = :assigneeId', { assigneeId: parseInt(assignee) });
    }

    query.andWhere('task.parentId IS NULL');

    query
      .orderBy('task.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [tasks, total] = await query.getManyAndCount();

    return { tasks, total };
  }
}