import { ValueObject } from '../ValueObject';

interface TaskTitleProps {
  value: string;
}

export class TaskTitle extends ValueObject<TaskTitleProps> {
  public static readonly MIN_LENGTH = 1;
  public static readonly MAX_LENGTH = 255;

  get value(): string {
    return this.props.value;
  }

  private constructor(props: TaskTitleProps) {
    super(props);
  }

  public static create(title: string): TaskTitle {
    if (!this.isValidTitle(title)) {
      throw new Error(`Task title must be between ${this.MIN_LENGTH} and ${this.MAX_LENGTH} characters`);
    }
    return new TaskTitle({ value: title.trim() });
  }

  private static isValidTitle(title: string): boolean {
    if (!title || typeof title !== 'string') {
      return false;
    }
    const trimmed = title.trim();
    return trimmed.length >= this.MIN_LENGTH && trimmed.length <= this.MAX_LENGTH;
  }
}