import { Response } from 'express';
import { AuthenticatedRequest, CreateTaskDto, UpdateTaskDto, TaskQueryParams } from '@/src/shared/types/interfaces';
import { validate } from 'class-validator';
import { Task } from '@/src/domain/task/entities/Task';
import { CreateTaskUseCase } from '@/src/application/use-cases/task/CreateTaskUseCase';
import { UpdateTaskUseCase } from '@/src/application/use-cases/task/UpdateTaskUseCase';
import { DeleteTaskUseCase } from '@/src/application/use-cases/task/DeleteTaskUseCase';
import { GetTasksUseCase, GetTaskByIdUseCase } from '@/src/application/use-cases/task/GetTasksUseCase';
import { TaskRepository } from '@/src/infrastructure/repositories/TaskRepository';
import { UserRepository } from '@/src/infrastructure/repositories/UserRepository';

export class TaskController {
  private createTaskUseCase: CreateTaskUseCase;
  private updateTaskUseCase: UpdateTaskUseCase;
  private deleteTaskUseCase: DeleteTaskUseCase;
  private getTasksUseCase: GetTasksUseCase;
  private getTaskByIdUseCase: GetTaskByIdUseCase;
  
  constructor() {
    const taskRepository = new TaskRepository();
    const userRepository = new UserRepository();
    
    this.createTaskUseCase = new CreateTaskUseCase(taskRepository, userRepository);
    this.updateTaskUseCase = new UpdateTaskUseCase(taskRepository, userRepository);
    this.deleteTaskUseCase = new DeleteTaskUseCase(taskRepository);
    this.getTasksUseCase = new GetTasksUseCase(taskRepository);
    this.getTaskByIdUseCase = new GetTaskByIdUseCase(taskRepository);
  }

  createTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const createTaskDto: CreateTaskDto = req.body;
      const userId = req.user!.id;

      // Validate required fields
      if (!createTaskDto.title || createTaskDto.title.trim() === '') {
        res.status(400).json({ error: 'Title is required and cannot be empty' });
        return;
      }

      const task = new Task(0);
      Object.assign(task, createTaskDto);

      const errors = await validate(task);
      if (errors.length > 0) {
        res.status(400).json({ 
          error: 'Validation failed',
          errors: errors.map(err => err.constraints) 
        });
        return;
      }

      const command = {
        title: createTaskDto.title.trim(),
        description: createTaskDto.description?.trim(),
        priority: createTaskDto.priority as any,
        parentId: createTaskDto.parentId,
        assigneeId: createTaskDto.assigneeId,
        createdById: userId,
        dueDate: createTaskDto.dueDate
      };

      const newTask = await this.createTaskUseCase.execute(command);
      
      res.status(201).json({ task: newTask });
    } catch (error) {
      console.error('Error creating task:', error);
      
      if (error.message.includes('Parent task not found')) {
        res.status(400).json({ error: 'Parent task not found' });
      } else if (error.message.includes('Assignee not found')) {
        res.status(400).json({ error: 'Assignee not found' });
      } else if (error.message.includes('User not found')) {
        res.status(400).json({ error: 'User not found' });
      } else {
        res.status(500).json({ 
          error: 'Internal server error',
          message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
        });
      }
    }
  };

  updateTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updateTaskDto: UpdateTaskDto = req.body;
      const userId = req.user!.id;

      // Validate task ID
      const taskId = parseInt(id);
      if (isNaN(taskId) || taskId <= 0) {
        res.status(400).json({ error: 'Invalid task ID' });
        return;
      }

      // Validate that at least one field is being updated
      const hasUpdates = updateTaskDto.title !== undefined || 
                        updateTaskDto.description !== undefined ||
                        updateTaskDto.status !== undefined ||
                        updateTaskDto.priority !== undefined ||
                        updateTaskDto.assigneeId !== undefined ||
                        updateTaskDto.dueDate !== undefined;

      if (!hasUpdates) {
        res.status(400).json({ error: 'At least one field must be provided for update' });
        return;
      }

      const command = {
        taskId,
        title: updateTaskDto.title?.trim(),
        description: updateTaskDto.description?.trim(),
        status: updateTaskDto.status as any,
        priority: updateTaskDto.priority as any,
        assigneeId: updateTaskDto.assigneeId,
        dueDate: updateTaskDto.dueDate,
        userId
      };

      const updatedTask = await this.updateTaskUseCase.execute(command);
      
      res.json({ task: updatedTask });
    } catch (error) {
      console.error('Error updating task:', error);
      
      if (error.message === 'Task not found') {
        res.status(404).json({ error: 'Task not found' });
      } else if (error.message.includes('Cannot mark task as completed')) {
        res.status(400).json({ error: error.message });
      } else if (error.message.includes('Assignee user not found')) {
        res.status(400).json({ error: 'Assignee user not found' });
      } else if (error.message.includes('Unauthorized')) {
        res.status(403).json({ error: 'Unauthorized to update this task' });
      } else {
        res.status(500).json({ 
          error: 'Internal server error',
          message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
        });
      }
    }
  };

  deleteTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      // Validate task ID
      const taskId = parseInt(id);
      if (isNaN(taskId) || taskId <= 0) {
        res.status(400).json({ error: 'Invalid task ID' });
        return;
      }

      const command = {
        taskId,
        userId
      };

      await this.deleteTaskUseCase.execute(command);
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting task:', error);
      
      if (error.message === 'Task not found') {
        res.status(404).json({ error: 'Task not found' });
      } else if (error.message.includes('Unauthorized')) {
        res.status(403).json({ error: 'Unauthorized to delete this task' });
      } else if (error.message.includes('foreign key constraint')) {
        res.status(400).json({ error: 'Cannot delete task with dependent subtasks' });
      } else {
        res.status(500).json({ 
          error: 'Internal server error',
          message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
        });
      }
    }
  };

  getTaskById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      // Validate task ID
      const taskId = parseInt(id);
      if (isNaN(taskId) || taskId <= 0) {
        res.status(400).json({ error: 'Invalid task ID' });
        return;
      }

      const task = await this.getTaskByIdUseCase.execute(taskId);
      
      if (!task) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }

      res.json({ task, children: task.subtasks || [] });
    } catch (error) {
      console.error('Error fetching task by ID:', error);
      
      if (error.message === 'Task not found') {
        res.status(404).json({ error: 'Task not found' });
      } else if (error.message.includes('Unauthorized')) {
        res.status(403).json({ error: 'Unauthorized to access this task' });
      } else {
        res.status(500).json({ 
          error: 'Internal server error',
          message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
        });
      }
    }
  };

  getTasks = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Validate pagination parameters
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      if (page < 1) {
        res.status(400).json({ error: 'Page number must be greater than 0' });
        return;
      }

      if (limit < 1 || limit > 100) {
        res.status(400).json({ error: 'Limit must be between 1 and 100' });
        return;
      }

      // Validate assignee parameter if provided
      let assigneeId: number | undefined;
      if (req.query.assignee) {
        assigneeId = parseInt(req.query.assignee as string);
        if (isNaN(assigneeId)) {
          res.status(400).json({ error: 'Invalid assignee ID' });
          return;
        }
      }

      const queryParams: TaskQueryParams = {
        include: req.query.include as string,
        status: req.query.status as string,
        assignee: assigneeId?.toString(),
        priority: req.query.priority as string,
        search: req.query.search ? (req.query.search as string).trim() : undefined,
        sortBy: req.query.sortBy as any,
        sortOrder: req.query.sortOrder as any,
        page,
        limit
      };

      const result = await this.getTasksUseCase.execute(queryParams);
      
      const formattedTasks = result.data.map(task => ({
        ...task,
        children: task.subtasks || []
      }));

      res.json({
        tasks: formattedTasks,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      
      if (error.message.includes('Invalid status')) {
        res.status(400).json({ error: 'Invalid status value' });
      } else if (error.message.includes('Invalid priority')) {
        res.status(400).json({ error: 'Invalid priority value' });
      } else if (error.message.includes('Invalid sort')) {
        res.status(400).json({ error: 'Invalid sort parameters' });
      } else {
        res.status(500).json({ 
          error: 'Internal server error',
          message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
        });
      }
    }
  };
}