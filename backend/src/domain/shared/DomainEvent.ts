export interface DomainEvent {
  eventName: string;
  aggregateId: string;
  eventVersion: number;
  occurredOn: Date;
}

export abstract class DomainEvents {
  private static events: DomainEvent[] = [];
  private static handlers: { [eventName: string]: Function[] } = {};

  public static registerHandler(eventName: string, handler: Function): void {
    if (!this.handlers[eventName]) {
      this.handlers[eventName] = [];
    }
    this.handlers[eventName].push(handler);
  }

  public static raise(event: DomainEvent): void {
    this.events.push(event);
  }

  public static async dispatchEvents(): Promise<void> {
    for (const event of this.events) {
      const eventHandlers = this.handlers[event.eventName] || [];
      for (const handler of eventHandlers) {
        await handler(event);
      }
    }
    this.clearEvents();
  }

  public static clearEvents(): void {
    this.events = [];
  }
}