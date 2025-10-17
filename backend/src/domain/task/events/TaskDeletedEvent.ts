import { DomainEvent } from '@/src/domain/shared/DomainEvent';

export class TaskDeletedEvent implements DomainEvent {
  public readonly eventName = 'TaskDeleted';
  public readonly eventVersion = 1;
  public readonly occurredOn: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly taskId: number
  ) {
    this.occurredOn = new Date();
  }
}