import { DomainEvent } from '@/src/domain/shared/DomainEvent';

export class TaskUpdatedEvent implements DomainEvent {
  public readonly eventName = 'TaskUpdated';
  public readonly eventVersion = 1;
  public readonly occurredOn: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly taskId: number,
    public readonly changes: Record<string, any>
  ) {
    this.occurredOn = new Date();
  }
}