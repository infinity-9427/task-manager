import { Repository } from 'typeorm';
import { getActiveDataSource } from '@/src/shared/utils/database';
import { Task } from '@/src/domain/task/entities/Task';
import { ITaskRepository } from '@/src/domain/task/repositories/ITaskRepository';
import { TaskQueryParams, PaginatedResponse, PaginationMeta } from '@/src/shared/types/interfaces';
import { TaskStatus, TaskPriority } from '@/src/shared/types/enums';

export class TaskRepository implements ITaskRepository {
  private repository: Repository<Task>;

  constructor() {
    this.repository = getActiveDataSource().getRepository(Task);
  }

  async findById(id: number): Promise<Task | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ['subtasks', 'assignee', 'parent']
    });
  }

  async findAll(queryParams: TaskQueryParams): Promise<PaginatedResponse<Task>> {
    const { 
      include, 
      status, 
      assignee, 
      priority,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      page = 1, 
      limit = 10 
    } = queryParams;
    
    // Ensure valid pagination values
    const validPage = Math.max(1, page);
    const validLimit = Math.min(100, Math.max(1, limit)); // Max 100 items per page
    
    const query = this.repository.createQueryBuilder('task')
      .leftJoinAndSelect('task.assignee', 'assignee');

    if (include === 'subtasks') {
      query.leftJoinAndSelect('task.subtasks', 'subtasks')
           .leftJoinAndSelect('subtasks.assignee', 'subtaskAssignee');
    }

    // Only return parent tasks (not subtasks)
    query.andWhere('task.parentId IS NULL');

    // Filters
    if (status) {
      query.andWhere('task.status = :status', { status });
    }

    if (assignee) {
      query.andWhere('assignee.id = :assigneeId', { assigneeId: parseInt(assignee) });
    }

    if (priority) {
      query.andWhere('task.priority = :priority', { priority });
    }

    if (search) {
      query.andWhere(
        '(LOWER(task.title) LIKE LOWER(:search) OR LOWER(task.description) LIKE LOWER(:search))',
        { search: `%${search}%` }
      );
    }

    // Sorting
    const validSortBy = ['createdAt', 'updatedAt', 'title', 'priority'].includes(sortBy) ? sortBy : 'createdAt';
    const validSortOrder = sortOrder === 'ASC' ? 'ASC' : 'DESC';
    
    if (validSortBy === 'priority') {
      // Custom priority ordering: URGENT > HIGH > MEDIUM > LOW
      const priorityOrder = sortOrder === 'ASC' 
        ? 'CASE task.priority WHEN \'LOW\' THEN 1 WHEN \'MEDIUM\' THEN 2 WHEN \'HIGH\' THEN 3 WHEN \'URGENT\' THEN 4 END'
        : 'CASE task.priority WHEN \'URGENT\' THEN 1 WHEN \'HIGH\' THEN 2 WHEN \'MEDIUM\' THEN 3 WHEN \'LOW\' THEN 4 END';
      query.orderBy(priorityOrder);
    } else {
      query.orderBy(`task.${validSortBy}`, validSortOrder);
    }

    // Add secondary sort by createdAt for consistent pagination
    if (validSortBy !== 'createdAt') {
      query.addOrderBy('task.createdAt', 'DESC');
    }

    // Pagination
    query
      .skip((validPage - 1) * validLimit)
      .take(validLimit);

    const [tasks, total] = await query.getManyAndCount();
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(total / validLimit);
    const hasNextPage = validPage < totalPages;
    const hasPrevPage = validPage > 1;

    const pagination: PaginationMeta = {
      page: validPage,
      limit: validLimit,
      total,
      totalPages,
      hasNextPage,
      hasPrevPage
    };

    return {
      data: tasks,
      pagination
    };
  }

  async save(task: Task): Promise<Task> {
    return await this.repository.save(task);
  }

  async delete(task: Task): Promise<void> {
    await this.repository.remove(task);
  }

  async findByParentId(parentId: number): Promise<Task[]> {
    return await this.repository.find({
      where: { parentId },
      relations: ['assignee']
    });
  }

  async findIncompleteSubtasks(parentId: number): Promise<Task[]> {
    return await this.repository.find({
      where: [
        { parentId, status: TaskStatus.TO_DO },
        { parentId, status: TaskStatus.IN_PROGRESS }
      ]
    });
  }
}