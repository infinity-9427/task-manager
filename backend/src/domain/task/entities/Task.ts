import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { IsNotEmpty, IsEnum } from 'class-validator';
import { TaskStatus, TaskPriority } from '@/src/shared/types/enums';
import { User } from '@/src/domain/user/entities/User';
import { AggregateRoot } from '@/src/domain/shared/AggregateRoot';
import { TaskTitle } from '@/src/domain/shared/valueObjects/TaskTitle';
import { TaskCreatedEvent } from '../events/TaskCreatedEvent';
import { TaskUpdatedEvent } from '../events/TaskUpdatedEvent';
import { TaskDeletedEvent } from '../events/TaskDeletedEvent';

@Entity('tasks')
export class Task extends AggregateRoot<number> {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  @IsNotEmpty()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.TO_DO
  })
  @IsEnum(TaskStatus)
  status: TaskStatus;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM
  })
  @IsEnum(TaskPriority)
  priority: TaskPriority;

  @Column({ type: 'int', nullable: true })
  parentId?: number;

  @ManyToOne(() => Task, task => task.subtasks, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentId' })
  parent?: Task;

  @OneToMany(() => Task, task => task.parent)
  subtasks: Task[];

  @Column({ type: 'int', nullable: true })
  assigneeId?: number;

  @ManyToOne(() => User, user => user.tasks, { eager: true, nullable: true })
  @JoinColumn({ name: 'assigneeId' })
  assignee?: User;

  @Column({ type: 'date', nullable: true })
  dueDate?: Date;

  @Column({ type: 'int' })
  createdById: number;

  @ManyToOne(() => User, user => user.createdTasks)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Domain Methods
  public static create(
    title: string,
    createdById: number,
    description?: string,
    priority?: TaskPriority,
    assigneeId?: number,
    parentId?: number,
    dueDate?: Date
  ): Task {
    const taskTitle = TaskTitle.create(title);
    
    const task = new Task(0); // Temporary ID, will be set by database
    task.title = taskTitle.value;
    task.description = description;
    task.status = TaskStatus.TO_DO;
    task.createdById = createdById;
    task.parentId = parentId;
    task.dueDate = dueDate;
    
    // Subtasks should not have assignee or priority
    if (parentId) {
      // This is a subtask - no assignee or priority
      task.assigneeId = undefined;
      task.priority = TaskPriority.MEDIUM; // Default for subtasks
    } else {
      // This is a parent task
      task.assigneeId = assigneeId;
      task.priority = priority || TaskPriority.MEDIUM;
    }

    task.addDomainEvent(new TaskCreatedEvent(
      task.id?.toString() || 'new',
      task.id,
      task.title,
      task.assigneeId,
      task.createdById
    ));

    return task;
  }

  public updateTitle(newTitle: string): void {
    const taskTitle = TaskTitle.create(newTitle);
    const oldTitle = this.title;
    this.title = taskTitle.value;

    this.addDomainEvent(new TaskUpdatedEvent(
      this.id.toString(),
      this.id,
      { field: 'title', oldValue: oldTitle, newValue: this.title }
    ));
  }

  public updateStatus(newStatus: TaskStatus, subtasks?: Task[]): void {
    if (newStatus === TaskStatus.COMPLETED && this.hasIncompleteSubtasks(subtasks)) {
      const incompleteSubtaskIds = this.getIncompleteSubtaskIds(subtasks);
      throw new Error(`Cannot mark task as completed while subtasks remain incomplete. Complete the following tasks first: [${incompleteSubtaskIds.join(', ')}]`);
    }

    const oldStatus = this.status;
    this.status = newStatus;

    this.addDomainEvent(new TaskUpdatedEvent(
      this.id.toString(),
      this.id,
      { field: 'status', oldValue: oldStatus, newValue: this.status }
    ));
  }

  public updatePriority(newPriority: TaskPriority): void {
    if (this.isSubtask()) {
      throw new Error('Cannot set priority on subtasks. Only parent tasks can have priority.');
    }
    
    const oldPriority = this.priority;
    this.priority = newPriority;

    this.addDomainEvent(new TaskUpdatedEvent(
      this.id.toString(),
      this.id,
      { field: 'priority', oldValue: oldPriority, newValue: this.priority }
    ));
  }

  public assignTo(assigneeId: number): void {
    if (this.isSubtask()) {
      throw new Error('Cannot assign subtasks to users. Only parent tasks can be assigned.');
    }
    
    const oldAssigneeId = this.assigneeId;
    this.assigneeId = assigneeId;

    this.addDomainEvent(new TaskUpdatedEvent(
      this.id.toString(),
      this.id,
      { field: 'assigneeId', oldValue: oldAssigneeId, newValue: this.assigneeId }
    ));
  }

  public markForDeletion(): void {
    this.addDomainEvent(new TaskDeletedEvent(
      this.id.toString(),
      this.id
    ));
  }

  public isCompleted(): boolean {
    return this.status === TaskStatus.COMPLETED;
  }

  public isParentTask(): boolean {
    return this.parentId === null || this.parentId === undefined;
  }

  public isSubtask(): boolean {
    return !this.isParentTask();
  }

  private hasIncompleteSubtasks(subtasks?: Task[]): boolean {
    if (!subtasks || subtasks.length === 0) {
      return false;
    }
    return subtasks.some(subtask => !subtask.isCompleted());
  }

  private getIncompleteSubtaskIds(subtasks?: Task[]): number[] {
    if (!subtasks || subtasks.length === 0) {
      return [];
    }
    return subtasks
      .filter(subtask => !subtask.isCompleted())
      .map(subtask => subtask.id);
  }
}