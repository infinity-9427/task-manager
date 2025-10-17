import { DomainEvents } from '@/src/domain/shared/DomainEvent';
import { TaskCreatedEvent } from '@/src/domain/task/events/TaskCreatedEvent';
import { TaskUpdatedEvent } from '@/src/domain/task/events/TaskUpdatedEvent';
import { TaskDeletedEvent } from '@/src/domain/task/events/TaskDeletedEvent';
import { SocketManager } from '@/src/infrastructure/socket/SocketManager';

export class TaskEventHandlers {
  constructor(private socketManager: SocketManager) {
    this.registerHandlers();
  }

  private registerHandlers(): void {
    DomainEvents.registerHandler('TaskCreated', this.handleTaskCreated.bind(this));
    DomainEvents.registerHandler('TaskUpdated', this.handleTaskUpdated.bind(this));
    DomainEvents.registerHandler('TaskDeleted', this.handleTaskDeleted.bind(this));
  }

  private async handleTaskCreated(event: TaskCreatedEvent): Promise<void> {
    console.log(`[Domain Event] Task created: ${event.taskId} - ${event.title}`);
    
    this.socketManager.emitTaskCreated({
      id: event.taskId,
      title: event.title,
      assigneeId: event.assigneeId,
      createdById: event.createdById,
      occurredOn: event.occurredOn
    });
  }

  private async handleTaskUpdated(event: TaskUpdatedEvent): Promise<void> {
    console.log(`[Domain Event] Task updated: ${event.taskId}`, event.changes);
    
    this.socketManager.emitTaskUpdated({
      id: event.taskId,
      update: {
        field: event.changes.field,
        newValue: event.changes.newValue
      }
    });
  }

  private async handleTaskDeleted(event: TaskDeletedEvent): Promise<void> {
    console.log(`[Domain Event] Task deleted: ${event.taskId}`);
    
    this.socketManager.emitTaskDeleted(event.taskId);
  }
}