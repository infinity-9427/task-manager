import { DomainEvent } from '@/src/domain/shared/DomainEvent';

export class TaskCreatedEvent implements DomainEvent {
  public readonly eventName = 'TaskCreated';
  public readonly eventVersion = 1;
  public readonly occurredOn: Date;

  constructor(
    public readonly aggregateId: string,
    public readonly taskId: number,
    public readonly title: string,
    public readonly assigneeId: number,
    public readonly createdById: number
  ) {
    this.occurredOn = new Date();
  }
}